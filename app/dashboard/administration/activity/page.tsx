import { getRecentAccessActivity } from "@/modules/administration/services/access-control.service";

export default async function AdministrationActivityPage() {
  const entries = await getRecentAccessActivity();
  return (
    <main className="w-full space-y-6">
      <header className="sticky top-[-24px] z-[90] -mx-6 -mt-6 rounded-none bg-[#03162F] p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Security & governance</p>
        <h1 className="mt-2 text-3xl font-bold">Administration activity</h1>
        <p className="mt-2 text-sm text-slate-300">Review role assignments and permission changes across the enterprise.</p>
      </header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-[#03162F]">Recent access changes</h2><p className="mt-1 text-xs text-slate-500">Latest {entries.length} records</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Staff member</th><th className="px-5 py-3">Activity</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Details</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                return <tr key={entry.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td><td className="px-5 py-4 font-medium text-slate-800">{profile?.display_name || profile?.email || "Former staff account"}</td><td className="px-5 py-4 capitalize text-slate-700">{String(entry.action).replaceAll("_", " ")}</td><td className="px-5 py-4 capitalize text-slate-700">{String(entry.resource).replaceAll("_", " ")}</td><td className="px-5 py-4 text-slate-600">{entry.summary}</td></tr>;
              })}
              {entries.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No administration changes recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
