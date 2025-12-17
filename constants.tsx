import React from 'react';
import { ItemType } from './types.ts';
import { 
  Apple, Banana, Cherry, Droplet, CircleDot, 
  Coffee, Pizza, Layers, 
  IceCream, Gift, Gem, Diamond
} from 'lucide-react';

export const MAX_TRAY_SIZE = 7;
export const MAX_LEVELS = 12;

// Using extremely standard icons to prevent import errors
export const ITEM_ICONS: Record<ItemType, React.ReactNode> = {
  [ItemType.APPLE]: <Apple className="w-full h-full text-red-500 drop-shadow-sm" />,
  [ItemType.BANANA]: <Banana className="w-full h-full text-yellow-500 drop-shadow-sm" />,
  [ItemType.CHERRY]: <Cherry className="w-full h-full text-pink-600 drop-shadow-sm" />,
  [ItemType.MILK]: <Droplet className="w-full h-full text-blue-400 drop-shadow-sm" />, // Replaced Milk
  [ItemType.COOKIE]: <CircleDot className="w-full h-full text-amber-700 drop-shadow-sm" />, // Replaced Cookie
  [ItemType.SODA]: <Coffee className="w-full h-full text-orange-500 drop-shadow-sm" />, // Replaced Soda/Beer
  [ItemType.PIZZA]: <Pizza className="w-full h-full text-yellow-600 drop-shadow-sm" />,
  [ItemType.BURGER]: <Layers className="w-full h-full text-orange-800 drop-shadow-sm" />, // Replaced Burger/Sandwich
  [ItemType.ICECREAM]: <IceCream className="w-full h-full text-pink-400 drop-shadow-sm" />,
  [ItemType.GIFT]: <Gift className="w-full h-full text-purple-600 drop-shadow-sm" />,
  [ItemType.CANDY]: <Gem className="w-full h-full text-red-400 drop-shadow-sm" />, // Replaced Candy
  [ItemType.DIAMOND]: <Diamond className="w-full h-full text-cyan-400 drop-shadow-sm" />,
};

export const ITEM_COLORS: Record<ItemType, string> = {
  [ItemType.APPLE]: 'bg-red-100 border-red-300',
  [ItemType.BANANA]: 'bg-yellow-100 border-yellow-300',
  [ItemType.CHERRY]: 'bg-pink-100 border-pink-300',
  [ItemType.MILK]: 'bg-blue-100 border-blue-300',
  [ItemType.COOKIE]: 'bg-amber-100 border-amber-300',
  [ItemType.SODA]: 'bg-orange-100 border-orange-300',
  [ItemType.PIZZA]: 'bg-yellow-50 border-yellow-400',
  [ItemType.BURGER]: 'bg-orange-50 border-orange-400',
  [ItemType.ICECREAM]: 'bg-pink-50 border-pink-300',
  [ItemType.GIFT]: 'bg-purple-100 border-purple-300',
  [ItemType.CANDY]: 'bg-red-50 border-red-200',
  [ItemType.DIAMOND]: 'bg-cyan-50 border-cyan-300',
};