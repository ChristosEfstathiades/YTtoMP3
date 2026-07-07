import type {
    ActiveDownload,
    AddToQueueResult,
    DownloadOutcome,
    ProgressUpdate,
    QueueItem,
    QueueState,
} from "../shared/types";
import { historyHasUrl, recordDownload } from "./db";
import { downloadItem } from "./downloader";

type Broadcast = (channel: string, payload: unknown) => void;

// Injected by src/index.ts so this module never touches the BrowserWindow.
let broadcast: Broadcast = () => undefined;

export function setBroadcast(fn: Broadcast): void {
    broadcast = fn;
}

const queue: QueueItem[] = [];
let current: ActiveDownload | null = null;
let processing = false;

export function getQueueState(): QueueState {
    return { queue: [...queue], current };
}

function emitQueueState(): void {
    broadcast("queue-updated", getQueueState());
}

export function enqueue(item: QueueItem): AddToQueueResult {
    const url = item.url.trim();
    if (current && current.url === url) {
        return { success: false, message: "That link is downloading right now." };
    }
    if (queue.some((queued) => queued.url === url)) {
        return { success: false, message: "That link is already in the queue." };
    }
    if (historyHasUrl(url)) {
        return {
            success: false,
            message:
                "Already downloaded. Remove it from the history to download it again.",
        };
    }

    queue.push({ ...item, url });
    emitQueueState();
    void processQueue();
    return { success: true, message: "Added to the queue." };
}

export function removeFromQueue(url: string): boolean {
    const index = queue.findIndex((queued) => queued.url === url);
    if (index === -1) {
        return false;
    }
    queue.splice(index, 1);
    emitQueueState();
    return true;
}

// Single worker: items download strictly one at a time.
async function processQueue(): Promise<void> {
    if (processing) {
        return;
    }
    processing = true;
    try {
        for (let item = queue.shift(); item; item = queue.shift()) {
            const queueItem = item;
            current = {
                url: queueItem.url,
                title: queueItem.title || "",
                artist: queueItem.artist || "",
                stage: "metadata",
            };
            emitQueueState();

            try {
                const result = await downloadItem(queueItem, {
                    onStage: (stage, resolved) => {
                        if (!current) return;
                        current = { ...current, ...(resolved || {}), stage };
                        emitQueueState();
                    },
                    onProgress: (update) => {
                        const payload: ProgressUpdate = {
                            url: queueItem.url,
                            percent: update.percent,
                            elapsedSeconds: update.elapsedSeconds,
                            totalSeconds: update.totalSeconds,
                        };
                        broadcast("download-progress", payload);
                    },
                });

                recordDownload(result.title, result.artist, queueItem.url);
                const outcome: DownloadOutcome = {
                    success: true,
                    url: queueItem.url,
                    title: result.title,
                    artist: result.artist,
                };
                broadcast("download-finished", outcome);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error("Download failed:", message);
                const outcome: DownloadOutcome = {
                    success: false,
                    url: queueItem.url,
                    title:
                        (current && current.title) ||
                        queueItem.title ||
                        queueItem.url,
                    artist: (current && current.artist) || queueItem.artist || "",
                    error: message,
                };
                broadcast("download-finished", outcome);
            }

            current = null;
            emitQueueState();
        }
    } finally {
        processing = false;
    }
}
