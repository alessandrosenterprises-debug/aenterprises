import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Headset, MessageCircle, Send, X } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { theme } from "../theme";

type ChatSession = { id: string; customer_id: string; status: "Open" | "Closed"; last_message_at: string };
type ChatMessage = { id: string; session_id: string; sender_auth_user_id: string; sender_role: "customer" | "staff"; sender_name: string; body: string; created_at: string };

export function NativeLiveChat({ customerId, userId, customerName }: { customerId: string; userId: string; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const handledIds = useRef(new Set<string>());
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!customerId || !userId) return;
    let alive = true;
    const channel = supabase.channel(`native-customer-chat-unread-${customerId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "customer_live_chat_sessions", filter: `customer_id=eq.${customerId}` }, async (event) => {
        const changed = event.new as ChatSession;
        if (changed.status !== "Open") return;
        const { data } = await supabase.from("customer_live_chat_messages").select("id,sender_role").eq("session_id", changed.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!alive || !data || data.sender_role === "customer" || handledIds.current.has(data.id)) return;
        handledIds.current.add(data.id);
        if (open && session?.id === changed.id) return;
        setUnread((value) => value + 1);
      })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [customerId, userId, open, session?.id]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    async function loadChat() {
      setLoading(true);
      setError("");
      try {
        const { data, error: sessionError } = await supabase.from("customer_live_chat_sessions").select("id,customer_id,status,last_message_at").eq("customer_id", customerId).eq("status", "Open").order("last_message_at", { ascending: false }).limit(1).maybeSingle();
        if (sessionError) throw sessionError;
        if (alive) setSession(data as ChatSession | null);
      } catch {
        if (alive) setError("Live chat is temporarily unavailable. Please try again shortly.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadChat();
    return () => { alive = false; };
  }, [open, customerId]);

  useEffect(() => {
    if (!open || !session) { setMessages([]); return; }
    let alive = true;
    const loadMessages = async () => {
      const { data, error: queryError } = await supabase.from("customer_live_chat_messages").select("id,session_id,sender_auth_user_id,sender_role,sender_name,body,created_at").eq("session_id", session.id).order("created_at", { ascending: true }).limit(250);
      if (queryError) { if (alive) setError("Could not load this conversation. Please try again."); return; }
      if (alive) setMessages((data ?? []) as ChatMessage[]);
    };
    void loadMessages();
    const channel = supabase.channel(`native-customer-chat-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_live_chat_messages", filter: `session_id=eq.${session.id}` }, (event) => {
        const message = event.new as ChatMessage;
        if (alive) setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [open, session?.id]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      let activeSession = session;
      if (!activeSession) {
        const { data, error: createError } = await supabase.from("customer_live_chat_sessions").insert({ customer_id: customerId }).select("id,customer_id,status,last_message_at").single();
        if (createError) throw createError;
        activeSession = data as ChatSession;
        setSession(activeSession);
      }
      const { data, error: sendError } = await supabase.from("customer_live_chat_messages").insert({ session_id: activeSession.id, sender_auth_user_id: userId, sender_role: "customer", sender_name: customerName || "Customer", body }).select("id,session_id,sender_auth_user_id,sender_role,sender_name,body,created_at").single();
      if (sendError) throw sendError;
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data as ChatMessage]);
      setDraft("");
    } catch {
      setError("Your message couldn’t be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return <View pointerEvents="box-none" style={styles.layer}>
    {open && <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={20} style={styles.panelPosition}>
      <View style={styles.panel}>
        <View style={styles.chatHeader}><View style={styles.headerIcon}><Headset size={18} color={theme.colors.navy} /></View><View style={styles.headerCopy}><Text style={styles.headerTitle}>AEOS Live Chat</Text><Text style={styles.headerSub}>Chat directly with our team</Text></View><Pressable accessibilityLabel="Close live chat" onPress={() => setOpen(false)} style={styles.close}><X size={19} color="#FFFFFF" /></Pressable></View>
        <ScrollView ref={listRef} style={styles.messages} contentContainerStyle={styles.messagesContent} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}>
          {loading ? <View style={styles.loading}><ActivityIndicator color={theme.colors.gold} /><Text style={styles.muted}>Connecting to live chat…</Text></View> : messages.length ? messages.map((message) => <View key={message.id} style={[styles.messageRow, message.sender_role === "customer" && styles.ownRow]}><View style={[styles.bubble, message.sender_role === "customer" ? styles.ownBubble : styles.staffBubble]}><Text style={[styles.sender, message.sender_role === "customer" && styles.ownSender]}>{message.sender_role === "customer" ? "You" : "AEOS Team"}</Text><Text style={[styles.messageBody, message.sender_role === "customer" && styles.ownBody]}>{message.body}</Text><Text style={[styles.time, message.sender_role === "customer" && styles.ownTime]}>{new Date(message.created_at).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}</Text></View></View>) : <View style={styles.welcome}><View style={styles.welcomeIcon}><MessageCircle size={21} color={theme.colors.gold} /></View><Text style={styles.welcomeTitle}>How can we help?</Text><Text style={styles.muted}>Send a message and an AEOS team member will reply here.</Text></View>}
        </ScrollView>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Type your message…" placeholderTextColor="#94A3B8" multiline maxLength={4000} style={styles.input} returnKeyType="send" onSubmitEditing={() => void send()} /><Pressable accessibilityLabel="Send message" disabled={!draft.trim() || sending} onPress={() => void send()} style={[styles.sendButton, (!draft.trim() || sending) && styles.disabled]}>{sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={17} color="#FFFFFF" />}</Pressable></View>
      </View>
    </KeyboardAvoidingView>}
    <Pressable accessibilityRole="button" accessibilityLabel={unread > 0 ? `Open live chat, ${unread} unread messages` : "Open live chat"} onPress={() => { if (open) setOpen(false); else { setUnread(0); setOpen(true); } }} style={styles.fab}>
      {open ? <X size={24} color="#FFFFFF" /> : <MessageCircle size={25} color="#FFFFFF" />}
      {!open && unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text></View>}
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 40 }, panelPosition: { position: "absolute", left: 12, right: 12, bottom: 82, alignItems: "flex-end" }, panel: { width: "100%", maxWidth: 420, height: 460, maxHeight: 520, minHeight: 300, overflow: "hidden", alignSelf: "flex-end", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, backgroundColor: "#FFFFFF", elevation: 16, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }, chatHeader: { minHeight: 59, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: theme.colors.navy, paddingHorizontal: 12 }, headerIcon: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: theme.colors.gold }, headerCopy: { flex: 1 }, headerTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, headerSub: { marginTop: 2, color: "#C7D2E1", fontSize: 9 }, close: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)" }, messages: { flex: 1, backgroundColor: "#F8FAFC" }, messagesContent: { flexGrow: 1, justifyContent: "flex-end", gap: 9, padding: 12 }, loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }, muted: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, textAlign: "center" }, messageRow: { flexDirection: "row", justifyContent: "flex-start" }, ownRow: { justifyContent: "flex-end" }, bubble: { maxWidth: "85%", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }, staffBubble: { borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4, backgroundColor: "#FFFFFF" }, ownBubble: { borderBottomRightRadius: 4, backgroundColor: theme.colors.navy }, sender: { marginBottom: 3, color: theme.colors.muted, fontSize: 8, fontWeight: "800" }, ownSender: { color: theme.colors.goldLight }, messageBody: { color: theme.colors.navy, fontSize: 11, lineHeight: 16 }, ownBody: { color: "#FFFFFF" }, time: { marginTop: 4, color: "#94A3B8", fontSize: 8, textAlign: "right" }, ownTime: { color: "rgba(255,255,255,0.62)" }, welcome: { alignItems: "center", justifyContent: "center", padding: 18 }, welcomeIcon: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: theme.colors.navy }, welcomeTitle: { marginTop: 10, marginBottom: 4, color: theme.colors.navy, fontSize: 12, fontWeight: "900" }, error: { paddingHorizontal: 12, paddingVertical: 7, color: theme.colors.danger, backgroundColor: "#FEF2F2", fontSize: 9 }, composer: { flexDirection: "row", alignItems: "flex-end", gap: 7, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: "#FFFFFF", padding: 9 }, input: { flex: 1, maxHeight: 92, minHeight: 38, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, color: theme.colors.text, paddingHorizontal: 10, paddingVertical: 8, fontSize: 11 }, sendButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: theme.colors.navy }, disabled: { opacity: 0.48 }, fab: { position: "absolute", right: 14, bottom: 79, width: 53, height: 53, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 28, backgroundColor: theme.colors.navy, elevation: 9, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }, badge: { position: "absolute", top: -4, right: -4, minWidth: 19, height: 19, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 10, backgroundColor: "#E11D48", paddingHorizontal: 3 }, badgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
});
