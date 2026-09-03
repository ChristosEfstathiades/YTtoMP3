import { spawn } from "child_process";
import {
    copyFileSync,
    createWriteStream,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
    unlinkSync,
} from "fs";
import https from "https";
import os from "os";
import path from "path";
import NodeID3 from "node-id3";
import { timeToSeconds } from "../shared/time";
import type { DownloadStage, QueueItem } from "../shared/types";
import { refreshYtDlp, resolveBinary } from "./binaries";

export interface TrackMetadata {
    title?: string;
    artist?: string;
    uploader?: string;
    thumbnail?: string;
    thumbnails?: Array<{ url?: string }>;
    duration?: number;
}

export interface DownloadHooks {
    onStage: (
        stage: DownloadStage,
        resolved?: { title: string; artist: string },
    ) => void;
    onProgress: (update: {
        percent: number | null;
        elapsedSeconds: number;
        totalSeconds: number | null;
    }) => void;
}

// ffmpeg echoes the whole media URL when a request fails, which buries the
// one useful line under a wall of query string.
function withoutUrls(text: string): string {
    return text.replace(/https?:\/\/\S+/g, "<media url>");
}

function lastLines(text: string, count: number): string {
    return text.trim().split(/\r?\n/).slice(-count).join("\n");
}

async function runYtDlp(args: string[]): Promise<string> {
    await refreshYtDlp();
    return new Promise((resolve, reject) => {
        // --no-update only silences the "your build is old" banner; the
        // updating itself is left to refreshYtDlp.
        const proc = spawn(resolveBinary("yt-dlp"), ["--no-update", ...args], {
            windowsHide: true,
        });
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
        });
        proc.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
        });
        proc.on("close", (code: number) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(
                    new Error(
                        lastLines(stderr, 3) ||
                            `yt-dlp exited with code ${code}`,
                    ),
                );
            }
        });
        proc.on("error", (err) =>
            reject(new Error(`Could not run yt-dlp: ${err.message}`)),
        );
    });
}

// --dump-json simulates only; --print-json (used previously) downloaded the
// full video into the working directory just to read its metadata.
export async function getMetadata(url: string): Promise<TrackMetadata> {
    const stdout = await runYtDlp(["--dump-json", "--no-playlist", url]);
    try {
        return JSON.parse(stdout.trim().split(/\r?\n/)[0]);
    } catch (err) {
        throw new Error("Could not read the track's metadata.");
    }
}

export async function getDirectAudioUrl(url: string): Promise<string> {
    const stdout = await runYtDlp([
        "-f",
        "bestaudio/best",
        "--no-playlist",
        "-g",
        url,
    ]);
    const directUrl = stdout.trim().split(/\r?\n/)[0];
    if (!directUrl) {
        throw new Error("yt-dlp returned an empty media URL.");
    }
    return directUrl;
}

function encodeToMp3(options: {
    inputUrl: string;
    output: string;
    startTime?: string;
    endTime?: string;
    totalSeconds: number | null;
    onProgress: DownloadHooks["onProgress"];
}): Promise<void> {
    const { inputUrl, output, startTime, endTime, totalSeconds, onProgress } =
        options;

    return new Promise((resolve, reject) => {
        const args: string[] = ["-y"];

        // Fast input seek: -ss before -i skips straight to the start point.
        if (startTime) {
            args.push("-ss", startTime);
        }
        args.push("-i", inputUrl);
        if (endTime) {
            if (startTime) {
                // Output timestamps restart at 0 after the input seek, so the
                // stop point is a duration, not an absolute time.
                const duration =
                    timeToSeconds(endTime) - timeToSeconds(startTime);
                args.push("-t", String(duration));
            } else {
                args.push("-to", endTime);
            }
        }
        args.push("-vn", "-acodec", "libmp3lame", "-q:a", "2", output);

        const proc = spawn(resolveBinary("ffmpeg"), args, {
            windowsHide: true,
        });

        let stderr = "";
        let lastPercent = -1;
        let lastElapsed = -1;

        proc.stderr.on("data", (chunk: Buffer) => {
            const text = chunk.toString();
            stderr += text;

            const match = text.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
            if (!match) return;

            const elapsedSeconds =
                parseInt(match[1], 10) * 3600 +
                parseInt(match[2], 10) * 60 +
                parseFloat(match[3]);
            const percent =
                totalSeconds && totalSeconds > 0
                    ? Math.min(
                          Math.round((elapsedSeconds / totalSeconds) * 100),
                          100,
                      )
                    : null;

            // ffmpeg prints stats a few times a second; only forward changes.
            const wholeElapsed = Math.floor(elapsedSeconds);
            if (percent === lastPercent && wholeElapsed === lastElapsed) {
                return;
            }
            lastPercent = percent === null ? -1 : percent;
            lastElapsed = wholeElapsed;

            onProgress({ percent, elapsedSeconds, totalSeconds });
        });

        proc.on("close", (code: number) => {
            if (code === 0) {
                resolve();
                return;
            }
            // A 403 here means the media URL yt-dlp handed over was refused,
            // which in practice means yt-dlp itself needs to be newer.
            const hint = stderr.includes("403 Forbidden")
                ? " YouTube refused the media request; restart the app so yt-dlp can update itself."
                : "";
            const detail = lastLines(withoutUrls(stderr), 3) || `code ${code}`;
            reject(new Error(`ffmpeg failed: ${detail}${hint}`));
        });

        proc.on("error", (err) =>
            reject(new Error(`Could not run ffmpeg: ${err.message}`)),
        );
    });
}

function fetchToFile(
    url: string,
    output: string,
    redirectsLeft = 3,
): Promise<void> {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                const status = res.statusCode || 0;
                const location = res.headers.location;
                if (
                    status >= 300 &&
                    status < 400 &&
                    location &&
                    redirectsLeft > 0
                ) {
                    res.resume();
                    fetchToFile(location, output, redirectsLeft - 1).then(
                        resolve,
                        reject,
                    );
                    return;
                }
                if (status !== 200) {
                    res.resume();
                    reject(new Error(`Request failed with status ${status}`));
                    return;
                }
                const file = createWriteStream(output);
                res.pipe(file);
                file.on("finish", () => {
                    file.close();
                    resolve();
                });
                file.on("error", reject);
            })
            .on("error", reject);
    });
}

// ID3 cover art renders most reliably as JPEG, so prefer one when offered.
function pickThumbnailUrl(metadata: TrackMetadata): string | undefined {
    const thumbnails = Array.isArray(metadata.thumbnails)
        ? metadata.thumbnails
        : [];
    for (let i = thumbnails.length - 1; i >= 0; i--) {
        const candidate = thumbnails[i] && thumbnails[i].url;
        if (candidate && /\.jpe?g($|\?)/i.test(candidate)) {
            return candidate;
        }
    }
    return metadata.thumbnail;
}

function guessImageMime(url: string): string {
    if (/\.png($|\?)/i.test(url)) return "image/png";
    if (/\.webp($|\?)/i.test(url)) return "image/webp";
    return "image/jpeg";
}

function sanitizeFileName(name: string): string {
    const cleaned = name
        .split("")
        .filter((char) => char.charCodeAt(0) >= 32)
        .join("")
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned || "download.mp3";
}

function uniquePath(directory: string, fileName: string): string {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    let candidate = path.join(directory, fileName);
    for (let i = 2; existsSync(candidate); i++) {
        candidate = path.join(directory, `${base} (${i})${ext}`);
    }
    return candidate;
}

// renameSync fails with EXDEV when the temp dir and the download folder sit
// on different drives (common on Windows); fall back to copy + delete.
function moveFile(source: string, destination: string): void {
    try {
        renameSync(source, destination);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "EXDEV") {
            copyFileSync(source, destination);
            unlinkSync(source);
        } else {
            throw err;
        }
    }
}

export async function downloadItem(
    item: QueueItem,
    hooks: DownloadHooks,
): Promise<{ title: string; artist: string }> {
    const directory = (item.directory || "").trim();
    if (!directory) {
        throw new Error("A download folder is required.");
    }
    if (typeof item.url !== "string" || !item.url.trim()) {
        throw new Error("A URL is required.");
    }
    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }

    hooks.onStage("metadata");
    const metadata = await getMetadata(item.url);
    const title = item.title || metadata.title || "Unknown Title";
    const artist =
        item.artist || metadata.artist || metadata.uploader || "Unknown Artist";

    // How much audio ffmpeg will produce, so its time= lines can be turned
    // into a percentage. Null (unknown) yields an indeterminate bar.
    const startSeconds = item.startTime ? timeToSeconds(item.startTime) : 0;
    let totalSeconds: number | null = null;
    if (item.endTime) {
        totalSeconds = timeToSeconds(item.endTime) - startSeconds;
    } else if (typeof metadata.duration === "number" && metadata.duration > 0) {
        totalSeconds = metadata.duration - startSeconds;
    }
    if (totalSeconds !== null && totalSeconds <= 0) {
        totalSeconds = null;
    }

    const tempDir = mkdtempSync(path.join(os.tmpdir(), "saggysonic-"));
    try {
        hooks.onStage("downloading", { title, artist });
        const tempOutput = path.join(tempDir, "download.mp3");
        const directAudioUrl = await getDirectAudioUrl(item.url);
        await encodeToMp3({
            inputUrl: directAudioUrl,
            output: tempOutput,
            startTime: item.startTime,
            endTime: item.endTime,
            totalSeconds,
            onProgress: hooks.onProgress,
        });

        hooks.onStage("tagging", { title, artist });
        const tags: NodeID3.Tags = { title, artist, album: title };
        const thumbnailUrl = pickThumbnailUrl(metadata);
        if (thumbnailUrl) {
            // Missing cover art shouldn't fail the whole download.
            try {
                const thumbnailPath = path.join(tempDir, "cover");
                await fetchToFile(thumbnailUrl, thumbnailPath);
                tags.image = {
                    mime: guessImageMime(thumbnailUrl),
                    type: { id: 3, name: "front cover" },
                    description: "cover",
                    imageBuffer: readFileSync(thumbnailPath),
                };
            } catch (err) {
                console.warn("Skipping cover art:", err);
            }
        }
        NodeID3.write(tags, tempOutput);

        const fileName = sanitizeFileName(`${title} - ${artist}.mp3`);
        moveFile(tempOutput, uniquePath(directory, fileName));

        return { title, artist };
    } finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
}
