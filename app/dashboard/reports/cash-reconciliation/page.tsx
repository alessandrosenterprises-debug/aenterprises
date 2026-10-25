"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, Download, Plus, RefreshCw, Scale, Wallet, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { getCashReconciliationData, recordCashReceipt, submitCashCount } from "./actions";

type CashData = Awaited<ReturnType<typeof getCashReconciliationData>>;
type CashEntry = CashData["entries"][number];
type Reconciliation = CashData["reconciliations"][number];
type Business = CashData["businesses"][number];
type CashSummaryRow = { staffId: string; staff: string; businessId: string; business: string; entries: CashEntry[]; reconciliation?: Reconciliation };
type CashAssignment = CashData["assignments"][number];

function todayLocal() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function money(value: number) { return `ZMW ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function personName(value: { display_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) {
  return value?.display_name?.trim() || [value?.first_name, value?.last_name].filter(Boolean).join(" ") || value?.email || "Staff member";
}
function businessName(value: { name?: string | null } | null | undefined) { return value?.name || "Business"; }
function keyOf(staffId: string, businessId: string) { return `${staffId}:${businessId}`; }
const cashSources = ["Order", "Booking", "Loan", "Expense", "Refund", "Other"] as const;

export default function CashReconciliationPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayLocal);
  const [data, setData] = useState<CashData | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [receiptBusiness, setReceiptBusiness] = useState("");
  const [transactionModeId, setTransactionModeId] = useState("");
  const [movementDirection, setMovementDirection] = useState<"in" | "out">("in");
  const [receiptSource, setReceiptSource] = useState("Order");
  const [receiptReference, setReceiptReference] = useState("");
  const [receiptDescription, setReceiptDescription] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [countBusiness, setCountBusiness] = useState("");
  const [countCashier, setCountCashier] = useState("");
  const [openingFloat, setOpeningFloat] = useState("0");
  const [cashDropped, setCashDropped] = useState("0");
  const [countedCash, setCountedCash] = useState("");
  const [countNotes, setCountNotes] = useState("");
  const [salaryDeductionNote, setSalaryDeductionNote] = useState("");
  const [salaryDeductionAmount, setSalaryDeductionAmount] = useState("");

  const load = useCallback(async (selectedDate: string) => {
    setError("");
    try {
      const result = await getCashReconciliationData(selectedDate);
      setData(result);
      setReceiptBusiness((current) => current || result.businesses[0]?.id || "");
      setCountBusiness((current) => current || result.businesses[0]?.id || "");
      setTransactionModeId((current) => current || result.modes.find((mode) => mode.mode_key === "cash")?.id || result.modes[0]?.id || "");
      setCountCashier((current) => current || result.assignments.find((assignment) => assignment.business_id === (result.businesses[0]?.id ?? ""))?.staff_profile_id || result.assignments[0]?.staff_profile_id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cash reconciliation could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(date); }, 0);
    return () => window.clearTimeout(timer);
  }, [date, load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, CashSummaryRow>();
    for (const entry of data.entries) {
      const business = Array.isArray(entry.business) ? entry.business[0] : entry.business;
      const staff = Array.isArray(entry.staff) ? entry.staff[0] : entry.staff;
      const id = keyOf(entry.staff_profile_id, entry.business_id);
      const row: CashSummaryRow = grouped.get(id) ?? { staffId: entry.staff_profile_id, staff: personName(staff), businessId: entry.business_id, business: businessName(business), entries: [] };
      row.entries.push(entry);
      grouped.set(id, row);
    }
    for (const reconciliation of data.reconciliations) {
      const business = Array.isArray(reconciliation.business) ? reconciliation.business[0] : reconciliation.business;
      const staff = Array.isArray(reconciliation.staff) ? reconciliation.staff[0] : reconciliation.staff;
      const id = keyOf(reconciliation.staff_profile_id, reconciliation.business_id);
      const row: CashSummaryRow = grouped.get(id) ?? { staffId: reconciliation.staff_profile_id, staff: personName(staff), businessId: reconciliation.business_id, business: businessName(business), entries: [] };
      row.reconciliation = reconciliation;
      grouped.set(id, row);
    }
    for (const assignment of data.assignments as CashAssignment[]) {
      const staff = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff;
      const business = Array.isArray(assignment.business) ? assignment.business[0] : assignment.business;
      const id = keyOf(assignment.staff_profile_id, assignment.business_id);
      if (!grouped.has(id)) grouped.set(id, { staffId: assignment.staff_profile_id, staff: personName(staff), businessId: assignment.business_id, business: businessName(business), entries: [] });
    }
    const recordedStaff = new Set(Array.from(grouped.values(), (row) => row.staffId));
    for (const staff of data.staffRoster) {
      if (!recordedStaff.has(staff.id)) {
        grouped.set(keyOf(staff.id, ""), { staffId: staff.id, staff: personName(staff), businessId: "", business: "No receipts recorded", entries: [] });
      }
    }
    return Array.from(grouped.values()).map((row) => {
      const received = row.entries.filter((entry) => entry.direction === "in").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const paidOut = row.entries.filter((entry) => entry.direction === "out").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const cashReceived = row.entries.filter((entry) => entry.direction === "in" && entry.counts_toward_till).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const cashPaidOut = row.entries.filter((entry) => entry.direction === "out" && entry.counts_toward_till).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const opening = Number(row.reconciliation?.opening_float || 0);
      const dropped = Number(row.reconciliation?.cash_dropped || 0);
      const expected = opening + cashReceived - cashPaidOut - dropped;
      const counted = row.reconciliation ? Number(row.reconciliation.counted_cash) : null;
      const variance = counted === null ? null : counted - expected;
      const bySource = Object.fromEntries(cashSources.map((source) => [source, {
        cashIn: row.entries.filter((entry) => entry.source === source && entry.direction === "in").reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        cashOut: row.entries.filter((entry) => entry.source === source && entry.direction === "out").reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      }]));
      return { ...row, received, paidOut, cashReceived, cashPaidOut, opening, dropped, expected, counted, variance, bySource, shortage: variance === null ? null : Math.max(0, -variance), overage: variance === null ? null : Math.max(0, variance) };
    }).sort((a, b) => a.staff.localeCompare(b.staff) || a.business.localeCompare(b.business));
  }, [data]);

  const totals = rows.reduce((sum, row) => ({ received: sum.received + row.received, out: sum.out + row.paidOut, cashReceived: sum.cashReceived + row.cashReceived, cashOut: sum.cashOut + row.cashPaidOut, dropped: sum.dropped + row.dropped, expected: sum.expected + row.expected, counted: sum.counted + (row.counted ?? 0), variances: sum.variances + (row.variance ?? 0), shortage: sum.shortage + (row.shortage ?? 0), overage: sum.overage + (row.overage ?? 0), submitted: sum.submitted + Number(row.counted !== null) }), { received: 0, out: 0, cashReceived: 0, cashOut: 0, dropped: 0, expected: 0, counted: 0, variances: 0, shortage: 0, overage: 0, submitted: 0 });
  const cashHandlerCount = new Set(rows.map((row) => row.staffId)).size;

  function addReceipt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await recordCashReceipt({ businessId: receiptBusiness, transactionModeId, direction: movementDirection, source: receiptSource, reference: receiptReference, description: receiptDescription, amount: Number(receiptAmount) });
        toast.success(movementDirection === "in" ? "Payment was recorded." : "Cash payout was recorded.");
        setReceiptDescription(""); setReceiptReference(""); setReceiptAmount("");
        await load(date); router.refresh();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Cash receipt could not be recorded."); }
    });
  }

  function saveCount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await submitCashCount({ businessId: countBusiness, cashierProfileId: countCashier, date, openingFloat: Number(openingFloat), cashDropped: Number(cashDropped), countedCash: Number(countedCash), notes: countNotes, salaryDeductionNote, salaryDeductionAmount: Number(salaryDeductionAmount || 0) });
        toast.success("Cash-up verified, locked and sent to Accounts.");
        setCountedCash(""); setCountNotes(""); setSalaryDeductionNote(""); setSalaryDeductionAmount("");
        await load(date); router.refresh();
      } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Daily cash count could not be saved."); }
    });
  }

  function exportCsv() {
    const csvRows = [["Cashier", "Business", ...cashSources.map((source) => `${source} received · all modes (ZMW)`), ...cashSources.map((source) => `${source} paid out · all modes (ZMW)`), "Total received · all modes (ZMW)", "Total paid out · all modes (ZMW)", "Physical cash received (ZMW)", "Physical cash paid out (ZMW)", "Opening float (ZMW)", "Cash dropped (ZMW)", "Expected cash (ZMW)", "Counted cash (ZMW)", "Shortage (ZMW)", "Overage (ZMW)", "Notes", "Reconciled"], ...rows.map((row) => [row.staff, row.business, ...cashSources.map((source) => row.bySource[source].cashIn.toFixed(2)), ...cashSources.map((source) => row.bySource[source].cashOut.toFixed(2)), row.received.toFixed(2), row.paidOut.toFixed(2), row.cashReceived.toFixed(2), row.cashPaidOut.toFixed(2), row.opening.toFixed(2), row.dropped.toFixed(2), row.expected.toFixed(2), row.counted?.toFixed(2) ?? "", row.shortage?.toFixed(2) ?? "", row.overage?.toFixed(2) ?? "", row.reconciliation?.notes ?? "", row.counted === null ? "No" : "Yes"])];
    const csv = csvRows.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `cash-reconciliation-${date}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const allowedBusinessIds = new Set(data?.assignments.filter((assignment) => assignment.staff_profile_id === data.currentProfileId && assignment.active).map((assignment) => assignment.business_id) ?? []);
  const businessOptions: Business[] = data?.canManageCash ? data.businesses : (data?.businesses ?? []).filter((business) => allowedBusinessIds.has(business.id));
  const countAssignments = data?.assignments.filter((assignment) => assignment.business_id === countBusiness && assignment.active) ?? [];
  const selectedTillRow = rows.find((row) => row.staffId === countCashier && row.businessId === countBusiness);
  const currentExpectedCash = Number(openingFloat || 0) + (selectedTillRow?.cashReceived ?? 0) - (selectedTillRow?.cashPaidOut ?? 0) - Number(cashDropped || 0);
  const liveVariance = Number(countedCash || 0) - currentExpectedCash;
  const existingCashUp = data?.reconciliations.find((record) => record.staff_profile_id === countCashier && record.business_id === countBusiness);
  return <div className="w-full space-y-5 pb-8">
    <header className="sticky top-0 z-20 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 pb-3 pt-6">
      <div className="flex items-center gap-3"><Link href="/dashboard/reports" aria-label="Back to reports" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D9B52B] text-[#03162F]"><Scale className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9A7410]">Enterprise finance</p><h1 className="text-xl font-black text-[#03162F]">Daily cash reconciliation</h1><p className="text-xs text-slate-500">Track cash receipts and end-of-day till counts by staff member.</p></div></div>
      <div className="flex flex-wrap items-center gap-2">{data?.canManageCash && <><Link href="/dashboard/reports/cash-reconciliation/cashiers" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#03162F]"><UserRoundCog className="h-4 w-4" />Manage cashiers</Link><Link href="/dashboard/reports/cash-reconciliation/modes" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#03162F]"><Banknote className="h-4 w-4" />Payment modes</Link></>}{data?.canFinalize && <Link href="/dashboard/reports/cash-reconciliation/account-review" className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">Accounts review</Link>}<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><CalendarDays className="h-4 w-4" /><input type="date" value={date} max={todayLocal()} onChange={(event) => setDate(event.target.value)} className="bg-transparent text-sm text-[#03162F] outline-none" /></label><button type="button" onClick={() => startTransition(() => { void load(date); })} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh</button><button type="button" onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" />Export</button></div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      <Metric label="Total collected · all modes" value={money(totals.received)} icon={Banknote} tint="bg-emerald-50 text-emerald-700" />
      <Metric label="Physical cash received" value={money(totals.cashReceived)} icon={Banknote} tint="bg-teal-50 text-teal-700" />
      <Metric label="Cash paid out" value={money(totals.cashOut)} icon={Banknote} tint="bg-orange-50 text-orange-700" />
      <Metric label="Cash drops" value={money(totals.dropped)} icon={Wallet} tint="bg-cyan-50 text-cyan-700" />
      <Metric label="Expected in tills" value={money(totals.expected)} icon={Wallet} tint="bg-blue-50 text-blue-700" />
      <Metric label="Counted cash" value={money(totals.counted)} icon={Scale} tint="bg-violet-50 text-violet-700" />
      <Metric label="Till count submitted" value={`${totals.submitted} / ${rows.length}`} icon={CheckCircle2} tint="bg-amber-50 text-amber-700" />
      <Metric label="Shortage / overage" value={`${money(totals.shortage)} / ${money(totals.overage)}`} icon={Scale} tint={totals.shortage < 0.01 && totals.overage < 0.01 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"} />
    </div>

    {(data?.canReconcile || data?.canCashUp) && <div className="grid gap-4 xl:grid-cols-2">
      {data?.canReconcile && <form onSubmit={addReceipt} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div><h2 className="font-bold text-[#03162F]">Record cash movement</h2><p className="mt-0.5 text-xs text-slate-500">Every movement is attributed to your cashier account and timestamped.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business"><select required value={receiptBusiness} onChange={(event) => setReceiptBusiness(event.target.value)} className={inputClass}><BusinessOptions items={businessOptions} /></select></Field>
          <Field label="Movement"><select value={movementDirection} onChange={(event) => { const direction = event.target.value as "in" | "out"; setMovementDirection(direction); setReceiptSource(direction === "in" ? "Order" : "Expense"); }} className={inputClass}><option value="in">Cash in</option><option value="out">Cash out</option></select></Field>
          <Field label="Source"><select value={receiptSource} onChange={(event) => setReceiptSource(event.target.value)} className={inputClass}>{(movementDirection === "in" ? ["Order", "Booking", "Loan", "Other"] : ["Expense", "Refund", "Other"]).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Payment mode"><select required value={transactionModeId} onChange={(event) => setTransactionModeId(event.target.value)} className={inputClass}>{(data?.modes ?? []).map((mode) => <option key={mode.id} value={mode.id}>{mode.name}{mode.affects_cash_balance ? " · till cash" : " · non-cash"}</option>)}</select></Field>
          <Field label="Reason / description"><input required value={receiptDescription} onChange={(event) => setReceiptDescription(event.target.value)} placeholder={movementDirection === "in" ? "e.g. Order payment" : "e.g. Till supplies purchase"} className={inputClass} /></Field>
          <Field label="Amount (ZMW)"><input required min="0.01" step="0.01" type="number" value={receiptAmount} onChange={(event) => setReceiptAmount(event.target.value)} placeholder="0.00" className={inputClass} /></Field>
          <Field label="Order / receipt reference"><input value={receiptReference} onChange={(event) => setReceiptReference(event.target.value)} placeholder="Optional" className={inputClass} /></Field>
          <div className="flex items-end"><button disabled={isPending || !receiptBusiness} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" />Record {movementDirection === "in" ? "cash in" : "cash out"}</button></div>
        </div>
      </form>}
      {data?.canCashUp && <form onSubmit={saveCount} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
        <div><h2 className="font-bold text-[#03162F]">Manager on-shift cash-up</h2><p className="mt-0.5 text-xs text-slate-500">Verify and lock the till before sending it to Accounts. Overages must be corrected. A shortage needs a reason and a salary deduction note equal to the shortage.</p></div>
        {existingCashUp && existingCashUp.status !== "returned" && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">Till locked: {existingCashUp.status === "approved" ? "Accounts confirmed it." : "awaiting Accounts final confirmation."}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business"><select required value={countBusiness} onChange={(event) => { const businessId = event.target.value; setCountBusiness(businessId); const assigned = data?.assignments.find((assignment) => assignment.business_id === businessId && assignment.active); setCountCashier(assigned?.staff_profile_id ?? ""); }} className={inputClass}><BusinessOptions items={businessOptions} /></select></Field>
          <Field label="Cashier on this till"><select required value={countCashier} onChange={(event) => setCountCashier(event.target.value)} className={inputClass}><option value="">Select cashier</option>{countAssignments.map((assignment) => { const staff = Array.isArray(assignment.staff) ? assignment.staff[0] : assignment.staff; return <option key={assignment.staff_profile_id} value={assignment.staff_profile_id}>{personName(staff)}</option>; })}</select></Field>
          <Field label="Opening float (ZMW)"><input required min="0" step="0.01" type="number" value={openingFloat} onChange={(event) => setOpeningFloat(event.target.value)} className={inputClass} /></Field>
          <Field label="Cash dropped to safe / bank (ZMW)"><input required min="0" step="0.01" type="number" value={cashDropped} onChange={(event) => setCashDropped(event.target.value)} className={inputClass} /></Field>
          <Field label="Counted cash (ZMW)"><input required min="0" step="0.01" type="number" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} placeholder="Enter till count" className={inputClass} /></Field>
          <Field label="Manager reason / cash-up note"><input value={countNotes} onChange={(event) => setCountNotes(event.target.value)} placeholder={liveVariance < -0.009 ? "Required: explain the shortage" : "Optional note"} className={inputClass} /></Field>
          {liveVariance < -0.009 && <><Field label="Salary deduction note"><input required value={salaryDeductionNote} onChange={(event) => setSalaryDeductionNote(event.target.value)} placeholder="Reason to send to Accounts for review" className={inputClass} /></Field><Field label={`Salary deduction amount · shortage ${money(Math.abs(liveVariance))}`}><input required min="0.01" step="0.01" type="number" value={salaryDeductionAmount} onChange={(event) => setSalaryDeductionAmount(event.target.value)} placeholder={Math.abs(liveVariance).toFixed(2)} className={inputClass} /></Field></>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className={`text-sm font-bold ${Math.abs(liveVariance) < 0.01 ? "text-emerald-700" : liveVariance < 0 ? "text-rose-700" : "text-amber-700"}`}>Live variance: {money(liveVariance)}</p><button disabled={isPending || !countBusiness || !countCashier || (existingCashUp != null && existingCashUp.status !== "returned")} className="inline-flex items-center gap-2 rounded-lg border border-[#03162F] px-4 py-2.5 text-sm font-bold text-[#03162F] disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Verify, lock & send to Accounts</button></div>
      </form>}
    </div>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><div><h2 className="font-bold text-[#03162F]">Cashier reconciliation</h2><p className="text-xs text-slate-500">{date} · Each cashier is balanced separately for every assigned business.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{cashHandlerCount} cashiers</span></div>
      {!data && !error ? <p className="p-8 text-center text-sm text-slate-500">Loading cash report…</p> : rows.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No cash receipts or staff counts recorded for this date.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1480px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Cashier", "Business", "Collected · all modes", "Till cash in", "Till cash out", "Opening float", "Cash dropped", "Expected", "Counted", "Shortage", "Overage", "Reconciled by", "Status"].map((head) => <th key={head} className="px-4 py-3 font-semibold">{head}</th>)}</tr></thead><tbody>{rows.map((row) => { const reconciler = Array.isArray(row.reconciliation?.reconciler) ? row.reconciliation?.reconciler[0] : row.reconciliation?.reconciler; const status = row.reconciliation?.status; const statusLabel = status === "pending_accounts" ? "Locked · awaiting Accounts" : status === "approved" ? "Accounts confirmed" : status === "returned" ? "Returned to manager" : row.counted === null ? "Awaiting count" : Math.abs(row.variance ?? 0) < 0.01 ? "Balanced · not submitted" : "Review variance"; const statusTone = status === "approved" ? "bg-emerald-50 text-emerald-700" : status === "pending_accounts" ? "bg-blue-50 text-blue-700" : status === "returned" || (row.counted !== null && Math.abs(row.variance ?? 0) >= 0.01) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <tr key={keyOf(row.staffId, row.businessId)} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-[#03162F]">{row.staff}</td><td className="px-4 py-3">{row.business}</td><td className="px-4 py-3 tabular-nums text-emerald-700">{money(row.received)}</td><td className="px-4 py-3 tabular-nums text-teal-700">{money(row.cashReceived)}</td><td className="px-4 py-3 tabular-nums text-orange-700">{money(row.cashPaidOut)}</td><td className="px-4 py-3 tabular-nums">{money(row.opening)}</td><td className="px-4 py-3 tabular-nums">{money(row.dropped)}</td><td className="px-4 py-3 font-semibold tabular-nums">{money(row.expected)}</td><td className="px-4 py-3 tabular-nums">{row.counted === null ? "—" : money(row.counted)}</td><td className="px-4 py-3 font-bold tabular-nums text-rose-700">{row.shortage === null ? "—" : money(row.shortage)}</td><td className="px-4 py-3 font-bold tabular-nums text-amber-700">{row.overage === null ? "—" : money(row.overage)}</td><td className="px-4 py-3 text-xs">{reconciler ? personName(reconciler) : "—"}</td><td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}>{statusLabel}</span>{row.reconciliation?.accounts_review_note && <p className="mt-1 max-w-56 whitespace-normal text-xs text-slate-500">Accounts: {row.reconciliation.accounts_review_note}</p>}{Number(row.reconciliation?.salary_deduction_amount ?? 0) > 0 && <p className="mt-1 max-w-56 whitespace-normal text-xs text-rose-700">Deduction note: {row.reconciliation?.salary_deduction_note} · {money(Number(row.reconciliation?.salary_deduction_amount))}</p>}</td></tr>; })}</tbody></table></div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold text-[#03162F]">Transaction totals by source</h2><p className="text-xs text-slate-500">All payment modes are included here; the till balance above counts only physical cash modes.</p></div>
      {!rows.length ? <p className="p-7 text-center text-sm text-slate-500">Transaction totals will appear here when cash movements are recorded.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1500px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Cashier", "Business", ...cashSources, "Total received · all modes", "Paid out · all modes"].map((head) => <th key={head} className="px-4 py-3 font-semibold">{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={keyOf(row.staffId, row.businessId)} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-[#03162F]">{row.staff}</td><td className="px-4 py-3">{row.business}</td>{cashSources.map((source) => <td key={source} className="px-4 py-3 text-xs tabular-nums"><span className="text-emerald-700">In {money(row.bySource[source].cashIn)}</span>{row.bySource[source].cashOut > 0 && <span className="mt-1 block text-orange-700">Out {money(row.bySource[source].cashOut)}</span>}</td>)}<td className="px-4 py-3 font-bold tabular-nums text-emerald-800">{money(row.received)}</td><td className="px-4 py-3 font-bold tabular-nums text-orange-800">{money(row.paidOut)}</td></tr>)}</tbody><tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold"><tr><td className="px-4 py-3" colSpan={2}>All cashiers total</td>{cashSources.map((source) => { const cashIn = rows.reduce((sum, row) => sum + row.bySource[source].cashIn, 0); const cashOut = rows.reduce((sum, row) => sum + row.bySource[source].cashOut, 0); return <td key={source} className="px-4 py-3 text-xs tabular-nums"><span className="text-emerald-700">In {money(cashIn)}</span>{cashOut > 0 && <span className="mt-1 block text-orange-700">Out {money(cashOut)}</span>}</td>; })}<td className="px-4 py-3 tabular-nums text-emerald-800">{money(totals.received)}</td><td className="px-4 py-3 tabular-nums text-orange-800">{money(totals.out)}</td></tr></tfoot></table></div>}
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold text-[#03162F]">Totals by payment mode</h2><p className="text-xs text-slate-500">See how much each cashier collected or paid out by payment method, and whether it belongs in the physical till.</p></div>{!data?.entries.length ? <p className="p-6 text-sm text-slate-500">Payment mode totals will appear after transactions are recorded.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Cashier", "Business", "Payment mode", "Till treatment", "Received", "Paid out", "Net"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{rows.flatMap((row) => (data.modes ?? []).map((mode) => { const entries = row.entries.filter((entry) => entry.transaction_mode_id === mode.id); if (!entries.length) return null; const incoming = entries.filter((entry) => entry.direction === "in").reduce((sum, entry) => sum + Number(entry.amount || 0), 0); const outgoing = entries.filter((entry) => entry.direction === "out").reduce((sum, entry) => sum + Number(entry.amount || 0), 0); return <tr key={`${row.staffId}:${row.businessId}:${mode.id}`} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{row.staff}</td><td className="px-4 py-3">{row.business}</td><td className="px-4 py-3">{mode.name}</td><td className="px-4 py-3">{mode.affects_cash_balance ? "Physical till" : "Non-cash"}</td><td className="px-4 py-3 tabular-nums text-emerald-700">{money(incoming)}</td><td className="px-4 py-3 tabular-nums text-orange-700">{money(outgoing)}</td><td className="px-4 py-3 tabular-nums font-bold">{money(incoming - outgoing)}</td></tr>; }))}</tbody></table></div>}</section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold text-[#03162F]">Cash movement detail</h2><p className="text-xs text-slate-500">Cash in and out attributed to the cashier, source, payment mode, reference and time.</p></div>{!data?.entries.length ? <p className="p-7 text-center text-sm text-slate-500">No movement details for this day.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Time", "Cashier", "Business", "Movement", "Source", "Payment mode", "Till treatment", "Description / reference", "Amount"].map((head) => <th key={head} className="px-4 py-3 font-semibold">{head}</th>)}</tr></thead><tbody>{data.entries.map((entry) => { const staff = Array.isArray(entry.staff) ? entry.staff[0] : entry.staff; const business = Array.isArray(entry.business) ? entry.business[0] : entry.business; const mode = Array.isArray(entry.mode) ? entry.mode[0] : entry.mode; return <tr key={entry.id} className="border-t border-slate-100"><td className="px-4 py-3">{new Date(entry.received_at).toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}</td><td className="px-4 py-3 font-semibold">{personName(staff)}</td><td className="px-4 py-3">{businessName(business)}</td><td className="px-4 py-3">{entry.direction === "out" ? "Paid out" : "Received"}</td><td className="px-4 py-3">{entry.source}</td><td className="px-4 py-3">{mode?.name ?? "Cash"}</td><td className="px-4 py-3">{entry.counts_toward_till ? "Till cash" : "Non-cash"}</td><td className="px-4 py-3">{entry.description}{entry.reference && <span className="ml-1 text-xs text-slate-500">· {entry.reference}</span>}</td><td className={`px-4 py-3 text-right font-bold ${entry.direction === "out" ? "text-orange-700" : "text-emerald-700"}`}>{entry.direction === "out" ? "− " : "+ "}{money(Number(entry.amount))}</td></tr>; })}</tbody></table></div>}</section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold text-[#03162F]">Variance notes</h2><p className="text-xs text-slate-500">Cash shortages and overages that need manager review.</p></div>{rows.filter((row) => row.variance !== null && Math.abs(row.variance) >= 0.01).length === 0 ? <p className="p-6 text-sm text-emerald-700">No recorded cash variances for this date.</p> : <div className="divide-y divide-slate-100">{rows.filter((row) => row.variance !== null && Math.abs(row.variance) >= 0.01).map((row) => <article key={keyOf(row.staffId, row.businessId)} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"><div><p className="font-semibold text-[#03162F]">{row.staff} · {row.business}</p><p className="mt-1 text-sm text-slate-600">{row.reconciliation?.notes || "No explanation was recorded."}</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">{row.shortage ? `Short ${money(row.shortage)}` : `Over ${money(row.overage ?? 0)}`}</span></article>)}</div>}</section>
    <p className="text-xs text-slate-500">Record each cash movement to include it in a till count. Paid orders and bookings are not automatically attributed to a cashier yet, so record their cash receipts here until those checkout flows capture cashier and payment method.</p>
  </div>;
}

const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#03162F] outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-slate-600">{label}{children}</label>; }
function BusinessOptions({ items }: { items: Business[] }) { return <>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</>; }
function Metric({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof Wallet; tint: string }) { return <article className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-[#03162F]">{value}</p></div><span className={`rounded-xl p-3 ${tint}`}><Icon className="h-5 w-5" /></span></article>; }
