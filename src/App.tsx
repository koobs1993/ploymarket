import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorldCupProvider } from "./context/WorldCupContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthPage } from "./pages/Auth";
import { TradePage } from "./pages/Trade";
import { PortfolioPage } from "./pages/Portfolio";
import { AdminPage } from "./pages/Admin";
import "./index.css";
import "./landing.css";
import "./trading.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ backgroundColor: "#040812", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
        Loading trading platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ backgroundColor: "#040812", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/trade" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorldCupProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Page */}
            <Route 
              path="/auth" 
              element={
                <AuthRoute>
                  <AuthPage />
                </AuthRoute>
              } 
            />

            {/* Protected Trading App Routes */}
            <Route 
              path="/trade" 
              element={
                <ProtectedRoute>
                  <TradePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                <ProtectedRoute>
                  <PortfolioPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorldCupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
