import { useParams, useNavigate } from "react-router-dom";
import { usePersonCollection } from "../collection/useCollection";
import { CollectionPage } from "../collection/CollectionPage";
import type { CollectionItem } from "../collection/useCollection";

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePersonCollection(Number(id));

  function handleItemClick(item: CollectionItem) {
    if (item.type === "movie") navigate(`/movies/${item.entityId}`);
    if (item.type === "series") navigate(`/series/${item.entityId}`);
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
