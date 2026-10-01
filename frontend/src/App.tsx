import { Routes, Route } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { PackOpener } from "./features/packs/PackOpener";
import { MovieList } from "./features/movies/MovieList";
import { MovieDetail } from "./features/movies/MovieDetail";
import { SeriesList } from "./features/series/SeriesList";
import { SeriesDetail } from "./features/series/SeriesDetail";
import { PersonDetail } from "./features/people/PersonDetail";

function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Reelverse</h1>
      {isAuthenticated && <button onClick={logout}>Déconnexion</button>}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {isAuthenticated ? (
          <>
            <Route
              path="/"
              element={
                <>
                  <PackOpener />
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
          </>
        ) : (
          <Route path="*" element={<LoginPage />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
