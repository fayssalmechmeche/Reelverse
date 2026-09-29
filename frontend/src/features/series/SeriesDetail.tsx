import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Series {
  id: number;
  name: string;
}

interface Character {
  id: number;
  name: string;
  actor: string;
}

interface CharacterCollection {
  member: Character[];
}

async function fetchSeries(id: string): Promise<Series> {
  const res = await fetch(`/api/series/${id}`);
  return res.json();
}

async function fetchCharacters(seriesId: string): Promise<Character[]> {
  const res = await fetch(`/api/characters?series=/api/series/${seriesId}`);
  const data: CharacterCollection = await res.json();
  return data.member;
}

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>();

  const seriesQuery = useQuery({
    queryKey: ["series", id],
    queryFn: () => fetchSeries(id!),
  });

  const charactersQuery = useQuery({
    queryKey: ["characters", "series", id],
    queryFn: () => fetchCharacters(id!),
  });

  if (seriesQuery.isLoading) return <p>Chargement...</p>;

  return (
    <div>
      <Link to="/">← Retour</Link>
      <h2>{seriesQuery.data?.name}</h2>
      <h3>Personnages</h3>
      <ul>
        {charactersQuery.data?.map((character) => {
          const personId = character.actor.split("/").pop();
          return (
            <li key={character.id}>
              {character.name} —{" "}
              <Link to={`/people/${personId}`}>voir l'acteur</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
