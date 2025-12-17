import React, { useState, useMemo } from 'react';
import { Game } from './components/Game.tsx';
import { LevelConfig, ItemType, GameState, PlayerProgress } from './types.ts';
import { Play, Star, RotateCcw, Map as MapIcon, Home, Lock, Trophy } from 'lucide-react';
import { MAX_LEVELS } from './constants.tsx';

// --- Helper to Generate Level Configs ---
const getLevelConfig = (level: number): LevelConfig => {
  // Base configuration
  const baseTime = 60;
  const types = [
    ItemType.APPLE, ItemType.BANANA, ItemType.CHERRY, 
    ItemType.MILK, ItemType.COOKIE, ItemType.SODA,
    ItemType.PIZZA, ItemType.BURGER, ItemType.ICECREAM,
    ItemType.GIFT, ItemType.CANDY, ItemType.DIAMOND
  ];

  // Difficulty scaling
  const typeCount = Math.min(types.length, 3 + Math.floor(level / 2));
  const availableTypes = types.slice(0, typeCount);
  const sets = 3 + level; // Level 1 = 4 sets (12 items), Level 2 = 5 sets (15 items)
  
  // Shelf/Slot calculation logic to fit items
  const totalItems = sets * 3;
  const shelfCount = Math.min(6, 2 + Math.floor(level / 3));
  const slotsPerShelf = Math.min(5, 3 + Math.floor(level / 4));
  
  // Ensure enough capacity (layers logic handled in Game gen)
  // Just simple linear increase of time
  const timeLimit = baseTime + (level * 10);

  return {
    levelNumber: level,
    timeLimitSeconds: timeLimit,
    threeStarThreshold: timeLimit * 0.5,
    twoStarThreshold: timeLimit * 0.25,
    itemTypes: availableTypes,
    shelfCount,
    slotsPerShelf,
    layersPerSlot: 2 + Math.floor(level / 5),
    totalSets: sets,
  };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [progress, setProgress] = useState<PlayerProgress>({
    unlockedLevel: 1,
    stars: {},
    hearts: 5
  });
  const [lastGameResult, setLastGameResult] = useState<{won: boolean, stars: number} | null>(null);

  const levelConfig = useMemo(() => getLevelConfig(currentLevel), [currentLevel]);

  const handleLevelSelect = (level: number) => {
    if (level <= progress.unlockedLevel) {
      setCurrentLevel(level);
      setGameState(GameState.PLAYING);
    }
  };

  const handleGameOver = (won: boolean, stars: number) => {
    setLastGameResult({ won, stars });
    if (won) {
      setProgress(prev => ({
        ...prev,
        unlockedLevel: Math.max(prev.unlockedLevel, currentLevel + 1),
        stars: {
          ...prev.stars,
          [currentLevel]: Math.max(prev.stars[currentLevel] || 0, stars)
        }
      }));
      setGameState(GameState.WON);
    } else {
      setGameState(GameState.LOST);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < MAX_LEVELS) {
      setCurrentLevel(prev => prev + 1);
      setGameState(GameState.PLAYING);
    } else {
      // Completed all levels
      setGameState(GameState.MAP);
    }
  };

  const handleRetry = () => {
    setGameState(GameState.PLAYING);
  };

  const handleHome = () => {
    setGameState(GameState.MAP);
  };

  // --- Screens ---

  const renderMap = () => (
    <div className="min-h-screen bg-[#cce3f3] relative overflow-y-auto">
      {/* Snow/Winter Theme Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] opacity-50 pointer-events-none"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <Home size={20} />
            </div>
         </div>
         <div className="bg-white px-4 py-1 rounded-full border border-red-200 shadow-sm flex items-center gap-2">
            <span className="text-red-500">❤️</span>
            <span className="font-bold text-gray-700">{progress.hearts}</span>
         </div>
      </div>

      {/* Map Path */}
      <div className="max-w-md mx-auto p-8 relative min-h-[800px]">
        {/* SVG Path for connecting dots */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.3 }}>
           {/* Simple zig zag path would be complex to dynamic render perfectly, putting a simple dashed line down the middle for now */}
           <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="20" strokeDasharray="20,20" strokeLinecap="round" />
        </svg>

        <div className="flex flex-col-reverse items-center gap-12 z-10 relative mt-10">
           {Array.from({ length: MAX_LEVELS }).map((_, i) => {
             const level = i + 1;
             const isUnlocked = level <= progress.unlockedLevel;
             const stars = progress.stars[level] || 0;
             const isCurrent = level === progress.unlockedLevel;

             return (
               <div key={level} className="relative group">
                 <button
                   onClick={() => handleLevelSelect(level)}
                   disabled={!isUnlocked}
                   className={`
                     w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-xl transition-all transform
                     ${isUnlocked 
                        ? isCurrent 
                            ? 'bg-amber-400 border-amber-600 scale-110 animate-pulse' 
                            : 'bg-blue-400 border-blue-600 hover:scale-105' 
                        : 'bg-gray-300 border-gray-400'
                     }
                   `}
                 >
                   {isUnlocked ? (
                     <span className="text-2xl font-bold text-white drop-shadow-md">{level}</span>
                   ) : (
                     <Lock className="text-gray-500" size={24} />
                   )}
                 </button>
                 
                 {/* Stars Display */}
                 {isUnlocked && stars > 0 && (
                   <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {[1, 2, 3].map(s => (
                        <Star 
                          key={s} 
                          size={16} 
                          className={`fill-current ${s <= stars ? 'text-yellow-400 stroke-yellow-600' : 'text-gray-300'}`} 
                        />
                      ))}
                   </div>
                 )}
               </div>
             );
           })}
        </div>
      </div>
      
      {/* Start Button */}
      <div className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-30">
        <button 
           onClick={() => handleLevelSelect(progress.unlockedLevel)}
           className="w-full max-w-md mx-auto block bg-[#76c043] hover:bg-[#65a639] text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_8px_0_#4e8529] active:shadow-[0_0px_0_#4e8529] active:translate-y-2 transition-all pointer-events-auto uppercase tracking-wide"
        >
          Play Level {progress.unlockedLevel}
        </button>
      </div>
    </div>
  );

  const renderResult = (won: boolean) => (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-bounce-in relative overflow-hidden">
        {/* Background shine */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-100 to-transparent opacity-50"></div>

        <h2 className={`text-4xl font-black mb-6 relative z-10 ${won ? 'text-green-600' : 'text-red-500'}`}>
          {won ? 'LEVEL CLEAR!' : 'OUT OF MOVES'}
        </h2>

        {/* Stars */}
        {won && (
          <div className="flex justify-center gap-2 mb-8 relative z-10">
            {[1, 2, 3].map(s => {
               const active = s <= (lastGameResult?.stars || 0);
               return (
                 <Star 
                    key={s} 
                    size={48} 
                    className={`transform transition-all duration-500 ${active ? 'fill-yellow-400 text-yellow-600 scale-110 drop-shadow-lg' : 'fill-gray-200 text-gray-300'}`}
                 />
               )
            })}
          </div>
        )}

        {!won && (
           <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                 <span className="text-4xl">😢</span>
              </div>
           </div>
        )}

        <div className="space-y-3 relative z-10">
          {won ? (
             <button 
               onClick={handleNextLevel}
               className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
             >
               <Play size={24} fill="currentColor" /> NEXT LEVEL
             </button>
          ) : (
            <button 
              onClick={handleRetry}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={24} /> TRY AGAIN
            </button>
          )}

          <button 
            onClick={handleHome}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MapIcon size={20} /> MAP
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden font-sans select-none">
      {gameState === GameState.MENU && renderMap()} {/* Actually start at map for simplicity */}
      {gameState === GameState.MAP && renderMap()}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={currentLevel} // Remount on level change
          levelConfig={levelConfig} 
          onGameOver={handleGameOver}
          onPause={() => setGameState(GameState.PAUSED)}
        />
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl flex flex-col gap-4 w-64 shadow-2xl">
              <h2 className="text-2xl font-bold text-center text-gray-800">PAUSED</h2>
              <button onClick={() => setGameState(GameState.PLAYING)} className="bg-blue-500 text-white p-3 rounded-lg font-bold">RESUME</button>
              <button onClick={handleHome} className="bg-gray-200 text-gray-700 p-3 rounded-lg font-bold">EXIT</button>
           </div>
        </div>
      )}

      {(gameState === GameState.WON || gameState === GameState.LOST) && renderResult(gameState === GameState.WON)}
    </div>
  );
}