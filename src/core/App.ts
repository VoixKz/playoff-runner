import { Application, Container } from 'pixi.js';
import { BACKGROUND_COLOR, DESIGN_WIDTH, DESIGN_HEIGHT } from '../config/constants';

export interface Layout {
  scale: number;
  /** Spawn-math width; swaps with orientation like the reference (`yt`): 720 / 1280. */
  workingWidth: number;
  isPortrait: boolean;
}

/**
 * Wraps the Pixi Application. Faithful to the reference `setupResponsiveScaling`:
 * scale the 1280-tall design space to viewport height and center the 720-wide
 * column. The background tiles + parallax props span far wider than the column, so
 * the scene fills both portrait and landscape with no letterbox. DPR clamped at 2.
 */
export class GameApp {
  readonly app = new Application();
  readonly scene = new Container(); // scaled game world; HUD is separate DOM
  layout: Layout = { scale: 1, workingWidth: DESIGN_WIDTH, isPortrait: true };
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

  /** Fit height, center the 720-wide design column (reference setupResponsiveScaling). */
  applyLayout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h >= w;
    const scale = h / DESIGN_HEIGHT;
    this.scene.scale.set(scale);
    this.scene.position.set((w - DESIGN_WIDTH * scale) / 2, 0);
    this.layout = { scale, workingWidth: isPortrait ? DESIGN_WIDTH : DESIGN_HEIGHT, isPortrait };
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
