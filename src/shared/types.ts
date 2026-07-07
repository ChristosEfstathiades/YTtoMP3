export type DownloadStage = "metadata" | "downloading" | "tagging";

export interface QueueItem {
    url: string;
    title?: string;
    artist?: string;
    directory: string;
    startTime?: string;
    endTime?: string;
}

export interface ActiveDownload {
    url: string;
    /** Resolved from metadata once known; may start out empty. */
    title: string;
    artist: string;
    stage: DownloadStage;
}

export interface QueueState {
    queue: QueueItem[];
    current: ActiveDownload | null;
}

export interface ProgressUpdate {
    url: string;
    /** 0–100, or null when the total duration is unknown. */
    percent: number | null;
    elapsedSeconds: number;
    totalSeconds: number | null;
}

export interface DownloadOutcome {
    success: boolean;
    url: string;
    title: string;
    artist: string;
    error?: string;
}

export interface HistoryRow {
    id: number;
    title: string;
    artist: string;
    url: string;
    /** UTC "YYYY-MM-DD HH:MM:SS"; null on rows from before this column existed. */
    created_at: string | null;
}

export interface AddToQueueResult {
    success: boolean;
    message: string;
}

export interface BinaryStatus {
    ytDlp: boolean;
    ffmpeg: boolean;
}

/** The API exposed to the renderer by src/preload.ts as `window.electron`. */
export interface ElectronApi {
    addToQueue(item: QueueItem): Promise<AddToQueueResult>;
    removeFromQueue(url: string): Promise<boolean>;
    getQueueState(): Promise<QueueState>;
    getHistory(): Promise<HistoryRow[]>;
    deleteHistory(id: number): Promise<{ success: boolean }>;
    getClipboard(): Promise<string>;
    selectDownloadDirectory(): Promise<string | null>;
    openExternal(url: string): Promise<void>;
    getBinaryStatus(): Promise<BinaryStatus>;
    onQueueUpdated(callback: (state: QueueState) => void): () => void;
    onDownloadProgress(callback: (update: ProgressUpdate) => void): () => void;
    onDownloadFinished(callback: (outcome: DownloadOutcome) => void): () => void;
}
