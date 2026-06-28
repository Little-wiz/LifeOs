// src/pages/SettingsPage.jsx
//
// Scope note: the backend currently only has signup/signin/google-auth —
// there's no endpoint to update a name or password yet. Rather than
// fake editable fields that don't actually save anywhere, this page
// shows real account info (from the logged-in session) and a real,
// working Logout. Editing name/password is a clean follow-up once
// the backend has a PATCH /auth/me endpoint to call.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/shared/Button";
import { useAuth } from "../context/AuthContext";
import { getGoals, getIntegrations } from "../services/api";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGoals().catch(() => []), getIntegrations().catch(() => [])]).then(
      ([goalList, integrationList]) => {
        setGoals(goalList);
        setIntegrations(integrationList);
        setIsLoading(false);
      }
    );
  }, []);

  function handleLogout() {
    logout();
    navigate("/sign-in", { replace: true });
  }

  const connectedCount = integrations.filter((i) => i.connected).length;
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "?";

  return (
    <div className="settings-page">
      <Sidebar goals={goals} />

      <main className="settings-main">
        <header className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account and connected apps.</p>
        </header>

        <section className="settings-card">
          <div className="settings-card-head">
            <h2>Account</h2>
          </div>
          <div className="account-row">
            <div className="account-avatar">{initials}</div>
            <div className="account-info">
              <p className="account-name">{user?.name || "Guest"}</p>
              <p className="account-email">{user?.email || "—"}</p>
            </div>
            <span className="plan-pill">Free plan</span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-head">
            <h2>Integrations</h2>
            <Button variant="text" size="sm" onClick={() => navigate("/integrations")}>
              Manage →
            </Button>
          </div>
          <p className="settings-card-summary">
            {isLoading
              ? "Loading..."
              : connectedCount > 0
              ? `${connectedCount} app${connectedCount === 1 ? "" : "s"} connected.`
              : "No apps connected yet."}
          </p>
        </section>

        <section className="settings-card settings-card-danger">
          <div className="settings-card-head">
            <h2>Session</h2>
          </div>
          <p className="settings-card-summary">Sign out of LifeOS on this device.</p>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </section>
      </main>
    </div>
  );
}
