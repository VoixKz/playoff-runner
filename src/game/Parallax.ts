import { Container, Sprite, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PLAYER, WORLD, Z } from '../config/constants';

/** A row of evenly-spaced, wrap-around props (pooled — created once, recycled forever). */
class PropRow extends Container {
  private items: Sprite[] = [];
  private span: number;

  constructor(
    textures: Texture[],
    spacing: number,
    scaleVal: number,
    groundY: number,
    z: number,
    tint?: number,
  ) {
    super();
    this.zIndex = z;
    const count = Math.ceil((DESIGN_WIDTH + WORLD.SCREEN_BUFFER) / spacing) + 1;
    this.span = count * spacing;
    for (let i = 0; i < count; i++) {
      const s = new Sprite(textures[i % textures.length]);
      s.anchor.set(0.5, 1);
      s.scale.set(scaleVal);
      s.x = i * spacing;
      s.y = groundY;
      if (tint !== undefined) s.tint = tint;
      this.items.push(s);
      this.addChild(s);
    }
  }

  update(dx: number): void {
    for (const s of this.items) {
      s.x -= dx;
      if (s.x < -this.span / this.items.length - 100) s.x += this.span;
    }
  }
}

/** Scrolling world: 6 mirrored cover-scaled bg tiles + tree/bush/lamp prop rows. */
export class Parallax extends Container {
  private tiles: Container[] = [];
  private tileWidth = 0;
  private rows: PropRow[] = [];

  constructor(
    bg: Texture,
    trees: Texture[],
    bushes: Texture[],
    lamp: Texture,
    propTint?: number,
  ) {
    super();
    this.sortableChildren = true;

    const bgScale = Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height);
    this.tileWidth = bg.width * bgScale;
    for (let i = 0; i < WORLD.BG_TILE_COUNT; i++) {
      const tile = new Container();
      const s = new Sprite(bg);
      s.anchor.set(0, 0);
      if (i % 2 === 1) {
        s.scale.x = -1;
        s.x = bg.width; // flip in place so tile still occupies [0, width]
      }
      tile.addChild(s);
      tile.scale.set(bgScale);
      tile.x = i * this.tileWidth;
      tile.y = 0;
      tile.zIndex = Z.FAR_BACKGROUND;
      this.tiles.push(tile);
      this.addChild(tile);
    }

    const groundY = DESIGN_HEIGHT - PLAYER.GROUND_Y;
    // Props sit just behind the player along the roadside; kept small so they read as scenery.
    this.rows.push(new PropRow(trees, 460, 0.42, groundY - 10, Z.MID_BACKGROUND, propTint));
    this.rows.push(new PropRow(bushes, 380, 0.34, groundY + 4, Z.NEAR_BACKGROUND, propTint));
    this.rows.push(new PropRow([lamp], WORLD.LAMP_SPACING, 0.5, groundY - 6, Z.MID_BACKGROUND, propTint));
    for (const r of this.rows) this.addChild(r);
  }

  update(dtMs: number, speed: number): void {
    const dx = (speed * dtMs) / 1000;
    for (const tile of this.tiles) {
      tile.x -= dx;
      if (tile.x <= -this.tileWidth) tile.x += this.tileWidth * this.tiles.length;
    }
    for (const r of this.rows) r.update(dx);
  }
}
