import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Movie {
  id: number;
  title: string;
  posterPath: string | null;
}

interface Character {
  id: number;
  name: string;
  actor: string; // IRI, ex: "/api/people/131"
}

interface CharacterCollection {
  member: Character[];
}

async function fetchMovie(id: string): Promise<Movie> {
  const res = await fetch(`/api/movies/${id}`);
  return res.json();
}

async function fetchCharacters(movieId: string): Promise<Character[]> {
  const res = await fetch(`/api/characters?movie=/api/movies/${movieId}`);
  const data: CharacterCollection = await res.json();
  return data.member;
}

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();

  const movieQuery = useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovie(id!),
  });

  const charactersQuery = useQuery({
    queryKey: ["characters", "movie", id],
    queryFn: () => fetchCharacters(id!),
  });

  if (movieQuery.isLoading) return <p>Chargement...</p>;

  return (
    <div>
      <Link to="/">← Retour</Link>
      <h2>{movieQuery.data?.title}</h2>
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
