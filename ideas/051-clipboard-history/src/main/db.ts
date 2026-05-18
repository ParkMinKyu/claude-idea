import Database from "better-sqlite3";
import { SnippetEntry } from "./search";

export class ClipDB {
  db: Database.Database;
  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        capturedAt INTEGER NOT NULL,
        hash TEXT NOT NULL,
        pinned INTEGER DEFAULT 0,
        label TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_capturedAt ON items(capturedAt DESC);
    `);
  }
  insert(entry: SnippetEntry): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO items (id,type,content,capturedAt,hash,pinned,label) VALUES (?,?,?,?,?,?,?)"
      )
      .run(
        entry.id,
        entry.type,
        entry.content,
        entry.capturedAt,
        entry.hash,
        entry.pinned ? 1 : 0,
        entry.label ?? null
      );
  }
  recent(limit = 200): SnippetEntry[] {
    return this.db
      .prepare(
        "SELECT id,type,content,capturedAt,hash,pinned,label FROM items ORDER BY capturedAt DESC LIMIT ?"
      )
      .all(limit) as SnippetEntry[];
  }
  pin(id: string, pinned: boolean): void {
    this.db.prepare("UPDATE items SET pinned=? WHERE id=?").run(pinned ? 1 : 0, id);
  }
  remove(id: string): void {
    this.db.prepare("DELETE FROM items WHERE id=?").run(id);
  }
}
