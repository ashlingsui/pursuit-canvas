import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Groundwork Recruiting Pipeline Tracker" },
      {
        name: "description",
        content:
          "Sign in to Groundwork to track recruiting contacts and job applications through every stage of your search.",
      },
      { property: "og:title", content: "Groundwork — Recruiting Pipeline Tracker" },
      {
        property: "og:description",
        content: "A calm, personal board for the people and the applications in your job search.",
      },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "w-full rounded-lg border border-border/70 bg-card px-3 py-2.5 text-[0.9rem] text-foreground outline-none focus:border-ring";
const labelClass =
  "text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate({ to: "/contacts", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/contacts", replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (err) return setError(err.message);
      if (!data.session) {
        return setMessage("Check your email to confirm your account, then come back and sign in.");
      }
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message);
  }

  async function google() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setError("Google sign-in didn't work. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/contacts", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[26rem]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
          The search, week by week
        </p>
        <h1 className="mt-1.5 font-display text-[2.4rem] font-semibold leading-none tracking-tight text-foreground">
          Groundwork
        </h1>
        <p className="mt-3 text-[0.92rem] leading-relaxed text-muted-foreground">
          A recruiting pipeline tracker for the people you talk to and the roles you chase. Sign in
          and your boards are waiting.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 rounded-3xl border border-border/70 bg-card p-7 shadow-[var(--shadow-lift)]"
        >
          <div className="grid gap-3.5">
            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="mt-3 text-[0.8rem] text-destructive">{error}</p>}
          {message && <p className="mt-3 text-[0.8rem] text-muted-foreground">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.85rem] font-semibold text-primary-foreground transition-transform hover:-translate-y-[1px] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-2.5 w-full rounded-full border border-border px-5 py-2.5 text-[0.85rem] font-semibold text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-60"
          >
            Continue with Google
          </button>

          <p className="mt-5 text-center text-[0.8rem] text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
                setMessage(null);
              }}
              className="font-semibold text-foreground underline decoration-border underline-offset-4"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
