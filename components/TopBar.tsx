import React from 'react';
import { Pause, Footprints } from 'lucide-react';

interface TopBarProps {
  level: number;
  movesLeft: number;
  totalMoves: number;
  onPause: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ level, movesLeft, totalMoves, onPause }) => {
  const isDanger = movesLeft <= 5;

  return (
    <div className="w-full px-4 py-3 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/10 relative z-20 shadow-lg">
      
      {/* Level Badge */}
      <div className="flex items-center">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 w-12 h-12 rounded-xl flex items-center justify-center border-b-4 border-amber-800 shadow-lg transform rotate-[-3deg]">
          <span className="font-black text-white text-xl drop-shadow-md">{level}</span>
        </div>
        <div className="ml-2 flex flex-col">
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-none">Level</span>
            <span className="text-white font-bold leading-none">Map</span>
        </div>
      </div>

      {/* Moves Counter */}
      <div className={`
        flex items-center gap-3 px-6 py-2 rounded-full border-4 shadow-xl transition-all duration-300
        ${isDanger ? 'bg-red-500 border-red-700 animate-pulse' : 'bg-white border-blue-500'}
      `}>
         <Footprints className={isDanger ? 'text-white' : 'text-blue-500'} size={24} fill="currentColor" />
         <span className={`text-2xl font-black ${isDanger ? 'text-white' : 'text-slate-700'}`}>
            {movesLeft}
         </span>
      </div>

      {/* Pause Button */}
      <button 
        onClick={onPause}
        className="bg-white/20 p-2.5 rounded-xl hover:bg-white/30 transition-colors border border-white/20 active:scale-95"
      >
        <Pause className="text-white" size={24} fill="white" />
      </button>
    </div>
  );
};