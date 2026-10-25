"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, LogOut, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { closeOperationsSession, getOperationsSessionContext, openOperationsSession, signInOperatorWithPin, signOutOperator } from "@/app/dashboard/operations-session-actions";

type Context = NonNullable<Awaited<ReturnType<typeof getOperationsSessionContext>>>;

export default function OperationsSessionControl({ canOpen }: { canOpen: boolean }) {
  const router = useRouter();
  const [context, setContext] = useState<Context | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [sessionAction, setSessionAction] = useState<"open" | "close" | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshContext() {
    const result = await getOperationsSessionContext();
    setContext(result);
    if (result?.token) window.sessionStorage.setItem("aeos_ops_token", result.token);
  }
  useEffect(() => { const timer = window.setTimeout(() => { void refreshContext(); }, 0); return () => window.clearTimeout(timer); }, []);

  function openSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await openOperationsSession(managerPin);
        window.sessionStorage.setItem("aeos_ops_token", result.token);
        setManagerPin(""); setSessionAction(null);
        await refreshContext();
        router.refresh();
        toast.success("Operations opened. Staff can now sign in with their PIN.");
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Operations could not be opened."); }
    });
  }

  function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await signInOperatorWithPin({ email, pin });
        window.sessionStorage.setItem("aeos_ops_token", result.token);
        setPin(""); setShowLogin(false);
        await refreshContext(); router.refresh();
        toast.success(`Signed in as ${result.profile.display_name}.`);
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Staff PIN could not be verified."); }
    });
  }

  function signOut() {
    startTransition(async () => {
      try { await signOutOperator(); setShowLogin(false); await refreshContext(); router.refresh(); toast.success("Staff session ended. Manager access restored."); }
      catch (cause) { toast.error(cause instanceof Error ? cause.message : "Staff session could not be ended."); }
    });
  }

  function closeSession() {
    startTransition(async () => {
      try {
        await closeOperationsSession(managerPin); window.sessionStorage.removeItem("aeos_ops_token"); setContext(null); setManagerPin(""); setSessionAction(null); router.refresh();
        toast.success("Operations session closed.");
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Operations session could not be closed."); }
    });
  }

  if (!canOpen && !context) return null;
  return <div className="relative">
    {!context ? canOpen ? <button type="button" onClick={() => setSessionAction(sessionAction ? null : "open")} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"><Play className="h-4 w-4" /><span className="hidden 2xl:inline">Open operations</span></button> : null : <div className="flex items-center gap-1.5">
      {context.active_operator_profile_id ? <span className="hidden max-w-40 truncate rounded-lg bg-amber-300/10 px-2 py-2 text-[11px] font-bold text-amber-100 xl:block">{context.operator_name} · {context.operator_role}</span> : <span className="hidden rounded-lg bg-emerald-300/10 px-2 py-2 text-[11px] font-bold text-emerald-100 xl:block">Manager session open</span>}
      {context.active_operator_profile_id ? <button type="button" onClick={signOut} disabled={pending} title="End staff session" aria-label="End staff session" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"><LogOut className="h-4 w-4" /></button> : <button type="button" onClick={() => setShowLogin((value) => !value)} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37] px-3 text-xs font-bold text-[#03162F] hover:bg-[#edcb4f]"><Users className="h-4 w-4" /><span className="hidden xl:inline">Staff PIN sign-in</span><span className="xl:hidden">PIN</span></button>}
      {!context.active_operator_profile_id && <button type="button" onClick={() => setSessionAction(sessionAction ? null : "close")} disabled={pending} title="Lock operations" aria-label="Lock operations" className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"><LockKeyhole className="h-4 w-4" /></button>}
    </div>}
    {sessionAction && <div className="absolute right-0 top-12 z-[150] w-[min(350px,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white p-4 text-[#03162F] shadow-2xl">
      <div className="mb-3"><h2 className="font-bold">{sessionAction === "open" ? "Open operations" : "Lock operations"}</h2><p className="text-xs text-slate-500">{sessionAction === "open" ? "Confirm your manager PIN to open the staff workstation." : "Confirm your manager PIN to lock the workstation and end staff access."}</p></div>
      <form onSubmit={sessionAction === "open" ? openSession : (event) => { event.preventDefault(); closeSession(); }} className="space-y-3">
        <label className="block text-xs font-semibold text-slate-600">Manager 4-digit PIN<input required type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4}" maxLength={4} value={managerPin} onChange={(event) => setManagerPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-center text-lg tracking-[.5em] outline-none focus:border-[#D4AF37]" /></label>
        <button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{sessionAction === "open" ? <Play className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}{pending ? "Please wait…" : sessionAction === "open" ? "Open operations" : "Lock operations"}</button>
      </form>
    </div>}
    {showLogin && context && !context.active_operator_profile_id && <div className="absolute right-0 top-12 z-[150] w-[min(350px,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white p-4 text-[#03162F] shadow-2xl">
      <div className="mb-3"><h2 className="font-bold">Staff sign-in</h2><p className="text-xs text-slate-500">Operations opened by {context.manager_name}. Use your work email and 4-digit PIN.</p></div>
      <form onSubmit={signIn} className="space-y-3">
        <label className="block text-xs font-semibold text-slate-600">Work email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#D4AF37]" /></label>
        <label className="block text-xs font-semibold text-slate-600">4-digit PIN<input required type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-center text-lg tracking-[.5em] outline-none focus:border-[#D4AF37]" /></label>
        <button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><LogIn className="h-4 w-4" />{pending ? "Signing in…" : "Open my workspace"}</button>
      </form>
    </div>}
  </div>;
}
