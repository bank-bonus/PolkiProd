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
    // Slight delay to ensure render cycle catches up before allowing win condition
    setTimeout(() => setIsInitialized(true), 100);
  };

  const isBlocked = (targetItem: GameItem, allItems: GameItem[]) => {
    // An item is blocked if there is another item in the same shelf & slot with a HIGHER layer
    return allItems.some(item => 
      !item.isMatched && // Active item
      item.id !== targetItem.id && // Not self
      item.shelfIndex === targetItem.shelfIndex &&
      item.slotIndex === targetItem.slotIndex &&
      item.layer > targetItem.layer
    );
  };

  const handleItemClick = (clickedItem: GameItem) => {
    if (isProcessingMatch) return;
    if (tray.length >= MAX_TRAY_SIZE) return; // Tray full
    if (isBlocked(clickedItem, items)) return; // Blocked by item in front

    // Move to tray
    const newTray = [...tray, clickedItem];
    
    setItems(prev => prev.filter(i => i.id !== clickedItem.id));
    setTray(newTray);
  };

  // Check for matches in tray
  useEffect(() => {
    if (tray.length === 0) return;

    // Check for 3 of a kind
    const typeCounts: Record<string, number> = {};
    tray.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    const foundMatchedType = Object.keys(typeCounts).find(key => typeCounts[key] >= 3) as ItemType | undefined;

    if (foundMatchedType) {
      setIsProcessingMatch(true);
      setMatchedType(foundMatchedType);

      // Delay to show animation
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
      }, 500); // 500ms for visual effect
    } else {
      if (tray.length >= MAX_TRAY_SIZE) {
        onGameOver(false, 0);
      }
    }
  }, [tray, onGameOver]);

  // Separate Effect for Win Condition
  useEffect(() => {
    // Only check for win if the level has been initialized
    if (!isInitialized) return;

    if (items.length === 0 && tray.length === 0) {
      // WIN
      const stars = timeLeft >= levelConfig.threeStarThreshold ? 3 
                  : timeLeft >= levelConfig.twoStarThreshold ? 2 
                  : 1;
      onGameOver(true, stars);
    }
  }, [items.length, tray.length, timeLeft, levelConfig, onGameOver, isInitialized]);

  // Rendering Shelves
  const shelves = Array.from({ length: levelConfig.shelfCount }).map((_, shelfIdx) => {
    const shelfItems = items.filter(i => i.shelfIndex === shelfIdx);
    return { index: shelfIdx, items: shelfItems };
  });

  return (
    <div className="flex flex-col h-full bg-[#822d2d] overflow-hidden">
      <div className="flex-none z-30">
        <TopBar 
            level={levelConfig.levelNumber} 
            timeLeft={timeLeft} 
            totalTime={levelConfig.timeLimitSeconds} 
            onPause={onPause}
            score={0}
        />
      </div>
      
      {/* Game Area - Flex-1 to take available space, scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gradient-to-b from-[#822d2d] to-[#4a1a1a] scroll-smooth">
        
        <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto mt-4 pb-8">
          {shelves.map(shelf => (
            <div 
              key={shelf.index} 
              className="relative w-full h-28 md:h-32 bg-[#5c3a21] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-b-8 border-[#3e2415] flex items-end px-4 flex-shrink-0"
              style={{ perspective: '1000px' }}
            >
              {/* Shelf surface texture */}
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 rounded-lg pointer-events-none"></div>
              
              <div className="relative w-full h-24 flex justify-around items-end mb-2">
                 {Array.from({ length: levelConfig.slotsPerShelf }).map((_, slotIdx) => {
                    const slotItems = shelf.items.filter(i => i.slotIndex === slotIdx);
                    // Sort by layer ascending (0 back, 1 front)
                    slotItems.sort((a, b) => a.layer - b.layer);
                    
                    if (slotItems.length === 0) {
                        return <div key={slotIdx} className="w-16 h-full pointer-events-none" />;
                    }

                    return (
                      <div key={slotIdx} className="relative w-16 h-20 md:w-20 md:h-24">
                        {slotItems.map((item) => {
                            const blocked = isBlocked(item, items);
                            // Visual offset for depth
                            const translateY = -(item.layer * 4); 
                            const scale = 1 + (item.layer * 0.05);
                            const brightness = blocked ? 'brightness-50 grayscale-[0.5]' : 'brightness-100 hover:brightness-110';
                            const shadow = item.layer === 0 ? 'shadow-md' : 'shadow-xl';

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
                                  // Ensure button touch target is good
                                  touchAction: 'manipulation'
                                }}
                              >
                                {/* Inner Icon */}
                                <div className="w-full h-full bg-white/40 rounded-lg p-1 backdrop-blur-sm">
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

      {/* Fixed Tray at Bottom using flex-none so it pushes game area up */}
      <div className="flex-none w-full bg-[#4a1a1a] z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
         <div className="w-full max-w-lg mx-auto p-2 pb-6">
            <Tray items={tray} matchedType={matchedType} />
         </div>
      </div>
    </div>
  );
};