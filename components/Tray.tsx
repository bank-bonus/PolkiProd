import React from 'react';
import { GameItem } from '../types.ts';
import { ITEM_ICONS, ITEM_COLORS, MAX_TRAY_SIZE } from '../constants.tsx';

interface TrayProps {
  items: GameItem[];
}

export const Tray: React.FC<TrayProps> = ({ items }) => {
  // Create an array of length MAX_TRAY_SIZE filled with nulls or items
  const slots = Array.from({ length: MAX_TRAY_SIZE }).map((_, i) => items[i] || null);

  return (
    <div className="w-full max-w-lg mx-auto bg-[#5c3a21] p-3 rounded-t-3xl shadow-2xl border-t-4 border-[#8b5a36] relative z-20">
      <div className="w-full h-20 bg-[#3e2415] rounded-xl shadow-inner flex items-center justify-center p-2 gap-2 overflow-hidden">
        {slots.map((item, index) => (
          <div 
            key={index} 
            className={`
              w-12 h-14 md:w-14 md:h-16 rounded-lg flex items-center justify-center 
              transition-all duration-300
              ${item ? 'scale-100 opacity-100' : 'scale-90 opacity-30 bg-black/20'}
              ${item ? ITEM_COLORS[item.type] : ''}
              ${item ? 'shadow-md border-b-4' : 'border border-white/5'}
            `}
          >
            {item ? (
              <div className="w-8 h-8 md:w-10 md:h-10 animate-pop-in">
                {ITEM_ICONS[item.type]}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      
      {/* Visual Decor */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#8b5a36] rounded-t-xl flex items-center justify-center shadow-lg">
        <span className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">Collector</span>
      </div>
    </div>
  );
};