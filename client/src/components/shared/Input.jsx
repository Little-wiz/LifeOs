// src/components/shared/Input.jsx
//
// A text input with a label above it, used across every form in the
// app (sign up, sign in, create goal, etc). Supports an optional
// error message and a "right slot" for things like a password
// show/hide button.

import "./Input.css";

export default function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rightSlot = null,
}) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`input-field ${error ? "input-field-error" : ""}`}
        />
        {rightSlot && <div className="input-right-slot">{rightSlot}</div>}
      </div>
      {error && <p className="input-error-text">{error}</p>}
    </div>
  );
}
