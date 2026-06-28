// src/components/tour/ProductTour.jsx
//
// A guided walkthrough shown to brand-new users, similar to the
// spotlight tours in Canva or Notion. It uses react-joyride to
// highlight real elements on screen (the chat input, the sidebar nav,
// the dashboard metrics) and walks through them with Next/Back/Skip
// buttons.
//
// The tricky part: our tour needs to span two different pages (Chat
// and Dashboard), but react-joyride only knows about elements on the
// currently mounted page. So this component tracks which "phase" of
// the tour is active, and when the person reaches the last step of
// phase 1, we navigate to the next page and continue with phase 2's
// steps. From the person's point of view, it's one seamless tour.

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Joyride, STATUS } from "react-joyride";

const TOUR_SEEN_KEY = "lifeos_tour_completed";

// Phase 1 runs on the Chat page.
const CHAT_STEPS = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to LifeOS 👋",
    content:
      "Let's take a quick look around. This will only take a minute, and you can skip it anytime.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="chat-input"]',
    title: "Talk to your AI",
    content:
      "This is where it all starts. Tell LifeOS what you want to achieve in plain English — it'll build a roadmap for you automatically.",
  },
  {
    target: '[data-tour="context-panel"]',
    title: "Always-visible context",
    content:
      "Your current goal, upcoming deadlines, and connected apps stay visible here while you chat — so you never lose track of what matters.",
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: "Your goal dashboard",
    content: "Let's head over to your dashboard to see everything in one place.",
  },
];

// Phase 2 runs on the Dashboard page, after we navigate there.
const DASHBOARD_STEPS = [
  {
    target: '[data-tour="metrics"]',
    title: "Your progress, at a glance",
    content:
      "These numbers update automatically as you make progress — no manual tracking needed.",
  },
  {
    target: '[data-tour="goals-grid"]',
    title: "Every goal, broken down",
    content:
      "Each card shows your milestones and how close you are to finishing. Click any goal to see the full breakdown.",
  },
  {
    target: '[data-tour="new-goal-btn"]',
    title: "Start a new goal anytime",
    content: "This takes you back to chat, where you can describe a brand-new goal.",
  },
  {
    target: '[data-tour="nav-integrations"]',
    title: "Connect your apps",
    content:
      "Last stop — connect Google Calendar, GitHub, and more so LifeOS can see your real schedule and activity. That's the tour! 🎉",
  },
];

export default function ProductTour({ forceStart = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [phase, setPhase] = useState(null); // null | "chat" | "dashboard"
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(TOUR_SEEN_KEY) === "true";
    const shouldAutoStart = !alreadySeen || forceStart;

    // Only auto-start if no tour is currently running — otherwise,
    // navigating back to /chat mid-tour (e.g. via the sidebar) would
    // incorrectly restart phase 1 even if the person was on phase 2.
    if (shouldAutoStart && location.pathname === "/chat" && phase === null) {
      setPhase("chat");
      setStepIndex(0);
    }
  }, [forceStart, location.pathname]);

  function endTour() {
    setPhase(null);
    localStorage.setItem(TOUR_SEEN_KEY, "true");
  }

 function handleCallback(data) {
  console.log("[ProductTour FULL DEBUG]", JSON.stringify(data, null, 2));

  const { status, index, action, lifecycle, type } = data;
  console.log({
    status,
    index,
    action,
    lifecycle,
    type,
  });

  if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
    endTour();
    return;
  }

  // Phase transition: move to dashboard on last step of chat
  if (
    phase === "chat" &&
    action === "next" &&
    index === CHAT_STEPS.length - 1
  ) {
    setPhase(null);
    navigate("/dashboard");
    setTimeout(() => {
      setPhase("dashboard");
      setStepIndex(0);
    }, 250);
    return;
  }

  // Next/Prev: respond to ALL clicks, don't gate on lifecycle
  if (action === "next") {
    setStepIndex(index + 1);
  } else if (action === "prev") {
    setStepIndex(Math.max(0, index - 1));
  }
}

  if (!phase) return null;

  const steps = phase === "chat" ? CHAT_STEPS : DASHBOARD_STEPS;

  return (
    <Joyride
      steps={steps}
      stepIndex={stepIndex}
      run={true}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{ last: "Finish", skip: "Skip tour" }}
      styles={{
        options: {
          primaryColor: "#185FA5",
          textColor: "#111827",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
          overlayColor: "rgba(17, 24, 39, 0.5)",
          zIndex: 10000,
        },
        tooltip: { borderRadius: 12, padding: 20 },
        tooltipTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6 },
        tooltipContent: { fontSize: 13, lineHeight: 1.6, padding: 0 },
        buttonNext: {
          backgroundColor: "#185FA5",
          borderRadius: 8,
          fontSize: 13,
          padding: "8px 16px",
        },
        buttonBack: { color: "#6B7280", fontSize: 13 },
        buttonSkip: { color: "#6B7280", fontSize: 12 },
      }}
    />
  );
}

// Lets any page trigger the tour again manually — e.g. a "Replay
// tour" link in Settings.
export function restartTour() {
  localStorage.removeItem(TOUR_SEEN_KEY);
}
