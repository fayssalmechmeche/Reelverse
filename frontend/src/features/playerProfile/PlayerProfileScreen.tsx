import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import { Avatar } from "../../components/Avatar";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import {
  usePlayerProfile,
  usePlayerInventory,
  usePlayerWishlist,
  usePlayerSaleList,
  type PlayerInventoryCard,
} from "./usePlayerProfile";

const TYPE_META: Record<
  PlayerInventoryCard["type"],
  { emoji: string; label: string }
> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

type SubTab = "OWNED" | "DUPLICATES" | "WISHLIST" | "TRADELIST";
type TypeFilter = "ALL" | PlayerInventoryCard["type"];

const SUB_TABS: { id: SubTab; emoji: string; label: string }[] = [
  { id: "OWNED", emoji: "🃏", label: "Possédées" },
  { id: "DUPLICATES", emoji: "🔄", label: "Doublons" },
  { id: "WISHLIST", emoji: "❤️", label: "Wishlist" },
  { id: "TRADELIST", emoji: "💰", label: "À échanger" },
];

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "ALL", label: "Tout" },
  { id: "person", label: "👤 Acteurs" },
  { id: "movie", label: "🎬 Films" },
  { id: "series", label: "📺 Séries" },
  { id: "character", label: "🎭 Personnages" },
];

const PAGE_SIZE = 30;

interface ResolvedCard extends PlayerInventoryCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

export function PlayerProfileScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const playerId = id ? Number(id) : null;

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = usePlayerProfile(playerId);
  const { data: inventory = [], isLoading: inventoryLoading } =
    usePlayerInventory(playerId);
  const { data: wishlist = [] } = usePlayerWishlist(playerId);
  const { data: saleList = [] } = usePlayerSaleList(playerId);

  const wishlistedCardIds = useMemo(() => new Set(wishlist), [wishlist]);
  const saleListCardIds = useMemo(() => new Set(saleList), [saleList]);

  const [subTab, setSubTab] = useState<SubTab>("OWNED");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [page, setPage] = useState(0);

  const counts = useMemo(
    () => ({
      OWNED: inventory.filter((c) => c.quantity > 0).length,
      DUPLICATES: inventory.filter((c) => c.quantity >= 2).length,
      WISHLIST: wishlistedCardIds.size,
      TRADELIST: saleListCardIds.size,
    }),
    [inventory, wishlistedCardIds, saleListCardIds],
  );

  const filtered = useMemo(() => {
    return inventory.filter((c) => {
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (subTab === "OWNED") return c.quantity > 0;
      if (subTab === "DUPLICATES") return c.quantity >= 2;
      if (subTab === "WISHLIST") return wishlistedCardIds.has(c.cardId);
      if (subTab === "TRADELIST") return saleListCardIds.has(c.cardId);
      return true;
    });
  }, [inventory, typeFilter, subTab, wishlistedCardIds, saleListCardIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [subTab, typeFilter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  const resolvedResults = useResolvedCards(
    pageItems.map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const cards: ResolvedCard[] = useMemo(
    () =>
      pageItems.map((c, idx) => {
        const info = resolvedResults[idx]?.data;
        const meta = TYPE_META[c.type];
        return {
          ...c,
          name: info?.name ?? `${c.type} #${c.entityId}`,
          subtitle: info?.subtitle ?? "",
          imageUrl: info?.imageUrl ?? null,
          typeEmoji: info?.typeEmoji ?? meta.emoji,
          typeLabel: meta.label,
        };
      }),
    [pageItems, resolvedResults],
  );

  function goToDetail(card: ResolvedCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
    if (card.type === "character") navigate(`/characters/${card.entityId}`);
  }

  if (profileError) {
    return (
      <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
        <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
        <span>{(profileError as Error).message}</span>
      </div>
    );
  }

  if (profileLoading || inventoryLoading || !profile) {
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement du profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#121217] border border-white/[0.08] flex items-center justify-center text-[#9CA3AF] hover:text-white shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar
          src={profile.avatarUrl}
          name={profile.username}
          compact
          className="w-10 h-10 text-sm"
        />
        <div>
          <h2 className="text-xl font-black text-[#F3F4F6]">
            @{profile.username}
          </h2>
          <p className="text-[11px] text-[#9CA3AF]">Profil public</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SUB_TABS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubTab(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                subTab === s.id
                  ? "bg-[#E50914] border-[#E50914] text-white"
                  : "bg-[#181820] border-white/[0.08] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {s.emoji} {s.label} ({counts[s.id]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/[0.06] pb-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                typeFilter === f.id
                  ? "bg-[#22222C] text-[#F3F4F6] border-white/25"
                  : "bg-[#181820]/60 text-[#9CA3AF] border-transparent hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
          <p className="text-sm text-[#9CA3AF]">Aucune carte ne correspond.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {cards.map((card) => (
            <CinemaCard
              key={card.id}
              name={card.name}
              subtitle={card.subtitle}
              imageUrl={card.imageUrl}
              typeEmoji={card.typeEmoji}
              typeLabel={card.typeLabel}
              rarity={card.rarity}
              quantity={card.quantity}
              onClick={() => goToDetail(card)}
              compact={true}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3.5 py-2 rounded-xl bg-[#121217] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="text-xs font-bold text-[#9CA3AF]">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3.5 py-2 rounded-xl bg-[#121217] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
