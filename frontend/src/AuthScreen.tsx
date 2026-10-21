
import { useState, type FormEvent } from "react";
import { Code2, LoaderCircle, ShieldCheck } from "lucide-react";
import { api, type AuthInput, type User } from "./api";

type Props = {
  onAuthenticated: (user: User) => void;
};

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: AuthInput = {
        email: email.trim().toLowerCase(),
        password,
      };

      const user = await api<User>(
        mode === "login" ? "/auth/login" : "/auth/register",
        {
          method: "POST",
          body: data,
        },
      );

      onAuthenticated(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";

      if (message.includes("409")) {
        setError("Аккаунт с таким email уже существует.");
      } else if (message.includes("401")) {
        setError("Неверный email или пароль.");
      } else if (message.includes("422")) {
        setError(
          mode === "register"
            ? "Проверь email и пароль. Пароль должен содержать не менее 12 символов."
            : "Проверь правильность введённых данных.",
        );
      } else {
        setError(message || "Не удалось подключиться к серверу.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark"><Code2 size={23} /></span>
          <span>task<span className="brand-accent">flow</span></span>
        </div>

        <div className="auth-eyebrow">
          <span className="status-dot" />
          SECURE WORKSPACE
        </div>

        <h1>{mode === "login" ? "Welcome back." : "Create account."}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to continue to your workspace."
            : "Create your account and organize your workflow."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            maxLength={320}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 12 : 1}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              mode === "register" ? "At least 12 characters" : "Your password"
            }
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button className="primary-button auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <ShieldCheck size={17} />
            )}
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="auth-security">
          <ShieldCheck size={15} />
          Protected session · Secure password hashing
        </p>
      </section>
    </main>
  );
}
