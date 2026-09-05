"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
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
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[58%_42%]">
      {/* LEFT SECTION */}
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

          {/* CONTENT */}
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight">
              Turn feedback
              <br />
              into better
              <br />
              <span className="text-[#6655e8]">products.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-gray-600">
              Join LOOP and transform customer feedback into insights,
              trends and product decisions.
            </p>

            {/* VISUAL */}
            <div className="relative mt-10 h-80">
              <div className="absolute left-1/2 top-6 flex h-56 w-56 -translate-x-1/2 items-center justify-center rounded-[45px] border border-white/80 bg-white/30 shadow-2xl backdrop-blur">
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#8d7cf4] to-[#5948d9] text-6xl shadow-xl">
                  ✨
                </div>
              </div>

              <div className="absolute left-2 top-28 rounded-xl border border-white/80 bg-white/70 p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-semibold">Customer Voice</p>
                <p className="mt-2 text-xs text-gray-500">
                  "Easy to use!"
                </p>
              </div>

              <div className="absolute right-0 top-24 rounded-xl border border-white/80 bg-white/70 p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-semibold">AI Insight</p>
                <p className="mt-2 text-xs text-gray-500">
                  Positive sentiment ↑
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            AI-powered customer feedback intelligence.
          </p>
        </div>
      </section>

      {/* RIGHT REGISTER */}
      <section className="flex min-h-screen items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* MOBILE LOGO */}
          <div className="mb-10 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6655e8] text-white">
              ◉
            </div>

            <span className="text-2xl font-bold">LOOP</span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100">
            <h2 className="text-2xl font-bold">Create your account</h2>

            <p className="mt-2 text-sm text-gray-500">
              Start turning customer feedback into decisions.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6655e8] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* EMAIL */}
              <div className="mt-5">
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
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#6655e8] focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-[#6655e8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-[#5847d8] disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              {/* ERROR */}
              {message && (
                <p className="mt-4 text-center text-sm text-red-500">
                  {message}
                </p>
              )}
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#6655e8] hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}