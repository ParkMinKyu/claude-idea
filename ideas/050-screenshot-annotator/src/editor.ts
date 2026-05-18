import { History, Shape, Tool } from "./lib/annotations";
import { render } from "./lib/render";
import { copyDataUrl } from "./lib/capture";

let img: HTMLImageElement | null = null;
const history = new History();
let currentTool: Tool = "arrow";
let drawing: Shape | null = null;
let color = "#ff3b30";

async function init() {
  const data = await chrome.storage.local.get("snap.pending");
  const dataUrl: string | undefined = data["snap.pending"];
  if (!dataUrl) return;
  img = new Image();
  img.onload = redraw;
  img.src = dataUrl;
}

const canvas = () => document.getElementById("canvas") as HTMLCanvasElement;
const ctx = () => canvas().getContext("2d")!;

function redraw() {
  if (!img) return;
  const c = canvas();
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const shapes = drawing ? [...history.current(), drawing] : history.current();
  render(ctx(), img, shapes, c.width, c.height);
}

function bind() {
  document.querySelectorAll("[data-tool]").forEach((el) => {
    el.addEventListener("click", () => {
      currentTool = (el as HTMLElement).dataset.tool as Tool;
    });
  });
  document.getElementById("color")?.addEventListener("input", (e) => {
    color = (e.target as HTMLInputElement).value;
  });
  document.getElementById("undo")?.addEventListener("click", () => {
    history.undo();
    redraw();
  });
  document.getElementById("redo")?.addEventListener("click", () => {
    history.redo();
    redraw();
  });
  document.getElementById("copy")?.addEventListener("click", async () => {
    await copyDataUrl(canvas().toDataURL("image/png"));
  });
  document.getElementById("save")?.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = canvas().toDataURL("image/png");
    a.download = `snap-${Date.now()}.png`;
    a.click();
  });

  const c = canvas();
  c.addEventListener("mousedown", (e) => {
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    drawing = newShape(currentTool, x, y, color);
  });
  c.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    updateShape(drawing, x, y);
    redraw();
  });
  c.addEventListener("mouseup", () => {
    if (drawing) {
      history.push([...history.current(), drawing]);
      drawing = null;
      redraw();
    }
  });
}

function newShape(tool: Tool, x: number, y: number, color: string): Shape {
  const id = Math.random().toString(36).slice(2);
  const base = { id, color, strokeWidth: 3 };
  if (tool === "arrow") return { ...base, tool, x1: x, y1: y, x2: x, y2: y };
  if (tool === "text") return { ...base, tool, x, y, text: "Text", font: "16px system-ui" };
  return { ...base, tool, x, y, w: 0, h: 0 };
}

function updateShape(s: Shape, x: number, y: number) {
  if (s.tool === "arrow") {
    s.x2 = x;
    s.y2 = y;
  } else if (s.tool !== "text") {
    s.w = x - s.x;
    s.h = y - s.y;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  bind();
});
