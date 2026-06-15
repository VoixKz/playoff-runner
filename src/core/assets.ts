import { Assets, Spritesheet, Texture } from 'pixi.js';
import type { SpritesheetData } from '../config/skins/types';

/** Load a single texture from a URL / data-URI. */
export async function loadTexture(url: string): Promise<Texture> {
  return Assets.load<Texture>(url);
}

export async function loadTextures(urls: string[]): Promise<Texture[]> {
  return Promise.all(urls.map(loadTexture));
}

/** Parse a packed atlas (frames/animations/meta) into a Pixi Spritesheet. */
export async function loadSpritesheet(data: SpritesheetData): Promise<Spritesheet> {
  const tex = await loadTexture(data.texture);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheet = new Spritesheet(tex, data.atlas as any);
  await sheet.parse();
  return sheet;
}
