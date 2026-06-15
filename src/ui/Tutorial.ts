import type { Skin } from '../config/skins/types';

/** Centered tutorial overlay: "Tap to start" then "Jump to avoid enemies" + pulsing hand. */
export class Tutorial {
  private overlay: HTMLDivElement;
  private text: HTMLDivElement;
  private hand: HTMLDivElement;

  constructor(private root: HTMLElement, private skin: Skin) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.text = document.createElement('div');
    this.text.className = 'tutorial-text';
    this.hand = document.createElement('div');
    this.hand.className = 'tutorial-hand';
    this.hand.style.backgroundImage = `url(${skin.assets.tapHand})`;
    this.overlay.append(this.text, this.hand);
    this.root.appendChild(this.overlay);
  }

  show(kind: 'start' | 'jump'): void {
    this.text.textContent = kind === 'start' ? this.skin.copy.start : this.skin.copy.jump;
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
  }

  destroy(): void {
    this.overlay.remove();
  }
}
