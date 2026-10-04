import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Tag,
  Plus,
  Search,
  X,
  ArrowUpDown,
  CheckCircle2,
  Coins,
  ChevronRight,
  Ban,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";
import { useMe } from "../auth/useMe";
import { useInventory } from "../inventory/useInventory";
import { useResolvedCards } from "../cards/useResolvedCard";
import {
  useMarketplaceListings,
  useCreateListing,
  useBuyListing,
  useCancelListing,
} from "./useMarketplace";
import type { RarityKey } from "../../design/rarity";

const TAX_PERCENT = 5;

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

const RARITY_ORDER: RarityKey[] = [
  "legendary",
  "epic",
  "rare",
  "uncommon",
  "common",
];

export function MarketplaceScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const { data: listings = [], isLoading: listingsLoading } =
    useMarketplaceListings();
  const { data: inventory = [] } = useInventory();
  const resolvedResults = useResolvedCards(listings.map((l) => l));
  const createListing = useCreateListing();
  const buyListing = useBuyListing();
  const cancelListing = useCancelListing();

  const [actionError, setActionError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"BROWSE" | "MY_LISTINGS">("BROWSE");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [rarityFilter, setRarityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "PRICE_ASC" | "PRICE_DESC" | "OFFERS_DESC" | "RARITY_DESC"
  >("PRICE_ASC");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellCardId, setSellCardId] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState(100);

  const myId = me?.id ?? null;

  // Arrivée depuis "Voir sur le Marché" / "Vendre sur le Marché" d'une page
  // de détail (Acteur/Film/Série) : préremplit la recherche pour afficher
  // directement cette carte dans la liste, ou ouvre le formulaire de mise
  // en vente prérempli.
  useEffect(() => {
    const searchTerm = searchParams.get("search");
    const sellTargetCardId = searchParams.get("sell");

    if (searchTerm) {
      setSubTab("BROWSE");
      setSearch(searchTerm);
    }
    if (sellTargetCardId) {
      openSellModal(Number(sellTargetCardId));
    }

    if (searchTerm || sellTargetCardId) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fusionne chaque annonce avec ses infos résolues (nom/image), dans le même ordre
  const resolvedListings = useMemo(() => {
    return listings.map((l, idx) => ({
      ...l,
      name: resolvedResults[idx]?.data?.name ?? `${l.type} #${l.entityId}`,
      subtitle: resolvedResults[idx]?.data?.subtitle ?? "",
      imageUrl: resolvedResults[idx]?.data?.imageUrl ?? null,
      typeEmoji:
        resolvedResults[idx]?.data?.typeEmoji ??
        TYPE_META[l.type]?.emoji ??
        "🎞️",
    }));
  }, [listings, resolvedResults]);

  const resolving = resolvedResults.some((r) => r.isLoading);

  const ownedQtyByCardId = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of inventory) map[c.cardId] = c.quantity;
    return map;
  }, [inventory]);

  const aggregated = useMemo(() => {
    const groups = new Map<number, (typeof resolvedListings)[number][]>();
    for (const l of resolvedListings) {
      const arr = groups.get(l.cardId) ?? [];
      arr.push(l);
      groups.set(l.cardId, arr);
    }

    let result = Array.from(groups.entries()).map(([cardId, offers]) => {
      const sorted = [...offers].sort((a, b) => a.price - b.price);
      return {
        cardId,
        info: sorted[0],
        offers: sorted,
        offerCount: sorted.length,
        lowestOffer: sorted[0],
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.info.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "ALL")
      result = result.filter((g) => g.info.type === typeFilter);
    if (rarityFilter !== "ALL")
      result = result.filter((g) => g.info.rarity === rarityFilter);
    if (onlyMissing) result = result.filter((g) => !ownedQtyByCardId[g.cardId]);

    result.sort((a, b) => {
      if (sortBy === "PRICE_ASC")
        return a.lowestOffer.price - b.lowestOffer.price;
      if (sortBy === "PRICE_DESC")
        return b.lowestOffer.price - a.lowestOffer.price;
      if (sortBy === "OFFERS_DESC") return b.offerCount - a.offerCount;
      return (
        RARITY_ORDER.indexOf(a.info.rarity) -
        RARITY_ORDER.indexOf(b.info.rarity)
      );
    });

    return result;
  }, [
    resolvedListings,
    search,
    typeFilter,
    rarityFilter,
    onlyMissing,
    sortBy,
    ownedQtyByCardId,
  ]);

  const myActiveListings = useMemo(
    () => resolvedListings.filter((l) => l.sellerId === myId),
    [resolvedListings, myId],
  );

  function openSellModal(prefillCardId?: number) {
    const owned = inventory.filter((c) => c.quantity > 0);
    setSellCardId(prefillCardId ?? owned[0]?.cardId ?? null);
    setSellPrice(100);
    setActionError(null);
    setSellModalOpen(true);
  }

  function runAction(promise: Promise<unknown>, onDone?: () => void) {
    setActionError(null);
    promise
      .then(() => onDone?.())
      .catch((err: Error) => setActionError(err.message));
  }

  if (listingsLoading)
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement du marketplace...</span>
      </div>
    );

  const sellingCard = inventory.find((c) => c.cardId === sellCardId);
  const grossPrice = Math.max(10, Math.round(sellPrice || 0));
  const taxAmount = Math.ceil((grossPrice * TAX_PERCENT) / 100);
  const netSeller = grossPrice - taxAmount;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>Marketplace Communautaire • Taxe {TAX_PERCENT}%</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-[#F3F4F6] mt-1">
              Marché des Joueurs
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5 max-w-2xl">
              Achetez directement la carte que vous recherchez auprès des autres
              joueurs.{" "}
              <strong className="text-[#F3F4F6]">
                Le prix affiché correspond toujours à l'annonce la moins chère
                en vente.
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => openSellModal()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Mettre une carte en vente</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubTab("BROWSE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                subTab === "BROWSE"
                  ? "bg-[#E50914] border-[#E50914] text-white"
                  : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
            >
              🛒 Acheter une carte ({aggregated.length} références)
            </button>
            <button
              type="button"
              onClick={() => setSubTab("MY_LISTINGS")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                subTab === "MY_LISTINGS"
                  ? "bg-[#E50914] border-[#E50914] text-white"
                  : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
            >
              📦 Mes annonces actives ({myActiveListings.length})
            </button>
          </div>

          {subTab === "BROWSE" && (
            <button
              type="button"
              onClick={() => setOnlyMissing((p) => !p)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                onlyMissing
                  ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#FBBF24]"
                  : "bg-[#181820] border-white/10 text-[#9CA3AF] hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cartes manquantes uniquement</span>
            </button>
          )}
        </div>

        {subTab === "BROWSE" && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une carte à acheter..."
                  className="w-full pl-9 pr-7 py-2 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center bg-[#181820] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#F3F4F6]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF] mr-1.5 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent text-xs font-semibold text-[#F3F4F6] focus:outline-none cursor-pointer"
                >
                  <option value="PRICE_ASC" className="bg-[#181820]">
                    Prix le plus bas ↑
                  </option>
                  <option value="PRICE_DESC" className="bg-[#181820]">
                    Prix le plus élevé ↓
                  </option>
                  <option value="OFFERS_DESC" className="bg-[#181820]">
                    Plus d'offres disponibles
                  </option>
                  <option value="RARITY_DESC" className="bg-[#181820]">
                    Rareté (Légendaire ↓)
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "ALL", label: "Tout" },
                { id: "person", label: "👤 Acteurs" },
                { id: "movie", label: "🎬 Films" },
                { id: "series", label: "📺 Séries" },
                { id: "character", label: "🎭 Personnages" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTypeFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    typeFilter === cat.id
                      ? "bg-[#22222C] text-[#F3F4F6] border border-white/20"
                      : "bg-[#181820]/60 text-[#9CA3AF]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <span className="text-white/15 mx-1">|</span>
              {["ALL", "common", "uncommon", "rare", "epic", "legendary"].map(
                (rKey) => (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setRarityFilter(rKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap capitalize ${
                      rarityFilter === rKey
                        ? "bg-[#22222C] text-[#F3F4F6] border border-white/20"
                        : "bg-[#181820]/60 text-[#9CA3AF]"
                    }`}
                  >
                    {rKey === "ALL" ? "Toutes raretés" : rKey}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </section>

      {actionError && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {subTab === "BROWSE" ? (
        aggregated.length === 0 ? (
          <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
            <Package className="w-8 h-8 text-[#9CA3AF]/40 mx-auto mb-2" />
            <p className="text-sm text-[#9CA3AF]">
              {resolving
                ? "Résolution des cartes en cours..."
                : "Aucune annonce ne correspond à ces filtres."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {aggregated.map(({ cardId, info, offerCount, lowestOffer }) => {
              const ownedQty = ownedQtyByCardId[cardId] ?? 0;
              const typeMeta = TYPE_META[info.type];

              return (
                <div
                  key={cardId}
                  onClick={() => setSelectedCardId(cardId)}
                  className="group rounded-xl bg-[#181820] border border-white/[0.08] hover:border-white/25 transition-all overflow-hidden flex flex-col justify-between cursor-pointer shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-[#0B0B0E]">
                    {info.imageUrl && (
                      <img
                        src={info.imageUrl}
                        alt={info.name}
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181820] via-[#181820]/20 to-black/40" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#121217]/90 text-[#F3F4F6] border border-white/10">
                        <span>{typeMeta.emoji}</span>
                        <span>{typeMeta.label}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-[#121217]/90 text-[#F3F4F6] border-white/20 capitalize">
                        {info.rarity}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded bg-[#121217]/95 border border-white/15 text-[10px] font-bold text-[#F3F4F6]">
                        {offerCount} offre{offerCount > 1 ? "s" : ""}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ownedQty > 0 ? "bg-[#121217]/90 text-[#9CA3AF] border-white/10" : "bg-[#E50914]/20 text-[#F3F4F6] border-[#E50914]/50"}`}
                      >
                        {ownedQty > 0 ? `Possédée ×${ownedQty}` : "Manquante"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#F3F4F6] line-clamp-1">
                        {info.name}
                      </h3>
                      <p className="text-[11px] text-[#9CA3AF] line-clamp-1">
                        {info.subtitle}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#121217] border border-white/[0.07] p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">
                          Prix le moins cher
                        </div>
                        <div className="font-black text-sm text-[#F59E0B] flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>
                            {lowestOffer.price.toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#9CA3AF]">
                          Vendeur
                        </div>
                        <div className="text-[11px] font-bold text-[#F3F4F6] truncate max-w-[90px]">
                          @{lowestOffer.sellerUsername}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          runAction(buyListing.mutateAsync(lowestOffer.id));
                        }}
                        disabled={
                          lowestOffer.sellerId === myId || buyListing.isPending
                        }
                        className="w-full py-2 px-3 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <span>Acheter ({lowestOffer.price} Coins)</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(cardId);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-[#22222C] hover:bg-[#2C2C38] text-[11px] font-bold text-[#F3F4F6] flex items-center justify-center gap-1"
                      >
                        <span>Voir les {offerCount} offres</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="h-[2px] w-full bg-[#9CA3AF]" />
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-black text-[#F3F4F6]">
              Mes cartes en vente sur le Marché ({myActiveListings.length})
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Tant qu'une annonce est active, la copie correspondante est
              réservée.
            </p>
          </div>

          {myActiveListings.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-[#181820] rounded-xl border border-white/5">
              <p className="text-xs text-[#9CA3AF]">
                Vous n'avez aucune carte en vente actuellement.
              </p>
              <button
                type="button"
                onClick={() => openSellModal()}
                className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold uppercase"
              >
                Mettre une carte en vente
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myActiveListings.map((listing) => {
                const tax = Math.ceil((listing.price * TAX_PERCENT) / 100);
                const net = listing.price - tax;
                return (
                  <div
                    key={listing.id}
                    className="p-3.5 rounded-xl bg-[#181820] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {listing.imageUrl && (
                        <img
                          src={listing.imageUrl}
                          alt={listing.name}
                          className="w-12 h-14 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#F3F4F6]">
                            {listing.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-bold">
                            Copie réservée
                          </span>
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">
                          Prix affiché :{" "}
                          <strong className="text-[#F59E0B]">
                            {listing.price} Coins
                          </strong>{" "}
                          • Net après taxe {TAX_PERCENT}% :{" "}
                          <strong className="text-white">{net} Coins</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        runAction(cancelListing.mutateAsync(listing.id))
                      }
                      disabled={cancelListing.isPending}
                      className="px-3 py-1.5 rounded-xl bg-[#22222C] hover:bg-[#2C2C38] text-xs font-bold text-[#F3F4F6] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Retirer l'annonce
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedCardId !== null &&
        (() => {
          const group = aggregated.find((g) => g.cardId === selectedCardId);
          const info =
            group?.info ??
            resolvedListings.find((l) => l.cardId === selectedCardId);
          if (!info) return null;
          const offers =
            group?.offers ??
            resolvedListings.filter((l) => l.cardId === selectedCardId);
          const ownedQty = ownedQtyByCardId[selectedCardId] ?? 0;

          return (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-3xl bg-[#121217] border border-white/15 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {info.imageUrl && (
                      <img
                        src={info.imageUrl}
                        alt={info.name}
                        className="w-14 h-18 rounded-xl object-cover border border-white/10"
                      />
                    )}
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-[#181820] text-[#F3F4F6] border-white/20 capitalize">
                        {info.rarity}
                      </span>
                      <h3 className="text-lg font-black text-[#F3F4F6] mt-1">
                        {info.name}
                      </h3>
                      <p className="text-xs text-[#9CA3AF]">
                        Vous en possédez :{" "}
                        <strong className="text-white">×{ownedQty}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCardId(null)}
                    className="p-1.5 rounded-lg bg-[#181820] text-[#9CA3AF] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Annonces classées par prix croissant ({offers.length})
                    </span>
                    {ownedQty > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCardId(null);
                          openSellModal(info.cardId);
                        }}
                        className="text-xs font-bold text-[#E50914] hover:underline"
                      >
                        + Vendre ma copie
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {offers.map((offer, idx) => {
                      const isCheapest = idx === 0;
                      const isMine = offer.sellerId === myId;
                      return (
                        <div
                          key={offer.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${isCheapest ? "bg-[#181820] border-[#F59E0B]/60" : "bg-[#181820]/60 border-white/[0.06]"}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#F59E0B] flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5" />
                                {offer.price.toLocaleString("fr-FR")} Coins
                              </span>
                              {isCheapest && (
                                <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-black text-[10px] font-black uppercase">
                                  Prix le moins cher
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                              Vendu par{" "}
                              <strong className="text-[#F3F4F6]">
                                @{offer.sellerUsername}
                              </strong>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              type="button"
                              onClick={() =>
                                runAction(cancelListing.mutateAsync(offer.id))
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#22222C] text-xs font-bold text-[#F3F4F6]"
                            >
                              Retirer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                runAction(buyListing.mutateAsync(offer.id))
                              }
                              className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase ${isCheapest ? "bg-[#E50914] hover:bg-[#f6121d] text-white" : "bg-[#22222C] hover:bg-[#2C2C38] text-[#F3F4F6]"}`}
                            >
                              Acheter
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {sellModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#121217] border border-white/15 p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#F59E0B]">
                  Marketplace • Taxe de vente {TAX_PERCENT}%
                </span>
                <h3 className="text-lg font-black text-[#F3F4F6]">
                  Mettre une carte en vente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSellModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#9CA3AF]">
                Carte à vendre
              </label>
              <select
                value={sellCardId ?? ""}
                onChange={(e) => setSellCardId(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs font-bold text-[#F3F4F6]"
              >
                <option value="">Choisir une carte</option>
                {inventory
                  .filter((c) => c.quantity > 0)
                  .map((c) => (
                    <option
                      key={c.id}
                      value={c.cardId}
                      className="bg-[#181820]"
                    >
                      {c.type} #{c.entityId} ({c.rarity}) — Dispo : ×
                      {c.quantity}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#9CA3AF]">
                Votre prix de vente
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#181820] border border-white/15 font-black text-sm text-[#F59E0B]"
              />
            </div>

            <div className="rounded-xl bg-[#181820] border border-white/10 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Prix payé par l'acheteur</span>
                <span className="font-bold text-[#F3F4F6]">
                  {grossPrice} Coins
                </span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Taxe du Marché ({TAX_PERCENT}%)</span>
                <span className="font-bold text-[#E50914]">
                  -{taxAmount} Coins
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm">
                <span className="font-bold text-[#F3F4F6]">Vous recevrez</span>
                <span className="font-black text-[#F59E0B]">
                  {netSeller} Coins
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#9CA3AF]">
              🔒 Votre copie sera immédiatement réservée tant que l'annonce est
              en ligne.
            </p>

            {actionError && (
              <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
                <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSellModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#181820] text-xs font-bold text-[#9CA3AF]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  !sellCardId || !sellingCard || createListing.isPending
                }
                onClick={() =>
                  runAction(
                    createListing.mutateAsync({
                      cardId: sellCardId!,
                      price: sellPrice,
                    }),
                    () => setSellModalOpen(false),
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white text-xs font-black uppercase disabled:opacity-50"
              >
                Mettre en vente ({grossPrice} Coins)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
