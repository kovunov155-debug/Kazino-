import React, { useState, useRef } from 'react';
import { WHEEL_PRIZES } from '../data/casinoData';
import { WheelPrize } from '../types';
import { sounds } from '../utils/audio';
import { Flame, Sparkles, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpinWheelProps {
  spinsLeft: number;
  tonBalance: number;
  onWin: (prize: WheelPrize, multiplier: number) => void;
  onOpenBuySpins: () => void;
  onDeductSpin: () => boolean; // returns true if deducted
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  spinsLeft,
  tonBalance,
  onWin,
  onOpenBuySpins,
  onDeductSpin,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [lastWonPrize, setLastWonPrize] = useState<WheelPrize | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const audioIntervalRef = useRef<number | null>(null);

  const sectorAngle = 360 / WHEEL_PRIZES.length; // 45 deg

  const handleSpin = () => {
    if (spinning) return;

    // Check if player has spins or enough TON for demo spin
    const hasSpun = onDeductSpin();
    if (!hasSpun) {
      onOpenBuySpins();
      return;
    }

    setSpinning(true);
    setLastWonPrize(null);
    sounds.playSpin();

    // Pick target prize
    // Weighted probabilities: index 0 (Jackpot) has lower weight, others regular
    const rand = Math.random();
    let prizeIndex = 0;
    if (rand < 0.05) {
      prizeIndex = 0; // Jackpot 5%
    } else if (rand < 0.20) {
      prizeIndex = 1; // 0.5 TON
    } else if (rand < 0.35) {
      prizeIndex = 2; // 1.0 USDT
    } else if (rand < 0.50) {
      prizeIndex = 3; // 1,000 NOT
    } else if (rand < 0.65) {
      prizeIndex = 4; // +3 Spins
    } else if (rand < 0.80) {
      prizeIndex = 5; // 5,000 DOGS
    } else if (rand < 0.92) {
      prizeIndex = 6; // 2.5 TON
    } else {
      prizeIndex = 7; // 5.0 USDT
    }

    const targetPrize = WHEEL_PRIZES[prizeIndex];

    // Pointer is at the top (0 degrees or 270 degrees in SVG coordinates).
    // Each sector i is centered at (i * 45 + 22.5) degrees.
    // When wheel rotates by R degrees clockwise, sector at angle A moves to A + R.
    // For sector i to end up at the top pointer (0 deg / 360 deg), we need:
    // (i * 45 + 22.5) + R === 360 * N  =>  R === 360 * N - (i * 45 + 22.5)
    const extraRounds = 360 * (6 + Math.floor(Math.random() * 3));
    const sectorCenter = prizeIndex * sectorAngle + sectorAngle / 2;
    const targetOffset = (360 - sectorCenter) % 360;

    // Add slight random offset inside the sector (-14 to +14 deg) so it doesn't land dead center every time
    const jitter = (Math.random() - 0.5) * 28;
    const nextRotation = rotation + extraRounds + targetOffset - (rotation % 360) + jitter;

    setRotation(nextRotation);

    // Audio click ticker simulation with realistic deceleration
    let elapsed = 0;
    const duration = 5000;
    const startTime = Date.now();

    const tick = () => {
      elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        sounds.playTick(500 + Math.random() * 150);
        const progress = elapsed / duration;
        // Ease out delay: fast at start (60ms), slower at end (400ms)
        const nextDelay = 60 + Math.pow(progress, 3) * 350;
        audioIntervalRef.current = window.setTimeout(tick, nextDelay);
      }
    };
    tick();

    // Wheel stops at 5 seconds
    setTimeout(() => {
      if (audioIntervalRef.current) {
        clearTimeout(audioIntervalRef.current);
      }
      setSpinning(false);
      setLastWonPrize(targetPrize);

      if (targetPrize.type === 'jackpot') {
        sounds.playJackpot();
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ec4899', '#8b5cf6'],
        });
      } else {
        sounds.playWin();
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      onWin(targetPrize, multiplier);
    }, 5000);
  };

  return (
    <div className="casino-card neon-border rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
      {/* Decorative radial lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-14 relative z-10">
        {/* WHEEL CONTAINER */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] shrink-0 flex items-center justify-center">
          {/* Outer glowing halo ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 via-pink-500/20 to-purple-600/20 blur-xl pointer-events-none" />

          {/* Top Pointer Indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className="w-9 h-9 bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 rotate-45 rounded-md flex items-center justify-center shadow-lg shadow-orange-500/70 border-2 border-white/60">
              <div className="w-3.5 h-3.5 bg-pink-600 rounded-full -rotate-45" />
            </div>
            <div className="-mt-1.5 w-3 h-3 bg-gradient-to-b from-amber-400 to-orange-600 rotate-45 shadow-sm" />
          </div>

          {/* SVG WHEEL */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full shadow-2xl relative select-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
            }}
          >
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full drop-shadow-[0_0_20px_rgba(255,107,53,0.3)]"
            >
              <defs>
                {/* Radial gradients for wheel slices */}
                <radialGradient id="gold-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <radialGradient id="purple-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c026d3" />
                  <stop offset="100%" stopColor="#581c87" />
                </radialGradient>
                <radialGradient id="blue-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0c4a6e" />
                </radialGradient>
                <radialGradient id="green-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </radialGradient>
                <radialGradient id="orange-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </radialGradient>
                <radialGradient id="pink-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#db2777" />
                  <stop offset="100%" stopColor="#831843" />
                </radialGradient>
                <radialGradient id="dark-blue-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </radialGradient>
                <radialGradient id="teal-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#134e4a" />
                </radialGradient>
              </defs>

              {/* Outer Golden Ring */}
              <circle cx="200" cy="200" r="196" fill="#0d0d1a" stroke="#f59e0b" strokeWidth="6" />
              <circle cx="200" cy="200" r="190" fill="none" stroke="#252542" strokeWidth="2" />

              {/* 8 Sectors */}
              {WHEEL_PRIZES.map((prize, idx) => {
                const angle = idx * 45;
                const nextAngle = (idx + 1) * 45;
                const rad1 = ((angle - 90) * Math.PI) / 180;
                const rad2 = ((nextAngle - 90) * Math.PI) / 180;
                const r = 188;

                const x1 = 200 + r * Math.cos(rad1);
                const y1 = 200 + r * Math.sin(rad1);
                const x2 = 200 + r * Math.cos(rad2);
                const y2 = 200 + r * Math.sin(rad2);

                const d = `M 200 200 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

                const sliceGradients = [
                  'url(#gold-grad)',
                  'url(#blue-grad)',
                  'url(#green-grad)',
                  'url(#purple-grad)',
                  'url(#pink-grad)',
                  'url(#orange-grad)',
                  'url(#dark-blue-grad)',
                  'url(#teal-grad)',
                ];

                const midAngle = angle + 22.5;

                return (
                  <g key={prize.id}>
                    <path
                      d={d}
                      fill={sliceGradients[idx % sliceGradients.length]}
                      stroke="#1a1a2e"
                      strokeWidth="2.5"
                    />
                    {/* Content inside sector */}
                    <g transform={`rotate(${midAngle}, 200, 200)`}>
                      {/* Icon */}
                      <text
                        x="200"
                        y="62"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="22"
                        className="select-none"
                      >
                        {prize.icon}
                      </text>
                      {/* Text Label */}
                      <text
                        x="200"
                        y="94"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="900"
                        fill="#ffffff"
                        letterSpacing="0.5"
                        className="select-none font-bold"
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
                      >
                        {prize.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Perimeter Pegs / Pins */}
              {Array.from({ length: 24 }).map((_, i) => {
                const pegAngle = (i * 15 * Math.PI) / 180;
                const px = 200 + 191 * Math.cos(pegAngle);
                const py = 200 + 191 * Math.sin(pegAngle);
                return (
                  <circle
                    key={i}
                    cx={px}
                    cy={py}
                    r="3.5"
                    fill="#fbbf24"
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="shadow-sm"
                  />
                );
              })}
            </svg>
          </div>

          {/* Center SPIN Button */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 border-4 border-amber-300 flex flex-col items-center justify-center shadow-2xl transition z-20 cursor-pointer ${
              spinning ? 'opacity-80 scale-95' : 'hover:scale-105 active:scale-95'
            }`}
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow">🎰</span>
            <span className="text-xs sm:text-sm font-black text-white tracking-wider mt-0.5">
              {spinning ? 'КРУТИМ...' : 'SPIN'}
            </span>
            <span className="text-[10px] text-amber-200 font-semibold font-mono">
              x{multiplier}
            </span>
          </button>
        </div>

        {/* SIDE CONTROLS & INFO */}
        <div className="flex-1 w-full text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Джекпот: 10 TON + 25 000 DOGS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            Колесо Фортуны
          </h2>
          <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
            Крутите крипто-колесо и выигрывайте реальные демо-токены TON, USDT, NOT и DOGS. Выбирайте множитель ставки для максимального куша!
          </p>

          {/* Multiplier Selectors */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center justify-center lg:justify-start gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Выберите множитель выигрыша:</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
              {[1, 2, 5, 10].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    sounds.playClick();
                    setMultiplier(m);
                  }}
                  className={`px-5 py-2 rounded-xl text-sm font-black transition cursor-pointer ${
                    multiplier === m
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                      : 'bg-[#181830] hover:bg-[#222244] border border-[#2c2c54] text-gray-300'
                  }`}
                >
                  x{m}
                </button>
              ))}
            </div>
          </div>

          {/* Spin Status Info */}
          <div className="bg-[#101024] border border-[#222244] rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 text-left">
            <div>
              <div className="text-xs text-gray-400">Стоимость вращения:</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {spinsLeft > 0 ? (
                  <span className="text-emerald-400">1 Бесплатный спин</span>
                ) : (
                  <span className="text-orange-400">0.20 TON</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Баланс спинов:</div>
              <div className="text-base font-extrabold text-pink-400 font-mono">
                {spinsLeft} шт
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-black text-base shadow-lg shadow-pink-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {spinning ? 'Вращение...' : `Крутить сейчас (x${multiplier})`}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenBuySpins();
              }}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-[#1b1b36] hover:bg-[#25254a] border border-purple-500/40 text-purple-200 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Купить спины</span>
            </button>
          </div>

          {/* Last Drop Ticker */}
          {lastWonPrize && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-pink-500/10 to-purple-500/10 border border-yellow-500/30 flex items-center gap-2 text-xs text-yellow-200 justify-center lg:justify-start">
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>
                Последний выигрыш: <strong>{lastWonPrize.label}</strong> (множитель x{multiplier})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
