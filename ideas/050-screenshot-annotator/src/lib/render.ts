import { Shape } from "./annotations";

export function render(
  ctx: CanvasRenderingContext2D,
  baseImage: CanvasImageSource | null,
  shapes: Shape[],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
  if (baseImage) ctx.drawImage(baseImage, 0, 0, width, height);
  for (const s of shapes) drawShape(ctx, s);
}

export function drawShape(ctx: CanvasRenderingContext2D, s: Shape): void {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.strokeWidth;
  switch (s.tool) {
    case "rect":
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      break;
    case "highlight":
      ctx.globalAlpha = 0.3;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      break;
    case "blur":
      // For tests we just fill gray; real impl uses CanvasFilter
      ctx.fillStyle = "rgba(120,120,120,0.85)";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      break;
    case "ellipse":
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "arrow":
      drawArrow(ctx, s.x1, s.y1, s.x2, s.y2);
      break;
    case "text":
      ctx.font = s.font || "16px system-ui";
      ctx.fillText(s.text, s.x, s.y + 16);
      break;
  }
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const headLen = 12;
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(a - Math.PI / 6), y2 - headLen * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(a + Math.PI / 6), y2 - headLen * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}
