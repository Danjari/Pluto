"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/home", // 👈 redirect to /home
    });

    if (res?.error) setErr(res.error);
    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Log in</h1>

      {/* Google sign-in */}
      <button
        className="w-full rounded bg-black text-white py-2"
        onClick={() => signIn("google", { callbackUrl: "/home" })} // 👈 redirect to /home
      >
        Continue with Google
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      {/* Credentials form */}
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          name="email"
          placeholder="Email"
          className="border rounded w-full px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border rounded w-full px-3 py-2"
        />
        <button className="w-full rounded border py-2" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <p className="text-sm">
        New here?{" "}
        <a href="/signup" className="underline">
          Create an account
        </a>
      </p>
    </main>
  );
}
