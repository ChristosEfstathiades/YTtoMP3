import { clipboard, dialog, ipcMain, shell } from "electron";
import { timeToSeconds } from "../shared/time";
import type { QueueItem } from "../shared/types";
import { getBinaryStatus } from "./binaries";
import { deleteHistory, getHistory } from "./db";
import { enqueue, getQueueState, removeFromQueue } from "./queue";

/** Returns an error message for the user, or null when the item is valid. */
function validateQueueItem(item: QueueItem): string | null {
    if (!item || typeof item.url !== "string" || !item.url.trim()) {
        return "Enter a link to download.";
    }
    if (!/^https?:\/\//i.test(item.url.trim())) {
        return "That doesn't look like a link. It should start with http:// or https://.";
    }
    if (typeof item.directory !== "string" || !item.directory.trim()) {
        return "Choose a folder to save to first.";
    }

    let startSeconds = 0;
    if (item.startTime) {
        try {
            startSeconds = timeToSeconds(item.startTime);
        } catch (err) {
            return "Start time should be HH:MM:SS, MM:SS, or plain seconds.";
        }
    }
    if (item.endTime) {
        let endSeconds: number;
        try {
            endSeconds = timeToSeconds(item.endTime);
        } catch (err) {
            return "End time should be HH:MM:SS, MM:SS, or plain seconds.";
        }
        if (endSeconds <= startSeconds) {
            return "End time must be after the start time.";
        }
    }
    return null;
}

function cleanOptional(value?: string): string | undefined {
    const trimmed = (value || "").trim();
    return trimmed || undefined;
}

export function registerIpcHandlers(): void {
    ipcMain.handle("add-to-queue", (_event, raw: QueueItem) => {
        const error = validateQueueItem(raw);
        if (error) {
            return { success: false, message: error };
        }
        return enqueue({
            url: raw.url.trim(),
            title: cleanOptional(raw.title),
            artist: cleanOptional(raw.artist),
            directory: raw.directory.trim(),
            startTime: cleanOptional(raw.startTime),
            endTime: cleanOptional(raw.endTime),
        });
    });

    ipcMain.handle("remove-from-queue", (_event, url: string) =>
        removeFromQueue(url),
    );

    ipcMain.handle("get-queue-state", () => getQueueState());

    ipcMain.handle("get-history", () => getHistory());

    ipcMain.handle("delete-history", (_event, id: number) => {
        deleteHistory(id);
        return { success: true };
    });

    ipcMain.handle("get-clipboard", () => clipboard.readText());

    ipcMain.handle("select-download-directory", async () => {
        const result = await dialog.showOpenDialog({
            properties: ["openDirectory"],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    ipcMain.handle("open-external", (_event, url: string) => {
        if (typeof url === "string" && /^https?:\/\//i.test(url)) {
            return shell.openExternal(url);
        }
    });

    ipcMain.handle("get-binary-status", () => getBinaryStatus());
}
