import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  downloadMp3: (data: { url: string; title?: string; artist?: string }) => ipcRenderer.invoke('download-mp3', data),
});
