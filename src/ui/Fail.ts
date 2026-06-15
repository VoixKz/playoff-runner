import { FAIL_FLASH_MS } from '../config/constants';
import type { Skin } from '../config/skins/types';

/** Brief FAIL badge flash, then hands off to the (lose) end card. */
export function showFailFlash(root: HTMLElement, skin: Skin, onComplete: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'fail-overlay';
  const badge = document.createElement('div');
  badge.className = 'fail-badge';
  badge.style.backgroundImage = `url(${skin.assets.failBadge})`;
  overlay.appendChild(badge);
  root.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
    onComplete();
  }, FAIL_FLASH_MS);
}
