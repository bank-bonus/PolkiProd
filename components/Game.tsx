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
  
  // Game Logic State
  const [movesLeft, setMovesLeft] = useState(levelConfig.moveLimit);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  // REMOVED: isAnimating (blocked input), replacing with simple visual logic only
  const [matchedType, setMatchedType] = useState<ItemType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize Level
  useEffect(() => {
    setIsInitialized(false);
    generateLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelConfig]);

  // Check Loss Conditions (Moves or Tray Full)
  useEffect(() => {
    if (!isInitialized || isProcessingMatch) return;

    if (movesLeft <= 0 || tray.length > MAX_TRAY_SIZE) {
       // Allow a small delay for user to realize what happened or for matches to clear
       const timeout = setTimeout(() => {
         // Double check we didn't just win or clear space
         // If tray is full, game over. If moves are 0, game over.
         if (tray.length > MAX_TRAY_SIZE || (movesLeft <= 0 && items.length > 0)) {
            onGameOver(false, 0);
         }
       }, 500);
       return () => clearTimeout(timeout);
    }
  }, [movesLeft, tray.length, isInitialized, isProcessingMatch, onGameOver, items.length]);

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
    setMovesLeft(levelConfig.moveLimit);
    setTimeout(() => setIsInitialized(true), 100);
  };

  const isBlocked = (targetItem: GameItem, allItems: GameItem[]) => {
    // An item is blocked if there is another item in the same shelf & slot with a HIGHER layer
    return allItems.some(item => 
      !item.isMatched &&
      item.id !== targetItem.id &&
      item.shelfIndex === targetItem.shelfIndex &&
      item.slotIndex === targetItem.slotIndex &&
      item.layer > targetItem.layer
    );
  };

  const handleItemClick = (clickedItem: GameItem) => {
    // We allow clicking even if processing match, to queue items up, unless tray is absolutely full
    if (tray.length >= MAX_TRAY_SIZE) return; 
    if (isBlocked(clickedItem, items)) return; 
    if (movesLeft <= 0) return;

    setMovesLeft(prev => Math.max(0, prev - 1));

    // Immediately move to tray state. 
    // In a full engine, we'd spawn a flying particle. 
    // Here we just move it. The Tray component handles entry animation.
    const newTray = [...tray, clickedItem];
    setItems(prev => prev.filter(i => i.id !== clickedItem.id));
    setTray(newTray);
  };

  // Check for matches in tray
  useEffect(() => {
    if (tray.length === 0) return;

    const typeCounts: Record<string, number> = {};
    tray.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    const foundMatchedType = Object.keys(typeCounts).find(key => typeCounts[key] >= 3) as ItemType | undefined;

    if (foundMatchedType) {
      if (!isProcessingMatch) {
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
          }, 400); // Faster clear for snappy feel
      }
    }
  }, [tray, isProcessingMatch]);

  // Win Condition
  useEffect(() => {
    if (!isInitialized) return;

    if (items.length === 0 && tray.length === 0) {
      // Calculate Stars based on moves left ratio
      const ratio = movesLeft / levelConfig.moveLimit;
      const stars = ratio >= 0.4 ? 3 : ratio >= 0.2 ? 2 : 1;
      onGameOver(true, stars);
    }
  }, [items.length, tray.length, movesLeft, levelConfig, onGameOver, isInitialized]);

  const shelves = Array.from({ length: levelConfig.shelfCount }).map((_, shelfIdx) => {
    const shelfItems = items.filter(i => i.shelfIndex === shelfIdx);
    return { index: shelfIdx, items: shelfItems };
  });

  return (
    <div className="flex flex-col h-full bg-[#3d271e] overflow-hidden relative font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#6d4c41_0%,_#2a1b15_100%)] z-0"></div>
      
      {/* Top Bar */}
      <div className="flex-none z-30 pt-safe-top">
        <TopBar 
            level={levelConfig.levelNumber} 
            movesLeft={movesLeft}
            totalMoves={levelConfig.moveLimit}
            onPause={onPause}
        />
      </div>
      
      {/* Main Rack Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 py-2 px-2 scroll-smooth">
        <div className="max-w-2xl mx-auto relative mt-4 mb-20">
           
           {/* The Rack Container */}
           <div className="relative bg-[#4e342e] rounded-t-[30px] rounded-b-xl p-3 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-x-[8px] border-t-[8px] border-[#3e2723]">
              
              {/* Rack Header - Integrated nicely */}
              <div className="w-full flex justify-center mb-6">
                 <div className="bg-[#3e2723] px-6 py-1 rounded-b-lg shadow-inner border-b border-white/10">
                    <span className="text-[#a1887f] font-bold text-xs tracking-widest uppercase">MARKET SHELF</span>
                 </div>
              </div>

              <div className="flex flex-col gap-6 md:gap-8">
                {shelves.map(shelf => (
                  <div 
                    key={shelf.index} 
                    className="relative w-full h-24 md:h-28"
                  >
                    {/* Shelf Floor */}
                    <div className="absolute bottom-0 w-full h-4 bg-[#5d4037] rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-0 flex items-center border-t border-[#8d6e63]">
                         <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                    </div>

                    {/* Items Container */}
                    <div className="absolute bottom-3 left-0 w-full h-full flex justify-around items-end px-2 z-10">
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
                                  const translateY = -(item.layer * 6); 
                                  const scale = 1 + (item.layer * 0.05);
                                  
                                  const filter = blocked 
                                    ? 'brightness(0.5) grayscale(0.5)' 
                                    : 'brightness(1) drop-shadow(0 4px 6px rgba(0,0,0,0.3))';
                                  
                                  const cursor = blocked ? 'cursor-default' : 'cursor-pointer';

                                  return (
                                    <button
                                      key={item.id}
                                      disabled={blocked}
                                      onClick={() => handleItemClick(item)}
                                      className={`
                                        absolute bottom-0 left-0 w-full h-full 
                                        rounded-xl border-b-[5px] 
                                        transition-all duration-200 transform
                                        flex items-center justify-center
                                        ${ITEM_COLORS[item.type]}
                                        active:scale-95
                                      `}
                                      style={{
                                        zIndex: item.layer,
                                        transform: `translateY(${translateY}px) scale(${scale})`,
                                        filter: filter,
                                        cursor: cursor,
                                        touchAction: 'manipulation'
                                      }}
                                    >
                                      <span className="text-4xl md:text-5xl select-none filter drop-shadow-sm">
                                        {ITEM_ICONS[item.type]}
                                      </span>
                                      
                                      {/* Front Highlight */}
                                      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none"></div>
                                      
                                      {/* Blocked Tint */}
                                      {blocked && <div className="absolute inset-0 bg-black/40 rounded-lg pointer-events-none" />}
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

      {/* Tray Area - Fixed at bottom */}
      <div className="flex-none w-full z-40 relative pb-safe-bottom">
          {/* Top shadow/gradient transition */}
          <div className="absolute -top-10 left-0 w-full h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
          
          <div className="bg-[#3e2723] w-full p-2 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.7)] border-t border-[#5d4037]">
             <div className="max-w-lg mx-auto">
                <Tray items={tray} matchedType={matchedType} />
             </div>
          </div>
      </div>
    </div>
  );
};