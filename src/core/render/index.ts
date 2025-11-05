export type RenderCallback = (context: CanvasRenderingContext2D) => void;

export interface SurfaceSize {
  width: number;
  height: number;
}

export class RenderSurface {
  private context: CanvasRenderingContext2D | null = null;
  private size: SurfaceSize = { width: 0, height: 0 };

  attach(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Unable to acquire 2D context for render surface");
    }
    this.size = { width: canvas.width, height: canvas.height };
  }

  detach() {
    this.context = null;
  }

  resize(width: number, height: number) {
    if (!this.context) return;
    const canvas = this.context.canvas;
    if (canvas.width === width && canvas.height === height) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
    this.size = { width, height };
  }

  withContext(callback: RenderCallback) {
    if (!this.context) return;
    callback(this.context);
  }

  clear() {
    if (!this.context) return;
    this.context.clearRect(0, 0, this.size.width, this.size.height);
  }

  getSize(): SurfaceSize {
    return this.size;
  }
}
