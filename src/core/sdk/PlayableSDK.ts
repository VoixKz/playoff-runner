// Playable-ad SDK adapter: MRAID / Facebook Playable / fallback, plus the
// viewable→pause bridge (reference class `qp`). Degrades gracefully outside any SDK.

interface Mraid {
  getState?: () => string;
  addEventListener: (e: string, fn: (...a: unknown[]) => void) => void;
  isViewable?: () => boolean;
  openStoreUrl?: (url: string) => void;
  open?: (url: string) => void;
  close?: () => void;
}

declare global {
  interface Window {
    mraid?: Mraid;
    FbPlayableAd?: { onCTAClick: (url?: string) => void };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    super_html?: { download?: () => void; game_end?: () => void };
    playboxCTA?: (url: string) => void;
  }
}

export class PlayableSDK {
  private viewable = true;
  constructor(private readonly store: { google: string; apple: string }) {}

  init(onViewableChange: (viewable: boolean) => void): void {
    const mraid = window.mraid;
    if (!mraid) return; // not in an MRAID container → nothing to wire
    const wire = () => {
      mraid.addEventListener('viewableChange', (v: unknown) => {
        this.viewable = !!v;
        onViewableChange(this.viewable);
      });
    };
    if (mraid.getState?.() === 'loading') {
      mraid.addEventListener('ready', wire);
    } else {
      wire();
    }
  }

  private storeUrl(): string {
    return /Android/i.test(navigator.userAgent) ? this.store.google : this.store.apple;
  }

  /** CTA click → store, via whichever bridge is present. */
  download(): void {
    const url = this.storeUrl();
    try {
      if (window.FbPlayableAd) return window.FbPlayableAd.onCTAClick(url);
      if (window.playboxCTA) return window.playboxCTA(url);
      const mraid = window.mraid;
      if (mraid?.openStoreUrl) return mraid.openStoreUrl(url);
      if (mraid?.open) return mraid.open(url);
      if (window.super_html?.download) return window.super_html.download();
    } catch {
      /* fall through */
    }
    window.open(url, '_blank');
  }
}
