import { Container, Sprite, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PLAYER, WORLD, Z } from '../config/constants';

// Horizontal coverage for prop rows — wide enough to fill landscape (centered column).
// COVER_START reaches well left of the landscape viewport's left edge (~ -1133 in
// scene space) so props never run out on the left.
const COVER_START = -2400;
const COVER_WIDTH = 6600;

/**
 * A row of evenly-spaced, wrap-around props (pooled — created once, recycled forever).
 * Placement (anchor / y / scale) matches the reference per prop type.
 */
class PropRow extends Container {
  private items: Sprite[] = [];
  private span = 0;

  constructor(
    textures: Texture[],
    spacing: number,
    scaleVal: number,
    y: number,
    anchorY: number,
    z: number,
  ) {
    super();
    this.zIndex = z;
    const count = Math.ceil(COVER_WIDTH / spacing) + 1;
    this.span = count * spacing;
    for (let i = 0; i < count; i++) {
      const s = new Sprite(textures[i % textures.length]);
      s.anchor.set(0.5, anchorY);
      s.scale.set(scaleVal);
      s.x = COVER_START + i * spacing;
      s.y = y;
      this.items.push(s);
      this.addChild(s);
    }
  }

  update(dx: number): void {
    for (const s of this.items) {
      s.x -= dx;
      if (s.x < COVER_START) s.x += this.span;
    }
  }
}

/**
 * Scrolling world: 6 mirrored cover-scaled background tiles + tree / lamp / bush rows.
 * Trees & lamps hang from the top (anchor 0.5,0), bushes sit at the horizon (y = roadY-305).
 */
export class Parallax extends Container {
  private tiles: Container[] = [];
  private tileWidth = 0;
  private rows: PropRow[] = [];

  constructor(bg: Texture, trees: Texture[], bushes: Texture[], lamp: Texture) {
    super();
    this.sortableChildren = true;

    const bgScale = Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height);
    this.tileWidth = bg.width * bgScale;
    const bgY = (DESIGN_HEIGHT - bg.height * bgScale) / 2;
    for (let i = 0; i < WORLD.BG_TILE_COUNT; i++) {
      const tile = new Container();
      const s = new Sprite(bg);
      s.anchor.set(0, 0);
      s.scale.set(bgScale);
      if (i % 2 === 1) {
        // mirror in place so the tile still fills local [0, tileWidth] and seams hide
        s.scale.x = -bgScale;
        s.x = this.tileWidth;
      }
      tile.addChild(s);
      tile.y = bgY;
      // Start two tiles to the left: the landscape viewport's left edge sits near
      // scene-x -1133, so the leftmost background must reach past that at all times.
      tile.x = (i - 2) * this.tileWidth;
      tile.zIndex = Z.FAR_BACKGROUND;
      this.tiles.push(tile);
      this.addChild(tile);
    }

    const roadY = DESIGN_HEIGHT - PLAYER.GROUND_Y; // 1000
    // trees: big, hang from the top
    this.rows.push(new PropRow(trees, 420, 1.81, 0, 0, Z.MID_BACKGROUND));
    // lamps: hang from the top, y=50
    this.rows.push(new PropRow([lamp], WORLD.LAMP_SPACING, 1.8, 50, 0, Z.NEAR_BACKGROUND));
    // bushes: sit at the horizon line (above the road)
    this.rows.push(new PropRow(bushes, 300, 0.52, roadY - 305, 1, Z.NEAR_BACKGROUND));
    for (const r of this.rows) this.addChild(r);
  }

  update(dtMs: number, speed: number): void {
    const dx = (speed * dtMs) / 1000;
    const wrap = this.tileWidth * this.tiles.length;
    for (const tile of this.tiles) {
      tile.x -= dx;
      // Recycle a tile only once it's a FULL width past the left anchor (-tileWidth),
      // so the left coverage floor stays at ~ -2·tileWidth and never exposes the
      // clear colour (the beige flash). wrap = 6·tileWidth keeps mirror parity.
      if (tile.x + this.tileWidth < -this.tileWidth) tile.x += wrap;
    }
    for (const r of this.rows) r.update(dx);
  }
}
