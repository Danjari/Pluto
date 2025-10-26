"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to sign up");

      // auto login via credentials
      const si = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (si?.error) throw new Error(si.error);

      router.replace("/"); // go to main page after login
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create your account</h1>

      <button
        className="w-full rounded bg-black text-white py-2"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        Continue with Google
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <input name="name" placeholder="Name (optional)" className="border rounded w-full px-3 py-2" />
        <input name="email" placeholder="Email" className="border rounded w-full px-3 py-2" />
        <input name="password" type="password" placeholder="Password" className="border rounded w-full px-3 py-2" />
        <button className="w-full rounded border py-2" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <p className="text-sm">
        Already have an account?{" "}
        <a href="/signin" className="underline">Log in</a>
      </p>
    </main>
  );
}
