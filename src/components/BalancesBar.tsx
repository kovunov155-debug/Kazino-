import React from 'react';
import { CryptoBalances } from '../types';
import { PlusCircle, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BalancesBarProps {
  balances: CryptoBalances;
  onOpenFaucet: () => void;
  onOpenBuySpins: () => void;
}

export const BalancesBar: React.FC<BalancesBarProps> = ({
  balances,
  onOpenFaucet,
  onOpenBuySpins,
}) => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* TON */}
        <div className="casino-card rounded-2xl p-4 text-center relative overflow-hidden group border border-cyan-500/40 hover:border-cyan-400 shadow-lg shadow-cyan-500/10 transition">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">💎</div>
          <div className="text-2xl font-black font-mono tabular-nums text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
            {balances.ton.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-cyan-400/80 mt-0.5 tracking-wider">TONCOIN</div>
        </div>

        {/* USDT */}
        <div className="casino-card rounded-2xl p-4 text-center relative overflow-hidden group border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-500/10 transition">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">💵</div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            {balances.usdt.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-emerald-400/80 mt-0.5 tracking-wider">USDT TRC20</div>
        </div>

        {/* NOT */}
        <div className="casino-card rounded-2xl p-4 text-center relative overflow-hidden group border border-violet-500/40 hover:border-violet-400 shadow-lg shadow-violet-500/10 transition">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">⚡</div>
          <div className="text-2xl font-black font-mono tabular-nums text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
            {Math.floor(balances.not).toLocaleString('ru-RU')}
          </div>
          <div className="text-xs font-bold text-violet-400/80 mt-0.5 tracking-wider">NOTCOIN</div>
        </div>

        {/* DOGS */}
        <div className="casino-card rounded-2xl p-4 text-center relative overflow-hidden group border border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-500/10 transition">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🐶</div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
            {Math.floor(balances.dogs).toLocaleString('ru-RU')}
          </div>
          <div className="text-xs font-bold text-amber-400/80 mt-0.5 tracking-wider">DOGS COIN</div>
        </div>
      </div>

      {/* Mini Banner: Free Spins & Refill Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-[#111124] border border-[#22223f] rounded-xl px-4 py-2.5 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-pink-400 font-bold">🎰 Доступно вращений:</span>
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-mono font-bold px-2 py-0.5 rounded-full text-xs">
            {balances.spins} СПИН{balances.spins === 1 ? '' : balances.spins >= 2 && balances.spins <= 4 ? 'А' : 'ОВ'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenBuySpins();
            }}
            className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Купить спины</span>
          </button>
          <span className="text-gray-600">·</span>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFaucet();
            }}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Бесплатное пополнение (Кран)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
