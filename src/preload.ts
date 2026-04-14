import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    addToQueue: (data: {
        url: string;
        title?: string;
        artist?: string;
        directory: string;
        startTime?: string;
        endTime?: string;
    }) => ipcRenderer.invoke("add-to-queue", data),
    getHistory: () => ipcRenderer.invoke("get-history"),
    deleteHistory: (id: number) => ipcRenderer.invoke("delete-history", id),
    getClipboard: () => ipcRenderer.invoke("get-clipboard"),
    getQueue: () => ipcRenderer.invoke("get-queue"),
    getCurrentDownloading: () => ipcRenderer.invoke("get-current-downloading"),
    selectDownloadDirectory: () =>
        ipcRenderer.invoke("select-download-directory"),
    onDownloadProgress: (callback: (progress: number) => void) => {
        const subscription = (_event: any, progress: number) =>
            callback(progress);
        ipcRenderer.on("download-progress", subscription);
        return () => ipcRenderer.off("download-progress", subscription);
    },
});
