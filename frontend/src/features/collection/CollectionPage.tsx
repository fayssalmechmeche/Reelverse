import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import { RARITY_CONFIG } from "../../design/rarity";
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

      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 sm:p-5 flex items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#0B0B0E] border border-white/10 shrink-0">
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
            <h2 className="text-lg sm:text-xl font-black text-[#F3F4F6]">
              {entity.name}
            </h2>
            {entity.rarity && (
              <span
                style={RARITY_CONFIG[entity.rarity].badgeStyle}
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
              >
                {RARITY_CONFIG[entity.rarity].label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#9CA3AF]">
              {ownedCount} / {totalCount} collectées
            </span>
          </div>
          <div className="w-full max-w-xs h-1.5 bg-[#181820] rounded-full overflow-hidden">
            <div className="h-full bg-[#E50914]" style={{ width: `${pct}%` }} />
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
    </div>
  );
}
