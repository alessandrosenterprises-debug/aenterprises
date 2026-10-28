import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Eye, FileImage, FileText, Globe2, Megaphone, PackageSearch, Settings2, Share2, Store } from "lucide-react";
import { getPublicWebsiteData } from "@/modules/website/services/public-website.service";

export const dynamic = "force-dynamic";

const managedPages = [
  { label: "Home page", href: "/", icon: Globe2 },
  { label: "Business directory", href: "/businesses", icon: Store, setting: "show_businesses" as const },
  { label: "Products & services", href: "/products", icon: PackageSearch, setting: "show_products" as const },
  { label: "Offers & announcements", href: "/offers", icon: Megaphone, setting: "show_promotions" as const },
  { label: "About the enterprise", href: "/about", icon: Globe2 },
  { label: "Contact information", href: "/contact", icon: Globe2, setting: "show_contact_information" as const },
];

const tools = [
  { title: "Website identity & visibility", detail: "Edit the public title, headline, logo, favicon, metadata and page visibility switches.", href: "/dashboard/settings?section=website", label: "Open website settings", icon: Settings2, tone: "bg-amber-50 text-amber-800" },
  { title: "Products & services", detail: "Manage customer-facing catalogue entries by business and publish them from AEOS.", href: "/dashboard/enterprise/content?section=products", label: "Manage catalogue", icon: PackageSearch, tone: "bg-blue-50 text-blue-800" },
  { title: "Offers & promotions", detail: "Create, edit and publish promotions displayed on the public website.", href: "/dashboard/enterprise/content?section=promotions", label: "Manage offers", icon: Megaphone, tone: "bg-emerald-50 text-emerald-800" },
  { title: "Website posts", detail: "Write business updates, set publish dates and control which posts are visible to customers.", href: "/dashboard/enterprise/content?section=posts", label: "Manage website posts", icon: FileText, tone: "bg-violet-50 text-violet-800" },
  { title: "Images & galleries", detail: "Add, edit, arrange and publish business gallery images.", href: "/dashboard/enterprise/content?section=gallery", label: "Manage images", icon: FileImage, tone: "bg-rose-50 text-rose-800" },
  { title: "Facebook publishing", detail: "Connect the official Page, schedule content, and review publishing history and failures.", href: "/dashboard/website/social", label: "Manage Facebook publishing", icon: Share2, tone: "bg-blue-50 text-blue-800" },
];

export default async function WebsitePage() {
  const data = await getPublicWebsiteData();
  const liveBusinesses = data.businesses.filter((business) => !business.is_demo).length;
  const liveListings = data.products.filter((item) => !item.is_demo).length;
  const liveOffers = data.offers.filter((offer) => !offer.is_demo).length;
  const publishedUpdates = data.updates.filter((update) => !update.is_demo).length;

  return <main className="w-full space-y-6 pb-8">
    <header className="relative isolate -mx-6 -mt-6 overflow-hidden bg-[#03162F] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.2),transparent_65%)]" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">AEOS · Public experience</p>
      <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Website management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Manage the public Alessandro Enterprises website. Published business records, product listings, offers and updates appear here directly from AEOS.</p></div>
        <Link href="/" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#03162F] transition hover:-translate-y-0.5 hover:bg-[#e7c958]">Preview public website <Eye className="size-4" /></Link>
      </div>
    </header>

    <section aria-label="Website management tools" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map(({ title, detail, href, label, icon: Icon, tone }) => <article key={title} className="flex min-h-[176px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md sm:p-5">
        <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span><h2 className="mt-3 text-base font-black text-[#03162F]">{title}</h2><p className="mt-1 flex-1 text-sm leading-5 text-slate-600">{detail}</p><Link href={href} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#03162F] hover:text-[#8B6A0B]">{label}<ArrowUpRight className="size-4" /></Link>
      </article>)}
      <article className="flex min-h-[176px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Eye className="size-5" /></span><h2 className="mt-3 text-base font-black text-[#03162F]">Preview the live website</h2><p className="mt-1 flex-1 text-sm leading-5 text-slate-600">Check the public pages as visitors see them after content changes.</p><Link href="/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#03162F] hover:text-[#8B6A0B]">Open website preview<ArrowUpRight className="size-4" /></Link>
      </article>
    </section>

    <section aria-label="Live website content" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard label="Live businesses" value={liveBusinesses} detail={`${data.businesses.length} visible including sample profiles`} />
      <StatusCard label="Published catalogue" value={liveListings} detail={`${data.products.length} visible listings`} />
      <StatusCard label="Active offers" value={liveOffers} detail={`${data.offers.length} visible offers`} />
      <StatusCard label="Published updates" value={publishedUpdates} detail={`${data.updates.length} website updates`} />
    </section>

    <section className="space-y-4" aria-label="Content publishing workspace">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A7412]">Publishing workspace</p><h2 className="mt-1 text-2xl font-black text-[#03162F]">Manage website content</h2><p className="mt-1 text-sm text-slate-600">Review what customers can see, then open the matching AEOS editor to add, update or remove content.</p></div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ContentAreaCard title="Products & services" detail="Published catalogue listings from enterprise businesses." count={data.products.length} items={data.products.slice(0, 4).map((item) => item.name)} href="/dashboard/enterprise/content?section=products" action="Edit catalogue" icon={PackageSearch} />
        <ContentAreaCard title="Offers & promotions" detail="Active promotions shown on the public offers page." count={data.offers.length} items={data.offers.slice(0, 4).map((item) => item.title)} href="/dashboard/enterprise/content?section=promotions" action="Edit offers" icon={Megaphone} />
        <ContentAreaCard title="Website posts" detail="Published updates and announcements from business teams." count={data.updates.length} items={data.updates.slice(0, 4).map((item) => item.title)} href="/dashboard/enterprise/content?section=posts" action="Edit posts" icon={FileText} />
        <ContentAreaCard title="Images & galleries" detail="Published gallery images used across business pages." count={data.gallery.length} items={data.gallery.slice(0, 4).map((item) => item.title || item.caption || "Untitled gallery image")} href="/dashboard/enterprise/content?section=gallery" action="Edit galleries" icon={FileImage} />
      </div>
    </section>

    {data.connectionIssues.length > 0 && <aside className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><div className="flex items-start gap-2"><CircleAlert className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">AEOS website data needs attention</p><ul className="mt-2 list-inside list-disc space-y-1">{data.connectionIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div></div></aside>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black text-[#03162F]">Website pages</h2><p className="mt-1 text-sm text-slate-500">Preview the actual public page and confirm whether it is enabled.</p></div><Link href="/dashboard/settings?section=website" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#03162F] hover:text-[#8B6A0B]">Configure visibility <Settings2 className="size-4" /></Link></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{managedPages.map(({ label, href, icon: Icon, setting }) => {
        const enabled = setting ? data.website[setting] : true;
        return <article key={href} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-[#03162F]"><Icon className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-[#03162F]">{label}</p><p className={`mt-0.5 text-xs font-semibold ${enabled ? "text-emerald-700" : "text-slate-500"}`}>{enabled ? "Visible" : "Hidden in settings"}</p></div></div>
          <Link aria-label={`Preview ${label}`} href={href} target="_blank" rel="noreferrer" className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-[#D4AF37] hover:text-[#03162F]"><ArrowUpRight className="size-4" /></Link>
        </article>;
      })}</div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]" aria-label="Website setup and readiness">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A7412]">Brand & configuration</p><h2 className="mt-1 text-xl font-black text-[#03162F]">Website identity</h2><p className="mt-1 text-sm text-slate-600">Review the brand information currently connected to the public website.</p></div><Link href="/dashboard/settings?section=website" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-[#03162F] hover:border-amber-400 hover:bg-amber-50">Edit website settings<Settings2 className="size-4" /></Link></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">{[
          ["Website title", data.website.title || data.company.company_name],
          ["Tagline", data.company.tagline || "Not set"],
          ["Homepage headline", data.website.homepage_heading || "Welcome to Alessandro Enterprises"],
          ["Search description", data.website.meta_description || "Using the default page description"],
          ["Brand logo", data.website.logo_url || data.company.logo_url ? "Logo configured" : "Using the AEOS brand logo"],
          ["Browser icon", data.website.favicon_url ? "Custom browser icon configured" : "Using the AEOS brand icon"],
          ["Facebook page", data.website.facebook_page_url || "Not connected — add the Page URL in website settings"],
          ["Facebook feed", data.website.show_facebook_feed ? "Enabled on the home page" : "Disabled"],
          ["Contact details", data.website.show_contact_information ? "Shown on public pages" : "Hidden on public pages"],
          ["Business directory", data.website.show_businesses ? "Visible to visitors" : "Hidden from visitors"],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-[#03162F]">{value}</dd></div>)}</dl>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A7412]">Quality check</p><h2 className="mt-1 text-xl font-black text-[#03162F]">Publishing readiness</h2><p className="mt-1 text-sm text-slate-600">Keep the main visitor journey complete and current.</p>
        <div className="mt-4 space-y-2">{[
          ["Business profiles", liveBusinesses > 0, `${liveBusinesses} live businesses`],
          ["Catalogue content", liveListings > 0, `${liveListings} live listings`],
          ["Offers", liveOffers > 0, `${liveOffers} live offers`],
          ["Website updates", publishedUpdates > 0, `${publishedUpdates} live updates`],
          ["Website connection", data.connectionIssues.length === 0, data.connectionIssues.length ? `${data.connectionIssues.length} connection issue(s)` : "AEOS content is connected"],
        ].map(([label, ready, detail]) => <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{ready ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}</span><div className="min-w-0"><p className="text-sm font-bold text-[#03162F]">{label}</p><p className="text-xs text-slate-600">{detail}</p></div></div>)}</div>
        <Link href="/" target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#03162F] px-4 py-3 text-sm font-bold text-white hover:bg-[#0A2852]">Review public website<Eye className="size-4" /></Link>
      </article>
    </section>

    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#03162F] text-[#D4AF37]"><CheckCircle2 className="size-5" /></span><div><h2 className="font-black text-[#03162F]">Connected customer journey</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Visitors discover your businesses and public catalogue here, then continue to AEOS to request services, book appointments, order products or contact support.</p></div></div>
      <Link href="/customer" target="_blank" rel="noreferrer" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#03162F] transition hover:border-[#D4AF37] hover:bg-amber-50">Open customer portal <ArrowUpRight className="size-4" /></Link>
    </section>
  </main>;
}

function StatusCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#03162F]">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>;
}

function ContentAreaCard({ title, detail, count, items, href, action, icon: Icon }: { title: string; detail: string; count: number; items: string[]; href: string; action: string; icon: typeof FileImage }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#03162F]"><Icon className="size-5" /></span><div><h3 className="font-black text-[#03162F]">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-[#03162F]">{count}</span></div><div className="mt-4 border-t border-slate-100 pt-3">{items.length ? <ul className="space-y-2">{items.map((item, index) => <li key={`${item}:${index}`} className="truncate text-sm text-slate-700">• {item}</li>)}</ul> : <p className="text-sm text-slate-500">No published items yet. Add content to make this section visible to visitors.</p>}</div><Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#03162F] hover:text-[#8B6A0B]">{action}<ArrowUpRight className="size-4" /></Link></article>;
}
