import React from 'react';
import { GameItem, ItemType } from '../types.ts';
import { ITEM_ICONS, ITEM_COLORS, MAX_TRAY_SIZE } from '../constants.tsx';

interface TrayProps {
  items: GameItem[];
  matchedType: ItemType | null;
}

export const Tray: React.FC<TrayProps> = ({ items, matchedType }) => {
  // Create an array of length MAX_TRAY_SIZE filled with nulls or items
  const slots = Array.from({ length: MAX_TRAY_SIZE }).map((_, i) => items[i] || null);

  return (
    <div className="w-full relative">
       {/* Decorative Backboard */}
       <div className="absolute inset-0 bg-[#3e2415] transform translate-y-2 rounded-xl shadow-2xl border-4 border-[#5c3a21]"></div>
       
       <div className="relative w-full bg-[#5c3a21] p-3 rounded-xl border-t-2 border-[#8b5a36] shadow-inner flex flex-col items-center">
        
        {/* Label */}
        <div className="absolute -top-5 bg-[#8b5a36] px-6 py-1 rounded-t-lg border-t border-amber-500 shadow-md">
            <span className="text-xs font-black text-amber-100 uppercase tracking-[0.2em] drop-shadow-sm">Склад</span>
        </div>

        {/* Screws */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#3e1c0c] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]"></div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#3e1c0c] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]"></div>

        <div className="w-full h-18 md:h-20 bg-[#2b170f] rounded-lg shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-center p-2 gap-1 md:gap-2 overflow-hidden border-b border-white/5">
          {slots.map((item, index) => {
             const isMatching = item && item.type === matchedType;
             
             return (
              <div 
                key={index} 
                className={`
                  relative
                  w-10 h-12 md:w-14 md:h-16 rounded-md md:rounded-lg flex items-center justify-center 
                  transition-all duration-300
                  ${item ? 'scale-100 opacity-100' : 'scale-90 opacity-20 bg-black/30 border border-white/5'}
                  ${item ? ITEM_COLORS[item.type] : ''}
                  ${item ? 'shadow-lg border-b-4' : ''}
                  ${isMatching ? 'animate-pulse scale-110 z-10 brightness-125 ring-4 ring-green-400' : ''}
                `}
              >
                {item ? (
                  <div className={`w-6 h-6 md:w-8 md:h-8 ${isMatching ? 'animate-bounce' : 'animate-pop-in'}`}>
                    {ITEM_ICONS[item.type]}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};