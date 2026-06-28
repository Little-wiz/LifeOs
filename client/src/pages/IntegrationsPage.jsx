// src/pages/IntegrationsPage.jsx
//
// Connect/disconnect third-party apps. Everything here reflects the
// real backend state, not a static mockup:
//   - the list of providers, their connected status, and lastSyncedAt
//     all come from the real GET /integrations endpoint
//   - "Connect" on Google Calendar kicks off the real OAuth flow —
//     the backend hands back a redirectUrl and we send the browser
//     there for real, then Google redirects back here afterward
//   - Gmail, GitHub, and Notion are honestly labeled "Coming soon"
//     because the backend itself reports them as not-live yet
//     (SUPPORTED_PROVIDERS exists for them, but there's no real OAuth
//     wired up). We don't pretend they work.
//   - "Disconnect" actually calls DELETE /integrations/:provider and
//     refreshes the list from the server afterward

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/shared/Button";
import { getIntegrations, connectIntegration, disconnectIntegration, getGoals } from "../services/api";
import "./IntegrationsPage.css";

// Visual presentation for each provider. The backend is the source of
// truth for which providers exist and whether they're live — this map
// only supplies icon/description, and falls back gracefully for any
// provider it doesn't recognize.
const PROVIDER_META = {
  "google-calendar": {
    icon: "📅",
    description: "Sync milestone deadlines and goal target dates straight to your calendar.",
  },
  gmail: {
    icon: "✉️",
    description: "Let LifeOS read opportunity deadlines and follow-ups from your inbox.",
  },
  github: {
    icon: "🐙",
    description: "Auto-update coding milestones when you push commits or close pull requests.",
  },
  notion: {
    icon: "📝",
    description: "Two-way sync between your LifeOS goals and your Notion workspace.",
  },
};

const ERROR_MESSAGES = {
  missing_code: "Google didn't return an authorization code. Please try connecting again.",
  invalid_state: "That connection request expired or was invalid. Please try again.",
  token_exchange_failed: "Couldn't finish connecting with Google. Please try again.",
  unsupported_provider: "That integration isn't supported yet.",
};

export default function IntegrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [integrations, setIntegrations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingProvider, setPendingProvider] = useState(null); // provider currently connecting/disconnecting
  const [banner, setBanner] = useState(null); // { type: "success" | "error", message }

  useEffect(() => {
    loadIntegrations();
  }, []);

  // Handle the redirect back from Google: /integrations?connected=google-calendar
  // or /integrations?error=token_exchange_failed. Show a banner once,
  // then strip the query params so refreshing the page doesn't re-show it.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      const name = providerLabel(connected, integrations);
      setBanner({ type: "success", message: `${name} connected successfully.` });
      setSearchParams({}, { replace: true });
    } else if (error) {
      setBanner({
        type: "error",
        message: ERROR_MESSAGES[error] || "Connection was cancelled or failed. Please try again.",
      });
      setSearchParams({}, { replace: true });
    }
    // We intentionally don't include `integrations` in deps — this
    // should only run once, right when the page lands with query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadIntegrations() {
    setIsLoading(true);
    setLoadError("");
    try {
      const [integrationList, goalList] = await Promise.all([
        getIntegrations(),
        getGoals().catch(() => []),
      ]);
      setIntegrations(integrationList);
      setGoals(goalList);
    } catch (err) {
      setLoadError(err.message || "Couldn't load your integrations.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect(provider) {
    setPendingProvider(provider);
    setBanner(null);
    try {
      const { redirectUrl } = await connectIntegration(provider);
      // Real OAuth needs a full browser navigation, not a SPA route
      // change — Google has to redirect back here once the user
      // approves access.
      window.location.href = redirectUrl;
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't start that connection." });
      setPendingProvider(null);
    }
  }

  async function handleDisconnect(provider) {
    const label = providerLabel(provider, integrations);
    if (!window.confirm(`Disconnect ${label}? You can reconnect it any time.`)) return;

    setPendingProvider(provider);
    setBanner(null);
    try {
      await disconnectIntegration(provider);
      await loadIntegrations();
      setBanner({ type: "success", message: `${label} disconnected.` });
    } catch (err) {
      setBanner({ type: "error", message: err.message || "Couldn't disconnect that integration." });
    } finally {
      setPendingProvider(null);
    }
  }

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="integrations-page">
      <Sidebar goals={goals} />

      <main className="integrations-main">
        <header className="integrations-header">
          <div>
            <h1>Integrations</h1>
            <p>
              {isLoading
                ? "Loading..."
                : `${connectedCount} connected · ${integrations.length} available`}
            </p>
          </div>
        </header>

        {banner && (
          <div className={`integrations-banner banner-${banner.type}`}>
            <span>{banner.message}</span>
            <button
              className="banner-dismiss"
              onClick={() => setBanner(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="integrations-loading">Loading your integrations...</p>
        ) : loadError ? (
          <div className="integrations-error">
            <p>{loadError}</p>
            <button onClick={() => navigate("/dashboard")}>← Back to dashboard</button>
          </div>
        ) : (
          <section className="integrations-grid">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.provider}
                integration={integration}
                isPending={pendingProvider === integration.provider}
                onConnect={() => handleConnect(integration.provider)}
                onDisconnect={() => handleDisconnect(integration.provider)}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function providerLabel(provider, integrations) {
  return integrations.find((i) => i.provider === provider)?.name || provider;
}

function IntegrationCard({ integration, isPending, onConnect, onDisconnect }) {
  const { provider, name, connected, lastSyncedAt, live } = integration;
  const meta = PROVIDER_META[provider] || { icon: "🔌", description: "Third-party integration." };

  return (
    <div className={`integration-card ${connected ? "integration-card-connected" : ""}`}>
      <div className="integration-card-top">
        <div className="integration-icon" aria-hidden="true">{meta.icon}</div>
        <div className="integration-status">
          {!live ? (
            <span className="status-pill pill-soon">Coming soon</span>
          ) : connected ? (
            <span className="status-pill pill-connected">Connected</span>
          ) : (
            <span className="status-pill pill-disconnected">Not connected</span>
          )}
        </div>
      </div>

      <h3 className="integration-name">{name}</h3>
      <p className="integration-description">{meta.description}</p>

      {connected && lastSyncedAt && (
        <p className="integration-synced">Last synced {timeAgo(lastSyncedAt)}</p>
      )}

      <div className="integration-card-action">
        {!live ? (
          <Button variant="ghost" size="sm" fullWidth disabled>
            Coming soon
          </Button>
        ) : connected ? (
          <Button variant="ghost" size="sm" fullWidth disabled={isPending} onClick={onDisconnect}>
            {isPending ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <Button variant="primary" size="sm" fullWidth disabled={isPending} onClick={onConnect}>
            {isPending ? "Connecting..." : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
}

// Turns an ISO timestamp into a short relative string like "2 hours ago".
function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
