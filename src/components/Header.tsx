import React from 'react';
import { Volume2, VolumeX, Wallet, Gift, UserCheck } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  tonBalance: number;
  activeAvatar: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenWallet: () => void;
  onOpenFaucet: () => void;
  walletAddress: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  tonBalance,
  activeAvatar,
  isMuted,
  onToggleMute,
  onOpenWallet,
  onOpenFaucet,
  walletAddress,
}) => {
  return (
    <header className="bg-[#0a0a16]/90 backdrop-blur-md border-b border-[#1a1a2e] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 shrink-0">
            🎰
          </div>
          <div>
            <div className="font-extrabold text-lg leading-tight bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              StickChop Casino
            </div>
            <div className="text-[11px] font-semibold text-gray-400 tracking-wider">
              CRYPTO SPIN & STICKERS
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sounds.playClick();
            }}
            className="p-2 rounded-xl bg-[#141428] hover:bg-[#1f1f3a] border border-[#252542] text-gray-300 hover:text-white transition-colors"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            aria-label="Переключить звук"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Free Faucet button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFaucet();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Кран</span>
          </button>

          {/* TON balance badge */}
          <div className="flex items-center gap-2 bg-[#141428] border border-[#252542] px-3.5 py-1.5 rounded-full text-sm">
            <span className="text-base">💎</span>
            <span className="font-bold text-white font-mono tabular-nums">
              {tonBalance.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 font-semibold">TON</span>
          </div>

          {/* Equipped Sticker Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-[#1b1b36] border border-purple-500/50 flex items-center justify-center text-lg shadow-sm"
            title="Ваш активный стикер"
          >
            {activeAvatar}
          </div>

          {/* Connect Wallet / Profile */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenWallet();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-pink-500/20 transition cursor-pointer"
          >
            {walletAddress ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span className="font-mono">{walletAddress.slice(0, 4)}...{walletAddress.slice(-3)}</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Войти</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
