import type { ElectronApi } from "../shared/types";

declare global {
    interface Window {
        electron: ElectronApi;
    }
}

/** The typed IPC surface exposed by src/preload.ts. */
export const api: ElectronApi = window.electron;
