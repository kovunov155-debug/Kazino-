import React, { useState } from 'react';
import { CryptoBalances, CryptoCurrency } from '../types';
import { sounds } from '../utils/audio';
import { Sparkles, RotateCw, Trophy, ShieldAlert, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamesSectionProps {
  balances: CryptoBalances;
  onUpdateBalance: (currency: CryptoCurrency, delta: number) => void;
  onLogHistory: (
    game: 'slots' | 'roulette' | 'blackjack',
    title: string,
    details: string,
    bet: string,
    prize: string,
    isWin: boolean
  ) => void;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  balances,
  onUpdateBalance,
  onLogHistory,
}) => {
  const [activeGame, setActiveGame] = useState<'slots' | 'roulette' | 'blackjack'>('slots');

  // ==========================================
  // 1. SLOTS STATE
  // ==========================================
  const SLOT_SYMBOLS = [
    { icon: '👑', name: 'Корона', multiplier: 25 },
    { icon: '💎', name: 'TON', multiplier: 10 },
    { icon: '💵', name: 'USDT', multiplier: 8 },
    { icon: '⚡', name: 'NOT', multiplier: 5 },
    { icon: '🐶', name: 'DOGS', multiplier: 4 },
    { icon: '🍒', name: 'Вишня', multiplier: 3 },
  ];

  const [slotReels, setSlotReels] = useState<[string, string, string]>(['💎', '👑', '💎']);
  const [slotBet, setSlotBet] = useState<number>(0.2);
  const [slotSpinning, setSlotSpinning] = useState<boolean>(false);
  const [slotWinMessage, setSlotWinMessage] = useState<string | null>(null);

  const spinSlots = () => {
    if (slotSpinning) return;
    if (balances.ton < slotBet) {
      alert('Недостаточно TON для ставки! Пополните демо баланс через Кран.');
      return;
    }

    // Deduct bet
    onUpdateBalance('ton', -slotBet);
    setSlotSpinning(true);
    setSlotWinMessage(null);
    sounds.playSpin();

    let spins = 0;
    const interval = setInterval(() => {
      setSlotReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].icon,
      ]);
      sounds.playTick(450 + Math.random() * 200);
      spins++;
      if (spins > 16) {
        clearInterval(interval);
        finalizeSlotSpin();
      }
    }, 100);
  };

  const finalizeSlotSpin = () => {
    // Generate final reels with fair probabilities
    const r1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    const r2 = Math.random() < 0.4 ? r1 : SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    const r3 = Math.random() < 0.25 ? r1 : SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];

    setSlotReels([r1.icon, r2.icon, r3.icon]);
    setSlotSpinning(false);

    if (r1.icon === r2.icon && r2.icon === r3.icon) {
      // 3 match
      const won = slotBet * r1.multiplier;
      onUpdateBalance('ton', won);
      sounds.playJackpot();
      confetti({ particleCount: 100, spread: 70 });
      setSlotWinMessage(`ДЖЕКПОТ 3x ${r1.icon}! Выигрыш +${won.toFixed(2)} TON (x${r1.multiplier})`);
      onLogHistory('slots', 'Слоты 3x Match', `3 совпадения: ${r1.icon}`, `${slotBet} TON`, `+${won.toFixed(2)} TON`, true);
    } else if (r1.icon === r2.icon || r2.icon === r3.icon || r1.icon === r3.icon) {
      // 2 match
      const matched = r1.icon === r2.icon ? r1 : r3;
      const won = slotBet * 1.5;
      onUpdateBalance('ton', won);
      sounds.playWin();
      setSlotWinMessage(`Пара ${matched.icon}! Выигрыш +${won.toFixed(2)} TON (x1.5)`);
      onLogHistory('slots', 'Слоты Пара', `2 совпадения: ${matched.icon}`, `${slotBet} TON`, `+${won.toFixed(2)} TON`, true);
    } else {
      setSlotWinMessage('Не повезло! Попробуйте еще раз.');
      onLogHistory('slots', 'Слоты', `${r1.icon} ${r2.icon} ${r3.icon}`, `${slotBet} TON`, '0 TON', false);
    }
  };

  // ==========================================
  // 2. ROULETTE STATE
  // ==========================================
  const [rouletteBetType, setRouletteBetType] = useState<'red' | 'black' | 'even' | 'odd' | 'zero'>('red');
  const [rouletteBetAmount, setRouletteBetAmount] = useState<number>(0.5);
  const [rouletteSpinning, setRouletteSpinning] = useState<boolean>(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [rouletteMessage, setRouletteMessage] = useState<string | null>(null);

  // Red numbers in European Roulette
  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  const spinRoulette = () => {
    if (rouletteSpinning) return;
    if (balances.ton < rouletteBetAmount) {
      alert('Недостаточно TON для ставки в рулетке!');
      return;
    }

    onUpdateBalance('ton', -rouletteBetAmount);
    setRouletteSpinning(true);
    setRouletteMessage(null);
    sounds.playSpin();

    let counter = 0;
    const interval = setInterval(() => {
      setRouletteResult(Math.floor(Math.random() * 37));
      sounds.playTick(500);
      counter++;
      if (counter > 20) {
        clearInterval(interval);
        const finalNumber = Math.floor(Math.random() * 37);
        setRouletteResult(finalNumber);
        setRouletteSpinning(false);
        checkRouletteWin(finalNumber);
      }
    }, 100);
  };

  const checkRouletteWin = (num: number) => {
    const isRed = RED_NUMBERS.includes(num);
    const isZero = num === 0;
    const isEven = num !== 0 && num % 2 === 0;
    const isOdd = num !== 0 && num % 2 !== 0;

    let won = 0;
    let winDescription = '';

    if (rouletteBetType === 'zero' && isZero) {
      won = rouletteBetAmount * 36;
      winDescription = `Выпало ЗЕРО (0)! Выигрыш x36 (+${won.toFixed(2)} TON)`;
    } else if (rouletteBetType === 'red' && isRed) {
      won = rouletteBetAmount * 2;
      winDescription = `Выпало КРАСНОЕ (${num})! Выигрыш x2 (+${won.toFixed(2)} TON)`;
    } else if (rouletteBetType === 'black' && !isRed && !isZero) {
      won = rouletteBetAmount * 2;
      winDescription = `Выпало ЧЕРНОЕ (${num})! Выигрыш x2 (+${won.toFixed(2)} TON)`;
    } else if (rouletteBetType === 'even' && isEven) {
      won = rouletteBetAmount * 2;
      winDescription = `Выпало ЧЕТНОЕ (${num})! Выигрыш x2 (+${won.toFixed(2)} TON)`;
    } else if (rouletteBetType === 'odd' && isOdd) {
      won = rouletteBetAmount * 2;
      winDescription = `Выпало НЕЧЕТНОЕ (${num})! Выигрыш x2 (+${won.toFixed(2)} TON)`;
    }

    if (won > 0) {
      onUpdateBalance('ton', won);
      sounds.playWin();
      confetti({ particleCount: 80, spread: 60 });
      setRouletteMessage(winDescription);
      onLogHistory('roulette', 'Рулетка', `Ставка на ${rouletteBetType}, выпало ${num}`, `${rouletteBetAmount} TON`, `+${won.toFixed(2)} TON`, true);
    } else {
      setRouletteMessage(`Выпало число ${num} (${isZero ? 'Зеро' : isRed ? 'Красное' : 'Черное'}). Ставка проиграла.`);
      onLogHistory('roulette', 'Рулетка', `Ставка на ${rouletteBetType}, выпало ${num}`, `${rouletteBetAmount} TON`, '0 TON', false);
    }
  };

  // ==========================================
  // 3. BLACKJACK STATE
  // ==========================================
  interface Card {
    suit: '♠' | '♥' | '♦' | '♣';
    val: string;
    num: number;
    color: string;
  }

  const [bjBet, setBjBet] = useState<number>(0.5);
  const [bjPlayerCards, setBjPlayerCards] = useState<Card[]>([]);
  const [bjDealerCards, setBjDealerCards] = useState<Card[]>([]);
  const [bjState, setBjState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [bjResult, setBjResult] = useState<string | null>(null);

  const getDeckCard = (): Card => {
    const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const s = suits[Math.floor(Math.random() * suits.length)];
    const v = values[Math.floor(Math.random() * values.length)];
    let num = parseInt(v);
    if (isNaN(num)) {
      num = v === 'A' ? 11 : 10;
    }
    return {
      suit: s,
      val: v,
      num,
      color: s === '♥' || s === '♦' ? 'text-red-500' : 'text-slate-100',
    };
  };

  const calculateHand = (hand: Card[]): number => {
    let total = hand.reduce((acc, c) => acc + c.num, 0);
    let aces = hand.filter((c) => c.val === 'A').length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  };

  const startBlackjack = () => {
    if (balances.ton < bjBet) {
      alert('Недостаточно TON для ставки в блэкджеке!');
      return;
    }

    onUpdateBalance('ton', -bjBet);
    sounds.playCard();

    const p1 = getDeckCard();
    const p2 = getDeckCard();
    const d1 = getDeckCard();
    const d2 = getDeckCard();

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setBjPlayerCards(pHand);
    setBjDealerCards(dHand);
    setBjState('playing');
    setBjResult(null);

    // Natural 21?
    if (calculateHand(pHand) === 21) {
      const won = bjBet * 2.5;
      onUpdateBalance('ton', won);
      sounds.playJackpot();
      setBjResult('БЛЭКДЖЕК! Натуральные 21 очко! + ' + won.toFixed(2) + ' TON');
      setBjState('ended');
      onLogHistory('blackjack', 'Блэкджек 21', 'Натуральный Блэкджек!', `${bjBet} TON`, `+${won.toFixed(2)} TON`, true);
    }
  };

  const hitCard = () => {
    sounds.playCard();
    const newCard = getDeckCard();
    const nextHand = [...bjPlayerCards, newCard];
    setBjPlayerCards(nextHand);

    const total = calculateHand(nextHand);
    if (total > 21) {
      setBjState('ended');
      setBjResult('Перебор! У вас ' + total + ' очков.');
      onLogHistory('blackjack', 'Блэкджек', `Перебор: ${total} очков`, `${bjBet} TON`, '0 TON', false);
    }
  };

  const standHand = () => {
    let dHand = [...bjDealerCards];
    while (calculateHand(dHand) < 17) {
      dHand.push(getDeckCard());
    }
    setBjDealerCards(dHand);
    setBjState('ended');

    const pScore = calculateHand(bjPlayerCards);
    const dScore = calculateHand(dHand);

    if (dScore > 21 || pScore > dScore) {
      const won = bjBet * 2;
      onUpdateBalance('ton', won);
      sounds.playWin();
      setBjResult(`Победа! Ваши ${pScore} очков против ${dScore > 21 ? 'перебора дилера' : dScore}. +${won.toFixed(2)} TON`);
      onLogHistory('blackjack', 'Блэкджек', `Победа: ${pScore} vs ${dScore}`, `${bjBet} TON`, `+${won.toFixed(2)} TON`, true);
    } else if (pScore === dScore) {
      onUpdateBalance('ton', bjBet); // push refund
      setBjResult(`Ничья (Push)! У обоих по ${pScore} очков. Ставка возвращена.`);
      onLogHistory('blackjack', 'Блэкджек', `Ничья: ${pScore} очков`, `${bjBet} TON`, `${bjBet} TON`, true);
    } else {
      setBjResult(`Дилер победил: ${dScore} против ваших ${pScore}.`);
      onLogHistory('blackjack', 'Блэкджек', `Поражение: ${pScore} vs ${dScore}`, `${bjBet} TON`, '0 TON', false);
    }
  };

  return (
    <div>
      {/* Game Selector Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('slots');
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeGame === 'slots'
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-pink-500/25'
              : 'bg-[#181830] hover:bg-[#222244] text-gray-300'
          }`}
        >
          <span className="text-lg">🎰</span>
          <span>Крипто-Слоты</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('roulette');
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeGame === 'roulette'
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-pink-500/25'
              : 'bg-[#181830] hover:bg-[#222244] text-gray-300'
          }`}
        >
          <span className="text-lg">🎡</span>
          <span>Европейская Рулетка</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveGame('blackjack');
          }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeGame === 'blackjack'
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-pink-500/25'
              : 'bg-[#181830] hover:bg-[#222244] text-gray-300'
          }`}
        >
          <span className="text-lg">🃏</span>
          <span>Блэкджек 21</span>
        </button>
      </div>

      {/* 1. SLOTS GAME VIEW */}
      {activeGame === 'slots' && (
        <div className="casino-card neon-border rounded-3xl p-6 sm:p-8">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-black text-white mb-2">🎰 Неоновые Крипто-Слоты</h3>
            <p className="text-gray-400 text-sm mb-6">
              Соберите 3 одинаковых символа и сорвите куш до x25 ставки!
            </p>

            {/* Slot Reels Machine */}
            <div className="bg-[#0b0b18] border-4 border-amber-400/40 rounded-3xl p-6 shadow-2xl mb-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {slotReels.map((sym, i) => (
                  <div
                    key={i}
                    className="h-28 sm:h-36 rounded-2xl bg-gradient-to-b from-[#181836] to-[#0e0e22] border-2 border-purple-500/40 flex items-center justify-center text-5xl sm:text-6xl shadow-inner select-none transition-transform"
                  >
                    <span className={slotSpinning ? 'animate-bounce' : ''}>{sym}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Result Announcement */}
            {slotWinMessage && (
              <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 border border-pink-500/40 font-bold text-sm text-yellow-300">
                {slotWinMessage}
              </div>
            )}

            {/* Bet Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121226] border border-[#232348] rounded-2xl p-4 mb-6">
              <div className="text-left">
                <div className="text-xs text-gray-400">Ставка (TON):</div>
                <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                  {slotBet.toFixed(2)} TON
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {[0.1, 0.2, 0.5, 1.0, 2.0].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      sounds.playClick();
                      setSlotBet(b);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      slotBet === b
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#1c1c38] hover:bg-[#282850] text-gray-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Spin Slots Button */}
            <button
              onClick={spinSlots}
              disabled={slotSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-lg shadow-lg shadow-pink-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {slotSpinning ? 'Вращение барабанов...' : `Крутить слоты (${slotBet} TON)`}
            </button>

            {/* Paytable preview */}
            <div className="mt-6 pt-6 border-t border-[#1e1e38] grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs text-gray-400">
              {SLOT_SYMBOLS.map((s) => (
                <div key={s.name} className="p-2 rounded-xl bg-[#121226] border border-[#20203f]">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="font-bold text-yellow-400 font-mono">x{s.multiplier}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ROULETTE GAME VIEW */}
      {activeGame === 'roulette' && (
        <div className="casino-card neon-border rounded-3xl p-6 sm:p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-black text-white mb-2">🎡 Европейская Рулетка</h3>
            <p className="text-gray-400 text-sm mb-6">
              Делайте ставки на Красное, Черное, Четное, Нечетное или Зеро!
            </p>

            {/* Wheel Result Display */}
            <div className="flex items-center justify-center mb-6">
              <div
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all ${
                  rouletteResult === 0
                    ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/40'
                    : rouletteResult && RED_NUMBERS.includes(rouletteResult)
                    ? 'bg-rose-600 border-rose-400 shadow-rose-500/40'
                    : rouletteResult
                    ? 'bg-slate-900 border-slate-600 shadow-purple-500/40'
                    : 'bg-[#14142a] border-yellow-500/40'
                }`}
              >
                <div className="text-3xl font-black font-mono text-white">
                  {rouletteResult !== null ? rouletteResult : '—'}
                </div>
                <div className="text-[11px] font-bold text-gray-200 uppercase mt-0.5">
                  {rouletteResult === 0
                    ? 'ZERO'
                    : rouletteResult && RED_NUMBERS.includes(rouletteResult)
                    ? 'RED'
                    : rouletteResult
                    ? 'BLACK'
                    : 'ГОТОВО'}
                </div>
              </div>
            </div>

            {rouletteMessage && (
              <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-purple-500/40 font-bold text-sm text-yellow-300">
                {rouletteMessage}
              </div>
            )}

            {/* Betting Board Options */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
              <button
                onClick={() => {
                  sounds.playClick();
                  setRouletteBetType('red');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition cursor-pointer border ${
                  rouletteBetType === 'red'
                    ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-[#181830] border-rose-900/40 text-rose-300 hover:bg-rose-900/20'
                }`}
              >
                🔴 Красное (x2)
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setRouletteBetType('black');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition cursor-pointer border ${
                  rouletteBetType === 'black'
                    ? 'bg-slate-900 border-slate-400 text-white shadow-lg shadow-slate-900/50'
                    : 'bg-[#181830] border-slate-700/40 text-gray-300 hover:bg-slate-800/40'
                }`}
              >
                ⚫ Черное (x2)
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setRouletteBetType('even');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition cursor-pointer border ${
                  rouletteBetType === 'even'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-[#181830] border-indigo-900/40 text-indigo-300 hover:bg-indigo-900/20'
                }`}
              >
                Четное (x2)
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setRouletteBetType('odd');
                }}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition cursor-pointer border ${
                  rouletteBetType === 'odd'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-[#181830] border-purple-900/40 text-purple-300 hover:bg-purple-900/20'
                }`}
              >
                Нечетное (x2)
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setRouletteBetType('zero');
                }}
                className={`col-span-2 sm:col-span-1 py-3 px-4 rounded-xl font-bold text-sm transition cursor-pointer border ${
                  rouletteBetType === 'zero'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-[#181830] border-emerald-900/40 text-emerald-300 hover:bg-emerald-900/20'
                }`}
              >
                🟢 0 Зеро (x36)
              </button>
            </div>

            {/* Bet amount picker */}
            <div className="flex items-center justify-between gap-4 bg-[#121226] border border-[#232348] rounded-2xl p-4 mb-6">
              <div className="text-left">
                <div className="text-xs text-gray-400">Ставка:</div>
                <div className="text-base font-bold text-cyan-300 font-mono">
                  {rouletteBetAmount.toFixed(2)} TON
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {[0.2, 0.5, 1.0, 2.5, 5.0].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      sounds.playClick();
                      setRouletteBetAmount(b);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      rouletteBetAmount === b
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#1c1c38] hover:bg-[#282850] text-gray-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch ball */}
            <button
              onClick={spinRoulette}
              disabled={rouletteSpinning}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-lg shadow-lg shadow-pink-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {rouletteSpinning ? 'Шарик крутится...' : `Крутить рулетку (${rouletteBetAmount} TON)`}
            </button>
          </div>
        </div>
      )}

      {/* 3. BLACKJACK GAME VIEW */}
      {activeGame === 'blackjack' && (
        <div className="casino-card neon-border rounded-3xl p-6 sm:p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-black text-white mb-2">🃏 Блэкджек 21</h3>
            <p className="text-gray-400 text-sm mb-6">
              Обыграйте дилера, набрав сумму ближе к 21 очку без перебора.
            </p>

            {/* Game Table Surface */}
            <div className="bg-[#0b241b] border-4 border-emerald-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl mb-6 text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-600/10 to-transparent pointer-events-none" />

              {/* Dealer Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 uppercase mb-3">
                  <span>Дилер (Dealer)</span>
                  {bjState === 'ended' && (
                    <span className="font-mono">Очки: {calculateHand(bjDealerCards)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 min-h-[90px]">
                  {bjDealerCards.length === 0 ? (
                    <div className="text-xs text-emerald-400/50 italic">Сдайте карты для начала</div>
                  ) : (
                    bjDealerCards.map((card, idx) => {
                      const isHidden = idx === 1 && bjState === 'playing';
                      return (
                        <div
                          key={idx}
                          className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl flex flex-col items-center justify-center font-bold text-xl sm:text-2xl shadow-lg border-2 ${
                            isHidden
                              ? 'bg-gradient-to-br from-indigo-900 to-purple-950 border-indigo-400 text-white'
                              : 'bg-white border-gray-200 ' + card.color
                          }`}
                        >
                          {isHidden ? (
                            <span className="text-sm text-indigo-300 font-mono">?</span>
                          ) : (
                            <>
                              <span className="text-sm font-mono leading-none">{card.val}</span>
                              <span className="text-2xl sm:text-3xl leading-none mt-1">{card.suit}</span>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Player Section */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 uppercase mb-3">
                  <span>Вы (Player)</span>
                  {bjPlayerCards.length > 0 && (
                    <span className="font-mono text-yellow-300">
                      Очки: {calculateHand(bjPlayerCards)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 min-h-[90px]">
                  {bjPlayerCards.length === 0 ? (
                    <div className="text-xs text-emerald-400/50 italic">Нажмите «Раздать карты»</div>
                  ) : (
                    bjPlayerCards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center font-bold text-xl sm:text-2xl shadow-lg ${card.color}`}
                      >
                        <span className="text-sm font-mono leading-none">{card.val}</span>
                        <span className="text-2xl sm:text-3xl leading-none mt-1">{card.suit}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Result banner */}
            {bjResult && (
              <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20 border border-yellow-500/40 font-bold text-sm text-yellow-300">
                {bjResult}
              </div>
            )}

            {/* Blackjack Action Buttons */}
            {bjState === 'idle' || bjState === 'ended' ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-400">Ставка:</span>
                  {[0.2, 0.5, 1.0, 2.0].map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        sounds.playClick();
                        setBjBet(b);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        bjBet === b
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#1c1c38] hover:bg-[#282850] text-gray-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startBlackjack}
                  className="w-full sm:flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:opacity-95 text-white font-black text-base shadow-lg shadow-teal-500/25 transition cursor-pointer"
                >
                  Раздать карты ({bjBet} TON)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={hitCard}
                  className="py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base shadow-lg transition cursor-pointer"
                >
                  ➕ Еще карту (Hit)
                </button>
                <button
                  onClick={standHand}
                  className="py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-black text-base shadow-lg transition cursor-pointer"
                >
                  🛑 Хватит (Stand)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
