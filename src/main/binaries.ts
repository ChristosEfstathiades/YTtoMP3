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
