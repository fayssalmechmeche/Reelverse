import type { RarityKey } from "../../design/rarity";

// Miroir de QuickSellPricing.php, uniquement pour l'affichage : le serveur fait foi.
export const QUICK_SELL_PRICE: Record<RarityKey, number> = {
  common: 20,
  uncommon: 50,
  rare: 120,
  epic: 300,
  legendary: 800,
};
