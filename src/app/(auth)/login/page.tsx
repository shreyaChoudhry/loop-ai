"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[58%_42%]">
      {/* LEFT AI SECTION */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#ddd6ff] via-[#eeeaff] to-[#c9c1ff] lg:flex">
        <div className="absolute inset-0">
          <div className="absolute left-[-120px] top-20 h-96 w-96 rounded-full bg-white/50 blur-3xl" />
          <div className="absolute bottom-[-100px] right-[-80px] h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        </div>

        <div className="relative flex w-full flex-col justify-between p-16">
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6655e8] text-white">
              ◉
            </div>

            <span className="text-2xl font-bold">LOOP</span>
          </div>

          {/* TEXT */}
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight text-[#111827]">
              AI that listens.
              <br />
              Insights that drive
              <br />
              better products.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-gray-600">
              Unified customer feedback. AI-powered analysis. Actionable
              product insights.
            </p>

            {/* AI VISUAL */}
            <div className="relative mt-10 h-80">
              {/* brain */}
              <div className="absolute left-1/2 top-8 flex h-52 w-52 -translate-x-1/2 items-center justify-center rounded-[40px] border border-white/70 bg-white/30 shadow-2xl backdrop-blur">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#8d7cf4] to-[#5948d9] text-6xl shadow-xl">
                  🧠
                </div>
              </div>

              {/* review card */}
              <div className="absolute left-0 top-24 rounded-xl border border-white/80 bg-white/70 p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-semibold">Review</p>
                <div className="mt-2 text-yellow-500">★★★★★</div>
              </div>

              {/* survey */}
              <div className="absolute bottom-2 left-8 rounded-xl border border-white/80 bg-white/70 p-4 shadow-lg backdrop-blur">
                <p className="text-xs text-gray-500">Survey Response</p>
                <p className="mt-1 text-sm font-semibold">Great product!</p>
              </div>

              {/* support */}
              <div className="absolute right-0 top-28 rounded-xl border border-white/80 bg-white/70 p-4 shadow-lg backdrop-blur">
                <p className="text-xs text-gray-500">Support Ticket</p>
                <p className="mt-1 text-sm font-semibold">Issue resolved</p>
              </div>

              {/* magnifier */}
              <div className="absolute bottom-0 right-16 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-white/30 text-4xl">
                🔍
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Turn feedback into decisions with LOOP.
          </p>
        </div>
      </section>

      {/* RIGHT LOGIN */}
      <section className="flex min-h-screen items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6655e8] text-white">
              ◉
            </div>
            <span className="text-2xl font-bold">LOOP</span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100">
            <h2 className="text-2xl font-bold">Welcome back 👋</h2>

            <p className="mt-2 text-sm text-gray-500">
              Login to your workspace
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6655e8] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* PASSWORD */}
              <div className="mt-5">
                <div className="mb-2 flex justify-between">
                  <label className="text-sm font-medium">Password</label>

                  <button
                    type="button"
                    className="text-xs font-medium text-[#6655e8]"
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6655e8] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* REMEMBER */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 accent-[#6655e8]"
                />

                <label
                  htmlFor="remember"
                  className="text-xs text-gray-600"
                >
                  Remember me
                </label>
              </div>

              {/* LOGIN */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-[#6655e8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-[#5847d8] disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              {/* ERROR */}
              {message && (
                <p className="mt-4 text-center text-sm text-red-500">
                  {message}
                </p>
              )}

              {/* DIVIDER */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* GOOGLE LOOKING BUTTON */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <span className="font-bold text-red-500">G</span>
                Continue with Google
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#6655e8] hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}