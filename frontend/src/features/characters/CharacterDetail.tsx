import { useParams, useNavigate } from "react-router-dom";
import { useCharacterCollection } from "../collection/useCollection";
import { CollectionPage } from "../collection/CollectionPage";
import type { CollectionItem } from "../collection/useCollection";

export function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useCharacterCollection(Number(id));

  function handleItemClick(item: CollectionItem) {
    if (item.type === "character") navigate(`/characters/${item.entityId}`);
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
