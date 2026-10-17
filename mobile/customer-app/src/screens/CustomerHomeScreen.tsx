import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronLeft, ChevronRight, Cloud, CloudFog, CloudRain, CloudSun, Clock3, FileText, Headphones, Image as ImageIcon, Mail, MessageCircle, Package, Phone, ShoppingBag, Sparkles, Store, Sun, Wrench, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { theme } from "../theme";

type Business = { id: string; name: string; slug: string; description: string | null; logo_url: string | null };
type ContactDetails = { companyName: string; tagline: string; phone: string; whatsapp: string; email: string };
type SettingsRow = { company_name?: string | null; tagline?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null };
type ContentRow = { id: string; business_id: string; title?: string | null; description?: string | null; content?: string | null; caption?: string | null; image_url?: string | null; discount_text?: string | null; price?: number | null; start_date?: string | null; end_date?: string | null; published_at?: string | null; created_at?: string | null };
type Weather = { temperature: number; code: number; wind: number };
type Preview = { url: string; title: string; caption: string; businessName: string; businessSlug: string; actionLabel: string; actionHref: string };

const defaultContact: ContactDetails = { companyName: "Alessandro Enterprises", tagline: "The Name That Covers All", phone: "", whatsapp: "", email: "" };

export function CustomerHomeScreen({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { width } = useWindowDimensions();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contact, setContact] = useState(defaultContact);
  const [promotions, setPromotions] = useState<ContentRow[]>([]);
  const [gallery, setGallery] = useState<ContentRow[]>([]);
  const [posts, setPosts] = useState<ContentRow[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [activeBusiness, setActiveBusiness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [activePromotion, setActivePromotion] = useState(0);
  const promotionScroll = useRef<ScrollView>(null);
  const promoCardWidth = Math.min(width * 0.7, 290);

  useEffect(() => {
    let live = true;
    async function loadContent() {
      setLoading(true);
      setLoadError(false);
      if (!isSupabaseConfigured) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      const [businessResult, settingsResult] = await Promise.all([
        supabase.from("businesses").select("id, name, slug, description, logo_url").eq("active", true).order("name").limit(12),
        supabase.from("company_settings").select("company_name, tagline, phone, whatsapp, email").eq("singleton_key", "default").maybeSingle(),
      ]);
      if (!live) return;
      if (businessResult.error) setLoadError(true);
      const currentBusinesses = (businessResult.data ?? []) as Business[];
      setBusinesses(currentBusinesses);
      const settings = settingsResult.data as SettingsRow | null;
      if (settings) setContact({
        companyName: settings.company_name?.trim() || defaultContact.companyName,
        tagline: settings.tagline ?? defaultContact.tagline,
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp ?? "",
        email: settings.email ?? "",
      });

      if (currentBusinesses.length) {
        const ids = currentBusinesses.map((business) => business.id);
        const [promoResult, galleryResult, postResult] = await Promise.all([
          supabase.from("business_promotions").select("*").in("business_id", ids).eq("active", true).eq("published", true).order("created_at", { ascending: false }).limit(12),
          supabase.from("business_gallery").select("*").in("business_id", ids).eq("active", true).order("display_order", { ascending: true }).limit(12),
          supabase.from("business_posts").select("*").in("business_id", ids).eq("published", true).order("published_at", { ascending: false }).limit(8),
        ]);
        if (!live) return;
        const now = Date.now();
        setPromotions(((promoResult.data ?? []) as ContentRow[]).filter((row) => (!row.start_date || new Date(row.start_date).getTime() <= now) && (!row.end_date || new Date(row.end_date).getTime() >= now)));
        setGallery((galleryResult.data ?? []) as ContentRow[]);
        setPosts(((postResult.data ?? []) as ContentRow[]).filter((row) => !row.published_at || new Date(row.published_at).getTime() <= now));
      }
      setLoading(false);
    }
    void loadContent().catch(() => { if (live) { setLoadError(true); setLoading(false); } });
    return () => { live = false; };
  }, []);


  useEffect(() => {
    let live = true;
    const loadWeather = async () => {
      try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-15.4167&longitude=28.2833&current=temperature_2m,weather_code,wind_speed_10m&timezone=Africa%2FLusaka");
        if (!response.ok) return;
        const result = await response.json();
        if (live && result.current) setWeather({ temperature: Math.round(result.current.temperature_2m), code: result.current.weather_code, wind: Math.round(result.current.wind_speed_10m) });
      } catch { if (live) setWeather(null); }
    };
    void loadWeather();
    const timer = setInterval(() => void loadWeather(), 15 * 60 * 1000);
    return () => { live = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (businesses.length < 2) return;
    const timer = setInterval(() => setActiveBusiness((index) => (index + 1) % Math.min(businesses.length, 6)), 5000);
    return () => clearInterval(timer);
  }, [businesses.length]);

  useEffect(() => {
    if (promotions.length <= 2) return;
    const timer = setInterval(() => {
      setActivePromotion((current) => {
        const next = (current + 1) % promotions.length;
        promotionScroll.current?.scrollTo({ x: next * (promoCardWidth + 12), animated: true });
        return next;
      });
    }, 10_000);
    return () => clearInterval(timer);
  }, [promotions.length, promoCardWidth]);

  const visibleBusinesses = useMemo(() => businesses.slice(0, 6), [businesses]);
  const featured = visibleBusinesses[activeBusiness] ?? visibleBusinesses[0];
  const businessById = useMemo(() => new Map(businesses.map((business) => [business.id, business])), [businesses]);

  const changeFeatured = (amount: number) => {
    if (!visibleBusinesses.length) return;
    setActiveBusiness((index) => (index + amount + visibleBusinesses.length) % visibleBusinesses.length);
  };
  const openExternal = (url: string) => { void Linking.openURL(url).catch(() => undefined); };
  const makePromotionTarget = (row: ContentRow) => {
    const title = row.title || "Special offer";
    const tag = row.discount_text || "Special offer";
    const business = businessById.get(row.business_id);
    const slug = business?.slug.toLowerCase() ?? "";
    const query = `promotion=${encodeURIComponent(title)}&tag=${encodeURIComponent(tag)}`;
    if (slug.includes("loan")) return { href: `/customer/businesses/${business?.slug ?? "soft-loans"}/apply?${query}`, label: "Apply" };
    if (slug.includes("barber") || slug.includes("mobile")) return { href: `/customer/bookings/new?${query}`, label: "Book" };
    return { href: `/customer/orders/new?search=${encodeURIComponent(title)}&${query}`, label: "Order" };
  };
  const makeGalleryAction = (businessSlug: string) => businessSlug.includes("loan")
    ? { actionLabel: "Apply", actionHref: `/customer/businesses/${businessSlug}/apply` }
    : businessSlug.includes("barber")
      ? { actionLabel: "Book a service", actionHref: `/customer/businesses/${businessSlug}/services` }
      : businessSlug.includes("mobile")
        ? { actionLabel: "Explore services", actionHref: `/customer/businesses/${businessSlug}/services` }
      : businessSlug.includes("fashion")
        ? { actionLabel: "Order", actionHref: `/customer/businesses/${businessSlug}/products` }
        : businessSlug.includes("tech")
          ? { actionLabel: "Order", actionHref: "/customer/orders/new" }
          : { actionLabel: "View business", actionHref: `/customer/businesses/${businessSlug}` };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroBadge}><Sparkles size={14} color={theme.colors.goldLight} /><Text style={styles.heroBadgeText}>AEOS CUSTOMER EXPERIENCE</Text></View>
        <Text style={styles.heroTitle}>Everything you need,{"\n"}<Text style={styles.heroAccent}>all in one place.</Text></Text>
        <Text style={styles.heroCopy}>Discover Alessandro Enterprises businesses, services, products, bookings and opportunities through one connected customer experience.</Text>
        <View style={styles.heroButtons}>
          <ActionButton title="Explore businesses" onPress={() => onNavigate("/customer/businesses")} gold />
          <ActionButton title="Visit website" onPress={() => onNavigate("/")} />
        </View>
        <View style={styles.contactLinks}>
          <ContactLink label="Emails" Icon={Mail} onPress={() => contact.email ? openExternal(`mailto:${contact.email}`) : onNavigate("/customer/emails")} />
          <ContactLink label="Phone" Icon={Phone} onPress={() => contact.phone ? openExternal(`tel:${contact.phone.replace(/\s+/g, "")}`) : onNavigate("/customer/support")} />
          <ContactLink label="WhatsApp" Icon={MessageCircle} onPress={() => contact.whatsapp ? openExternal(`https://wa.me/${contact.whatsapp.replace(/\D/g, "").replace(/^0/, "260")}`) : onNavigate("/customer/support")} />
          <ContactLink label="Requests" Icon={FileText} onPress={() => onNavigate("/customer/requests")} />
          <ContactLink label="Support" Icon={Headphones} onPress={() => onNavigate("/customer/support")} />
        </View>
        <WeatherCard weather={weather} />
        <View style={styles.tagline}><Text numberOfLines={1} style={styles.taglineText}>{contact.companyName}  ·  {contact.tagline}</Text></View>
      </View>

      <View style={styles.sections}>
        <View>
          <SectionTitle eyebrow="QUICK ACCESS" title="What would you like to do?" />
          <View style={styles.quickGrid}>
            <QuickCard label="Businesses" note="Explore AE businesses" Icon={Store} tone="#3858EC" onPress={() => onNavigate("/customer/businesses")} />
            <QuickCard label="Services" note="Find what you need" Icon={Wrench} tone="#00A886" onPress={() => onNavigate("/customer/services")} />
            <QuickCard label="Bookings" note="Manage appointments" Icon={CalendarDays} tone="#F17B00" onPress={() => onNavigate("/customer/bookings")} />
            <QuickCard label="Messages" note="Talk to AEOS" Icon={MessageCircle} tone="#8B30E8" onPress={() => onNavigate("/customer/messages")} />
          </View>
        </View>

        <View>
          <SectionTitle eyebrow="DISCOVER" title="Featured businesses" action="View all" onAction={() => onNavigate("/customer/businesses")} />
          {featured ? (
            <View style={styles.featureCard}>
              <View style={styles.featureBadge}><View style={styles.goldDot} /><Text style={styles.featureBadgeText}>FEATURED BUSINESS</Text></View>
              <View style={styles.featureContent}>
                {featured.logo_url ? <Image source={{ uri: featured.logo_url }} style={styles.businessLogo} resizeMode="contain" /> : <View style={[styles.businessLogo, styles.logoFallback]}><Store size={28} color={theme.colors.navy} /></View>}
                <View style={styles.featureDetails}>
                  <Text style={styles.eyebrowDark}>EXPLORE</Text>
                  <Text numberOfLines={2} style={styles.featureName}>{featured.name}</Text>
                  {!!featured.description && <Text numberOfLines={1} style={styles.featureDescription}>{featured.description}</Text>}
                  <Pressable onPress={() => onNavigate(`/customer/businesses/${featured.slug}`)} style={styles.featureButton}><Text style={styles.featureButtonText}>Visit business</Text><ArrowRight size={14} color="#FFFFFF" /></Pressable>
                </View>
              </View>
              {visibleBusinesses.length > 1 && <View style={styles.carouselFooter}>
                <Pressable accessibilityLabel="Previous featured business" onPress={() => changeFeatured(-1)} style={styles.carouselArrow}><ChevronLeft size={16} color={theme.colors.navy} /></Pressable>
                <View style={styles.dots}>{visibleBusinesses.map((business, index) => <Pressable key={business.id} accessibilityLabel={`Show ${business.name}`} onPress={() => setActiveBusiness(index)} style={[styles.dot, index === activeBusiness && styles.activeDot]} />)}</View>
                <Pressable accessibilityLabel="Next featured business" onPress={() => changeFeatured(1)} style={styles.carouselArrow}><ChevronRight size={16} color={theme.colors.navy} /></Pressable>
              </View>}
            </View>
          ) : <EmptyMessage message={loading ? "Loading businesses…" : "No featured businesses yet."} />}
        </View>

        <View>
          <SectionTitle eyebrow="OFFERS" title="Promotions" action="Explore" onAction={() => onNavigate("/customer/businesses")} />
          {promotions.length ? <><ScrollView ref={promotionScroll} horizontal showsHorizontalScrollIndicator={false} snapToInterval={promoCardWidth + 12} decelerationRate="fast" contentContainerStyle={styles.horizontalFeed} onMomentumScrollEnd={(event) => setActivePromotion(Math.round(event.nativeEvent.contentOffset.x / (promoCardWidth + 12)))}>
            {promotions.map((promotion) => {
              const business = businessById.get(promotion.business_id);
              const target = makePromotionTarget(promotion);
              return <View key={promotion.id} style={[styles.promoCard, { width: promoCardWidth }]}>
                {promotion.image_url ? <Image source={{ uri: promotion.image_url }} style={styles.promoImage} resizeMode="cover" /> : <View style={[styles.promoImage, styles.promoImageFallback]}><ShoppingBag size={28} color={theme.colors.gold} /></View>}
                <View style={styles.promoBody}>
                  <Text numberOfLines={1} style={styles.promoBusiness}>{business?.name ?? contact.companyName}{promotion.discount_text ? ` · ${promotion.discount_text}` : ""}</Text>
                  <Text numberOfLines={1} style={styles.promoTitle}>{promotion.title || "Special offer"}</Text>
                  {!!(promotion.description || promotion.content) && <Text numberOfLines={2} style={styles.promoDescription}>{promotion.description || promotion.content}</Text>}
                  {promotion.price != null && <Text style={styles.promoPrice}>ZMW {Number(promotion.price).toFixed(2)}</Text>}
                  <Pressable onPress={() => onNavigate(target.href)} style={styles.promoButton}><Text style={styles.promoButtonText}>{target.label} with this offer</Text><ArrowRight size={13} color="#FFFFFF" /></Pressable>
                </View>
              </View>;
            })}
          </ScrollView>{promotions.length > 2 && <View style={styles.dots}>{promotions.map((promotion, index) => <Pressable key={promotion.id} accessibilityLabel={`Show promotion ${index + 1}`} onPress={() => { setActivePromotion(index); promotionScroll.current?.scrollTo({ x: index * (promoCardWidth + 12), animated: true }); }} style={[styles.dot, index === activePromotion && styles.activeDot]} />)}</View>}</> : <EmptyMessage message={loading ? "Loading offers…" : "No promotions available right now."} />}
        </View>

        <View>
          <SectionTitle eyebrow="DISCOVER" title="Gallery" action="View all photos" onAction={() => onNavigate("/customer/gallery")} />
          {gallery.length ? <View style={styles.galleryGrid}>{gallery.slice(0, 8).map((item) => {
            const business = businessById.get(item.business_id);
            const businessSlug = business?.slug ?? "";
            const action = makeGalleryAction(businessSlug);
            return <Pressable key={item.id} onPress={() => item.image_url && setPreview({ url: item.image_url, title: item.title || "Business gallery", caption: item.caption || item.description || "", businessName: business?.name ?? contact.companyName, businessSlug, ...action })} style={styles.galleryCard}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.galleryImage} resizeMode="cover" /> : <View style={[styles.galleryImage, styles.galleryFallback]}><ImageIcon size={20} color={theme.colors.gold} /></View>}
              <Text numberOfLines={1} style={styles.galleryTitle}>{item.title || "Gallery photo"}</Text>
              <Text numberOfLines={1} style={styles.galleryBusiness}>{business?.name ?? "Alessandro Enterprises"}</Text>
            </Pressable>;
          })}</View> : <EmptyMessage message={loading ? "Loading gallery…" : "No gallery photos available yet."} />}
        </View>

        <View>
          <SectionTitle eyebrow="STAY INFORMED" title="Latest updates" action="Explore" onAction={() => onNavigate("/customer/businesses")} />
          {posts.length ? <View style={styles.postList}>{posts.slice(0, 3).map((post) => {
            const business = businessById.get(post.business_id);
            return <Pressable key={post.id} onPress={() => business && onNavigate(`/customer/businesses/${business.slug}/updates`)} style={styles.postCard}>
              {post.image_url && <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />}
              <View style={styles.postBody}><Text style={styles.postBusiness}>{business?.name ?? contact.companyName}</Text><Text style={styles.postTitle}>{post.title || "Business update"}</Text><Text numberOfLines={2} style={styles.postCopy}>{post.content || post.description || "Read the latest news and updates from this business."}</Text></View>
            </Pressable>;
          })}</View> : <EmptyMessage message={loading ? "Loading updates…" : "No updates available right now."} />}
          <View style={styles.infoList}>
            <InfoCard Icon={Clock3} title="Your latest activity" note="Bookings, loan applications and customer activity are available from your account." onPress={() => onNavigate("/customer/activity")} />
            <InfoCard Icon={BriefcaseBusiness} title="Discover AE businesses" note="Explore businesses and find services, products and opportunities that match your needs." onPress={() => onNavigate("/customer/businesses")} />
            <InfoCard Icon={Package} title="Your services and orders" note="Keep track of services and orders associated with your account." onPress={() => onNavigate("/customer/services")} />
          </View>
        </View>

        {loadError && <Text style={styles.softError}>Some home content couldn’t be loaded. Pull down later to try again.</Text>}
        <View style={styles.closingCard}><Sparkles size={21} color={theme.colors.gold} /><View style={styles.closingCopy}><Text style={styles.closingTitle}>One AEOS. Many possibilities.</Text><Text style={styles.closingText}>Explore the Alessandro Enterprises ecosystem from one place.</Text></View></View>
      </View>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityLabel="Close preview" onPress={() => setPreview(null)} style={styles.modalClose}><X size={22} color="#FFFFFF" /></Pressable>
          {preview && <View style={styles.previewSheet}>
            <Image source={{ uri: preview.url }} style={styles.previewImage} resizeMode="contain" />
            <Text style={styles.previewTitle}>{preview.title}</Text>
            <Text style={styles.previewBusiness}>{preview.businessName}</Text>
            {!!preview.caption && <Text numberOfLines={3} style={styles.previewCaption}>{preview.caption}</Text>}
            <View style={styles.previewActions}>
              <Pressable onPress={() => { setPreview(null); onNavigate(`/customer/businesses/${preview.businessSlug}`); }} style={styles.previewSecondary}><Text style={styles.previewSecondaryText}>Business home</Text></Pressable>
              <Pressable onPress={() => { setPreview(null); onNavigate(preview.actionHref); }} style={styles.previewPrimary}><Text style={styles.previewPrimaryText}>{preview.actionLabel}</Text></Pressable>
            </View>
          </View>}
        </View>
      </Modal>
    </ScrollView>
  );
}

function ActionButton({ title, onPress, gold = false }: { title: string; onPress: () => void; gold?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.heroButton, gold ? styles.goldButton : styles.outlineButton]}><Text numberOfLines={1} style={[styles.heroButtonText, gold && styles.goldButtonText]}>{title}</Text><ArrowRight size={14} color={gold ? theme.colors.navy : "#FFFFFF"} /></Pressable>;
}

function ContactLink({ label, Icon, onPress }: { label: string; Icon: LucideIcon; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.contactLink}><View style={styles.contactIcon}><Icon size={15} color={theme.colors.gold} /></View><Text numberOfLines={1} style={styles.contactLabel}>{label}</Text></Pressable>;
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitleRow}><View><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>{action && <Pressable onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text><ArrowRight size={14} color={theme.colors.navy} /></Pressable>}</View>;
}

function QuickCard({ label, note, Icon, tone, onPress }: { label: string; note: string; Icon: LucideIcon; tone: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: tone }]}><Icon size={17} color="#FFFFFF" /></View><Text style={styles.quickTitle}>{label}</Text><Text numberOfLines={1} style={styles.quickNote}>{note}</Text><ArrowRight style={styles.quickArrow} size={14} color="#94A3B8" /></Pressable>;
}

function WeatherCard({ weather }: { weather: Weather | null }) {
  const code = weather?.code ?? -1;
  const WeatherIcon = code === 0 || code === 1 ? Sun : code === 2 ? CloudSun : code === 45 || code === 48 ? CloudFog : code >= 51 && code <= 82 ? CloudRain : Cloud;
  const condition = code === 0 ? "Clear skies" : code === 1 ? "Mostly clear" : code === 2 ? "Partly cloudy" : code === 3 ? "Cloudy" : code === 45 || code === 48 ? "Foggy" : code >= 51 && code <= 82 ? "Rain showers" : "Checking conditions";
  return <View style={styles.weatherCard}><View style={styles.weatherIcon}><WeatherIcon size={18} color={theme.colors.goldLight} /></View><View style={styles.weatherInfo}><Text style={styles.weatherEyebrow}>LIVE WEATHER · LUSAKA</Text><Text style={styles.weatherCondition}>{condition}</Text><Text style={styles.weatherWind}>{weather ? `Wind ${weather.wind} km/h` : "Current conditions"}</Text></View><Text style={styles.temperature}>{weather ? `${weather.temperature}°` : "--°"}</Text></View>;
}

function EmptyMessage({ message }: { message: string }) {
  return <View style={styles.empty}><ActivityIndicator color={theme.colors.gold} size="small" /><Text style={styles.emptyText}>{message}</Text></View>;
}

function InfoCard({ Icon, title, note, onPress }: { Icon: LucideIcon; title: string; note: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.infoCard}><View style={styles.infoIcon}><Icon size={18} color={theme.colors.gold} /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoNote}>{note}</Text></View><ArrowRight size={16} color="#AAB7C7" /></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 24 },
  hero: { overflow: "hidden", backgroundColor: theme.colors.navy, paddingHorizontal: 16, paddingTop: 17, paddingBottom: 16 },
  heroBadge: { alignSelf: "flex-start", minHeight: 25, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.09)", paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: "#E4EAF3", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { marginTop: 12, color: "#FFFFFF", fontFamily: "serif", fontSize: 25, lineHeight: 29, fontWeight: "800" },
  heroAccent: { color: theme.colors.goldLight },
  heroCopy: { marginTop: 7, color: "#C7D2E1", fontSize: 12, lineHeight: 18 },
  heroButtons: { flexDirection: "row", gap: 8, marginTop: 13 },
  heroButton: { minHeight: 38, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 11, paddingHorizontal: 7 },
  goldButton: { backgroundColor: theme.colors.gold },
  outlineButton: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.09)" },
  heroButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  goldButtonText: { color: theme.colors.navy },
  contactLinks: { flexDirection: "row", gap: 6, marginTop: 15 },
  contactLink: { flex: 1, minWidth: 0, alignItems: "center", gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", paddingHorizontal: 2, paddingVertical: 6 },
  contactIcon: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "rgba(255,255,255,0.09)" },
  contactLabel: { color: "#E5EAF1", fontSize: 8, fontWeight: "700" },
  weatherCard: { minHeight: 59, flexDirection: "row", alignItems: "center", gap: 9, marginTop: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 8 },
  weatherIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(212,175,55,0.16)" },
  weatherInfo: { flex: 1, minWidth: 0 },
  weatherEyebrow: { color: "#CFD8E5", fontSize: 7, fontWeight: "800", letterSpacing: 1 },
  weatherCondition: { marginTop: 2, color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  weatherWind: { marginTop: 1, color: "#AAB7C7", fontSize: 8 },
  temperature: { color: "#FFFFFF", fontFamily: "serif", fontSize: 22, fontWeight: "800" },
  tagline: { minHeight: 34, justifyContent: "center", marginTop: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10 },
  taglineText: { color: theme.colors.goldLight, fontSize: 11, fontWeight: "800", letterSpacing: 0.35 },
  sections: { gap: 22, paddingHorizontal: 14, paddingTop: 19 },
  sectionTitleRow: { minHeight: 38, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginBottom: 9 },
  sectionEyebrow: { color: "#A48414", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  sectionTitle: { marginTop: 3, color: theme.colors.navy, fontSize: 17, fontWeight: "900", letterSpacing: -0.25 },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 5 },
  sectionActionText: { color: theme.colors.navy, fontSize: 10, fontWeight: "800" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  quickCard: { width: "48.5%", minHeight: 102, position: "relative", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 17, backgroundColor: "#FFFFFF", padding: 11, elevation: 1 },
  quickIcon: { width: 33, height: 33, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  quickTitle: { marginTop: 7, color: theme.colors.navy, fontSize: 12, fontWeight: "900" },
  quickNote: { marginTop: 3, paddingRight: 10, color: theme.colors.muted, fontSize: 9 },
  quickArrow: { position: "absolute", right: 10, bottom: 10 },
  featureCard: { overflow: "hidden", borderWidth: 1, borderColor: "#C6A534", borderRadius: 21, backgroundColor: "#E1C14C", padding: 12 },
  featureBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 16, backgroundColor: theme.colors.navy, paddingHorizontal: 9, paddingVertical: 5 },
  goldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.gold },
  featureBadgeText: { color: theme.colors.goldLight, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  featureContent: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 11 },
  businessLogo: { width: 50, height: 50, borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", borderRadius: 15, backgroundColor: "#FFFFFF" },
  logoFallback: { alignItems: "center", justifyContent: "center" },
  featureDetails: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  eyebrowDark: { color: "rgba(3,22,47,0.65)", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  featureName: { marginTop: 2, color: theme.colors.navy, fontSize: 14, lineHeight: 17, fontWeight: "900" },
  featureDescription: { marginTop: 2, color: "rgba(3,22,47,0.72)", fontSize: 9 },
  featureButton: { minHeight: 29, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 6, borderRadius: 9, backgroundColor: theme.colors.navy, paddingHorizontal: 10 },
  featureButtonText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  carouselFooter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 9 },
  carouselArrow: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "rgba(255,255,255,0.84)" },
  dots: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(3,22,47,0.28)" },
  activeDot: { width: 16, backgroundColor: theme.colors.navy },
  horizontalFeed: { gap: 11, paddingRight: 14, paddingBottom: 3 },
  promoCard: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: "#FFFFFF", elevation: 2 },
  promoImage: { width: "100%", aspectRatio: 1.5, backgroundColor: "#E8EDF4" },
  promoImageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navy },
  promoBody: { padding: 10 },
  promoBusiness: { color: "#8A6D13", fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  promoTitle: { marginTop: 3, color: theme.colors.navy, fontSize: 12, fontWeight: "900" },
  promoDescription: { marginTop: 3, color: theme.colors.muted, fontSize: 10, lineHeight: 14 },
  promoPrice: { marginTop: 5, color: theme.colors.navy, fontSize: 11, fontWeight: "900" },
  promoButton: { minHeight: 31, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 7, borderRadius: 9, backgroundColor: theme.colors.navy, paddingHorizontal: 8 },
  promoButtonText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: 7 },
  galleryCard: { width: "23.7%", overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, backgroundColor: "#FFFFFF" },
  galleryImage: { width: "100%", aspectRatio: 1 },
  galleryFallback: { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navy },
  galleryTitle: { marginTop: 4, paddingHorizontal: 4, color: theme.colors.navy, fontSize: 8, fontWeight: "800" },
  galleryBusiness: { marginTop: 2, marginBottom: 5, paddingHorizontal: 4, color: theme.colors.muted, fontSize: 7 },
  postList: { gap: 8 },
  postCard: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: "#FFFFFF" },
  postImage: { width: "100%", height: 125 },
  postBody: { padding: 11 },
  postBusiness: { color: "#8A6D13", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  postTitle: { marginTop: 3, color: theme.colors.navy, fontSize: 13, fontWeight: "900" },
  postCopy: { marginTop: 3, color: theme.colors.muted, fontSize: 10, lineHeight: 15 },
  infoList: { gap: 8, marginTop: 12 },
  infoCard: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 17, backgroundColor: "#FFFFFF", padding: 11, elevation: 1 },
  infoIcon: { width: 37, height: 37, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: theme.colors.navy },
  infoCopy: { flex: 1, minWidth: 0 },
  infoTitle: { color: theme.colors.navy, fontSize: 11, fontWeight: "900" },
  infoNote: { marginTop: 3, color: theme.colors.muted, fontSize: 9, lineHeight: 13 },
  empty: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#CBD5E1", borderRadius: 13, backgroundColor: "rgba(255,255,255,0.65)", padding: 10 },
  emptyText: { color: theme.colors.muted, fontSize: 10 },
  softError: { color: "#64748B", fontSize: 10, textAlign: "center" },
  closingCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 17, backgroundColor: theme.colors.navy, padding: 14 },
  closingCopy: { flex: 1 },
  closingTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  closingText: { marginTop: 3, color: "#C7D2E1", fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.86 },
  modalBackdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(1,10,24,0.95)", padding: 18 },
  modalClose: { position: "absolute", top: 44, right: 18, zIndex: 2, width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "rgba(255,255,255,0.16)" },
  previewSheet: { alignItems: "center", width: "100%", maxHeight: "85%", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 14 },
  previewImage: { width: "100%", height: 340, borderRadius: 12, backgroundColor: "#0B1727" },
  previewTitle: { marginTop: 11, color: theme.colors.navy, fontSize: 16, fontWeight: "900" },
  previewBusiness: { marginTop: 3, color: "#8A6D13", fontSize: 10, fontWeight: "900" },
  previewCaption: { marginTop: 6, color: theme.colors.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  previewActions: { width: "100%", flexDirection: "row", gap: 8, marginTop: 13 },
  previewSecondary: { minHeight: 39, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11 },
  previewSecondaryText: { color: theme.colors.navy, fontSize: 10, fontWeight: "800" },
  previewPrimary: { minHeight: 39, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: theme.colors.navy },
  previewPrimaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
