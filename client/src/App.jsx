// src/App.jsx
//
// This is the root of the app. It decides which page to show based
// on the URL, and wraps everything in AuthProvider so any page can
// check "is someone logged in?"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProductTour from "./components/tour/ProductTour";

import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import OnboardingPage from "./pages/OnboardingPage";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import WeeklyDigestPage from "./pages/WeeklyDigestPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Wrap any page that should only be visible to logged-in users with
// this. If nobody is logged in, it sends them to the sign-in page.
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // could show a loading spinner here
  if (!user) return <Navigate to="/sign-in" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Split out from App so we can call useAuth() here — useAuth needs to
// be inside AuthProvider, and this also lets the tour mount only when
// someone is actually logged in.
function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {/* {user && <ProductTour />} */}
      <Routes>
        {/* Public pages — anyone can see these */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Logged-in only pages */}
        <Route
          path="/onboarding"
          element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/goals/:goalId"
          element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/opportunities"
          element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>}
        />
        <Route
          path="/integrations"
          element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>}
        />
        <Route
          path="/digest"
          element={<ProtectedRoute><WeeklyDigestPage /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
        />

        {/* Anything else shows a friendly 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
