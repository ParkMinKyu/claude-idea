import { Rect } from "./layouts";

export interface WindowAdapter {
  getActiveWindowBounds(): Promise<Rect | null>;
  setActiveWindowBounds(r: Rect): Promise<void>;
  listDisplays(): Promise<Rect[]>;
}

/** Stub used in tests; real platforms inject their own implementation. */
export class StubAdapter implements WindowAdapter {
  active: Rect | null = { x: 0, y: 0, width: 800, height: 600 };
  displays: Rect[] = [{ x: 0, y: 0, width: 1920, height: 1080 }];
  async getActiveWindowBounds(): Promise<Rect | null> {
    return this.active;
  }
  async setActiveWindowBounds(r: Rect): Promise<void> {
    this.active = r;
  }
  async listDisplays(): Promise<Rect[]> {
    return this.displays;
  }
}
