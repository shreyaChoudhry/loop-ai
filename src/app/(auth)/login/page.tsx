"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoopLogo from "@/components/LoopLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setMessage("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#070814] text-white lg:grid lg:grid-cols-12 relative overflow-hidden">
      {/* BACKGROUND COSMIC LIGHT BLOOMS */}
      <div 
        className="pointer-events-none absolute -top-40 left-[20%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-30"
        style={{ background: "radial-gradient(circle, #8B2CFC 0%, #D946EF 50%, transparent 70%)" }}
      />
      <div 
        className="pointer-events-none absolute -bottom-20 right-[-10%] h-[500px] w-[500px] rounded-full blur-[150px] opacity-25"
        style={{ background: "radial-gradient(circle, #06B6D4 0%, #8B2CFC 60%, transparent 70%)" }}
      />

      {/* LEFT SECTION (HERO / VALUE PROP) */}
      <section className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-white/5">
        <div>
          <LoopLogo variant="stitch-nav" badge="v1.0" href="/" priority />
        </div>

        <div className="max-w-xl my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Feedback Intelligence & Prioritization</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
            AI that listens.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              Insights that drive
            </span>
            <br />
            better products.
          </h1>

          <p className="mt-6 text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
            Synthesize incoming feedback across Intercom, Zendesk, Discord, and public portals. Uncover duplicate trends and prioritize your roadmap with transparent mathematical evidence.
          </p>

          {/* Floating Neon Preview Card */}
          <div className="mt-10 rounded-2xl border border-purple-500/20 bg-[#0B1026]/80 p-5 backdrop-blur-xl shadow-glow-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
              <span className="font-mono text-purple-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Live Vector Clustering
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                +84% Alignment
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Automated EU VAT & Stripe Tax</span>
              <span className="font-mono text-purple-400 font-bold">185 pts</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 italic">
              &ldquo;43 manual reverse-charge invoices last quarter. Highest ARR churn risk unblocked.&rdquo;
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          IDEAS → INSIGHTS → IMPACT &bull; Built for modern product teams.
        </div>
      </section>

      {/* RIGHT SECTION (LOGIN FORM) */}
      <section className="lg:col-span-5 flex min-h-screen items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <LoopLogo variant="stitch-nav" badge="AI 2.5" href="/" priority />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1026]/90 p-8 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back 👋</h2>
            <p className="mt-1.5 text-xs text-slate-400">
              Sign in to your LOOP intelligence workspace
            </p>

            {message && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@acme.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-xs font-bold text-white shadow-glow-sm hover:shadow-glow-md hover:opacity-95 transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In to Workspace →"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
              Don&apos;t have a workspace yet?{" "}
              <Link href="/register" className="font-semibold text-purple-400 hover:text-purple-300">
                Start 14-day free trial
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}