import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';

import Navbar from './components/shared/Navbar';
import PageTransition from './components/shared/PageTransition';

import Home from './pages/Home';
import Auth from './pages/Auth';
import Upload from './pages/Upload';
import Results from './pages/Results';
import RecipeDetail from './pages/RecipeDetail';
import History from './pages/History';
import Favorites from './pages/Favorites';
import MealPlan from './pages/MealPlan';
import RecipeResults from './pages/RecipeResults';

// ── Protected Route wrapper ───────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve intended destination for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
};

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />

      {/* AnimatePresence enables exit animations on route change */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />

          {/* Protected */}
          <Route path="/upload" element={
            <ProtectedRoute>
              <PageTransition><Upload /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/results/:uploadId" element={
            <ProtectedRoute>
              <PageTransition><Results /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/recipes/:spoonacularId" element={
            <ProtectedRoute>
              <PageTransition><RecipeDetail /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <PageTransition><History /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <PageTransition><Favorites /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/mealplan" element={
            <ProtectedRoute>
              <PageTransition><MealPlan /></PageTransition>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
