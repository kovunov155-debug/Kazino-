import React from 'react';
import { Sparkles, Dices, RefreshCw } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeroProps {
  onSelectTab: (tab: 'spin' | 'games' | 'shop' | 'history') => void;
  onOpenFaucet: () => void;
  spinsLeft: number;
}

export const Hero: React.FC<HeroProps> = ({ onSelectTab, onOpenFaucet, spinsLeft }) => {
  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-pink-600/15 to-orange-500/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Колесо Фортуны в Telegram & Web · Демо-режим</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-400 via-pink-500 to-purple-400 bg-clip-text text-transparent mb-4 tracking-tight">
          CRYPTO SPIN
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto mb-8 font-normal leading-relaxed">
          Крипто-колесо фортуны + Коллекционные стикеры TON. Крутите колесо, играйте в слоты и рулетку, собирайте редкие NFT стикеры!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onSelectTab('spin');
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black px-7 py-3 rounded-full shadow-lg shadow-orange-500/25 transition cursor-pointer text-sm sm:text-base"
          >
            <span>🎰</span>
            <span>Крутить колесо</span>
            {spinsLeft > 0 && (
              <span className="bg-slate-950 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-mono">
                {spinsLeft}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onSelectTab('games');
            }}
            className="flex items-center gap-2 border border-purple-500/50 hover:border-purple-400 bg-[#16162d]/80 hover:bg-[#20203f] px-6 py-3 rounded-full font-bold text-purple-200 transition cursor-pointer text-sm sm:text-base"
          >
            <Dices className="w-4 h-4 text-purple-400" />
            <span>Все игры</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenFaucet();
            }}
            className="flex sm:hidden items-center gap-1.5 px-5 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Пополнить демо</span>
          </button>
        </div>
      </div>
    </section>
  );
};
