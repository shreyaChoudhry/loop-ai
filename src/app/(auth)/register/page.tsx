"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoopLogo from "@/components/LoopLogo";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          workspaceName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setMessage("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#070814] text-white lg:grid lg:grid-cols-12 relative overflow-hidden">
      {/* BACKGROUND COSMIC LIGHT BLOOMS */}
      <div 
        className="pointer-events-none absolute -top-40 right-[-10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-35"
        style={{ background: "radial-gradient(circle, #A855F7 0%, #D946EF 50%, transparent 70%)" }}
      />
      <div 
        className="pointer-events-none absolute -bottom-20 left-[10%] h-[500px] w-[500px] rounded-full blur-[150px] opacity-25"
        style={{ background: "radial-gradient(circle, #8B2CFC 0%, #3B82F6 60%, transparent 70%)" }}
      />

      {/* LEFT SECTION (HERO / VALUE PROP) */}
      <section className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-white/5">
        <div>
          <LoopLogo variant="stitch-nav" badge="v1.0" href="/" priority />
        </div>

        <div className="max-w-xl my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md mb-6">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Start 14-Day Free Trial • No Credit Card</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
            Turn customer feedback into
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              defensible product decisions.
            </span>
          </h1>

          <p className="mt-6 text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
            Create your high-performance workspace in seconds. Analyze thousands of customer comments with AI, eliminate duplicate noise, and prioritize what to build next.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-xl font-black text-purple-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Workspace Isolation & Security</div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-xl font-black text-cyan-400">Multi-Channel</div>
              <div className="text-xs text-slate-400 mt-1">Intercom, Discord, Portal & CSV</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          IDEAS → INSIGHTS → IMPACT &bull; Built for modern product teams.
        </div>
      </section>

      {/* RIGHT SECTION (REGISTER FORM) */}
      <section className="lg:col-span-5 flex min-h-screen items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <LoopLogo variant="stitch-nav" badge="AI 2.5" href="/" priority />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1026]/90 p-8 shadow-2xl backdrop-blur-2xl">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your workspace</h2>
            <p className="mt-1.5 text-xs text-slate-400">
              Get started with LOOP in less than 2 minutes
            </p>

            {message && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme SaaS"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Email
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
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
                {loading ? "Creating Workspace..." : "Create Workspace →"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}