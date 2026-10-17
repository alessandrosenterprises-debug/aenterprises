import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image as ImageIcon, Store, X } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { theme } from "../theme";

type Business = { id: string; name: string; slug: string };
type GalleryItem = { id: string; business_id: string; title?: string | null; description?: string | null; caption?: string | null; image_url?: string | null };
type Preview = { item: GalleryItem; business: Business | undefined; category: string; action: string; href: string };

export function CustomerGalleryScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { width } = useWindowDimensions();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [limit, setLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const gap = 8;
  const columns = width >= 650 ? 5 : 3;
  const imageWidth = (width - 28 - gap * (columns - 1)) / columns;

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const { data: businessesData, error: businessesError } = await supabase.from("businesses").select("id, name, slug").eq("active", true).order("name");
        if (businessesError) throw businessesError;
        const availableBusinesses = (businessesData ?? []) as Business[];
        if (!live) return;
        setBusinesses(availableBusinesses);
        if (!availableBusinesses.length) { setLoading(false); return; }
        const { data, error } = await supabase.from("business_gallery").select("id, business_id, title, description, caption, image_url, display_order").in("business_id", availableBusinesses.map((business) => business.id)).eq("active", true).order("display_order", { ascending: true });
        if (error) throw error;
        if (live) setItems((data ?? []) as GalleryItem[]);
      } catch {
        if (live) setFailed(true);
      } finally {
        if (live) setLoading(false);
      }
    }
    void load();
    return () => { live = false; };
  }, []);

  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);
  const visibleItems = items.slice(0, limit);

  function getAction(slug: string) {
    if (slug.includes("loan")) return { category: "Loans", action: "Apply", href: `/customer/businesses/${slug}/apply` };
    if (slug.includes("barber")) return { category: "Barbering", action: "Book a service", href: `/customer/businesses/${slug}/services` };
    if (slug.includes("mobile")) return { category: "Mobile Money", action: "Explore services", href: `/customer/businesses/${slug}/services` };
    if (slug.includes("fashion")) return { category: "Fashion", action: "Order", href: `/customer/businesses/${slug}/products` };
    if (slug.includes("tech")) return { category: "Technology", action: "Order", href: "/customer/orders/new" };
    return { category: "Business", action: "View business", href: `/customer/businesses/${slug}` };
  }

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>ALESSANDRO ENTERPRISES</Text><Text style={styles.title}>Business gallery</Text><Text style={styles.subtitle}>Explore photos from across our businesses. Tap an image to preview it and see what you can do next.</Text></View>
    <View style={styles.body}>
      {loading ? <View style={styles.state}><ActivityIndicator color={theme.colors.gold} /><Text style={styles.muted}>Loading gallery…</Text></View> : failed ? <View style={styles.empty}><Text style={styles.emptyTitle}>We couldn’t load the gallery</Text><Text style={styles.muted}>Check your connection and try again.</Text></View> : visibleItems.length ? <View style={styles.grid}>{visibleItems.map((item) => {
        const business = businessById.get(item.business_id);
        const action = getAction(business?.slug ?? "");
        return <Pressable key={item.id} onPress={() => setPreview({ item, business, ...action })} style={({ pressed }) => [styles.tile, { width: imageWidth }, pressed && styles.pressed]}>
          {item.image_url ? <Image source={{ uri: item.image_url }} style={[styles.image, { height: imageWidth }]} resizeMode="cover" /> : <View style={[styles.image, styles.fallback, { height: imageWidth }]}><ImageIcon size={22} color={theme.colors.gold} /></View>}
          <View style={styles.tileMeta}><Text numberOfLines={1} style={styles.category}>{action.category}</Text><Text numberOfLines={1} style={styles.itemTitle}>{item.title || "Business gallery"}</Text><Text numberOfLines={1} style={styles.businessName}>{business?.name || "Alessandro Enterprises"}</Text></View>
        </Pressable>;
      })}</View> : <View style={styles.empty}><Store size={25} color="#94A3B8" /><Text style={styles.emptyTitle}>No gallery photos available right now.</Text></View>}
      {!loading && items.length > limit && <Pressable style={styles.more} onPress={() => setLimit((value) => value + 24)}><Text style={styles.moreText}>Load more photos</Text></Pressable>}
    </View>
    <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      <View style={styles.backdrop}><Pressable accessibilityLabel="Close image preview" onPress={() => setPreview(null)} style={styles.close}><X size={21} color="#FFFFFF" /></Pressable>
        {preview && <View style={styles.sheet}>
          {preview.item.image_url ? <Image source={{ uri: preview.item.image_url }} style={styles.previewImage} resizeMode="contain" /> : <View style={[styles.previewImage, styles.fallback]}><ImageIcon size={40} color={theme.colors.gold} /></View>}
          <Text style={styles.previewTitle}>{preview.item.title || "Business gallery"}</Text>
          <Text style={styles.previewMeta}>{preview.category.toUpperCase()} · {preview.business?.name || "Alessandro Enterprises"}</Text>
          {!!(preview.item.caption || preview.item.description) && <Text numberOfLines={3} style={styles.previewCaption}>{preview.item.caption || preview.item.description}</Text>}
          <View style={styles.actions}><Pressable onPress={() => { setPreview(null); onNavigate(`/customer/businesses/${preview.business?.slug || ""}`); }} style={styles.secondary}><Text style={styles.secondaryText}>Business home</Text></Pressable><Pressable onPress={() => { setPreview(null); onNavigate(preview.href); }} style={styles.primary}><Text style={styles.primaryText}>{preview.action}</Text></Pressable></View>
        </View>}
      </View>
    </Modal>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background }, content: { paddingBottom: 24 }, hero: { backgroundColor: theme.colors.navy, paddingHorizontal: 18, paddingTop: 21, paddingBottom: 22 }, eyebrow: { color: theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 }, title: { marginTop: 5, color: "#FFFFFF", fontSize: 23, fontWeight: "900" }, subtitle: { marginTop: 5, color: "#C7D2E1", fontSize: 11, lineHeight: 17 }, body: { paddingHorizontal: 14, paddingTop: 15 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, tile: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: "#FFFFFF" }, image: { width: "100%", backgroundColor: "#E9EEF5" }, fallback: { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navy }, tileMeta: { padding: 6 }, category: { color: "#8A6D13", fontSize: 7, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.4 }, itemTitle: { marginTop: 3, color: theme.colors.navy, fontSize: 8, fontWeight: "800" }, businessName: { marginTop: 2, color: theme.colors.muted, fontSize: 7 }, state: { minHeight: 140, alignItems: "center", justifyContent: "center", gap: 8 }, muted: { color: theme.colors.muted, fontSize: 10, textAlign: "center" }, empty: { minHeight: 145, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#CBD5E1", borderRadius: 15, backgroundColor: "#FFFFFF", padding: 16 }, emptyTitle: { color: theme.colors.navy, fontSize: 12, fontWeight: "900", textAlign: "center" }, more: { minHeight: 40, alignItems: "center", justifyContent: "center", marginTop: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, backgroundColor: "#FFFFFF" }, moreText: { color: theme.colors.navy, fontSize: 10, fontWeight: "800" }, pressed: { opacity: 0.82 }, backdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(1,10,24,0.95)", padding: 17 }, close: { position: "absolute", top: 44, right: 17, zIndex: 2, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" }, sheet: { alignItems: "center", width: "100%", maxHeight: "86%", borderRadius: 19, backgroundColor: "#FFFFFF", padding: 13 }, previewImage: { width: "100%", height: 330, borderRadius: 11, backgroundColor: "#0B1727" }, previewTitle: { marginTop: 10, color: theme.colors.navy, fontSize: 15, fontWeight: "900" }, previewMeta: { marginTop: 4, color: "#8A6D13", fontSize: 9, fontWeight: "900", textAlign: "center" }, previewCaption: { marginTop: 7, color: theme.colors.muted, fontSize: 10, lineHeight: 15, textAlign: "center" }, actions: { width: "100%", flexDirection: "row", gap: 8, marginTop: 13 }, secondary: { minHeight: 39, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10 }, secondaryText: { color: theme.colors.navy, fontSize: 10, fontWeight: "800" }, primary: { minHeight: 39, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: theme.colors.navy }, primaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
