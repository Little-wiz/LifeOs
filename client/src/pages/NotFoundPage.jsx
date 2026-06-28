// src/pages/NotFoundPage.jsx
//
// Shown for any URL that doesn't match a real route. Sends a logged-in
// user back to their dashboard, and a logged-out visitor back to the
// landing page — rather than a dead end either way.

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/shared/Button";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const { user } = useAuth();
  const homePath = user ? "/dashboard" : "/";

  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <p className="notfound-code">404</p>
        <h1>This page doesn't exist</h1>
        <p className="notfound-text">
          The link might be broken, or the page may have moved.
        </p>
        <Link to={homePath}>
          <Button variant="primary">{user ? "Back to Dashboard" : "Back to LifeOS"}</Button>
        </Link>
      </div>
    </div>
  );
}
