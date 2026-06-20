// src/pages/ChatPage.jsx
//
// The core LifeOS experience. Unlike the static Stitch mockup, this
// version actually:
//   - loads real past messages when the page opens
//   - sends real messages to the AI and shows the real reply
//   - shows a "thinking" state while waiting for the AI
//   - pulls real goals into the sidebar and the context panel
//   - shows the "actionsTaken" the AI reports (e.g. "Marked milestone
//     done") as the little pill chips under its reply

import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { sendChatMessage, getChatHistory, getGoals } from "../services/api";
import "./ChatPage.css";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [goals, setGoals] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef(null);

  // Load past conversation + the user's goals as soon as the page opens.
  useEffect(() => {
    Promise.all([getChatHistory(30), getGoals()])
      .then(([history, goalList]) => {
        setMessages(history);
        setGoals(goalList);
      })
      .catch(() => {
        // If history fails to load, just start with an empty chat —
        // better than blocking the whole page.
      })
      .finally(() => setIsLoadingHistory(false));
  }, []);

  // Always scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date().toISOString() }]);
    setIsSending(true);

    try {
      const { reply, actionsTaken } = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, actionsTaken, timestamp: new Date().toISOString() },
      ]);
      // Refresh goals in case the AI just created or updated one.
      getGoals().then(setGoals).catch(() => {});
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong on my end. Try sending that again.",
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const activeGoalCount = goals.filter((g) => g.status === "active").length;
  const currentGoal = goals[0]; // most relevant/recent goal, shown in the context panel

  return (
    <div className="chat-page">
      <Sidebar goals={goals} />

      <main className="chat-main">
        <header className="chat-header">
          <h1>Chat with LifeOS</h1>
          <p>
            {activeGoalCount} active goal{activeGoalCount !== 1 ? "s" : ""}
            {goals.length > 0 && " · ask anything about your progress"}
          </p>
        </header>

        <section className="chat-messages">
          {isLoadingHistory ? (
            <p className="chat-loading">Loading your conversation...</p>
          ) : messages.length === 0 ? (
            <EmptyChatState onSuggestionClick={(text) => setInput(text)} />
          ) : (
            messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
          )}

          {isSending && <TypingIndicator />}
          <div ref={scrollRef} />
        </section>

        <footer className="chat-input-footer">
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your goals..."
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Send message">
              ↑
            </button>
          </form>
        </footer>
      </main>

      <aside className="chat-context-panel">
        <h2>Context</h2>

        {currentGoal && (
          <div className="context-card">
            <div className="context-card-label">
              <span>Current goal</span>
            </div>
            <h3>{currentGoal.title}</h3>
            <div className="context-progress-bar">
              <div
                className="context-progress-fill"
                style={{ width: `${currentGoal.progressPercent || 0}%` }}
              />
            </div>
            <p className="context-progress-text">
              {currentGoal.progressPercent || 0}% complete
            </p>
          </div>
        )}

        {goals.length === 0 && !isLoadingHistory && (
          <div className="context-card context-empty">
            <p>No goals yet — tell the AI what you want to achieve to get started.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`chat-msg-row ${isUser ? "msg-user" : "msg-ai"}`}>
      <div className="chat-msg-avatar" aria-hidden="true">
        {isUser ? "U" : "🤖"}
      </div>
      <div className="chat-msg-content">
        <div className={`chat-bubble ${message.isError ? "bubble-error" : ""}`}>
          {message.content}
        </div>
        {message.actionsTaken?.length > 0 && (
          <div className="chat-action-chips">
            {message.actionsTaken.map((action, i) => (
              <span key={i} className="action-chip">
                ✓ {action}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-msg-row msg-ai">
      <div className="chat-msg-avatar" aria-hidden="true">🤖</div>
      <div className="chat-bubble typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function EmptyChatState({ onSuggestionClick }) {
  const suggestions = [
    "I want to land a software engineering internship by March",
    "Help me apply for the ALX Africa scholarship",
    "I want to launch my portfolio website in 4 weeks",
  ];

  return (
    <div className="chat-empty-state">
      <p className="empty-title">What do you want to achieve?</p>
      <p className="empty-subtitle">
        Tell LifeOS your goal and it'll build the plan, track your progress, and
        make sure you follow through.
      </p>
      <div className="empty-suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => onSuggestionClick(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
