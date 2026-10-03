import { useMemo, useState } from "react";
import {
  Repeat,
  Search,
  X,
  Check,
  ArrowRight,
  Clock,
  AlertCircle,
  Ban,
  Loader2,
  Plus,
  Heart,
} from "lucide-react";
import { useMe } from "../auth/useMe";
import { useFriendsData } from "../social/useFriends";
import { useInventory, type InventoryCard } from "../inventory/useInventory";
import {
  useFriendInventory,
  type FriendInventoryCard,
} from "./useFriendInventory";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import { useFriendWishlist } from "../wishlist/useFriendWishlist";
import { useFriendSaleList } from "../wishlist/useFriendSaleList";
import {
  useTrades,
  useProposeTrade,
  useAcceptTrade,
  useCancelTrade,
  type TradeData,
} from "./useTrading";
import { RARITY_CONFIG } from "../../design/rarity";

const STATUS_STYLE: Record<TradeData["status"], string> = {
  pending: "bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40",
  accepted: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-[#22222C] text-[#9CA3AF] border-white/10",
  expired: "bg-[#22222C] text-[#9CA3AF] border-white/10",
};

const STATUS_LABEL: Record<TradeData["status"], string> = {
  pending: "En attente",
  accepted: "Acceptée",
  cancelled: "Annulée",
  expired: "Expirée",
};

const TYPE_META: Record<
  InventoryCard["type"],
  { emoji: string; label: string }
> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

type Side = "MY" | "FRIEND";
type MyFilter = "ALL" | "DUPLICATES" | "FRIEND_WISHLIST";
type FriendFilter = "ALL" | "MISSING_FOR_ME" | "IN_SALE_LIST";
type MobileStep = "FRIEND_CARDS" | "MY_CARDS" | "SUMMARY";

export function TradingScreen() {
  const { data: me } = useMe();
  const { data: friendsData, isLoading: friendsLoading } = useFriendsData();
  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  const { data: inventory = [] } = useInventory();
  const proposeTrade = useProposeTrade();
  const acceptTrade = useAcceptTrade();
  const cancelTrade = useCancelTrade();

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [myOffer, setMyOffer] = useState<Record<number, number>>({});
  const [theirRequest, setTheirRequest] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [myFilter, setMyFilter] = useState<MyFilter>("ALL");
  const [friendFilter, setFriendFilter] = useState<FriendFilter>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState<MobileStep>("FRIEND_CARDS");

  const myId = me?.id ?? null;
  const friends = friendsData?.friends ?? [];
  const activeFriend =
    friends.find((f) => f.userId === selectedFriendId) ?? null;

  const { data: friendInventory = [], isLoading: friendInventoryLoading } =
    useFriendInventory(selectedFriendId);
  const { data: friendWishlistCardIds = [] } =
    useFriendWishlist(selectedFriendId);
  const { data: friendSaleListCardIds = [] } =
    useFriendSaleList(selectedFriendId);
  const friendWishlistSet = useMemo(
    () => new Set(friendWishlistCardIds),
    [friendWishlistCardIds],
  );
  const friendSaleListSet = useMemo(
    () => new Set(friendSaleListCardIds),
    [friendSaleListCardIds],
  );

  const cardRefs = useMemo(() => {
    const map = new Map<number, CardRef>();
    for (const trade of trades) {
      for (const item of trade.items) {
        if (!map.has(item.cardId))
          map.set(item.cardId, {
            type: item.type,
            entityId: item.entityId,
            rarity: item.rarity,
          });
      }
    }
    for (const c of [...inventory, ...friendInventory]) {
      if (!map.has(c.cardId))
        map.set(c.cardId, {
          type: c.type,
          entityId: c.entityId,
          rarity: c.rarity,
        });
    }
    return Array.from(map.entries());
  }, [trades, inventory, friendInventory]);

  const resolvedResults = useResolvedCards(cardRefs.map(([, ref]) => ref));

  const resolved = useMemo(() => {
    const out: Record<
      number,
      { name: string; subtitle: string; imageUrl: string | null }
    > = {};
    cardRefs.forEach(([cardId], idx) => {
      const r = resolvedResults[idx]?.data;
      if (r)
        out[cardId] = {
          name: r.name,
          subtitle: r.subtitle,
          imageUrl: r.imageUrl,
        };
    });
    return out;
  }, [cardRefs, resolvedResults]);

  const myQtyByCardId = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of inventory) map[c.cardId] = c.quantity;
    return map;
  }, [inventory]);

  const friendQtyByCardId = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of friendInventory) map[c.cardId] = c.quantity;
    return map;
  }, [friendInventory]);

  function openProposeModal() {
    setSelectedFriendId(null);
    setMyOffer({});
    setTheirRequest({});
    setSearchQuery("");
    setMyFilter("ALL");
    setFriendFilter("ALL");
    setError(null);
    setMobileStep("FRIEND_CARDS");
    setShowProposeModal(true);
  }

  function selectFriend(id: number) {
    setSelectedFriendId(id);
    setTheirRequest({});
  }

  function stepQty(side: Side, cardId: number, delta: number, max: number) {
    const setter = side === "MY" ? setMyOffer : setTheirRequest;
    setter((prev) => {
      const current = prev[cardId] ?? 0;
      const next = Math.min(max, Math.max(0, current + delta));
      const copy = { ...prev };
      if (next <= 0) delete copy[cardId];
      else copy[cardId] = next;
      return copy;
    });
  }

  function toggleCard(side: Side, cardId: number, max: number) {
    if (max <= 0) return;
    const current = (side === "MY" ? myOffer : theirRequest)[cardId] ?? 0;
    stepQty(side, cardId, current === 0 ? 1 : -current, max);
  }

  function run(promise: Promise<unknown>, onDone?: () => void) {
    setError(null);
    promise.then(() => onDone?.()).catch((err: Error) => setError(err.message));
  }

  function handlePropose() {
    const myCards = Object.entries(myOffer).flatMap(([id, qty]) =>
      Array(qty).fill(Number(id)),
    );
    const theirCards = Object.entries(theirRequest).flatMap(([id, qty]) =>
      Array(qty).fill(Number(id)),
    );
    if (!selectedFriendId || (myCards.length === 0 && theirCards.length === 0))
      return;
    run(
      proposeTrade.mutateAsync({
        recipientId: selectedFriendId,
        myCards,
        theirCards,
      }),
      () => setShowProposeModal(false),
    );
  }

  const myOwnedCards = useMemo(() => {
    return inventory.filter((c) => {
      if (c.quantity <= 0) return false;
      if (myFilter === "DUPLICATES" && c.quantity < 2) return false;
      if (myFilter === "FRIEND_WISHLIST" && !friendWishlistSet.has(c.cardId))
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const info = resolved[c.cardId];
        if (!info?.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [inventory, myFilter, friendWishlistSet, searchQuery, resolved]);

  const friendOwnedCards = useMemo(() => {
    return friendInventory.filter((c) => {
      if (c.quantity <= 0) return false;
      if (
        friendFilter === "MISSING_FOR_ME" &&
        (myQtyByCardId[c.cardId] ?? 0) > 0
      )
        return false;
      if (friendFilter === "IN_SALE_LIST" && !friendSaleListSet.has(c.cardId))
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const info = resolved[c.cardId];
        if (!info?.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [
    friendInventory,
    friendFilter,
    friendSaleListSet,
    searchQuery,
    resolved,
    myQtyByCardId,
  ]);

  const myOfferEntries = Object.entries(myOffer).filter(([, q]) => q > 0);
  const theirRequestEntries = Object.entries(theirRequest).filter(
    ([, q]) => q > 0,
  );
  const totalMyOffered = myOfferEntries.reduce((acc, [, q]) => acc + q, 0);
  const totalTheirRequested = theirRequestEntries.reduce(
    (acc, [, q]) => acc + q,
    0,
  );

  const pendingTrades = useMemo(
    () => trades.filter((t) => t.status === "pending"),
    [trades],
  );
  const historyTrades = useMemo(
    () => trades.filter((t) => t.status !== "pending"),
    [trades],
  );

  if (tradesLoading || friendsLoading || myId === null)
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement des échanges...</span>
      </div>
    );

  function renderSelectableCard(
    card: InventoryCard | FriendInventoryCard,
    side: Side,
  ) {
    const info = resolved[card.cardId];
    const rarity = RARITY_CONFIG[card.rarity];
    const typeMeta = TYPE_META[card.type];
    const max =
      side === "MY"
        ? (myQtyByCardId[card.cardId] ?? 0)
        : (friendQtyByCardId[card.cardId] ?? 0);
    const selectedQty =
      (side === "MY" ? myOffer : theirRequest)[card.cardId] ?? 0;
    const isSelected = selectedQty > 0;

    const crossQty =
      side === "MY"
        ? (friendQtyByCardId[card.cardId] ?? 0)
        : (myQtyByCardId[card.cardId] ?? 0);
    const isMissingForMe =
      side === "FRIEND" && (myQtyByCardId[card.cardId] ?? 0) === 0;
    const isWantedByFriend =
      side === "MY" && friendWishlistSet.has(card.cardId);
    const isInFriendSaleList =
      side === "FRIEND" && friendSaleListSet.has(card.cardId);

    return (
      <div
        key={`${side}-${card.cardId}`}
        onClick={() => toggleCard(side, card.cardId, max)}
        className={`group relative rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col justify-between transition-all duration-200 ${
          isSelected
            ? side === "MY"
              ? "bg-[#181820] border-2 border-[#E50914] shadow-[0_8px_25px_rgba(229,9,20,0.35)] -translate-y-0.5"
              : "bg-[#181820] border-2 border-[#F59E0B] shadow-[0_8px_25px_rgba(245,158,11,0.35)] -translate-y-0.5"
            : "bg-[#181820] border border-white/10 hover:border-white/25"
        }`}
      >
        <div className="relative w-full h-40 sm:h-48 shrink-0 overflow-hidden bg-[#0B0B0E]">
          {info?.imageUrl && (
            <img
              src={info.imageUrl}
              alt={info.name}
              loading="lazy"
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 block"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181820] via-transparent to-black/55" />

          {isSelected && (
            <div
              className={`absolute top-0 inset-x-0 z-10 py-1 px-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md ${
                side === "MY"
                  ? "bg-[#E50914] text-white"
                  : "bg-[#F59E0B] text-black"
              }`}
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>
                {side === "MY" ? "Offre" : "Demandée"} ×{selectedQty}
              </span>
            </div>
          )}

          <div
            className={`absolute ${isSelected ? "top-7" : "top-2"} left-2 right-2 flex items-center justify-between gap-1 transition-all`}
          >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#121217]/90 text-[#F3F4F6] border border-white/15 backdrop-blur-md">
              <span>{typeMeta.emoji}</span>
              <span>{typeMeta.label}</span>
            </span>
            <span
              style={rarity.badgeStyle}
              className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase border backdrop-blur-md"
            >
              {rarity.label}
            </span>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
            {isMissingForMe ? (
              <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[9px] font-black uppercase shadow">
                ✨ Manquante
              </span>
            ) : isWantedByFriend ? (
              <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[9px] font-black uppercase flex items-center gap-1 shadow">
                <Heart className="w-2.5 h-2.5 fill-white" />
                <span>Wishlist Ami</span>
              </span>
            ) : isInFriendSaleList ? (
              <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-black text-[9px] font-black uppercase shadow">
                💰 À échanger
              </span>
            ) : (
              <span />
            )}
            <span className="px-2 py-0.5 rounded bg-[#121217]/95 text-[11px] font-black text-white border border-white/15">
              ×{max}
            </span>
          </div>
        </div>

        <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5 bg-[#181820]">
          <div>
            <h4 className="font-black text-xs sm:text-sm text-[#F3F4F6] line-clamp-1">
              {info?.name ?? `${card.type} #${card.entityId}`}
            </h4>
            <p className="text-[11px] text-[#9CA3AF] line-clamp-1 mt-0.5">
              {info?.subtitle ?? typeMeta.label}
            </p>
          </div>

          <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-1">
            <span className="text-[10px] text-[#9CA3AF] truncate">
              {side === "MY" ? "Chez ami : " : "Chez vous : "}
              <strong
                className={crossQty === 0 ? "text-[#F59E0B]" : "text-[#F3F4F6]"}
              >
                {crossQty === 0 ? "0" : `×${crossQty}`}
              </strong>
            </span>

            {isSelected && max > 1 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-[#121217] px-1.5 py-0.5 rounded-lg border border-white/15 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => stepQty(side, card.cardId, -1, max)}
                  className="text-xs font-black text-[#9CA3AF] hover:text-white px-1"
                >
                  -
                </button>
                <span className="text-[11px] font-black text-[#F59E0B]">
                  ×{selectedQty}
                </span>
                <button
                  type="button"
                  onClick={() => stepQty(side, card.cardId, 1, max)}
                  className="text-xs font-black text-[#9CA3AF] hover:text-white px-1"
                >
                  +
                </button>
              </div>
            ) : (
              <span
                className={`text-[10px] font-black uppercase shrink-0 ${isSelected ? "text-[#E50914]" : side === "MY" ? "text-[#F3F4F6]" : "text-[#F59E0B]"}`}
              >
                {isSelected
                  ? "Retirer"
                  : side === "MY"
                    ? "+ Offrir"
                    : "+ Demander"}
              </span>
            )}
          </div>
        </div>

        <div className={`h-[3px] w-full ${rarity.bottomBarClass}`} />
      </div>
    );
  }

  function TradeCard({ trade }: { trade: TradeData }) {
    const isRecipient = trade.recipientId === myId;
    const myItems = trade.items.filter((i) => i.ownerId === myId);
    const theirItems = trade.items.filter((i) => i.ownerId !== myId);
    const otherUsername =
      trade.proposerId === myId
        ? trade.recipientUsername
        : trade.proposerUsername;

    return (
      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22222C] border border-[#E50914]/25 flex items-center justify-center font-black text-xs text-[#F3F4F6]">
              {otherUsername.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-[#F3F4F6]">
                Avec @{otherUsername}
              </div>
              <div className="text-[10px] text-[#9CA3AF]">
                {trade.proposerId === myId
                  ? "Proposé par vous"
                  : "Reçu de ce joueur"}
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${STATUS_STYLE[trade.status]}`}
          >
            {STATUS_LABEL[trade.status]}
          </span>
        </div>

        <div className="flex items-center gap-3 bg-[#181820] rounded-xl p-3">
          <div className="flex-1 space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[#9CA3AF]">
              Vous donnez ({myItems.length})
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {myItems.length === 0 ? (
                <span className="text-[11px] text-[#71717A]">Rien</span>
              ) : (
                myItems.map((item, idx) => {
                  const info = resolved[item.cardId];
                  return (
                    <div key={idx} className="shrink-0" title={info?.name}>
                      <div
                        className="w-9 h-12 rounded-md overflow-hidden bg-[#0B0B0E] border"
                        style={{
                          borderColor:
                            RARITY_CONFIG[item.rarity].badgeStyle.borderColor,
                        }}
                      >
                        {info?.imageUrl && (
                          <img
                            src={info.imageUrl}
                            alt={info.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div
                        className={`h-[2px] w-9 mt-0.5 rounded-full ${RARITY_CONFIG[item.rarity].bottomBarClass}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />

          <div className="flex-1 space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-[#9CA3AF]">
              Vous recevez ({theirItems.length})
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {theirItems.length === 0 ? (
                <span className="text-[11px] text-[#71717A]">Rien</span>
              ) : (
                theirItems.map((item, idx) => {
                  const info = resolved[item.cardId];
                  return (
                    <div key={idx} className="shrink-0" title={info?.name}>
                      <div
                        className="w-9 h-12 rounded-md overflow-hidden bg-[#0B0B0E] border"
                        style={{
                          borderColor:
                            RARITY_CONFIG[item.rarity].badgeStyle.borderColor,
                        }}
                      >
                        {info?.imageUrl && (
                          <img
                            src={info.imageUrl}
                            alt={info.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div
                        className={`h-[2px] w-9 mt-0.5 rounded-full ${RARITY_CONFIG[item.rarity].bottomBarClass}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {trade.status === "pending" && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
              <Clock className="w-3 h-3" />
              <span>
                Expire le {new Date(trade.expiresAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="flex gap-2">
              {isRecipient && (
                <button
                  onClick={() => run(acceptTrade.mutateAsync(trade.id))}
                  className="px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#f6121d] text-white text-[11px] font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accepter
                </button>
              )}
              <button
                onClick={() => run(cancelTrade.mutateAsync(trade.id))}
                className="px-3 py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2C2C38] text-[#9CA3AF] hover:text-white text-[11px] font-bold flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                {isRecipient ? "Refuser" : "Annuler"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center">
            <Repeat className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#F3F4F6]">Échanges</h2>
            <p className="text-[11px] text-[#9CA3AF]">
              Échangez des cartes avec vos amis — valable 48h.
            </p>
          </div>
        </div>
        <button
          onClick={openProposeModal}
          disabled={friends.length === 0}
          className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-40 disabled:active:translate-y-0 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Proposer un échange
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {friends.length === 0 && (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
          <Repeat className="w-8 h-8 text-[#9CA3AF]/40 mx-auto mb-2" />
          <p className="text-sm text-[#9CA3AF]">
            Ajoutez des amis pour pouvoir échanger des cartes.
          </p>
        </div>
      )}

      {pendingTrades.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#9CA3AF]">
            En attente ({pendingTrades.length})
          </h3>
          {pendingTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}

      {historyTrades.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#9CA3AF]">
            Historique ({historyTrades.length})
          </h3>
          {historyTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}

      {trades.length === 0 && friends.length > 0 && (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
          <Repeat className="w-8 h-8 text-[#9CA3AF]/40 mx-auto mb-2" />
          <p className="text-sm text-[#9CA3AF]">
            Aucun échange pour le moment.
          </p>
        </div>
      )}

      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-6xl rounded-3xl bg-[#121217] border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden max-h-[92vh]">
            {/* EN-TÊTE */}
            <div className="p-3.5 sm:p-5 border-b border-white/[0.08] bg-[#181820] flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Échange entre amis • Validité 48h</span>
                    </div>
                    <h2 className="text-sm sm:text-lg font-black text-[#F3F4F6] truncate">
                      {activeFriend
                        ? `Échanger avec @${activeFriend.username}`
                        : "Proposer un échange"}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="p-2 rounded-xl bg-[#22222C] text-[#9CA3AF] hover:text-white shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-bold text-[#9CA3AF] shrink-0 mr-1">
                  Ami :
                </span>
                {friends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFriend(f.userId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                      selectedFriendId === f.userId
                        ? "bg-[#E50914] text-white"
                        : "bg-[#22222C] text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    @{f.username}
                  </button>
                ))}
              </div>

              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une carte par nom..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl bg-[#121217] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Navigation à 3 étapes (toutes tailles d'écran) */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#121217] border border-white/[0.08] max-w-md">
                <button
                  type="button"
                  onClick={() => setMobileStep("FRIEND_CARDS")}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                    mobileStep === "FRIEND_CARDS"
                      ? "bg-[#F59E0B] text-black shadow"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  <span>1. Ami</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                    {totalTheirRequested}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileStep("MY_CARDS")}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                    mobileStep === "MY_CARDS"
                      ? "bg-[#E50914] text-white shadow"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  <span>2. Moi</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px]">
                    {totalMyOffered}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileStep("SUMMARY")}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                    mobileStep === "SUMMARY"
                      ? "bg-emerald-500 text-black shadow"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  <span>3. Offre</span>
                  <span className="text-[10px]">
                    ({totalMyOffered}⇄{totalTheirRequested})
                  </span>
                </button>
              </div>
            </div>

            {/* CORPS */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-5">
              <div className="grid grid-cols-1 gap-5">
                {/* Colonne ami : étape 1 */}
                <div
                  className={`${
                    mobileStep === "FRIEND_CARDS" ? "block" : "hidden"
                  } rounded-2xl bg-[#181820]/50 border border-white/[0.08] p-3.5 space-y-3`}
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#F59E0B]">
                      {activeFriend
                        ? `Cartes possédées par @${activeFriend.username} (${friendOwnedCards.length})`
                        : "Choisissez un ami"}
                    </h3>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Cliquez sur les cartes que vous souhaitez demander.
                    </p>
                  </div>

                  {activeFriend && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {(
                        [
                          { id: "ALL", label: "Toutes ses cartes" },
                          {
                            id: "MISSING_FOR_ME",
                            label: "✨ Manquantes chez moi",
                          },
                          {
                            id: "IN_SALE_LIST",
                            label: "💰 Liste « à échanger »",
                          },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFriendFilter(f.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                            friendFilter === f.id
                              ? "bg-[#F59E0B] text-black"
                              : "bg-[#121217] text-[#9CA3AF] hover:text-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {!activeFriend ? (
                    <div className="p-8 text-center rounded-xl bg-[#121217] border border-white/5">
                      <p className="text-[11px] text-[#71717A]">
                        Choisissez un ami ci-dessus pour voir ses cartes.
                      </p>
                    </div>
                  ) : friendInventoryLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />
                    </div>
                  ) : friendOwnedCards.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-[#121217] border border-white/5">
                      <p className="text-[11px] text-[#71717A]">
                        Aucune carte ne correspond.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {friendOwnedCards.map((card) =>
                        renderSelectableCard(card, "FRIEND"),
                      )}
                    </div>
                  )}
                </div>

                {/* Colonne moi : étape 2 */}
                <div
                  className={`${
                    mobileStep === "MY_CARDS" ? "block" : "hidden"
                  } rounded-2xl bg-[#181820]/50 border border-white/[0.08] p-3.5 space-y-3`}
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#F3F4F6]">
                      Vos cartes disponibles ({myOwnedCards.length})
                    </h3>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Cliquez sur vos cartes à offrir en échange.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(
                      [
                        { id: "ALL", label: "Toutes mes cartes" },
                        { id: "DUPLICATES", label: "🔄 Mes doublons (×2+)" },
                        {
                          id: "FRIEND_WISHLIST",
                          label: activeFriend
                            ? `❤️ Wishlist de @${activeFriend.username}`
                            : "❤️ Wishlist ami",
                        },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMyFilter(f.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
                          myFilter === f.id
                            ? "bg-[#E50914] text-white"
                            : "bg-[#121217] text-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {myOwnedCards.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-[#121217] border border-white/5">
                      <p className="text-[11px] text-[#71717A]">
                        Aucune carte ne correspond.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {myOwnedCards.map((card) =>
                        renderSelectableCard(card, "MY"),
                      )}
                    </div>
                  )}
                </div>

                {/* Récapitulatif : étape 3 */}
                <div
                  className={`${
                    mobileStep === "SUMMARY" ? "block" : "hidden"
                  } rounded-2xl bg-[#0B0B0E] border border-white/10 p-3.5 sm:p-4 space-y-3.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#F3F4F6]">
                      Plateau ({totalMyOffered} offerte
                      {totalMyOffered > 1 ? "s" : ""} ⇄ {totalTheirRequested}{" "}
                      demandée{totalTheirRequested > 1 ? "s" : ""})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMyOffer({});
                        setTheirRequest({});
                      }}
                      className="text-[11px] font-bold text-[#9CA3AF] hover:text-white shrink-0"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-3 space-y-2.5">
                      <span className="text-xs font-black text-[#E50914] uppercase">
                        📤 Vous donnez ({totalMyOffered})
                      </span>
                      {myOfferEntries.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#9CA3AF]">
                          Aucune carte sélectionnée.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {myOfferEntries.map(([cardId]) => {
                            const c = inventory.find(
                              (item) => item.cardId === Number(cardId),
                            );
                            return c ? renderSelectableCard(c, "MY") : null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-3 space-y-2.5">
                      <span className="text-xs font-black text-[#F59E0B] uppercase truncate">
                        📥 Vous recevez{" "}
                        {activeFriend ? `de @${activeFriend.username}` : ""} (
                        {totalTheirRequested})
                      </span>
                      {theirRequestEntries.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#9CA3AF]">
                          Aucune carte sélectionnée.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {theirRequestEntries.map(([cardId]) => {
                            const c = friendInventory.find(
                              (item) => item.cardId === Number(cardId),
                            );
                            return c ? renderSelectableCard(c, "FRIEND") : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PIED DE MODALE */}
            <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#181820] flex flex-col gap-2.5 shrink-0">
              {mobileStep === "SUMMARY" && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF]">
                  <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>
                    <strong className="text-[#F3F4F6]">Validité 48h :</strong>{" "}
                    si une carte proposée est vendue ou échangée entre-temps,
                    l'échange est automatiquement annulé.
                  </span>
                </div>
              )}

              {error && <span className="text-xs text-[#E50914]">{error}</span>}

              <div className="w-full flex items-center justify-between gap-2">
                {mobileStep === "FRIEND_CARDS" ? (
                  <button
                    type="button"
                    onClick={() => setMobileStep("MY_CARDS")}
                    className="w-full py-3 px-4 rounded-xl bg-[#E50914] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>
                      Suivant : Choisir mes cartes ({totalTheirRequested}{" "}
                      demandée{totalTheirRequested > 1 ? "s" : ""})
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : mobileStep === "MY_CARDS" ? (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileStep("FRIEND_CARDS")}
                      className="px-3 py-3 rounded-xl bg-[#22222C] text-xs font-bold text-[#F3F4F6] hover:text-white"
                    >
                      ← Ami
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileStep("SUMMARY")}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#F59E0B] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <span>
                        Voir l'offre ({totalMyOffered} ⇄ {totalTheirRequested})
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileStep("MY_CARDS")}
                      className="px-3 py-3 rounded-xl bg-[#22222C] text-xs font-bold text-[#F3F4F6] hover:text-white"
                    >
                      ← Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProposeModal(false)}
                      className="px-3 py-3 rounded-xl bg-[#22222C] text-xs font-bold text-[#9CA3AF] hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={
                        !selectedFriendId ||
                        (totalMyOffered === 0 && totalTheirRequested === 0)
                      }
                      onClick={handlePropose}
                      className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        selectedFriendId &&
                        (totalMyOffered > 0 || totalTheirRequested > 0)
                          ? "bg-[#E50914] hover:bg-[#f6121d] text-white shadow-lg"
                          : "bg-[#22222C] text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                      <span>
                        Envoyer ({totalMyOffered} ⇄ {totalTheirRequested})
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
