"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone, UserRound } from "lucide-react";

export default function CustomerAccountCompletionForm({ firstName: initialFirstName, lastName: initialLastName, email, phone: initialPhone, next }: { firstName: string; lastName: string; email: string; phone: string; next: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/customer/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, phone }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error || "Your customer account could not be completed."); return; }
      router.replace(next);
      router.refresh();
    } catch {
      setError("We couldn’t complete your account. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
    <p className="text-xs font-black uppercase tracking-[.18em] text-[#9A7412]">Customer account</p>
    <h1 className="mt-2 text-2xl font-black text-[#0B132B]">Complete your AEOS account</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Add a few details to continue with your order or service. Your Google sign-in stays connected.</p>
    <form className="mt-7 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">First name<div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input required maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></div></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">Last name<input required maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">Google email<input readOnly value={email} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-600" /></label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">Phone number<div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input required type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+260 ..." className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm font-normal text-slate-900 outline-none focus:border-[#D4AF37]" /></div></label>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
      <button type="submit" disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0B132B] px-5 text-sm font-bold text-white transition hover:bg-[#18345b] disabled:opacity-60 sm:col-span-2">{saving ? "Saving your details…" : "Continue"}<ArrowRight className="size-4" /></button>
    </form>
    <p className="mt-4 text-xs leading-5 text-slate-500">Your customer profile is created when you choose to use an AEOS order or service.</p>
  </section>;
}
