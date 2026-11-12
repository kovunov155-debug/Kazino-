import React, { useState } from 'react';
import { WheelPrize, CryptoBalances, CryptoCurrency } from '../types';
import { sounds } from '../utils/audio';
import { X, Check, Gift, Sparkles, Wallet, Zap, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

// 1. RESULT MODAL
interface ResultModalProps {
  prize: WheelPrize | null;
  multiplier: number;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ prize, multiplier, onClose }) => {
  if (!prize) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="casino-card neon-border rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="text-6xl mb-4 animate-bounce">{prize.icon}</div>
        <h3 className="text-2xl font-black text-white mb-2">
          {prize.type === 'jackpot' ? '🔥 ДЖЕКПОТ! 🔥' : 'Поздравляем!'}
        </h3>
        <div className="text-xl font-black text-amber-400 font-mono mb-2">
          {prize.label}
        </div>
        <p className="text-gray-300 text-sm mb-6">
          {multiplier > 1 ? `Выигрыш с множителем x${multiplier}!` : 'Приз зачислен на ваш баланс.'}
        </p>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-base shadow-lg shadow-pink-500/30 transition cursor-pointer"
        >
          Забрать выигрыш
        </button>
      </div>
    </div>
  );
};

// 2. BUY SPINS MODAL
interface BuySpinsModalProps {
  isOpen: boolean;
  balances: CryptoBalances;
  onClose: () => void;
  onAddSpins: (count: number, currency: CryptoCurrency, cost: number) => boolean;
}

export const BuySpinsModal: React.FC<BuySpinsModalProps> = ({
  isOpen,
  balances,
  onClose,
  onAddSpins,
}) => {
  if (!isOpen) return null;

  const SPIN_PACKS = [
    { count: 3, currency: 'ton' as CryptoCurrency, cost: 0.5, bonus: '' },
    { count: 10, currency: 'ton' as CryptoCurrency, cost: 1.5, bonus: '+1 БОНУС' },
    { count: 25, currency: 'usdt' as CryptoCurrency, cost: 5.0, bonus: '+5 БОНУС' },
    { count: 50, currency: 'not' as CryptoCurrency, cost: 2000, bonus: 'МЕГА ПАК' },
  ];

  const handlePurchase = (count: number, currency: CryptoCurrency, cost: number) => {
    const success = onAddSpins(count, currency, cost);
    if (success) {
      sounds.playCoin();
      confetti({ particleCount: 50, spread: 60 });
      alert(`Успешно приобретено ${count} спинов!`);
      onClose();
    } else {
      alert(`Недостаточно средств на балансе ${currency.toUpperCase()}!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="casino-card neon-border rounded-3xl p-6 sm:p-8 max-w-md w-full relative">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-[#1a1a36]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-black text-white">Купить спины</h3>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Покупайте пакеты вращений для Колеса Фортуны за любую криптовалюту!
        </p>

        <div className="space-y-3 mb-6">
          {SPIN_PACKS.map((pack, idx) => (
            <div
              key={idx}
              className="bg-[#121226] hover:bg-[#181832] border border-[#242448] rounded-2xl p-4 flex items-center justify-between gap-4 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white font-mono">
                    {pack.count} Спинов
                  </span>
                  {pack.bonus && (
                    <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pack.bonus}
                    </span>
                  )}
                </div>
                <div className="text-xs text-amber-400 font-mono mt-0.5">
                  Цена: {pack.cost} {pack.currency.toUpperCase()}
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pack.count, pack.currency, pack.cost)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-bold text-xs transition cursor-pointer"
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. FAUCET MODAL
interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimFaucet: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  onClaimFaucet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="casino-card neon-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center relative">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-[#1a1a36]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto mb-4">
          🎁
        </div>

        <h3 className="text-2xl font-black text-white mb-2">Бесплатный Демо-Кран</h3>
        <p className="text-gray-300 text-xs mb-6 leading-relaxed">
          Нажмите кнопку ниже, чтобы мгновенно пополнить все балансы и получить бонусные вращения!
        </p>

        <div className="bg-[#101022] border border-[#202040] rounded-2xl p-4 text-xs space-y-2 mb-6 text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">💎 TON:</span>
            <span className="font-mono text-cyan-300 font-bold">+2.50 TON</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">💵 USDT:</span>
            <span className="font-mono text-emerald-300 font-bold">+10.00 USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">⚡ NOT:</span>
            <span className="font-mono text-violet-300 font-bold">+2,500 NOT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🐶 DOGS:</span>
            <span className="font-mono text-amber-300 font-bold">+10,000 DOGS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🎰 Спины:</span>
            <span className="font-mono text-pink-400 font-bold">+5 Спинов</span>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playJackpot();
            confetti({ particleCount: 70, spread: 60 });
            onClaimFaucet();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 transition cursor-pointer"
        >
          Забрать бонусные монеты
        </button>
      </div>
    </div>
  );
};

// 4. WALLET / PROFILE MODAL
interface WalletModalProps {
  isOpen: boolean;
  walletAddress: string | null;
  onClose: () => void;
  onConnectWallet: (type: string) => void;
  onDisconnect: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  walletAddress,
  onClose,
  onConnectWallet,
  onDisconnect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="casino-card neon-border rounded-3xl p-6 sm:p-8 max-w-sm w-full relative">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl bg-[#1a1a36]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-black text-white">
            {walletAddress ? 'Мой аккаунт' : 'Подключить кошелек'}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          {walletAddress
            ? 'Кошелек успешно подключен к StickChop Casino'
            : 'Выберите кошелек TON для синхронизации демо-аккаунта'}
        </p>

        {walletAddress ? (
          <div>
            <div className="bg-[#101022] border border-[#202040] rounded-2xl p-4 mb-6">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Подключенный адрес TON:
              </div>
              <div className="font-mono text-sm text-cyan-300 font-bold break-all">
                {walletAddress}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Верифицирован в сети TON</span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onDisconnect();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-sm transition cursor-pointer"
            >
              Отключить кошелек
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { id: 'tonkeeper', name: 'Tonkeeper', icon: '💎', desc: 'Самый популярный TON кошелек' },
              { id: 'telegram', name: 'Telegram Wallet', icon: '✈️', desc: 'Встроенный кошелек в Telegram' },
              { id: 'mytonwallet', name: 'MyTonWallet', icon: '🔷', desc: 'Быстрый десктоп и веб-кошелек' },
              { id: 'demo', name: 'Гостевой Демо-вход', icon: '🎰', desc: 'Быстрый вход без кошелька' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  sounds.playCoin();
                  onConnectWallet(w.name);
                  onClose();
                }}
                className="w-full bg-[#121226] hover:bg-[#181832] border border-[#242448] rounded-2xl p-3.5 flex items-center gap-3.5 text-left transition cursor-pointer"
              >
                <div className="text-2xl">{w.icon}</div>
                <div>
                  <div className="text-sm font-bold text-white">{w.name}</div>
                  <div className="text-[11px] text-gray-400">{w.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
