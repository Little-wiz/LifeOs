// src/components/shared/Button.jsx
//
// A single button component used everywhere in the app, so every
// button looks and behaves the same way. Pass a `variant` to change
// its style: "primary" (solid blue), "ghost" (outlined), or "text"
// (no border, just colored text).

import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon = null,
  iconPosition = "right",
  onClick,
  type = "button",
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full" : ""}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {icon && iconPosition === "left" && <span className="btn-icon">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="btn-icon">{icon}</span>}
    </button>
  );
}
