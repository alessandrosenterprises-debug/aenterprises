"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Heart, MessageCircle, Send } from "lucide-react";
import { communitySupabase } from "@/lib/supabase/community-browser";
import type { PublicBusiness, PublicOffer, PublicUpdate } from "@/modules/website/services/public-website.service";

type FeedItem = { id: string; type: "post" | "offer"; title: string; message: string; image_url: string | null; created_at: string | null; business_name: string; business_slug: string };
type FeedComment = { id: string; visitor_name: string; message: string; created_at: string };
type FeedStats = { like_count: number; comment_count: number; liked_by_visitor: boolean; recent_comments: FeedComment[] };

export default function PublicCommunityFeed({ updates, offers, businesses }: { updates: PublicUpdate[]; offers: PublicOffer[]; businesses: PublicBusiness[] }) {
  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const items = useMemo(() => [
    ...updates.filter((post) => !post.is_demo).map((post): FeedItem => ({ id: post.id, type: "post", title: post.title, message: post.content ?? "", image_url: post.image_url, created_at: post.published_at, business_name: businessById.get(post.business_id)?.name ?? "Alessandro Enterprises", business_slug: businessById.get(post.business_id)?.slug ?? "" })),
    ...offers.filter((offer) => !offer.is_demo).map((offer): FeedItem => ({ id: offer.id, type: "offer", title: offer.title, message: [offer.discount_text, offer.description].filter(Boolean).join(" · "), image_url: offer.image_url, created_at: offer.created_at ?? null, business_name: businessById.get(offer.business_id)?.name ?? "Alessandro Enterprises", business_slug: businessById.get(offer.business_id)?.slug ?? "" })),
  ].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()), [updates, offers, businessById]);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleName, setGoogleName] = useState("");
  const [stats, setStats] = useState<Record<string, FeedStats>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [signInError, setSignInError] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("community_auth") === "google_error" ? "Google sign-in couldn’t be completed. Please try again." : "");

  const loadStats = useCallback(async () => {
    if (!items.length) return;
    const params = new URLSearchParams();
    items.forEach((item) => params.append("target", `${item.type}:${item.id}`));
    try {
      const response = await fetch(`/api/community/interactions?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as { items: Array<FeedStats & { content_type: string; content_id: string }> };
      const next: Record<string, FeedStats> = {};
      for (const entry of result.items ?? []) next[`${entry.content_type}:${entry.content_id}`] = entry;
      setStats(next);
    } catch {
      // The feed remains readable if interaction counts are temporarily offline.
    }
  }, [items]);

  useEffect(() => {
    let active = true;
    const syncAuth = (user: Awaited<ReturnType<typeof communitySupabase.auth.getUser>>["data"]["user"]) => {
      if (!active) return;
      const providers = user?.app_metadata?.providers;
      const google = user?.app_metadata?.provider === "google" || (Array.isArray(providers) && providers.includes("google"));
      setIsGoogleUser(Boolean(google));
      setGoogleName(String(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.given_name || user?.email?.split("@")[0] || ""));
    };
    void communitySupabase.auth.getUser().then(({ data }) => syncAuth(data.user));
    void loadStats();
    const { data: { subscription } } = communitySupabase.auth.onAuthStateChange((_event, session) => {
      syncAuth(session?.user ?? null);
      window.setTimeout(() => void loadStats(), 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [loadStats]);

  const continueWithGoogle = async () => {
    setSignInError("");
    const currentUrl = new URL(window.location.href);
    const isProtectedVercelDeployment = currentUrl.hostname.endsWith(".vercel.app") && currentUrl.hostname !== "aenterprises-dashboard.vercel.app";
    if (isProtectedVercelDeployment) {
      // Switch to the public production origin before starting OAuth so the
      // browser keeps the PKCE verifier on the same origin through the callback.
      window.location.replace("https://aenterprises-dashboard.vercel.app/community");
      return;
    }
    const redirectTo = `${currentUrl.origin}/auth/callback?next=${encodeURIComponent("/community")}`;
    try {
      const result = await communitySupabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      if (result.error) {
        console.error("Community Google sign-in could not start", { code: result.error.code, message: result.error.message });
        setSignInError(/provider is not enabled|unsupported provider/i.test(result.error.message) ? "Google sign-in is not enabled for the website yet." : "Google sign-in could not start. Please try again.");
      }
    } catch (error) {
      console.error("Community Google sign-in failed unexpectedly", error);
      setSignInError("Google sign-in could not start. Please try again.");
    }
  };

  const sendAction = async (item: FeedItem, action: "like" | "unlike" | "comment") => {
    const key = `${item.type}:${item.id}`;
    setPending(key);
    setNotice((current) => ({ ...current, [key]: "" }));
    try {
      const response = await fetch("/api/community/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, contentType: item.type, contentId: item.id, message: messages[key] ?? "" }),
      });
      const result = await response.json() as { error?: string };
      if (response.ok) {
        if (action === "comment") setMessages((current) => ({ ...current, [key]: "" }));
        await loadStats();
      } else setNotice((current) => ({ ...current, [key]: result.error ?? "That action could not be completed." }));
    } catch {
      setNotice((current) => ({ ...current, [key]: "That action could not be completed. Check your connection and try again." }));
    } finally {
      setPending(null);
    }
  };

  if (!items.length) return <div className="public-community-empty"><MessageCircle aria-hidden="true" /><h2>There are no updates yet</h2><p>New business posts and offers will appear here.</p></div>;

  return <div className="public-community-feed">{items.map((item) => {
    const key = `${item.type}:${item.id}`;
    const itemStats = stats[key] ?? { like_count: 0, comment_count: 0, liked_by_visitor: false, recent_comments: [] };
    return <article className="public-community-card" key={key}>
      <header><span className="public-community-avatar">{item.business_name.slice(0, 1)}</span><div><strong>{item.business_name}</strong><span>{item.type === "offer" ? "Promotion" : "Business update"}{item.created_at ? ` · ${new Date(item.created_at).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lusaka" })}` : ""}</span></div><span className={`public-community-kind ${item.type}`}>{item.type === "offer" ? "Offer" : "Update"}</span></header>
      <div className="public-community-copy"><h2>{item.title}</h2>{item.message && <p>{item.message}</p>}</div>
      {item.image_url && <div className="public-community-image"><Image src={item.image_url} alt={item.title} fill unoptimized sizes="(max-width: 760px) 100vw, 720px" className="object-cover" /></div>}
      <div className="public-community-totals"><span>{itemStats.like_count} {itemStats.like_count === 1 ? "like" : "likes"}</span><button type="button" onClick={() => setOpenComments((current) => ({ ...current, [key]: !current[key] }))}>{itemStats.comment_count} {itemStats.comment_count === 1 ? "comment" : "comments"}</button></div>
      <div className="public-community-actions"><button type="button" aria-pressed={itemStats.liked_by_visitor} disabled={pending === key} onClick={() => isGoogleUser ? void sendAction(item, itemStats.liked_by_visitor ? "unlike" : "like") : setOpenComments((current) => ({ ...current, [key]: true }))}><Heart aria-hidden="true" className={itemStats.liked_by_visitor ? "liked" : ""} />{itemStats.liked_by_visitor ? "Liked" : "Like"}</button><button type="button" onClick={() => setOpenComments((current) => ({ ...current, [key]: !current[key] }))}><MessageCircle aria-hidden="true" />Comment</button><a href={item.type === "offer" ? "/offers" : item.business_slug ? `/businesses/${item.business_slug}` : "/businesses"}>Explore <ArrowUpRight aria-hidden="true" /></a></div>
      {openComments[key] && <div className="public-community-comments">
        {itemStats.recent_comments.map((comment) => <div className="public-community-comment" key={comment.id}><strong>{comment.visitor_name}</strong><p>{comment.message}</p></div>)}
        {isGoogleUser ? <form onSubmit={(event) => { event.preventDefault(); void sendAction(item, "comment"); }}><p className="public-community-account-note">Commenting as <strong>{googleName || "Google account"}</strong></p><label><span>Comment</span><textarea maxLength={1200} required value={messages[key] ?? ""} onChange={(event) => setMessages((current) => ({ ...current, [key]: event.target.value }))} placeholder="Write a comment..." rows={3} /></label>{notice[key] && <p className="public-community-notice" role="alert">{notice[key]}</p>}<button type="submit" disabled={pending === key}><Send aria-hidden="true" />Post comment</button></form> : <div className="public-community-google-prompt"><p>Use your Google account to like and comment. You can browse the website without signing in.</p><button type="button" onClick={() => void continueWithGoogle()}><span aria-hidden="true">G</span>Continue with Google</button>{signInError && <p className="public-community-notice" role="alert">{signInError}</p>}</div>}
      </div>}
    </article>;
  })}</div>;
}
