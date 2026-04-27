"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onComplete: () => void;
}

export default function SetPasswordPrompt({ onComplete }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onComplete();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">Set your password</h2>
        <p className="text-stone-500 text-sm mb-6">
          Create a password so you can sign in quickly next time — no email link needed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoFocus
              className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              required
              className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-300 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : "Set password"}
          </button>
        </form>

        <button
          onClick={onComplete}
          className="w-full text-stone-400 hover:text-stone-600 text-sm mt-4 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}