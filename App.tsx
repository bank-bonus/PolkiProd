import React, { useState, useMemo } from 'react';
import { Game } from './components/Game.tsx';
import { LevelConfig, ItemType, GameState, PlayerProgress } from './types.ts';
import { Play, Star, RotateCcw, Map as MapIcon, Lock, Cloud, Trees, Store } from 'lucide-react';
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
  const typeCount = Math.min(types.length, 3 + Math.floor(level * 0.8));
  const availableTypes = types.slice(0, typeCount);
  
  const shelfCount = Math.min(8, 2 + Math.ceil(level / 1.5));
  const slotsPerShelf = Math.min(6, 3 + Math.floor(level / 2));
  const layersPerSlot = Math.min(5, 2 + Math.floor(level / 2.5));

  const capacity = shelfCount * slotsPerShelf * layersPerSlot;
  const fillRate = 0.7 + (Math.min(level, 10) * 0.025); 
  let targetTotalItems = Math.floor(capacity * fillRate);
  
  let sets = Math.floor(targetTotalItems / 3);
  sets = Math.max(5 + level * 2, sets);

  const timeLimit = baseTime + (sets * 4); 

  return {
    levelNumber: level,
    timeLimitSeconds: timeLimit,
    threeStarThreshold: timeLimit * 0.6,
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
    <div className="h-screen relative overflow-hidden flex flex-col font-fredoka bg-gradient-to-b from-[#87CEEB] via-[#b8e2f2] to-[#90EE90]">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {/* Animated Clouds */}
         <div className="absolute top-10 left-[10%] opacity-80 animate-[float_20s_linear_infinite]">
            <Cloud size={64} fill="white" className="text-white drop-shadow-sm" />
         </div>
         <div className="absolute top-24 right-[15%] opacity-60 animate-[float_25s_linear_infinite_reverse]">
            <Cloud size={48} fill="white" className="text-white drop-shadow-sm" />
         </div>
         <div className="absolute top-40 left-[40%] opacity-40 animate-[float_30s_linear_infinite]">
            <Cloud size={80} fill="white" className="text-white drop-shadow-sm" />
         </div>

         {/* Hills at the bottom */}
         <div className="absolute bottom-0 w-full h-1/3 bg-[#76c043] rounded-t-[50%] scale-150 translate-y-20 z-0"></div>
         <div className="absolute bottom-0 w-full h-1/4 bg-[#5fa036] rounded-t-[40%] scale-125 translate-x-20 translate-y-10 z-0"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border-2 border-white flex items-center gap-2">
            <div className="bg-amber-500 rounded-lg p-1.5 text-white shadow-inner">
                <MapIcon size={20} />
            </div>
            <span className="font-bold text-slate-700 text-lg tracking-wide">MAP</span>
         </div>
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border-2 border-white flex items-center gap-2">
            <span className="text-red-500 drop-shadow-sm">❤️</span>
            <span className="font-bold text-slate-700 text-lg">{progress.hearts}</span>
         </div>
      </div>

      {/* Scrollable Map Area */}
      <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden z-10 custom-scrollbar">
         <div className="w-full max-w-md mx-auto relative flex flex-col-reverse items-center min-h-[1400px] pb-32 pt-20">
            
            {/* Path SVG */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
               <defs>
                 <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                   <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.2)"/>
                 </filter>
               </defs>
               <path 
                  d={(() => {
                    let path = "";
                    const stepY = 112; 
                    const centerX = 50; 
                    const offsetX = 25; // Wider wiggle
                    
                    for(let i=0; i<MAX_LEVELS; i++) {
                       const y = 1300 - (i * 110); 
                       const x = i % 2 === 0 ? centerX - offsetX : centerX + offsetX;
                       path += i === 0 ? `M ${x}% ${y} ` : `L ${x}% ${y} `;
                    }
                    return path;
                  })()}
                  fill="none" 
                  stroke="white" 
                  strokeWidth="16" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#shadow)"
               />
               <path 
                  d={(() => {
                    let path = "";
                    const centerX = 50; 
                    const offsetX = 25; 
                    for(let i=0; i<MAX_LEVELS; i++) {
                       const y = 1300 - (i * 110); 
                       const x = i % 2 === 0 ? centerX - offsetX : centerX + offsetX;
                       path += i === 0 ? `M ${x}% ${y} ` : `L ${x}% ${y} `;
                    }
                    return path;
                  })()}
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="12" 
                  strokeDasharray="20,15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>

            {Array.from({ length: MAX_LEVELS }).map((_, i) => {
               const level = i + 1;
               const isUnlocked = level <= progress.unlockedLevel;
               const stars = progress.stars[level] || 0;
               const isCurrent = level === progress.unlockedLevel;
               
               const offsetClass = i % 2 === 0 ? '-translate-x-[25vw] md:-translate-x-32' : 'translate-x-[25vw] md:translate-x-32';
               const yPos = i * 110; // To place decorations relative to nodes roughly

               return (
                 <div key={level} className={`relative flex items-center justify-center w-full h-[110px]`}>
                   
                   {/* Scenery Decorations (Randomly placed based on index) */}
                   {i % 3 === 0 && (
                     <div className={`absolute pointer-events-none opacity-90 ${i%2===0 ? 'right-[10%]' : 'left-[10%]'}`}>
                        <Trees className="text-green-700 w-12 h-12 md:w-16 md:h-16 drop-shadow-md" />
                     </div>
                   )}
                   {i === MAX_LEVELS - 1 && (
                     <div className="absolute -top-16 z-0">
                        <Store className="text-amber-600 w-24 h-24 drop-shadow-lg" />
                     </div>
                   )}

                   <div className={`transform ${offsetClass} relative z-10 group`}>
                     {/* Level Button */}
                     <button
                       onClick={() => handleLevelSelect(level)}
                       disabled={!isUnlocked}
                       className={`
                         relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center 
                         transition-all duration-300 transform
                         ${isUnlocked 
                            ? isCurrent 
                                ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-b-[6px] border-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110' 
                                : 'bg-gradient-to-b from-blue-400 to-blue-600 border-b-[6px] border-blue-800 shadow-xl hover:-translate-y-1' 
                            : 'bg-slate-300 border-b-[6px] border-slate-400 shadow-none cursor-not-allowed grayscale opacity-80'
                         }
                       `}
                     >
                       {isUnlocked ? (
                         <>
                           <span className="text-3xl font-black text-white drop-shadow-md font-fredoka">{level}</span>
                           <div className="absolute -bottom-3 bg-white/90 px-2 py-0.5 rounded-full shadow-sm flex gap-0.5 border border-slate-200">
                              {[1, 2, 3].map(s => (
                                  <Star 
                                    key={s} 
                                    size={10} 
                                    className={`fill-current ${s <= stars ? 'text-amber-400' : 'text-slate-200'}`} 
                                  />
                              ))}
                           </div>
                         </>
                       ) : (
                         <div className="bg-slate-400/50 p-2 rounded-full">
                            <Lock className="text-white" size={24} />
                         </div>
                       )}
                       
                       {/* Shine effect for current */}
                       {isCurrent && <div className="absolute inset-0 rounded-2xl ring-4 ring-white/50 animate-pulse"></div>}
                     </button>
                   </div>
                 </div>
               );
            })}
         </div>
      </div>
      
      {/* Footer Play Button */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40">
        <button 
           onClick={() => handleLevelSelect(progress.unlockedLevel)}
           className="w-full max-w-sm mx-auto flex items-center justify-center bg-[#76c043] hover:bg-[#65a639] text-white text-xl font-black py-4 rounded-2xl shadow-[0_6px_0_#4e8529,0_10px_20px_rgba(0,0,0,0.2)] active:shadow-[0_0px_0_#4e8529] active:translate-y-1.5 transition-all uppercase tracking-wide gap-3 border-2 border-[#8ede5e]"
        >
          <div className="bg-white/20 p-1 rounded-full"><Play fill="currentColor" size={24} /></div>
          <span>Play Level {progress.unlockedLevel}</span>
        </button>
      </div>
    </div>
  );

  const renderResult = (won: boolean) => (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-bounce-in relative overflow-hidden border-4 border-white ring-4 ring-black/10">
        {/* Decorative rays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[conic-gradient(from_0deg,transparent_0_20deg,rgba(255,200,0,0.1)_20_40deg,transparent_40_60deg,rgba(255,200,0,0.1)_60_80deg,transparent_80_100deg,rgba(255,200,0,0.1)_100_120deg,transparent_120_140deg,rgba(255,200,0,0.1)_140_160deg,transparent_160_180deg,rgba(255,200,0,0.1)_180_200deg,transparent_200_220deg,rgba(255,200,0,0.1)_220_240deg,transparent_240_260deg,rgba(255,200,0,0.1)_260_280deg,transparent_280_300deg,rgba(255,200,0,0.1)_300_320deg,transparent_320_340deg,rgba(255,200,0,0.1)_340_360deg)] animate-[spin_20s_linear_infinite] pointer-events-none"></div>

        <h2 className={`text-4xl font-black mb-6 relative z-10 uppercase drop-shadow-sm ${won ? 'text-[#76c043]' : 'text-red-500'}`}>
          {won ? 'AWESOME!' : 'OH NO!'}
        </h2>

        {/* Stars */}
        {won && (
          <div className="flex justify-center gap-2 mb-8 relative z-10">
            {[1, 2, 3].map(s => {
               const active = s <= (lastGameResult?.stars || 0);
               return (
                 <Star 
                    key={s} 
                    size={56} 
                    className={`transform transition-all duration-700 ${active ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-lg rotate-12' : 'fill-gray-100 text-gray-200'}`}
                    style={{ transitionDelay: `${s * 200}ms` }}
                 />
               )
            })}
          </div>
        )}

        {!won && (
           <div className="mb-8 flex justify-center relative z-10">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-inner border-4 border-red-100">
                 <span className="text-5xl animate-pulse">💔</span>
              </div>
           </div>
        )}

        <div className="space-y-3 relative z-10 mt-4">
          {won ? (
             <button 
               onClick={handleNextLevel}
               className="w-full py-4 bg-[#76c043] hover:bg-[#65a639] text-white font-bold rounded-xl shadow-[0_4px_0_#4e8529] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg"
             >
               Next Level <Play size={20} fill="currentColor" />
             </button>
          ) : (
            <button 
              onClick={handleRetry}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg"
            >
              <RotateCcw size={20} /> Try Again
            </button>
          )}

          <button 
            onClick={handleHome}
            className="w-full py-3 bg-white hover:bg-gray-50 text-slate-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase border-2 border-slate-200"
          >
            <MapIcon size={18} /> Map
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden font-fredoka select-none text-slate-800">
      <style>{`
        @keyframes float {
          0% { transform: translateX(0px); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0px); }
        }
        .font-fredoka { font-family: 'Fredoka', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
      
      {gameState === GameState.MENU && renderMap()} 
      {gameState === GameState.MAP && renderMap()}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={currentLevel} 
          levelConfig={levelConfig} 
          onGameOver={handleGameOver}
          onPause={() => setGameState(GameState.PAUSED)}
        />
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white p-8 rounded-[2rem] flex flex-col gap-4 w-72 shadow-2xl border-4 border-white/50 animate-pop-in">
              <h2 className="text-3xl font-black text-center text-slate-700 mb-2">PAUSED</h2>
              <button onClick={() => setGameState(GameState.PLAYING)} className="bg-[#76c043] text-white p-4 rounded-xl font-bold uppercase shadow-[0_4px_0_#4e8529] active:translate-y-1 active:shadow-none transition-all">Resume</button>
              <button onClick={handleHome} className="bg-slate-200 text-slate-600 p-4 rounded-xl font-bold uppercase shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none transition-all">Exit to Map</button>
           </div>
        </div>
      )}

      {(gameState === GameState.WON || gameState === GameState.LOST) && renderResult(gameState === GameState.WON)}
    </div>
  );
}