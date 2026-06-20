// src/pages/OnboardingPage.jsx
//
// The 3-step setup flow a brand-new user goes through right after
// signing up. Unlike the Stitch mockup (which showed all 3 steps as a
// static snapshot), this version actually moves through the steps:
// each one is interactive, and finishing step 1 really creates a goal
// in the database, and connecting an app in step 2 really starts that
// app's OAuth flow.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/shared/Button";
import { createGoal, getIntegrations, connectIntegration } from "../services/api";
import "./OnboardingPage.css";

const GOAL_SUGGESTIONS = ["Internship", "Scholarship", "Portfolio", "Learn a skill"];
const CATEGORIES = ["Career", "Education", "Project", "Health", "Other"];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [goalTitle, setGoalTitle] = useState("");
  const [category, setCategory] = useState("Career");
  const [selectedTag, setSelectedTag] = useState(null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [createdGoal, setCreatedGoal] = useState(null);
  const [goalError, setGoalError] = useState("");

  // Step 2 state
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  useEffect(() => {
    if (currentStep === 2) {
      setLoadingIntegrations(true);
      getIntegrations()
        .then(setIntegrations)
        .catch(() => setIntegrations([]))
        .finally(() => setLoadingIntegrations(false));
    }
  }, [currentStep]);

  async function handleCreateGoal(e) {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setGoalError("Give your goal a name first.");
      return;
    }
    setGoalError("");
    setIsCreatingGoal(true);
    try {
      const goal = await createGoal({ title: goalTitle, category });
      setCreatedGoal(goal);
      setCurrentStep(2);
    } catch (err) {
      setGoalError(err.message || "Couldn't create that goal. Try again.");
    } finally {
      setIsCreatingGoal(false);
    }
  }

  const [connectError, setConnectError] = useState("");

  async function handleConnect(provider) {
    setConnectError("");
    try {
      const { redirectUrl } = await connectIntegration(provider);
      window.location.href = redirectUrl;
    } catch (err) {
      // Providers without real OAuth yet (GitHub, Notion) return a
      // clear 501 message from the server — show it instead of
      // silently doing nothing, so the person isn't left wondering
      // why the button didn't work.
      setConnectError(err.message || "Couldn't connect that app right now.");
    }
  }

  function handleFinish() {
    navigate("/dashboard");
  }

  const progressPercent = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <main className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-header-left">
            <div className="onboarding-logo-mark" aria-hidden="true" />
            <h1>Let's get you set up</h1>
          </div>
          <span className="onboarding-step-label">Step {currentStep} of 3</span>
        </div>

        <div className="onboarding-progress-track">
          <div
            className="onboarding-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="onboarding-grid">
          {/* ── Step 1: Your first goal ── */}
          <div
            className={`onboarding-card ${
              currentStep === 1 ? "card-active" : currentStep > 1 ? "card-done" : "card-pending"
            }`}
          >
            <div className="card-header">
              <div className={`step-badge ${currentStep > 1 ? "badge-done" : "badge-active"}`}>
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <div>
                <h2>Your first goal</h2>
                <p className="step-status">
                  {currentStep > 1 ? "Done" : "In progress"}
                </p>
              </div>
            </div>

            {currentStep === 1 ? (
              <form className="card-body" onSubmit={handleCreateGoal}>
                <div className="field">
                  <label htmlFor="goalTitle">What do you want to achieve?</label>
                  <input
                    id="goalTitle"
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g. Land an ML internship by March"
                  />
                </div>

                <div className="field">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="suggestion-row">
                  <span className="suggestion-label">Or pick a common goal:</span>
                  <div className="suggestion-chips">
                    {GOAL_SUGGESTIONS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className={`suggestion-chip ${selectedTag === tag ? "chip-selected" : ""}`}
                        onClick={() => {
                          setSelectedTag(tag);
                          setGoalTitle(tag === "Internship" ? "Land an internship" : tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {goalError && <p className="field-error">{goalError}</p>}

                <Button type="submit" variant="primary" fullWidth disabled={isCreatingGoal}>
                  {isCreatingGoal ? "Creating..." : "Continue"}
                </Button>
              </form>
            ) : (
              <div className="card-body card-body-summary">
                <div className="summary-field">
                  <span className="summary-label">Goal name</span>
                  <span className="summary-value">{createdGoal?.title || goalTitle}</span>
                </div>
                <div className="summary-field">
                  <span className="summary-label">Category</span>
                  <span className="summary-value">{createdGoal?.category || category}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Step 2: Connect your apps ── */}
          <div
            className={`onboarding-card ${
              currentStep === 2 ? "card-active" : currentStep > 2 ? "card-done" : "card-pending"
            }`}
          >
            <div className="card-header">
              <div
                className={`step-badge ${
                  currentStep > 2 ? "badge-done" : currentStep === 2 ? "badge-active" : "badge-inactive"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <div>
                <h2>Connect your apps</h2>
                <p className="step-status">
                  {currentStep > 2 ? "Done" : currentStep === 2 ? "In progress" : "Up next"}
                </p>
              </div>
            </div>

            {currentStep === 2 && (
              <div className="card-body">
                <p className="card-intro">Sync your data to power your roadmap.</p>

                {loadingIntegrations ? (
                  <p className="loading-text">Loading integrations...</p>
                ) : (
                  <div className="integration-list">
                    {integrations.map((integration) => (
                      <button
                        key={integration.provider}
                        type="button"
                        className="integration-row"
                        onClick={() => integration.live && !integration.connected && handleConnect(integration.provider)}
                        disabled={integration.connected || !integration.live}
                      >
                        <span className="integration-name">
                          {integration.name}
                          {!integration.live && (
                            <span className="coming-soon-tag">Coming soon</span>
                          )}
                        </span>
                        <span
                          className={`integration-status-icon ${
                            integration.connected ? "status-connected" : "status-empty"
                          }`}
                        >
                          {integration.connected ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {connectError && <p className="field-error">{connectError}</p>}

                <div className="card-actions">
                  <Button variant="primary" fullWidth onClick={() => setCurrentStep(3)}>
                    Continue →
                  </Button>
                  <button className="skip-link" onClick={() => setCurrentStep(3)}>
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Meet your AI ── */}
          <div
            className={`onboarding-card ${currentStep === 3 ? "card-active" : "card-pending"}`}
          >
            <div className="card-header">
              <div className={`step-badge ${currentStep === 3 ? "badge-active" : "badge-inactive"}`}>
                3
              </div>
              <div>
                <h2>Meet your AI</h2>
                <p className="step-status">{currentStep === 3 ? "Almost there" : "Up next"}</p>
              </div>
            </div>

            <div className="card-body">
              <div className="ai-preview-bubble">
                <span className="ai-preview-icon" aria-hidden="true">🤖</span>
                <p>
                  "Hey! I've created your{" "}
                  {(createdGoal?.title || goalTitle || "goal").toLowerCase()} and set up your
                  roadmap. Tell me anytime you make progress and I'll keep things on track."
                </p>
              </div>

              <ul className="ai-feature-list">
                <li>✓ Dynamic scheduling</li>
                <li>✓ Goal breakdown engine</li>
                <li>✓ Contextual reminders</li>
                <li>✓ Weekly performance audits</li>
              </ul>

              <Button
                variant="primary"
                fullWidth
                disabled={currentStep !== 3}
                onClick={handleFinish}
              >
                Go to my workspace →
              </Button>
            </div>
          </div>
        </div>

        <div className="onboarding-banner">
          <p className="banner-title">Focus on what matters.</p>
          <p className="banner-subtitle">
            LifeOS connects your calendar, tools, and goals into a single execution engine.
          </p>
        </div>
      </div>
    </main>
  );
}
