"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { getReportData, type ReportBooking, type ReportBusiness, type ReportLoanApplication, type ReportOrder, type ReportResult } from "./actions";
import Link from "next/link";

type ReportTab = "businesses" | "bookings" | "orders" | "courier" | "loans";

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" });
}

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `ZMW ${amount.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusStyle(status: string) {
  const value = status.toLowerCase();
  if (["completed", "delivered", "paid", "approved"].includes(value)) return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
  if (["cancelled", "rejected", "failed"].includes(value)) return "bg-rose-50 text-rose-700 ring-rose-600/15";
  if (["pending", "under review", "processing", "assigned"].includes(value)) return "bg-amber-50 text-amber-800 ring-amber-600/15";
  return "bg-blue-50 text-blue-700 ring-blue-600/15";
}

function orderType(order: ReportOrder) {
  const label = order.businesses?.slug === "delivery-service"
    ? "Courier"
    : order.fulfillment_method?.toLowerCase() === "delivery"
      ? "Delivery"
      : "Collect";
  return order.customer_id ? label : `${label} · Walk-in`;
}

const tabs: { id: ReportTab; label: string; icon: typeof Activity }[] = [
  { id: "businesses", label: "Business performance", icon: BriefcaseBusiness },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "orders", label: "Orders", icon: Package },
  { id: "courier", label: "Courier deliveries", icon: Truck },
  { id: "loans", label: "Loan applications", icon: WalletCards },
];

const reportColumns: Record<ReportTab, string[]> = {
  businesses: ["Business", "Bookings", "Orders", "Courier", "Loan applications", "Paid revenue"],
  bookings: ["Date", "Customer", "Business", "Service", "Status", "Payment", "Amount"],
  orders: ["Date", "Customer", "Business", "Order type", "Rider", "Order status", "Payment", "Amount"],
  courier: ["Date", "Customer", "Business", "Order type", "Rider", "Delivery status", "Payment", "Amount"],
  loans: ["Applied", "Customer", "Loan type", "Source", "Status", "Requested", "Approved", "Repaid"],
};

export default function ReportsPage() {
  const today = localDate(new Date());
  const monthStart = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [businessFilter, setBusinessFilter] = useState("");
  const [appliedRange, setAppliedRange] = useState({ from: monthStart, to: today, businessId: "" });
  const [report, setReport] = useState<ReportResult | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>("businesses");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function load(from = fromDate, to = toDate, businessId = businessFilter) {
    setError("");
    try {
      const data = await getReportData({ fromDate: from, toDate: to, businessId: businessId || undefined });
      setReport(data);
      setAppliedRange({ from, to, businessId });
    } catch (cause) {
      console.error("Unable to load enterprise reports", cause);
      setError(cause instanceof Error ? cause.message : "Reports could not be loaded. Please try again.");
    }
  }

  useEffect(() => {
    startTransition(() => { void load(monthStart, today, ""); });
    // Initial page load only; filters are applied explicitly below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    if (!fromDate || !toDate || fromDate > toDate) {
      setError("Choose a valid date range. The start date must be before the end date.");
      return;
    }
    startTransition(() => { void load(); });
  }

  function resetFilters() {
    setFromDate(monthStart);
    setToDate(today);
    setBusinessFilter("");
    startTransition(() => { void load(monthStart, today, ""); });
  }

  function exportCurrentReport() {
    if (!report) return;
    const rows: (string | number)[][] = [];
    if (activeTab === "businesses") {
      rows.push(["Business", "Bookings", "Orders", "Courier deliveries", "Loan applications", "Paid revenue (ZMW)"]);
      report.businessPerformance.filter((row) => !appliedRange.businessId || row.business_id === appliedRange.businessId).forEach((row) => rows.push([row.business_name, row.bookings, row.orders, row.courier_deliveries, row.loan_applications, row.revenue]));
    } else if (activeTab === "bookings") {
      rows.push(["Date", "Customer", "Phone", "Business", "Service", "Status", "Payment", "Amount (ZMW)"]);
      report.bookings.forEach((row) => rows.push([row.booking_date, row.customers?.full_name ?? "Walk-in / Unknown", row.customers?.phone ?? "", row.businesses?.name ?? "", row.enterprise_catalog?.name ?? "Booking", row.status, row.payment_status, Number(row.amount ?? 0)]));
    } else if (activeTab === "orders" || activeTab === "courier") {
      const selectedOrders = report.orders.filter((row) => (row.businesses?.slug === "delivery-service") === (activeTab === "courier"));
      rows.push(["Date", "Customer", "Phone", "Business", "Order type", "Rider", activeTab === "courier" ? "Delivery status" : "Order status", "Payment", "Amount (ZMW)"]);
      selectedOrders.forEach((row) => rows.push([row.created_at, row.customers?.full_name ?? "Walk-in / Unknown", row.customers?.phone ?? "", row.businesses?.name ?? "", orderType(row), row.rider?.full_name ?? (orderType(row).startsWith("Delivery") || orderType(row).startsWith("Courier") ? "Not assigned" : ""), row.status, row.payment_status, Number(row.total_amount ?? 0)]));
    } else {
      rows.push(["Applied", "Customer", "Phone", "Loan type", "Source", "Status", "Requested (ZMW)", "Approved (ZMW)", "Repaid (ZMW)"]);
      report.loanApplications.forEach((row) => rows.push([row.application_date, row.customers?.full_name ?? "Unknown customer", row.customers?.phone ?? "", row.loan_type, row.application_source, row.status, Number(row.requested_amount ?? 0), Number(row.approved_amount ?? 0), Number(row.amount_paid ?? 0)]));
    }
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aeos-${activeTab}-${appliedRange.from}-to-${appliedRange.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const stats = report?.stats;
  const businesses: ReportBusiness[] = report?.businesses ?? [];
  const metrics = [
    { label: "Paid revenue", value: money(stats?.totalRevenue ?? 0), icon: DollarSign, note: "Bookings, orders and loan repayments" },
    { label: "Bookings", value: String(stats?.totalBookings ?? 0), icon: CalendarDays, note: `${stats?.pendingBookings ?? 0} pending` },
    { label: "Customer orders", value: String(stats?.totalOrders ?? 0), icon: Package, note: `${stats?.pendingOrders ?? 0} pending` },
    { label: "Courier deliveries", value: String(stats?.courierDeliveries ?? 0), icon: Truck, note: "Point-to-point delivery requests" },
    { label: "Loan applications", value: String(stats?.loanApplications ?? 0), icon: WalletCards, note: `${stats?.pendingLoanApplications ?? 0} awaiting review` },
    { label: "Customers", value: String(stats?.customersServed ?? 0), icon: Users, note: "Unique customers in this period" },
  ];

  return (
    <div className="w-full space-y-5 pb-8">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 space-y-3 bg-slate-50 px-6 pb-3 pt-6">
      <section className="flex flex-col gap-5 rounded-2xl bg-[#03162F] px-6 py-6 text-white shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-[#D9B52B] p-3 text-[#03162F]"><BarChart3 className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E3C447]">Enterprise intelligence</p>
            <h1 className="mt-1 text-2xl font-bold">Reports &amp; performance</h1>
            <p className="mt-1 text-sm text-slate-300">A consolidated view of activity across every Alessandro Enterprises business.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Reporting scope</p>
          <p className="mt-1 font-semibold">{businesses.find((business) => business.id === appliedRange.businessId)?.name ?? "All businesses"} <span className="text-slate-400">·</span> {dateLabel(appliedRange.from)} – {dateLabel(appliedRange.to)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto_auto_auto] md:items-end">
          <label className="block text-sm font-semibold text-slate-700">From date<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20" /></label>
          <label className="block text-sm font-semibold text-slate-700">To date<input type="date" value={toDate} min={fromDate || undefined} max={today} onChange={(event) => setToDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20" /></label>
          <label className="block text-sm font-semibold text-slate-700">Business<select value={businessFilter} onChange={(event) => setBusinessFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#D9B52B] focus:ring-2 focus:ring-[#D9B52B]/20"><option value="">All businesses</option>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}</select></label>
          <button type="button" onClick={applyFilters} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#03162F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2852] disabled:opacity-60"><BarChart3 className="h-4 w-4" />{isPending ? "Generating…" : "Generate report"}</button>
          <button type="button" onClick={exportCurrentReport} disabled={!report || isPending} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />Export CSV</button>
          <button type="button" onClick={resetFilters} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className="h-4 w-4" />Reset</button>
        </div>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1" aria-label="Enterprise report totals">
        {metrics.map(({ label, value, icon: Icon, note }) => <article key={label} className="min-w-[150px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold tracking-tight text-[#03162F]">{value}</p></div><span className="shrink-0 rounded-lg bg-[#03162F] p-2 text-[#E3C447]"><Icon className="h-4 w-4" /></span></div>
          <p className="mt-1 truncate text-[10px] text-slate-500">{note}</p>
        </article>)}
      </section>
      <Link href="/dashboard/reports/cash-reconciliation" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"><WalletCards className="h-4 w-4" />Open daily cash reconciliation</Link>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#03162F]">Enterprise activity</h2><p className="mt-1 text-sm text-slate-500">Review transactions and performance by business.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {report ? "Data loaded" : "Loading report"}</span></div>
          <div className="mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Report sections">
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${activeTab === id ? "border-[#D9B52B] text-[#03162F]" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
          <PinnedColumnHeadings columns={reportColumns[activeTab]} />
        </div>
      </section>
      </div>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {report?.warnings.map((warning) => <div key={warning} role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning} Some figures may be incomplete.</div>)}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!report ? <div className="p-12 text-center text-sm text-slate-500"><Clock3 className="mx-auto mb-3 h-7 w-7 animate-pulse" />Preparing your enterprise report…</div> : <div className="max-h-[calc(100vh-440px)] min-h-[260px] overflow-auto">
          {activeTab === "businesses" && <BusinessTable rows={mergeBusinessRows(report.businessPerformance.filter((row) => !appliedRange.businessId || row.business_id === appliedRange.businessId))} />}
          {activeTab === "bookings" && <BookingsTable rows={report.bookings} />}
          {activeTab === "orders" && <OrdersTable rows={report.orders.filter((order) => order.businesses?.slug !== "delivery-service")} />}
          {activeTab === "courier" && <OrdersTable rows={report.orders.filter((order) => order.businesses?.slug === "delivery-service")} courier />}
          {activeTab === "loans" && <LoansTable rows={report.loanApplications} />}
        </div>}
      </section>
      <p className="text-xs text-slate-500">Revenue includes paid booking and order amounts plus repayments recorded against loan applications created in the selected period.</p>
    </div>
  );
}

function PinnedColumnHeadings({ columns }: { columns: string[] }) {
  return <div className="mt-1 overflow-x-auto border-t border-slate-200 bg-slate-50">
    <div className="grid min-w-[900px] text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((column) => <span key={column} className="truncate px-3 py-2.5">{column}</span>)}
    </div>
  </div>;
}

function Empty({ message }: { message: string }) { return <div className="px-6 py-14 text-center"><BarChart3 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Nothing to show</p><p className="mt-1 text-sm text-slate-500">{message}</p></div>; }

function mergeBusinessRows(rows: ReportResult["businessPerformance"]) {
  const combined = new Map<string, ReportResult["businessPerformance"][number]>();
  for (const row of rows) {
    const key = row.business_name.trim().toLocaleLowerCase();
    const existing = combined.get(key);
    if (!existing) {
      combined.set(key, { ...row });
      continue;
    }
    existing.bookings += row.bookings;
    existing.orders += row.orders;
    existing.courier_deliveries += row.courier_deliveries;
    existing.loan_applications += row.loan_applications;
    existing.revenue += row.revenue;
  }
  return Array.from(combined.values()).sort((a, b) => b.revenue - a.revenue || a.business_name.localeCompare(b.business_name));
}

function BusinessTable({ rows }: { rows: ReportResult["businessPerformance"] }) {
  if (!rows.length) return <Empty message="No businesses are available for this report." />;
  return <table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="sr-only"><tr>{["Business", "Bookings", "Orders", "Courier", "Loan applications", "Paid revenue"].map((heading) => <th key={heading} className="sticky top-0 z-10 bg-slate-50 px-5 py-3.5 font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.business_id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-[#03162F]">{row.business_name}</td><td className="px-5 py-4">{row.bookings}</td><td className="px-5 py-4">{row.orders}</td><td className="px-5 py-4">{row.courier_deliveries}</td><td className="px-5 py-4">{row.loan_applications}</td><td className="px-5 py-4 font-semibold">{money(row.revenue)}</td></tr>)}</tbody></table>;
}

function Status({ value }: { value: string }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle(value)}`}>{value || "Unknown"}</span>; }

function BookingsTable({ rows }: { rows: ReportBooking[] }) {
  if (!rows.length) return <Empty message="No bookings match this date range and business." />;
  return <table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="sr-only"><tr>{["Date", "Customer", "Business", "Service", "Status", "Payment", "Amount"].map((heading) => <th key={heading} className="sticky top-0 z-10 bg-slate-50 px-5 py-3.5 font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4">{dateLabel(row.booking_date)}{row.booking_time && <span className="block text-xs text-slate-500">{row.booking_time.slice(0, 5)}</span>}</td><td className="px-5 py-4 font-medium">{row.customers?.full_name ?? "Walk-in / Unknown"}</td><td className="px-5 py-4">{row.businesses?.name ?? "—"}</td><td className="px-5 py-4">{row.enterprise_catalog?.name ?? "Booking"}</td><td className="px-5 py-4"><Status value={row.status} /></td><td className="px-5 py-4"><Status value={row.payment_status} /></td><td className="px-5 py-4 text-right font-semibold">{money(row.amount)}</td></tr>)}</tbody></table>;
}

function OrdersTable({ rows, courier = false }: { rows: ReportOrder[]; courier?: boolean }) {
  if (!rows.length) return <Empty message={courier ? "No courier deliveries match this date range." : "No customer orders match this date range and business."} />;
  return <table className="w-full min-w-[1100px] table-fixed text-left text-sm"><thead className="sr-only"><tr>{["Date", "Customer", "Business", "Order type", "Rider", courier ? "Delivery status" : "Order status", "Payment", "Amount"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row) => {
    const type = orderType(row);
    const includesDelivery = type.startsWith("Delivery") || type.startsWith("Courier");
    return <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-4 py-4">{dateLabel(row.created_at)}</td><td className="px-4 py-4 font-medium">{row.customers?.full_name ?? "Walk-in / Unknown"}{row.customers?.phone && <span className="block text-xs text-slate-500">{row.customers.phone}</span>}</td><td className="px-4 py-4">{row.businesses?.name ?? "—"}</td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{type}</span></td><td className="px-4 py-4">{includesDelivery ? row.rider?.full_name ?? <span className="text-slate-400">Not assigned</span> : "—"}</td><td className="px-4 py-4"><Status value={row.status} /></td><td className="px-4 py-4"><Status value={row.payment_status} /></td><td className="px-4 py-4 text-right font-semibold">{money(row.total_amount)}</td></tr>;
  })}</tbody></table>;
}

function LoansTable({ rows }: { rows: ReportLoanApplication[] }) {
  if (!rows.length) return <Empty message="No loan applications match this date range." />;
  return <table className="w-full min-w-[900px] table-fixed text-left text-sm"><thead className="sr-only"><tr>{["Applied", "Customer", "Loan type", "Source", "Status", "Requested", "Approved", "Repaid"].map((heading) => <th key={heading} className="sticky top-0 z-10 bg-slate-50 px-5 py-3.5 font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-5 py-4">{dateLabel(row.application_date)}</td><td className="px-5 py-4 font-medium">{row.customers?.full_name ?? "Unknown customer"}{row.customers?.phone && <span className="block text-xs text-slate-500">{row.customers.phone}</span>}</td><td className="px-5 py-4">{row.loan_type}</td><td className="px-5 py-4 capitalize">{row.application_source?.replaceAll("_", " ") || "—"}</td><td className="px-5 py-4"><Status value={row.status} /></td><td className="px-5 py-4">{money(row.requested_amount)}</td><td className="px-5 py-4">{money(row.approved_amount)}</td><td className="px-5 py-4 font-semibold">{money(row.amount_paid)}</td></tr>)}</tbody></table>;
}
