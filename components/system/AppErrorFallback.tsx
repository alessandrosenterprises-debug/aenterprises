"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Headphones, RefreshCw } from "lucide-react";

export default function AppErrorFallback({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    void fetch("/api/monitoring/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: pathname || "/unknown", message: error.message || "Page failed to load.", digest: error.digest }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error.digest, error.message, pathname]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle className="h-6 w-6" /></span>
        <h1 className="mt-4 text-xl font-bold text-[#03162F]">We couldn’t load this page</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your account and information are safe. Try loading the page again, or contact support so we can help.</p>
        {error.digest && <p className="mt-3 text-xs text-slate-400">Support reference: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white hover:bg-[#0A2852]"><RefreshCw className="h-4 w-4" />Try again</button>
          <a href="/customer/support" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#03162F] hover:bg-slate-50"><Headphones className="h-4 w-4" />Contact support</a>
        </div>
      </section>
    </main>
  );
}
