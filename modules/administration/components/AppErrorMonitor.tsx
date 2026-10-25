"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { resolveAppError } from "@/app/dashboard/administration/monitoring/actions";
import type { AppErrorReport } from "@/modules/administration/services/app-monitoring.service";

export default function AppErrorMonitor({ reports }: { reports: AppErrorReport[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function resolve(id: string) {
    startTransition(async () => {
      try {
        await resolveAppError(id);
        toast.success("Issue marked as resolved.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update the issue.");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div><h2 className="font-bold text-[#03162F]">Recent app errors</h2><p className="mt-1 text-xs text-slate-500">Customer and staff page errors reported from the app.</p></div>
        <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Reported</th><th className="px-5 py-3">App / user</th><th className="px-5 py-3">Page</th><th className="px-5 py-3">Issue</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => <tr key={report.id} className="align-top hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</td>
              <td className="px-5 py-4"><p className="capitalize text-slate-700">{report.source}</p><p className="mt-1 text-xs font-semibold text-slate-800">{report.reporterName ?? "Account unavailable"}</p>{report.reporterContact && <p className="mt-0.5 text-xs text-slate-500">{report.reporterContact}</p>}</td>
              <td className="max-w-[180px] break-all px-5 py-4 font-mono text-xs text-slate-600">{report.route}</td>
              <td className="max-w-[420px] px-5 py-4"><p className="break-words text-slate-800">{report.message}</p>{report.digest && <p className="mt-1 text-xs text-slate-400">Reference: {report.digest}</p>}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${report.status === "Open" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{report.status}</span></td>
              <td className="px-5 py-4">{report.status === "Open" && <button type="button" disabled={pending} onClick={() => resolve(report.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#03162F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0A2852] disabled:opacity-50"><Check className="h-3.5 w-3.5" />Resolve</button>}</td>
            </tr>)}
            {reports.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No app errors have been reported.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
