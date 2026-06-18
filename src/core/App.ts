import { Application, Container } from 'pixi.js';
import { BACKGROUND_COLOR, DESIGN_WIDTH, DESIGN_HEIGHT } from '../config/constants';

export interface Layout {
  scale: number;
  /** Spawn-math width; swaps with orientation like the reference (`yt`): 720 / 1280. */
  workingWidth: number;
  isPortrait: boolean;
  /** Design-space x of the screen's LEFT edge (≈0 portrait, strongly negative in
   *  landscape). Entities cull relative to this so nothing vanishes mid-screen. */
  visibleLeft: number;
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
  layout: Layout = { scale: 1, workingWidth: DESIGN_WIDTH, isPortrait: true, visibleLeft: 0 };
  private onResize?: () => void;

  async init(bgColor = BACKGROUND_COLOR): Promise<void> {
    await this.app.init({
      resizeTo: window,
      backgroundColor: bgColor,
      // DROP MSAA (2D sprites are pre-anti-aliased in their alpha) and cap DPR at
      // 1.5 — the dominant cost on phones is fragment/fill-rate, and 1.5x is still
      // sharp while rendering ~44% fewer pixels than 2x. powerPreference picks the
      // fast GPU.
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      autoDensity: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    // No maxFPS cap: capping AT the display's refresh rate (60) makes Pixi skip
    // frames on the 16.6ms boundary → periodic stutter, most visible on the fast
    // chaser. Native vsync pacing is smooth; motion is deltaMS-scaled regardless.
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
    const offsetX = (w - DESIGN_WIDTH * scale) / 2;
    this.scene.scale.set(scale);
    this.scene.position.set(offsetX, 0);
    // screen-x 0 maps to design-x (-offsetX / scale): the true left edge for culling.
    const visibleLeft = -offsetX / scale;
    this.layout = {
      scale,
      workingWidth: isPortrait ? DESIGN_WIDTH : DESIGN_HEIGHT,
      isPortrait,
      visibleLeft,
    };
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
