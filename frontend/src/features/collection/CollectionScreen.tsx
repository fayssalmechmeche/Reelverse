import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionState } from "../../hooks/useSessionState";
import { useScrollRestoration } from "../../hooks/useScrollRestoration";
import { Search, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import {
  useCardsCatalog,
  type CatalogCard,
} from "../inventory/useCardsCatalog";
import { QuickSellModal } from "../inventory/QuickSellModal";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import { RARITY_CONFIG, type RarityKey } from "../../design/rarity";
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

const TYPE_META: Record<CatalogCard["type"], { emoji: string; label: string }> =
  {
    person: { emoji: "👤", label: "Acteur" },
    movie: { emoji: "🎬", label: "Film" },
    series: { emoji: "📺", label: "Série" },
    character: { emoji: "🎭", label: "Personnage" },
  };

type SubTab =
  | "ALL"
  | "OWNED"
  | "MISSING"
  | "DUPLICATES"
  | "WISHLIST"
  | "TRADELIST";
type TypeFilter = "ALL" | CatalogCard["type"];
type RarityFilter = "ALL" | RarityKey;
type SortBy = "OWNED_FIRST" | "NAME_ASC" | "RARITY_DESC";

const SUB_TABS: { id: SubTab; emoji: string; label: string }[] = [
  { id: "ALL", emoji: "🗂️", label: "Toutes" },
  { id: "OWNED", emoji: "🃏", label: "Possédées" },
  { id: "MISSING", emoji: "❓", label: "Manquantes" },
  { id: "DUPLICATES", emoji: "🔄", label: "Doublons" },
  { id: "WISHLIST", emoji: "❤️", label: "Wishlist" },
  { id: "TRADELIST", emoji: "💰", label: "À échanger" },
];

const PAGE_SIZE = 15;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "ALL", label: "Tout" },
  { id: "person", label: "👤 Acteurs" },
  { id: "movie", label: "🎬 Films" },
  { id: "series", label: "📺 Séries" },
  { id: "character", label: "🎭 Personnages" },
];

const RARITY_FILTERS: { id: RarityFilter; label: string }[] = [
  { id: "ALL", label: "Toutes raretés" },
  { id: "common", label: RARITY_CONFIG.common.label },
  { id: "uncommon", label: RARITY_CONFIG.uncommon.label },
  { id: "rare", label: RARITY_CONFIG.rare.label },
  { id: "epic", label: RARITY_CONFIG.epic.label },
  { id: "legendary", label: RARITY_CONFIG.legendary.label },
];

const RARITY_ORDER: RarityKey[] = [
  "legendary",
  "epic",
  "rare",
  "uncommon",
  "common",
];

interface ResolvedCatalogCard extends CatalogCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

export function CollectionScreen() {
  const navigate = useNavigate();
  const { data: catalog = [], isLoading } = useCardsCatalog();

  const { data: wishlist = [] } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistedCardIds = useMemo(
    () => new Set(wishlist.map((w) => w.cardId)),
    [wishlist],
  );

  const { data: saleList = [] } = useSaleList();
  const addToSaleList = useAddToSaleList();
  const removeFromSaleList = useRemoveFromSaleList();
  const saleListCardIds = useMemo(
    () => new Set(saleList.map((s) => s.cardId)),
    [saleList],
  );

  // Filtres et page gardés en mémoire (onglet) : on les retrouve en revenant
  // d'une fiche film / série / acteur.
  const [subTab, setSubTab] = useSessionState<SubTab>(
    "collection:subTab",
    "OWNED",
  );
  const [typeFilter, setTypeFilter] = useSessionState<TypeFilter>(
    "collection:typeFilter",
    "ALL",
  );
  const [rarityFilter, setRarityFilter] = useSessionState<RarityFilter>(
    "collection:rarityFilter",
    "ALL",
  );
  const [search, setSearch] = useSessionState("collection:search", "");
  const [sortBy, setSortBy] = useSessionState<SortBy>(
    "collection:sortBy",
    "OWNED_FIRST",
  );
  const [hideMissing, setHideMissing] = useSessionState(
    "collection:hideMissing",
    false,
  );
  const [page, setPage] = useSessionState("collection:page", 0);

  const [sellTarget, setSellTarget] = useState<ResolvedCatalogCard | null>(
    null,
  );

  // Résout nom/image/sous-titre de TOUT le catalogue en un seul appel réseau
  // (les appels sont fusionnés en un batch, voir resolveCard.ts), pour
  // pouvoir chercher/trier sur le nom avant la pagination.
  const resolvedResults = useResolvedCards(
    catalog.map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const allCards: ResolvedCatalogCard[] = useMemo(
    () =>
      catalog.map((c, idx) => {
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
    [catalog, resolvedResults],
  );

  const ownedCount = useMemo(
    () => catalog.filter((c) => c.quantity > 0).length,
    [catalog],
  );
  const totalCount = catalog.length;
  const overallPct =
    totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const counts = useMemo(
    () => ({
      ALL: catalog.length,
      OWNED: ownedCount,
      MISSING: catalog.length - ownedCount,
      DUPLICATES: catalog.filter((c) => c.quantity >= 2).length,
      WISHLIST: wishlistedCardIds.size,
      TRADELIST: saleListCardIds.size,
    }),
    [catalog, ownedCount, wishlistedCardIds, saleListCardIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = allCards.filter((c) => {
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (rarityFilter !== "ALL" && c.rarity !== rarityFilter) return false;
      if (hideMissing && c.quantity === 0) return false;
      if (subTab === "OWNED" && c.quantity === 0) return false;
      if (subTab === "MISSING" && c.quantity > 0) return false;
      if (subTab === "DUPLICATES" && c.quantity < 2) return false;
      if (subTab === "WISHLIST" && !wishlistedCardIds.has(c.cardId))
        return false;
      if (subTab === "TRADELIST" && !saleListCardIds.has(c.cardId))
        return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "RARITY_DESC")
        return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      // OWNED_FIRST (par défaut)
      return (
        (b.quantity > 0 ? 1 : 0) - (a.quantity > 0 ? 1 : 0) ||
        a.name.localeCompare(b.name)
      );
    });
  }, [
    allCards,
    typeFilter,
    rarityFilter,
    hideMissing,
    subTab,
    search,
    sortBy,
    wishlistedCardIds,
    saleListCardIds,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Revenir à la page 1 à chaque changement de filtre, ou si la page
  // courante dépasse le nombre de pages disponibles (ex: après une vente).
  // On ne remet la page à 0 que quand un filtre CHANGE vraiment (pas au
  // montage, sinon on perdrait la page mémorisée en revenant d'une fiche).
  const filterKey = [
    subTab,
    typeFilter,
    rarityFilter,
    search,
    hideMissing,
  ].join("|");
  const previousFilterKey = useRef(filterKey);
  useEffect(() => {
    if (previousFilterKey.current !== filterKey) {
      previousFilterKey.current = filterKey;
      setPage(0);
    }
  }, [filterKey, setPage]);

  // Contenu prêt : catalogue chargé et noms résolus (sinon la liste filtrée
  // est temporairement vide et la page serait ramenée à tort à 0).
  const isReady =
    !isLoading &&
    catalog.length > 0 &&
    resolvedResults.every((r) => !r.isPending);

  useEffect(() => {
    if (isReady && page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [isReady, page, totalPages, setPage]);

  useScrollRestoration("collection", isReady);

  const cards = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  );

  function goToDetail(card: ResolvedCatalogCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  function toggleWishlist(cardId: number) {
    if (wishlistedCardIds.has(cardId)) {
      removeFromWishlist.mutate(cardId);
    } else {
      addToWishlist.mutate(cardId);
    }
  }

  function toggleSaleList(cardId: number) {
    if (saleListCardIds.has(cardId)) {
      removeFromSaleList.mutate(cardId);
    } else {
      addToSaleList.mutate(cardId);
    }
  }

  function openSellModal(card: ResolvedCatalogCard) {
    if (card.id === null) return;
    setSellTarget(card);
  }

  if (isLoading)
    return <p className="text-[#9CA3AF]">Chargement de la collection...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-[#F3F4F6]">Ma Collection</h2>
            <span className="px-2.5 py-1 rounded-full bg-[#181820] border border-white/10 text-xs font-bold text-[#F3F4F6]">
              {ownedCount} / {totalCount}
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Touchez une carte pour ouvrir sa collection liée.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64 min-w-[160px]">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une carte..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="flex items-center bg-[#181820] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F3F4F6]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF] mr-1.5 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-transparent text-xs font-semibold text-[#F3F4F6] focus:outline-none cursor-pointer"
            >
              <option value="OWNED_FIRST" className="bg-[#181820]">
                Possédées d'abord
              </option>
              <option value="NAME_ASC" className="bg-[#181820]">
                Nom (A-Z)
              </option>
              <option value="RARITY_DESC" className="bg-[#181820]">
                Rareté (Légendaire ↓)
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setHideMissing((p) => !p)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              hideMissing
                ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]"
                : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
            }`}
          >
            {hideMissing ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>Masquer manquantes</span>
          </button>
        </div>
      </div>

      <div className="w-full h-1.5 bg-[#181820] rounded-full overflow-hidden">
        <div
          className={`h-full ${overallPct >= 100 ? "bg-[#F59E0B]" : "bg-[#E50914]"}`}
          style={{ width: `${overallPct}%` }}
        />
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

        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/[0.06] pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mr-1 shrink-0">
            Rareté
          </span>
          {RARITY_FILTERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRarityFilter(r.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border capitalize ${
                rarityFilter === r.id
                  ? "bg-[#22222C] text-[#F3F4F6] border-white/25"
                  : "bg-[#181820]/60 text-[#9CA3AF] border-transparent hover:text-white"
              }`}
            >
              {r.label}
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
            <div key={card.cardId} className="space-y-2">
              <CinemaCard
                name={card.name}
                subtitle={card.subtitle}
                imageUrl={card.imageUrl}
                typeEmoji={card.typeEmoji}
                typeLabel={card.typeLabel}
                rarity={card.rarity}
                quantity={card.quantity}
                onClick={() => goToDetail(card)}
                compact={true}
                isWishlisted={wishlistedCardIds.has(card.cardId)}
                onToggleWishlist={() => toggleWishlist(card.cardId)}
                isInSaleList={saleListCardIds.has(card.cardId)}
                onToggleSaleList={() => toggleSaleList(card.cardId)}
              />
              {card.quantity > 0 && (
                <button
                  onClick={() => openSellModal(card)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2A2A36] text-[#9CA3AF] text-[11px] font-bold"
                >
                  Vente rapide
                </button>
              )}
            </div>
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

      {sellTarget && sellTarget.id !== null && (
        <QuickSellModal
          target={{
            id: sellTarget.id,
            name: sellTarget.name,
            quantity: sellTarget.quantity,
          }}
          onClose={() => setSellTarget(null)}
        />
      )}
    </div>
  );
}
