"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function CustomerErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the server-provided reference for diagnostics; never render it to customers.
    console.error("Customer page failed to load.", error.digest ?? "No reference available");
  }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4 py-10 text-[#03162F]">
      <section role="alert" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><AlertCircle className="h-7 w-7" /></div>
        <h1 className="mt-5 text-xl font-black">We couldn’t open this page</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Please check your connection and try again. Your account and saved information are safe.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Try again</button>
          <Link href="/customer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#03162F]"><Home className="h-4 w-4" />Customer home</Link>
        </div>
      </section>
    </main>
  );
}
