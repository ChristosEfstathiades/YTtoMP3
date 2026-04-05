import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  downloadMp3: (url: string) => ipcRenderer.invoke('download-mp3', url),
});
