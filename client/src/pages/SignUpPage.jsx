// src/pages/SignUpPage.jsx
//
// Lets someone create a new LifeOS account. Converted from the Stitch
// HTML into a real, working form: typing updates state, submitting
// calls the real signup endpoint, and a successful signup logs the
// person in and sends them to onboarding.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard, AuthLogo, AuthDivider } from "../components/layout/AuthLayout";
import Input from "../components/shared/Input";
import Button from "../components/shared/Button";
import { signUp } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AuthForm.css";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { token, user } = await signUp(form);
      login(token, user);
      navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard>
      <AuthLogo />

      <h1 className="auth-title">Create your account</h1>
      <p className="auth-subtitle">
        Start executing on your goals today. Free forever, no credit card needed.
      </p>

      <button type="button" className="oauth-btn">
        <GoogleIcon />
        Continue with Google
      </button>

      <AuthDivider text="or sign up with email" />

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          id="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Email address"
          id="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Min 8 characters"
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="auth-terms">
        By signing up you agree to our <a href="#terms">Terms</a> and{" "}
        <a href="#privacy">Privacy Policy</a>
      </p>

      <p className="auth-switch">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthCard>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.548 0 9s.347 2.823.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
