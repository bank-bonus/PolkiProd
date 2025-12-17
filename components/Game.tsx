import React, { useState, useEffect } from 'react';
import { GameItem, ItemType, LevelConfig } from '../types.ts';
import { MAX_TRAY_SIZE, ITEM_ICONS, ITEM_COLORS } from '../constants.tsx';
import { TopBar } from './TopBar.tsx';
import { Tray } from './Tray.tsx';

interface GameProps {
  levelConfig: LevelConfig;
  onGameOver: (won: boolean, stars: number) => void;
  onPause: () => void;
}

export const Game: React.FC<GameProps> = ({ levelConfig, onGameOver, onPause }) => {
  const [items, setItems] = useState<GameItem[]>([]);
  const [tray, setTray] = useState<GameItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimitSeconds);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [matchedType, setMatchedType] = useState<ItemType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize Level
  useEffect(() => {
    setIsInitialized(false);
    generateLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelConfig]);

  // Timer
  useEffect(() => {
    if (!isInitialized) return;
    
    if (timeLeft <= 0) {
      onGameOver(false, 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onGameOver, isInitialized]);

  const generateLevel = () => {
    const newItems: GameItem[] = [];
    const { totalSets, itemTypes, shelfCount, slotsPerShelf, layersPerSlot } = levelConfig;
    
    // Create pool of types (3 of each type per set)
    let typePool: ItemType[] = [];
    for (let i = 0; i < totalSets; i++) {
      const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      typePool.push(randomType, randomType, randomType);
    }
    
    // Shuffle pool
    typePool = typePool.sort(() => Math.random() - 0.5);

    // Helper to randomize positions
    const positions: {shelf: number, slot: number, layer: number}[] = [];
    for(let s = 0; s < shelfCount; s++) {
      for(let sl = 0; sl < slotsPerShelf; sl++) {
        for(let l = 0; l < layersPerSlot; l++) {
           positions.push({ shelf: s, slot: sl, layer: l });
        }
      }
    }
    
    // Shuffle positions
    const usedPositions = positions.sort(() => Math.random() - 0.5).slice(0, typePool.length);

    let poolIndex = 0;
    usedPositions.forEach((pos, index) => {
      if (poolIndex < typePool.length) {
        newItems.push({
          id: `item-${index}`,
          type: typePool[poolIndex],
          shelfIndex: pos.shelf,
          slotIndex: pos.slot,
          layer: pos.layer,
          isMatched: false
        });
        poolIndex++;
      }
    });

    setItems(newItems);
    setTray([]);
    setTimeLeft(levelConfig.timeLimitSeconds);
    setTimeout(() => setIsInitialized(true), 100);
  };

  const isBlocked = (targetItem: GameItem, allItems: GameItem[]) => {
    return allItems.some(item => 
      !item.isMatched &&
      item.id !== targetItem.id &&
      item.shelfIndex === targetItem.shelfIndex &&
      item.slotIndex === targetItem.slotIndex &&
      item.layer > targetItem.layer
    );
  };

  const handleItemClick = (clickedItem: GameItem) => {
    if (isProcessingMatch) return;
    if (tray.length >= MAX_TRAY_SIZE) return; 
    if (isBlocked(clickedItem, items)) return; 

    const newTray = [...tray, clickedItem];
    setItems(prev => prev.filter(i => i.id !== clickedItem.id));
    setTray(newTray);
  };

  useEffect(() => {
    if (tray.length === 0) return;

    const typeCounts: Record<string, number> = {};
    tray.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    const foundMatchedType = Object.keys(typeCounts).find(key => typeCounts[key] >= 3) as ItemType | undefined;

    if (foundMatchedType) {
      setIsProcessingMatch(true);
      setMatchedType(foundMatchedType);

      setTimeout(() => {
        setTray(prev => {
          let removedCount = 0;
          const newTray: GameItem[] = [];
          for (const item of prev) {
            if (item.type === foundMatchedType && removedCount < 3) {
              removedCount++;
            } else {
              newTray.push(item);
            }
          }
          return newTray;
        });
        setIsProcessingMatch(false);
        setMatchedType(null);
      }, 500); 
    } else {
      if (tray.length >= MAX_TRAY_SIZE) {
        onGameOver(false, 0);
      }
    }
  }, [tray, onGameOver]);

  useEffect(() => {
    if (!isInitialized) return;

    if (items.length === 0 && tray.length === 0) {
      const stars = timeLeft >= levelConfig.threeStarThreshold ? 3 
                  : timeLeft >= levelConfig.twoStarThreshold ? 2 
                  : 1;
      onGameOver(true, stars);
    }
  }, [items.length, tray.length, timeLeft, levelConfig, onGameOver, isInitialized]);

  const shelves = Array.from({ length: levelConfig.shelfCount }).map((_, shelfIdx) => {
    const shelfItems = items.filter(i => i.shelfIndex === shelfIdx);
    return { index: shelfIdx, items: shelfItems };
  });

  return (
    <div className="flex flex-col h-full bg-[#2a1b15] overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4a2c20_0%,_#1a0f0a_100%)] z-0"></div>
      
      {/* Top Bar */}
      <div className="flex-none z-30">
        <TopBar 
            level={levelConfig.levelNumber} 
            timeLeft={timeLeft} 
            totalTime={levelConfig.timeLimitSeconds} 
            onPause={onPause}
            score={0}
        />
      </div>
      
      {/* Main Rack Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 py-4 px-2 scroll-smooth">
        <div className="max-w-2xl mx-auto relative mt-2 mb-8">
           
           {/* The Rack Container */}
           <div className="relative bg-[#3e2415] rounded-t-3xl rounded-b-lg p-3 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-x-8 border-t-8 border-[#2b170f]">
              
              {/* Rack Header/Crown */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#2b170f] px-8 py-2 rounded-t-xl border-t-2 border-[#5c3a21] shadow-lg">
                 <div className="text-[#8b5a36] font-bold text-xs tracking-widest uppercase">Shelf Unit {levelConfig.levelNumber}</div>
              </div>

              {/* Side shadows for depth */}
              <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>

              <div className="flex flex-col gap-5 md:gap-8">
                {shelves.map(shelf => (
                  <div 
                    key={shelf.index} 
                    className="relative w-full h-28 md:h-32 perspective-shelf"
                  >
                    {/* Back of shelf (darkness) */}
                    <div className="absolute inset-0 bg-[#24130b] rounded-md shadow-inner"></div>

                    {/* Shelf Floor */}
                    <div className="absolute bottom-0 w-full h-4 bg-[#5c3a21] border-t border-[#8b5a36] shadow-md z-20 flex items-center justify-center">
                        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20"></div>
                        {/* Price tag holder strip */}
                        <div className="absolute top-0 w-full h-1 bg-[#2b170f]/50"></div>
                    </div>

                    {/* Items Container */}
                    <div className="absolute bottom-4 left-0 w-full h-full flex justify-around items-end px-2 z-10 pb-1">
                      {Array.from({ length: levelConfig.slotsPerShelf }).map((_, slotIdx) => {
                          const slotItems = shelf.items.filter(i => i.slotIndex === slotIdx);
                          slotItems.sort((a, b) => a.layer - b.layer);
                          
                          if (slotItems.length === 0) {
                              return <div key={slotIdx} className="w-16 h-full pointer-events-none" />;
                          }

                          return (
                            <div key={slotIdx} className="relative w-16 h-20 md:w-20 md:h-24">
                              {slotItems.map((item) => {
                                  const blocked = isBlocked(item, items);
                                  const translateY = -(item.layer * 5); 
                                  const scale = 1 + (item.layer * 0.05);
                                  // Dim blocked items more aggressively for visual clarity
                                  const brightness = blocked ? 'brightness-[0.4] grayscale-[0.6]' : 'brightness-100 hover:brightness-110 hover:-translate-y-1';
                                  const shadow = item.layer === 0 ? 'shadow-md' : 'shadow-[0_5px_15px_rgba(0,0,0,0.5)]';

                                  return (
                                    <button
                                      key={item.id}
                                      disabled={blocked}
                                      onClick={() => handleItemClick(item)}
                                      className={`
                                        absolute bottom-0 left-0 w-full h-full 
                                        rounded-xl border-b-4 
                                        transition-all duration-300 transform
                                        flex items-center justify-center p-2
                                        ${ITEM_COLORS[item.type]}
                                        ${brightness}
                                        ${shadow}
                                        active:scale-95
                                      `}
                                      style={{
                                        zIndex: item.layer,
                                        transform: `translateY(${translateY}px) scale(${scale})`,
                                        cursor: blocked ? 'default' : 'pointer',
                                        touchAction: 'manipulation'
                                      }}
                                    >
                                      <div className="w-full h-full bg-white/40 rounded-lg p-1 backdrop-blur-sm shadow-inner">
                                        {ITEM_ICONS[item.type]}
                                      </div>
                                      {blocked && <div className="absolute inset-0 bg-black/40 rounded-xl pointer-events-none" />}
                                    </button>
                                  );
                              })}
                            </div>
                          );
                      })}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Tray */}
      <div className="flex-none w-full z-40 relative">
          {/* Shadow casting up from tray */}
          <div className="absolute -top-10 left-0 w-full h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
          <div className="bg-[#24130b] w-full p-2 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.7)] border-t border-[#5c3a21]">
             <div className="max-w-lg mx-auto">
                <Tray items={tray} matchedType={matchedType} />
             </div>
          </div>
      </div>
    </div>
  );
};