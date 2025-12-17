import React from 'react';
import { ItemType } from './types.ts';

export const MAX_TRAY_SIZE = 7;
export const MAX_LEVELS = 20;

// Using Emojis for "Juicy" native look
export const ITEM_ICONS: Record<ItemType, string> = {
  [ItemType.APPLE]: '🍎',
  [ItemType.BANANA]: '🍌',
  [ItemType.CHERRY]: '🍒',
  [ItemType.MILK]: '🥛',
  [ItemType.COOKIE]: '🍪',
  [ItemType.SODA]: '🥤',
  [ItemType.PIZZA]: '🍕',
  [ItemType.BURGER]: '🍔',
  [ItemType.ICECREAM]: '🍦',
  [ItemType.GIFT]: '🎁',
  [ItemType.CANDY]: '🍬',
  [ItemType.DIAMOND]: '💎',
};

// More vibrant, "packaging" style colors
export const ITEM_COLORS: Record<ItemType, string> = {
  [ItemType.APPLE]: 'bg-red-500 border-red-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.BANANA]: 'bg-yellow-400 border-yellow-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)]',
  [ItemType.CHERRY]: 'bg-rose-500 border-rose-800 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.MILK]: 'bg-blue-400 border-blue-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.COOKIE]: 'bg-amber-600 border-amber-800 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)]',
  [ItemType.SODA]: 'bg-orange-500 border-orange-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.PIZZA]: 'bg-yellow-500 border-yellow-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.BURGER]: 'bg-orange-600 border-orange-800 shadow-[inset_0_2px_10px_rgba(255,255,255,0.2)]',
  [ItemType.ICECREAM]: 'bg-pink-400 border-pink-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.GIFT]: 'bg-purple-500 border-purple-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.CANDY]: 'bg-teal-400 border-teal-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]',
  [ItemType.DIAMOND]: 'bg-cyan-400 border-cyan-600 shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)]',
};