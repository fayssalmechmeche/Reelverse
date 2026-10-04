import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Heart,
  Repeat,
  Tag,
  Coins,
} from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import { RARITY_CONFIG } from "../../design/rarity";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../wishlist/useWishlist";
import {
  useSaleList,
  useAddToSaleList,
  useRemoveFromSaleList,
} from "../wishlist/useSaleList";
import { QuickSellModal } from "../inventory/QuickSellModal";
import type { CollectionData, CollectionItem } from "./useCollection";

interface CollectionPageProps {
  isLoading: boolean;
  error: Error | null;
  data: CollectionData | undefined;
  backLabel: string;
  onBack: () => void;
  onItemClick: (item: CollectionItem) => void;
}

export function CollectionPage({
  isLoading,
  error,
  data,
  backLabel,
  onBack,
  onItemClick,
}: CollectionPageProps) {
  const navigate = useNavigate();

  const { data: wishlist = [] } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const { data: saleList = [] } = useSaleList();
  const addToSaleList = useAddToSaleList();
  const removeFromSaleList = useRemoveFromSaleList();

  const [sellModalOpen, setSellModalOpen] = useState(false);

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement...</span>
      </div>
    );

  if (error || !data)
    return (
      <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
        <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
        <span>Impossible de charger cette collection.</span>
      </div>
    );

  const { entity, items, ownedCount, totalCount } = data;
  const pct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const isWishlisted =
    entity.cardId !== null && wishlist.some((w) => w.cardId === entity.cardId);
  const isInSaleList =
    entity.cardId !== null && saleList.some((s) => s.cardId === entity.cardId);

  function toggleWishlist() {
    if (!entity.cardId) return;
    if (isWishlisted) removeFromWishlist.mutate(entity.cardId);
    else addToWishlist.mutate(entity.cardId);
  }

  function toggleSaleList() {
    if (!entity.cardId) return;
    if (isInSaleList) removeFromSaleList.mutate(entity.cardId);
    else addToSaleList.mutate(entity.cardId);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-[#9CA3AF] hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{backLabel}</span>
      </button>

      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#0B0B0E] border border-white/10 shrink-0">
            {entity.imageUrl && (
              <img
                src={entity.imageUrl}
                alt={entity.name}
                className={`w-full h-full object-cover ${
                  entity.owned ? "" : "grayscale opacity-50"
                }`}
              />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#181820] border border-white/10 text-[#9CA3AF]">
                {entity.typeEmoji} {entity.typeLabel}
              </span>
              {entity.rarity && (
                <span
                  style={RARITY_CONFIG[entity.rarity].badgeStyle}
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                >
                  {RARITY_CONFIG[entity.rarity].label}
                </span>
              )}
              {entity.quantity > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#181820] border border-white/10 text-[#F3F4F6]">
                  ×{entity.quantity}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-[#F3F4F6]">
              {entity.name}
            </h2>
            {entity.subtitle && (
              <p className="text-xs text-[#9CA3AF]">{entity.subtitle}</p>
            )}
          </div>
        </div>

        {entity.cardId !== null && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06] mt-1">
            <button
              type="button"
              onClick={toggleWishlist}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                isWishlisted
                  ? "bg-[#E50914]/15 border-[#E50914]/50 text-[#F3F4F6]"
                  : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`}
              />
              <span>Wishlist</span>
            </button>

            <button
              type="button"
              onClick={toggleSaleList}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                isInSaleList
                  ? "bg-[#F59E0B]/15 border-[#F59E0B]/50 text-[#F3F4F6]"
                  : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>À échanger</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/marketplace?cardId=${entity.cardId}`)}
              className="px-3.5 py-2 rounded-xl bg-[#181820] border border-white/10 text-xs font-bold text-[#9CA3AF] hover:text-white flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Voir sur le Marché</span>
            </button>

            {entity.quantity > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/marketplace?sell=${entity.cardId}`)}
                  className="px-3.5 py-2 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Vendre sur le Marché</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#22222C] hover:bg-[#2A2A36] text-[#9CA3AF] hover:text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Vente rapide</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9CA3AF]">
              {entity.type === "person"
                ? "Films & Séries"
                : "Acteurs & Personnages"}
            </span>
            <span className="text-xs font-bold text-[#9CA3AF]">
              {ownedCount} / {totalCount} ({pct}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#181820] rounded-full overflow-hidden">
            <div
              className={`h-full ${pct >= 100 ? "bg-[#F59E0B]" : "bg-[#E50914]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
          <p className="text-sm text-[#9CA3AF]">
            Aucune carte collectible n'est encore liée à cette entrée.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((item) => (
            <CinemaCard
              key={`${item.type}-${item.entityId}`}
              name={item.name}
              subtitle={item.typeLabel}
              imageUrl={item.imageUrl}
              typeEmoji={item.typeEmoji}
              typeLabel={item.typeLabel}
              rarity={item.rarity}
              quantity={item.quantity}
              onClick={() => onItemClick(item)}
              compact={true}
            />
          ))}
        </div>
      )}

      {sellModalOpen && entity.userCardId !== null && (
        <QuickSellModal
          target={{
            id: entity.userCardId,
            name: entity.name,
            quantity: entity.quantity,
          }}
          onClose={() => setSellModalOpen(false)}
        />
      )}
    </div>
  );
}
