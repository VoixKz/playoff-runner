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
      // Cap DPR at 2 and DROP MSAA. This is a 2D sprite game (textures are already
      // anti-aliased in their alpha), so antialias only added GPU fill-rate cost —
      // the main source of jank on mobile. powerPreference asks for the fast GPU.
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    // Cap at 60fps. Logic is deltaMS-scaled so motion is identical, but on
    // 120Hz/ProMotion screens this halves GPU/CPU work and avoids thermal throttling.
    this.app.ticker.maxFPS = 60;
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

    if (/[?&]fps\b/.test(location.search)) this.attachFpsMeter();
  }

  /** Optional on-screen FPS meter — open the playable with `?fps` to measure perf. */
  private attachFpsMeter(): void {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:9999;' +
      'background:rgba(0,0,0,.6);color:#0f0;font:bold 13px monospace;padding:2px 8px;' +
      'border-radius:6px;pointer-events:none';
    document.body.appendChild(el);
    this.app.ticker.add(() => {
      el.textContent = `${Math.round(this.app.ticker.FPS)} FPS`;
    });
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
