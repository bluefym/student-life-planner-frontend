
import { useState } from "react";
import { ArrowRight, Check, Command, Eye, EyeOff, Sparkles } from "lucide-react";
import api from "@/lib/api";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (isRegister && password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/api/auth/register"
        : "/api/auth/login";

      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await api.post(endpoint, payload);
      const session = response.data;

      if (!session?.token || !session?.user) {
        throw new Error("The server returned an invalid authentication response.");
      }

      localStorage.setItem("studentlife_token", session.token);
      localStorage.setItem("studentlife_user", JSON.stringify(session.user));

      onAuthenticated(session);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const validationMessage = err.response?.data?.errors;

      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : Array.isArray(validationMessage)
            ? validationMessage.map((item) => item.defaultMessage || item.message).filter(Boolean).join(" ")
            : isRegister
              ? "Could not create your account. Check your details and try again."
              : "Login failed. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="auth-brand">
        <div className="auth-brand-mark"><Command size={22} /></div>
        <span>dayform</span>
      </div>

      <section className="auth-layout">
        <div className="auth-story">
          <div className="auth-eyebrow"><Sparkles size={14} /> A SPACE THAT'S YOURS</div>
          <h1>A more intentional life starts with <span>one small step.</span></h1>
          <p>
            Bring your plans, habits, notes, and finances together.
            Make space for the things that matter to you.
          </p>

          <div className="auth-benefits">
            {[
              "Make your daily priorities clearer",
              "Build habits that actually stick",
              "Understand your money and time",
            ].map((benefit) => (
              <div key={benefit}><span><Check size={13} /></span>{benefit}</div>
            ))}
          </div>

          <div className="auth-quote">
            <div className="quote-dots"><i /><i /><i /></div>
            <p>“You don't need a perfect plan. You need a place to begin.”</p>
            <span>YOUR PERSONAL SPACE</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="auth-card-icon"><Command size={19} /></div>
            <div className="auth-eyebrow">WELCOME TO DAYFORM</div>
            <h2>{isRegister ? "Create your account" : "Welcome back."}</h2>
            <p>
              {isRegister
                ? "Set up your personal space in a few steps."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isRegister ? "auth-tab-active" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isRegister ? "auth-tab-active" : ""}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                <span>Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <div className="auth-password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={isRegister ? 8 : undefined}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isRegister
                  ? "Create your account"
                  : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-security">
            <span><Check size={13} /></span>
            Your account is protected by secure authentication.
          </div>
        </div>
      </section>

      <footer className="auth-footer">
        <span>DAYFORM © {new Date().getFullYear()}</span>
        <span>Make time for you.</span>
      </footer>
    </main>
  );
}
