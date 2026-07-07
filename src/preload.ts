import { contextBridge, ipcRenderer } from "electron";
import type { ElectronApi, QueueItem } from "./shared/types";

function subscribe<T>(channel: string) {
    return (callback: (payload: T) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, payload: T) =>
            callback(payload);
        ipcRenderer.on(channel, listener);
        return () => {
            ipcRenderer.off(channel, listener);
        };
    };
}

const api: ElectronApi = {
    addToQueue: (item: QueueItem) => ipcRenderer.invoke("add-to-queue", item),
    removeFromQueue: (url: string) =>
        ipcRenderer.invoke("remove-from-queue", url),
    getQueueState: () => ipcRenderer.invoke("get-queue-state"),
    getHistory: () => ipcRenderer.invoke("get-history"),
    deleteHistory: (id: number) => ipcRenderer.invoke("delete-history", id),
    getClipboard: () => ipcRenderer.invoke("get-clipboard"),
    selectDownloadDirectory: () =>
        ipcRenderer.invoke("select-download-directory"),
    openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
    getBinaryStatus: () => ipcRenderer.invoke("get-binary-status"),
    onQueueUpdated: subscribe("queue-updated"),
    onDownloadProgress: subscribe("download-progress"),
    onDownloadFinished: subscribe("download-finished"),
};

contextBridge.exposeInMainWorld("electron", api);
