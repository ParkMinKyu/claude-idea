import { EventEmitter } from "node:events";

export interface ClipReader {
  readText(): string;
  readImage(): { isEmpty(): boolean; toDataURL(): string };
}

export interface ClipboardItem {
  type: "text" | "image";
  content: string;
  capturedAt: number;
  hash: string;
}

export function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

export class ClipboardWatcher extends EventEmitter {
  private last = "";
  private timer: NodeJS.Timeout | null = null;
  constructor(private clip: ClipReader, private intervalMs = 700) {
    super();
  }
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  poll(): ClipboardItem | null {
    const txt = this.clip.readText();
    if (txt && txt.length) {
      const h = hash(txt);
      if (h !== this.last) {
        this.last = h;
        const item: ClipboardItem = {
          type: "text",
          content: txt,
          capturedAt: Date.now(),
          hash: h,
        };
        this.emit("item", item);
        return item;
      }
      return null;
    }
    const img = this.clip.readImage();
    if (img && !img.isEmpty()) {
      const data = img.toDataURL();
      const h = hash(data);
      if (h !== this.last) {
        this.last = h;
        const item: ClipboardItem = {
          type: "image",
          content: data,
          capturedAt: Date.now(),
          hash: h,
        };
        this.emit("item", item);
        return item;
      }
    }
    return null;
  }
}

const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /\b\d{13,19}\b/, // long card-like number
  /sk-[a-zA-Z0-9]{20,}/, // openai-style secret
];

export function isLikelySecret(s: string): boolean {
  if (s.length >= 8 && s.length <= 32 && /^[A-Za-z0-9!@#$%^&*()_+=\-]+$/.test(s)) {
    // looks like password manager output
    return true;
  }
  return SECRET_PATTERNS.some((re) => re.test(s));
}
