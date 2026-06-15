// Solana / "Toly" reskin (⭐ star task).
// WIP: currently inherits the original art so the build stays green; the character,
// background, collectibles and end-card art are swapped for AI-generated Solana assets
// in the reskin phase. Theme colours + copy are already Solana-flavoured.
import original from './original';
import type { Skin } from './types';

const skin: Skin = {
  ...original,
  id: 'solana',
  theme: {
    ...original.theme,
    bgColor: 0x0a0a14, // deep space
    counterTextColor: '#14F195', // Solana green
    ctaGradient: ['#9945FF', '#14F195'],
    ctaBorder: '#6d28d9',
    currency: '$',
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
