"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginFailureMessageForClient } from "@/lib/login-failure-message";

export default function LoginPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (!res.ok || !body.success) {
        const msg = loginFailureMessageForClient(
          res.status,
          body.message ?? (body.errors ? Object.values(body.errors).flat().join(" ") : undefined),
        );
        toast.error(msg);
        if (res.status < 500) {
          setErrorMessage(msg);
        } else {
          setErrorMessage(null);
        }
        return;
      }
      const next = searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      window.location.assign(target);
    } catch {
      const msg = "Could not reach the server. Check your connection.";
      toast.error(msg);
      setErrorMessage(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-svh bg-[#0a0a0a] text-white">
      {busy ? (
        <section
          aria-label="Authenticating"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
        >
          <div className="flex flex-col items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="The Seer"
              className="h-20 w-20 animate-pulse opacity-80"
            />
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4a4a4a]">
              Authenticating
            </div>
          </div>
        </section>
      ) : null}

      <section className="w-full border-r border-[#1c1c1c] px-10 py-12 md:w-[420px]">
        <header className="mb-16 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Seer" className="h-9 w-9 invert" />
          <div>
            <div className="text-[16px] font-semibold tracking-[0.01em] text-white">The Seer</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a4a4a]">
              Admin Console
            </div>
          </div>
        </header>

        <h1 className="mb-2 text-[28px] font-bold leading-[1.15] tracking-[-0.03em]">
          Welcome
          <br />
          back.
        </h1>
        <p className="mb-10 text-[13px] text-[#6b6b6b]">Sign in to access the admin console.</p>

        {errorMessage ? (
          <section className="mb-5 border border-[#c0392b] bg-[#1a0a0a] px-3.5 py-2.5 text-[12px] text-[#ff6b6b]">
            {errorMessage}
          </section>
        ) : null}

        <form
          onSubmit={(e) => {
            void onSubmit(e);
          }}
        >
          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
              Email address
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
              }}
              placeholder="admin@theseer.app"
              className="w-full border border-[#2e2e2e] bg-[#111111] px-3.5 py-[11px] text-[13px] text-white outline-none transition-colors placeholder:text-[#4a4a4a] focus:border-white"
              required
            />
          </div>

          <div className="mb-[18px]">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">
              Password
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => {
                setPassword(ev.target.value);
              }}
              placeholder="••••••••"
              className="w-full border border-[#2e2e2e] bg-[#111111] px-3.5 py-[11px] text-[13px] text-white outline-none transition-colors placeholder:text-[#4a4a4a] focus:border-white"
              required
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked);
              }}
              className="h-[14px] w-[14px] cursor-pointer accent-white"
            />
            <label htmlFor="remember" className="cursor-pointer text-[12px] text-[#6b6b6b]">
              Keep me signed in
            </label>
          </div>

          <Button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="h-auto w-full rounded-none bg-white px-3 py-3 text-[13px] font-semibold tracking-[0.02em] text-[#0a0a0a] hover:bg-[#e0e0e0]"
          >
            <span className="inline-flex items-center justify-center gap-2">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </span>
          </Button>
        </form>

        <footer className="mt-8 text-[11px] text-[#2e2e2e]">
          Restricted access — authorized personnel only.
        </footer>
      </section>

      <aside className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[#111111] p-12 md:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          className="absolute bottom-[60px] right-[60px] h-[120px] w-[120px] opacity-[0.15] invert"
        />

        <div className="relative z-10 max-w-[380px] text-center">
          <h2 className="mb-4 text-[26px] font-bold leading-[1.3] tracking-[-0.03em] text-white/85">
            Platform intelligence at a glance.
          </h2>
          <p className="text-[13px] leading-[1.7] text-[#4a4a4a]">
            Monitor users, threat alerts, conversations, and notifications across the entire platform in real time.
          </p>
        </div>
      </aside>
    </main>
  );
}
