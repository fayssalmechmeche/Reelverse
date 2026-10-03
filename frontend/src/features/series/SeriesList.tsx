import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface Series {
  id: number;
  name: string;
}

interface SeriesCollection {
  member: Series[];
}

async function fetchSeries(): Promise<Series[]> {
  const res = await fetch("/api/series");
  const data: SeriesCollection = await res.json();
  return data.member;
}

export function SeriesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["series"],
    queryFn: fetchSeries,
  });

  if (isLoading) return <p>Chargement...</p>;
  if (error) return <p>Erreur de chargement</p>;

  return (
    <ul>
      {data?.map((s) => (
        <li key={s.id}>
          <Link to={`/series/${s.id}`}>{s.name}</Link>
        </li>
      ))}
    </ul>
  );
}
