import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  addToQueue: (data: { url: string; title?: string; artist?: string }) => ipcRenderer.invoke('add-to-queue', data),
  getHistory: () => ipcRenderer.invoke('get-history'),
  deleteHistory: (id: number) => ipcRenderer.invoke('delete-history', id),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  getQueue: () => ipcRenderer.invoke('get-queue'),
  getCurrentDownloading: () => ipcRenderer.invoke('get-current-downloading'),
});
