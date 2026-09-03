import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { app } from "electron";
import type { BinaryStatus } from "../shared/types";

type BinaryName = "yt-dlp" | "ffmpeg";

const platformDir =
    process.platform === "win32"
        ? "win"
        : process.platform === "darwin"
          ? "mac"
          : "linux";

function bundledBinDir(): string {
    // forge.config.ts ships `src/bin` as extraResource, so packaged builds
    // find it at <resources>/bin; dev builds use the repo copy directly.
    const base = app.isPackaged
        ? path.join(process.resourcesPath, "bin")
        : path.join(app.getAppPath(), "src", "bin");
    return path.join(base, platformDir);
}

/**
 * Absolute path to the bundled binary when it exists, otherwise the bare
 * name so the OS resolves it from PATH (the README's fallback for source
 * builds on platforms we don't bundle for).
 */
export function resolveBinary(name: BinaryName): string {
    const exe = process.platform === "win32" ? `${name}.exe` : name;
    const bundled = path.join(bundledBinDir(), exe);
    return existsSync(bundled) ? bundled : name;
}

let ytDlpUpdate: Promise<void> | null = null;

/**
 * yt-dlp goes stale quickly: YouTube reworks its player every few months, and
 * an out-of-date build falls back to a client whose media URLs reject the
 * open-ended range request ffmpeg makes, so downloads die with a 403. Let the
 * bundled copy update itself in place, once per app run.
 *
 * Packaged builds only: in development the binary is the checked-in copy, and
 * rewriting it would dirty the working tree.
 */
export function refreshYtDlp(): Promise<void> {
    if (ytDlpUpdate) {
        return ytDlpUpdate;
    }
    if (!app.isPackaged) {
        ytDlpUpdate = Promise.resolve();
        return ytDlpUpdate;
    }
    ytDlpUpdate = new Promise<void>((resolve) => {
        // A failed update (offline, read-only install folder) is not fatal;
        // the bundled build still gets its chance at the download. The cap
        // stops a slow mirror from stalling the queue indefinitely.
        const timer = setTimeout(resolve, 60000);
        const finish = () => {
            clearTimeout(timer);
            resolve();
        };
        const proc = spawn(resolveBinary("yt-dlp"), ["-U"], {
            windowsHide: true,
        });
        proc.on("close", finish);
        proc.on("error", finish);
    });
    return ytDlpUpdate;
}

function canRun(command: string, args: string[]): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { windowsHide: true });
        proc.on("close", (code: number) => resolve(code === 0));
        proc.on("error", () => resolve(false));
    });
}

export async function getBinaryStatus(): Promise<BinaryStatus> {
    const [ytDlp, ffmpeg] = await Promise.all([
        canRun(resolveBinary("yt-dlp"), ["--version"]),
        canRun(resolveBinary("ffmpeg"), ["-version"]),
    ]);
    return { ytDlp, ffmpeg };
}
