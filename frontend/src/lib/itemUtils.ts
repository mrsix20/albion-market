/**
 * Item Utilities for Albion Market
 * User Name Check: hamonestic
 */

export interface ItemData {
  id: string;
  name: string;
  tier: number | null;
}

export const tierNames: Record<string, string> = {
  'T1': "Beginner's", 'T2': "Novice's", 'T3': "Journeyman's",
  'T4': "Adept's", 'T5': "Expert's", 'T6': "Master's",
  'T7': "Grandmaster's", 'T8': "Elder's"
};

export const typeNames: Record<string, string> = {
  // Armor & Accessories
  'ARMOR': 'Armor', 'HEAD': 'Helmet', 'SHOES': 'Workboots',
  'BAG': 'Bag', 'CAPE': 'Cape',
  
  // Weapons - Swords & Axes
  'MAIN_SWORD': 'Broadsword', '2H_SWORD': 'Claymore', '2H_DUALSWORD': 'Dual Swords', '2H_CLEAVER_AVALON': 'Kingmaker',
  'MAIN_AXE': 'Battleaxe', '2H_AXE': 'Greataxe', '2H_HALBERD': 'Halberd', '2H_BEARPAWS': 'Bear Paws',
  
  // Weapons - Spears & Daggers
  'MAIN_SPEAR': 'Spear', '2H_SPEAR': 'Pike', '2H_GLAIVE': 'Glaive', 'MAIN_TRIDENT_FISH': 'Trident',
  'MAIN_DAGGER': 'Dagger', '2H_DAGGERPAIR': 'Dagger Pair', '2H_CLAWSSPELL': 'Claws', '2H_BLOODLETTER': 'Bloodletter',
  
  // Weapons - Staves
  'MAIN_FIRESTAFF': 'Fire Staff', '2H_FIRESTAFF': 'Great Fire Staff', '2H_INFERNOSTAFF': 'Infernal Staff',
  'MAIN_FROSTSTAFF': 'Frost Staff', '2H_FROSTSTAFF': 'Great Frost Staff', '2H_GLACIALSTAFF': 'Glacial Staff',
  'MAIN_ARCANESTAFF': 'Arcane Staff', '2H_ARCANESTAFF': 'Great Arcane Staff', '2H_ENIGMATICSTAFF': 'Enigmatic Staff',
  'MAIN_HOLYSTAFF': 'Holy Staff', '2H_HOLYSTAFF': 'Great Holy Staff', '2H_DIVINESTAFF': 'Divine Staff',
  'MAIN_NATURESTAFF': 'Nature Staff', '2H_NATURESTAFF': 'Great Nature Staff', '2H_WILDSTAFF': 'Wild Staff',
  'MAIN_CURSESTAFF': 'Cursed Staff', '2H_CURSESTAFF': 'Great Cursed Staff', '2H_DEMONICSTAFF': 'Demonic Staff',
  
  // Weapons - Maces & Hammers
  'MAIN_MACE': 'Mace', '2H_MACE': 'Heavy Mace', '2H_FLAIL': 'Flail', '2H_MORNINGSTAR': 'Morning Star',
  'MAIN_HAMMER': 'Hammer', '2H_HAMMER': 'Great Hammer', '2H_POLEHAMMER': 'Polehammer',
  
  // Weapons - Bows & Crossbows
  '2H_BOW': 'Bow', '2H_WARBOW': 'Warbow', '2H_LONGBOW': 'Longbow',
  '2H_CROSSBOW': 'Crossbow', '2H_REPEATINGCROSSBOW': 'Light Crossbow', '2H_DUALCROSSBOW': 'Boltcasters',
  
  // Weapons - Quarterstaves
  '2H_QUARTERSTAFF': 'Quarterstaff', '2H_IRONCLADEDSTAFF': 'Iron-clad Staff', '2H_DOUBLEBLADEDSTAFF': 'Double Bladed Staff',
  
  // Mounts
  'MOUNT_HORSE': 'Riding Horse', 'MOUNT_OX': 'Transport Ox', 'MOUNT_DIREWOLF': 'Direwolf'
};

export function getInGameName(itemId: string, itemMap: Record<string, string>): string {
  // 1. Try exact match first (including @ enchantment)
  if (itemMap[itemId]) return itemMap[itemId];

  // 2. Try base ID match
  const baseId = itemId.split('@')[0];
  if (itemMap[baseId]) return itemMap[baseId];

  // 3. Fallback logic for items not in the map
  const parts = baseId.split('_');
  const tier = parts[0];
  
  let name = "";
  const remainingParts = parts.slice(1).join('_');
  const typeKey = Object.keys(typeNames).find(key => remainingParts === key || remainingParts.startsWith(key + '_'));

  if (typeKey) {
    name = typeNames[typeKey];
  } else {
    name = remainingParts.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const tierPrefix = tierNames[tier] || tier;
  return `${tierPrefix} ${name}`;
}
