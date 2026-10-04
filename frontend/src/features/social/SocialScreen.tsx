import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  UserCheck,
  Ban,
  AlertCircle,
  Loader2,
  Repeat,
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";
import { useMe } from "../auth/useMe";
import {
  useFriendsData,
  useBlockedUsers,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriend,
  useBlockUser,
  useUnblockUser,
} from "./useFriends";
import {
  useTrades,
  useAcceptTrade,
  useCancelTrade,
  type TradeData,
} from "../trading/useTrading";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import { RARITY_CONFIG } from "../../design/rarity";
import { TradeProposalModal } from "../trading/TradeProposalModal";

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

const FRIENDS_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 10;

export function SocialScreen() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data, isLoading } = useFriendsData();
  const { data: blocked = [] } = useBlockedUsers();
  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  const acceptTrade = useAcceptTrade();
  const cancelTrade = useCancelTrade();

  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tradeModalFriend, setTradeModalFriend] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [friendsPage, setFriendsPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);

  const searchUsers = useSearchUsers();
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriend();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const myId = me?.id ?? null;
  const rawResults = searchUsers.data ?? [];

  const results = useMemo(() => {
    if (!data) return [];
    const excludedIds = new Set<number>([
      ...(myId !== null ? [myId] : []),
      ...data.friends.map((f) => f.userId),
      ...data.outgoing.map((f) => f.userId),
      ...data.incoming.map((f) => f.userId),
    ]);
    return rawResults.filter((r) => !excludedIds.has(r.id));
  }, [rawResults, data, myId]);

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
    return Array.from(map.entries());
  }, [trades]);

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

  const pendingTrades = useMemo(
    () => trades.filter((t) => t.status === "pending"),
    [trades],
  );
  const historyTrades = useMemo(
    () => trades.filter((t) => t.status !== "pending"),
    [trades],
  );

  const friends = data?.friends ?? [];
  const friendsTotalPages = Math.max(
    1,
    Math.ceil(friends.length / FRIENDS_PAGE_SIZE),
  );
  const friendsPageItems = useMemo(
    () =>
      friends.slice(
        friendsPage * FRIENDS_PAGE_SIZE,
        friendsPage * FRIENDS_PAGE_SIZE + FRIENDS_PAGE_SIZE,
      ),
    [friends, friendsPage],
  );

  useEffect(() => {
    if (friendsPage > friendsTotalPages - 1) {
      setFriendsPage(Math.max(0, friendsTotalPages - 1));
    }
  }, [friendsPage, friendsTotalPages]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyTrades.length / HISTORY_PAGE_SIZE),
  );
  const historyPageItems = useMemo(
    () =>
      historyTrades.slice(
        historyPage * HISTORY_PAGE_SIZE,
        historyPage * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
      ),
    [historyTrades, historyPage],
  );

  useEffect(() => {
    if (historyPage > historyTotalPages - 1) {
      setHistoryPage(Math.max(0, historyTotalPages - 1));
    }
  }, [historyPage, historyTotalPages]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (query.trim().length < 2) return;
    searchUsers.mutate(query.trim());
  }

  function run(promise: Promise<unknown>, onDone?: () => void) {
    setError(null);
    promise.then(() => onDone?.()).catch((err: Error) => setError(err.message));
  }

  function TradeCard({ trade }: { trade: TradeData }) {
    const isRecipient = trade.recipientId === myId;
    const myItems = trade.items.filter((i) => i.ownerId === myId);
    const theirItems = trade.items.filter((i) => i.ownerId !== myId);
    const otherUsername =
      trade.proposerId === myId
        ? trade.recipientUsername
        : trade.proposerUsername;
    const otherUserId =
      trade.proposerId === myId ? trade.recipientId : trade.proposerId;

    return (
      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/players/${otherUserId}`)}
            className="flex items-center gap-2.5 text-left hover:opacity-80"
          >
            <div className="w-9 h-9 rounded-xl bg-[#22222C] border border-[#E50914]/25 flex items-center justify-center font-black text-xs text-[#F3F4F6]">
              {otherUsername.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-[#F3F4F6] hover:text-[#E50914] hover:underline">
                Avec @{otherUsername}
              </div>
              <div className="text-[10px] text-[#9CA3AF]">
                {trade.proposerId === myId
                  ? "Proposé par vous"
                  : "Reçu de ce joueur"}
              </div>
            </div>
          </button>
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

  if (isLoading || !data || tradesLoading)
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement...</span>
      </div>
    );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Boutons rapides d'échange + propositions en cours */}
      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#F59E0B]">
          <Repeat className="w-3.5 h-3.5" />
          <span>Trading entre amis • Validité 48h • 0 Coin</span>
        </div>
        <h3 className="text-sm font-black text-[#F3F4F6]">
          Propositions d'échange ({pendingTrades.length})
        </h3>

        {pendingTrades.length > 0 ? (
          <div className="space-y-3 pt-2">
            {pendingTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF]">
            Aucune proposition en attente.
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <h3 className="text-sm font-black text-[#F3F4F6] flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#F59E0B]" />
          <span>Ajouter un ami par pseudo</span>
        </h3>
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez un pseudo unique..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider shrink-0 transition-all"
          >
            Rechercher
          </button>
        </form>

        {results.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-[#181820] rounded-xl p-3"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/players/${r.id}`)}
                  className="text-sm font-bold text-[#F3F4F6] hover:text-[#E50914] hover:underline"
                >
                  @{r.username}
                </button>
                <button
                  onClick={() =>
                    run(sendRequest.mutateAsync(r.id), () => {
                      searchUsers.reset();
                      setQuery("");
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#f6121d] text-white text-[11px] font-bold"
                >
                  Envoyer une demande
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.incoming.length > 0 && (
        <section className="rounded-2xl bg-[#121217] border border-[#F59E0B]/30 p-4 space-y-3">
          <h3 className="text-sm font-black text-[#F3F4F6]">
            Demandes d'amis reçues ({data.incoming.length})
          </h3>
          <div className="space-y-2">
            {data.incoming.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-[#181820] border border-white/10 flex flex-wrap items-center justify-between gap-2"
              >
                <span className="font-bold text-sm text-[#F3F4F6]">
                  @{f.username}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => run(accept.mutateAsync(f.id))}
                    className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white text-xs font-bold flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Accepter</span>
                  </button>
                  <button
                    onClick={() => run(remove.mutateAsync(f.id))}
                    className="px-3 py-1.5 rounded-xl bg-[#22222C] hover:bg-[#2C2C38] text-[#9CA3AF] hover:text-white text-xs font-bold"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.outgoing.length > 0 && (
        <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
          <h3 className="text-sm font-black text-[#F3F4F6]">
            Demandes envoyées ({data.outgoing.length})
          </h3>
          <div className="space-y-2">
            {data.outgoing.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-[#181820] rounded-xl p-3"
              >
                <span className="text-sm font-bold text-[#F3F4F6]">
                  @{f.username}
                </span>
                <span className="text-[11px] text-[#71717A] uppercase font-semibold">
                  En attente
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <h3 className="text-sm font-black text-[#F3F4F6]">
          Mes Amis ({data.friends.length})
        </h3>
        {data.friends.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Vous n'avez pas encore d'amis. Recherchez un pseudo ci-dessus pour
            envoyer une demande.
          </p>
        ) : (
          <div className="space-y-2.5">
            {friendsPageItems.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-[#181820] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/players/${f.userId}`)}
                  className="flex items-center gap-3 text-left hover:opacity-80"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#22222C] border border-white/10 flex items-center justify-center font-black text-xs text-[#F3F4F6]">
                    {f.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#F3F4F6] hover:text-[#E50914] hover:underline">
                      @{f.username}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">
                      Ami • Échanges débloqués (validité 48h)
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() =>
                      setTradeModalFriend({
                        id: f.userId,
                        username: f.username,
                      })
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-xs font-bold text-white flex items-center gap-1"
                  >
                    <Repeat className="w-3 h-3" />
                    Échanger
                  </button>
                  <button
                    onClick={() => run(remove.mutateAsync(f.id))}
                    className="px-2.5 py-1.5 rounded-xl bg-[#121217] hover:bg-[#22222C] text-xs font-semibold text-[#9CA3AF] hover:text-white"
                  >
                    Retirer
                  </button>
                  <button
                    onClick={() => run(blockUser.mutateAsync(f.userId))}
                    className="px-2.5 py-1.5 rounded-xl bg-[#E50914]/15 hover:bg-[#E50914]/25 text-xs font-bold text-[#E50914] flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3" />
                    Bloquer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {friendsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFriendsPage((p) => Math.max(0, p - 1))}
              disabled={friendsPage === 0}
              className="px-3.5 py-2 rounded-xl bg-[#181820] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="text-xs font-bold text-[#9CA3AF]">
              Page {friendsPage + 1} / {friendsTotalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setFriendsPage((p) => Math.min(friendsTotalPages - 1, p + 1))
              }
              disabled={friendsPage >= friendsTotalPages - 1}
              className="px-3.5 py-2 rounded-xl bg-[#181820] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <h3 className="text-sm font-black text-[#F3F4F6]">
          Joueurs bloqués ({blocked.length})
        </h3>
        {blocked.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Aucun joueur bloqué actuellement.
          </p>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-[#181820] border border-white/5 flex items-center justify-between"
              >
                <span className="text-xs font-bold text-[#9CA3AF]">
                  @{b.username} (demandes & échanges bloqués)
                </span>
                <button
                  onClick={() => run(unblockUser.mutateAsync(b.userId))}
                  className="px-3 py-1 rounded-lg bg-[#22222C] hover:bg-[#2C2C38] text-xs font-bold text-[#F3F4F6]"
                >
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {historyTrades.length > 0 && (
        <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
          <h3 className="text-sm font-black text-[#F3F4F6]">
            Historique ({historyTrades.length})
          </h3>
          <div className="space-y-3">
            {historyPageItems.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>

          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                className="px-3.5 py-2 rounded-xl bg-[#181820] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-xs font-bold text-[#9CA3AF]">
                Page {historyPage + 1} / {historyTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setHistoryPage((p) => Math.min(historyTotalPages - 1, p + 1))
                }
                disabled={historyPage >= historyTotalPages - 1}
                className="px-3.5 py-2 rounded-xl bg-[#181820] border border-white/[0.08] text-xs font-bold text-[#9CA3AF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </section>
      )}

      {tradeModalFriend && (
        <TradeProposalModal
          friendId={tradeModalFriend.id}
          friendUsername={tradeModalFriend.username}
          onClose={() => setTradeModalFriend(null)}
        />
      )}
    </div>
  );
}
