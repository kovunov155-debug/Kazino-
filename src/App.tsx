/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CryptoBalances, CryptoCurrency, HistoryItem, Sticker, WheelPrize } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BalancesBar } from './components/BalancesBar';
import { SpinWheel } from './components/SpinWheel';
import { GamesSection } from './components/GamesSection';
import { StickerShop } from './components/StickerShop';
import { HistorySection } from './components/HistorySection';
import { ResultModal, BuySpinsModal, FaucetModal, WalletModal } from './components/Modals';
import { sounds } from './utils/audio';

export default function App() {
  // 1. BALANCES
  const [balances, setBalances] = useState<CryptoBalances>(() => {
    const saved = localStorage.getItem('stickchop_balances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      ton: 3.5,
      usdt: 10.0,
      not: 2000,
      dogs: 10000,
      spins: 5,
    };
  });

  // Save balances on change
  useEffect(() => {
    localStorage.setItem('stickchop_balances', JSON.stringify(balances));
  }, [balances]);

  // 2. ACTIVE TAB
  const [activeTab, setActiveTab] = useState<'spin' | 'games' | 'shop' | 'history'>('spin');

  // 3. STICKERS & AVATAR
  const [ownedStickers, setOwnedStickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('stickchop_stickers');
    return saved ? JSON.parse(saved) : ['cyber-cat'];
  });

  const [activeAvatar, setActiveAvatar] = useState<string>(() => {
    return localStorage.getItem('stickchop_avatar') || '🐱';
  });

  // 4. HISTORY
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('stickchop_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('stickchop_history', JSON.stringify(history));
  }, [history]);

  // 5. AUDIO & WALLET
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return localStorage.getItem('stickchop_wallet') || null;
  });

  // 6. MODALS
  const [winningPrize, setWinningPrize] = useState<WheelPrize | null>(null);
  const [winMultiplier, setWinMultiplier] = useState<number>(1);
  const [isBuySpinsOpen, setIsBuySpinsOpen] = useState<boolean>(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false);
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);

  const toggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  // Helper to update specific balance
  const updateBalance = (currency: CryptoCurrency, delta: number) => {
    setBalances((prev) => ({
      ...prev,
      [currency]: Math.max(0, Number((prev[currency] + delta).toFixed(2))),
    }));
  };

  // Spin deduction handler
  const handleDeductSpin = (): boolean => {
    if (balances.spins > 0) {
      setBalances((prev) => ({ ...prev, spins: prev.spins - 1 }));
      return true;
    }
    if (balances.ton >= 0.2) {
      updateBalance('ton', -0.2);
      return true;
    }
    return false;
  };

  // Wheel win handler
  const handleWheelWin = (prize: WheelPrize, multiplier: number) => {
    setWinMultiplier(multiplier);
    setWinningPrize(prize);

    let prizeText = prize.label;

    if (prize.type === 'jackpot') {
      const tonWon = 10 * multiplier;
      const dogsWon = 25000 * multiplier;
      setBalances((prev) => ({
        ...prev,
        ton: prev.ton + tonWon,
        dogs: prev.dogs + dogsWon,
      }));
      prizeText = `ДЖЕКПОТ! +${tonWon} TON & +${dogsWon.toLocaleString('ru-RU')} DOGS`;
    } else if (prize.type === 'crypto' && prize.currency && prize.amount) {
      const totalAmount = prize.amount * multiplier;
      updateBalance(prize.currency, totalAmount);
      prizeText = `+${totalAmount} ${prize.currency.toUpperCase()}`;
    } else if (prize.type === 'spins' && prize.spinsAmount) {
      const extraSpins = prize.spinsAmount * multiplier;
      setBalances((prev) => ({ ...prev, spins: prev.spins + extraSpins }));
      prizeText = `+${extraSpins} СПИНОВ`;
    }

    // Log history
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game: 'spin',
      title: 'Крипто-Спин',
      details: prize.sublabel,
      multiplier,
      prize: prizeText,
      isWin: true,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  // Sticker buy handler
  const handleBuySticker = (sticker: Sticker): boolean => {
    const userFunds = balances[sticker.currency];
    if (userFunds < sticker.price) {
      return false;
    }

    updateBalance(sticker.currency, -sticker.price);
    const nextOwned = [...ownedStickers, sticker.id];
    setOwnedStickers(nextOwned);
    localStorage.setItem('stickchop_stickers', JSON.stringify(nextOwned));

    // Log purchase
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game: 'shop',
      title: `Покупка: ${sticker.name}`,
      details: `${sticker.rarity} стикер`,
      bet: `${sticker.price} ${sticker.currency.toUpperCase()}`,
      prize: sticker.emoji,
      isWin: true,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    return true;
  };

  // Equip avatar handler
  const handleEquipSticker = (emoji: string) => {
    setActiveAvatar(emoji);
    localStorage.setItem('stickchop_avatar', emoji);
  };

  // Buy spins bundle handler
  const handleBuySpinsBundle = (count: number, currency: CryptoCurrency, cost: number): boolean => {
    if (balances[currency] < cost) return false;
    updateBalance(currency, -cost);
    setBalances((prev) => ({ ...prev, spins: prev.spins + count }));

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game: 'shop',
      title: `Пакет спинов: +${count}`,
      details: 'Покупка вращений',
      bet: `${cost} ${currency.toUpperCase()}`,
      prize: `+${count} СПИНОВ`,
      isWin: true,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
    return true;
  };

  // Free Faucet claim handler
  const handleClaimFaucet = () => {
    setBalances((prev) => ({
      ton: prev.ton + 2.5,
      usdt: prev.usdt + 10.0,
      not: prev.not + 2500,
      dogs: prev.dogs + 10000,
      spins: prev.spins + 5,
    }));

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game: 'shop',
      title: 'Демо-Кран Пополнение',
      details: 'Бесплатные токены',
      bet: '0 TON',
      prize: '+2.5 TON, +10 USDT, +2.5k NOT, +10k DOGS, +5 Спинов',
      isWin: true,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  // Generic Game History logger
  const handleLogHistory = (
    game: 'slots' | 'roulette' | 'blackjack',
    title: string,
    details: string,
    bet: string,
    prize: string,
    isWin: boolean
  ) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game,
      title,
      details,
      bet,
      prize,
      isWin,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* 1. HEADER */}
      <Header
        tonBalance={balances.ton}
        activeAvatar={activeAvatar}
        isMuted={isMuted}
        onToggleMute={toggleSound}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenFaucet={() => setIsFaucetOpen(true)}
        walletAddress={walletAddress}
      />

      {/* 2. HERO */}
      <Hero
        onSelectTab={setActiveTab}
        onOpenFaucet={() => setIsFaucetOpen(true)}
        spinsLeft={balances.spins}
      />

      {/* 3. MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 pb-20 w-full flex-1">
        {/* Balances Dashboard Bar */}
        <BalancesBar
          balances={balances}
          onOpenFaucet={() => setIsFaucetOpen(true)}
          onOpenBuySpins={() => setIsBuySpinsOpen(true)}
        />

        {/* Navigation Tabs (Exactly matching user's design) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('spin');
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'spin'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#181830] hover:bg-[#202040] text-gray-300'
            }`}
          >
            🎰 Крипто-Спин
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('games');
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#181830] hover:bg-[#202040] text-gray-300'
            }`}
          >
            🎮 Игры
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('shop');
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#181830] hover:bg-[#202040] text-gray-300'
            }`}
          >
            🛍️ Магазин стикеров
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('history');
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-[#181830] hover:bg-[#202040] text-gray-300'
            }`}
          >
            📜 История
          </button>
        </div>

        {/* Tab 1: SPIN WHEEL */}
        {activeTab === 'spin' && (
          <SpinWheel
            spinsLeft={balances.spins}
            tonBalance={balances.ton}
            onWin={handleWheelWin}
            onOpenBuySpins={() => setIsBuySpinsOpen(true)}
            onDeductSpin={handleDeductSpin}
          />
        )}

        {/* Tab 2: GAMES (Slots, Roulette, Blackjack) */}
        {activeTab === 'games' && (
          <GamesSection
            balances={balances}
            onUpdateBalance={updateBalance}
            onLogHistory={handleLogHistory}
          />
        )}

        {/* Tab 3: STICKER SHOP */}
        {activeTab === 'shop' && (
          <StickerShop
            balances={balances}
            ownedStickers={ownedStickers}
            activeAvatar={activeAvatar}
            onBuySticker={handleBuySticker}
            onEquipSticker={handleEquipSticker}
          />
        )}

        {/* Tab 4: HISTORY */}
        {activeTab === 'history' && (
          <HistorySection
            history={history}
            onClearHistory={() => setHistory([])}
          />
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-[#1a1a2e] py-8 text-center text-gray-500 text-xs sm:text-sm bg-[#06060c]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2 font-bold text-gray-400">
            <span>🎰 StickChop Casino</span>
            <span>•</span>
            <span>CRYPTO SPIN</span>
          </div>
          <p>Демо-версия для развлечения • Нет реальных денег, азартных выплат или финансовых услуг.</p>
          <p className="mt-1 text-gray-600">Все крипто-балансы TON, USDT, NOT, DOGS являются внутриигровой симуляцией.</p>
        </div>
      </footer>

      {/* MODALS */}
      <ResultModal
        prize={winningPrize}
        multiplier={winMultiplier}
        onClose={() => setWinningPrize(null)}
      />

      <BuySpinsModal
        isOpen={isBuySpinsOpen}
        balances={balances}
        onClose={() => setIsBuySpinsOpen(false)}
        onAddSpins={handleBuySpinsBundle}
      />

      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onClaimFaucet={handleClaimFaucet}
      />

      <WalletModal
        isOpen={isWalletOpen}
        walletAddress={walletAddress}
        onClose={() => setIsWalletOpen(false)}
        onConnectWallet={(name) => {
          const addr = `EQD${Math.random().toString(36).substring(2, 8).toUpperCase()}...8x9F (${name})`;
          setWalletAddress(addr);
          localStorage.setItem('stickchop_wallet', addr);
        }}
        onDisconnect={() => {
          setWalletAddress(null);
          localStorage.removeItem('stickchop_wallet');
        }}
      />
    </div>
  );
}
