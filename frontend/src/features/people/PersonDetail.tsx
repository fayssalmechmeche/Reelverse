import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Person {
  id: number;
  name: string;
}

interface Character {
  id: number;
  name: string;
  movie?: string;
  series?: string;
}

interface CharacterCollection {
  member: Character[];
}

async function fetchPerson(id: string): Promise<Person> {
  const res = await fetch(`/api/people/${id}`);
  return res.json();
}

async function fetchCharacters(personId: string): Promise<Character[]> {
  const res = await fetch(`/api/characters?actor=/api/people/${personId}`);
  const data: CharacterCollection = await res.json();
  return data.member;
}

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();

  const personQuery = useQuery({
    queryKey: ["person", id],
    queryFn: () => fetchPerson(id!),
  });

  const rolesQuery = useQuery({
    queryKey: ["characters", "actor", id],
    queryFn: () => fetchCharacters(id!),
  });

  if (personQuery.isLoading) return <p>Chargement...</p>;

  return (
    <div>
      <Link to="/">← Retour à la liste des films</Link>
      <h2>{personQuery.data?.name}</h2>
      <h3>Rôles joués</h3>
      <ul>
        {rolesQuery.data?.map((character) => {
          if (character.movie) {
            const movieId = character.movie.split("/").pop();
            return (
              <li key={character.id}>
                {character.name} dans{" "}
                <Link to={`/movies/${movieId}`}>ce film</Link>
              </li>
            );
          }
          if (character.series) {
            const seriesId = character.series.split("/").pop();
            return (
              <li key={character.id}>
                {character.name} dans{" "}
                <Link to={`/series/${seriesId}`}>cette série</Link>
              </li>
            );
          }
          return null;
        })}
      </ul>
    </div>
  );
}
