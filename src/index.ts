import { app, BrowserWindow } from "electron";
import { initDatabase } from "./main/db";
import { registerIpcHandlers } from "./main/ipc";
import { setBroadcast } from "./main/queue";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
    mainWindow = new BrowserWindow({
        width: 920,
        height: 760,
        minWidth: 560,
        minHeight: 520,
        backgroundColor: "#181310",
        autoHideMenuBar: true,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// The queue pushes its events (queue-updated, download-progress,
// download-finished) to whichever window is open.
setBroadcast((channel, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
});

registerIpcHandlers();

app.on("ready", () => {
    initDatabase();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
