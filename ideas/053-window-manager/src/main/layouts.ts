export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutId =
  | "left-half"
  | "right-half"
  | "top-half"
  | "bottom-half"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "fullscreen"
  | "left-third"
  | "center-third"
  | "right-third"
  | "left-two-thirds"
  | "right-two-thirds";

const half = (display: Rect): Record<string, Rect> => ({
  "left-half": { x: display.x, y: display.y, width: display.width / 2, height: display.height },
  "right-half": {
    x: display.x + display.width / 2,
    y: display.y,
    width: display.width / 2,
    height: display.height,
  },
  "top-half": { x: display.x, y: display.y, width: display.width, height: display.height / 2 },
  "bottom-half": {
    x: display.x,
    y: display.y + display.height / 2,
    width: display.width,
    height: display.height / 2,
  },
});

const quarter = (d: Rect): Record<string, Rect> => ({
  "top-left": { x: d.x, y: d.y, width: d.width / 2, height: d.height / 2 },
  "top-right": { x: d.x + d.width / 2, y: d.y, width: d.width / 2, height: d.height / 2 },
  "bottom-left": { x: d.x, y: d.y + d.height / 2, width: d.width / 2, height: d.height / 2 },
  "bottom-right": {
    x: d.x + d.width / 2,
    y: d.y + d.height / 2,
    width: d.width / 2,
    height: d.height / 2,
  },
});

const thirds = (d: Rect): Record<string, Rect> => {
  const w = d.width / 3;
  return {
    "left-third": { x: d.x, y: d.y, width: w, height: d.height },
    "center-third": { x: d.x + w, y: d.y, width: w, height: d.height },
    "right-third": { x: d.x + 2 * w, y: d.y, width: w, height: d.height },
    "left-two-thirds": { x: d.x, y: d.y, width: 2 * w, height: d.height },
    "right-two-thirds": { x: d.x + w, y: d.y, width: 2 * w, height: d.height },
  };
};

export function computeBounds(layout: LayoutId, display: Rect): Rect {
  const all = {
    ...half(display),
    ...quarter(display),
    ...thirds(display),
    center: {
      x: display.x + display.width / 4,
      y: display.y + display.height / 4,
      width: display.width / 2,
      height: display.height / 2,
    },
    fullscreen: { ...display },
  };
  const r = all[layout];
  if (!r) throw new Error(`unknown layout ${layout}`);
  return roundRect(r);
}

export function roundRect(r: Rect): Rect {
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
}

export function nextDisplay(
  current: Rect,
  displays: Rect[],
  direction: "next" | "prev"
): Rect | null {
  if (displays.length <= 1) return null;
  const idx = displays.findIndex(
    (d) => d.x === current.x && d.y === current.y && d.width === current.width
  );
  if (idx < 0) return displays[0];
  const step = direction === "next" ? 1 : -1;
  return displays[(idx + step + displays.length) % displays.length];
}
