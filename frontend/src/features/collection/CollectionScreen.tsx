import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionState } from "../../hooks/useSessionState";
import { useScrollRestoration } from "../../hooks/useScrollRestoration";
import { Search, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import {
  useCardsCatalog,
  useMarkCardSeen,
  type CatalogCard,
  type CatalogParams,
  type CatalogSort,
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
  | "NEW"
  | "DUPLICATES"
  | "WISHLIST"
  | "TRADELIST";
type TypeFilter = "ALL" | CatalogCard["type"];
type RarityFilter = "ALL" | RarityKey;
type SortBy = CatalogSort;

const SUB_TABS: { id: SubTab; emoji: string; label: string }[] = [
  { id: "ALL", emoji: "🗂️", label: "Toutes" },
  { id: "OWNED", emoji: "🃏", label: "Possédées" },
  { id: "MISSING", emoji: "❓", label: "Manquantes" },
  { id: "NEW", emoji: "✨", label: "Nouvelles" },
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

interface ResolvedCatalogCard extends CatalogCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

export function CollectionScreen() {
  const navigate = useNavigate();
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

  const markSeen = useMarkCardSeen();

  const [sellTarget, setSellTarget] = useState<ResolvedCatalogCard | null>(
    null,
  );

  // La recherche n'interroge le serveur qu'après une courte pause de frappe.
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Le serveur filtre, trie et pagine : on ne reçoit que la page affichée.
  const params: CatalogParams = {
    page,
    perPage: PAGE_SIZE,
    tab: subTab,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    rarity: rarityFilter === "ALL" ? undefined : rarityFilter,
    hideMissing,
    search: debouncedSearch,
    sort: sortBy,
  };
  const {
    data: catalogPage,
    isPending,
    isPlaceholderData,
  } = useCardsCatalog(params);

  const catalogItems = useMemo(() => catalogPage?.items ?? [], [catalogPage]);

  // Résout nom/image/sous-titre des cartes de la page (un seul appel réseau
  // fusionné, voir resolveCard.ts ; les cartes déjà vues sont en cache).
  const resolvedResults = useResolvedCards(
    catalogItems.map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const cards: ResolvedCatalogCard[] = useMemo(
    () =>
      catalogItems.map((c, idx) => {
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
    [catalogItems, resolvedResults],
  );

  const totalCount = catalogPage?.counts.all ?? 0;
  const ownedCount = catalogPage?.counts.owned ?? 0;
  const overallPct =
    totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const counts = {
    ALL: totalCount,
    OWNED: ownedCount,
    MISSING: totalCount - ownedCount,
    NEW: catalogPage?.counts.new ?? 0,
    DUPLICATES: catalogPage?.counts.duplicates ?? 0,
    WISHLIST: wishlistedCardIds.size,
    TRADELIST: saleListCardIds.size,
  };

  const totalPages = catalogPage?.totalPages ?? 1;

  // Revenir à la page 1 à chaque changement de filtre. On ne remet la page à
  // 0 que quand un filtre CHANGE vraiment (pas au montage, sinon on perdrait
  // la page mémorisée en revenant d'une fiche).
  const filterKey = [
    subTab,
    typeFilter,
    rarityFilter,
    debouncedSearch,
    hideMissing,
  ].join("|");
  const previousFilterKey = useRef(filterKey);
  useEffect(() => {
    if (previousFilterKey.current !== filterKey) {
      previousFilterKey.current = filterKey;
      setPage(0);
    }
  }, [filterKey, setPage]);

  // Contenu prêt : bonne page chargée (pas la page précédente gardée en
  // attente) et noms résolus.
  const isReady =
    !isPending &&
    !isPlaceholderData &&
    resolvedResults.every((r) => !r.isPending);

  // Le serveur ramène la page à la dernière existante si elle dépasse (ex:
  // après une vente) : on s'aligne dessus.
  useEffect(() => {
    if (!isPlaceholderData && catalogPage && catalogPage.page !== page) {
      setPage(catalogPage.page);
    }
  }, [isPlaceholderData, catalogPage, page, setPage]);

  useScrollRestoration("collection", isReady);

  function goToDetail(card: ResolvedCatalogCard) {
    // Consulter une carte "nouvelle" la retire de l'onglet Nouvelles.
    if (card.isNew) markSeen.mutate(card.cardId);
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
    if (card.type === "character") navigate(`/characters/${card.entityId}`);
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

  if (isPending)
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
              <option value="RARITY_DESC" className="bg-[#181820]">
                Rareté (Légendaire ↓)
              </option>
              <option value="RARITY_ASC" className="bg-[#181820]">
                Rareté (Commune ↑)
              </option>
              <option value="NAME_ASC" className="bg-[#181820]">
                Alphabétique (A-Z)
              </option>
              <option value="YEAR_DESC" className="bg-[#181820]">
                Plus récentes
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 capitalize ${
                rarityFilter === r.id
                  ? "bg-[#22222C] text-[#F3F4F6] border-white/25"
                  : "bg-[#181820]/60 text-[#9CA3AF] border-transparent hover:text-white"
              }`}
            >
              {r.id !== "ALL" && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: RARITY_CONFIG[r.id].accentHex }}
                />
              )}
              <span>{r.label}</span>
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
                isNew={card.isNew}
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
            imageUrl: sellTarget.imageUrl,
            rarity: sellTarget.rarity,
            typeLabel: sellTarget.typeLabel,
          }}
          onClose={() => setSellTarget(null)}
        />
      )}
    </div>
  );
}
