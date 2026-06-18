import { Container, Graphics, Spritesheet, Text, TextStyle, Texture } from 'pixi.js';
import type { GameApp } from '../core/App';
import type { AudioManager } from '../core/audio/AudioManager';
import type { PlayableSDK } from '../core/sdk/PlayableSDK';
import type { Skin } from '../config/skins/types';
import {
  COLLECTIBLE,
  CONFETTI,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  HITBOX,
  MAX_HP,
  OBSTACLE,
  OFFSCREEN_LEFT,
  ROPE,
  TUTORIAL_PAUSE_DISTANCE,
  WORLD,
  Z,
} from '../config/constants';
import { StateMachine } from '../core/StateMachine';
import { circleIntersectsRect, rectsIntersect, shrinkRect } from './collision';
import { loadSpritesheet, loadTextures } from '../core/assets';
import { Parallax } from './Parallax';
import { Player } from './Player';
import { Collectible } from './entities/Collectible';
import { Obstacle } from './entities/Obstacle';
import { Enemy } from './entities/Enemy';
import { FinishLine } from './FinishLine';
import { Confetti } from './Confetti';
import { SpawnScheduler } from './Level';
import { Hud } from '../ui/Hud';
import { Tutorial } from '../ui/Tutorial';
import { EndCard } from '../ui/EndCard';
import { showFailFlash } from '../ui/Fail';

interface Warning {
  node: Container;
  obstacle: Obstacle;
  t: number;
}

export class GameController {
  private sm = new StateMachine('LOADING');
  private scheduler = new SpawnScheduler();

  private speed: number = WORLD.BASE_SPEED;
  private distance = 0;
  private hp: number = MAX_HP;
  private score = 0;
  private picksSincePraise = 0;

  private jumpingEnabled = false;
  private isDecelerating = false;
  private finishSpawned = false;
  private paused = false;
  private winScheduled = false;

  private parallax!: Parallax;
  private player!: Player;
  private confetti!: Confetti;
  private finishLine?: FinishLine;
  private overlay?: Graphics;

  private enemySheet!: Spritesheet;
  private tex!: Record<string, Texture>;

  private collectibles: Collectible[] = [];
  private obstacles: Obstacle[] = [];
  private enemies: Enemy[] = [];
  private warnings: Warning[] = [];
  private tutorialEnemy?: Enemy;

  private hud!: Hud;
  private tutorial!: Tutorial;
  private endCard!: EndCard;

  constructor(
    private gameApp: GameApp,
    private skin: Skin,
    private audio: AudioManager,
    private sdk: PlayableSDK,
    private uiRoot: HTMLElement,
  ) {}

  async init(): Promise<void> {
    const a = this.skin.assets;
    const [playerSheet, enemySheet] = await Promise.all([
      loadSpritesheet(a.player),
      loadSpritesheet(a.enemy),
    ]);
    this.enemySheet = enemySheet;

    const [bg, dollar, paypal, finishTape, obstacle, obstacleGlow, lamp, ...rest] =
      await loadTextures([
        a.background,
        a.dollar,
        a.paypalCard,
        a.finishTape,
        a.obstacle,
        a.obstacleGlow,
        a.lamp,
        ...a.trees,
        ...a.bushes,
        ...a.confetti,
      ]);
    const trees = rest.slice(0, a.trees.length);
    const bushes = rest.slice(a.trees.length, a.trees.length + a.bushes.length);
    const confetti = rest.slice(a.trees.length + a.bushes.length);
    this.tex = { dollar, paypal, finishTape, obstacle, obstacleGlow };

    const scene = this.gameApp.scene;
    this.parallax = new Parallax(bg, trees, bushes, lamp, this.skin.theme.propTint);
    scene.addChild(this.parallax);

    this.player = new Player(playerSheet);
    if (this.skin.playerRecolor) this.player.applyRecolor(this.skin.playerRecolor);
    this.player.onJump = () => this.audio.play('jump');
    scene.addChild(this.player);

    this.confetti = new Confetti(confetti);
    scene.addChild(this.confetti);

    // UI
    this.hud = new Hud(this.uiRoot, this.skin);
    this.tutorial = new Tutorial(this.uiRoot, this.skin);
    this.endCard = new EndCard(this.uiRoot, this.skin, () => this.sdk.download());
    this.buildFooter();

    this.setupInput();
    this.gameApp.setResizeHandler(() => this.layoutWorld());
    this.layoutWorld();
    this.gameApp.ticker.add((ticker) => this.update(Math.min(ticker.deltaMS, 50)));

    this.sm.transition('INTRO');
    this.tutorial.show('start');
  }

  /** Swap the footer banner for the current orientation (player stays at 0.18·W). */
  private layoutWorld(): void {
    if (this.footerBanner) {
      this.footerBanner.src = this.gameApp.layout.isPortrait
        ? this.skin.assets.bannerPortrait
        : this.skin.assets.bannerLandscape;
    }
  }

  private setupInput(): void {
    this.gameApp.app.canvas.addEventListener('pointerdown', () => {
      this.audio.unlock();
      this.handleTap();
    });
    this.sdk.init((viewable) => (viewable ? this.resume() : this.pause()));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.resume();
    });
    // Control messages from the preview shell (device-frame harness).
    window.addEventListener('message', (e: MessageEvent) => {
      const t = (e.data as { type?: string } | null)?.type;
      if (t === 'mute') this.audio.setMuted(!!(e.data as { muted?: boolean }).muted);
      else if (t === 'pause') this.pause();
      else if (t === 'resume') this.resume();
    });
  }

  private handleTap(): void {
    if (this.sm.is('INTRO')) this.start();
    else if (this.sm.is('PAUSED')) this.resumeFromTutorial();
    else if (this.sm.is('RUNNING') && this.jumpingEnabled && this.player.isOnGround && !this.finishSpawned) {
      this.player.jump();
    }
  }

  private start(): void {
    if (!this.sm.transition('RUNNING')) return;
    // Jumping stays locked until the first obstacle tutorial (reference behaviour).
    this.player.run();
    this.tutorial.hide();
    this.audio.play('music');
  }

  // ---------- main loop ----------
  private update(dtMs: number): void {
    this.confetti.update(dtMs);
    if (this.finishLine) this.finishLine.update(dtMs, this.sm.is('RUNNING') ? this.speed : 0);
    if (this.overlay && this.overlay.alpha < CONFETTI.OVERLAY_ALPHA) {
      this.overlay.alpha = Math.min(CONFETTI.OVERLAY_ALPHA, this.overlay.alpha + dtMs / 400 * CONFETTI.OVERLAY_ALPHA);
    }
    if (!this.sm.is('RUNNING')) return;

    if (this.isDecelerating) {
      this.speed *= Math.pow(WORLD.DECELERATION_RATE, dtMs / 16.667);
      if (this.speed < WORLD.MIN_SPEED) {
        this.speed = 0;
        if (!this.winScheduled) {
          this.winScheduled = true;
          setTimeout(() => this.handleWin(), 500);
        }
      }
    }

    this.parallax.update(dtMs, this.speed);
    this.distance += (this.speed * dtMs) / 1000;
    this.player.update(dtMs);

    for (const entry of this.scheduler.due(this.distance, this.gameApp.layout.workingWidth)) this.spawn(entry);
    this.updateEntities(dtMs);
    this.checkTutorialTrigger();
    this.checkCollisions();
    this.checkFinish();
  }

  private spawn(entry: { type: string; yOffset?: number; pauseForTutorial?: boolean; warningLabel?: boolean }): void {
    const spawnX = this.gameApp.layout.workingWidth * 1.5; // 1.5 screen-widths off the right
    const scene = this.gameApp.scene;
    if (entry.type === 'collectible') {
      const isDollar = Math.random() < COLLECTIBLE.DOLLAR_RATIO;
      const value = isDollar ? COLLECTIBLE.DOLLAR_VALUE : COLLECTIBLE.PAYPAL_VALUE;
      const c = new Collectible(isDollar ? this.tex.dollar : this.tex.paypal, isDollar ? 'dollar' : 'paypal', value);
      c.x = spawnX;
      c.y = COLLECTIBLE.Y_BASE - (entry.yOffset ?? 0);
      scene.addChild(c);
      this.collectibles.push(c);
    } else if (entry.type === 'obstacle') {
      const o = new Obstacle(this.tex.obstacle, this.tex.obstacleGlow, !!entry.warningLabel);
      o.x = spawnX;
      scene.addChild(o);
      this.obstacles.push(o);
      if (entry.warningLabel) this.addWarning(o);
    } else if (entry.type === 'enemy') {
      const e = new Enemy(this.enemySheet);
      e.x = spawnX;
      scene.addChild(e);
      this.enemies.push(e);
      if (entry.pauseForTutorial) this.tutorialEnemy = e;
    } else if (entry.type === 'finish') {
      this.finishLine = new FinishLine(this.tex.finishTape);
      this.finishLine.x = spawnX;
      scene.addChild(this.finishLine);
      this.finishSpawned = true;
    }
  }

  private addWarning(o: Obstacle): void {
    const node = new Container();
    const text = new Text({
      text: 'EVADE',
      style: new TextStyle({
        fontFamily: this.skin.theme.fontFamily,
        fontSize: 44,
        fill: '#ff1a1a',
        fontWeight: '900',
        stroke: { color: '#5a0000', width: 3 },
      }),
    });
    text.anchor.set(0.5);
    const bw = text.width + 56;
    const bh = text.height + 28;
    const bg = new Graphics()
      .roundRect(-bw / 2, -bh / 2, bw, bh, 18)
      .fill(0xffd21a)
      .stroke({ color: 0xc79a00, width: 5 });
    node.addChild(bg, text);
    node.y = OBSTACLE.WARNING_Y;
    node.zIndex = Z.WARNING_LABEL;
    this.gameApp.scene.addChild(node);
    this.warnings.push({ node, obstacle: o, t: 0 });
  }

  private updateEntities(dtMs: number): void {
    for (const c of this.collectibles) c.update(dtMs, this.speed);
    for (const o of this.obstacles) o.update(dtMs, this.speed);
    for (const e of this.enemies) e.update(dtMs, this.speed);
    for (const w of this.warnings) {
      w.t += dtMs;
      w.node.x = w.obstacle.x;
      w.node.scale.set(1 + Math.sin(w.t * OBSTACLE.WARNING_PULSE) * 0.1);
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.collectibles = this.filterOut(this.collectibles, (c) => c.collected || c.isOffScreen());
    this.obstacles = this.filterOut(this.obstacles, (o) => o.isOffScreen());
    this.enemies = this.filterOut(this.enemies, (e) => e.isOffScreen());
    this.warnings = this.warnings.filter((w) => {
      if (w.obstacle.destroyed || w.obstacle.x < OFFSCREEN_LEFT) {
        w.node.destroy({ children: true });
        return false;
      }
      return true;
    });
  }

  private filterOut<T extends Container>(arr: T[], pred: (x: T) => boolean): T[] {
    const keep: T[] = [];
    for (const x of arr) {
      if (pred(x)) x.destroy({ children: true });
      else keep.push(x);
    }
    return keep;
  }

  private playerHitbox() {
    return shrinkRect(
      this.player.getBoundsRect(),
      HITBOX.PLAYER.X,
      HITBOX.PLAYER.Y,
      HITBOX.PLAYER.OFFSET_X,
      HITBOX.PLAYER.OFFSET_Y,
    );
  }

  private checkCollisions(): void {
    const pr = this.playerHitbox();
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const { cx, cy, r } = c.circle;
      if (circleIntersectsRect(cx, cy, r, pr)) this.collect(c);
    }
    if (this.player.isInvincible) return;
    for (const o of this.obstacles) {
      if (rectsIntersect(pr, o.getBoundsRect())) return this.hit();
    }
    for (const e of this.enemies) {
      if (rectsIntersect(pr, e.getBoundsRect())) return this.hit();
    }
  }

  private collect(c: Collectible): void {
    c.collected = true;
    this.score += c.value;
    this.hud.setScore(this.score);
    const g = c.getGlobalPosition();
    this.hud.flyToCounter(g.x, g.y, c.kind);
    this.audio.play('collect');
    if (++this.picksSincePraise >= 3 + Math.floor(Math.random() * 2)) {
      this.picksSincePraise = 0;
      this.hud.praise();
    }
  }

  private hit(): void {
    if (this.debugGod) return;
    this.hp--;
    this.player.hurt();
    this.hud.renderHearts(this.hp);
    this.audio.play('hit');
    this.audio.play('hurt');
    if (this.hp <= 0) this.handleLose();
  }

  private checkTutorialTrigger(): void {
    if (!this.tutorialEnemy || this.tutorialEnemy.destroyed) return;
    if (this.tutorialEnemy.x - this.player.x <= TUTORIAL_PAUSE_DISTANCE) {
      if (this.sm.transition('PAUSED')) {
        this.player.idle();
        this.tutorial.show('jump');
      }
    }
  }

  private resumeFromTutorial(): void {
    if (!this.sm.transition('RUNNING')) return;
    this.jumpingEnabled = true;
    this.tutorial.hide();
    this.player.run();
    this.player.jump(); // auto first jump
    this.tutorialEnemy = undefined;
  }

  private checkFinish(): void {
    if (!this.finishLine || this.finishLine.isBroken) return;
    if (this.finishLine.x + ROPE.TAPE_BREAK_OFFSET <= this.player.x) this.startDeceleration();
  }

  private startDeceleration(): void {
    this.isDecelerating = true;
    this.finishLine?.breakTape();
    this.overlay = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill(0x000000);
    this.overlay.alpha = 0;
    this.overlay.zIndex = Z.OVERLAY;
    this.gameApp.scene.addChild(this.overlay);
    this.confetti.burst(DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  private handleWin(): void {
    if (!this.sm.transition('END_WIN')) return;
    this.player.idle();
    this.audio.stopMusic();
    this.audio.play('win');
    this.hideFooter();
    this.endCard.show('win', this.score);
  }

  private handleLose(): void {
    if (!this.sm.transition('END_LOSE')) return;
    this.player.idle();
    this.audio.stopMusic();
    this.audio.play('lose');
    this.hideFooter();
    showFailFlash(this.uiRoot, this.skin, () => this.endCard.show('lose', this.score));
  }

  // ---------- footer ----------
  private footer?: HTMLDivElement;
  private footerBanner?: HTMLImageElement;
  private buildFooter(): void {
    const footer = document.createElement('div');
    footer.className = 'footer';
    const banner = document.createElement('img');
    banner.className = 'footer-banner';
    banner.src = this.skin.assets.bannerPortrait;
    this.footerBanner = banner;
    const cta = document.createElement('div');
    cta.className = 'footer-cta';
    cta.textContent = 'DOWNLOAD';
    cta.style.setProperty('--cta-from', this.skin.theme.ctaGradient[0]);
    cta.style.setProperty('--cta-to', this.skin.theme.ctaGradient[1]);
    cta.style.setProperty('--cta-border', this.skin.theme.ctaBorder);
    cta.addEventListener('click', () => this.sdk.download());
    footer.append(banner, cta);
    this.uiRoot.appendChild(footer);
    this.footer = footer;
  }
  private hideFooter(): void {
    if (this.footer) this.footer.style.display = 'none';
  }

  // ---------- debug hooks (dev only; harmless in prod) ----------
  debugGod = false;
  debugTap(): void {
    this.handleTap();
  }
  /** Advance the sim by `frames` fixed steps and force a render (bypasses rAF throttling). */
  debugStep(frames = 1, dtMs = 16.667): void {
    for (let i = 0; i < frames; i++) this.update(dtMs);
    this.gameApp.app.render();
  }

  /** Debug snapshot (dev only). */
  debugState() {
    return {
      state: this.sm.state,
      score: this.score,
      distance: Math.round(this.distance),
      collectibles: this.collectibles.length,
      enemies: this.enemies.length,
      obstacles: this.obstacles.length,
      hasFinish: !!this.finishLine,
      finishBroken: this.finishLine?.isBroken ?? false,
      playerHitbox: this.playerHitbox(),
      firstColl: this.collectibles[0]
        ? { x: Math.round(this.collectibles[0].x), y: Math.round(this.collectibles[0].y) }
        : null,
    };
  }

  // ---------- pause / resume ----------
  private pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.gameApp.ticker.stop();
    this.audio.setMuted(true);
  }
  private resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.gameApp.ticker.start();
    this.audio.setMuted(false);
  }
}
