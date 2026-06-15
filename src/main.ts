import './ui/ui.css';
import { GameApp } from './core/App';
import { AudioManager } from './core/audio/AudioManager';
import { PlayableSDK } from './core/sdk/PlayableSDK';
import { GameController } from './game/GameController';
import { skin } from './skin';

async function boot(): Promise<void> {
  // Inject the skin font and wait for it so HUD text renders correctly from frame 1.
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:'GameFont';src:url(${skin.assets.font}) format('truetype');font-display:swap;}`;
  document.head.appendChild(style);
  try {
    await document.fonts.load('16px "GameFont"');
    await document.fonts.ready;
  } catch {
    /* font load is best-effort; never block startup */
  }

  const app = new GameApp();
  await app.init(skin.theme.bgColor);

  const audio = new AudioManager(skin.audio);
  await audio.init();

  const sdk = new PlayableSDK(skin.store);
  const uiRoot = document.getElementById('ui-container')!;

  const game = new GameController(app, skin, audio, sdk, uiRoot);
  await game.init();
  (window as unknown as { __game: GameController }).__game = game;
}

void boot();
