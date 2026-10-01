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
import { ShopScreen } from "./features/shop/ShopScreen";
import { Link } from "react-router-dom";
import { InventoryScreen } from "./features/inventory/InventoryScreen";

function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="bg-[#0B0B0E] min-h-screen text-white p-8">
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
                  <Link to="/shop" className="text-[#E50914] text-sm font-bold">
                    Voir la boutique →
                  </Link>
                  <Link
                    to="/inventory"
                    className="text-[#E50914] text-sm font-bold"
                  >
                    Ma collection →
                  </Link>
                  <h2>Films</h2>
                  <MovieList />
                  <h2>Séries</h2>
                  <SeriesList />
                  <Link
                    to="/inventory"
                    className="text-[#E50914] text-sm font-bold"
                  >
                    Ma collection →
                  </Link>
                </>
              }
            />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/series/:id" element={<SeriesDetail />} />
            <Route path="/shop" element={<ShopScreen />} />
            <Route path="/inventory" element={<InventoryScreen />} />
          </>
        ) : (
          <Route path="*" element={<LoginPage />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
