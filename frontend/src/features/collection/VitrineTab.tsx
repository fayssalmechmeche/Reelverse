import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCollectionsProgress,
  type CollectionProgress,
} from "./useCollectionsProgress";
import { CollectionProgressRow } from "./CollectionProgressRow";

const PAGE_SIZE = 15;

// Version allégée de "Ma Collection" : juste la progression des collections,
// sans les filtres par type ni les sous-onglets Possédées/Doublons/Wishlist/
// À échanger (qui restent exclusifs à la page Ma Collection séparée).
export function VitrineTab() {
  const navigate = useNavigate();
  const { data: collectionsProgress = [], isLoading } =
    useCollectionsProgress();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(
    1,
    Math.ceil(collectionsProgress.length / PAGE_SIZE),
  );

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const pageItems = useMemo(
    () =>
      collectionsProgress.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [collectionsProgress, page],
  );

  function goToDetail(c: CollectionProgress) {
    if (c.type === "movie") navigate(`/movies/${c.entityId}`);
    if (c.type === "series") navigate(`/series/${c.entityId}`);
    if (c.type === "person") navigate(`/people/${c.entityId}`);
  }

  if (isLoading) {
    return <p className="text-[#9CA3AF]">Chargement de la vitrine...</p>;
  }

  return (
    <div className="space-y-4">
      {pageItems.length === 0 ? (
        <div className="rounded-2xl bg-[#121217] border border-white/[0.06] p-10 text-center">
          <p className="text-sm text-[#9CA3AF]">
            Aucune collection entamée pour le moment. Obtenez des cartes pour
            voir apparaître votre progression ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageItems.map((c) => (
            <CollectionProgressRow
              key={`${c.type}-${c.entityId}`}
              collection={c}
              onClick={() => goToDetail(c)}
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
