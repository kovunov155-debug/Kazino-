import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { sounds } from '../utils/audio';
import { Trash2, History as HistoryIcon } from 'lucide-react';

interface HistorySectionProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'wins') return item.isWin;
    return item.game === filter;
  });

  const getGameEmoji = (game: string) => {
    switch (game) {
      case 'spin':
        return '🎰';
      case 'slots':
        return '👑';
      case 'roulette':
        return '🎡';
      case 'blackjack':
        return '🃏';
      case 'shop':
        return '🛍️';
      default:
        return '🎲';
    }
  };

  return (
    <div className="casino-card neon-border rounded-3xl p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-purple-400" />
            <span>История ставок и выигрышей</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Записи всех ваших вращений колеса, слотов, рулетки и покупок
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите очистить историю?')) {
                sounds.playClick();
                onClearHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить историю</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Все записи' },
          { id: 'wins', label: 'Только победы' },
          { id: 'spin', label: 'Колесо' },
          { id: 'slots', label: 'Слоты' },
          { id: 'roulette', label: 'Рулетка' },
          { id: 'blackjack', label: 'Блэкджек' },
          { id: 'shop', label: 'Магазин' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playClick();
              setFilter(tab.id);
            }}
            className={`px-4 py-2 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                : 'bg-[#14142a] hover:bg-[#1e1e3c] border border-[#242448] text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Items Table / List */}
      {filteredHistory.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-5xl mb-3">🎲</div>
          <div className="text-lg font-bold text-gray-300">Пока нет записей</div>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Крутите Колесо Фортуны, играйте в мини-игры или покупайте стикеры, чтобы наполнить историю!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-[#101022] hover:bg-[#14142b] border border-[#1e1e38] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a36] border border-[#28284c] flex items-center justify-center text-xl shrink-0">
                  {getGameEmoji(item.game)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    {item.multiplier && item.multiplier > 1 && (
                      <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                        x{item.multiplier}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.details}</div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1a1a2e]">
                {item.bet && (
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-gray-500">Ставка:</div>
                    <div className="text-xs font-mono font-medium text-gray-300">{item.bet}</div>
                  </div>
                )}

                <div className="text-right">
                  <div className="text-[10px] text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div
                    className={`text-sm font-black font-mono ${
                      item.isWin ? 'text-emerald-400' : 'text-gray-400'
                    }`}
                  >
                    {item.prize}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
