export interface CryptoBalances {
  ton: number;
  usdt: number;
  not: number;
  dogs: number;
  spins: number;
}

export type CryptoCurrency = 'ton' | 'usdt' | 'not' | 'dogs';

export interface WheelPrize {
  id: number;
  label: string;
  sublabel: string;
  type: 'crypto' | 'spins' | 'jackpot';
  currency?: CryptoCurrency;
  amount?: number;
  spinsAmount?: number;
  color: string;
  accentColor: string;
  icon: string;
}

export type StickerRarity = 'COMMON' | 'RARE' | 'EPIC' | 'SECRET';

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  rarity: StickerRarity;
  currency: CryptoCurrency;
  price: number;
  description: string;
}

export interface HistoryItem {
  id: string;
  game: 'spin' | 'slots' | 'roulette' | 'blackjack' | 'shop';
  title: string;
  details: string;
  bet?: string;
  multiplier?: number;
  prize: string;
  isWin: boolean;
  timestamp: number;
}
