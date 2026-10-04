import { useParams, useNavigate } from "react-router-dom";
import { useSeriesCollection } from "../collection/useCollection";
import { CollectionPage } from "../collection/CollectionPage";
import type { CollectionItem } from "../collection/useCollection";

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSeriesCollection(Number(id));

  function handleItemClick(item: CollectionItem) {
    // Un personnage renvoie vers l'acteur qui l'incarne (le graphe du jeu)
    if (item.type === "character" && item.actorId) {
      navigate(`/people/${item.actorId}`);
    }
  }

  return (
    <CollectionPage
      isLoading={isLoading}
      error={error}
      data={data}
      backLabel="Retour"
      onBack={() => navigate(-1)}
      onItemClick={handleItemClick}
    />
  );
}
