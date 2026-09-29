import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  posterPath: string | null;
  popularity: number;
}

interface MovieCollection {
  member: Movie[];
}

async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch("/api/movies");
  const data: MovieCollection = await res.json();
  return data.member;
}

export function MovieList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  if (isLoading) return <p>Chargement...</p>;
  if (error) return <p>Erreur de chargement</p>;

  return (
    <ul>
      {data?.map((movie) => (
        <li key={movie.id}>
          <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
        </li>
      ))}
    </ul>
  );
}
