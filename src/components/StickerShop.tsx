import React, { useState } from 'react';
import { INITIAL_STICKERS } from '../data/casinoData';
import { CryptoBalances, Sticker, StickerRarity } from '../types';
import { sounds } from '../utils/audio';
import { Check, Sparkles, ShoppingBag, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StickerShopProps {
  balances: CryptoBalances;
  ownedStickers: string[];
  activeAvatar: string;
  onBuySticker: (sticker: Sticker) => boolean;
  onEquipSticker: (stickerEmoji: string) => void;
}

export const StickerShop: React.FC<StickerShopProps> = ({
  balances,
  ownedStickers,
  activeAvatar,
  onBuySticker,
  onEquipSticker,
}) => {
  const [filterRarity, setFilterRarity] = useState<string>('ALL');

  const filteredStickers = INITIAL_STICKERS.filter((s) => {
    if (filterRarity === 'ALL') return true;
    if (filterRarity === 'OWNED') return ownedStickers.includes(s.id);
    return s.rarity === filterRarity;
  });

  const getRarityBadge = (rarity: StickerRarity) => {
    switch (rarity) {
      case 'COMMON':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'RARE':
        return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'EPIC':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'SECRET':
        return 'text-pink-400 border-pink-500/30 bg-pink-500/10 animate-pulse';
    }
  };

  const handleBuy = (sticker: Sticker) => {
    const success = onBuySticker(sticker);
    if (success) {
      sounds.playCoin();
      confetti({ particleCount: 50, spread: 50 });
    } else {
      alert(`Недостаточно ${sticker.currency.toUpperCase()} для покупки этого стикера!`);
    }
  };

  return (
    <div>
      {/* Header and stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>🛍️</span>
            <span>Магазин NFT Стикеров</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Коллекционируйте уникальные крипто-стикеры и надевайте их как игровой аватар!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#121226] border border-[#222244] px-4 py-2 rounded-2xl text-xs">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-300">В коллекции:</span>
          <span className="font-mono font-bold text-yellow-400">
            {ownedStickers.length} / {INITIAL_STICKERS.length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs">
        {['ALL', 'OWNED', 'COMMON', 'RARE', 'EPIC', 'SECRET'].map((r) => (
          <button
            key={r}
            onClick={() => {
              sounds.playClick();
              setFilterRarity(r);
            }}
            className={`px-4 py-2 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              filterRarity === r
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                : 'bg-[#14142a] hover:bg-[#1e1e3c] border border-[#242448] text-gray-400'
            }`}
          >
            {r === 'ALL'
              ? 'Все'
              : r === 'OWNED'
              ? 'Мои стикеры'
              : r}
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStickers.map((sticker) => {
          const isOwned = ownedStickers.includes(sticker.id);
          const isEquipped = activeAvatar === sticker.emoji;

          return (
            <div
              key={sticker.id}
              className={`casino-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:scale-[1.02] ${
                isEquipped ? 'border-pink-500/80 shadow-lg shadow-pink-500/20' : 'hover:border-purple-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getRarityBadge(
                      sticker.rarity
                    )}`}
                  >
                    {sticker.rarity}
                  </span>
                  {isEquipped && (
                    <span className="text-[10px] font-bold text-pink-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Аватар</span>
                    </span>
                  )}
                </div>

                {/* Sticker Emoji preview */}
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-[#1b1b36] to-[#121226] border border-[#2b2b52] flex items-center justify-center text-5xl mb-4 shadow-inner">
                  {sticker.emoji}
                </div>

                <h3 className="font-bold text-base text-white text-center mb-1">
                  {sticker.name}
                </h3>
                <p className="text-gray-400 text-xs text-center line-clamp-2 mb-4 leading-relaxed">
                  {sticker.description}
                </p>
              </div>

              {/* Price and Action */}
              <div className="pt-3 border-t border-[#1e1e38]">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="text-gray-400">Стоимость:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {sticker.price.toLocaleString('ru-RU')} {sticker.currency.toUpperCase()}
                  </span>
                </div>

                {isOwned ? (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onEquipSticker(sticker.emoji);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isEquipped
                        ? 'bg-[#1a1a36] text-pink-300 border border-pink-500/40'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Надет</span>
                      </>
                    ) : (
                      <span>Надеть как аватар</span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(sticker)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Купить за {sticker.currency.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
