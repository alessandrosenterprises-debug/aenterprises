"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, ExternalLink, LoaderCircle, Megaphone, RefreshCw, Send, Settings2, Share2 as Facebook, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelFacebookQueueItemAction, retryFacebookQueueItemAction, runFacebookPublishingAction, verifyFacebookPageConnectionAction } from "@/app/dashboard/website/social/actions";

type QueueItem = {
  id: string;
  business_id: string;
  content_type: string;
  content_id: string;
  title: string;
  message: string;
  media_url: string | null;
  link_url: string | null;
  scheduled_at: string;
  status: string;
  attempt_count: number;
  next_attempt_at: string | null;
  facebook_post_id: string | null;
  published_at: string | null;
  last_error: string | null;
  created_at: string;
  businesses: { name: string } | { name: string }[] | null;
};

const statusStyle: Record<string, string> = {
  pending: "bg-blue-50 text-blue-800",
  processing: "bg-violet-50 text-violet-800",
  retrying: "bg-amber-50 text-amber-900",
  published: "bg-emerald-50 text-emerald-800",
  failed: "bg-red-50 text-red-800",
  paused: "bg-slate-100 text-slate-700",
  needs_review: "bg-orange-50 text-orange-900",
  cancelled: "bg-slate-100 text-slate-500",
};

function relationName(value: QueueItem["businesses"]) { return Array.isArray(value) ? value[0]?.name ?? "Alessandro Enterprises" : value?.name ?? "Alessandro Enterprises"; }
function displayDate(value: string | null) { return value ? new Date(value).toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

export default function FacebookPublishingDashboard({ items, migrationError, pageId, hasPageToken, hasCronSecret }: { items: QueueItem[]; migrationError: string | null; pageId: string; hasPageToken: boolean; hasCronSecret: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [verifiedPage, setVerifiedPage] = useState("");
  const connected = pageId !== "Not configured" && hasPageToken;
  const pending = items.filter((item) => item.status === "pending" || item.status === "retrying").length;
  const published = items.filter((item) => item.status === "published").length;
  const attention = items.filter((item) => ["failed", "paused", "needs_review"].includes(item.status)).length;

  function runNow() {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await runFacebookPublishingAction();
        setMessage(`Publisher checked ${result.claimed} due item(s): ${result.published} published, ${result.retrying} retrying, ${result.paused} paused, ${result.failed} failed, ${result.needsReview} need review.`);
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not run the publisher."); }
    });
  }

  function verifyPage() {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await verifyFacebookPageConnectionAction();
        if (result.ok) {
          setVerifiedPage(result.pageName ?? "Facebook Page");
          setMessage(`Meta verified the connection to ${result.pageName ?? "your Facebook Page"}.`);
        } else {
          setVerifiedPage("");
          setMessage(result.error ?? "Meta could not verify this Page connection.");
        }
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not verify the Facebook Page connection."); }
    });
  }

  function retry(item: QueueItem) {
    if (item.status === "needs_review" && !window.confirm("Check the Facebook Page first. If Facebook already posted this update, retrying may publish a duplicate. Retry anyway?")) return;
    startTransition(async () => {
      try { await retryFacebookQueueItemAction(item.id); toast.success("Facebook post retry started."); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not retry this post."); }
    });
  }

  function cancel(item: QueueItem) {
    if (!window.confirm(`Cancel the scheduled Facebook post “${item.title}”?`)) return;
    startTransition(async () => {
      try { await cancelFacebookQueueItemAction(item.id); toast.success("Scheduled Facebook post cancelled."); router.refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Could not cancel this post."); }
    });
  }

  return <main className="w-full space-y-5 pb-8">
    <header className="relative -mx-6 -mt-6 overflow-hidden bg-[#03162F] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(24,119,242,0.3),transparent_68%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">AEOS · Social publishing</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Facebook publishing</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Queue website content, publish immediately or schedule it, and review every result from one place.</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/enterprise/content" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Manage website content<ArrowUpRight className="size-4" /></Link><button type="button" disabled={busy || Boolean(migrationError)} onClick={runNow} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-bold text-white hover:bg-[#0d65d9] disabled:opacity-60">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Run publisher now</button></div></div>
    </header>

    {migrationError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><p className="font-black">Publishing queue is not installed</p><p className="mt-1">{migrationError}</p></div></div>}
    {message && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</p>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Publishing summary">
      <Summary icon={connected ? CheckCircle2 : AlertCircle} label="Page connection" value={connected ? "Ready" : "Setup needed"} detail={pageId} tone={connected ? "text-emerald-800 bg-emerald-50" : "text-amber-900 bg-amber-50"} />
      <Summary icon={CalendarClock} label="Queued / scheduled" value={pending} detail="Waiting to publish" tone="text-blue-800 bg-blue-50" />
      <Summary icon={CheckCircle2} label="Published" value={published} detail="Successful Facebook posts" tone="text-emerald-800 bg-emerald-50" />
      <Summary icon={AlertCircle} label="Needs attention" value={attention} detail="Review errors or authorization" tone={attention ? "text-red-800 bg-red-50" : "text-slate-700 bg-slate-100"} />
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1877F2]"><Facebook className="size-5" /></span><div><h2 className="text-lg font-black text-[#03162F]">Connection and security</h2><p className="mt-1 text-sm leading-6 text-slate-600">The Page token stays in the server environment. It is never stored in the publishing history or sent to the browser.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><CheckLine label="Facebook Page ID" value={pageId} ready={pageId !== "Not configured"} /><CheckLine label="Page access token" value={hasPageToken ? "Configured on server" : "Missing server secret"} ready={hasPageToken} /><CheckLine label="Meta credential check" value={verifiedPage || "Not checked in this session"} ready={Boolean(verifiedPage)} /><CheckLine label="Scheduled worker secret" value={hasCronSecret ? "Configured" : "Missing CRON_SECRET"} ready={hasCronSecret} /></div><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={busy || !connected} onClick={verifyPage} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-800 hover:bg-blue-50 disabled:opacity-50">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}Check Page credentials</button><p className="text-xs leading-5 text-slate-500">Add local secrets to <code>.env.local</code> and production secrets in Vercel project settings. The token is never sent to the browser.</p></div><Link href="/dashboard/settings?section=website" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#03162F] hover:text-blue-700">Website Facebook settings<Settings2 className="size-4" /></Link></article>
      <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-800"><ShieldCheck className="size-5" /></span><div><h2 className="text-lg font-black text-[#03162F]">Publishing rules</h2><p className="mt-1 text-sm leading-6 text-slate-700">Eligible public content is queued when saved in the AEOS content editor.</p></div></div><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700"><li><strong>Products and services:</strong> publish immediately when active.</li><li><strong>Announcements:</strong> publish immediately or at the saved publish time.</li><li><strong>Promotions:</strong> publish immediately, at the promotion start time, or at a custom Facebook time.</li><li><strong>Duplicates:</strong> repeated saves of identical content are deduplicated; parallel workers cannot claim the same item.</li></ul><p className="mt-3 text-xs leading-5 text-amber-950">If a request times out after Facebook may have accepted it, AEOS flags it for review instead of blindly reposting.</p></article>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-black text-[#03162F]">Queue and publishing history</h2><p className="mt-1 text-sm text-slate-600">Recent posts and scheduled work, including failures that need attention.</p></div><span className="text-sm font-semibold text-slate-500">Latest {items.length} items</span></div>
      {items.length === 0 ? <div className="px-5 py-12 text-center"><Megaphone className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-bold text-[#03162F]">No Facebook posts queued yet</h3><p className="mt-1 text-sm text-slate-600">New eligible products, services, promotions and announcements can be published from Business Content.</p><Link href="/dashboard/enterprise/content" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#03162F] px-4 py-2.5 text-sm font-bold text-white">Open Business Content<ArrowUpRight className="size-4" /></Link></div> : <div className="divide-y divide-slate-100">{items.map((item) => <QueueRow key={item.id} item={item} busy={busy} onRetry={() => retry(item)} onCancel={() => cancel(item)} />)}</div>}
    </section>
  </main>;
}

function Summary({ icon: Icon, label, value, detail, tone }: { icon: typeof CheckCircle2; label: string; value: string | number; detail: string; tone: string }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-600">{label}</p><span className={`grid size-8 place-items-center rounded-lg ${tone}`}><Icon className="size-4" /></span></div><p className="mt-2 truncate text-xl font-black text-[#03162F]">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{detail}</p></article>;
}

function CheckLine({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  const Icon = ready ? CheckCircle2 : AlertCircle;
  return <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5"><Icon className={`size-4 shrink-0 ${ready ? "text-emerald-700" : "text-amber-700"}`} /><div className="min-w-0"><p className="text-xs font-bold text-slate-700">{label}</p><p className="truncate text-xs text-slate-600">{value}</p></div></div>;
}

function QueueRow({ item, busy, onRetry, onCancel }: { item: QueueItem; busy: boolean; onRetry: () => void; onCancel: () => void }) {
  const canRetry = ["failed", "paused", "needs_review", "retrying"].includes(item.status);
  const canCancel = ["pending", "retrying", "paused"].includes(item.status);
  return <article className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_160px_190px_auto] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="max-w-full truncate text-sm font-black text-[#03162F]">{item.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${statusStyle[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-slate-600">{relationName(item.businesses)} · {item.content_type} · {item.attempt_count} attempt(s)</p>{item.last_error && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">{item.last_error}</p>}</div><div className="text-xs text-slate-600"><span className="block font-bold text-slate-500">Scheduled</span>{displayDate(item.scheduled_at)}</div><div className="text-xs text-slate-600"><span className="block font-bold text-slate-500">{item.published_at ? "Published" : item.next_attempt_at ? "Next retry" : "Facebook post"}</span>{item.published_at ? displayDate(item.published_at) : item.next_attempt_at ? displayDate(item.next_attempt_at) : item.facebook_post_id || "Not published"}</div><div className="flex flex-wrap gap-2 lg:justify-end">{item.status === "published" && item.facebook_post_id && <a href={`https://www.facebook.com/${encodeURIComponent(item.facebook_post_id)}`} target="_blank" rel="noopener noreferrer" aria-label="Open Facebook post" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-[#03162F] hover:border-blue-300"><ExternalLink className="size-3.5" />View</a>}{canRetry && <button type="button" disabled={busy} onClick={onRetry} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 text-xs font-bold text-white hover:bg-[#0d65d9] disabled:opacity-60"><Send className="size-3.5" />Retry</button>}{canCancel && <button type="button" disabled={busy} onClick={onCancel} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><XCircle className="size-3.5" />Cancel</button>}</div>{item.status === "processing" && <p className="flex items-center gap-2 text-xs font-semibold text-violet-800"><Clock3 className="size-3.5" />Publishing now</p>}</article>;
}
