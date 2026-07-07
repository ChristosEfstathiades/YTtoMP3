import { existsSync, mkdirSync } from "fs";
import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";
import type { HistoryRow } from "../shared/types";

let db: Database.Database;

export function initDatabase(): void {
    const userDataPath = app.getPath("userData");
    if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true });
    }

    db = new Database(path.join(userDataPath, "downloads.db"));
    db.exec(`CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        created_at TEXT
    )`);

    // Databases created before created_at existed need the column added.
    const columns = db
        .prepare("PRAGMA table_info(downloads)")
        .all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "created_at")) {
        db.exec("ALTER TABLE downloads ADD COLUMN created_at TEXT");
    }
}

export function getHistory(): HistoryRow[] {
    return db
        .prepare("SELECT * FROM downloads ORDER BY id DESC")
        .all() as HistoryRow[];
}

export function deleteHistory(id: number): void {
    db.prepare("DELETE FROM downloads WHERE id = ?").run(id);
}

export function historyHasUrl(url: string): boolean {
    return !!db.prepare("SELECT id FROM downloads WHERE url = ?").get(url);
}

export function recordDownload(
    title: string,
    artist: string,
    url: string,
): void {
    db.prepare(
        `INSERT OR IGNORE INTO downloads (title, artist, url, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
    ).run(title, artist, url);
}
