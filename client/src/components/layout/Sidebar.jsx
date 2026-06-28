// src/components/layout/Sidebar.jsx
//
// The left navigation rail shown on every "inside the app" screen
// (Chat, Dashboard, Integrations, Settings). Built once here so we
// don't recreate this same markup on every page — Chat needs it
// today, Dashboard will need the identical thing next.

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const GOAL_DOT_COLORS = ["#185FA5", "#1D9E75", "#EF9F27", "#534AB7", "#A32D2D"];

export default function Sidebar({ goals = [] }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">L</div>
        <span className="sidebar-logo-text">LifeOS</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/chat" className="sidebar-nav-item" data-tour="nav-chat">
          <span aria-hidden="true">💬</span>
          <span>Chat</span>
        </NavLink>
        <NavLink to="/dashboard" className="sidebar-nav-item" data-tour="nav-dashboard">
          <span aria-hidden="true">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/integrations" className="sidebar-nav-item" data-tour="nav-integrations">
          <span aria-hidden="true">🔌</span>
          <span>Integrations</span>
        </NavLink>
        <NavLink to="/settings" className="sidebar-nav-item">
          <span aria-hidden="true">⚙️</span>
          <span>Settings</span>
        </NavLink>

        {goals.length > 0 && (
          <>
            <p className="sidebar-section-label">Active Goals</p>
            <div className="sidebar-goal-list">
              {goals.slice(0, 6).map((goal, i) => (
                <NavLink
                  key={goal.goalId}
                  to={`/goals/${goal.goalId}`}
                  className="sidebar-goal-item"
                >
                  <span
                    className="sidebar-goal-dot"
                    style={{ background: GOAL_DOT_COLORS[i % GOAL_DOT_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="sidebar-goal-name">{goal.title}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : "?"}
        </div>
        <div>
          <span className="sidebar-user-name">{user?.name || "Guest"}</span>
          <span className="sidebar-user-plan">Free plan</span>
        </div>
      </div>
    </aside>
  );
}
