// src/components/layout/AuthLayout.jsx
//
// The shared shell around both Sign Up and Sign In: the logo header,
// the centered card, and (on the sign-in page) the footer. Keeping
// this in one place means both auth pages always look consistent.

import "./AuthLayout.css";

export function AuthCard({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">{children}</div>
    </div>
  );
}

export function AuthLogo() {
  return (
    <div className="auth-logo-row">
      <div className="auth-logo-mark">L</div>
      <span className="auth-logo-text">LifeOS</span>
    </div>
  );
}

export function AuthDivider({ text }) {
  return (
    <div className="auth-divider">
      <span>{text}</span>
    </div>
  );
}
