// src/components/dashboard/GoalCard.jsx
//
// A single goal's card on the dashboard — title, category, status,
// progress bar, and its first few milestones with real checkboxes.
// Takes a goal object that already includes its milestones array
// (the Dashboard page fetches this via getGoal() for each goal).

import { Link } from "react-router-dom";
import "./GoalCard.css";

const CATEGORY_COLORS = {
  Career: "#185FA5",
  Education: "#534AB7",
  Project: "#1D9E75",
  Scholarship: "#534AB7",
  Health: "#EF9F27",
  Other: "#6B7280",
};

function getDeadlineLabel(targetDate) {
  if (!targetDate) return null;
  const days = Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: "Overdue", urgent: true };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days <= 7) return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, urgent: true };
  if (days <= 30) return { text: `Due in ${Math.round(days / 7)} weeks`, urgent: false };
  return {
    text: `Target: ${new Date(targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    urgent: false,
  };
}

function getStatusLabel(goal) {
  const deadline = getDeadlineLabel(goal.targetDate);
  if (goal.status === "completed") return { text: "Completed", tone: "done" };
  if (deadline?.urgent) return { text: "Deadline soon", tone: "urgent" };
  if (goal.progressPercent >= 50) return { text: "On track", tone: "good" };
  return { text: "Active", tone: "neutral" };
}

export default function GoalCard({ goal }) {
  const color = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Other;
  const deadline = getDeadlineLabel(goal.targetDate);
  const statusLabel = getStatusLabel(goal);
  const milestones = goal.milestones || [];
  const visibleMilestones = milestones.slice(0, 4);

  return (
    <Link
      to={`/goals/${goal.goalId}`}
      className={`goal-card ${statusLabel.tone === "urgent" ? "goal-card-urgent" : ""}`}
      style={{ "--goal-color": color }}
    >
      <div className="goal-card-head">
        <div className="goal-tags">
          <span className="goal-tag" style={{ background: `${color}1A`, color }}>
            {goal.category}
          </span>
          <span className={`goal-status-pill status-${statusLabel.tone}`}>
            {statusLabel.text}
          </span>
        </div>
      </div>

      <h4 className="goal-title">{goal.title}</h4>

      <div className="goal-progress-bar">
        <div
          className="goal-progress-fill"
          style={{ width: `${goal.progressPercent || 0}%`, background: color }}
        />
      </div>

      <div className="goal-progress-meta">
        <span>{goal.progressPercent || 0}% complete</span>
        {deadline && <span className={deadline.urgent ? "deadline-urgent" : ""}>{deadline.text}</span>}
      </div>

      {visibleMilestones.length > 0 && (
        <ul className="goal-milestone-list">
          {visibleMilestones.map((m) => (
            <li key={m.milestoneId} className={m.status === "done" ? "milestone-done" : ""}>
              <span className="milestone-checkbox" style={{ "--goal-color": color }}>
                {m.status === "done" && "✓"}
              </span>
              <span className="milestone-title">{m.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
