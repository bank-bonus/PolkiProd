
export enum ItemType {
  APPLE = 'apple',
  BANANA = 'banana',
  CHERRY = 'cherry',
  MILK = 'milk',
  COOKIE = 'cookie',
  SODA = 'soda',
  PIZZA = 'pizza',
  BURGER = 'burger',
  ICECREAM = 'icecream',
  GIFT = 'gift',
  CANDY = 'candy',
  DIAMOND = 'diamond'
}

export interface GameItem {
  id: string;
  type: ItemType;
  layer: number; // 0 is back, 1 is front
  shelfIndex: number;
  slotIndex: number;
  isMatched: boolean;
}

export interface LevelConfig {
  levelNumber: number;
  timeLimitSeconds: number;
  threeStarThreshold: number; // Seconds remaining
  twoStarThreshold: number;
  itemTypes: ItemType[];
  shelfCount: number;
  slotsPerShelf: number;
  layersPerSlot: number; // Max layers
  totalSets: number; // How many sets of 3 to spawn
}

export enum GameState {
  MENU = 'MENU',
  MAP = 'MAP',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WON = 'WON',
  LOST = 'LOST'
}

export interface PlayerProgress {
  unlockedLevel: number; // Max level reached
  stars: Record<number, number>; // Level number -> Stars earned
  hearts: number;
}
