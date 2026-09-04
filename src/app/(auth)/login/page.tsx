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
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold">LOOP</h1>
          <p className="mt-3 text-xl text-gray-600">
            Welcome back
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border rounded-2xl p-8"
        >
          <div className="mb-6">
            <label className="block mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-lg p-3"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && (
            <p className="text-center mt-4">
              {message}
            </p>
          )}

          <p className="text-center mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}