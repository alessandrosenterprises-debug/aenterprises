"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function PasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Choose a password with at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setSaving(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("This password link has expired. Ask AEOS support to send a new one.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#03162F] text-[#D4AF37]"><LockKeyhole className="h-5 w-5" /></span>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9A7410]">Alessandro Enterprises</p>
        <h1 className="mt-2 text-2xl font-black text-[#03162F]">{complete ? "Password updated" : "Reset your password"}</h1>
        {complete ? (
          <div className="mt-5 space-y-4"><p className="text-sm leading-6 text-slate-600">Your password is ready. Sign in with your email and new password.</p><Link href="/customer/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4" />Go to sign in</Link></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-slate-600">Choose a private password with at least 8 characters.</p>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-[#D4AF37]" /></label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-[#D4AF37]" /></label>
            {error && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving password…" : "Save password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
