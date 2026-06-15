// Solana / "Toly" reskin (⭐ star task). New background, SOL-coin + crypto-card
// collectibles, neon finish tape, SOL-wallet end card, Solana banner, and a
// stylized neon recolor of the runner. Player/enemy animation, props, audio and
// font are inherited from the original (a Nano-Banana Toly sheet can drop into
// assets/solana/player.* to fully replace the character art).
import original from './original';
import type { Skin } from './types';

import background from '../../../assets/solana/background.png';
import solCoin from '../../../assets/solana/sol-coin.png';
import cryptoCard from '../../../assets/solana/crypto-card.png';
import finishTape from '../../../assets/solana/finish-tape.png';
import rewardCard from '../../../assets/solana/reward-card.png';
import bannerPortrait from '../../../assets/solana/banner-portrait.png';
import bannerLandscape from '../../../assets/solana/banner-landscape.png';

const skin: Skin = {
  ...original,
  id: 'solana',
  assets: {
    ...original.assets,
    background,
    dollar: solCoin,
    paypalCard: cryptoCard,
    finishTape,
    rewardCard,
    bannerPortrait,
    bannerLandscape,
  },
  playerRecolor: { hue: 150, saturate: 0.45, brightness: 1.06 },
  theme: {
    ...original.theme,
    bgColor: 0x0a0a18, // neon night
    counterTextColor: '#14F195',
    ctaGradient: ['#9945FF', '#14F195'],
    ctaBorder: '#6d28d9',
    currency: '$',
    propTint: 0x3a2a5e, // dark-purple silhouettes so scenery fits the night
  },
  copy: {
    ...original.copy,
    start: 'Tap to start stacking SOL!',
    jump: 'Jump over the FUD',
    winTitle: 'GM, you made it!',
    winSubtitle: 'Claim your SOL rewards!',
    loseTitle: 'Rugged!',
    loseSubtitle: 'Try again in the app!',
    cta: 'Install and Earn SOL',
    reward: 'Claim your SOL rewards!',
    countdown: 'Next airdrop in one minute',
    disclaimer:
      'The actual reward depends on playing and interacting with the app.',
  },
};

export default skin;
