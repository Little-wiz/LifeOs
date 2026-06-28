// src/pages/GoalDetailPage.jsx
//
// The deep-dive view for a single goal. Reached by clicking a goal
// card on the Dashboard. Everything here is real:
//   - the goal + milestones are fetched by the :goalId in the URL
//   - clicking a milestone checkbox actually calls updateMilestone()
//     and updates the percentage immediately
//   - linked opportunities are the real ones tied to this goal
//   - the "Ask about this goal" panel sends real messages to the AI,
//     with the goal's title woven into the question for context

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getGoal,
  updateMilestone,
  getOpportunities,
  sendChatMessage,
} from "../services/api";
import "./GoalDetailPage.css";

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  async function loadGoal() {
    setIsLoading(true);
    setLoadError("");
    try {
      const [goalData, oppList] = await Promise.all([
        getGoal(goalId),
        getOpportunities({ goalId }),
      ]);
      setGoal(goalData);
      setOpportunities(oppList);
    } catch (err) {
      setLoadError(err.message || "Couldn't load this goal.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleMilestone(milestone) {
    const newStatus = milestone.status === "done" ? "pending" : "done";

    // Update locally right away so the click feels instant, then
    // confirm with the server.
    setGoal((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.milestoneId === milestone.milestoneId ? { ...m, status: newStatus } : m
      ),
    }));

    try {
      await updateMilestone(goalId, milestone.milestoneId, newStatus);
      // Re-fetch to get the server's recalculated progressPercent.
      const updated = await getGoal(goalId);
      setGoal(updated);
    } catch {
      // If the update fails, reload to get back to the real state.
      loadGoal();
    }
  }

  if (isLoading) {
    return <div className="goal-detail-loading">Loading goal...</div>;
  }

  if (loadError || !goal) {
    return (
      <div className="goal-detail-error">
        <p>{loadError || "Goal not found."}</p>
        <button onClick={() => navigate("/dashboard")}>← Back to dashboard</button>
      </div>
    );
  }

  const milestones = goal.milestones || [];
  const doneCount = milestones.filter((m) => m.status === "done").length;
  const monthsRemaining = goal.targetDate
    ? Math.max(
        0,
        Math.round((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30))
      )
    : null;

  return (
    <div className="goal-detail-page">
      <header className="goal-detail-topbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")} aria-label="Back">
          ←
        </button>
        <nav className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <span>›</span>
          <span className="breadcrumb-current">{goal.title}</span>
        </nav>
      </header>

      <main className="goal-detail-main">
        <div className="goal-detail-content">
          <section className="goal-hero">
            <div className="goal-hero-bar" />
            <div className="goal-hero-body">
              <div className="goal-tags">
                <span className="tag">{goal.category}</span>
                <span className="tag">{goal.status === "completed" ? "Completed" : "Active"}</span>
                {goal.progressPercent >= 50 && <span className="tag tag-accent">On track</span>}
              </div>
              <h1>{goal.title}</h1>

              <div className="progress-row">
                <span className="progress-label">Overall progress</span>
                <span className="progress-pct">{goal.progressPercent || 0}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${goal.progressPercent || 0}%` }}
                />
              </div>

              <div className="goal-stats">
                <div className="stat">
                  <span className="stat-label">Milestones</span>
                  <span className="stat-value">
                    {doneCount}/{milestones.length}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Opportunities</span>
                  <span className="stat-value">{opportunities.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Target</span>
                  <span className="stat-value">
                    {goal.targetDate
                      ? new Date(goal.targetDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Remaining</span>
                  <span className="stat-value stat-accent">
                    {monthsRemaining !== null ? `${monthsRemaining} months` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="milestones-section">
            <div className="section-head">
              <h2>Milestones</h2>
            </div>
            <div className="milestones-list">
              {milestones.length === 0 ? (
                <p className="empty-note">No milestones yet for this goal.</p>
              ) : (
                milestones.map((m) => (
                  <MilestoneRow key={m.milestoneId} milestone={m} onToggle={handleToggleMilestone} />
                ))
              )}
            </div>
          </section>

          {opportunities.length > 0 && (
            <section className="opportunities-section">
              <h2>Linked Opportunities</h2>
              <div className="opportunities-grid">
                {opportunities.map((opp) => (
                  <a
                    key={opp.oppId}
                    href={opp.url || "#"}
                    target={opp.url ? "_blank" : undefined}
                    rel="noreferrer"
                    className="opportunity-card"
                  >
                    <div className="opp-icon" aria-hidden="true">🎯</div>
                    <div className="opp-info">
                      <div className="opp-row">
                        <span className="opp-name">{opp.name}</span>
                        <span className={`opp-status status-${opp.status}`}>{opp.status}</span>
                      </div>
                      <p className="opp-deadline">
                        {opp.deadline
                          ? `Deadline: ${new Date(opp.deadline).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : "No deadline set"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="goal-detail-sidebar">
          <GoalChatWidget goalTitle={goal.title} />

          <div className="pro-tip-card">
            <span className="pro-tip-icon" aria-hidden="true">💡</span>
            <div>
              <p className="pro-tip-label">Pro tip</p>
              <p className="pro-tip-text">
                Connect GitHub from Integrations to auto-update coding milestones.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function MilestoneRow({ milestone, onToggle }) {
  const isDone = milestone.status === "done";
  const isInProgress = milestone.status === "in_progress";

  return (
    <div className={`milestone-row ${isDone ? "milestone-row-done" : ""}`}>
      <button
        className={`milestone-checkbox ${isDone ? "checked" : ""} ${isInProgress ? "in-progress" : ""}`}
        onClick={() => onToggle(milestone)}
        aria-label={isDone ? "Mark as not done" : "Mark as done"}
      >
        {isDone && "✓"}
      </button>
      <div className="milestone-info">
        <p className={isDone ? "milestone-text-done" : ""}>{milestone.title}</p>
        {milestone.dueDate && !isDone && (
          <span className="milestone-due">
            Due{" "}
            {new Date(milestone.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      <span
        className={`milestone-status-pill ${
          isDone ? "pill-done" : isInProgress ? "pill-progress" : "pill-pending"
        }`}
      >
        {isDone ? "Done" : isInProgress ? "In progress" : "Pending"}
      </span>
    </div>
  );
}

// A small chat widget scoped to this specific goal. It uses the same
// real /chat endpoint as the main Chat page — there's no separate
// "goal chat" API — but every question sent here is prefixed with the
// goal's title so the AI's answer stays relevant to this goal
// specifically, rather than the user's whole account.
function GoalChatWidget({ goalTitle }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Ask me anything about "${goalTitle}" — progress, next steps, or ideas to move it forward.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);

    try {
      const { reply } = await sendChatMessage(`Regarding my goal "${goalTitle}": ${text}`);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Try again?" },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="goal-chat-widget">
      <div className="goal-chat-header">
        <span aria-hidden="true">🤖</span>
        <h3>Ask about this goal</h3>
      </div>
      <div className="goal-chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`goal-chat-bubble ${m.role === "user" ? "bubble-user" : "bubble-ai"}`}>
            {m.content}
          </div>
        ))}
        {isSending && <div className="goal-chat-bubble bubble-ai bubble-typing">Thinking...</div>}
        <div ref={scrollRef} />
      </div>
      <form className="goal-chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !input.trim()} aria-label="Send">
          ↑
        </button>
      </form>
    </div>
  );
}
