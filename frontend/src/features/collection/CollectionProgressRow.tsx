import type { CollectionProgress } from "./useCollectionsProgress";

export function CollectionProgressRow({
  collection,
  onClick,
}: {
  collection: CollectionProgress;
  onClick: () => void;
}) {
  const pct = Math.min(
    100,
    Math.round((collection.ownedCount / collection.totalCount) * 100),
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl bg-[#181820] border border-white/[0.08] p-3.5 space-y-2.5 hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-[#121217] border border-white/10 flex items-center justify-center">
          {collection.imageUrl ? (
            <img
              src={collection.imageUrl}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{collection.typeEmoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1">
            <span>{collection.typeEmoji}</span>
            <span>{collection.typeLabel}</span>
          </div>
          <div className="text-sm font-bold text-[#F3F4F6] truncate">
            {collection.name}
          </div>
        </div>
        <div className="text-sm font-black text-[#F3F4F6] shrink-0">
          {collection.ownedCount}/{collection.totalCount}{" "}
          <span className="text-[11px] font-semibold text-[#9CA3AF]">
            {collection.unitLabel}
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[#121217] rounded-full overflow-hidden">
        <div
          className={`h-full ${pct >= 100 ? "bg-[#F59E0B]" : "bg-[#E50914]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
