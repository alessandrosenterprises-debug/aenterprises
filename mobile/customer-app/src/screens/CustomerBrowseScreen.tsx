import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Search, Store, Wrench } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { theme } from "../theme";

type BrowseKind = "businesses" | "services";
type BusinessRow = { id: string; name: string; slug: string; description: string | null; logo_url: string | null };
type ServiceRow = { id: string; name: string; business_id: string; category: string | null; description: string | null; base_price: number | string | null; image_url: string | null; businesses: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null };

export function CustomerBrowseScreen({ kind, onNavigate }: { kind: BrowseKind; onNavigate: (path: string) => void }) {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isBusinesses = kind === "businesses";
  const title = isBusinesses ? "Our businesses" : "Services";

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      if (isBusinesses) {
        const { data, error } = await supabase.from("businesses").select("id, name, slug, description, logo_url").eq("active", true).order("name");
        if (error) throw error;
        const rows = (data ?? []) as BusinessRow[];
        if (!rows.some((business) => business.slug === "delivery-service")) rows.push({
          id: "delivery-service-featured",
          name: "Alessandro Delivery Service",
          slug: "delivery-service",
          description: "Send your own parcel or shop purchase from any pickup location to your chosen address.",
          logo_url: null,
        });
        setBusinesses(rows);
      } else {
        const { data, error } = await supabase.from("enterprise_catalog").select("id, business_id, item_type, category, name, description, base_price, status, image_url, businesses!inner(id, name, slug, active)").ilike("item_type", "service").ilike("status", "active").eq("businesses.active", true).order("name");
        if (error) throw error;
        setServices((data ?? []) as unknown as ServiceRow[]);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [isBusinesses]);

  const filteredBusinesses = useMemo(() => {
    const value = query.trim().toLowerCase();
    return businesses.filter((row) => !value || `${row.name} ${row.description ?? ""}`.toLowerCase().includes(value));
  }, [businesses, query]);
  const filteredServices = useMemo(() => {
    const value = query.trim().toLowerCase();
    return services.filter((row) => {
      const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
      return !value || `${row.name} ${row.category ?? ""} ${business?.name ?? ""} ${row.description ?? ""}`.toLowerCase().includes(value);
    });
  }, [services, query]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>DISCOVER</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroCopy}>{isBusinesses ? "Explore Alessandro Enterprises businesses, services, products, and offers." : "Explore services available across Alessandro Enterprises."}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.searchBox}><Search size={17} color={theme.colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={isBusinesses ? "Search businesses" : "Search services"} placeholderTextColor="#94A3B8" style={styles.searchInput} returnKeyType="search" /></View>
        {loading ? <View style={styles.state}><ActivityIndicator color={theme.colors.gold} /><Text style={styles.stateText}>Loading {title.toLowerCase()}…</Text></View> : failed ? <View style={styles.empty}><Text style={styles.emptyTitle}>We couldn’t load this list</Text><Text style={styles.emptyCopy}>Check your connection and try again.</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : isBusinesses ? (
          filteredBusinesses.length ? <View style={styles.list}>{filteredBusinesses.map((business) => <Pressable key={business.id} onPress={() => onNavigate(`/customer/businesses/${business.slug}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.image} resizeMode="contain" /> : <View style={[styles.image, styles.logoFallback]}><Store size={23} color={theme.colors.gold} /> </View>}
            <View style={styles.cardCopy}><Text numberOfLines={1} style={styles.cardTitle}>{business.name}</Text><Text numberOfLines={2} style={styles.cardDescription}>{business.description || "Explore this business and discover what it offers."}</Text><Text style={styles.cardMeta}>ALESSANDRO ENTERPRISES</Text></View>
            <ArrowRight size={17} color={theme.colors.gold} />
          </Pressable>)}</View> : <EmptyState label="No businesses match your search." />
        ) : filteredServices.length ? <View style={styles.list}>{filteredServices.map((service) => {
          const business = Array.isArray(service.businesses) ? service.businesses[0] : service.businesses;
          return <Pressable key={service.id} onPress={() => onNavigate(`/customer/services/${service.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            {service.image_url ? <Image source={{ uri: service.image_url }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.logoFallback]}><Wrench size={21} color={theme.colors.gold} /></View>}
            <View style={styles.cardCopy}><Text numberOfLines={1} style={styles.cardTitle}>{service.name}</Text>{business?.name && <Text style={styles.businessName}>{business.name}</Text>}<Text numberOfLines={2} style={styles.cardDescription}>{service.description || "View service details and booking options."}</Text><View style={styles.metaRow}>{service.category && <Text style={styles.category}>{service.category}</Text>}{service.base_price != null && <Text style={styles.price}>ZMW {Number(service.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>}</View></View>
            <ArrowRight size={17} color={theme.colors.gold} />
          </Pressable>;
        })}</View> : <EmptyState label="No services are available right now." />}
      </View>
    </ScrollView>
  );
}

function EmptyState({ label }: { label: string }) { return <View style={styles.empty}><Store size={25} color="#94A3B8" /><Text style={styles.emptyTitle}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 24 },
  hero: { backgroundColor: theme.colors.navy, paddingHorizontal: 18, paddingTop: 21, paddingBottom: 22 },
  eyebrow: { color: theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 },
  heroTitle: { marginTop: 5, color: "#FFFFFF", fontSize: 23, lineHeight: 28, fontWeight: "900" },
  heroCopy: { maxWidth: 440, marginTop: 5, color: "#C7D2E1", fontSize: 11, lineHeight: 17 },
  body: { gap: 13, paddingHorizontal: 14, paddingTop: 15 },
  searchBox: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, backgroundColor: "#FFFFFF", paddingHorizontal: 12 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 9, color: theme.colors.text, fontSize: 12 },
  list: { gap: 9 },
  card: { minHeight: 96, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 11, elevation: 1 },
  image: { width: 54, height: 54, borderRadius: 13, backgroundColor: "#F8FAFC" },
  logoFallback: { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navy },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: theme.colors.navy, fontSize: 12, fontWeight: "900" },
  businessName: { marginTop: 2, color: "#A48414", fontSize: 9, fontWeight: "800" },
  cardDescription: { marginTop: 4, color: theme.colors.muted, fontSize: 9, lineHeight: 13 },
  cardMeta: { marginTop: 7, color: "#94A3B8", fontSize: 7, fontWeight: "800", letterSpacing: 0.55 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 },
  category: { overflow: "hidden", borderRadius: 10, backgroundColor: "#F1F5F9", color: "#475569", paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, fontWeight: "800", textTransform: "uppercase" },
  price: { overflow: "hidden", borderRadius: 10, backgroundColor: "#FCF6E5", color: "#8A6D13", paddingHorizontal: 7, paddingVertical: 3, fontSize: 8, fontWeight: "900" },
  state: { minHeight: 100, alignItems: "center", justifyContent: "center", gap: 8 },
  stateText: { color: theme.colors.muted, fontSize: 11 },
  empty: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#CBD5E1", borderRadius: 15, backgroundColor: "#FFFFFF", padding: 18 },
  emptyTitle: { color: theme.colors.navy, fontSize: 12, fontWeight: "800", textAlign: "center" },
  emptyCopy: { color: theme.colors.muted, fontSize: 10, textAlign: "center" },
  retry: { borderRadius: 10, backgroundColor: theme.colors.navy, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.86 },
});
