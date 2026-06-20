// src/pages/LandingPage.jsx
//
// The public homepage. Anyone can see this without logging in.
// Converted from the Stitch HTML export into a real React component —
// same content and layout, but using our own CSS variables instead of
// Tailwind's generated utility classes, so it stays visually
// consistent with every other page in the app.

import { useNavigate } from "react-router-dom";
import Button from "../components/shared/Button";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Top navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <span className="landing-logo">LifeOS</span>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
        </div>
        <div className="landing-nav-actions">
          <Button variant="text" size="md" onClick={() => navigate("/sign-in")}>
            Sign in
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate("/sign-up")}>
            Get started free
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <header className="landing-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" aria-hidden="true">✦</span>
          <span>AI-powered goal execution</span>
        </div>

        <h1 className="hero-title">
          Your goals deserve more than a <span className="hero-title-accent">to-do list</span>
        </h1>

        <p className="hero-subtitle">
          Tell LifeOS what you want to achieve. It builds the roadmap, tracks your
          progress, and makes sure nothing falls through the cracks — across
          every app you use.
        </p>

        <div className="hero-ctas">
          <Button variant="primary" size="lg" onClick={() => navigate("/sign-up")}>
            Start for free
          </Button>
          <Button variant="ghost" size="lg">
            See how it works
          </Button>
        </div>

        <div className="hero-proof">
          <span>No credit card required</span>
          <span className="proof-dot">·</span>
          <span>Free plan available</span>
          <span className="proof-dot">·</span>
          <span>Works with your existing apps</span>
        </div>
      </header>

      {/* Chat preview card */}
      <section className="chat-preview-section">
        <div className="chat-preview">
          <div className="chat-preview-header">
            <div className="chat-preview-title">
              <span className="chat-preview-dot" aria-hidden="true" />
              <span>LifeOS</span>
            </div>
            <span className="chat-preview-status">4 active goals</span>
          </div>

          <div className="chat-preview-body">
            <div className="chat-msg chat-msg-user">
              I want to land a machine learning internship by March
            </div>

            <div className="chat-msg-row">
              <div className="chat-avatar" aria-hidden="true">L</div>
              <div className="chat-msg-group">
                <div className="chat-msg chat-msg-ai">
                  Done. I've created your goal and broken it into 6 milestones
                  across 4 months. Your first action: complete an ML
                  fundamentals course this week.
                </div>
                <div className="chat-chips">
                  <span className="chip chip-done">✓ Goal created</span>
                  <span className="chip chip-done">✓ 6 milestones set</span>
                  <button className="chip chip-action">View roadmap</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="stats-strip">
        <span className="stats-label">Built for ambitious people</span>
        <div className="stats-divider" />
        <div className="stat">
          <span className="stat-value">4</span>
          <span className="stat-label">Integrations</span>
        </div>
        <div className="stats-divider" />
        <div className="stat">
          <span className="stat-value">1</span>
          <span className="stat-label">Conversation to start</span>
        </div>
        <div className="stats-divider" />
        <div className="stat">
          <span className="stat-value">0</span>
          <span className="stat-label">Dashboards to set up</span>
        </div>
        <div className="stats-divider" />
        <div className="stat">
          <span className="stat-value">∞</span>
          <span className="stat-label">Goals you can chase</span>
        </div>
      </div>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="feature">
          <div className="feature-icon feature-icon-blue" aria-hidden="true">🧠</div>
          <h3>AI that remembers everything</h3>
          <p>
            No more re-explaining yourself. LifeOS keeps full context across
            every session, device, and conversation.
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon feature-icon-green" aria-hidden="true">🔌</div>
          <h3>Connects to your apps</h3>
          <p>
            Google Calendar, Notion, GitHub, Gmail — LifeOS reads your real
            data so it always knows what's happening.
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon feature-icon-purple" aria-hidden="true">🎯</div>
          <h3>Execution, not just advice</h3>
          <p>
            Every conversation creates real milestones, deadlines, and
            actions — not just suggestions that get forgotten.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bottom-cta">
        <h2>Ready to start executing?</h2>
        <p>Join people who stopped planning and started doing.</p>
        <Button variant="primary" size="lg" icon="→" onClick={() => navigate("/sign-up")}>
          Get started — it's free
        </Button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="landing-logo">LifeOS</span>
        <div className="footer-right">
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
          <p className="footer-copyright">© 2026 LifeOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
