import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameItem, ItemType, GameState, LevelConfig } from '../types';
import { MAX_TRAY_SIZE, ITEM_ICONS, ITEM_COLORS } from '../constants';
import { TopBar } from './TopBar';
import { Tray } from './Tray';

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
  
  // Initialize Level
  useEffect(() => {
    generateLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelConfig]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(false, 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onGameOver]);

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

    // Distribute to grid
    // We fill shelves 0 to shelfCount-1
    // Slots 0 to slotsPerShelf-1
    // Layers 0 to layersPerSlot-1 (0 is back, higher is front)
    
    let poolIndex = 0;
    
    // We need to ensure we don't have empty gaps that make items unreachable if strictly layer-based.
    // Strategy: Fill layers from bottom (0) to top.
    
    // Helper to randomize positions
    const positions: {shelf: number, slot: number, layer: number}[] = [];
    for(let s = 0; s < shelfCount; s++) {
      for(let sl = 0; sl < slotsPerShelf; sl++) {
        for(let l = 0; l < layersPerSlot; l++) {
           positions.push({ shelf: s, slot: sl, layer: l });
        }
      }
    }
    
    // Shuffle positions to make layout random, but we need to prioritize filling lower layers first? 
    // Actually, in 3D matching, usually positions are fixed per level design. 
    // Here we procedurally generate. 
    // To ensure fairness, we just fill randomly. A front item blocks a back item.
    
    // Let's only use as many positions as we have items.
    const usedPositions = positions.sort(() => Math.random() - 0.5).slice(0, typePool.length);

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
    
    // Remove from shelf (visually only, we keep it in array but update state or filter?)
    // Better to filter out of 'items' to 'tray'
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

    const matchedType = Object.keys(typeCounts).find(key => typeCounts[key] >= 3);

    if (matchedType) {
      setIsProcessingMatch(true);
      setTimeout(() => {
        setTray(prev => {
          // Remove 3 instances of matchedType
          let removedCount = 0;
          const newTray: GameItem[] = [];
          
          // We need to keep order roughly, but usually match-3 games collapse matches
          // Let's iterate and keep only non-matches or matches beyond 3 (unlikely to happen if we check often)
          for (const item of prev) {
            if (item.type === matchedType && removedCount < 3) {
              removedCount++;
            } else {
              newTray.push(item);
            }
          }
          return newTray;
        });
        setIsProcessingMatch(false);
      }, 300); // Small delay for visual "match" effect
    } else {
      // No match, check loss condition
      if (tray.length >= MAX_TRAY_SIZE) {
        onGameOver(false, 0);
      }
    }
    
    // Check Win Condition: No items left on shelf AND tray is empty
    // Wait, tray empty is not enough, tray must empty via matches.
    // If items is empty and tray is empty, we win.
  }, [tray, onGameOver]);

  // Separate Effect for Win Condition to avoid race conditions
  useEffect(() => {
    if (items.length === 0 && tray.length === 0) {
      // WIN
      const stars = timeLeft >= levelConfig.threeStarThreshold ? 3 
                  : timeLeft >= levelConfig.twoStarThreshold ? 2 
                  : 1;
      onGameOver(true, stars);
    }
  }, [items.length, tray.length, timeLeft, levelConfig, onGameOver]);


  // Rendering Shelves
  // We need to group items by shelf for rendering
  const shelves = Array.from({ length: levelConfig.shelfCount }).map((_, shelfIdx) => {
    const shelfItems = items.filter(i => i.shelfIndex === shelfIdx);
    return { index: shelfIdx, items: shelfItems };
  });

  return (
    <div className="flex flex-col h-full bg-[#822d2d]">
      <TopBar 
        level={levelConfig.levelNumber} 
        timeLeft={timeLeft} 
        totalTime={levelConfig.timeLimitSeconds} 
        onPause={onPause}
        score={0}
      />
      
      {/* Game Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative bg-gradient-to-b from-[#822d2d] to-[#4a1a1a]">
        
        <div className="flex flex-col gap-6 pb-32 max-w-2xl mx-auto mt-4">
          {shelves.map(shelf => (
            <div key={shelf.index} className="relative w-full h-28 md:h-32 bg-[#5c3a21] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-b-8 border-[#3e2415] flex items-end px-4 perspective-1000">
              {/* Shelf surface */}
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 rounded-lg pointer-events-none"></div>
              
              <div className="relative w-full h-24 flex justify-around items-end mb-2">
                 {/* Slots visualization - purely logical, but items are absolute within this relative container if we wanted strict slots. 
                     For responsive flex layout, we just map items. 
                     However, items need to stack. We need to render slots.
                 */}
                 {Array.from({ length: levelConfig.slotsPerShelf }).map((_, slotIdx) => {
                    // Find items in this slot
                    const slotItems = shelf.items.filter(i => i.slotIndex === slotIdx);
                    // Sort by layer ascending (0 back, 1 front)
                    slotItems.sort((a, b) => a.layer - b.layer);
                    
                    if (slotItems.length === 0) {
                        return <div key={slotIdx} className="w-16 h-full" />; // Empty placeholder
                    }

                    return (
                      <div key={slotIdx} className="relative w-16 h-20 md:w-20 md:h-24">
                        {slotItems.map((item, idx) => {
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
                                  cursor: blocked ? 'default' : 'pointer'
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

      {/* Fixed Tray at Bottom */}
      <div className="absolute bottom-0 w-full p-4 pointer-events-none flex justify-center">
         <div className="pointer-events-auto w-full max-w-lg">
            <Tray items={tray} />
         </div>
      </div>
    </div>
  );
};