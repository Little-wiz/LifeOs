// src/pages/DashboardPage.jsx
//
// The goal overview screen. Every number here is computed from real
// data, not hardcoded like the Stitch mockup's "4 active goals, 11
// milestones done" — those numbers come from actually counting the
// user's real goals, milestones, and opportunities.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import GoalCard from "../components/dashboard/GoalCard";
import Button from "../components/shared/Button";
import { getGoals, getGoal, getOpportunities } from "../services/api";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const [goalList, oppList] = await Promise.all([getGoals(), getOpportunities()]);

      // The goals list endpoint doesn't include milestones, so we
      // fetch each goal's full detail (which does) in parallel.
      const goalsWithMilestones = await Promise.all(
        goalList.map((g) => getGoal(g.goalId).catch(() => g))
      );

      setGoals(goalsWithMilestones);
      setOpportunities(oppList);
    } catch (err) {
      // If something fails to load, show an empty dashboard rather
      // than a broken page.
      setGoals([]);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Real computed metrics ──────────────────────────────
  const activeGoalsCount = goals.filter((g) => g.status !== "completed").length;

  const totalMilestonesDone = goals.reduce(
    (sum, g) => sum + (g.milestones || []).filter((m) => m.status === "done").length,
    0
  );

  const deadlinesThisWeek = goals.filter((g) => {
    if (!g.targetDate) return false;
    const days = Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard-page">
      <Sidebar goals={goals} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>
              {today} · {activeGoalsCount} active goal{activeGoalsCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="ghost" icon="+" onClick={() => navigate("/chat")}>
            New goal
          </Button>
        </header>

        {isLoading ? (
          <p className="dashboard-loading">Loading your goals...</p>
        ) : goals.length === 0 ? (
          <EmptyDashboard onCreateGoal={() => navigate("/chat")} />
        ) : (
          <>
            <section className="metrics-row">
              <MetricCard label="Active goals" value={activeGoalsCount} />
              <MetricCard label="Milestones done" value={totalMilestonesDone} />
              <MetricCard label="Opportunities tracked" value={opportunities.length} />
              <MetricCard
                label="Deadlines this week"
                value={deadlinesThisWeek}
                tone={deadlinesThisWeek > 0 ? "danger" : "default"}
              />
            </section>

            <section className="goals-grid">
              {goals.map((goal) => (
                <GoalCard key={goal.goalId} goal={goal} />
              ))}
            </section>

            {opportunities.length > 0 && (
              <section className="opportunities-section">
                <div className="opportunities-header">
                  <h3>Opportunities tracked</h3>
                </div>
                <table className="opportunities-table">
                  <thead>
                    <tr>
                      <th>Opportunity name</th>
                      <th>Linked goal</th>
                      <th>Status</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp) => {
                      const linkedGoal = goals.find((g) => g.goalId === opp.goalId);
                      const days = opp.deadline
                        ? Math.ceil((new Date(opp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <tr key={opp.oppId}>
                          <td className="opp-name">{opp.name}</td>
                          <td className="opp-goal">{linkedGoal?.title || "—"}</td>
                          <td>
                            <span className={`opp-status-pill status-${opp.status}`}>
                              {opp.status}
                            </span>
                          </td>
                          <td className={days !== null && days <= 7 ? "opp-deadline-urgent" : ""}>
                            {days === null
                              ? "—"
                              : days < 0
                              ? "Overdue"
                              : days === 0
                              ? "Today"
                              : days <= 13
                              ? `${days} days`
                              : `${Math.round(days / 7)} weeks`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <h3 className={`metric-value ${tone === "danger" ? "metric-danger" : ""}`}>{value}</h3>
    </div>
  );
}

function EmptyDashboard({ onCreateGoal }) {
  return (
    <div className="dashboard-empty">
      <div className="dashboard-empty-icon" aria-hidden="true">🎯</div>
      <h2>No goals yet</h2>
      <p>
        Your dashboard lives here once you start setting goals. Create one now
        or tell the AI what you want to achieve.
      </p>
      <Button variant="primary" onClick={onCreateGoal}>
        Chat with LifeOS to get started
      </Button>
    </div>
  );
}
