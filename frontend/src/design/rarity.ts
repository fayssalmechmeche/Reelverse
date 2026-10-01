export const RARITY_CONFIG = {
  common: {
    label: "Common",
    accentHex: "#71717A",
    bottomBarClass: "bg-[#71717A]",
    badgeStyle: {
      backgroundColor: "rgba(24, 24, 32, 0.9)",
      color: "#A1A1AA",
      borderColor: "rgba(113, 113, 122, 0.45)",
    },
  },
  uncommon: {
    label: "Uncommon",
    accentHex: "#CBD5E1",
    bottomBarClass: "bg-[#CBD5E1]",
    badgeStyle: {
      backgroundColor: "rgba(24, 24, 32, 0.9)",
      color: "#E2E8F0",
      borderColor: "rgba(203, 213, 225, 0.45)",
    },
  },
  rare: {
    label: "Rare",
    accentHex: "#60A5FA",
    bottomBarClass: "bg-[#60A5FA]",
    badgeStyle: {
      backgroundColor: "rgba(24, 24, 32, 0.9)",
      color: "#93C5FD",
      borderColor: "rgba(96, 165, 250, 0.45)",
    },
  },
  epic: {
    label: "Epic",
    accentHex: "#A78BFA",
    bottomBarClass: "bg-[#A78BFA]",
    badgeStyle: {
      backgroundColor: "rgba(24, 24, 32, 0.9)",
      color: "#C4B5FD",
      borderColor: "rgba(167, 139, 250, 0.45)",
    },
  },
  legendary: {
    label: "Legendary",
    accentHex: "#F59E0B",
    bottomBarClass: "bg-[#F59E0B]",
    badgeStyle: {
      backgroundColor: "rgba(24, 24, 32, 0.92)",
      color: "#FBBF24",
      borderColor: "rgba(245, 158, 11, 0.6)",
    },
  },
} as const;

export type RarityKey = keyof typeof RARITY_CONFIG;
