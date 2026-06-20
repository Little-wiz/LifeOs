// src/services/api.js
//
// This file is the only place in the app that talks to the backend.
// Every other file calls these functions instead of writing fetch()
// calls directly. That way, if the API ever changes, we only update
// it in one place.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Reads the saved login token from the browser so we can send it
// with every request that needs the user to be logged in.
function getToken() {
  return localStorage.getItem("lifeos_token");
}

// A small wrapper around fetch() that adds the login token automatically
// and turns error responses into JavaScript errors we can catch.
async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "Something went wrong");
  }

  // Some responses (like DELETE) have no body.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ── Auth ──────────────────────────────────────────────────

export function signUp({ name, email, password }) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function signIn({ email, password }) {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signInWithGoogle({ idToken, name, email, googleId }) {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken, name, email, googleId }),
  });
}

// ── Goals ─────────────────────────────────────────────────

export function getGoals(status) {
  const query = status ? `?status=${status}` : "";
  return request(`/goals${query}`);
}

export function getGoal(goalId) {
  return request(`/goals/${goalId}`);
}

export function createGoal(data) {
  return request("/goals", { method: "POST", body: JSON.stringify(data) });
}

export function updateGoal(goalId, updates) {
  return request(`/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteGoal(goalId) {
  return request(`/goals/${goalId}`, { method: "DELETE" });
}

export function updateMilestone(goalId, milestoneId, status) {
  return request(`/goals/${goalId}/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Chat ──────────────────────────────────────────────────

export function sendChatMessage(message) {
  return request("/chat", { method: "POST", body: JSON.stringify({ message }) });
}

export function getChatHistory(limit = 20) {
  return request(`/chat/history?limit=${limit}`);
}

export function getWeeklyDigest() {
  return request("/chat/digest");
}

// ── Opportunities ─────────────────────────────────────────

export function getOpportunities(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/opportunities${params ? `?${params}` : ""}`);
}

export function createOpportunity(data) {
  return request("/opportunities", { method: "POST", body: JSON.stringify(data) });
}

export function updateOpportunity(oppId, status) {
  return request(`/opportunities/${oppId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteOpportunity(oppId) {
  return request(`/opportunities/${oppId}`, { method: "DELETE" });
}

// ── Integrations ──────────────────────────────────────────

export function getIntegrations() {
  return request("/integrations");
}

export function connectIntegration(provider) {
  return request(`/integrations/${provider}/connect`, { method: "POST" });
}

export function disconnectIntegration(provider) {
  return request(`/integrations/${provider}`, { method: "DELETE" });
}
