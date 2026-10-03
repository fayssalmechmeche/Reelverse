import { useMemo, useState } from "react";
import {
  UserPlus,
  UserCheck,
  Ban,
  AlertCircle,
  Loader2,
  Users,
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

export function FriendsScreen() {
  const { data: me } = useMe();
  const { data, isLoading } = useFriendsData();
  const { data: blocked = [] } = useBlockedUsers();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading || !data)
    return (
      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-10 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement...</span>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center">
          <Users className="w-5 h-5 text-[#E50914]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#F3F4F6]">Amis</h2>
          <p className="text-[11px] text-[#9CA3AF]">
            Les échanges de cartes sont autorisés uniquement avec vos amis.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
                <span className="text-sm font-bold text-[#F3F4F6]">
                  @{r.username}
                </span>
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
            {data.friends.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-[#181820] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#22222C] border border-white/10 flex items-center justify-center font-black text-xs text-[#F3F4F6]">
                    {f.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#F3F4F6]">
                      @{f.username}
                    </div>
                    <div className="text-[11px] text-[#9CA3AF]">
                      Ami • Échanges débloqués (validité 48h)
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
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
    </div>
  );
}
