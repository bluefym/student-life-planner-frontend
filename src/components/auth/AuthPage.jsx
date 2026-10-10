import "./AuthPage.css";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const registering = mode === "register";

      const payload = registering
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const { data } = await api.post(
        registering
          ? "/api/auth/register"
          : "/api/auth/login",
        payload
      );

      localStorage.setItem("studentlife_token", data.token);
      localStorage.setItem(
        "studentlife_user",
        JSON.stringify(data.user)
      );

      onAuthenticated({
        token: data.token,
        user: data.user,
      });
    } catch (err) {
      const status = err.response?.status;
      const body = err.response?.data;

      setError(
        body?.message ||
          body?.detail ||
          body?.error ||
          (status === 401
            ? "Email or password is incorrect."
            : status === 409
              ? "An account with this email already exists."
              : "Unable to connect. Check that the backend is running on port 6500.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-showcase">
        <div className="auth-brand">
          <span className="brand-symbol">
            <Sparkles size={20} />
          </span>
          <span>dayform</span>
        </div>

        <div className="auth-message">
          <span className="eyebrow">
            <span className="live-dot" />
            YOUR LIFE, IN BETTER BALANCE
          </span>

          <h1>
            Make space for
            <br />
            <em>what matters.</em>
          </h1>

          <p>
            A calmer way to organize your money, habits,
            tasks, and thoughts — all in one place.
          </p>

          <div className="auth-benefits">
            <span><b>01</b> Build routines that last</span>
            <span><b>02</b> See where your money goes</span>
            <span><b>03</b> Make your next step clearer</span>
          </div>
        </div>

        <div className="auth-bottom-note">
          A little progress adds up.
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="brand-symbol">
              <Sparkles size={18} />
            </span>
            dayform
          </div>

          <div className="auth-heading">
            <span className="eyebrow">
              {mode === "login" ? "WELCOME BACK" : "A FRESH START"}
            </span>

            <h2>
              {mode === "login"
                ? "Good to see you."
                : "Create your space."}
            </h2>

            <p>
              {mode === "login"
                ? "Sign in to pick up where you left off."
                : "A few details, then you're ready to go."}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>

            <label>
              Password
              <span className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              disabled={loading}
              type="submit"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            {mode === "login"
              ? "New to dayform?"
              : "Already have an account?"}

            <button
              onClick={() => {
                setMode(
                  mode === "login" ? "register" : "login"
                );
                setError("");
              }}
            >
              {mode === "login"
                ? "Create an account"
                : "Sign in"}
            </button>
          </p>

          <p className="auth-privacy">
            Your personal space. Your data.
          </p>
        </div>
      </section>
    </main>
  );
}
