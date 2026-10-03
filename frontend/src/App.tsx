import { Routes, Route } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { AppShell } from "./features/layout/AppShell";
import { HomeScreen } from "./features/home/HomeScreen";
import { MovieDetail } from "./features/movies/MovieDetail";
import { SeriesDetail } from "./features/series/SeriesDetail";
import { PersonDetail } from "./features/people/PersonDetail";
import { ShopScreen } from "./features/shop/ShopScreen";
import { ProfileScreen } from "./features/profile/ProfileScreen";
import { MarketplaceScreen } from "./features/marketplace/MarketplaceScreen";
import { SocialScreen } from "./features/social/SocialScreen";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-[#0B0B0E] min-h-screen flex items-center justify-center text-[#9CA3AF] text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {isAuthenticated ? (
        <>
          <Route
            path="/"
            element={
              <AppShell>
                <HomeScreen />
              </AppShell>
            }
          />
          <Route
            path="/movies/:id"
            element={
              <AppShell>
                <MovieDetail />
              </AppShell>
            }
          />
          <Route
            path="/people/:id"
            element={
              <AppShell>
                <PersonDetail />
              </AppShell>
            }
          />
          <Route
            path="/series/:id"
            element={
              <AppShell>
                <SeriesDetail />
              </AppShell>
            }
          />
          <Route
            path="/shop"
            element={
              <AppShell>
                <ShopScreen />
              </AppShell>
            }
          />
          <Route
            path="/profile"
            element={
              <AppShell>
                <ProfileScreen />
              </AppShell>
            }
          />
          <Route
            path="/marketplace"
            element={
              <AppShell>
                <MarketplaceScreen />
              </AppShell>
            }
          />
          <Route
            path="/social"
            element={
              <AppShell>
                <SocialScreen />
              </AppShell>
            }
          />
        </>
      ) : (
        <Route path="*" element={<LoginPage />} />
      )}
    </Routes>
  );
}

export default App;
