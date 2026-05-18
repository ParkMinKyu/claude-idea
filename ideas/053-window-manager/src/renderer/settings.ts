declare global {
  interface Window {
    wm: { apply(layout: string): Promise<void> };
  }
}
export {};
