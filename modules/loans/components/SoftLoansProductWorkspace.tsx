import Link from "next/link";
import { ArrowLeft, Banknote, CheckCircle2, XCircle } from "lucide-react";

import ConfigurationManager from "@/modules/configuration/components/ConfigurationManager";
import { getConfiguration } from "@/modules/configuration/services/configuration.server.service";
import { getConfigurationSchema } from "@/modules/configuration/utils/get-schema";

export default async function SoftLoansProductWorkspace() {
  const schema = getConfigurationSchema("loanProducts");
  if (!schema) throw new Error("Loan product configuration is unavailable.");

  const rows = await getConfiguration(schema.table);
  const activeCount = rows.filter((row) => row.status === "Active").length;
  const inactiveCount = rows.length - activeCount;
  const columns = schema.fields.filter((field) => field.type !== "image").map((field) => ({ key: field.key, label: field.label }));

  return <div className="space-y-8 pb-10">
    <div><Link href="/dashboard/enterprise/soft-loans" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#03162F]"><ArrowLeft className="h-4 w-4" />Soft Loans Workspace</Link></div>
    <section className="sticky top-[-24px] z-[90] -mx-6 -mt-6 overflow-hidden rounded-none bg-gradient-to-br from-[#03162F] via-[#0A2852] to-[#174D8C] px-6 py-8 text-white shadow-xl sm:px-8 lg:px-10"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">AEOS • Business Management</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Alessandro Soft Loans</h1><h2 className="mt-4 text-xl font-bold">Loan Products</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Create and manage loan products, limits and collateral requirements. Active products are shown in the customer loan products experience.</p></div></section>
    <section className="grid gap-4 sm:grid-cols-3"><SummaryCard title="Loan Products" value={rows.length} icon={Banknote} /><SummaryCard title="Active" value={activeCount} icon={CheckCircle2} /><SummaryCard title="Inactive" value={inactiveCount} icon={XCircle} /></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Manage Products</p><h2 className="mt-1 text-2xl font-black text-[#03162F]">Customer Loan Products</h2><p className="mt-2 text-sm text-slate-500">Use the row actions to view, add, edit or remove loan products. Configure repayment rates and periods in Loan Terms.</p></div><ConfigurationManager schema={schema} initialRows={rows} columns={columns} /></section>
  </div>;
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Banknote }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{title}</p><Icon className="h-5 w-5 text-[#D4AF37]" /></div><p className="mt-3 text-3xl font-black text-[#03162F]">{value}</p></div>;
}
