import { Application, Container } from 'pixi.js';
import { BACKGROUND_COLOR, DESIGN_WIDTH, DESIGN_HEIGHT } from '../config/constants';

export interface Layout {
  scale: number;
  /** Visible design-space width = innerWidth / scale. The world fills this fully. */
  worldWidth: number;
  isPortrait: boolean;
}

/**
 * Wraps the Pixi Application. Scales the 1280-tall design space to the viewport
 * height and lets the world FILL the full width (no letterbox) in any aspect —
 * portrait or landscape. DPR clamped at 2.
 */
export class GameApp {
  readonly app = new Application();
  readonly scene = new Container(); // scaled game world; HUD is separate DOM
  layout: Layout = { scale: 1, worldWidth: DESIGN_WIDTH, isPortrait: true };
  private onResize?: () => void;

  async init(bgColor = BACKGROUND_COLOR): Promise<void> {
    await this.app.init({
      resizeTo: window,
      backgroundColor: bgColor,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: true,
    });
    this.scene.sortableChildren = true;
    this.app.stage.addChild(this.scene);

    const container = document.getElementById('game-container') ?? document.body;
    container.appendChild(this.app.canvas);
    this.app.canvas.style.position = 'absolute';
    this.app.canvas.style.left = '0';
    this.app.canvas.style.top = '0';

    this.applyLayout();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientation);
  }

  /** Recompute scale to fit height; the world fills the full width (no bars). */
  applyLayout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = h / DESIGN_HEIGHT;
    this.scene.scale.set(scale);
    this.scene.position.set(0, 0);
    this.layout = { scale, worldWidth: w / scale, isPortrait: h >= w };
    this.onResize?.();
  }

  setResizeHandler(fn: () => void): void {
    this.onResize = fn;
  }

  private handleResize = () => this.applyLayout();
  private handleOrientation = () => setTimeout(() => this.applyLayout(), 100);

  get ticker() {
    return this.app.ticker;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientation);
    this.app.destroy(true, { children: true, texture: true });
  }
}
