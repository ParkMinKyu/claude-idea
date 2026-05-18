export type Tool = "arrow" | "rect" | "ellipse" | "text" | "blur" | "highlight";

export interface BaseShape {
  id: string;
  tool: Tool;
  color: string;
  strokeWidth: number;
}
export interface RectShape extends BaseShape {
  tool: "rect" | "ellipse" | "blur" | "highlight";
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ArrowShape extends BaseShape {
  tool: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface TextShape extends BaseShape {
  tool: "text";
  x: number;
  y: number;
  text: string;
  font: string;
}
export type Shape = RectShape | ArrowShape | TextShape;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function bbox(shape: Shape): Box {
  if (shape.tool === "arrow") {
    const x = Math.min(shape.x1, shape.x2);
    const y = Math.min(shape.y1, shape.y2);
    return { x, y, w: Math.abs(shape.x2 - shape.x1), h: Math.abs(shape.y2 - shape.y1) };
  }
  if (shape.tool === "text") {
    return { x: shape.x, y: shape.y, w: shape.text.length * 8, h: 18 };
  }
  return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
}

export function hitTest(shape: Shape, px: number, py: number): boolean {
  const b = bbox(shape);
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

export class History {
  private stack: Shape[][] = [[]];
  private cursor = 0;
  current(): Shape[] {
    return this.stack[this.cursor];
  }
  push(shapes: Shape[]): void {
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push(shapes);
    this.cursor++;
  }
  undo(): boolean {
    if (this.cursor === 0) return false;
    this.cursor--;
    return true;
  }
  redo(): boolean {
    if (this.cursor === this.stack.length - 1) return false;
    this.cursor++;
    return true;
  }
}
