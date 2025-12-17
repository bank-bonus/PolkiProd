import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Game } from './components/Game.tsx';
import { LevelConfig, ItemType, GameState, PlayerProgress } from './types.ts';
import { Play, Star, RotateCcw, Map as MapIcon, Lock, Cloud, Trees, Store, Tv } from 'lucide-react';
import { MAX_LEVELS } from './constants.tsx';

// --- Helper to Generate Level Configs ---
const getLevelConfig = (level: number): LevelConfig => {
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
  
  // Ensure we have sets of 3
  let sets = Math.floor(targetTotalItems / 3);
  sets = Math.max(5 + level * 2, sets);
  
  // Calculate Moves: Minimum moves needed + buffer
  // Perfect play = 1 click per item. Buffer = 10-20 extra clicks.
  const perfectMoves = sets * 3;
  const buffer = 10 + Math.floor(level * 2);
  const moveLimit = perfectMoves + buffer;

  return {
    levelNumber: level,
    moveLimit: moveLimit,
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
  // Store extra moves if user watched ad
  const [extraMoves, setExtraMoves] = useState(0); 
  
  const [progress, setProgress] = useState<PlayerProgress>({
    unlockedLevel: 1,
    stars: {},
  });
  const [lastGameResult, setLastGameResult] = useState<{won: boolean, stars: number} | null>(null);

  const levelConfig = useMemo(() => {
    const config = getLevelConfig(currentLevel);
    // Apply extra moves if any (only applies once)
    return { ...config, moveLimit: config.moveLimit + extraMoves };
  }, [currentLevel, extraMoves]);

  // Scroll to current level on mount
  const currentLevelRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (gameState === GameState.MENU || gameState === GameState.MAP) {
      if (currentLevelRef.current) {
        currentLevelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [gameState]);

  const handleLevelSelect = (level: number) => {
    if (level <= progress.unlockedLevel) {
      setCurrentLevel(level);
      setExtraMoves(0); // Reset extras
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
      setExtraMoves(0);
      setGameState(GameState.PLAYING);
    } else {
      setGameState(GameState.MAP);
    }
  };

  const handleRetry = () => {
    setExtraMoves(0);
    setGameState(GameState.PLAYING);
  };

  const handleWatchAd = () => {
    // Mock Yandex Ad Call
    console.log("Showing Ad...");
    // Simulate Ad duration
    setTimeout(() => {
        setExtraMoves(5);
        setGameState(GameState.PLAYING);
    }, 1500);
  };

  const handleHome = () => {
    setGameState(GameState.MAP);
  };

  // --- Screens ---

  const renderMap = () => (
    <div className="h-screen relative overflow-hidden flex flex-col font-fredoka bg-gradient-to-b from-[#4facfe] to-[#00f2fe]">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-10 left-[10%] opacity-80 animate-[float_20s_linear_infinite]"><Cloud size={64} fill="white" className="text-white" /></div>
         <div className="absolute top-40 left-[60%] opacity-60 animate-[float_25s_linear_infinite]"><Cloud size={90} fill="white" className="text-white" /></div>
         {/* Hills */}
         <div className="absolute bottom-0 w-full h-1/4 bg-[#43e97b] rounded-t-[100%] scale-150 z-0 shadow-inner"></div>
         <div className="absolute bottom-0 w-full h-1/5 bg-[#38f9d7] rounded-t-[50%] scale-110 translate-x-20 z-0 opacity-80"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex justify-between items-center bg-transparent">
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
            <div className="bg-blue-500 rounded-full p-2 text-white">
                <MapIcon size={18} />
            </div>
            <span className="font-black text-blue-900 text-lg">WORLD MAP</span>
         </div>
      </div>

      {/* Scrollable Map Area */}
      <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden z-10 custom-scrollbar scroll-smooth">
         <div className="w-full max-w-md mx-auto relative flex flex-col-reverse items-center min-h-[1600px] pb-32 pt-20">
            
            {/* Dashed Path */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
               <path 
                  d={(() => {
                    let path = "";
                    const centerX = 50; 
                    const offsetX = 25; 
                    
                    for(let i=0; i<MAX_LEVELS; i++) {
                       const y = 1450 - (i * 120); 
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
                  className="drop-shadow-sm"
               />
            </svg>

            {Array.from({ length: MAX_LEVELS }).map((_, i) => {
               const level = i + 1;
               const isUnlocked = level <= progress.unlockedLevel;
               const stars = progress.stars[level] || 0;
               const isCurrent = level === progress.unlockedLevel;
               
               const offsetClass = i % 2 === 0 ? '-translate-x-[25vw] md:-translate-x-32' : 'translate-x-[25vw] md:translate-x-32';
               
               // Ref for scrolling
               const ref = isCurrent ? currentLevelRef : null;

               return (
                 <div key={level} className="relative flex items-center justify-center w-full h-[120px]">
                   
                   {/* Level Node */}
                   <div className={`transform ${offsetClass} relative z-10 group transition-transform duration-500`}>
                     <button
                       ref={ref}
                       onClick={() => handleLevelSelect(level)}
                       disabled={!isUnlocked}
                       className={`
                         relative w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center 
                         transition-all duration-300 transform border-b-[8px]
                         ${isUnlocked 
                            ? isCurrent 
                                ? 'bg-[#ffcf00] border-[#d48806] scale-110 shadow-[0_0_30px_rgba(255,207,0,0.6)] z-20' 
                                : 'bg-white border-[#cbd5e1] hover:-translate-y-1' 
                            : 'bg-slate-200 border-slate-300 opacity-80 grayscale'
                         }
                       `}
                     >
                       {isUnlocked ? (
                         <>
                           <span className={`text-3xl font-black drop-shadow-sm ${isCurrent ? 'text-[#875900]' : 'text-slate-600'}`}>
                              {level}
                           </span>
                           {/* Stars */}
                           <div className="absolute -bottom-4 bg-white px-2 py-1 rounded-full shadow-md flex gap-0.5 border border-slate-100">
                              {[1, 2, 3].map(s => (
                                  <Star 
                                    key={s} 
                                    size={10} 
                                    fill={s <= stars ? "#fbbf24" : "#e2e8f0"} 
                                    className={s <= stars ? "text-amber-400" : "text-slate-200"}
                                  />
                              ))}
                           </div>
                         </>
                       ) : (
                         <Lock className="text-slate-400" size={24} />
                       )}
                       
                       {/* Current Level Pulse Ring */}
                       {isCurrent && (
                         <span className="absolute flex h-full w-full">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-[2rem] bg-amber-400 opacity-75"></span>
                         </span>
                       )}
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
          <div className="bg-white/20 p-2 rounded-full"><Play fill="currentColor" size={24} /></div>
          <span>Play Level {progress.unlockedLevel}</span>
        </button>
      </div>
    </div>
  );

  const renderResult = (won: boolean) => (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`
         bg-white rounded-[2.5rem] p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden border-8
         ${won ? 'border-[#76c043]' : 'border-red-400'}
         animate-bounce-in
      `}>
        
        {/* Confetti / Burst Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-yellow-200 via-transparent to-transparent"></div>

        <h2 className={`text-5xl font-black mb-4 uppercase tracking-tighter drop-shadow-sm transform -rotate-2 ${won ? 'text-[#76c043]' : 'text-red-500'}`}>
          {won ? 'You Win!' : 'Failed!'}
        </h2>

        {/* Stars */}
        {won && (
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => {
               const active = s <= (lastGameResult?.stars || 0);
               return (
                 <div key={s} className="relative">
                    <Star 
                        size={64} 
                        className={`transform transition-all duration-700 ${active ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-xl rotate-12' : 'fill-slate-100 text-slate-200'}`}
                    />
                 </div>
               )
            })}
          </div>
        )}

        {!won && (
           <div className="mb-6 flex flex-col items-center gap-2">
              <div className="text-6xl animate-pulse">😰</div>
              <p className="text-slate-500 font-bold">Out of moves!</p>
           </div>
        )}

        <div className="space-y-3 relative z-10 mt-2">
          {won ? (
             <button 
               onClick={handleNextLevel}
               className="w-full py-4 bg-[#76c043] hover:bg-[#65a639] text-white font-black rounded-2xl shadow-[0_6px_0_#4e8529] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-xl"
             >
               Next Level <Play size={24} fill="currentColor" />
             </button>
          ) : (
             <>
               <button 
                 onClick={handleWatchAd}
                 className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl shadow-[0_6px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg border-2 border-blue-400"
               >
                 <Tv size={24} /> +5 Moves (Ad)
               </button>
               
               <button 
                  onClick={handleRetry}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-[0_6px_0_#92400e] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg"
                >
                  <RotateCcw size={20} /> Retry
                </button>
            </>
          )}

          <button 
            onClick={handleHome}
            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-sm mt-2"
          >
            Back to Map
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
          key={`${currentLevel}-${extraMoves}`} // Remount if extra moves added
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
              <button onClick={handleHome} className="bg-slate-200 text-slate-600 p-4 rounded-xl font-bold uppercase shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none transition-all">Exit</button>
           </div>
        </div>
      )}

      {(gameState === GameState.WON || gameState === GameState.LOST) && renderResult(gameState === GameState.WON)}
    </div>
  );
}