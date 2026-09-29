import { Routes, Route } from "react-router-dom";
import { MovieList } from "./features/movies/MovieList";
import { MovieDetail } from "./features/movies/MovieDetail";
import { SeriesList } from "./features/series/SeriesList";
import { SeriesDetail } from "./features/series/SeriesDetail";
import { PersonDetail } from "./features/people/PersonDetail";

function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Reelverse</h1>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h2>Films</h2>
              <MovieList />
              <h2>Séries</h2>
              <SeriesList />
            </>
          }
        />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/people/:id" element={<PersonDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
      </Routes>
    </div>
  );
}

export default App;
