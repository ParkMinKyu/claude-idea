import fs from "node:fs";
import path from "node:path";
import { FocusEntry } from "./stats";

export class Store {
  private file: string;
  constructor(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "pomodoro.json");
  }
  load(): FocusEntry[] {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8")) as FocusEntry[];
    } catch {
      return [];
    }
  }
  save(entries: FocusEntry[]): void {
    fs.writeFileSync(this.file, JSON.stringify(entries));
  }
  append(entry: FocusEntry): void {
    const cur = this.load();
    cur.push(entry);
    this.save(cur);
  }
}
