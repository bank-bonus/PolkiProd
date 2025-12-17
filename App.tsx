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

  // Difficulty scaling: Unlock types faster
  const typeCount = Math.min(types.length, 3 + Math.floor(level * 0.8));
  const availableTypes = types.slice(0, typeCount);
  
  // Shelf count: Starts at 3, increases aggressively to 8
  const shelfCount = Math.min(8, 2 + Math.ceil(level / 1.5));

  // Slots per shelf: Wide shelves later
  const slotsPerShelf = Math.min(6, 3 + Math.floor(level / 2));
  
  // Layers: Increase depth significantly
  const layersPerSlot = Math.min(5, 2 + Math.floor(level / 2.5));

  // Capacity calculations to ensure dense levels
  const capacity = shelfCount * slotsPerShelf * layersPerSlot;
  
  // High fill rate (70-95%)
  const fillRate = 0.7 + (Math.min(level, 10) * 0.025); 
  let targetTotalItems = Math.floor(capacity * fillRate);
  
  // Ensure sets of 3
  let sets = Math.floor(targetTotalItems / 3);
  
  // Minimum sets grows with level to force difficulty
  sets = Math.max(5 + level * 2, sets);

  // Time limit: Tighten it as player gets better
  // Base time + small amount per set
  const timeLimit = baseTime + (sets * 4); 

  return {
    levelNumber: level,
    timeLimitSeconds: timeLimit,
    threeStarThreshold: timeLimit * 0.6, // Harder to get 3 stars
    twoStarThreshold: timeLimit * 0.3,
    itemTypes: availableTypes,
    shelfCount,
    slotsPerShelf,
    layersPerSlot,
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
    <div className="h-screen bg-[#cce3f3] relative overflow-y-auto overflow-x-hidden flex flex-col">
      {/* Snow/Winter Theme Background */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] opacity-50 pointer-events-none z-0"></div>
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-md border-b border-white/50">
         <div className="flex items-center gap-2">
            <div className="bg-amber-500 rounded-lg p-2 text-white shadow-lg">
                <MapIcon size={24} />
            </div>
            <span className="font-bold text-gray-700 text-lg">Карта</span>
         </div>
         <div className="bg-white px-4 py-1 rounded-full border border-red-200 shadow-sm flex items-center gap-2">
            <span className="text-red-500">❤️</span>
            <span className="font-bold text-gray-700">{progress.hearts}</span>
         </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 w-full relative min-h-[1200px] py-10">
         <div className="w-full max-w-md mx-auto relative flex flex-col-reverse items-center justify-end h-full gap-8 pb-32">
            
            {/* SVG Connector Path */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.4 }}>
               <path 
                  d={(() => {
                    // Generate a simple zigzag path string
                    // This is an approximation. Ideally we'd calculate exact coordinates of buttons.
                    // Assuming flex-col-reverse starts from bottom.
                    let path = "";
                    const stepY = 112; // approx 80px height + 32px gap
                    const centerX = 50; // percent
                    const offsetX = 20; // percent
                    const startY = 50; // padding bottom
                    
                    for(let i=0; i<MAX_LEVELS; i++) {
                       const y = 1100 - (i * 100); 
                       const x = i % 2 === 0 ? centerX - offsetX : centerX + offsetX;
                       path += i === 0 ? `M ${x}% ${y} ` : `L ${x}% ${y} `;
                    }
                    return path;
                  })()}
                  fill="none" 
                  stroke="white" 
                  strokeWidth="8" 
                  strokeDasharray="15,15"
                  strokeLinecap="round"
               />
            </svg>

            {Array.from({ length: MAX_LEVELS }).map((_, i) => {
               const level = i + 1;
               const isUnlocked = level <= progress.unlockedLevel;
               const stars = progress.stars[level] || 0;
               const isCurrent = level === progress.unlockedLevel;
               
               // Zigzag Positioning Logic
               const offsetClass = i % 2 === 0 ? '-translate-x-12 md:-translate-x-16' : 'translate-x-12 md:translate-x-16';

               return (
                 <div key={level} className={`relative z-10 transform ${offsetClass}`}>
                   <button
                     onClick={() => handleLevelSelect(level)}
                     disabled={!isUnlocked}
                     className={`
                       w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center border-b-8 shadow-2xl transition-all
                       ${isUnlocked 
                          ? isCurrent 
                              ? 'bg-amber-400 border-amber-700 -translate-y-2 animate-bounce' 
                              : 'bg-gradient-to-br from-blue-400 to-blue-500 border-blue-700 hover:-translate-y-1' 
                          : 'bg-gray-300 border-gray-400 grayscale'
                       }
                     `}
                   >
                     {isUnlocked ? (
                       <>
                         <span className="text-3xl font-black text-white drop-shadow-md">{level}</span>
                         {/* Stars on the button */}
                         <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3].map(s => (
                                <Star 
                                  key={s} 
                                  size={12} 
                                  className={`fill-current ${s <= stars ? 'text-yellow-300' : 'text-black/20'}`} 
                                />
                            ))}
                         </div>
                       </>
                     ) : (
                       <Lock className="text-gray-500" size={24} />
                     )}
                   </button>
                 </div>
               );
            })}
         </div>
      </div>
      
      {/* Footer Play Button */}
      <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-40">
        <button 
           onClick={() => handleLevelSelect(progress.unlockedLevel)}
           className="w-full max-w-sm mx-auto flex items-center justify-center bg-[#76c043] hover:bg-[#65a639] text-white text-xl font-bold py-4 rounded-xl shadow-[0_6px_0_#4e8529] active:shadow-[0_0px_0_#4e8529] active:translate-y-2 transition-all pointer-events-auto uppercase tracking-wide gap-2"
        >
          <Play fill="currentColor" /> Играть: Уровень {progress.unlockedLevel}
        </button>
      </div>
    </div>
  );

  const renderResult = (won: boolean) => (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-bounce-in relative overflow-hidden">
        {/* Background shine */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-100 to-transparent opacity-50"></div>

        <h2 className={`text-3xl font-black mb-6 relative z-10 uppercase ${won ? 'text-green-600' : 'text-red-500'}`}>
          {won ? 'ПОБЕДА!' : 'ХОДОВ НЕТ'}
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
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                 <span className="text-4xl">😢</span>
              </div>
           </div>
        )}

        <div className="space-y-3 relative z-10">
          {won ? (
             <button 
               onClick={handleNextLevel}
               className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase"
             >
               <Play size={24} fill="currentColor" /> Дальше
             </button>
          ) : (
            <button 
              onClick={handleRetry}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase"
            >
              <RotateCcw size={24} /> Заново
            </button>
          )}

          <button 
            onClick={handleHome}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase shadow-sm"
          >
            <MapIcon size={20} /> Карта
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden font-sans select-none">
      {gameState === GameState.MENU && renderMap()} 
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
              <h2 className="text-2xl font-bold text-center text-gray-800">ПАУЗА</h2>
              <button onClick={() => setGameState(GameState.PLAYING)} className="bg-blue-500 text-white p-3 rounded-lg font-bold uppercase shadow-md active:translate-y-1">Продолжить</button>
              <button onClick={handleHome} className="bg-gray-200 text-gray-700 p-3 rounded-lg font-bold uppercase shadow-sm active:translate-y-1">В Меню</button>
           </div>
        </div>
      )}

      {(gameState === GameState.WON || gameState === GameState.LOST) && renderResult(gameState === GameState.WON)}
    </div>
  );
}