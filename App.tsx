import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Game } from './components/Game.tsx';
import { LevelConfig, ItemType, GameState, PlayerProgress } from './types.ts';
import { Play, Star, RotateCcw, Map as MapIcon, Lock, Cloud, Heart, Store, Tv, Home } from 'lucide-react';
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
  
  // Calculate Moves
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
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [extraMoves, setExtraMoves] = useState(0); 
  
  const [progress, setProgress] = useState<PlayerProgress>({
    unlockedLevel: 1,
    stars: {},
    lives: 5,
    lastLifeUpdate: Date.now()
  });
  const [lastGameResult, setLastGameResult] = useState<{won: boolean, stars: number} | null>(null);

  const levelConfig = useMemo(() => {
    const config = getLevelConfig(currentLevel);
    return { ...config, moveLimit: config.moveLimit + extraMoves };
  }, [currentLevel, extraMoves]);

  // Scroll to current level on mount
  const currentLevelRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (gameState === GameState.MAP) {
      setTimeout(() => {
         if (currentLevelRef.current) {
            currentLevelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
      }, 100);
    }
  }, [gameState]);

  const handleStartGame = () => {
    setGameState(GameState.MAP);
  };

  const handleLevelSelect = (level: number) => {
    if (level <= progress.unlockedLevel) {
      if (progress.lives > 0) {
        setCurrentLevel(level);
        setExtraMoves(0);
        setGameState(GameState.PLAYING);
      } else {
        alert("No lives left! Wait or watch an ad (mock).");
      }
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
      setProgress(prev => ({
        ...prev,
        lives: Math.max(0, prev.lives - 1)
      }));
      setGameState(GameState.LOST);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < MAX_LEVELS) {
      if (progress.lives > 0) {
        setCurrentLevel(prev => prev + 1);
        setExtraMoves(0);
        setGameState(GameState.PLAYING);
      }
    } else {
      setGameState(GameState.MAP);
    }
  };

  const handleRetry = () => {
    if (progress.lives > 0) {
      setExtraMoves(0);
      setGameState(GameState.PLAYING);
    }
  };

  const handleWatchAd = () => {
    // Mock Yandex Ad Call
    console.log("Showing Ad...");
    setTimeout(() => {
        setExtraMoves(5);
        setProgress(prev => ({...prev, lives: Math.min(5, prev.lives + 1)})); // Also give a life back potentially?
        setGameState(GameState.PLAYING);
    }, 1500);
  };

  const handleHome = () => {
    setGameState(GameState.MAP);
  };

  // --- Screens ---

  const renderStartScreen = () => (
    <div className="h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#FF9A9E] via-[#FECFEF] to-[#FECFEF]">
       {/* Background Decoration */}
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">🍎</div>
          <div className="absolute bottom-20 right-10 text-6xl opacity-20 animate-bounce" style={{animationDelay: '0.5s'}}>🍌</div>
          <div className="absolute top-1/3 right-1/4 text-8xl opacity-10 rotate-12">🥦</div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)]"></div>
       </div>

       <div className="z-10 text-center animate-pop-in">
          <div className="bg-white/30 backdrop-blur-md p-8 rounded-[3rem] border-4 border-white shadow-[0_20px_60px_rgba(255,100,100,0.3)]">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ff5e62] to-[#ff9966] drop-shadow-sm mb-2 tracking-tight">
              SHELF<br/>MATCH
            </h1>
            <p className="text-xl text-[#d45d79] font-bold tracking-[0.3em] uppercase mb-12">Master 3D</p>
            
            <button 
              onClick={handleStartGame}
              className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-black text-white transition duration-300 ease-out bg-[#ff5e62] rounded-full shadow-[0_10px_0_#c0392b] hover:bg-[#ff758c] active:translate-y-2 active:shadow-none"
            >
              <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-[#ff9966] group-hover:translate-x-0 ease">
                <Play size={40} fill="currentColor" />
              </span>
              <span className="absolute flex items-center justify-center w-full h-full text-white transition-all duration-300 transform group-hover:translate-x-full ease">
                START GAME
              </span>
              <span className="relative invisible">START GAME</span>
            </button>
          </div>
       </div>
    </div>
  );

  const renderMap = () => (
    <div className="h-screen relative overflow-hidden flex flex-col font-fredoka bg-gradient-to-b from-[#89f7fe] to-[#66a6ff]">
      
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
            <div className="bg-blue-500 rounded-full p-2 text-white">
                <MapIcon size={18} />
            </div>
            <span className="font-black text-blue-900 text-lg">MAP</span>
         </div>

         {/* Lives Counter */}
         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2">
            <div className="relative">
               <Heart size={28} fill="#ff4757" className="text-[#ff4757] animate-pulse" />
               <div className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-sm border border-red-200 text-red-500">+</div>
            </div>
            <span className="font-black text-slate-700 text-xl">{progress.lives}</span>
         </div>
      </div>

      {/* Scrollable Map Area */}
      <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden z-10 custom-scrollbar scroll-smooth">
         <div className="w-full max-w-md mx-auto relative flex flex-col-reverse items-center min-h-[1600px] pb-32 pt-20">
            
            {/* Path */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-60">
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
                  strokeWidth="12" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
               />
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
                  stroke="#66a6ff" 
                  strokeWidth="6" 
                  strokeDasharray="10,15"
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
                                ? 'bg-gradient-to-tr from-[#fbc2eb] to-[#a6c1ee] border-[#8faad4] scale-110 shadow-[0_0_30px_rgba(255,255,255,0.8)] z-20' 
                                : 'bg-white border-[#cbd5e1] hover:-translate-y-1 shadow-md' 
                            : 'bg-white/40 border-white/50 opacity-80'
                         }
                       `}
                     >
                       {isUnlocked ? (
                         <>
                           <span className={`text-3xl font-black drop-shadow-sm ${isCurrent ? 'text-white' : 'text-slate-600'}`}>
                              {level}
                           </span>
                           <div className="absolute -bottom-4 bg-white px-2 py-1 rounded-full shadow-sm flex gap-0.5 border border-slate-100">
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
                         <Lock className="text-white" size={24} />
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
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-yellow-200 via-transparent to-transparent"></div>

        <h2 className={`text-5xl font-black mb-4 uppercase tracking-tighter drop-shadow-sm transform -rotate-2 ${won ? 'text-[#76c043]' : 'text-red-500'}`}>
          {won ? 'You Win!' : 'Failed!'}
        </h2>

        {won && (
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => {
               const active = s <= (lastGameResult?.stars || 0);
               return (
                 <div key={s} className="relative">
                    <Star size={64} className={`transform transition-all duration-700 ${active ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-xl rotate-12' : 'fill-slate-100 text-slate-200'}`} />
                 </div>
               )
            })}
          </div>
        )}

        {!won && (
           <div className="mb-6 flex flex-col items-center gap-2">
              <div className="relative">
                 <Heart size={64} fill="#ff4757" className="text-red-500 animate-pulse" />
                 <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-2xl">-1</span>
              </div>
              <p className="text-slate-500 font-bold mt-2">Lives Remaining: {progress.lives}</p>
           </div>
        )}

        <div className="space-y-3 relative z-10 mt-2">
          {won ? (
             <button onClick={handleNextLevel} className="w-full py-4 bg-[#76c043] hover:bg-[#65a639] text-white font-black rounded-2xl shadow-[0_6px_0_#4e8529] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-xl">
               Next Level <Play size={24} fill="currentColor" />
             </button>
          ) : (
             <>
               <button onClick={handleWatchAd} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl shadow-[0_6px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg border-2 border-blue-400">
                 <Tv size={24} /> Get 5 Moves
               </button>
               
               <button onClick={handleRetry} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-[0_6px_0_#92400e] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase text-lg">
                  <RotateCcw size={20} /> Retry
                </button>
            </>
          )}

          <button onClick={handleHome} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-sm mt-2 flex items-center justify-center gap-2">
            <Home size={16} /> Home
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
      
      {gameState === GameState.START_SCREEN && renderStartScreen()}
      {(gameState === GameState.MENU || gameState === GameState.MAP) && renderMap()}
      
      {gameState === GameState.PLAYING && (
        <Game 
          key={`${currentLevel}-${extraMoves}`} 
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