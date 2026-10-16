"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X, LoaderCircle, ArrowLeft, Headset } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ChatRole = "customer" | "staff";
type ChatSession = { id: string; customer_id: string; status: "Open" | "Closed"; last_message_at: string; customers?: { full_name: string | null } | { full_name: string | null }[] | null };
type ChatMessage = { id: string; session_id: string; sender_auth_user_id: string; sender_role: ChatRole; sender_name: string; body: string; created_at: string };

export default function FloatingLiveChat({ role }: { role: ChatRole }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const handledIncomingMessageIds = useRef(new Set<string>());

  const loadStaffSessions = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("customer_live_chat_sessions")
      .select("id,customer_id,status,last_message_at,customers(full_name)")
      .eq("status", "Open")
      .order("last_message_at", { ascending: false });
    if (queryError) throw queryError;
    const next = (data ?? []) as ChatSession[];
    setSessions(next);
    setActiveSession((current) => current ? next.find((session) => session.id === current.id) ?? null : next[0] ?? null);
  }, []);

  // Keep a lightweight listener active while the panel is closed so new
  // incoming messages can be surfaced on the floating button.
  useEffect(() => {
    let alive = true;
    const identify = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive || !user) return;
      setUserId(user.id);
      if (role === "customer") {
        const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
        if (!alive || !customer) return;
        setCustomerId(customer.id);
      }
    };
    void identify();
    return () => { alive = false; };
  }, [role]);

  useEffect(() => {
    if (!userId || (role === "customer" && !customerId)) return;
    let alive = true;
    const channel = supabase.channel(`aeos-live-chat-unread-${role}-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "customer_live_chat_sessions",
        ...(role === "customer" && customerId ? { filter: `customer_id=eq.${customerId}` } : {}),
      }, async (event) => {
        const session = event.new as ChatSession;
        if (session.status !== "Open") return;
        const { data: latestMessage } = await supabase
          .from("customer_live_chat_messages")
          .select("id,sender_role")
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!alive || !latestMessage || latestMessage.sender_role === role || handledIncomingMessageIds.current.has(latestMessage.id)) return;
        handledIncomingMessageIds.current.add(latestMessage.id);
        if (open && activeSession?.id === session.id) return;
        setUnreadCount((count) => count + 1);
      })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [userId, role, customerId, open, activeSession?.id]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const load = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (alive) setIdentityError(role === "customer" ? "Please sign in to chat with AEOS." : "Your staff session has expired. Sign in again to view chats.");
          return;
        }
        if (!alive) return;
        setUserId(user.id);
        const metadataName = String(user.user_metadata?.display_name || user.user_metadata?.full_name || "");

        if (role === "customer") {
          const { data: customer, error: customerError } = await supabase.from("customers").select("id,full_name").eq("auth_user_id", user.id).maybeSingle();
          if (customerError) throw customerError;
          if (!customer) {
            if (alive) setIdentityError("We couldn’t find your customer profile. Please contact AEOS support.");
            return;
          }
          if (!alive) return;
          setCustomerId(customer.id);
          setDisplayName(customer.full_name?.trim() || metadataName || user.email || "Customer");
          const { data: current, error: sessionError } = await supabase.from("customer_live_chat_sessions").select("id,customer_id,status,last_message_at").eq("customer_id", customer.id).eq("status", "Open").order("last_message_at", { ascending: false }).limit(1).maybeSingle();
          if (sessionError) throw sessionError;
          if (alive) setActiveSession(current as ChatSession | null);
        } else {
          const { data: profile, error: profileError } = await supabase.from("profiles").select("id,display_name,first_name,last_name").eq("auth_user_id", user.id).maybeSingle();
          if (profileError) throw profileError;
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
          if (alive) setDisplayName(profile?.display_name?.trim() || name || metadataName || user.email || "AEOS Team");
          await loadStaffSessions();
        }
      } catch (cause) {
        console.error("Live chat load error:", cause);
        if (alive) setError("Live chat is temporarily unavailable. Please try again shortly.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, [open, role, loadStaffSessions]);

  useEffect(() => {
    if (!open || role !== "staff") return;
    const channel = supabase.channel("aeos-live-chat-queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_live_chat_sessions" }, () => { void loadStaffSessions(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [open, role, loadStaffSessions]);

  useEffect(() => {
    if (!open || !activeSession) return;
    let alive = true;
    const loadMessages = async () => {
      const { data, error: queryError } = await supabase.from("customer_live_chat_messages").select("id,session_id,sender_auth_user_id,sender_role,sender_name,body,created_at").eq("session_id", activeSession.id).order("created_at", { ascending: true }).limit(250);
      if (queryError) {
        console.error("Live chat message load error:", queryError);
        if (alive) setError("Could not load this conversation. Please try again.");
        return;
      }
      if (alive) setMessages((data ?? []) as ChatMessage[]);
    };
    void loadMessages();
    const channel = supabase.channel(`aeos-live-chat-session-${activeSession.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_live_chat_messages", filter: `session_id=eq.${activeSession.id}` }, (event) => {
        const incoming = event.new as ChatMessage;
        if (alive) setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
      })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [open, activeSession]);

  const activeCustomerName = useMemo(() => {
    const customer = Array.isArray(activeSession?.customers) ? activeSession.customers[0] : activeSession?.customers;
    return customer?.full_name?.trim() || "Customer";
  }, [activeSession]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !userId || sending) return;
    setSending(true);
    setError("");
    try {
      let session = activeSession;
      if (role === "customer" && !session) {
        if (!customerId) throw new Error("We couldn’t verify your customer profile.");
        const { data, error: createError } = await supabase.from("customer_live_chat_sessions").insert({ customer_id: customerId }).select("id,customer_id,status,last_message_at").single();
        if (createError) throw createError;
        session = data as ChatSession;
        setActiveSession(session);
      }
      if (!session) throw new Error("Select a customer chat first.");
      const { data, error: sendError } = await supabase.from("customer_live_chat_messages").insert({
        session_id: session.id,
        sender_auth_user_id: userId,
        sender_role: role,
        sender_name: displayName || (role === "staff" ? "AEOS Team" : "Customer"),
        body,
      }).select("id,session_id,sender_auth_user_id,sender_role,sender_name,body,created_at").single();
      if (sendError) throw sendError;
      setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data as ChatMessage]);
      setDraft("");
      if (role === "staff") await loadStaffSessions();
    } catch (cause) {
      console.error("Live chat send error:", cause);
      setError(cause instanceof Error && cause.message.startsWith("We couldn’t") ? cause.message : "Your message couldn’t be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function closeSession() {
    if (!activeSession) return;
    const { error: updateError } = await supabase.from("customer_live_chat_sessions").update({ status: "Closed" }).eq("id", activeSession.id);
    if (updateError) {
      console.error("Live chat close error:", updateError);
      setError("This chat couldn’t be closed. Please try again.");
      return;
    }
    setActiveSession(null);
    await loadStaffSessions();
  }

  const panelBottom = role === "customer" ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom))]" : "bottom-24";

  return (
    <>
      {open && <section aria-label="Live chat" className={`fixed right-3 z-[95] flex h-[min(560px,calc(100dvh-10rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ${panelBottom}`}>
        <header className="flex shrink-0 items-center justify-between bg-[#03162F] px-4 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-3">
            {role === "staff" && activeSession && <button type="button" onClick={() => setActiveSession(null)} aria-label="Back to chat queue" className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]"><Headset className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="truncate text-sm font-black">{role === "staff" ? activeSession ? activeCustomerName : "Customer live chat" : "AEOS Live Chat"}</p><p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-blue-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{role === "staff" ? activeSession ? "Customer conversation" : `${sessions.length} open conversation${sessions.length === 1 ? "" : "s"}` : "Chat directly with our team"}</p></div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close live chat" className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        {role === "staff" && !activeSession && !loading && !error ? <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
          {sessions.length ? <div className="space-y-2">{sessions.map((session) => {
            const customer = Array.isArray(session.customers) ? session.customers[0] : session.customers;
            return <button key={session.id} type="button" onClick={() => { setMessages([]); setError(""); setActiveSession(session); }} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[#D4AF37]">
              <span className="block text-sm font-bold text-[#03162F]">{customer?.full_name || "Customer"}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{session.last_message_at ? new Date(session.last_message_at).toLocaleString("en-ZM", { dateStyle: "short", timeStyle: "short" }) : "New conversation"}</span>
            </button>;
          })}</div> : <p className="px-4 py-10 text-center text-sm text-slate-500">No open customer chats right now.</p>}
        </div> : <>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {loading ? <div className="flex h-full items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Connecting to live chat…</div>
              : identityError ? <p className="mx-auto mt-10 max-w-[260px] text-center text-sm text-slate-600">{identityError}</p>
              : !activeSession && role === "customer" ? <div className="mx-auto mt-12 max-w-[260px] text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#03162F] text-[#D4AF37]"><MessageCircle className="h-6 w-6" /></div><p className="mt-4 text-sm font-bold text-[#03162F]">How can we help?</p><p className="mt-1 text-xs leading-5 text-slate-500">Send a message and an AEOS team member will reply here.</p></div>
              : messages.length === 0 ? <p className="mt-8 text-center text-xs text-slate-500">You’re connected. Send a message to start chatting.</p>
              : messages.map((message) => <div key={message.id} className={`flex ${message.sender_role === role ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${message.sender_role === role ? "rounded-br-md bg-[#03162F] text-white" : "rounded-bl-md border border-slate-200 bg-white text-[#03162F]"}`}><p className={`mb-1 text-[10px] font-bold ${message.sender_role === role ? "text-[#E6C84E]" : "text-slate-500"}`}>{message.sender_role === "staff" ? role === "staff" ? "You" : "AEOS Team" : role === "customer" ? "You" : message.sender_name}</p><p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p><p className={`mt-1 text-right text-[9px] ${message.sender_role === role ? "text-white/60" : "text-slate-400"}`}>{new Date(message.created_at).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}</p></div></div>)}
          </div>
          {error && <p className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p>}
          {!identityError && (role === "customer" || Boolean(activeSession)) && <form onSubmit={sendMessage} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
            {role === "staff" && activeSession && <button type="button" onClick={closeSession} title="Close conversation" className="h-10 shrink-0 rounded-xl border border-slate-200 px-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50">Close</button>}
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="Type your message…" className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" />
            <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F] transition hover:bg-[#e6c65f] disabled:cursor-not-allowed disabled:opacity-50">{sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
          </form>}
        </>}
      </section>}

      <button type="button" onClick={() => { if (open) { setOpen(false); return; } setUnreadCount(0); setLoading(true); setError(""); setIdentityError(""); setMessages([]); setOpen(true); }} aria-label={open ? "Close live chat" : unreadCount ? `Open live chat, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}` : "Open live chat"} title={open ? "Close live chat" : "Open live chat"} className={`fixed right-4 z-[96] flex h-14 w-14 items-center justify-center rounded-full bg-[#03162F] text-white shadow-xl ring-2 ring-white/90 transition hover:scale-105 hover:bg-[#0A2852] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/70 ${role === "customer" ? "bottom-[calc(6rem+env(safe-area-inset-bottom))]" : "bottom-6"}`}>
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && <span aria-label={`${unreadCount} unread messages`} className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-black leading-none text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
    </>
  );
}
