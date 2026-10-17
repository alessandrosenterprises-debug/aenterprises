import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowRight, CalendarDays, Clock3, Package, Plus, Truck } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { theme } from "../theme";

type ActivityKind = "orders" | "bookings";
type Relation = { id?: string; name?: string; full_name?: string } | { id?: string; name?: string; full_name?: string }[] | null;
type ActivityRow = { id: string; status: string | null; payment_status?: string | null; created_at?: string; booking_date?: string; booking_time?: string | null; amount?: number | null; total_amount?: number | null; fulfillment_method?: string | null; delivery_address?: string | null; businesses?: Relation; enterprise_catalog?: Relation; order_items?: { enterprise_catalog?: Relation }[]; branches?: Relation; employees?: Relation };

export function CustomerActivityScreen({ kind, customerId, onNavigate }: { kind: ActivityKind; customerId: string; onNavigate: (path: string) => void }) {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const orders = kind === "orders";
  const title = orders ? "My orders" : "My bookings";

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      const query = orders
        ? supabase.from("orders").select("id, status, payment_status, fulfillment_method, delivery_address, total_amount, created_at, businesses(id, name), order_items(id, enterprise_catalog(id, name, item_type))").eq("customer_id", customerId).order("created_at", { ascending: false })
        : supabase.from("bookings").select("id, booking_date, booking_time, status, payment_status, amount, businesses(id, name), employees(id, full_name), branches(id, name), enterprise_catalog(id, name, item_type)").eq("customer_id", customerId).order("booking_date", { ascending: true }).order("booking_time", { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      setItems((data ?? []) as unknown as ActivityRow[]);
    } catch {
      setFailed(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [customerId, orders]);

  const statuses = items.reduce<Record<string, number>>((count, item) => {
    const status = item.status?.toLowerCase().trim() || "pending";
    count[status] = (count[status] ?? 0) + 1;
    return count;
  }, {});
  const summaryItems = orders
    ? [{ label: "All", value: items.length }, ...["pending", "confirmed", "processing", "ready", "completed", "cancelled"].map((status) => ({ label: formatStatus(status), value: statuses[status] ?? 0 }))]
    : [{ label: "All", value: items.length }, ...["pending", "confirmed", "completed", "cancelled"].map((status) => ({ label: formatStatus(status), value: statuses[status] ?? 0 }))];

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>CUSTOMER ACCOUNT</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{orders ? "Follow your orders and delivery progress." : "Keep up with upcoming appointments and past visits."}</Text></View>
    <View style={styles.body}>
      <View style={styles.summaryRow}>{summaryItems.map((item) => <Summary key={item.label} label={item.label} value={item.value} />)}</View>
      <Pressable onPress={() => onNavigate(orders ? "/customer/orders/new" : "/customer/bookings/new")} style={styles.newButton}><Plus size={16} color="#FFFFFF" /><Text style={styles.newButtonText}>{orders ? "Create an order" : "Book a service"}</Text></Pressable>
      {loading ? <View style={styles.state}><ActivityIndicator color={theme.colors.gold} /><Text style={styles.muted}>Loading {title.toLowerCase()}…</Text></View> : failed ? <View style={styles.empty}><Text style={styles.emptyTitle}>We couldn’t load {title.toLowerCase()}</Text><Text style={styles.muted}>Check your connection and try again.</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : items.length ? <View style={styles.list}>{items.map((item) => <Pressable key={item.id} onPress={() => onNavigate(`/customer/${orders ? "orders" : "bookings"}/${item.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.icon}>{orders ? (item.fulfillment_method?.toLowerCase().includes("delivery") ? <Truck size={19} color={theme.colors.gold} /> : <Package size={19} color={theme.colors.gold} />) : <CalendarDays size={19} color={theme.colors.gold} />}</View>
        <View style={styles.cardBody}><Text style={styles.itemTitle}>{firstOrderItem(item) || relationName(item.enterprise_catalog) || `${orders ? "Order" : "Appointment"} #${item.id.slice(0, 8)}`}</Text><Text style={styles.business}>{relationName(item.businesses) || "Alessandro Enterprises"}</Text><View style={styles.details}><Text style={styles.detailText}>{formatStatus(item.status)}</Text><Text style={styles.dot}>·</Text><Text style={styles.detailText}>{orders ? formatDate(item.created_at) : formatBooking(item.booking_date, item.booking_time)}</Text></View><Text style={styles.amount}>{money(orders ? item.total_amount : item.amount)}</Text>{item.payment_status && <Text style={styles.paymentStatus}>Payment: {formatStatus(item.payment_status)}</Text>}{item.delivery_address && <Text numberOfLines={1} style={styles.deliveryAddress}>Delivery to {item.delivery_address}</Text>}</View>
        <ArrowRight size={16} color="#94A3B8" />
      </Pressable>)}</View> : <View style={styles.empty}>{orders ? <Package size={25} color="#94A3B8" /> : <Clock3 size={25} color="#94A3B8" />}<Text style={styles.emptyTitle}>No {orders ? "orders" : "bookings"} yet</Text><Text style={styles.muted}>{orders ? "Your orders will appear here after you place one." : "Your appointments will appear here after you book a service."}</Text></View>}
    </View>
  </ScrollView>;
}

function Summary({ label, value }: { label: string; value: number }) { return <View style={styles.summary}><Text style={styles.summaryValue}>{value}</Text><Text numberOfLines={1} style={styles.summaryLabel}>{label}</Text></View>; }
function relationName(value: Relation | undefined) { const row = Array.isArray(value) ? value[0] : value; return row?.name ?? undefined; }
function firstOrderItem(item: ActivityRow) { return relationName(item.order_items?.[0]?.enterprise_catalog ?? null); }
function formatStatus(value: string | null) { return (value || "Pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function money(value: number | null | undefined) { return `ZMW ${Number(value ?? 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatDate(value: string | undefined) { return value ? new Date(value).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" }) : "Date not available"; }
function formatBooking(date: string | undefined, time: string | null | undefined) { const when = date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"; return time ? `${when} · ${time.slice(0, 5)}` : when; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background }, content: { paddingBottom: 24 },
  hero: { backgroundColor: theme.colors.navy, paddingHorizontal: 18, paddingTop: 21, paddingBottom: 22 }, eyebrow: { color: theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.7 }, title: { marginTop: 5, color: "#FFFFFF", fontSize: 23, fontWeight: "900" }, subtitle: { marginTop: 5, color: "#C7D2E1", fontSize: 11, lineHeight: 17 },
  body: { gap: 12, padding: 14 }, summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, summary: { width: "31.5%", minHeight: 56, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, backgroundColor: "#FFFFFF", paddingHorizontal: 3 }, summaryValue: { color: theme.colors.navy, fontSize: 16, fontWeight: "900" }, summaryLabel: { maxWidth: "100%", marginTop: 2, color: theme.colors.muted, fontSize: 8 },
  newButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, backgroundColor: theme.colors.navy }, newButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, list: { gap: 9 }, card: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, backgroundColor: "#FFFFFF", padding: 11 }, icon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: theme.colors.navy }, cardBody: { flex: 1, minWidth: 0 }, itemTitle: { color: theme.colors.navy, fontSize: 11, fontWeight: "900" }, business: { marginTop: 2, color: "#A48414", fontSize: 9, fontWeight: "700" }, details: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, marginTop: 5 }, detailText: { color: theme.colors.muted, fontSize: 9 }, dot: { color: "#94A3B8", fontSize: 10 }, amount: { marginTop: 5, color: theme.colors.navy, fontSize: 10, fontWeight: "900" }, paymentStatus: { marginTop: 3, color: "#64748B", fontSize: 8 }, deliveryAddress: { marginTop: 3, color: theme.colors.muted, fontSize: 9 }, pressed: { opacity: 0.85 },
  state: { minHeight: 110, alignItems: "center", justifyContent: "center", gap: 8 }, muted: { color: theme.colors.muted, fontSize: 10, textAlign: "center" }, empty: { minHeight: 165, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#CBD5E1", borderRadius: 15, backgroundColor: "#FFFFFF", padding: 18 }, emptyTitle: { color: theme.colors.navy, fontSize: 12, fontWeight: "900", textAlign: "center" }, retry: { marginTop: 3, borderRadius: 10, backgroundColor: theme.colors.navy, paddingHorizontal: 15, paddingVertical: 9 }, retryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
