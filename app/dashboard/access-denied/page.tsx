import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F2DF] text-[#8B6A0B]"><ShieldAlert className="h-7 w-7" /></span>
        <h1 className="mt-5 text-2xl font-bold text-[#03162F]">Access not available</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your current staff role does not include permission to open this area. Contact an enterprise administrator if you need access.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-[#03162F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0A2852]">Return to dashboard</Link>
      </section>
    </main>
  );
}
