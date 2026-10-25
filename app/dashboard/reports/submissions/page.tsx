"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, Send, RefreshCw, ShieldCheck, Clock3, CheckCircle2, RotateCcw } from "lucide-react";
import { getDepartmentReportWorkspace, reviewDepartmentReport, submitDepartmentReport } from "./actions";

type Workspace = Awaited<ReturnType<typeof getDepartmentReportWorkspace>>;
type Report = Workspace["reports"][number];
const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-amber-100";
const statusStyle: Record<string, string> = {
  Submitted: "bg-blue-50 text-blue-700", "In review": "bg-amber-50 text-amber-800",
  Returned: "bg-rose-50 text-rose-700", Resolved: "bg-emerald-50 text-emerald-700",
};

function relationName(value: { name?: string | null; display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) {
  return value?.name || value?.display_name || [value?.first_name, value?.last_name].filter(Boolean).join(" ") || value?.email || "Staff member";
}
function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
type Flatten<T> = T extends (infer Item)[] ? Item : T;

export default function DepartmentReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"mine" | "inbox">("mine");
  const [inboxDepartment, setInboxDepartment] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [reportType, setReportType] = useState("General");
  const [priority, setPriority] = useState("Normal");
  const [concernedPerson, setConcernedPerson] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setError("");
    try { const result = await getDepartmentReportWorkspace(); setData(result); setDepartmentId((current) => current || result.departments[0]?.id || ""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Department reports could not be loaded."); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  const visibleReports = useMemo(() => (data?.reports ?? []).filter((report) => view === "inbox" ? data?.canReview && (!inboxDepartment || report.department_id === inboxDepartment) : report.reporter_profile_id === data?.profileId), [data, inboxDepartment, view]);
  const counts = useMemo(() => ({ open: visibleReports.filter((report) => report.status === "Submitted" || report.status === "In review").length, urgent: visibleReports.filter((report) => report.priority === "Urgent" && report.status !== "Resolved").length, resolved: visibleReports.filter((report) => report.status === "Resolved").length }), [visibleReports]);

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try { await action(); toast.success(success); await load(); router.refresh(); }
      catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to save this change."); }
    });
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await submitDepartmentReport({ departmentId, concernedPerson, reportType, priority, title, details });
        toast.success("Report submitted to the selected department.");
        setTitle(""); setDetails(""); setConcernedPerson(""); setPriority("Normal"); setReportType("General");
        await load(); router.refresh();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to submit this report."); }
    });
  };

  return <main className="mx-auto w-full max-w-[1600px] space-y-5 px-3 pb-10 sm:px-5 lg:px-7">
    <header className="sticky top-0 z-20 -mx-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-[#f5f7fa]/95 px-3 py-4 backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#03162F] text-[#E1BB32]"><ClipboardList className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#B08B19]">Enterprise workflow</p><h1 className="text-xl font-extrabold text-[#03162F]">Department reports</h1><p className="text-xs text-slate-500">Send an incident, concern or update to the department responsible.</p></div></div>
      <button onClick={() => { void load(); }} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
    </header>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      <Metric label="Open items" value={counts.open} icon={Clock3} tone="text-blue-700 bg-blue-50" />
      <Metric label="Urgent attention" value={counts.urgent} icon={ShieldCheck} tone="text-rose-700 bg-rose-50" />
      <Metric label="Resolved" value={counts.resolved} icon={CheckCircle2} tone="text-emerald-700 bg-emerald-50" />
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(310px,390px)_1fr]">
      {data?.canSubmit && <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B08B19]">New submission</p><h2 className="mt-1 text-lg font-bold text-[#03162F]">Send a report</h2><p className="mt-1 text-xs leading-5 text-slate-500">Choose who should handle it. Add a person’s name when the report concerns someone specific.</p></div>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Responsible department<select required className={field} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">Select department</option>{(data?.departments ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Report type<select className={field} value={reportType} onChange={(event) => setReportType(event.target.value)}>{["General", "Incident", "Customer concern", "Staff matter", "Finance", "Operations", "Safety", "Suggestion"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Priority<select className={field} value={priority} onChange={(event) => setPriority(event.target.value)}>{["Low", "Normal", "High", "Urgent"].map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Person concerned <span className="font-normal text-slate-400">(optional)</span><input className={field} value={concernedPerson} onChange={(event) => setConcernedPerson(event.target.value)} placeholder="Staff member or customer" maxLength={160} /></label>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Title<input required minLength={4} maxLength={160} className={field} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Short, clear summary" /></label>
        <label className="block space-y-1.5 text-xs font-semibold text-slate-700">Details<textarea required minLength={10} maxLength={8000} rows={5} className={`${field} resize-y`} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What happened, when, and what action is needed?" /></label>
        <button disabled={isPending || !departmentId} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />Submit report</button>
      </form>}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div><h2 className="font-bold text-[#03162F]">Report tracking</h2><p className="text-xs text-slate-500">Track progress and review notes.</p></div>
          <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">{(["mine", ...(data?.canReview ? ["inbox"] : [])] as ("mine" | "inbox")[]).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 ${view === item ? "bg-white text-[#03162F] shadow-sm" : "text-slate-500"}`}>{item === "mine" ? "My reports" : "Department inbox"}</button>)}</div>{data?.canReview && view === "inbox" && <select aria-label="Filter reports by department" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700" value={inboxDepartment} onChange={(event) => setInboxDepartment(event.target.value)}><option value="">All departments</option>{data.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>}</div>
        </div>
        {visibleReports.length === 0 ? <div className="px-6 py-16 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No reports to show</p><p className="mt-1 text-sm text-slate-500">{view === "inbox" ? "New submissions for all departments will appear here." : "Reports you submit will appear here with their progress."}</p></div> : <div className="divide-y divide-slate-100">{visibleReports.map((report) => <ReportCard key={report.id} report={report} canReview={Boolean(data?.canReview) && view === "inbox"} note={notes[report.id] ?? ""} setNote={(value) => setNotes((current) => ({ ...current, [report.id]: value }))} busy={isPending} onReview={(status) => run(() => reviewDepartmentReport({ reportId: report.id, status, note: notes[report.id] ?? "" }), `Report marked ${status.toLowerCase()}.`)} />)}</div>}
      </section>
    </div>
  </main>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Clock3; tone: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-xl font-extrabold text-[#03162F]">{value}</p></div></div>;
}

function ReportCard({ report, canReview, note, setNote, busy, onReview }: { report: Report; canReview: boolean; note: string; setNote: (value: string) => void; busy: boolean; onReview: (status: "In review" | "Returned" | "Resolved") => void }) {
  const department = one<Flatten<Report["department"]>>(report.department);
  const reporter = one<Flatten<Report["reporter"]>>(report.reporter);
  const reviewer = one<Flatten<Report["reviewer"]>>(report.reviewer);
  return <article className="p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#03162F]">{report.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle[report.status] ?? "bg-slate-100 text-slate-600"}`}>{report.status}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${report.priority === "Urgent" ? "bg-rose-50 text-rose-700" : report.priority === "High" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{report.priority}</span></div><p className="mt-1 text-xs text-slate-500">{relationName(department)} · {report.report_type} · {new Date(report.created_at).toLocaleString()}</p></div><p className="shrink-0 text-xs text-slate-500">From {relationName(reporter)}</p></div>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.details}</p>
    {report.concerned_person && <p className="mt-2 text-xs"><span className="font-semibold text-slate-600">Person concerned:</span> <span className="text-slate-700">{report.concerned_person}</span></p>}
    {report.review_note && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"><span className="font-bold">Latest review · {relationName(reviewer)}:</span> {report.review_note}</div>}
    {canReview && report.status !== "Resolved" && <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><input className={field} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Review note (required to return or resolve)" maxLength={2000} /><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => onReview("In review")} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Take for review</button><button disabled={busy} onClick={() => onReview("Returned")} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><RotateCcw className="h-3.5 w-3.5" />Return</button><button disabled={busy} onClick={() => onReview("Resolved")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Resolve</button></div></div>}
  </article>;
}
