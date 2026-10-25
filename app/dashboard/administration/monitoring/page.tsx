import { Activity, AlertTriangle, CheckCircle2, Database } from "lucide-react";
import AppErrorMonitor from "@/modules/administration/components/AppErrorMonitor";
import { getAppMonitoringData } from "@/modules/administration/services/app-monitoring.service";

export default async function AppMonitoringPage() {
  const data = await getAppMonitoringData();
  const openCount = data.reports.filter((report) => report.status === "Open").length;

  return <main className="mx-auto w-full max-w-[1800px] space-y-6">
    <header className="rounded-2xl bg-[#03162F] p-6 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Support & reliability</p>
      <h1 className="mt-2 text-3xl font-bold">App health & errors</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">Check service availability and review page errors reported by customers and staff to help resolve support requests.</p>
    </header>

    <section className="grid gap-4 sm:grid-cols-3">
      <HealthCard title="Database connection" value={data.databaseOnline ? "Connected" : "Unavailable"} detail={data.databaseOnline ? `${data.businessCount} business records reachable` : "Could not reach the database"} good={data.databaseOnline} icon={Database} />
      <HealthCard title="Error monitoring" value={data.errorsConfigured ? "Recording reports" : "Setup required"} detail={data.errorsConfigured ? "Customer and staff app errors are being collected" : "Apply database migration 036 to enable issue tracking"} good={data.errorsConfigured} icon={Activity} />
      <HealthCard title="Open issues" value={String(openCount)} detail={`${data.reports.length} recent reports available`} good={openCount === 0} icon={AlertTriangle} />
    </section>

    {!data.errorsConfigured && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{data.errorMessage ? "The error report table is not available. Apply migration 036_app_error_monitoring.sql in Supabase, then refresh this page." : "Error monitoring has not been configured."}</div>}
    <AppErrorMonitor reports={data.reports} />
  </main>;
}

function HealthCard({ title, value, detail, good, icon: Icon }: { title: string; value: string; detail: string; good: boolean; icon: typeof Activity }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{title}</p><p className="mt-2 text-xl font-bold text-[#03162F]">{value}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${good ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{good ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span></div>
    <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
  </article>;
}
