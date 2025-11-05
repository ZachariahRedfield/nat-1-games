import { Application, Container, Graphics, Point } from 'pixi.js';

type ViewportSubscriber = (state: ViewportState) => void;

export interface RenderSurfaceOptions {
  /** Canvas background color */
  background?: number | string;
  /** Override device pixel ratio handling */
  resolution?: number;
  /** If true, resize the renderer when the host element changes size */
  autoResize?: boolean;
  /** Optional initial viewport scale */
  initialScale?: number;
}

export interface ViewportState {
  /** World-space x coordinate for the top-left of the viewport */
  x: number;
  /** World-space y coordinate for the top-left of the viewport */
  y: number;
  /** Width of the viewport in world units */
  width: number;
  /** Height of the viewport in world units */
  height: number;
  /** Current world scale */
  scale: number;
}

interface LayerEntry {
  container: Container;
  graphics?: Graphics;
}

export class RenderSurface {
  private readonly options: RenderSurfaceOptions;
  private application?: Application;
  private hostElement?: HTMLElement;
  private world?: Container;
  private resizeObserver?: ResizeObserver;
  private subscribers = new Set<ViewportSubscriber>();
  private viewportState: ViewportState | null = null;
  private layers = new Map<string, LayerEntry>();
  private isPanning = false;
  private lastPanPointer?: Point;

  constructor(options: RenderSurfaceOptions = {}) {
    this.options = { autoResize: true, ...options };
  }

  public async mount(hostElement: HTMLElement): Promise<void> {
    if (this.application) {
      this.destroy();
    }

    this.hostElement = hostElement;

    const resolution = this.options.resolution ?? window.devicePixelRatio ?? 1;
    const background = this.options.background ?? 0x000000;

    const app = new Application();
    await app.init({
      background,
      backgroundAlpha: 0,
      antialias: true,
      resolution,
      autoDensity: true,
    });

    this.application = app;
    this.world = new Container();
    this.world.sortableChildren = true;
    const scale = this.options.initialScale ?? 1;
    this.world.scale.set(scale, scale);
    app.stage.addChild(this.world);

    hostElement.appendChild(app.canvas);
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.touchAction = 'none';

    this.installInteractionHandlers();
    this.attachResizeObserver();
    this.updateViewportState();
  }

  public destroy(): void {
    this.removeInteractionHandlers();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    if (this.application) {
      this.application.destroy(true);
      this.application = undefined;
    }

    if (this.hostElement) {
      this.hostElement.innerHTML = '';
      this.hostElement = undefined;
    }

    this.world = undefined;
    this.layers.clear();
    this.viewportState = null;
  }

  public getStage(): Container | undefined {
    return this.world;
  }

  public subscribe(listener: ViewportSubscriber): () => void {
    this.subscribers.add(listener);
    if (this.viewportState) {
      listener(this.viewportState);
    }
    return () => {
      this.subscribers.delete(listener);
    };
  }

  public getViewportState(): ViewportState | null {
    return this.viewportState;
  }

  public setViewportOrigin(x: number, y: number): void {
    if (!this.world) return;
    this.world.position.set(-x * this.world.scale.x, -y * this.world.scale.y);
    this.updateViewportState();
  }

  public setViewportScale(scale: number, pivot?: { x: number; y: number }): void {
    if (!this.world || !this.application) return;

    const stage = this.world;
    const currentScale = stage.scale.x;
    if (scale === currentScale) return;

    if (pivot) {
      const before = new Point(pivot.x * currentScale + stage.position.x, pivot.y * currentScale + stage.position.y);
      stage.scale.set(scale, scale);
      const after = new Point(pivot.x * scale, pivot.y * scale);
      stage.position.set(stage.position.x + before.x - after.x, stage.position.y + before.y - after.y);
    } else {
      stage.scale.set(scale, scale);
    }

    this.updateViewportState();
  }

  public getLayer(name: string): Container {
    if (!this.world) {
      throw new Error('RenderSurface is not mounted');
    }

    let entry = this.layers.get(name);
    if (!entry) {
      const container = new Container();
      container.sortableChildren = false;
      this.world.addChild(container);
      entry = { container };
      this.layers.set(name, entry);
    }
    return entry.container;
  }

  public getGraphicsLayer(name: string): Graphics {
    let entry = this.layers.get(name);
    if (!entry) {
      const container = this.getLayer(name);
      const graphics = new Graphics();
      container.addChild(graphics);
      entry = { container, graphics };
      this.layers.set(name, entry);
      return graphics;
    }

    if (!entry.graphics) {
      entry.graphics = new Graphics();
      entry.container.addChild(entry.graphics);
    }

    return entry.graphics;
  }

  public getWorldViewport(): ViewportState | null {
    return this.viewportState;
  }

  private installInteractionHandlers(): void {
    const canvas = this.application?.canvas;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private removeInteractionHandlers(): void {
    const canvas = this.application?.canvas;
    if (!canvas) return;

    canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('wheel', this.onWheel);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.world) return;
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;

    this.isPanning = true;
    this.lastPanPointer = new Point(event.clientX, event.clientY);
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.world || !this.isPanning || !this.lastPanPointer) return;

    const dx = event.clientX - this.lastPanPointer.x;
    const dy = event.clientY - this.lastPanPointer.y;

    this.world.position.x += dx;
    this.world.position.y += dy;

    this.lastPanPointer.set(event.clientX, event.clientY);
    this.updateViewportState();
  };

  private onPointerUp = () => {
    this.isPanning = false;
    this.lastPanPointer = undefined;
  };

  private onWheel = (event: WheelEvent) => {
    if (!this.world) return;

    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const scaleFactor = direction > 0 ? 1.1 : 0.9;
    const currentScale = this.world.scale.x;
    const nextScale = this.clamp(currentScale * scaleFactor, 0.1, 8);

    const rect = this.application?.canvas.getBoundingClientRect();
    if (!rect) {
      this.setViewportScale(nextScale);
      return;
    }

    const pivot = {
      x: (event.clientX - rect.left - this.world.position.x) / currentScale,
      y: (event.clientY - rect.top - this.world.position.y) / currentScale,
    };

    this.setViewportScale(nextScale, pivot);
  };

  private attachResizeObserver(): void {
    if (!this.options.autoResize) return;
    if (!this.hostElement || !this.application) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        this.application?.renderer.resize({ width: cr.width, height: cr.height });
        this.updateViewportState();
      }
    });

    this.resizeObserver.observe(this.hostElement);

    const rect = this.hostElement.getBoundingClientRect();
    this.application.renderer.resize({ width: rect.width, height: rect.height });
    this.updateViewportState();
  }

  private updateViewportState(): void {
    if (!this.application || !this.world) return;

    const renderer = this.application.renderer;
    const scale = this.world.scale.x;
    const width = renderer.width / scale;
    const height = renderer.height / scale;
    const x = -this.world.position.x / scale;
    const y = -this.world.position.y / scale;

    this.viewportState = { x, y, width, height, scale };

    for (const subscriber of this.subscribers) {
      subscriber(this.viewportState);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export default RenderSurface;
