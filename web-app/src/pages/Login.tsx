import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function Login({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignup) {
        await signup(orgName.trim(), name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/"); // land on the dashboard after auth
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (isSignup && /409/.test(msg)) setError("An account with this email already exists.");
      else if (isSignup) setError("Could not create your account. Check your details.");
      else setError("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-sm text-gray-500 hover:text-gray-800">
          ← Back to home
        </Link>
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Southern Roots Turf</h1>
          <p className="text-sm text-gray-500">
            {isSignup ? "Start your 14-day free trial" : "Owner Dashboard"}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {isSignup && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Company name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={inputCls}
                  placeholder="Acme Lawn Care"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Jane Owner"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@email.com"
              autoFocus={!isSignup}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "New to Southern Roots?"}{" "}
          <button
            onClick={() => {
              setMode(isSignup ? "login" : "signup");
              setError(null);
            }}
            className="font-medium text-green-700 hover:underline"
          >
            {isSignup ? "Sign in" : "Start a free trial"}
          </button>
        </p>
      </div>
    </div>
  );
}
