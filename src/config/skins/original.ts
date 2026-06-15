// Faithful clone skin — the assets extracted from the reference playable.
import type { Skin } from './types';

import background from '../../../assets/original/background.png';
import playerTex from '../../../assets/original/player.png';
import playerAtlas from '../../../assets/original/player.atlas.json';
import enemyTex from '../../../assets/original/enemy.png';
import enemyAtlas from '../../../assets/original/enemy.atlas.json';
import dollar from '../../../assets/original/dollar.png';
import paypalCard from '../../../assets/original/paypal-logo.webp';
import finishTape from '../../../assets/original/finish-tape.png';
import obstacle from '../../../assets/original/obstacle-cone.webp';
import obstacleGlow from '../../../assets/original/obstacle-glow.webp';
import tree1 from '../../../assets/original/tree-1.png';
import tree2 from '../../../assets/original/tree-2.png';
import bush1 from '../../../assets/original/bush-1.png';
import bush2 from '../../../assets/original/bush-2.png';
import bush3 from '../../../assets/original/bush-3.png';
import lamp from '../../../assets/original/lamp.png';
import confetti1 from '../../../assets/original/confetti-1.png';
import confetti2 from '../../../assets/original/confetti-2.png';
import confetti3 from '../../../assets/original/confetti-3.png';
import confetti4 from '../../../assets/original/confetti-4.png';
import confetti5 from '../../../assets/original/confetti-5.png';
import confetti6 from '../../../assets/original/confetti-6.png';
import tapHand from '../../../assets/original/tap-hand.png';
import failBadge from '../../../assets/original/fail-badge.png';
import rewardCard from '../../../assets/original/paypal-card.webp';
import ctaButton from '../../../assets/original/cta-button.png';
import lightRays from '../../../assets/original/light-rays.png';
import bannerPortrait from '../../../assets/original/banner-portrait.webp';
import bannerLandscape from '../../../assets/original/banner-landscape.webp';
import gameFont from '../../../assets/original/game-font.ttf';

import sfxJump from '../../../assets/original/sfx-jump.mp3';
import sfxHit from '../../../assets/original/sfx-hit.mp3';
import sfxHurt from '../../../assets/original/sfx-hurt.mp3';
import sfxCollect from '../../../assets/original/sfx-collect.mp3';
import sfxWin from '../../../assets/original/sfx-win.mp3';
import sfxLose from '../../../assets/original/sfx-lose.mp3';
import music from '../../../assets/original/music.mp3';

const skin: Skin = {
  id: 'original',
  assets: {
    background,
    player: { texture: playerTex, atlas: playerAtlas },
    enemy: { texture: enemyTex, atlas: enemyAtlas },
    dollar,
    paypalCard,
    finishTape,
    obstacle,
    obstacleGlow,
    trees: [tree1, tree2],
    bushes: [bush1, bush2, bush3],
    lamp,
    confetti: [confetti1, confetti2, confetti3, confetti4, confetti5, confetti6],
    tapHand,
    failBadge,
    rewardCard,
    ctaButton,
    lightRays,
    bannerPortrait,
    bannerLandscape,
    font: gameFont,
  },
  audio: {
    jump: sfxJump,
    hit: sfxHit,
    hurt: sfxHurt,
    collect: sfxCollect,
    win: sfxWin,
    lose: sfxLose,
    music,
  },
  theme: {
    bgColor: 0xfce4d6,
    fontFamily: 'GameFont',
    counterTextColor: '#003087',
    ctaGradient: ['#ffe44d', '#ff9500'],
    ctaBorder: '#e07800',
    currency: '$',
  },
  copy: {
    start: 'Tap to start earning!',
    jump: 'Jump to avoid enemies',
    winTitle: 'Congratulations!',
    winSubtitle: 'Choose your reward!',
    loseTitle: "You didn't make it!",
    loseSubtitle: 'Try again on the app!',
    cta: 'Install and Earn',
    reward: 'Choose your reward!',
    countdown: 'Next payment in one minute',
    disclaimer:
      'The actual payment depends on playing and interacting with the app.',
    praises: ['Awesome!', 'Fantastic!', 'Great!', 'Perfect!'],
  },
  store: {
    google:
      'https://play.google.com/store/apps/details?id=ae.goragaming.playoff.blocks.game.make.earn.money.rewarded',
    apple: 'https://apps.apple.com/app/id6444492155',
  },
};

export default skin;
