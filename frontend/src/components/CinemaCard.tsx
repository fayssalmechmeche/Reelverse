import { ChevronRight, Sparkles, Heart, Coins } from "lucide-react";
import { RARITY_CONFIG } from "../design/rarity";
import type { RarityKey } from "../design/rarity";

interface CinemaCardProps {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
  rarity: RarityKey;
  quantity?: number;
  isNew?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  isInSaleList?: boolean;
  onToggleSaleList?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

export function CinemaCard({
  name,
  subtitle,
  imageUrl,
  typeEmoji,
  typeLabel,
  rarity,
  quantity = 0,
  isNew = false,
  isWishlisted = false,
  onToggleWishlist,
  isInSaleList = false,
  onToggleSaleList,
  onClick,
  compact = false,
}: CinemaCardProps) {
  const rarityConfig = RARITY_CONFIG[rarity];
  const isOwned = quantity > 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
        isOwned ? "bg-[#181820]" : "bg-[#13131A]"
      } ${
        isOwned
          ? "border border-white/[0.08] hover:border-white/25 hover:-translate-y-1 shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
          : "border border-white/[0.04] hover:border-white/15 hover:-translate-y-0.5 opacity-70 hover:opacity-95"
      }`}
    >
      <div
        className={`relative ${compact ? "h-44" : "h-56"} w-full overflow-hidden bg-[#0B0B0E]`}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className={`h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
              isOwned
                ? ""
                : "grayscale saturate-0 contrast-75 opacity-35 group-hover:opacity-55"
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181820] via-[#181820]/20 to-black/40" />

        {isNew && isOwned && (
          <div className="absolute top-0 inset-x-0 z-10 bg-[#E50914] text-white text-[10px] font-black uppercase tracking-widest py-1 px-2.5 flex items-center justify-center gap-1.5 shadow-md">
            <Sparkles className="w-3 h-3 fill-white" />
            <span>Nouvelle Carte</span>
          </div>
        )}

        <div
          className={`absolute ${
            isNew && isOwned ? "top-8" : "top-2.5"
          } left-2.5 right-2.5 flex items-center justify-between gap-2 transition-all`}
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#121217]/90 text-[#F3F4F6] border border-white/10 backdrop-blur-md">
            <span>{typeEmoji}</span>
            <span>{typeLabel}</span>
          </span>

          <span
            style={
              isOwned
                ? rarityConfig.badgeStyle
                : {
                    backgroundColor: "rgba(18,18,23,0.85)",
                    color: "#71717A",
                    borderColor: "rgba(113,113,122,0.3)",
                  }
            }
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md"
          >
            {rarityConfig.label}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {onToggleWishlist ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist();
                }}
                title={
                  isWishlisted
                    ? "Retirer de la wishlist"
                    : "Ajouter à la wishlist"
                }
                className={`p-1 rounded border transition-colors ${
                  isWishlisted
                    ? "bg-[#E50914]/20 border-[#E50914]/40 text-[#E50914]"
                    : "bg-black/40 border-white/15 text-[#9CA3AF] hover:text-[#E50914] hover:border-[#E50914]/40"
                }`}
              >
                <Heart
                  className={`w-2.5 h-2.5 ${isWishlisted ? "fill-current" : ""}`}
                />
              </button>
            ) : (
              isWishlisted && (
                <span className="p-1 rounded bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
                  <Heart className="w-2.5 h-2.5 fill-current" />
                </span>
              )
            )}

            {onToggleSaleList && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSaleList();
                }}
                title={
                  isInSaleList
                    ? 'Retirer de "à échanger"'
                    : 'Marquer "à échanger"'
                }
                className={`p-1 rounded border transition-colors ${
                  isInSaleList
                    ? "bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#F59E0B]"
                    : "bg-black/40 border-white/15 text-[#9CA3AF] hover:text-[#F59E0B] hover:border-[#F59E0B]/40"
                }`}
              >
                <Coins className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold tracking-tight border ${
              isOwned
                ? "bg-[#121217]/95 text-[#F3F4F6] border-white/15"
                : "bg-[#121217]/90 text-zinc-500 border-white/5"
            }`}
          >
            {isOwned ? `×${quantity}` : "Manquante"}
          </span>
        </div>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-bold text-sm sm:text-base leading-snug line-clamp-1 ${
                isOwned
                  ? "text-[#F3F4F6] group-hover:text-white"
                  : "text-[#9CA3AF]"
              }`}
            >
              {name}
            </h3>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">
            {subtitle}
          </p>
        </div>
      </div>

      <div
        className={`h-[2px] w-full ${isOwned ? rarityConfig.bottomBarClass : "bg-zinc-800"}`}
      />
    </div>
  );
}
