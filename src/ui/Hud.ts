import { MAX_HP } from '../config/constants';
import type { Skin } from '../config/skins/types';

/** Top HUD: hearts + money badge, plus fly-to-counter and praise popups. */
export class Hud {
  private hearts: HTMLDivElement;
  private badge: HTMLDivElement;
  private score: HTMLDivElement;

  constructor(private root: HTMLElement, private skin: Skin) {
    this.hearts = document.createElement('div');
    this.hearts.className = 'hp-container';

    this.badge = document.createElement('div');
    // skin id as a class so the amount can sit INSIDE the PayPal card (original)
    // or beside the full-graphic card (solana).
    this.badge.className = `money-badge ${skin.id}`;
    const img = document.createElement('img');
    img.src = skin.assets.rewardCard;
    this.score = document.createElement('div');
    this.score.id = 'score-display';
    this.score.style.setProperty('--counter-color', skin.theme.counterTextColor);
    this.score.textContent = `${skin.theme.currency}0`;
    this.badge.append(img, this.score);

    this.root.append(this.hearts, this.badge);
    this.renderHearts(MAX_HP);
  }

  renderHearts(hp: number): void {
    this.hearts.innerHTML = '';
    for (let i = 0; i < MAX_HP; i++) {
      const h = document.createElement('span');
      h.className = i < hp ? 'heart' : 'heart empty';
      h.textContent = '❤️';
      this.hearts.appendChild(h);
    }
  }

  setScore(value: number): void {
    this.score.textContent = `${this.skin.theme.currency}${Math.floor(value)}`;
    this.score.classList.remove('pulse');
    void this.score.offsetWidth; // restart animation
    this.score.classList.add('pulse');
  }

  /** Animate a pickup flying from (screenX,screenY) into the badge. */
  flyToCounter(screenX: number, screenY: number, kind: 'dollar' | 'paypal'): void {
    const fly = document.createElement('div');
    fly.className = 'flying-collectible';
    fly.style.backgroundImage = `url(${kind === 'dollar' ? this.skin.assets.dollar : this.skin.assets.paypalCard})`;
    fly.style.left = `${screenX - 22}px`;
    fly.style.top = `${screenY - 22}px`;
    this.root.appendChild(fly);
    const rect = this.badge.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2 - 22;
    const targetY = rect.top + rect.height / 2 - 22;
    requestAnimationFrame(() => {
      fly.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
      fly.style.transform = `translate(${targetX - (screenX - 22)}px, ${targetY - (screenY - 22)}px) scale(0.4) rotate(360deg)`;
      fly.style.opacity = '0.2';
    });
    setTimeout(() => fly.remove(), 450);
  }

  praise(): void {
    const el = document.createElement('div');
    el.className = 'praise';
    const list = this.skin.copy.praises;
    el.textContent = list[Math.floor(Math.random() * list.length)];
    this.root.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  destroy(): void {
    this.hearts.remove();
    this.badge.remove();
  }
}
