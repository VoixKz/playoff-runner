import { BALANCE_COUNTUP_MS, COUNTDOWN_SECONDS } from '../config/constants';
import type { Skin } from '../config/skins/types';

/** Win/lose end card: reward art, balance count-up, 60s countdown, CTA → store. */
export class EndCard {
  private overlay?: HTMLDivElement;

  constructor(private root: HTMLElement, private skin: Skin, private onCta: () => void) {}

  show(result: 'win' | 'lose', amount: number): void {
    const win = result === 'win';
    const c = this.skin.copy;

    const overlay = document.createElement('div');
    overlay.className = 'end-overlay';
    this.overlay = overlay;

    const title = el('div', 'end-title', win ? c.winTitle : c.loseTitle);
    const subtitle = el('div', 'end-subtitle', win ? c.winSubtitle : c.loseSubtitle);

    const wrapper = el('div', 'reward-wrapper');
    const lights = el('div', 'lights-effect');
    lights.style.backgroundImage = `url(${this.skin.assets.lightRays})`;
    const card = el('div', 'reward-card');
    card.style.backgroundImage = `url(${this.skin.assets.rewardCard})`;
    const amountEl = el('div', 'end-amount', `${this.skin.theme.currency}0.00`);
    wrapper.append(lights, card);

    const countdown = el('div', 'countdown', '');
    const cta = el('div', `cta-button${win ? '' : ' lose'}`, c.cta);
    cta.addEventListener('click', () => this.onCta());

    const disclaimer = el('div', 'disclaimer', c.disclaimer);

    overlay.append(title, subtitle, wrapper, amountEl, countdown, cta, disclaimer);
    this.root.appendChild(overlay);

    // animate in
    requestAnimationFrame(() => {
      card.classList.add('bounce');
      lights.style.opacity = '1';
    });
    setTimeout(() => this.countUp(amountEl, amount), 600);
    this.startCountdown(countdown, c.countdown);
  }

  private countUp(el: HTMLElement, target: number): void {
    const start = performance.now();
    const cur = this.skin.theme.currency;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / BALANCE_COUNTUP_MS);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      el.textContent = `${cur}${(target * eased).toFixed(2)}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private startCountdown(el: HTMLElement, label: string): void {
    let remaining = COUNTDOWN_SECONDS;
    const render = () => {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `${label} (${m}:${s})`;
    };
    render();
    const id = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(id);
        el.style.display = 'none';
        return;
      }
      render();
    }, 1000);
  }

  destroy(): void {
    this.overlay?.remove();
  }
}

function el(tag: string, className: string, text?: string): HTMLDivElement {
  const e = document.createElement(tag) as HTMLDivElement;
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}
