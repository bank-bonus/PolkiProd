import React from 'react';
import { Pause, Clock, Star } from 'lucide-react';

interface TopBarProps {
  level: number;
  timeLeft: number;
  totalTime: number;
  onPause: () => void;
  score: number; // Actually currently using stars based on time, but visual score is nice
}

export const TopBar: React.FC<TopBarProps> = ({ level, timeLeft, totalTime, onPause }) => {
  const progress = Math.min(100, Math.max(0, (timeLeft / totalTime) * 100));
  
  // Format MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="w-full px-4 py-3 flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/10 relative z-20">
      <div className="flex items-center space-x-2">
        <div className="bg-amber-400 w-10 h-10 rounded-full flex items-center justify-center border-2 border-amber-600 shadow-lg">
          <span className="font-bold text-amber-900">{level}</span>
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 mx-4">
        <div className="bg-white/90 px-4 py-1 rounded-full border-2 border-red-800 shadow-md flex items-center space-x-2 w-32 justify-center">
            <Clock size={16} className="text-red-600" />
            <span className="font-bold text-red-800 font-mono text-lg">{timeString}</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full max-w-[200px] h-2 bg-black/30 rounded-full mt-2 overflow-hidden border border-white/20">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${progress < 20 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button 
        onClick={onPause}
        className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors border border-white/20"
      >
        <Pause className="text-white" size={24} />
      </button>
    </div>
  );
};