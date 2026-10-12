import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Import only the local-notification modules used here. The package root also
// loads its push-token auto-registration side effect, which crashes in Expo Go
// on Android even when this app only schedules local notifications.
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-notifications/build/NotificationPermissions";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Image,
  Linking,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  Vibration,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const portalHost = Constants.expoConfig?.hostUri?.split(":")[0];
const customerApiBase = process.env.EXPO_PUBLIC_CUSTOMER_API_BASE_URL || (portalHost ? `http://${portalHost}:3000` : "");
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

type Business = { id: string; name: string; slug: string; description: string | null; logo_url: string | null };
type BookingBranch = { id: string; business_id: string; name: string; city: string | null; active: boolean };
type BookingEmployee = { id: string; business_id: string | null; branch_id: string | null; full_name: string; position: string | null; is_active: boolean | null; status: string | null };
type CatalogItem = { id: string; business_id: string; item_type: string | null; category: string | null; name: string; description: string | null; base_price: number | string | null; quantity: number | null; status: string | null; image_url: string | null; created_at?: string | null; attributes?: Record<string, unknown> | null; businesses?: { name: string; slug?: string; logo_url?: string | null } | { name: string; slug?: string; logo_url?: string | null }[] | null };
type CartLine = { item: CatalogItem; quantity: number };
type Activity = { id: string; status: string; created_at: string; updated_at?: string; booking_date?: string; booking_time?: string | null; amount?: number; total_amount?: number; subtotal?: number; notes?: string | null; payment_status?: string | null; fulfillment_method?: string | null; delivery_address?: string | null; branch_name?: string | null; staff_name?: string | null; service_name?: string | null; order_items?: { quantity: number; unit_price?: number; total_price: number; enterprise_catalog?: { name: string } | null }[]; business_id?: string; business_name?: string; title?: string; message?: string; unread?: boolean; read_at?: string | null; action_url?: string | null };
type Communication = { id: string; subject: string | null; body: string; sender_name: string; sender_email?: string | null; status: string; created_at: string; business_id?: string | null };
type LoanApplication = { id: string; application_number?: string | null; loan_type: string; requested_amount: number | string; approved_amount?: number | string | null; outstanding_balance?: number | string | null; status: string; application_date: string; loan_purpose?: string | null; rejection_reason?: string | null };
type Promotion = { id: string; business_id: string; title: string; description?: string | null; discount_text?: string | null; price?: number | string | null; image_url?: string | null; end_date?: string | null };
type GalleryImage = { id: string; business_id: string; image_url: string; title?: string | null; caption?: string | null };
type BusinessPost = { id: string; business_id: string; title: string; content?: string | null; image_url?: string | null; post_type?: string; published_at?: string | null };
type LoanProduct = { id: string; name: string; description?: string | null; min_amount?: number | string | null; max_amount?: number | string | null; interest_rate?: number | string | null; repayment_period?: number | null; requires_collateral?: boolean; terms?: { id: string; period_days: number; interest_rate: number }[] };
type CollateralOption = { id: string; name: string; description?: string | null };
type Screen = "home" | "businesses" | "services" | "bookings" | "orders" | "notifications" | "profile" | "service" | "product" | "business" | "techHome" | "techCategory" | "mobileMoney" | "book" | "order" | "activity" | "requests" | "messages" | "messageNew" | "messageDetail" | "emails" | "emailDetail" | "emailCompose" | "preferences" | "accountSettings" | "support" | "supportRequest" | "repairRequest" | "consultation" | "loan" | "loanHistory" | "loanApply" | "businessContent" | "bookingDetail" | "orderDetail";
type AuthScreen = "login" | "register";
type Props = { children: React.ReactNode; refreshing: boolean; onRefresh: () => void; fixedHeader?: React.ReactNode };

function Refreshable({ children, refreshing, onRefresh, fixedHeader }: Props) {
  const scrollContent = <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[NAVY]} />}>{children}</ScrollView>;
  return fixedHeader ? <View style={styles.page}><View style={styles.fixedPageHeader}>{fixedHeader}</View>{scrollContent}</View> : scrollContent;
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);
  const opacity = progress;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  return <Animated.View style={[styles.pageTransition, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

function LoadingExperience({ message }: { message: string }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [progress]);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glow = progress.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.78] });
  const shimmer = progress.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.42] });
  return <SafeAreaView style={styles.loadingScreen} edges={["top", "bottom"]}>
    <StatusBar style="light" />
    <View style={styles.loadingBrand}>
      <Animated.View style={[styles.loadingHalo, { opacity: glow, transform: [{ scale }] }]} />
      <Animated.Image source={require("./assets/app-icon.png")} resizeMode="contain" style={[styles.loadingLogo, { transform: [{ scale }] }]} />
      <Text style={styles.loadingBrandName}>ALESSANDRO</Text>
      <Text style={styles.loadingBrandSubname}>ENTERPRISES</Text>
      <ActivityIndicator color={GOLD} size="small" style={styles.loadingSpinner} />
      <Text style={styles.loadingMessage}>{message}</Text>
    </View>
    <View style={styles.loadingSkeletons}>
      {[0, 1, 2].map((item) => <Animated.View key={item} style={[styles.loadingSkeletonCard, { opacity: shimmer }]}><View style={styles.loadingSkeletonIcon} /><View style={styles.loadingSkeletonLines}><View style={styles.loadingSkeletonLine} /><View style={[styles.loadingSkeletonLine, styles.loadingSkeletonLineShort]} /></View></Animated.View>)}
    </View>
  </SafeAreaView>;
}

let NAVY = "#03162F";
const GOLD = "#D4AF37";
let MUTED = "#64748B";

async function ensureStatusNotificationChannel() {
  // Expo Go's Android host can expose the JS wrapper without providing the
  // native notification-channel provider. Local notifications still work
  // there through Android's fallback channel.
  if (Platform.OS !== "android" || Constants.appOwnership === "expo") return;

  try {
    await setNotificationChannelAsync("status-updates", {
      name: "Order and account updates",
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 180, 100, 180],
      sound: "default",
      lightColor: GOLD,
    });
  } catch (error) {
    // A channel is an enhancement; it must not prevent app startup or
    // preference changes when the native provider is unavailable.
    console.warn("Could not configure the Android notification channel:", error);
  }
}

const technologyCategories = [
  { id: "computers-laptops", name: "Computers & Laptops", description: "Laptops, desktops, upgrades, setup, repairs and business computing.", keywords: ["computer", "laptop", "desktop", "pc", "notebook"], icon: "laptop" },
  { id: "phones-tablets", name: "Phones & Tablets", description: "Smartphones, tablets, setup, configuration and support.", keywords: ["phone", "smartphone", "tablet", "mobile"], icon: "cellphone" },
  { id: "accessories", name: "Accessories", description: "Chargers, cables, keyboards, mice and everyday technology accessories.", keywords: ["accessory", "accessories", "charger", "cable", "keyboard", "mouse", "adapter"], icon: "keyboard" },
  { id: "networking", name: "Networking", description: "Routers, Wi-Fi, connectivity, installation and network support.", keywords: ["network", "router", "switch", "wifi", "wireless", "ethernet", "connectivity"], icon: "lan" },
  { id: "software-applications", name: "Software & Applications", description: "Software setup, applications, licensing and configuration.", keywords: ["software", "application", "app", "licensing", "operating system"], icon: "monitor" },
  { id: "repairs-maintenance", name: "Repairs & Maintenance", description: "Diagnostics, repairs, maintenance and technology troubleshooting.", keywords: ["repair", "maintenance", "diagnostic", "troubleshooting", "fix"], icon: "wrench" },
  { id: "printers-printing", name: "Printers & Printing", description: "Printers, scanners, toner, ink, installation and support.", keywords: ["printer", "printing", "scanner", "toner", "ink"], icon: "printer" },
  { id: "cctv-security", name: "CCTV & Security", description: "CCTV, surveillance, monitoring and security technology.", keywords: ["cctv", "security", "camera", "surveillance", "monitoring"], icon: "shield-check-outline" },
  { id: "data-storage", name: "Data & Storage", description: "Storage, backups, servers, recovery and infrastructure.", keywords: ["data", "storage", "backup", "server", "recovery", "hard drive"], icon: "server" },
  { id: "it-support", name: "IT Support", description: "Practical IT support for individuals, businesses and organizations.", keywords: ["support", "technical support", "helpdesk", "help desk"], icon: "headset" },
  { id: "web-digital-solutions", name: "Web & Digital Solutions", description: "Websites, digital systems and modern technology solutions.", keywords: ["web", "website", "digital", "development", "online"], icon: "code-tags" },
  { id: "technology-consultation", name: "Technology Consultation", description: "Technology guidance to help you choose and implement the right solutions.", keywords: ["consultation", "consulting", "technology advice", "solution"], icon: "creation" },
] as const;

function matchesTechnologyCategory(item: CatalogItem, categoryId: string) {
  const category = technologyCategories.find((entry) => entry.id === categoryId);
  if (!category) return false;
  const searchable = [item.category, item.name, item.description].filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const words = new Set(searchable.split(" "));
  return category.keywords.some((keyword) => {
    const normalized = keyword.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalized.includes(" ") ? searchable.includes(normalized) : words.has(normalized);
  });
}

const mobileMoneyQuickActions = [
  { id: "cash-in", name: "Cash In", description: "Deposit funds", icon: "arrow-down-bold-outline" },
  { id: "withdraw", name: "Cash Out", description: "Withdraw funds", icon: "arrow-up-bold-outline" },
  { id: "send-money", name: "Send Money", description: "Transfer funds", icon: "send-outline" },
  { id: "airtime", name: "Airtime", description: "Buy airtime", icon: "cellphone" },
] as const;

const mobileMoneyDefaultServices = [
  { id: "airtel-money", name: "Airtel Money", description: "Send, receive, deposit and withdraw funds using Airtel Money.", category: "Mobile Money" },
  { id: "mtn-money", name: "MTN Money", description: "Convenient everyday mobile money transactions.", category: "Mobile Money" },
  { id: "zamtel-money", name: "Zamtel Money", description: "Mobile money transactions using Zamtel Money.", category: "Mobile Money" },
  { id: "send-money", name: "Send Money", description: "Send money using a supported mobile money network.", category: "Transfers" },
  { id: "withdraw", name: "Withdraw Cash", description: "Withdraw cash from your mobile money account.", category: "Cash Out" },
  { id: "cash-in", name: "Cash Deposit", description: "Deposit cash to your mobile money account.", category: "Cash In" },
  { id: "airtime", name: "Buy Airtime", description: "Purchase airtime using your preferred network.", category: "Airtime" },
  { id: "bills", name: "Pay Bills", description: "Make supported bill payments through mobile money.", category: "Payments" },
] as const;

function Button({ title, onPress, secondary = false, gold = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; gold?: boolean; disabled?: boolean }) {
  const loading = disabled && (title.includes("…") || title.toLowerCase().includes("loading"));
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: loading }} disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, gold && styles.goldButton, disabled && { opacity: 0.68 }]}>{loading && <ActivityIndicator size="small" color={secondary ? NAVY : gold ? NAVY : "#FFFFFF"} />}<Text style={[styles.buttonText, secondary && styles.secondaryButtonText, gold && styles.goldButtonText]}>{title}</Text></Pressable>;
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; secureTextEntry?: boolean; keyboardType?: "email-address" | "default" | "phone-pad" }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"} autoCorrect={false} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3B8" secureTextEntry={secureTextEntry} style={styles.input} value={value} /></View>;
}

function Card({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={[styles.card, style]}>{children}</Pressable>;
}

function CustomerHeader({ profile, unread, onProfile, onNotifications, onBookings, onSignOut, onNavigate }: {
  profile: { full_name: string; email: string; avatar_url: string | null } | null;
  unread: boolean;
  onProfile: () => void;
  onNotifications: () => void;
  onBookings: () => void;
  onSignOut: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = profile?.full_name.trim().split(" ")[0] || "Customer";
  function menuAction(action: () => void) { setMenuOpen(false); action(); }
  return (
    <>
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <Image source={require("./assets/app-icon.png")} resizeMode="contain" style={styles.headerLogo} />
          <View style={styles.brandCopy}><Text numberOfLines={1} style={styles.brandName}>ALESSANDRO</Text><Text style={styles.brandSubname}>ENTERPRISES</Text></View>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onNotifications} style={styles.headerIconButton}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#FFFFFF" />{unread && <View style={styles.notificationDot} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Customer profile menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen((current) => !current)} style={styles.profileButton}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <View style={styles.avatarButton}><Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text></View>}
            <Text numberOfLines={1} style={styles.profileName}>{firstName}</Text>
            <MaterialCommunityIcons name={menuOpen ? "chevron-up" : "chevron-down"} size={16} color={GOLD} />
          </Pressable>
        </View>
      </View>
    </View>
    <Modal visible={menuOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuOpen(false)}>
      <View style={[styles.menuOverlay, { paddingTop: Constants.statusBarHeight + 66, paddingHorizontal: 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close customer menu" onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} />
        <View style={styles.accountMenu}>
          <View style={styles.accountMenuHeader}>
            <View style={styles.accountMenuAvatar}>{profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.accountMenuAvatarImage} /> : <Text style={styles.accountMenuAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>}</View>
            <View style={styles.flex}><Text numberOfLines={1} style={styles.accountMenuName}>Hello, {firstName}</Text><Text numberOfLines={1} style={styles.accountMenuEmail}>Alessandro Enterprises</Text></View>
          </View>
          <View style={styles.menuDivider} />
          <ScrollView style={styles.accountMenuScroll} contentContainerStyle={styles.accountMenuContent} showsVerticalScrollIndicator={false}>
            <MenuRow icon="account-outline" label="My Profile" onPress={() => menuAction(onProfile)} />
            <MenuRow icon="cog-outline" label="Account Settings" onPress={() => menuAction(() => onNavigate("accountSettings"))} />
            <MenuRow icon="bell-outline" label="Notifications" onPress={() => menuAction(onNotifications)} />
            <MenuRow icon="message-outline" label="Messages" onPress={() => menuAction(() => onNavigate("messages"))} />
            <MenuRow icon="calendar-month-outline" label="My Bookings" onPress={() => menuAction(onBookings)} />
            <MenuRow icon="history" label="Activity History" onPress={() => menuAction(() => onNavigate("activity"))} />
            <MenuRow icon="file-document-outline" label="Requests" onPress={() => menuAction(() => onNavigate("requests"))} />
            <MenuRow icon="email-outline" label="Emails" onPress={() => menuAction(() => onNavigate("emails"))} />
            <View style={styles.menuDivider} />
            <MenuRow icon="cog-outline" label="Preferences" onPress={() => menuAction(() => onNavigate("preferences"))} />
            <MenuRow icon="help-circle-outline" label="Support" onPress={() => menuAction(() => onNavigate("support"))} />
            <MenuRow icon="logout" label="Sign Out" destructive onPress={() => menuAction(onSignOut)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
}

function MenuRow({ icon, label, onPress, destructive = false }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; label: string; onPress: () => void; destructive?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}><View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}><MaterialCommunityIcons name={icon} size={17} color={destructive ? "#EF4444" : NAVY} /></View><Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text></Pressable>;
}

export default function App() {
  const systemColorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const homeCarouselRef = useRef<ScrollView>(null);
  const homeCarouselIndex = useRef(0);
  const [homeCarouselPage, setHomeCarouselPage] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [screen, setScreenState] = useState<Screen>("home");
  const screenHistory = useRef<Screen[]>([]);
  function setScreen(next: Screen) {
    if (next !== screen) screenHistory.current = [...screenHistory.current.slice(-39), screen];
    setScreenState(next);
  }
  function goBack(fallback: Screen = "home") {
    const previous = screenHistory.current.pop();
    setScreenState(previous ?? fallback);
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!session || screen === "home") return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [screen, session]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [bookingBranches, setBookingBranches] = useState<BookingBranch[]>([]);
  const [bookingEmployees, setBookingEmployees] = useState<BookingEmployee[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isBrowsingCartProducts, setIsBrowsingCartProducts] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<Communication[]>([]);
  const [emails, setEmails] = useState<Communication[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [businessPosts, setBusinessPosts] = useState<BusinessPost[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<LoanProduct | null>(null);
  const [collateralOptions, setCollateralOptions] = useState<CollateralOption[]>([]);
  const [selectedCollateral, setSelectedCollateral] = useState("");
  const [selectedLoanTerm, setSelectedLoanTerm] = useState("");
  const [collateralWorth, setCollateralWorth] = useState("");
  const [loanResidentialAddress, setLoanResidentialAddress] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [loanApplicationDate, setLoanApplicationDate] = useState(localDateKey(new Date()));
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(false);
  const [supportContacts, setSupportContacts] = useState<{ phone: string | null; whatsapp: string | null; email: string | null }>({ phone: null, whatsapp: null, email: null });
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("alessandrosenterprises@gmail.com");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailFilter, setEmailFilter] = useState<"all" | "unread" | "received" | "sent">("all");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanNotes, setLoanNotes] = useState("");
  const [consultationSubject, setConsultationSubject] = useState("");
  const [consultationBody, setConsultationBody] = useState("");
  const [consultationType, setConsultationType] = useState("general");
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationTime, setConsultationTime] = useState("09:00");
  const [showConsultationDatePicker, setShowConsultationDatePicker] = useState(false);
  const [preferenceValues, setPreferenceValues] = useState({ email_notifications: true, push_notifications: true, booking_reminders: true, message_notifications: true, promotional_notifications: false, appearance: "system", language: "en" });
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string; phone: string; avatar_url: string | null } | null>(null);
  const [savedServiceIds, setSavedServiceIds] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState("");
  const statusSnapshot = useRef(new Map<string, string>());
  const notificationPermissionAsked = useRef(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [imagePreview, setImagePreview] = useState<{ uri: string; title: string } | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [businessContentKind, setBusinessContentKind] = useState<"products" | "services" | "promotions" | "gallery" | "posts">("products");
  const [businessCategory, setBusinessCategory] = useState("");
  const [selectedTechCategory, setSelectedTechCategory] = useState("");
  const [techCategoryView, setTechCategoryView] = useState<"products" | "services" | "gallery">("products");
  const [businessSearch, setBusinessSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [bookingSection, setBookingSection] = useState<"upcoming" | "history">("upcoming");
  const [orderSection, setOrderSection] = useState<"active" | "history">("active");
  const [selectedMobileMoneyService, setSelectedMobileMoneyService] = useState("");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profilePhoneDraft, setProfilePhoneDraft] = useState("");
  const [profileFirstNameDraft, setProfileFirstNameDraft] = useState("");
  const [profileLastNameDraft, setProfileLastNameDraft] = useState("");
  const [profileDisplayNameDraft, setProfileDisplayNameDraft] = useState("");
  const [supportIssueType, setSupportIssueType] = useState("Computer & Laptop Support");
  const [supportDevice, setSupportDevice] = useState("");
  const [supportProblem, setSupportProblem] = useState("");
  const [supportUrgency, setSupportUrgency] = useState("Normal");
  const [supportContactPreference, setSupportContactPreference] = useState("Phone");
  const [supportAdditionalDetails, setSupportAdditionalDetails] = useState("");
  const [repairDevice, setRepairDevice] = useState("");
  const [repairBrand, setRepairBrand] = useState("");
  const [repairModel, setRepairModel] = useState("");
  const [repairProblem, setRepairProblem] = useState("");
  const [repairCondition, setRepairCondition] = useState("");
  const [repairContactPreference, setRepairContactPreference] = useState("Phone");
  const [repairNotes, setRepairNotes] = useState("");
  const [tab, setTab] = useState<Screen>("home");
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [bookingDate, setBookingDate] = useState(localDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookingTime, setBookingTime] = useState("09:00");
  const [showBookingTimePicker, setShowBookingTimePicker] = useState(false);
  const [bookingBranchId, setBookingBranchId] = useState("");
  const [bookingEmployeeId, setBookingEmployeeId] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderFulfillment, setOrderFulfillment] = useState<"Pickup" | "Delivery">("Pickup");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  const darkTheme = preferenceValues.appearance === "dark" || (preferenceValues.appearance === "system" && systemColorScheme === "dark");
  NAVY = darkTheme ? "#F1F5F9" : "#03162F";
  MUTED = darkTheme ? "#AAB8C9" : "#64748B";
  styles = darkTheme ? darkStyles : lightStyles;

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { void AsyncStorage.getItem("aeos:saved-customer-services").then((stored) => { if (stored) { const parsed: unknown = JSON.parse(stored); if (Array.isArray(parsed)) setSavedServiceIds(parsed.filter((id): id is string => typeof id === "string")); } }).catch(() => undefined); }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !session?.user) return;
    setPreferencesLoaded(false);
    const user = session.user;
    const [businessResult, catalogResult, branchResult, employeeResult, customerResult, profileResult, promotionResult, galleryResult, settingsResult, postsResult, loanProductsResult, loanTermsResult, collateralResult, mobileMoneyServicesResult] = await Promise.all([
      supabase.from("businesses").select("id,name,slug,description,logo_url").eq("active", true).order("name"),
      supabase.from("enterprise_catalog").select("id,business_id,item_type,category,name,description,base_price,quantity,status,image_url,created_at,attributes,businesses(name,slug,logo_url)").ilike("status", "active").order("name"),
      supabase.from("branches").select("id,business_id,name,city,active").eq("active", true).order("name"),
      supabase.from("employees").select("id,business_id,branch_id,full_name,position,is_active,status").eq("is_active", true).eq("status", "Active").order("full_name"),
      supabase.from("customers").select("id,full_name,email,phone").eq("auth_user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("id,first_name,last_name,display_name,email,phone,avatar_url").eq("auth_user_id", user.id).maybeSingle(),
      supabase.from("business_promotions").select("id,business_id,title,description,discount_text,price,image_url,end_date").eq("active", true).eq("published", true).order("created_at", { ascending: false }),
      supabase.from("business_gallery").select("id,business_id,image_url,title,caption").eq("active", true).order("display_order"),
      supabase.from("company_settings").select("phone,whatsapp,email").eq("singleton_key", "default").maybeSingle(),
      supabase.from("business_posts").select("id,business_id,title,content,image_url,post_type,published_at").eq("published", true).order("published_at", { ascending: false }),
      supabase.from("loan_products").select("id,name,description,min_amount,max_amount,interest_rate,repayment_period,requires_collateral").eq("status", "Active").order("name"),
      supabase.from("loan_product_terms").select("id,loan_product_id,period_days,interest_rate").eq("active", true).order("period_days"),
      supabase.from("collateral_catalogue").select("id,name,description").eq("active", true).order("name"),
      supabase.from("mobile_money_services").select("id,name,description,service_type").eq("status", "Active").order("name"),
    ]);
    if (businessResult.error) throw businessResult.error;
    if (catalogResult.error) throw catalogResult.error;
    setBusinesses((businessResult.data ?? []) as Business[]);
    setBookingBranches((branchResult.data ?? []) as BookingBranch[]);
    setBookingEmployees((employeeResult.data ?? []) as BookingEmployee[]);
    setPromotions((promotionResult.data ?? []) as Promotion[]);
    setGallery((galleryResult.data ?? []) as GalleryImage[]);
    setBusinessPosts((postsResult.data ?? []) as BusinessPost[]);
    const activeTerms = (loanTermsResult.data ?? []) as { id: string; loan_product_id: string; period_days: number; interest_rate: number }[];
    setLoanProducts(((loanProductsResult.data ?? []) as LoanProduct[]).map((product) => ({ ...product, terms: activeTerms.filter((term) => term.loan_product_id === product.id) })));
    setCollateralOptions((collateralResult.data ?? []) as CollateralOption[]);
    setSupportContacts({ phone: settingsResult.data?.phone ?? null, whatsapp: settingsResult.data?.whatsapp ?? null, email: settingsResult.data?.email ?? null });
    const activeBusinesses = new Set((businessResult.data ?? []).map((business) => business.id));
    const baseCatalog = ((catalogResult.data ?? []) as unknown as CatalogItem[]).filter((item) => activeBusinesses.has(item.business_id));
    const mobileMoneyBusiness = (businessResult.data ?? []).find((business) => business.slug === "mobile-money");
    const configuredMobileServices: CatalogItem[] = mobileMoneyBusiness ? ((mobileMoneyServicesResult.data ?? []) as { id: string; name: string; description: string | null; service_type: string }[]).map((service) => ({ id: `configured-${service.id}`, business_id: mobileMoneyBusiness.id, item_type: "service", category: service.service_type, name: service.name, description: service.description, base_price: null, quantity: null, status: "active", image_url: null, businesses: { name: mobileMoneyBusiness.name, slug: mobileMoneyBusiness.slug } })) : [];
    setCatalog([...baseCatalog, ...configuredMobileServices]);
    setCustomerId(customerResult.data?.id ?? "");
    const displayName = profileResult.data?.display_name || [profileResult.data?.first_name, profileResult.data?.last_name].filter(Boolean).join(" ") || customerResult.data?.full_name || "Customer";
    setProfile({ full_name: displayName, email: profileResult.data?.email ?? user.email ?? "", phone: profileResult.data?.phone ?? customerResult.data?.phone ?? "", avatar_url: profileResult.data?.avatar_url ?? null });
    setProfileNameDraft(displayName);
    setProfilePhoneDraft(profileResult.data?.phone ?? customerResult.data?.phone ?? "");
    const nameParts = displayName.split(/\s+/);
    setProfileFirstNameDraft(profileResult.data?.first_name ?? nameParts[0] ?? "");
    setProfileLastNameDraft(profileResult.data?.last_name ?? nameParts.slice(1).join(" "));
    setProfileDisplayNameDraft(profileResult.data?.display_name ?? displayName);
    if (!customerResult.data?.id) { setActivities([]); setMessages([]); setEmails([]); setLoans([]); setPreferencesLoaded(true); setInitialDataLoading(false); return; }
    const [bookingResult, orderResult, notificationCurrent, notificationLegacy, messageResult, emailResult, loanResult, preferencesResult] = await Promise.all([
      supabase.from("bookings").select("id,status,created_at,booking_date,booking_time,amount,notes,payment_status,business_id,businesses(name),branches(name),employees(full_name),enterprise_catalog(name)").eq("customer_id", customerResult.data.id).order("booking_date", { ascending: true }).order("booking_time", { ascending: true }).limit(100),
      supabase.from("orders").select("id,status,created_at,updated_at,total_amount,subtotal,notes,payment_status,fulfillment_method,delivery_address,business_id,businesses(name),order_items(quantity,unit_price,total_price,enterprise_catalog(name))").eq("customer_id", customerResult.data.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("notifications").select("id,type,title,sender,preview,message,business,notification_date,amount,subject,action_url,unread,read_at,created_at").eq("user_id", profileResult.data?.id ?? "").order("created_at", { ascending: false }).limit(50),
      supabase.from("notifications").select("id,type,title,sender,preview,message,business,notification_date,amount,subject,is_read,read_at,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("messages").select("id,subject,body,sender_name,sender_email,status,created_at,business_id").eq("customer_id", customerResult.data.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("emails").select("id,subject,body,sender_name,sender_email,status,created_at,business_id").eq("customer_id", customerResult.data.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("customer_loan_applications").select("id,application_number,loan_type,requested_amount,approved_amount,outstanding_balance,status,application_date,loan_purpose,rejection_reason").eq("customer_id", customerResult.data.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("customer_preferences").select("email_notifications,push_notifications,booking_reminders,message_notifications,promotional_notifications,appearance,language").eq("customer_id", customerResult.data.id).maybeSingle(),
    ]);
    const notificationData = notificationCurrent.data?.length ? notificationCurrent.data : notificationLegacy.data;
    const rows: Activity[] = [
      ...((bookingResult.data ?? []) as unknown as (Activity & { businesses?: { name: string } | null; branches?: { name: string } | null; employees?: { full_name: string } | null; enterprise_catalog?: { name: string } | null })[]).map((item) => ({ ...item, business_name: item.businesses?.name, branch_name: item.branches?.name, staff_name: item.employees?.full_name, service_name: item.enterprise_catalog?.name, title: "Booking" })),
      ...((orderResult.data ?? []) as unknown as (Activity & { businesses?: { name: string } | null })[]).map((item) => ({ ...item, business_name: item.businesses?.name, title: "Order" })),
      ...((notificationData ?? []).map((item: any) => ({ ...item, unread: item.unread ?? !item.is_read, status: item.status ?? "Update", title: item.title ?? "Update" })) as Activity[]),
    ];
    statusSnapshot.current = new Map<string, string>();
    for (const [table, records] of [["bookings", bookingResult.data], ["orders", orderResult.data], ["messages", messageResult.data], ["emails", emailResult.data]] as const) {
      for (const record of (records ?? []) as { id: string; status?: string | null; payment_status?: string | null }[]) {
        statusSnapshot.current.set(`${table}:${record.id}`, `${record.status ?? ""}|${record.payment_status ?? ""}`);
      }
    }
    setActivities((current) => [...rows, ...current.filter((item) => item.id.startsWith("local-"))].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setMessages((messageResult.data ?? []) as Communication[]);
    setEmails((emailResult.data ?? []) as Communication[]);
    setLoans((loanResult.data ?? []) as LoanApplication[]);
    if (preferencesResult.data) setPreferenceValues((current) => ({ ...current, ...preferencesResult.data }));
    setPreferencesLoaded(true);
    setInitialDataLoading(false);
  }, [session]);

  useEffect(() => { if (session) void loadData().catch((error: Error) => { setInitialDataLoading(false); Alert.alert("Could not load customer data", error.message); }); }, [session, loadData]);
  const refresh = useCallback(async () => { setRefreshing(true); try { await loadData(); } catch (error) { Alert.alert("Refresh failed", error instanceof Error ? error.message : "Try again."); } finally { setRefreshing(false); } }, [loadData]);
  const presentStatusNotification = useCallback(async (title: string, body: string) => {
    try {
      await scheduleNotificationAsync({ content: { title, body, sound: "default", color: GOLD }, trigger: null });
      if (AppState.currentState === "active") Vibration.vibrate([0, 180, 100, 180]);
    } catch (error) { console.warn("Could not present customer status notification:", error); }
  }, []);
  useEffect(() => {
    void ensureStatusNotificationChannel();
  }, []);
  useEffect(() => {
    if (!preferencesLoaded || !customerId || !preferenceValues.push_notifications || notificationPermissionAsked.current) return;
    notificationPermissionAsked.current = true;
    void (async () => {
      const { status } = await getPermissionsAsync();
      if (status === "undetermined") await requestPermissionsAsync();
    })().catch((error) => console.warn("Could not request notification permission:", error));
  }, [preferencesLoaded, customerId, preferenceValues.push_notifications]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active" && customerId) void refresh(); });
    return () => subscription.remove();
  }, [customerId, refresh]);
  useEffect(() => {
    if (!supabase || !customerId) return;
    const channel = supabase.channel(`customer-status-${customerId}`);
    const handleChange = (table: "orders" | "bookings" | "emails" | "messages", payload: any) => {
      const record = payload.new as Record<string, any> | undefined;
      if (!record?.id) return;
      const key = `${table}:${record.id}`;
      const nextStatus = `${record.status ?? ""}|${record.payment_status ?? ""}`;
      const cachedStatus = statusSnapshot.current.get(key);
      if (payload.eventType === "UPDATE" && cachedStatus === undefined && payload.old?.status == null && payload.old?.payment_status == null) { statusSnapshot.current.set(key, nextStatus); return; }
      const previousStatus = cachedStatus ?? `${payload.old?.status ?? ""}|${payload.old?.payment_status ?? ""}`;
      statusSnapshot.current.set(key, nextStatus);
      if (payload.eventType === "INSERT") {
        if ((table === "messages" || table === "emails") && record.source !== "Customer Portal" && !["sent", "draft"].includes(String(record.status ?? "").toLowerCase())) {
          const title = table === "messages" ? "New message" : "New email";
          const body = record.subject || (table === "messages" ? "You received a new customer message." : "You received a new email.");
          setActivities((current) => [{ id: `local-${key}-${Date.now()}`, title, status: "New", message: body, action_url: table === "messages" ? `/customer/messages/${record.id}` : `/customer/emails/${record.id}`, created_at: new Date().toISOString(), unread: true }, ...current]);
          if (preferenceValues.push_notifications && (table === "messages" ? preferenceValues.message_notifications : preferenceValues.email_notifications)) void presentStatusNotification(title, body);
        }
        return;
      }
      if (payload.eventType !== "UPDATE" || previousStatus === nextStatus) return;
      const [previousOrderStatus] = previousStatus.split("|");
      const statusChanged = previousOrderStatus !== String(record.status ?? "");
      const statusText = statusChanged ? record.status || "updated" : record.payment_status || "updated";
      const kind = table === "orders" ? "Order" : table === "bookings" ? "Booking" : table === "emails" ? "Email" : "Message";
      const changeLabel = statusChanged ? "status" : "payment status";
      const title = `${kind} ${changeLabel} update`;
      const body = `${record.subject ? `“${record.subject}”` : `Your ${kind.toLowerCase()}`} ${changeLabel} is now ${String(statusText).toLowerCase()}.`;
      const createdAt = new Date().toISOString();
      const actionUrl = table === "orders" ? `/customer/orders/${record.id}` : table === "bookings" ? `/customer/bookings/${record.id}` : table === "messages" ? `/customer/messages/${record.id}` : `/customer/emails/${record.id}`;
      setActivities((current) => [{ id: `local-${key}-${Date.now()}`, title, status: statusText, message: body, action_url: actionUrl, created_at: createdAt, unread: true }, ...current.map((item) => item.id === record.id ? { ...item, status: record.status ?? item.status, payment_status: record.payment_status ?? item.payment_status, updated_at: createdAt } : item)]);
      if (table === "messages") setMessages((current) => current.map((item) => item.id === record.id ? { ...item, status: statusText } : item));
      if (table === "emails") setEmails((current) => current.map((item) => item.id === record.id ? { ...item, status: statusText } : item));
      if (preferenceValues.push_notifications && ((table === "messages" && preferenceValues.message_notifications) || (table === "emails" && preferenceValues.email_notifications) || table === "orders" || table === "bookings")) void presentStatusNotification(title, body);
    };
    for (const table of ["orders", "bookings", "emails", "messages"] as const) {
      channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `customer_id=eq.${customerId}` }, (payload) => handleChange(table, payload));
    }
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [customerId, preferenceValues.push_notifications, preferenceValues.message_notifications, preferenceValues.email_notifications, presentStatusNotification]);
  const services = useMemo(() => catalog.filter((item) => item.item_type?.toLowerCase() === "service"), [catalog]);
  const products = useMemo(() => catalog.filter((item) => { const kind = item.item_type?.toLowerCase(); return !kind || ["product", "goods", "item", "order", "retail"].includes(kind); }), [catalog]);
  const bookings = useMemo(() => activities.filter((item) => item.title === "Booking"), [activities]);
  const orders = useMemo(() => activities.filter((item) => item.title === "Order"), [activities]);
  const notifications = useMemo(() => activities.filter((item) => item.title !== "Booking" && item.title !== "Order"), [activities]);
  const freshCutoff = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);
  const newProducts = useMemo(() => catalog.filter((item) => item.item_type?.toLowerCase() !== "service" && item.created_at && new Date(item.created_at).getTime() >= freshCutoff).slice(0, 5), [catalog, freshCutoff]);
  const recentPosts = useMemo(() => businessPosts.filter((post) => post.published_at && new Date(post.published_at).getTime() >= freshCutoff), [businessPosts, freshCutoff]);
  const homeSlides = useMemo(() => [
    ...gallery.slice(0, 3).map((item) => ({ id: `gallery-${item.id}`, title: item.title || "From our businesses", subtitle: item.caption || businesses.find((business) => business.id === item.business_id)?.name || "Alessandro Enterprises", image: item.image_url, label: "BUSINESS SPOTLIGHT" })),
    ...promotions.filter((item) => item.image_url).slice(0, 2).map((item) => ({ id: `promotion-${item.id}`, title: item.title, subtitle: item.discount_text || item.description || businesses.find((business) => business.id === item.business_id)?.name || "Limited time offer", image: item.image_url!, label: "SPECIAL OFFER" })),
    ...newProducts.filter((item) => item.image_url).slice(0, 3).map((item) => ({ id: `product-${item.id}`, title: item.name, subtitle: `${businessName(item)} · ${item.base_price == null ? "Contact us" : money(item.base_price)}`, image: item.image_url!, label: "NEW THIS WEEK" })),
    ...businessPosts.filter((item) => item.image_url).slice(0, 2).map((item) => ({ id: `post-${item.id}`, title: item.title, subtitle: businesses.find((business) => business.id === item.business_id)?.name || "Business update", image: item.image_url!, label: "LATEST UPDATE" })),
  ].slice(0, 8), [gallery, promotions, newProducts, businessPosts, businesses, catalog]);
  const homeSlideWidth = Math.min(windowWidth, 760) - 48;
  useEffect(() => {
    if (screen !== "home" || homeSlides.length < 2) return;
    const timer = setInterval(() => {
      homeCarouselIndex.current = (homeCarouselIndex.current + 1) % homeSlides.length;
      setHomeCarouselPage(homeCarouselIndex.current);
      homeCarouselRef.current?.scrollTo({ x: homeCarouselIndex.current * (homeSlideWidth + 12), animated: true });
    }, 4800);
    return () => clearInterval(timer);
  }, [screen, homeSlides.length, homeSlideWidth]);
  useEffect(() => {
    const currentIndex = homeSlides.length ? homeCarouselIndex.current % homeSlides.length : 0;
    homeCarouselIndex.current = currentIndex;
    setHomeCarouselPage(currentIndex);
    homeCarouselRef.current?.scrollTo({ x: currentIndex * (homeSlideWidth + 12), animated: false });
  }, [homeSlides.length, homeSlideWidth]);

  async function signIn() {
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) { setBusy(false); Alert.alert("Sign in failed", error.message); return; }
    const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", data.user.id).maybeSingle();
    setBusy(false);
    if (!customer) { await supabase.auth.signOut(); Alert.alert("Customer account required", "Sign in with your customer portal account."); }
  }

  async function resetPassword() {
    if (!supabase || !email.trim()) return Alert.alert("Email required", "Enter the email address for your customer account first.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setBusy(false);
    if (error) return Alert.alert("Could not send reset email", error.message);
    Alert.alert("Check your email", "If your customer account exists, a password reset link has been sent.");
  }

  async function registerCustomer() {
    if (!customerApiBase) return Alert.alert("Registration unavailable", "Set EXPO_PUBLIC_CUSTOMER_API_BASE_URL to your customer portal server address.");
    if (registerPassword.length < 8) return Alert.alert("Password too short", "Use at least 8 characters.");
    if (registerPassword !== registerConfirmPassword) return Alert.alert("Passwords do not match", "Check the password confirmation and try again.");
    setBusy(true);
    try {
      const response = await fetch(`${customerApiBase}/api/customer/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: registerFirstName.trim(), lastName: registerLastName.trim(), email: registerEmail.trim(), phone: registerPhone.trim(), password: registerPassword }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create your customer account.");
      Alert.alert("Account created", "Your customer account is ready. Sign in to continue.");
      setRegisterError("");
      setEmail(registerEmail.trim()); setPassword(""); setAuthScreen("login");
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Check your connection and try again.");
    } finally { setBusy(false); }
  }

  async function signOut() { if (!supabase) return; await supabase.auth.signOut(); screenHistory.current = []; setInitialDataLoading(true); setPreferencesLoaded(false); notificationPermissionAsked.current = false; statusSnapshot.current.clear(); setActivities([]); setCustomerId(""); setProfile(null); setScreenState("home"); setTab("home"); }
  async function createBooking() {
    if (!supabase || !customerId || !selectedItem) return Alert.alert("Account needed", "Your customer profile could not be found.");
    const activeBranches = bookingBranches.filter((branch) => branch.business_id === selectedItem.business_id);
    if (!bookingDate) return Alert.alert("Date required", "Choose your appointment date.");
    if (!bookingTime) return Alert.alert("Time required", "Choose your appointment time.");
    if (activeBranches.length > 0 && !bookingBranchId) return Alert.alert("Branch required", "Choose the branch where you would like to book.");
    setBusy(true);
    const bookingPayload = { business_id: selectedItem.business_id, customer_id: customerId, catalog_item_id: selectedItem.id.startsWith("configured-") || selectedItem.id.startsWith("mobile-action-") ? null : selectedItem.id, branch_id: bookingBranchId || null, employee_id: bookingEmployeeId || null, booking_date: bookingDate, booking_time: bookingTime, status: "Pending", payment_status: "Pending", amount: Number(selectedItem.base_price ?? 0), notes: bookingNotes.trim() || null };
    const { error } = await supabase.from("bookings").insert(bookingPayload);
    setBusy(false);
    if (error) return Alert.alert("Booking failed", error.message);
    Alert.alert("Booking requested", "Your booking request has been sent."); setBookingNotes(""); setScreen("bookings"); setTab("bookings"); await refresh();
  }

  async function createOrder() {
    if (!supabase || !customerId || !cart.length) return Alert.alert("Cart is empty", "Add a product before placing your order.");
    setBusy(true);
    const amount = cart.reduce((sum, line) => sum + Number(line.item.base_price ?? 0) * line.quantity, 0);
    const businessId = cart[0].item.business_id;
    if (orderFulfillment === "Delivery" && !deliveryAddress.trim()) { setBusy(false); return Alert.alert("Delivery address needed", "Add the address where this order should be delivered."); }
    const { data: order, error } = await supabase.from("orders").insert({ business_id: businessId, customer_id: customerId, status: "Pending", payment_status: "Pending", fulfillment_method: orderFulfillment, delivery_address: orderFulfillment === "Delivery" ? deliveryAddress.trim() : null, notes: orderNotes.trim() || null, subtotal: amount, total_amount: amount }).select("id").single();
    if (!error && order) {
      const itemResult = await supabase.from("order_items").insert(cart.map(({ item, quantity }) => ({ order_id: order.id, catalog_item_id: item.id, quantity, unit_price: Number(item.base_price ?? 0), total_price: Number(item.base_price ?? 0) * quantity })));
      if (itemResult.error) { await supabase.from("orders").delete().eq("id", order.id).eq("customer_id", customerId); setBusy(false); return Alert.alert("Order items failed", itemResult.error.message); }
    }
    setBusy(false);
    if (error) return Alert.alert("Order failed", error.message);
    Alert.alert("Order placed", "Your order has been sent to the business."); setCart([]); setIsBrowsingCartProducts(false); setSelectedItem(null); setOrderNotes(""); setDeliveryAddress(""); setScreen("orders"); setTab("orders"); setOrderFulfillment("Pickup"); setOrderSearch(""); await refresh();
  }

  function addToCart(item: CatalogItem) {
    if (cart.length && cart[0].item.business_id !== item.business_id) return Alert.alert("One business per order", "Please place or clear your current order before shopping with another business.");
    const existing = cart.find((line) => line.item.id === item.id);
    const nextQuantity = (existing?.quantity ?? 0) + 1;
    if (item.quantity != null && nextQuantity > item.quantity) return Alert.alert("Stock limit reached", `Only ${item.quantity} of this product are available.`);
    setCart((current) => existing ? current.map((line) => line.item.id === item.id ? { ...line, quantity: nextQuantity } : line) : [...current, { item, quantity: 1 }]);
    setIsBrowsingCartProducts(false);
    setScreen("order");
    setTab("orders");
  }

  function updateCartQuantity(itemId: string, change: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.item.id !== itemId) return [line];
      const quantity = line.quantity + change;
      if (quantity <= 0) return [];
      if (line.item.quantity != null && quantity > line.item.quantity) { Alert.alert("Stock limit reached", `Only ${line.item.quantity} of this product are available.`); return [line]; }
      return [{ ...line, quantity }];
    }));
  }

  async function cancelBookingRequest() {
    if (!supabase || !customerId || !selectedActivity || selectedActivity.title !== "Booking") return;
    Alert.alert("Cancel this booking?", "The business will be notified that you can no longer attend.", [
      { text: "Keep booking", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: () => {
        void (async () => {
          setBusy(true);
          const { error } = await supabase!.from("bookings").update({ status: "Cancelled" }).eq("id", selectedActivity.id).eq("customer_id", customerId).in("status", ["Pending", "Confirmed", "pending", "confirmed"]);
          setBusy(false);
          if (error) return Alert.alert("Could not cancel booking", error.message);
          setSelectedActivity((current) => current ? { ...current, status: "Cancelled" } : current);
          await refresh();
          Alert.alert("Booking cancelled", "Your booking has been cancelled.");
        })();
      } },
    ]);
  }

  async function sendCustomerMessage() {
    if (!supabase || !customerId || !profile || !messageSubject.trim() || !messageBody.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("messages").insert({ customer_id: customerId, parent_message_id: selectedCommunication?.id ?? null, sender_name: profile.full_name, sender_email: profile.email || null, sender_phone: profile.phone || null, subject: messageSubject.trim(), body: messageBody.trim(), source: "Customer Portal", status: "Unread", priority: "Normal" });
    setBusy(false);
    if (error) return Alert.alert("Message could not be sent", error.message);
    setMessageSubject(""); setMessageBody(""); Alert.alert("Message sent", "Your message has been sent to the Alessandro Enterprises team."); setScreen("messages"); await refresh();
  }

  async function submitTechRequest(kind: "support" | "repair") {
    if (!supabase || !customerId || !profile) return Alert.alert("Sign in required", "Sign in to send a Tech Solutions request.");
    const techBusiness = businesses.find((business) => business.slug === "tech-solutions");
    const subject = kind === "support" ? `IT Support Request - ${supportDevice || supportIssueType}` : `Repair Request - ${repairDevice || "Device"}`;
    const body = kind === "support"
      ? [`Issue type: ${supportIssueType}`, `Device: ${supportDevice}`, `Problem: ${supportProblem.trim()}`, `Urgency: ${supportUrgency}`, `Preferred contact: ${supportContactPreference}`, supportAdditionalDetails.trim() ? `Additional details: ${supportAdditionalDetails.trim()}` : ""].filter(Boolean).join("\n\n")
      : [`Device: ${repairDevice}`, `Brand: ${repairBrand || "Not provided"}`, `Model: ${repairModel || "Not provided"}`, `Problem: ${repairProblem.trim()}`, `Device condition: ${repairCondition || "Not provided"}`, `Preferred contact: ${repairContactPreference}`, repairNotes.trim() ? `Additional information: ${repairNotes.trim()}` : ""].filter(Boolean).join("\n\n");
    if (!(kind === "support" ? supportProblem.trim() : repairProblem.trim())) return Alert.alert("Describe the problem", "Add a short description so the Tech Solutions team can help.");
    setBusy(true);
    const { error } = await supabase.from("messages").insert({ customer_id: customerId, sender_name: profile.full_name, sender_email: profile.email || null, sender_phone: profile.phone || null, subject, body, business_id: techBusiness?.id ?? null, source: "Customer Portal", status: "Unread", priority: kind === "support" ? supportUrgency : "Normal" });
    setBusy(false);
    if (error) return Alert.alert("Request could not be sent", error.message);
    setSupportProblem(""); setSupportAdditionalDetails(""); setRepairProblem(""); setRepairNotes("");
    Alert.alert("Request received", "Your request has been sent to Alessandro Tech Solutions.");
    setScreen("messages"); await refresh();
  }

  async function submitLoanApplication() {
    return submitFullLoanApplication();
  }

  async function submitConsultation() {
    if (!supabase || !customerId || !profile || !consultationBody.trim()) return Alert.alert("Add a message", "Please describe the support you need.");
    const techBusiness = businesses.find((business) => business.slug === "tech-solutions");
    setBusy(true);
    const { error } = await supabase.from("technology_consultation_requests").insert({ customer_id: customerId, business_id: techBusiness?.id ?? null, name: profile.full_name, phone: profile.phone || "Not provided", email: profile.email || null, consultation_type: consultationType, preferred_date: consultationDate || null, preferred_time: consultationTime || null, subject: consultationSubject.trim() || null, message: consultationBody.trim(), status: "Pending" });
    setBusy(false);
    if (error) return Alert.alert("Request could not be sent", error.message);
    setConsultationSubject(""); setConsultationBody(""); Alert.alert("Request submitted", "Tech Solutions will contact you about your request."); setScreen("activity"); await refresh();
  }

  async function saveCustomerProfile() {
    if (!supabase || !session?.user || !profileNameDraft.trim()) return Alert.alert("Name required", "Enter your name before saving.");
    const nameParts = profileNameDraft.trim().split(/\s+/);
    const firstName = profileFirstNameDraft.trim() || nameParts[0] || "";
    const lastName = profileLastNameDraft.trim() || nameParts.slice(1).join(" ");
    const displayName = profileDisplayNameDraft.trim() || profileNameDraft.trim();
    setBusy(true);
    const [profileUpdate, customerUpdate] = await Promise.all([
      supabase.from("profiles").update({ first_name: firstName || null, last_name: lastName || null, display_name: displayName, phone: profilePhoneDraft.trim() || null }).eq("auth_user_id", session.user.id),
      customerId ? supabase.from("customers").update({ full_name: `${firstName} ${lastName}`.trim() || displayName, phone: profilePhoneDraft.trim() || null }).eq("id", customerId) : Promise.resolve({ error: null } as any),
    ]);
    setBusy(false);
    const error = profileUpdate.error ?? customerUpdate.error;
    if (error) return Alert.alert("Profile could not be saved", error.message);
    setProfile((current) => current ? { ...current, full_name: `${firstName} ${lastName}`.trim() || displayName, phone: profilePhoneDraft.trim() } : current);
    Alert.alert("Profile saved", "Your account details have been updated.");
  }

  async function updateAvatar(source: "library" | "camera" = "library") {
    if (!supabase || !session?.user) return;
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(source === "camera" ? "Camera access required" : "Photo access required", source === "camera" ? "Allow camera access to take a profile picture." : "Allow photo access to choose a profile picture.");
    const pickerOptions = { mediaTypes: "images" as ImagePicker.MediaType, allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.85 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync({ ...pickerOptions, cameraType: ImagePicker.CameraType.front }) : await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (result.canceled || !result.assets[0]) return;
    setBusy(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const extension = asset.mimeType?.split("/")[1] || "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { contentType: asset.mimeType || "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("auth_user_id", session.user.id);
      if (updateError) throw updateError;
      setProfile((current) => current ? { ...current, avatar_url: data.publicUrl } : current);
      Alert.alert("Profile photo updated", "Your new photo is now shown on your account.");
    } catch (error) { Alert.alert("Could not update photo", error instanceof Error ? error.message : "Try again."); }
    finally { setBusy(false); }
  }

  async function removeAvatar() {
    if (!supabase || !session?.user || !profile?.avatar_url) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("auth_user_id", session.user.id);
      if (error) throw error;
      const marker = "/storage/v1/object/public/avatars/";
      const objectPath = profile.avatar_url.split(marker)[1]?.split("?")[0];
      if (objectPath) {
        const { error: removeError } = await supabase.storage.from("avatars").remove([decodeURIComponent(objectPath)]);
        if (removeError) throw removeError;
      }
      setProfile((current) => current ? { ...current, avatar_url: null } : current);
      Alert.alert("Profile photo removed", "Your account is using its initials now.");
    } catch (error) { Alert.alert("Could not remove photo", error instanceof Error ? error.message : "Try again."); }
    finally { setBusy(false); }
  }

  async function submitFullLoanApplication() {
    if (!customerApiBase || !selectedLoanProduct || !selectedLoanTerm) return Alert.alert("Complete loan selection", "Choose a loan product and repayment term first.");
    const requiredMissing = !loanAmount || Number(loanAmount) <= 0 || !loanResidentialAddress.trim() || !nextOfKinName.trim() || !nextOfKinRelationship.trim() || !nextOfKinPhone.trim();
    if (requiredMissing) return Alert.alert("Complete required information", "Enter the amount, residential address, and next of kin details.");
    if (Number(loanAmount) < Number(selectedLoanProduct.min_amount ?? 0) || Number(loanAmount) > Number(selectedLoanProduct.max_amount ?? Number.MAX_SAFE_INTEGER)) return Alert.alert("Amount outside product limits", `Choose an amount between ${money(selectedLoanProduct.min_amount)} and ${money(selectedLoanProduct.max_amount)}.`);
    if (selectedLoanProduct.requires_collateral && (!selectedCollateral || !collateralWorth || Number(collateralWorth) <= 0)) return Alert.alert("Collateral details required", "Select collateral and enter its estimated value.");
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera access required", "Allow camera access to capture your NRC and selfie for the loan application.");
    const captures: { key: "nrc_front" | "nrc_back" | "selfie"; label: string; uri?: string; mimeType?: string }[] = [
      { key: "nrc_front", label: "NRC Front" }, { key: "nrc_back", label: "NRC Back" }, { key: "selfie", label: "Selfie" },
    ];
    for (const capture of captures) {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], cameraType: capture.key === "selfie" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back, allowsEditing: false, quality: 0.85 });
      if (result.canceled || !result.assets[0]) return Alert.alert("Application not submitted", `Please capture ${capture.label.toLowerCase()} to continue.`);
      capture.uri = result.assets[0].uri;
      capture.mimeType = result.assets[0].mimeType || "image/jpeg";
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("product_id", selectedLoanProduct.id);
      formData.append("term_id", selectedLoanTerm);
      formData.append("application_date", loanApplicationDate);
      formData.append("requested_amount", loanAmount);
      formData.append("loan_purpose", loanPurpose.trim());
      formData.append("residential_address", loanResidentialAddress.trim());
      formData.append("next_of_kin_name", nextOfKinName.trim());
      formData.append("next_of_kin_relationship", nextOfKinRelationship.trim());
      formData.append("next_of_kin_phone", nextOfKinPhone.trim());
      formData.append("collateral_id", selectedCollateral || "none");
      formData.append("collateral_worth", selectedCollateral ? collateralWorth : "");
      formData.append("notes", [loanPurpose.trim() && `Purpose: ${loanPurpose.trim()}`, loanNotes.trim()].filter(Boolean).join("\n"));
      for (const capture of captures) {
        const response = await fetch(capture.uri!);
        const blob = await response.blob();
        formData.append(capture.key, blob as any, `${capture.key}.${capture.mimeType?.split("/")[1] || "jpg"}`);
      }
      const { data: { session: currentSession } } = await supabase!.auth.getSession();
      const response = await fetch(`${customerApiBase}/api/customer/loan-applications`, { method: "POST", headers: { Authorization: `Bearer ${currentSession?.access_token}` }, body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your loan application could not be submitted.");
      setLoanAmount(""); setLoanPurpose(""); setLoanNotes(""); setLoanResidentialAddress(""); setNextOfKinName(""); setNextOfKinRelationship(""); setNextOfKinPhone("");
      Alert.alert("Application submitted", "Your loan application was submitted for review."); setScreen("loanHistory"); await refresh();
    } catch (error) { Alert.alert("Application could not be submitted", error instanceof Error ? error.message : "Try again."); }
    finally { setBusy(false); }
  }

  async function toggleSavedService(item: CatalogItem) {
    const next = savedServiceIds.includes(item.id) ? savedServiceIds.filter((id) => id !== item.id) : [...savedServiceIds, item.id];
    setSavedServiceIds(next);
    try { await AsyncStorage.setItem("aeos:saved-customer-services", JSON.stringify(next)); } catch { Alert.alert("Could not save service", "Device storage is unavailable."); }
  }

  async function saveCustomerPreference(key: keyof typeof preferenceValues, value: boolean | string) {
    if (!supabase || !customerId) return;
    if (key === "push_notifications" && value === true) {
      await ensureStatusNotificationChannel();
      const { status } = await getPermissionsAsync();
      if (status === "denied") return Alert.alert("Notifications are turned off", "Allow notifications in your device settings to receive order, booking and account updates with sound.");
      notificationPermissionAsked.current = false;
    }
    const next = { ...preferenceValues, [key]: value };
    setPreferenceValues(next);
    const { error } = await supabase.from("customer_preferences").upsert({ customer_id: customerId, [key]: value }, { onConflict: "customer_id" });
    if (error) { setPreferenceValues((current) => ({ ...current, [key]: preferenceValues[key] })); Alert.alert("Preference not saved", error.message); }
  }

  async function openEmailComposer() {
    const url = `mailto:${encodeURIComponent(emailRecipient.trim())}?subject=${encodeURIComponent(emailSubject.trim())}&body=${encodeURIComponent(emailBody.trim())}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) return Alert.alert("Email app unavailable", "Set up an email app on your device to send this message.");
    await Linking.openURL(url);
  }

  async function openCustomerWebsite() {
    const websiteUrl = customerApiBase.replace(/\/+$/, "").replace(/\/api$/, "");
    if (!websiteUrl) return Alert.alert("Website unavailable", "The Alessandro Enterprises website is not configured on this device.");
    try {
      if (!(await Linking.canOpenURL(websiteUrl))) throw new Error("No browser is available.");
      await Linking.openURL(websiteUrl);
    } catch {
      Alert.alert("Could not open website", "Check your connection and try again.");
    }
  }

  async function sendCustomerEmail() {
    if (!customerApiBase || !customerId || !emailBody.trim()) return Alert.alert("Email unavailable", "Check your connection and enter an email message.");
    setBusy(true);
    try {
      const { data: { session: currentSession } } = await supabase!.auth.getSession();
      const response = await fetch(`${customerApiBase}/api/send`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentSession?.access_token}` }, body: JSON.stringify({ action: selectedCommunication ? "reply" : "compose", customerId, parentEmailId: selectedCommunication?.id ?? null, to: emailRecipient.trim(), subject: emailSubject.trim() || "Message from Alessandro Enterprises", body: emailBody.trim() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send email.");
      setEmailBody(""); setScreen("emails"); await refresh(); Alert.alert("Email sent", "Your email was sent successfully.");
    } catch (error) { Alert.alert("Email could not be sent", error instanceof Error ? error.message : "Try again."); }
    finally { setBusy(false); }
  }

  async function openSupportChannel(kind: "phone" | "whatsapp" | "email") {
    const raw = kind === "phone" ? supportContacts.phone : kind === "whatsapp" ? supportContacts.whatsapp : supportContacts.email;
    if (!raw) return;
    const phone = raw.replace(/\s+/g, "");
    const url = kind === "phone" ? `tel:${phone}` : kind === "whatsapp" ? `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "260")}?text=${encodeURIComponent("Hello AEOS Support, I need assistance.")}` : `mailto:${raw}`;
    try { await Linking.openURL(url); } catch { Alert.alert("Could not open", "The selected support app is not available on this device."); }
  }

  async function markNotificationRead(item: Activity) {
    if (!supabase || item.unread !== true) return;
    if (item.id.startsWith("local-")) { setActivities((current) => current.map((row) => row.id === item.id ? { ...row, unread: false, read_at: new Date().toISOString() } : row)); return; }
    const profileResult = await supabase.from("profiles").select("id").eq("auth_user_id", session?.user.id ?? "").maybeSingle();
    if (!profileResult.data?.id) return Alert.alert("Could not update notification", "Your profile could not be found.");
    let { error } = await supabase.from("notifications").update({ unread: false, read_at: new Date().toISOString() }).eq("id", item.id).eq("user_id", profileResult.data.id);
    if (error) {
      const fallback = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", item.id);
      error = fallback.error;
    }
    if (error) return Alert.alert("Could not update notification", error.message);
    setActivities((current) => current.map((row) => row.id === item.id ? { ...row, unread: false } : row));
  }

  async function markAllNotificationsRead() {
    if (!supabase || !session?.user) return;
    const unreadItems = notifications.filter((item) => item.unread);
    if (!unreadItems.length) return;
    const localIds = new Set(unreadItems.filter((item) => item.id.startsWith("local-")).map((item) => item.id));
    const now = new Date().toISOString();
    if (localIds.size) setActivities((current) => current.map((item) => localIds.has(item.id) ? { ...item, unread: false, read_at: now } : item));
    if (localIds.size === unreadItems.length) return;
    const savedUnreadItems = unreadItems.filter((item) => !item.id.startsWith("local-"));
    const profileResult = await supabase.from("profiles").select("id").eq("auth_user_id", session.user.id).maybeSingle();
    if (!profileResult.data?.id) return Alert.alert("Could not update notifications", "Your profile could not be found.");
    let result = await supabase.from("notifications").update({ unread: false, read_at: now }).eq("user_id", profileResult.data.id).eq("unread", true);
    if (result.error) result = await supabase.from("notifications").update({ is_read: true, read_at: now }).eq("user_id", profileResult.data.id).eq("is_read", false);
    if (result.error) return Alert.alert("Could not update notifications", result.error.message);
    const savedIds = new Set(savedUnreadItems.map((item) => item.id));
    setActivities((current) => current.map((item) => savedIds.has(item.id) ? { ...item, unread: false, read_at: now } : item));
  }

  async function openNotification(item: Activity) {
    if (item.unread) await markNotificationRead(item);
    const target = item.action_url ?? "";
    if (/booking/i.test(target)) {
      const booking = bookings.find((entry) => target.includes(entry.id));
      if (booking) { setSelectedActivity(booking); setScreen("bookingDetail"); }
      else setScreen("bookings");
    } else if (/order/i.test(target)) {
      const order = orders.find((entry) => target.includes(entry.id));
      if (order) { setSelectedActivity(order); setScreen("orderDetail"); }
      else setScreen("orders");
    } else if (/loan/i.test(target)) setScreen("loanHistory");
    else if (/message/i.test(target)) { const message = messages.find((entry) => target.includes(entry.id)); if (message) { setSelectedCommunication(message); setScreen("messageDetail"); } else setScreen("messages"); }
    else if (/email/i.test(target)) { const mail = emails.find((entry) => target.includes(entry.id)); if (mail) { setSelectedCommunication(mail); setScreen("emailDetail"); } else setScreen("emails"); }
    else if (/business/i.test(target)) {
      const business = businesses.find((entry) => target.includes(entry.slug));
      if (business) openBusiness(business); else setScreen("businesses");
    } else setScreen("activity");
  }

  function money(value: number | string | null | undefined) { return `ZMW ${Number(value ?? 0).toFixed(2)}`; }
  function openBusiness(business: Business) { setSelectedBusiness(business); setScreen(business.slug === "tech-solutions" ? "techHome" : business.slug === "mobile-money" ? "mobileMoney" : business.slug === "soft-loans" ? "loan" : "business"); setTab("businesses"); }
  function businessName(item: CatalogItem) { const business = Array.isArray(item.businesses) ? item.businesses[0] : item.businesses; return business?.name ?? "Alessandro Enterprises"; }
  function usesPortraitCatalogImages(item: CatalogItem | null | undefined) {
    if (!item) return false;
    const business = Array.isArray(item.businesses) ? item.businesses[0] : item.businesses;
    const portraitBusinessSlugs = ["elite-fashion", "tech-solutions", "classic-barbershop"];
    return portraitBusinessSlugs.includes(business?.slug ?? "") ||
      (portraitBusinessSlugs.includes(selectedBusiness?.slug ?? "") && selectedBusiness?.id === item.business_id);
  }
  function header(title: string, subtitle?: string) { return <View style={styles.pageHero}><Text style={styles.heroEyebrow}>CUSTOMER PORTAL</Text><Text style={styles.heroHeading}>{title}</Text>{subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}</View>; }
  function businessCard(business: Business) { return <Card key={business.id} onPress={() => { openBusiness(business); }}><View style={styles.row}>{business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoFallbackText}>{business.name.slice(0, 1)}</Text></View>}<View style={styles.flex}><Text numberOfLines={2} style={styles.cardTitle}>{business.name}</Text><Text numberOfLines={2} style={styles.cardDescription}>{business.description || "Discover products and services from this business."}</Text></View><View style={styles.arrowCircle}><MaterialCommunityIcons name="arrow-right" size={17} color={GOLD} /></View></View><View style={styles.cardFooter}><Text style={styles.footerEyebrow}>ALESSANDRO ENTERPRISES</Text><Text style={styles.linkText}>Explore business  ›</Text></View></Card>; }
  function itemCard(item: CatalogItem, mode: "service" | "order") {
    const service = mode === "service";
    const portraitImage = usesPortraitCatalogImages(item);
    return <Card key={item.id} onPress={() => { setSelectedItem(item); if (service) { setBookingBranchId(""); setBookingEmployeeId(""); } setScreen(service ? "service" : "product"); }}>
      {item.image_url ? <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name} image`} onPress={() => setImagePreview({ uri: item.image_url!, title: item.name })}><Image source={{ uri: item.image_url }} resizeMode="cover" style={portraitImage ? styles.fashionCatalogImage : styles.catalogCardImage} /></Pressable> : <View style={[styles.catalogCardImageFallback, portraitImage && styles.fashionCatalogImage]}><MaterialCommunityIcons name={service ? "tools" : "package-variant-closed"} size={30} color={GOLD} /></View>}
      <Text style={styles.quickEyebrow}>{item.category || (service ? "Service" : "Product")}</Text>
      <Text numberOfLines={2} style={styles.cardTitle}>{item.name}</Text>
      <Text numberOfLines={1} style={styles.muted}>{businessName(item)}</Text>
      {item.description ? <Text numberOfLines={3} style={styles.cardDescription}>{item.description}</Text> : null}
      <View style={styles.cardFooter}><Text style={styles.price}>{item.base_price == null ? "Contact us" : money(item.base_price)}</Text>{!service && item.quantity != null && <Text style={styles.muted}>{item.quantity} in stock</Text>}</View>
      <View style={styles.cardActionRow}><Text style={styles.linkText}>{service ? "View service details" : "View product details"}</Text><MaterialCommunityIcons name="chevron-right" size={18} color={GOLD} /></View>
    </Card>;
  }

  function activityCard(item: Activity, onPress?: () => void) {
    const normalizedStatus = item.status.toLowerCase();
    const good = normalizedStatus.includes("complete") || normalizedStatus.includes("approved") || normalizedStatus.includes("ready");
    const bad = normalizedStatus.includes("cancel") || normalizedStatus.includes("reject");
    const isFutureBooking = !item.booking_date || new Date(`${item.booking_date}T00:00:00`) >= new Date(new Date().setHours(0, 0, 0, 0));
    const canCancel = item.title === "Booking" && isFutureBooking && ["pending", "confirmed"].includes(normalizedStatus);
    const orderItemCount = item.order_items?.reduce((total, line) => total + Number(line.quantity ?? 0), 0) ?? 0;
    return <Card key={item.id}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View style={styles.rowBetween}><View style={styles.flex}><Text style={styles.quickEyebrow}>{item.business_name ?? "Alessandro Enterprises"}</Text><Text numberOfLines={2} style={styles.cardTitle}>{item.title === "Booking" ? item.service_name || "Appointment" : item.title === "Order" ? `Order #${item.id.slice(0, 8).toUpperCase()}` : item.title}</Text></View><View style={[styles.statusPill, good ? styles.statusGood : bad ? styles.statusBad : styles.statusPending]}><Text style={[styles.status, good ? styles.statusTextGood : bad ? styles.statusTextBad : styles.statusTextPending]}>{item.status}</Text></View></View>
        <Text style={styles.cardDescription}>{item.booking_date ? `${new Date(`${item.booking_date}T00:00:00`).toLocaleDateString("en-ZM", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}${item.booking_time ? ` · ${new Date(`2000-01-01T${item.booking_time}`).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}` : ""}` : `${new Date(item.created_at).toLocaleDateString("en-ZM", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${new Date(item.created_at).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}`}</Text>
        {item.title === "Booking" && <View style={styles.activityMeta}>{item.branch_name && <Text style={styles.muted}>Branch · {item.branch_name}</Text>}{item.staff_name && <Text style={styles.muted}>Staff · {item.staff_name}</Text>}{item.payment_status && <Text style={styles.muted}>Payment · {item.payment_status}</Text>}</View>}
        {item.title === "Order" && <View style={styles.activityMeta}>{item.order_items?.slice(0, 3).map((line, index) => <Text key={`${item.id}-${index}`} style={styles.muted}>{line.enterprise_catalog?.name || "Product"} · Qty {line.quantity} · {money(line.total_price)}</Text>)}<Text style={styles.muted}>Items · {orderItemCount} · {item.fulfillment_method || "Pickup"} · Payment {item.payment_status || "Pending"}</Text>{item.fulfillment_method?.toLowerCase() === "delivery" && item.delivery_address && <Text numberOfLines={2} style={styles.muted}>Delivery · {item.delivery_address}</Text>}</View>}
        {(item.total_amount !== undefined || item.amount !== undefined) && <Text style={styles.price}>{money(item.total_amount ?? item.amount)}</Text>}
        {item.notes ? <Text style={styles.muted}>Notes · {item.notes}</Text> : null}
        {onPress && <Text style={styles.linkText}>View Details  ›</Text>}
      </Pressable>
      {canCancel && <Button title={busy ? "Cancelling…" : "Cancel Booking"} secondary disabled={busy} onPress={() => { setSelectedActivity(item); void cancelBookingRequest(); }} />}
    </Card>;
  }

  if (authLoading) return <LoadingExperience message="Checking your customer account…" />;
  if (!supabase) return <SafeAreaView style={styles.center}><Text style={styles.heading}>App setup needed</Text><Text style={styles.subtitle}>Add the Supabase project URL and public client key before building.</Text></SafeAreaView>;
  if (!session) return <SafeAreaView style={styles.authScreen}><StatusBar style="light" /><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.authCard}><Image source={require("./assets/app-icon.png")} resizeMode="contain" style={{ width: 66, height: 66, borderRadius: 16 }} /><Text style={styles.eyebrow}>ALESSANDRO ENTERPRISES</Text><Text style={styles.heading}>{authScreen === "login" ? "Welcome back" : "Create your account"}</Text><Text style={styles.subtitle}>{authScreen === "login" ? "Sign in with your customer account." : "Create an Alessandro Enterprises customer account."}</Text>{authScreen === "login" ? <><Field label="Email address" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" value={email} /><Field label="Password" onChangeText={setPassword} placeholder="Your password" secureTextEntry value={password} /><Button title={busy ? "Signing in…" : "Sign in"} disabled={busy || !email || !password} onPress={() => void signIn()} /><Pressable onPress={() => void resetPassword()}><Text style={styles.authLink}>Forgot your password?</Text></Pressable><Pressable onPress={() => setAuthScreen("register")}><Text style={styles.authNote}>New to Alessandro Enterprises? <Text style={styles.authLink}>Create an account</Text></Text></Pressable></> : <><Field label="First name" onChangeText={setRegisterFirstName} placeholder="First name" value={registerFirstName} /><Field label="Last name" onChangeText={setRegisterLastName} placeholder="Last name" value={registerLastName} /><Field label="Email address" keyboardType="email-address" onChangeText={setRegisterEmail} placeholder="you@example.com" value={registerEmail} /><Field label="Phone number" keyboardType="phone-pad" onChangeText={setRegisterPhone} placeholder="+260 97 000 0000" value={registerPhone} /><Field label="Password (at least 8 characters)" onChangeText={setRegisterPassword} placeholder="Create a password" secureTextEntry value={registerPassword} /><Field label="Confirm password" onChangeText={setRegisterConfirmPassword} placeholder="Enter password again" secureTextEntry value={registerConfirmPassword} />{registerError ? <Text style={styles.errorText}>{registerError}</Text> : null}<Button title={busy ? "Creating account…" : "Create Customer Account"} disabled={busy || !registerFirstName || !registerLastName || !registerEmail || !registerPhone || !registerPassword || !registerConfirmPassword} onPress={() => void registerCustomer()} /><Pressable onPress={() => { setRegisterError(""); setAuthScreen("login"); }}><Text style={styles.authNote}>Already have an account? <Text style={styles.authLink}>Sign in</Text></Text></Pressable></>}</KeyboardAvoidingView></SafeAreaView>;

  let page: React.ReactNode;
  const todayKey = localDateKey(new Date());
  const todayBookings = bookings.filter((item) => item.booking_date === todayKey && !["completed", "cancelled", "rejected"].includes(item.status.toLowerCase()));
  const openBookings = bookings.filter((item) => !["completed", "cancelled", "rejected"].includes(item.status.toLowerCase()));
  const openOrders = orders.filter((item) => !["completed", "cancelled", "rejected", "delivered"].includes(item.status.toLowerCase()));
  const nextBooking = openBookings.filter((item) => item.booking_date && item.booking_date >= todayKey).sort((a, b) => `${a.booking_date} ${a.booking_time ?? ""}`.localeCompare(`${b.booking_date} ${b.booking_time ?? ""}`))[0];
  const unreadCount = notifications.filter((item) => item.unread).length;
  const loanFollowUps = loans.filter((loan) => ["pending", "under review", "approved"].includes(loan.status.toLowerCase()));

  if (screen === "home") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>
    <View style={styles.homeWelcome}>
      <View style={styles.homeWelcomeRow}>
        <View style={styles.flex}>
          <Text style={styles.homeBrandLine}>ALESSANDRO ENTERPRISES <Text style={styles.liveDot}>●</Text> LIVE</Text>
          <Text style={styles.homeWelcomeTitle}>Hello, {profile?.full_name.split(/\s+/)[0] || "there"}</Text>
          <Text style={styles.homeWelcomeSubtitle}>Your services and activity, all in one place.</Text>
        </View>
      </View>
      <View style={styles.homeDateRow}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={15} color={GOLD} />
        <Text style={styles.homeDateText}>{new Date().toLocaleDateString("en-ZM", { weekday: "long", day: "numeric", month: "long" })}</Text>
        <View style={styles.homeDateDivider} />
        <Text style={styles.homeDateText}>{todayBookings.length} today</Text>
      </View>
    </View>

    {homeSlides.length > 0 ? <View style={styles.homeCarouselWrap}>
      <View style={styles.homeCarouselHeading}><Text style={styles.homeSectionEyebrow}>IN YOUR WORLD</Text><Text style={styles.homeCarouselCount}>{homeSlides.length} highlights</Text></View>
      <ScrollView ref={homeCarouselRef} horizontal showsHorizontalScrollIndicator={false} snapToInterval={homeSlideWidth + 12} decelerationRate="fast" contentContainerStyle={styles.homeCarouselContent} onMomentumScrollEnd={(event) => { homeCarouselIndex.current = Math.round(event.nativeEvent.contentOffset.x / (homeSlideWidth + 12)); setHomeCarouselPage(homeCarouselIndex.current); }}>
        {homeSlides.map((slide) => <Pressable key={slide.id} onPress={() => setImagePreview({ uri: slide.image, title: slide.title })} style={[styles.homeSlide, { width: homeSlideWidth }]}>
          <Image source={{ uri: slide.image }} resizeMode="cover" style={styles.homeSlideImage} />
          <View style={styles.homeSlideShade} />
          <View style={styles.homeSlideContent}><Text style={styles.homeSlideTag}>{slide.label}</Text><Text numberOfLines={2} style={styles.homeSlideTitle}>{slide.title}</Text><Text numberOfLines={1} style={styles.homeSlideSubtitle}>{slide.subtitle}</Text></View>
          <View style={styles.homeSlideArrow}><MaterialCommunityIcons name="arrow-top-right" size={16} color={NAVY} /></View>
        </Pressable>)}
      </ScrollView>
      <View style={styles.homeSlideDots}>{homeSlides.map((slide, index) => <Pressable accessibilityRole="button" accessibilityLabel={`Show highlight ${index + 1}`} key={slide.id} onPress={() => { homeCarouselIndex.current = index; setHomeCarouselPage(index); homeCarouselRef.current?.scrollTo({ x: index * (homeSlideWidth + 12), animated: true }); }} style={[styles.homeSlideDot, index === homeCarouselPage && styles.homeSlideDotActive]} />)}</View>
    </View> : <View style={styles.homeWelcomeFallback}><MaterialCommunityIcons name="storefront-outline" size={22} color={GOLD} /><View style={styles.flex}><Text style={styles.homeWelcomeFallbackTitle}>Discover what’s new</Text><Text style={styles.muted}>Browse services, products and offers across our businesses.</Text></View><Pressable onPress={() => { setScreen("businesses"); setTab("businesses"); }}><Text style={styles.linkText}>Explore ›</Text></Pressable></View>}

    <View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>YOUR ACCOUNT</Text><Text style={styles.homeSectionTitle}>Live snapshot</Text></View><View style={styles.livePill}><View style={styles.livePillDot} /><Text style={styles.livePillText}>LIVE</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeMetricRail}>
      <Pressable onPress={() => { setScreen("bookings"); setTab("bookings"); }} style={[styles.homeMetric, styles.homeMetricBlue]}><View style={styles.homeMetricTop}><MaterialCommunityIcons name="calendar-clock" size={17} color="#2563EB" /><Text style={styles.homeMetricHint}>TODAY</Text></View><Text style={styles.homeMetricValue}>{todayBookings.length}</Text><Text style={styles.homeMetricLabel}>Bookings</Text></Pressable>
      <Pressable onPress={() => { setScreen("orders"); setTab("orders"); }} style={[styles.homeMetric, styles.homeMetricGreen]}><View style={styles.homeMetricTop}><MaterialCommunityIcons name="package-variant" size={17} color="#059669" /><Text style={styles.homeMetricHint}>IN PROGRESS</Text></View><Text style={styles.homeMetricValue}>{openOrders.length}</Text><Text style={styles.homeMetricLabel}>Orders</Text></Pressable>
      <Pressable onPress={() => setScreen("notifications")} style={[styles.homeMetric, styles.homeMetricGold]}><View style={styles.homeMetricTop}><MaterialCommunityIcons name="bell-badge-outline" size={17} color="#B7791F" /><Text style={styles.homeMetricHint}>NEW</Text></View><Text style={styles.homeMetricValue}>{unreadCount}</Text><Text style={styles.homeMetricLabel}>Updates</Text></Pressable>
      <Pressable onPress={() => { setScreen("services"); setTab("services"); }} style={[styles.homeMetric, styles.homeMetricViolet]}><View style={styles.homeMetricTop}><MaterialCommunityIcons name="tools" size={17} color="#7C3AED" /><Text style={styles.homeMetricHint}>READY TO BOOK</Text></View><Text style={styles.homeMetricValue}>{services.length}</Text><Text style={styles.homeMetricLabel}>Services</Text></Pressable>
    </ScrollView>

    <View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>DON’T MISS A THING</Text><Text style={styles.homeSectionTitle}>Reminders</Text></View><Pressable onPress={() => setScreen("activity")}><Text style={styles.linkText}>Activity ›</Text></Pressable></View>
    <View style={styles.homeReminderList}>
      {todayBookings.length > 0 && <Pressable onPress={() => { setScreen("bookings"); setTab("bookings"); }} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#FFF7E6" }]}><MaterialCommunityIcons name="calendar-alert" size={18} color="#B7791F" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>{todayBookings.length} booking{todayBookings.length === 1 ? "" : "s"} today</Text><Text style={styles.homeReminderText}>Check times and appointment details</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {nextBooking && nextBooking.booking_date !== todayKey && <Pressable onPress={() => { setScreen("bookings"); setTab("bookings"); }} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#EAF2FF" }]}><MaterialCommunityIcons name="calendar-arrow-right" size={18} color="#2563EB" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>Upcoming · {new Date(`${nextBooking.booking_date}T12:00:00`).toLocaleDateString("en-ZM", { weekday: "short", day: "numeric", month: "short" })}</Text><Text numberOfLines={1} style={styles.homeReminderText}>{nextBooking.service_name || "Your next appointment"}{nextBooking.booking_time ? ` · ${new Date(`2000-01-01T${nextBooking.booking_time}`).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}` : ""}</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {openOrders.length > 0 && <Pressable onPress={() => { setScreen("orders"); setTab("orders"); }} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#EAF2FF" }]}><MaterialCommunityIcons name="package-check" size={18} color="#2563EB" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>{openOrders.length} order{openOrders.length === 1 ? "" : "s"} being processed</Text><Text style={styles.homeReminderText}>Follow the latest order status</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {newProducts.length > 0 && <Pressable onPress={() => { setScreen("businesses"); setTab("businesses"); }} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#F5EEFF" }]}><MaterialCommunityIcons name="tag-plus-outline" size={18} color="#7C3AED" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>{newProducts.length} new product{newProducts.length === 1 ? "" : "s"} this week</Text><Text style={styles.homeReminderText}>Fresh additions from your businesses</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {loanFollowUps.length > 0 && <Pressable onPress={() => setScreen("loanHistory")} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#ECFDF5" }]}><MaterialCommunityIcons name="cash-clock" size={18} color="#059669" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>Loan application update</Text><Text style={styles.homeReminderText}>{loanFollowUps.length} application{loanFollowUps.length === 1 ? "" : "s"} in review or approved</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {recentPosts.length > 0 && <Pressable onPress={() => setScreen("notifications")} style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#F5EEFF" }]}><MaterialCommunityIcons name="newspaper-variant-outline" size={18} color="#7C3AED" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>{recentPosts.length} new business update{recentPosts.length === 1 ? "" : "s"}</Text><Text style={styles.homeReminderText}>See the latest news and announcements</Text></View><MaterialCommunityIcons name="chevron-right" size={19} color="#94A3B8" /></Pressable>}
      {todayBookings.length === 0 && !nextBooking && openOrders.length === 0 && loanFollowUps.length === 0 && recentPosts.length === 0 && newProducts.length === 0 && <View style={styles.homeReminder}><View style={[styles.homeReminderIcon, { backgroundColor: "#ECFDF5" }]}><MaterialCommunityIcons name="check" size={18} color="#059669" /></View><View style={styles.flex}><Text style={styles.homeReminderTitle}>You’re all caught up</Text><Text style={styles.homeReminderText}>We’ll show your next booking or update here.</Text></View></View>}
    </View>

    <View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>ONE-TAP ACCESS</Text><Text style={styles.homeSectionTitle}>Quick paths</Text></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeQuickRail}>
      {[{ label: "Services", icon: "tools", screen: "services" as Screen, tab: "services" as Screen }, { label: "Bookings", icon: "calendar-month-outline", screen: "bookings" as Screen, tab: "bookings" as Screen }, { label: "Products", icon: "shopping-outline", screen: "businesses" as Screen, tab: "businesses" as Screen }, { label: "Requests", icon: "file-document-outline", screen: "requests" as Screen }, { label: "Messages", icon: "message-outline", screen: "messages" as Screen }, { label: "Emails", icon: "email-outline", screen: "emails" as Screen }, { label: "Support", icon: "headset", screen: "support" as Screen }, { label: "Website", icon: "web", screen: null, tab: null }].map((action) => <Pressable key={action.label} onPress={() => { if (action.screen) setScreen(action.screen); else void openCustomerWebsite(); if (action.tab) setTab(action.tab); }} style={styles.homeQuickAction}><View style={styles.homeQuickIcon}><MaterialCommunityIcons name={action.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={20} color={NAVY} /></View><Text style={styles.homeQuickLabel}>{action.label}</Text></Pressable>)}
    </ScrollView>

    {newProducts.length > 0 && <><View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>JUST ADDED · 7 DAYS</Text><Text style={styles.homeSectionTitle}>New products</Text></View><Pressable onPress={() => { setScreen("businesses"); setTab("businesses"); }}><Text style={styles.linkText}>Shop all ›</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeProductRail}>{newProducts.map((item) => <Pressable key={item.id} onPress={() => { setSelectedBusiness(businesses.find((business) => business.id === item.business_id) || null); setBusinessContentKind("products"); setBusinessCategory(""); setSelectedItem(item); setScreen("product"); }} style={styles.homeProductCard}>{item.image_url ? <Image source={{ uri: item.image_url }} style={styles.homeProductImage} /> : <View style={[styles.homeProductImage, styles.homeProductPlaceholder]}><MaterialCommunityIcons name="package-variant-closed" size={27} color={GOLD} /></View>}<View style={styles.homeProductBody}><Text numberOfLines={1} style={styles.homeProductName}>{item.name}</Text><Text numberOfLines={1} style={styles.homeProductBusiness}>{businessName(item)}</Text><Text style={styles.homeProductPrice}>{item.base_price == null ? "Contact us" : money(item.base_price)}</Text></View><View style={styles.homeProductNew}><Text style={styles.homeProductNewText}>NEW</Text></View></Pressable>)}</ScrollView>
    </>}

    <View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>FROM OUR BUSINESSES</Text><Text style={styles.homeSectionTitle}>Explore businesses</Text></View><Pressable onPress={() => { setScreen("businesses"); setTab("businesses"); }}><Text style={styles.linkText}>All ›</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeBusinessRail}>{businesses.map((business) => <Pressable key={business.id} onPress={() => openBusiness(business)} style={styles.homeBusinessCard}>{business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.homeBusinessLogo} /> : <View style={styles.homeBusinessLogoFallback}><MaterialCommunityIcons name="storefront-outline" size={21} color={GOLD} /></View>}<Text numberOfLines={2} style={styles.homeBusinessName}>{business.name.replace("Alessandro ", "")}</Text><Text style={styles.homeBusinessLink}>Explore ›</Text></Pressable>)}</ScrollView>

    {promotions.filter((item) => item.image_url).length > 0 && <><View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>WHILE THEY LAST</Text><Text style={styles.homeSectionTitle}>Offers for you</Text></View><Text style={styles.homeSectionAside}>{promotions.length} available</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeOfferRail}>{promotions.slice(0, 4).map((promo) => <Pressable key={promo.id} onPress={() => { setSelectedBusiness(businesses.find((business) => business.id === promo.business_id) || null); setBusinessContentKind("promotions"); setScreen("businessContent"); }} style={styles.homeOfferCard}>{promo.image_url && <Image source={{ uri: promo.image_url }} style={styles.homeOfferImage} />}<View style={styles.homeOfferBody}><Text numberOfLines={1} style={styles.homeOfferTitle}>{promo.title}</Text><Text numberOfLines={1} style={styles.homeOfferDescription}>{promo.discount_text || promo.description || "Explore this special offer"}</Text></View></Pressable>)}</ScrollView></>}

    <View style={styles.homeSectionTitleRow}><View><Text style={styles.homeSectionEyebrow}>STAY IN THE LOOP</Text><Text style={styles.homeSectionTitle}>Latest updates</Text></View><Pressable onPress={() => setScreen("activity")}><Text style={styles.linkText}>See all ›</Text></Pressable></View>
    {businessPosts.slice(0, 3).map((post) => <Pressable key={post.id} onPress={() => { if (post.image_url) setImagePreview({ uri: post.image_url, title: post.title }); }} style={styles.homeUpdateRow}>{post.image_url ? <Image source={{ uri: post.image_url }} style={styles.homeUpdateImage} /> : <View style={styles.homeUpdateIcon}><MaterialCommunityIcons name="text-box-outline" size={19} color="#7C3AED" /></View>}<View style={styles.flex}><View style={styles.rowBetween}><Text style={styles.homeUpdateBusiness}>{businesses.find((business) => business.id === post.business_id)?.name || "Alessandro Enterprises"}</Text>{post.published_at && new Date(post.published_at).getTime() >= freshCutoff && <Text style={styles.homeUpdateNew}>NEW</Text>}</View><Text numberOfLines={1} style={styles.homeUpdateTitle}>{post.title}</Text><Text numberOfLines={1} style={styles.homeUpdateDescription}>{post.content || "Business announcement"}</Text></View><MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" /></Pressable>)}
    {businessPosts.length === 0 && <View style={styles.homeEmptyFeed}><Text style={styles.homeEmptyText}>Business news and announcements will appear here.</Text></View>}
  </Refreshable>;
  else if (screen === "businesses") { const filteredBusinesses = businesses.filter((business) => `${business.name} ${business.description ?? ""}`.toLowerCase().includes(businessSearch.trim().toLowerCase())); page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Businesses", "Explore active Alessandro businesses.")}<TextInput value={businessSearch} onChangeText={setBusinessSearch} placeholder="Search businesses" placeholderTextColor="#94A3B8" style={styles.input} />{filteredBusinesses.map(businessCard)}{filteredBusinesses.length === 0 && <Empty text="No businesses match your search." />}</Refreshable>; }
  else if (screen === "services") { const filteredServices = services.filter((item) => `${item.name} ${item.description ?? ""} ${item.category ?? ""} ${businessName(item)}`.toLowerCase().includes(serviceSearch.trim().toLowerCase())); page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Services", "Choose a service to see details and request a booking.")}<TextInput value={serviceSearch} onChangeText={setServiceSearch} placeholder="Search services or businesses" placeholderTextColor="#94A3B8" style={styles.input} />{filteredServices.map((item) => itemCard(item, "service"))}{filteredServices.length === 0 && <Empty text={serviceSearch ? "No services match your search." : "No services are available right now."} />}</Refreshable>; }
  else if (screen === "mobileMoney") {
    const configuredServices = catalog.filter((item) => item.business_id === selectedBusiness?.id && item.item_type?.toLowerCase() === "service");
    const defaultServices: CatalogItem[] = mobileMoneyDefaultServices.filter((service) => !configuredServices.some((item) => item.name.toLowerCase() === service.name.toLowerCase())).map((service) => ({ id: `mobile-action-${service.id}`, business_id: selectedBusiness?.id ?? "", item_type: "service", category: service.category, name: service.name, description: service.description, base_price: null, quantity: null, status: "active", image_url: null, businesses: selectedBusiness ? { name: selectedBusiness.name, slug: selectedBusiness.slug } : null }));
    const allMobileServices = [...configuredServices, ...defaultServices];
    const quickService = (id: string) => allMobileServices.find((item) => item.id === `mobile-action-${id}`) || allMobileServices.find((item) => item.name.toLowerCase().includes(id.replace("-", " ")));
    page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("businesses")} />
      <View style={styles.mobileMoneyHero}><Text style={styles.quickEyebrow}>ALESSANDRO ENTERPRISES · FINANCIAL SERVICES</Text><View style={styles.businessIntro}><View style={styles.mobileMoneyIcon}><MaterialCommunityIcons name="wallet-outline" size={27} color={NAVY} /></View><View style={styles.flex}><Text style={styles.homeHeading}>Mobile Money</Text><Text style={styles.heroSubtitle}>Fast, secure and convenient transactions.</Text></View></View><View style={styles.techBadgeRow}>{["Secure", "Convenient", "Multiple networks"].map((label) => <Text key={label} style={styles.mobileMoneyBadge}>{label}</Text>)}</View><View style={styles.row}>{selectedBusiness?.logo_url ? <Image source={{ uri: selectedBusiness.logo_url }} style={styles.mobileMoneyLogo} /> : null}<Text style={styles.cardDescription}>{selectedBusiness?.name ?? "Alessandro Mobile Money"}</Text></View></View>
      <Section title="Quick actions" /><View style={styles.techQuickGrid}>{mobileMoneyQuickActions.map((action) => <Pressable key={action.id} style={styles.techQuickAction} onPress={() => { const service = quickService(action.id); if (service) { setSelectedItem(service); setScreen("service"); } }}><MaterialCommunityIcons name={action.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={23} color={GOLD} /><Text style={styles.cardTitle}>{action.name}</Text><Text style={styles.muted}>{action.description}</Text></Pressable>)}</View>
      <Section title="Mobile money services" action={`${allMobileServices.length} services`} onAction={() => {}} />{allMobileServices.map((service) => itemCard(service, "service"))}
      <Section title="Simple. Secure. Convenient." />{[{ icon: "shield-check-outline", title: "Safe & Secure", body: "We focus on a secure and trusted mobile money experience." }, { icon: "cellphone", title: "Multiple Networks", body: "Access supported services across mobile money networks." }, { icon: "history", title: "Transactions & History", body: "Your service requests remain available from customer activity." }].map((feature) => <Card key={feature.title}><View style={styles.row}><MaterialCommunityIcons name={feature.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={24} color={GOLD} /><View style={styles.flex}><Text style={styles.cardTitle}>{feature.title}</Text><Text style={styles.cardDescription}>{feature.body}</Text></View></View></Card>)}
      <Card style={styles.infoCard}><Text style={styles.cardTitle}>Important information</Text><Text style={styles.cardDescription}>Always verify transaction details and recipient numbers before confirming a mobile money transaction. Select a service to request assistance.</Text></Card>
    </Refreshable>;
  }  else if (screen === "techHome") {
    const techEntries = catalog.filter((item) => item.business_id === selectedBusiness?.id);
    const techProducts = techEntries.filter((item) => item.item_type?.toLowerCase() !== "service");
    const techServices = techEntries.filter((item) => item.item_type?.toLowerCase() === "service");
    page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("businesses")} />
      <View style={styles.techHero}><Text style={styles.quickEyebrow}>ALESSANDRO TECH SOLUTIONS</Text><Text style={styles.homeHeading}>Technology that keeps your business moving.</Text><Text style={styles.heroSubtitle}>Reliable IT support, products, repairs, networking, software and expert consultation, all from one place.</Text><View style={styles.businessIntro}>{selectedBusiness?.logo_url ? <Image source={{ uri: selectedBusiness.logo_url }} style={styles.businessLogoImage} /> : <View style={styles.techHeroIcon}><MaterialCommunityIcons name="laptop" size={26} color={GOLD} /></View>}<Text style={styles.cardTitle}>{selectedBusiness?.name}</Text></View><View style={styles.techBadgeRow}>{["IT Support", "Repairs", "Networking", "Consultation"].map((label) => <Text key={label} style={styles.techBadge}>{label}</Text>)}</View></View>
      <View style={styles.quickGrid}><Card style={[styles.statCard, styles.statBlue]}><Text style={styles.muted}>Products</Text><Text style={styles.stat}>{techProducts.length}</Text></Card><Card style={[styles.statCard, styles.statGreen]}><Text style={styles.muted}>Services</Text><Text style={styles.stat}>{techServices.length}</Text></Card><Card style={[styles.statCard, styles.statGold]}><Text style={styles.muted}>Categories</Text><Text style={styles.stat}>{technologyCategories.length}</Text></Card></View>
      <Section title="Quick actions" action="" onAction={() => {}} /><View style={styles.techQuickGrid}><Pressable style={styles.techQuickAction} onPress={() => setScreen("supportRequest")}><MaterialCommunityIcons name="headset" size={21} color={GOLD} /><Text style={styles.cardTitle}>IT Support</Text><Text style={styles.muted}>Get technical help</Text></Pressable><Pressable style={styles.techQuickAction} onPress={() => setScreen("consultation")}><MaterialCommunityIcons name="creation" size={21} color={GOLD} /><Text style={styles.cardTitle}>Consultation</Text><Text style={styles.muted}>Talk to a specialist</Text></Pressable><Pressable style={styles.techQuickAction} onPress={() => setScreen("repairRequest")}><MaterialCommunityIcons name="wrench" size={21} color={GOLD} /><Text style={styles.cardTitle}>Repairs</Text><Text style={styles.muted}>Fix your technology</Text></Pressable><Pressable style={styles.techQuickAction} onPress={() => { setBusinessContentKind("products"); setBusinessCategory(""); setScreen("businessContent"); }}><MaterialCommunityIcons name="package-variant-closed" size={21} color={GOLD} /><Text style={styles.cardTitle}>Technology Shop</Text><Text style={styles.muted}>Browse products</Text></Pressable></View>
      <Section title="Technology services" action="View all" onAction={() => { setBusinessContentKind("services"); setScreen("businessContent"); }} />{techServices.slice(0, 4).map((item) => itemCard(item, "service"))}
      <Section title="Featured technology" action="Shop all" onAction={() => { setBusinessContentKind("products"); setScreen("businessContent"); }} />{techProducts.slice(0, 4).map((item) => itemCard(item, "order"))}
      <Section title="Find what you need" action="" onAction={() => {}} /><Text style={styles.cardDescription}>Explore technology by category.</Text><View style={styles.techCategoryGrid}>{technologyCategories.map((category) => { const count = techEntries.filter((item) => matchesTechnologyCategory(item, category.id)).length; return <Pressable key={category.id} onPress={() => { setSelectedTechCategory(category.id); setTechCategoryView("products"); setScreen("techCategory"); }} style={styles.techCategoryCard}><View style={styles.techCategoryIcon}><MaterialCommunityIcons name={category.icon} size={21} color={GOLD} /></View><Text style={styles.cardTitle}>{category.name}</Text><Text style={styles.muted}>{category.description}</Text><View style={styles.rowBetween}><Text style={styles.muted}>{count} {count === 1 ? "item" : "items"}</Text><Text style={styles.linkText}>Explore</Text></View></Pressable>; })}</View>
      <Card style={styles.techCta}><Text style={styles.quickEyebrow}>NOT SURE WHERE TO START?</Text><Text style={styles.cardTitle}>Let's find the right technology solution.</Text><Text style={styles.cardDescription}>Tell us what you need and our team can help you choose the right service or product.</Text><Button title="Start a consultation" gold onPress={() => setScreen("consultation")} /></Card>
    </Refreshable>;
  }  else if (screen === "techCategory") {
    const category = technologyCategories.find((entry) => entry.id === selectedTechCategory);
    const techEntries = catalog.filter((item) => item.business_id === selectedBusiness?.id && matchesTechnologyCategory(item, selectedTechCategory));
    const categoryGallery = gallery.filter((image) => [image.title, image.caption].filter(Boolean).join(" ").toLowerCase().includes(category?.name.toLowerCase().split(" ")[0] ?? ""));
    page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("techHome")} />{header(category?.name ?? "Technology", category?.description)}
      <View style={styles.filterRow}>{(["products", "services", "gallery"] as const).map((view) => <Pressable key={view} onPress={() => setTechCategoryView(view)} style={[styles.filterChip, techCategoryView === view && styles.filterChipActive]}><Text style={[styles.filterChipText, techCategoryView === view && styles.filterChipTextActive]}>{view[0].toUpperCase() + view.slice(1)}</Text></Pressable>)}</View>
      {selectedTechCategory === "it-support" && <Card style={styles.techRequestCard}><Text style={styles.cardTitle}>Need technical help?</Text><Text style={styles.cardDescription}>Tell us what is happening with your device and our support team will guide you.</Text><Button title="Request IT support" gold onPress={() => setScreen("supportRequest")} /></Card>}
      {selectedTechCategory === "repairs-maintenance" && <Card style={styles.techRequestCard}><Text style={styles.cardTitle}>Request a repair</Text><Text style={styles.cardDescription}>Share your device details and describe the problem for a repair intake.</Text><Button title="Start repair request" gold onPress={() => setScreen("repairRequest")} /></Card>}
      {selectedTechCategory === "technology-consultation" && <Card style={styles.techRequestCard}><Text style={styles.cardTitle}>Talk to a specialist</Text><Text style={styles.cardDescription}>Get expert guidance before choosing a solution.</Text><Button title="Request consultation" gold onPress={() => setScreen("consultation")} /></Card>}
      {techCategoryView === "products" && techEntries.filter((item) => item.item_type?.toLowerCase() !== "service").map((item) => itemCard(item, "order"))}
      {techCategoryView === "services" && techEntries.filter((item) => item.item_type?.toLowerCase() === "service").map((item) => itemCard(item, "service"))}
      {techCategoryView === "gallery" && categoryGallery.map((image) => <Card key={image.id}><Image source={{ uri: image.image_url }} style={styles.galleryImage} /><Text style={styles.cardTitle}>{image.title || category?.name}</Text>{image.caption && <Text style={styles.cardDescription}>{image.caption}</Text>}</Card>)}
      {techCategoryView !== "gallery" && techEntries.filter((item) => techCategoryView === "services" ? item.item_type?.toLowerCase() === "service" : item.item_type?.toLowerCase() !== "service").length === 0 && <Empty text={`No ${techCategoryView} are available in this category yet.`} />}
      {techCategoryView === "gallery" && categoryGallery.length === 0 && <Empty text="There are no gallery images in this category yet." />}
    </Refreshable>;
  }  else if (screen === "business") {
    const entries = catalog.filter((item) => item.business_id === selectedBusiness?.id);
    const categories = Array.from(new Set(entries.map((item) => item.category).filter((value): value is string => Boolean(value))));
    const isLoanBusiness = selectedBusiness?.slug === "soft-loans";
    const isTechBusiness = selectedBusiness?.slug === "tech-solutions";
    const businessSections = ["services", "products", "promotions", "gallery", "posts"] as const;
    const businessPromotions = promotions.filter((item) => item.business_id === selectedBusiness?.id);
    const businessGallery = gallery.filter((item) => item.business_id === selectedBusiness?.id);
    const businessUpdates = businessPosts.filter((item) => item.business_id === selectedBusiness?.id);
    const visibleBusinessItems = entries.filter((item) => businessContentKind === "services"
      ? item.item_type?.toLowerCase() === "service"
      : item.item_type?.toLowerCase() !== "service" && (!businessCategory || item.category === businessCategory));
    const businessHero = <View style={styles.businessHero}>
        <View style={styles.businessHeroIdentity}>
          {selectedBusiness?.logo_url ? <Image source={{ uri: selectedBusiness.logo_url }} style={styles.businessHeroLogo} /> : <View style={styles.businessHeroLogoFallback}><MaterialCommunityIcons name="storefront-outline" size={26} color={GOLD} /></View>}
          <View style={styles.flex}>
            <Text style={styles.businessHeroTag}>BUSINESS</Text>
            <Text numberOfLines={2} style={styles.businessHeroTitle}>{selectedBusiness?.name ?? "Business"}</Text>
            <Text numberOfLines={2} style={styles.businessHeroDescription}>{selectedBusiness?.description ?? "Products, services and updates from this business."}</Text>
          </View>
        </View>
        <View style={styles.businessActions}>{businessSections.map((kind) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={kind[0].toUpperCase() + kind.slice(1)} accessibilityState={{ selected: businessContentKind === kind }} onPress={() => { setBusinessContentKind(kind); setBusinessCategory(""); }} style={styles.businessAction}><MaterialCommunityIcons name={({ services: "tools", products: "package-variant-closed", promotions: "tag-outline", gallery: "image-multiple-outline", posts: "newspaper-variant-outline" } as const)[kind]} size={22} color={businessContentKind === kind ? "#FFFFFF" : GOLD} /><Text numberOfLines={1} style={styles.businessActionText}>{kind[0].toUpperCase() + kind.slice(1)}</Text></Pressable>)}</View>
      </View>;
    page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()} fixedHeader={businessHero}>
      {isLoanBusiness && <Card style={styles.businessFeature}><Text style={styles.quickEyebrow}>CUSTOMER LOANS</Text><Text style={styles.cardTitle}>Financial support when you need it.</Text><Text style={styles.cardDescription}>Apply for a loan and track your application status.</Text><Button title="Apply for a loan" gold onPress={() => setScreen("loanApply")} /><Button title="Loan history and status" secondary onPress={() => setScreen("loanHistory")} /></Card>}
      {isTechBusiness && <Card style={styles.businessFeature}><Text style={styles.quickEyebrow}>TECH SOLUTIONS</Text><Text style={styles.cardTitle}>Get help with technology</Text><Text style={styles.cardDescription}>Browse technology categories, products, services, repairs and support.</Text><Button title="Request a consultation" gold onPress={() => setScreen("consultation")} /></Card>}
      {(businessContentKind === "products" || businessContentKind === "services") && categories.length > 0 && <><Section title="Browse categories" action="" onAction={() => {}} /><View style={styles.filterRow}>{categories.map((category) => <Pressable key={category} onPress={() => { setBusinessCategory(businessCategory === category ? "" : category); const matches = entries.filter((item) => item.category === category); if (matches.length && matches.every((item) => item.item_type?.toLowerCase() === "service")) setBusinessContentKind("services"); else if (matches.length && matches.every((item) => item.item_type?.toLowerCase() !== "service")) setBusinessContentKind("products"); }} style={[styles.filterChip, businessCategory === category && styles.filterChipActive]}><Text style={[styles.filterChipText, businessCategory === category && styles.filterChipTextActive]}>{category}</Text></Pressable>)}</View></>}
      {(businessContentKind === "products" || businessContentKind === "services") && <><Section title={businessCategory || (businessContentKind === "services" ? "Services" : "Products")} />{visibleBusinessItems.map((item) => itemCard(item, businessContentKind === "services" ? "service" : "order"))}{visibleBusinessItems.length === 0 && <Empty text={`No ${businessContentKind} are available right now.`} />}</>}
      {businessContentKind === "promotions" && <>{businessPromotions.map((item) => <Card key={item.id}>{item.image_url && <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.title} image`} onPress={() => setImagePreview({ uri: item.image_url!, title: item.title })}><Image source={{ uri: item.image_url }} style={styles.heroImage} /></Pressable>}<Text style={styles.cardTitle}>{item.title}</Text>{item.discount_text && <Text style={styles.promoBadge}>{item.discount_text}</Text>}<Text style={styles.cardDescription}>{item.description || "Offer from this business."}</Text>{item.price != null && <Text style={styles.price}>{money(item.price)}</Text>}</Card>)}{businessPromotions.length === 0 && <Empty text="There are no current promotions for this business." />}</>}
      {businessContentKind === "gallery" && <>{businessGallery.map((item) => <Card key={item.id}><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.title || "business"} image`} onPress={() => setImagePreview({ uri: item.image_url, title: item.title || selectedBusiness?.name || "Business image" })}><Image source={{ uri: item.image_url }} style={styles.galleryImage} /></Pressable><Text style={styles.cardTitle}>{item.title || selectedBusiness?.name}</Text>{item.caption && <Text style={styles.cardDescription}>{item.caption}</Text>}</Card>)}{businessGallery.length === 0 && <Empty text="This business has not shared any gallery images yet." />}</>}
      {businessContentKind === "posts" && <>{businessUpdates.map((item) => <Card key={item.id}>{item.image_url && <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.title} image`} onPress={() => setImagePreview({ uri: item.image_url!, title: item.title })}><Image source={{ uri: item.image_url }} style={styles.heroImage} /></Pressable>}<Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardDescription}>{item.content}</Text><Text style={styles.muted}>{item.published_at && new Date(item.published_at).toLocaleDateString()}</Text></Card>)}{businessUpdates.length === 0 && <Empty text="This business has not posted any updates yet." />}</>}
    </Refreshable>;
  }
  else if (screen === "product") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack(selectedBusiness ? "businessContent" : "order")} />{header(selectedItem?.name ?? "Product", selectedItem ? businessName(selectedItem) : undefined)}{selectedItem?.image_url ? <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${selectedItem.name} image`} onPress={() => setImagePreview({ uri: selectedItem.image_url!, title: selectedItem.name })}><Image source={{ uri: selectedItem.image_url }} resizeMode="cover" style={usesPortraitCatalogImages(selectedItem) ? styles.fashionDetailImage : styles.heroImage} /></Pressable> : <View style={styles.productHeroFallback}><MaterialCommunityIcons name="package-variant-closed" size={42} color={GOLD} /></View>}<Card><Text style={styles.cardTitle}>Product details</Text><Text style={styles.cardDescription}>{selectedItem?.description || "Contact the business for product details, availability and delivery options."}</Text>{selectedItem?.category ? <Text style={styles.muted}>Category: {selectedItem.category}</Text> : null}<Text style={styles.price}>{money(selectedItem?.base_price)}</Text>{selectedItem?.quantity != null && <Text style={styles.muted}>{selectedItem.quantity > 0 ? `${selectedItem.quantity} in stock` : "Currently out of stock"}</Text>}</Card><Button title={selectedItem?.quantity === 0 ? "Currently unavailable" : "Add to order"} gold disabled={selectedItem?.quantity === 0} onPress={() => selectedItem && addToCart(selectedItem)} /><Button title="Continue shopping" secondary onPress={() => { setSelectedItem(null); setScreen("order"); }} /></Refreshable>;
  else if (screen === "service") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("services")} />{selectedItem?.image_url ? <Image source={{ uri: selectedItem.image_url }} style={styles.serviceHeroImage} /> : <View style={styles.serviceHeroFallback}><MaterialCommunityIcons name="tools" size={50} color={GOLD} /></View>}<Card><View style={styles.row}>{selectedItem?.businesses && !Array.isArray(selectedItem.businesses) && selectedItem.businesses.logo_url ? <Image source={{ uri: selectedItem.businesses.logo_url }} style={styles.serviceBusinessLogo} /> : <View style={styles.serviceBusinessLogoFallback}><MaterialCommunityIcons name="storefront-outline" size={18} color={GOLD} /></View>}<Text style={[styles.quickEyebrow, styles.flex]}>{selectedItem ? businessName(selectedItem) : "Alessandro Enterprises"}</Text></View><Text style={styles.serviceTitle}>{selectedItem?.name ?? "Service"}</Text>{selectedItem?.category ? <Text style={styles.muted}>{selectedItem.category}</Text> : null}{selectedItem?.description ? <Text style={styles.cardDescription}>{selectedItem.description}</Text> : <Text style={styles.cardDescription}>Contact the business for more information about this service.</Text>}<View style={styles.row}>{selectedItem?.base_price != null && <Text style={styles.promoBadge}>{money(selectedItem.base_price)}</Text>}{selectedItem?.attributes?.service_duration ? <Text style={styles.filterChipText}>◷ {String(selectedItem.attributes.service_duration)}</Text> : null}</View></Card><View style={styles.serviceActions}><Pressable accessibilityRole="button" accessibilityState={{ selected: !!selectedItem && savedServiceIds.includes(selectedItem.id) }} onPress={() => selectedItem && void toggleSavedService(selectedItem)} style={styles.saveServiceButton}><MaterialCommunityIcons name={selectedItem && savedServiceIds.includes(selectedItem.id) ? "bookmark-check" : "bookmark-outline"} size={18} color={NAVY} /><Text style={styles.saveServiceText}>{selectedItem && savedServiceIds.includes(selectedItem.id) ? "Saved" : "Save service"}</Text></Pressable><Button title="Book service" gold onPress={() => setScreen("book")} /></View></Refreshable>;
  else if (screen === "book") { const serviceBranches = bookingBranches.filter((branch) => branch.business_id === selectedItem?.business_id); const serviceEmployees = bookingEmployees.filter((employee) => employee.business_id === selectedItem?.business_id && (!bookingBranchId || !employee.branch_id || employee.branch_id === bookingBranchId)); page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("service")} />{header("Book This Service", "Choose your preferred date, time, branch and staff member.")}<Card>{selectedItem?.image_url && <Image source={{ uri: selectedItem.image_url }} style={styles.heroImage} />}<Text style={styles.quickEyebrow}>{selectedItem ? businessName(selectedItem) : "Alessandro Enterprises"}</Text><Text style={styles.cardTitle}>{selectedItem?.name}</Text><Text style={styles.cardDescription}>{selectedItem?.description}</Text><View style={styles.rowBetween}><Text style={styles.muted}>Amount</Text><Text style={styles.price}>{selectedItem?.base_price == null ? "Price not set" : money(selectedItem.base_price)}</Text></View></Card><Text style={styles.fieldLabel}>Appointment date</Text><Pressable style={styles.input} onPress={() => setShowDatePicker(true)}><Text style={{ color: NAVY, fontSize: 15 }}>{new Date(`${bookingDate}T12:00:00`).toLocaleDateString("en-ZM", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text></Pressable>{showDatePicker && <DateTimePicker value={new Date(`${bookingDate}T12:00:00`)} mode="date" minimumDate={new Date()} onChange={(_event, date) => { setShowDatePicker(false); if (date) setBookingDate(localDateKey(date)); }} />}<Text style={styles.fieldLabel}>Appointment time</Text><Pressable style={styles.input} onPress={() => setShowBookingTimePicker(true)}><Text style={{ color: NAVY, fontSize: 15 }}>{new Date(`2000-01-01T${bookingTime}`).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}</Text></Pressable>{showBookingTimePicker && <DateTimePicker value={new Date(`2000-01-01T${bookingTime}`)} mode="time" onChange={(_event, date) => { setShowBookingTimePicker(false); if (date) setBookingTime(date.toTimeString().slice(0, 5)); }} />}<Text style={styles.fieldLabel}>Branch</Text>{serviceBranches.length ? <View style={styles.filterRow}>{serviceBranches.map((branch) => <Pressable key={branch.id} onPress={() => { setBookingBranchId(branch.id); setBookingEmployeeId(""); }} style={[styles.filterChip, bookingBranchId === branch.id && styles.filterChipActive]}><Text style={[styles.filterChipText, bookingBranchId === branch.id && styles.filterChipTextActive]}>{branch.name}{branch.city ? ` · ${branch.city}` : ""}</Text></Pressable>)}</View> : <Card style={styles.infoCard}><Text style={styles.cardDescription}>No active branch has been configured for this business yet.</Text></Card>}<Text style={styles.fieldLabel}>Staff member</Text>{serviceEmployees.length ? <View style={styles.filterRow}><Pressable onPress={() => setBookingEmployeeId("")} style={[styles.filterChip, !bookingEmployeeId && styles.filterChipActive]}><Text style={[styles.filterChipText, !bookingEmployeeId && styles.filterChipTextActive]}>Any available staff member</Text></Pressable>{serviceEmployees.map((employee) => <Pressable key={employee.id} onPress={() => setBookingEmployeeId(employee.id)} style={[styles.filterChip, bookingEmployeeId === employee.id && styles.filterChipActive]}><Text style={[styles.filterChipText, bookingEmployeeId === employee.id && styles.filterChipTextActive]}>{employee.full_name}{employee.position ? ` · ${employee.position}` : ""}</Text></Pressable>)}</View> : <Text style={styles.muted}>No active staff members are currently listed.</Text>}<Field label="Notes (optional)" onChangeText={setBookingNotes} placeholder="Add any information you would like us to know" value={bookingNotes} /><Button title={busy ? "Creating booking…" : "Confirm Booking"} gold disabled={busy || !customerId} onPress={() => void createBooking()} /><Text style={styles.muted}>Your booking will be created as Pending until it is confirmed by the business.</Text></Refreshable>; }
  else if (screen === "order") { const availableProducts = products.filter((item) => `${item.name} ${item.description ?? ""} ${businessName(item)}`.toLowerCase().includes(orderSearch.trim().toLowerCase()) && (item.quantity == null || item.quantity > 0)); const subtotal = cart.reduce((sum, line) => sum + Number(line.item.base_price ?? 0) * line.quantity, 0); page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("orders")} />{header(cart.length ? "Your Order" : "New Order", "Browse products from active businesses and place an order.")}<TextInput value={orderSearch} onChangeText={setOrderSearch} placeholder="Search products or businesses" placeholderTextColor="#94A3B8" style={styles.input} />{availableProducts.map((item) => <View key={item.id}>{itemCard(item, "order")}<Button title="Add to order" secondary disabled={item.quantity === 0} onPress={() => addToCart(item)} /></View>)}{availableProducts.length === 0 && <Empty text="No products match your search right now." />}<Section title={`Cart · ${cart.reduce((sum, line) => sum + line.quantity, 0)} items`} /><View style={styles.filterRow}>{(["Pickup", "Delivery"] as const).map((method) => <Pressable key={method} onPress={() => setOrderFulfillment(method)} style={[styles.filterChip, orderFulfillment === method && styles.filterChipActive]}><Text style={[styles.filterChipText, orderFulfillment === method && styles.filterChipTextActive]}>{method}</Text></Pressable>)}</View>{orderFulfillment === "Delivery" && <Field label="Delivery address" onChangeText={setDeliveryAddress} placeholder="House, street, area and town" value={deliveryAddress} />}<Field label="Order notes (optional)" onChangeText={setOrderNotes} placeholder="Anything the business should know" value={orderNotes} />{cart.map(({ item, quantity }) => <Card key={item.id}><View style={styles.rowBetween}><View style={styles.flex}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.muted}>{businessName(item)} · {money(item.base_price)}</Text></View><View style={styles.quantityControl}><Pressable style={styles.quantityButton} onPress={() => updateCartQuantity(item.id, -1)}><MaterialCommunityIcons name="minus" size={16} color={NAVY} /></Pressable><Text style={styles.quantityValue}>{quantity}</Text><Pressable style={styles.quantityButton} onPress={() => updateCartQuantity(item.id, 1)}><MaterialCommunityIcons name="plus" size={16} color={NAVY} /></Pressable></View></View><Text style={styles.muted}>Line total {money(Number(item.base_price ?? 0) * quantity)}</Text></Card>)}<Card style={styles.infoCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>Subtotal</Text><Text style={styles.price}>{money(subtotal)}</Text></View><Text style={styles.muted}>Delivery fees, if applicable, will be confirmed by the business.</Text></Card><Button title={busy ? "Placing order…" : "Place Order"} gold disabled={busy || cart.length === 0 || !customerId || (orderFulfillment === "Delivery" && !deliveryAddress.trim())} onPress={() => void createOrder()} /></Refreshable>; }  else if (screen === "orders") { const activeOrders = orders.filter((item) => ["pending", "confirmed", "processing", "ready"].includes(item.status.toLowerCase())); const historyOrders = orders.filter((item) => ["completed", "cancelled"].includes(item.status.toLowerCase())); const visibleOrders = (orderSection === "active" ? activeOrders : historyOrders).filter((item) => orderStatusFilter === "All" || item.status.toLowerCase() === orderStatusFilter.toLowerCase()); const orderStatuses = ["pending", "confirmed", "processing", "ready", "completed", "cancelled"]; page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("My Orders", "View and manage your orders with Alessandro Enterprises.")}<Section title="Order Status" /><Text style={styles.muted}>Track the status of your orders.</Text><View style={styles.quickGrid}>{orderStatuses.slice(0, 4).map((status, index) => <Card key={status} style={[styles.statCard, index === 0 ? styles.statGold : index === 1 ? styles.statGreen : index === 2 ? styles.statBlue : styles.statViolet]}><Text style={styles.muted}>{status[0].toUpperCase() + status.slice(1)}</Text><Text style={styles.stat}>{orders.filter((item) => item.status.toLowerCase() === status).length}</Text><Text style={styles.muted}>{({ pending: "Awaiting confirmation", confirmed: "Order confirmed", processing: "Being prepared", ready: "Ready for collection" } as Record<string, string>)[status]}</Text></Card>)}</View><Button title={cart.length ? `View cart · ${cart.reduce((sum, line) => sum + line.quantity, 0)} items` : "New Order"} gold onPress={() => { setSelectedItem(null); setIsBrowsingCartProducts(cart.length === 0); setScreen("order"); setTab("orders"); }} /><View style={styles.segmented}><Pressable onPress={() => { setOrderSection("active"); setOrderStatusFilter("All"); }} style={[styles.segment, orderSection === "active" && styles.segmentActive]}><Text style={[styles.segmentText, orderSection === "active" && styles.segmentTextActive]}>Active ({activeOrders.length})</Text></Pressable><Pressable onPress={() => { setOrderSection("history"); setOrderStatusFilter("All"); }} style={[styles.segment, orderSection === "history" && styles.segmentActive]}><Text style={[styles.segmentText, orderSection === "history" && styles.segmentTextActive]}>History ({historyOrders.length})</Text></Pressable></View><Section title={orderSection === "active" ? "Active Orders" : "Order History"} /><Text style={styles.muted}>{orderSection === "active" ? "Your pending, confirmed and active orders." : "Your completed and cancelled orders."}</Text><View style={styles.filterRow}>{["All", ...orderStatuses].map((status) => <Pressable key={status} onPress={() => setOrderStatusFilter(status)} style={[styles.filterChip, orderStatusFilter === status && styles.filterChipActive]}><Text style={[styles.filterChipText, orderStatusFilter === status && styles.filterChipTextActive]}>{status}</Text></Pressable>)}</View>{visibleOrders.map((item) => activityCard(item, () => { setSelectedActivity(item); setScreen("orderDetail"); }))}{visibleOrders.length === 0 && <Empty text={orders.length ? `No ${orderSection === "active" ? "active" : "history"} orders in this view.` : "Your completed and cancelled orders will appear here."} />}</Refreshable>; }
  else if (screen === "bookings") { const upcomingBookings = bookings.filter((item) => ["pending", "confirmed"].includes(item.status.toLowerCase())); const historyBookings = bookings.filter((item) => ["completed", "cancelled"].includes(item.status.toLowerCase()) || (!!item.booking_date && new Date(`${item.booking_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)))); const visibleBookings = (bookingSection === "upcoming" ? upcomingBookings : historyBookings).filter((item) => bookingStatusFilter === "All" || item.status.toLowerCase() === bookingStatusFilter.toLowerCase()); const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"]; page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("My Bookings", "View and manage your appointments with Alessandro Enterprises.")}<Section title="Booking Status" /><Text style={styles.muted}>Track the status of your appointments.</Text><View style={styles.quickGrid}>{bookingStatuses.map((status, index) => <Card key={status} style={[styles.statCard, index === 0 ? styles.statGold : index === 1 ? styles.statGreen : index === 2 ? styles.statBlue : styles.statViolet]}><Text style={styles.muted}>{status[0].toUpperCase() + status.slice(1)}</Text><Text style={styles.stat}>{bookings.filter((item) => item.status.toLowerCase() === status).length}</Text><Text style={styles.muted}>{({ pending: "Awaiting confirmation", confirmed: "Booking confirmed", completed: "Appointment completed", cancelled: "Booking cancelled" } as Record<string, string>)[status]}</Text></Card>)}</View><Button title="New Booking" gold onPress={() => { setScreen("services"); setTab("services"); }} /><View style={styles.segmented}><Pressable onPress={() => { setBookingSection("upcoming"); setBookingStatusFilter("All"); }} style={[styles.segment, bookingSection === "upcoming" && styles.segmentActive]}><Text style={[styles.segmentText, bookingSection === "upcoming" && styles.segmentTextActive]}>Upcoming ({upcomingBookings.length})</Text></Pressable><Pressable onPress={() => { setBookingSection("history"); setBookingStatusFilter("All"); }} style={[styles.segment, bookingSection === "history" && styles.segmentActive]}><Text style={[styles.segmentText, bookingSection === "history" && styles.segmentTextActive]}>History ({historyBookings.length})</Text></Pressable></View><Section title={bookingSection === "upcoming" ? "Upcoming Bookings" : "Booking History"} /><Text style={styles.muted}>{bookingSection === "upcoming" ? "Your pending and confirmed appointments." : "Your completed, cancelled and past appointments."}</Text><View style={styles.filterRow}>{["All", ...bookingStatuses].map((status) => <Pressable key={status} onPress={() => setBookingStatusFilter(status)} style={[styles.filterChip, bookingStatusFilter === status && styles.filterChipActive]}><Text style={[styles.filterChipText, bookingStatusFilter === status && styles.filterChipTextActive]}>{status}</Text></Pressable>)}</View>{visibleBookings.map((item) => activityCard(item, () => { setSelectedActivity(item); setScreen("bookingDetail"); }))}{visibleBookings.length === 0 && <Empty text={bookings.length ? `No ${bookingSection} bookings in this view.` : "Your bookings will appear here after you book a service."} />}</Refreshable>; }
  else if (screen === "businessContent") {
    const businessEntries = catalog.filter((entry) => entry.business_id === selectedBusiness?.id);
    const contentItems = businessContentKind === "services" ? businessEntries.filter((item) => item.item_type?.toLowerCase() === "service") : businessContentKind === "products" ? businessEntries.filter((item) => item.item_type?.toLowerCase() !== "service" && (!businessCategory || item.category === businessCategory)) : [];
    const businessPromotions = promotions.filter((item) => item.business_id === selectedBusiness?.id);
    const businessGallery = gallery.filter((item) => item.business_id === selectedBusiness?.id);
    const businessUpdates = businessPosts.filter((item) => item.business_id === selectedBusiness?.id);
    page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("business")} />{header(`${selectedBusiness?.name ?? "Business"} ${businessContentKind}`, businessCategory ? `Browse ${businessCategory} content.` : "Explore current business content.")}<View style={styles.filterRow}>{(["services", "products", "promotions", "gallery", "posts"] as const).map((kind) => <Pressable key={kind} onPress={() => { setBusinessContentKind(kind); setBusinessCategory(""); }} style={[styles.filterChip, businessContentKind === kind && styles.filterChipActive]}><Text style={[styles.filterChipText, businessContentKind === kind && styles.filterChipTextActive]}>{kind[0].toUpperCase() + kind.slice(1)}</Text></Pressable>)}</View>{businessCategory && selectedBusiness?.slug === "tech-solutions" && <Card style={styles.infoCard}><Text style={styles.cardTitle}>{businessCategory}</Text><Text style={styles.cardDescription}>Browse available products and services for this technology category, or request help from Tech Solutions.</Text><Button title="Request technology support" onPress={() => setScreen("consultation")} /></Card>}{businessContentKind === "services" || businessContentKind === "products" ? contentItems.map((item) => itemCard(item, businessContentKind === "services" ? "service" : "order")) : businessContentKind === "promotions" ? businessPromotions.map((item) => <Card key={item.id}>{item.image_url ? <Image source={{ uri: item.image_url }} style={styles.heroImage} /> : null}<Text style={styles.cardTitle}>{item.title}</Text>{item.discount_text ? <Text style={styles.promoBadge}>{item.discount_text}</Text> : null}<Text style={styles.cardDescription}>{item.description || "Offer from this business."}</Text>{item.price != null && <Text style={styles.price}>{money(item.price)}</Text>}{item.end_date && <Text style={styles.muted}>Offer ends {new Date(item.end_date).toLocaleDateString()}</Text>}</Card>) : businessContentKind === "gallery" ? businessGallery.map((image) => <Card key={image.id}><Image source={{ uri: image.image_url }} style={styles.galleryImage} /><Text style={styles.cardTitle}>{image.title || selectedBusiness?.name}</Text>{image.caption && <Text style={styles.cardDescription}>{image.caption}</Text>}</Card>) : businessUpdates.map((post) => <Card key={post.id}>{post.image_url && <Image source={{ uri: post.image_url }} style={styles.heroImage} />}<Text style={styles.cardTitle}>{post.title}</Text><Text style={styles.cardDescription}>{post.content}</Text><Text style={styles.muted}>{post.published_at && new Date(post.published_at).toLocaleDateString()}</Text></Card>)}{businessContentKind === "promotions" && businessPromotions.length === 0 && <Empty text="There are no current promotions for this business." />}{businessContentKind === "gallery" && businessGallery.length === 0 && <Empty text="This business has not shared any gallery images yet." />}{businessContentKind === "posts" && businessUpdates.length === 0 && <Empty text="This business has not posted any updates yet." />}{(businessContentKind === "services" || businessContentKind === "products") && contentItems.length === 0 && <Empty text={`No active ${businessContentKind} are available right now.`} />}</Refreshable>;
  }
  else if (screen === "notifications") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Notifications", "Updates about your customer activity.")}{notifications.some((item) => item.unread) && <Button title="Mark all as read" secondary onPress={() => void markAllNotificationsRead()} />}{notifications.map((item) => <Card key={item.id} onPress={() => void openNotification(item)}><View style={styles.rowBetween}><View style={styles.flex}><Text style={styles.cardTitle}>{item.title ?? "Update"}</Text><Text numberOfLines={1} style={styles.muted}>{item.business_name || "Alessandro Enterprises"}</Text></View>{item.unread && <Text style={styles.unread}>NEW</Text>}</View><Text style={styles.cardDescription}>{item.message ?? "You have a new account update."}</Text><Text style={styles.muted}>{new Date(item.created_at).toLocaleString()}</Text></Card>)}{notifications.length === 0 && <Empty text="You are all caught up." />}</Refreshable>;
  else if (screen === "requests") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Requests", "Follow requests you have sent to Alessandro businesses.")}<Button title="Contact customer support" gold onPress={() => { setSelectedCommunication(null); setMessageSubject(""); setMessageBody(""); setScreen("messageNew"); }} /><Section title="Bookings" action="View all" onAction={() => setScreen("bookings")} />{bookings.slice(0, 5).map((item) => activityCard(item, () => { setSelectedActivity(item); setScreen("bookingDetail"); }))}<Section title="Orders" action="View all" onAction={() => setScreen("orders")} />{orders.slice(0, 5).map((item) => activityCard(item, () => { setSelectedActivity(item); setScreen("orderDetail"); }))}<Section title="Loan applications" action="View all" onAction={() => setScreen("loanHistory")} />{loans.slice(0, 5).map((loan) => <Card key={loan.id}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{loan.application_number || "Loan application"}</Text><Text style={styles.status}>{loan.status}</Text></View><Text style={styles.cardDescription}>{loan.loan_type} · {money(loan.requested_amount)}</Text></Card>)}<Section title="Messages to the team" action="View all" onAction={() => setScreen("messages")} />{messages.slice(0, 5).map((message) => <Card key={message.id} onPress={() => { setSelectedCommunication(message); setScreen("messageDetail"); }}><Text style={styles.cardTitle}>{message.subject || "Message"}</Text><Text style={styles.muted}>{message.status} · {new Date(message.created_at).toLocaleDateString()}</Text><Text numberOfLines={2} style={styles.cardDescription}>{message.body}</Text></Card>)}{!bookings.length && !orders.length && !loans.length && !messages.length && <Empty text="Requests and customer activity will appear here after you contact a business." />}</Refreshable>;  else if (screen === "activity") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Activity History", "Your bookings, orders and loan applications in one place.")}{[...bookings, ...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => activityCard(item))}{loans.map((loan) => <Card key={loan.id}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{loan.application_number || "Loan application"}</Text><Text style={styles.status}>{loan.status}</Text></View><Text style={styles.cardDescription}>{loan.loan_type} · {money(loan.requested_amount)}</Text><Text style={styles.muted}>{new Date(loan.application_date).toLocaleDateString()}</Text></Card>)}{!bookings.length && !orders.length && !loans.length && <Empty text="Your customer activity will appear here." />}</Refreshable>;
  else if (screen === "bookingDetail" || screen === "orderDetail") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack(screen === "bookingDetail" ? "bookings" : "orders")} />{header(screen === "bookingDetail" ? selectedActivity?.service_name || "Booking Details" : `Order #${selectedActivity?.id.slice(0, 8).toUpperCase() || ""}`, selectedActivity?.business_name ?? "Alessandro Enterprises")}
    {screen === "bookingDetail" ? <><Card><View style={styles.rowBetween}><Text style={styles.cardTitle}>Booking status</Text><Text style={styles.status}>{selectedActivity?.status}</Text></View><Text style={styles.fieldLabel}>Service</Text><Text style={styles.cardTitle}>{selectedActivity?.service_name || "Appointment"}</Text><Text style={styles.fieldLabel}>Date and time</Text><Text style={styles.cardDescription}>{selectedActivity?.booking_date ? new Date(`${selectedActivity.booking_date}T00:00:00`).toLocaleDateString("en-ZM", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date not available"}{selectedActivity?.booking_time ? ` · ${new Date(`2000-01-01T${selectedActivity.booking_time}`).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}` : ""}</Text>{selectedActivity?.branch_name && <><Text style={styles.fieldLabel}>Branch</Text><Text style={styles.cardDescription}>{selectedActivity.branch_name}</Text></>}{selectedActivity?.staff_name && <><Text style={styles.fieldLabel}>Staff</Text><Text style={styles.cardDescription}>{selectedActivity.staff_name}</Text></>}<View style={styles.rowBetween}><View><Text style={styles.fieldLabel}>Payment</Text><Text style={styles.cardDescription}>{selectedActivity?.payment_status || "Pending"}</Text></View><Text style={styles.price}>{money(selectedActivity?.amount)}</Text></View>{selectedActivity?.notes && <><Text style={styles.fieldLabel}>Notes</Text><Text style={styles.cardDescription}>{selectedActivity.notes}</Text></>}<Text style={styles.muted}>Reference · {selectedActivity?.id}</Text></Card>{["pending", "confirmed"].includes(selectedActivity?.status.toLowerCase() ?? "") && <Button title={busy ? "Cancelling…" : "Cancel Booking"} secondary disabled={busy} onPress={() => void cancelBookingRequest()} />}<Button title="Book another service" gold onPress={() => { setScreen("services"); setTab("services"); }} /></> : <><Card><View style={styles.rowBetween}><Text style={styles.cardTitle}>Order status</Text><Text style={styles.status}>{selectedActivity?.status}</Text></View><Text style={styles.muted}>{selectedActivity && new Date(selectedActivity.created_at).toLocaleString("en-ZM", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</Text><Text style={styles.fieldLabel}>Items</Text>{selectedActivity?.order_items?.map((line, index) => <View key={`${selectedActivity.id}-${index}`} style={styles.rowBetween}><View style={styles.flex}><Text style={styles.cardTitle}>{line.enterprise_catalog?.name || "Product"}</Text><Text style={styles.muted}>Quantity · {line.quantity} · {money(line.total_price)}</Text></View></View>)}<Text style={styles.muted}>Total items · {selectedActivity?.order_items?.reduce((total, line) => total + Number(line.quantity ?? 0), 0) ?? 0}</Text><View style={styles.rowBetween}><View><Text style={styles.fieldLabel}>Fulfillment</Text><Text style={styles.cardDescription}>{selectedActivity?.fulfillment_method || "Pickup"}</Text></View><View><Text style={styles.fieldLabel}>Payment</Text><Text style={styles.cardDescription}>{selectedActivity?.payment_status || "Pending"}</Text></View></View>{selectedActivity?.delivery_address && <><Text style={styles.fieldLabel}>Delivery address</Text><Text style={styles.cardDescription}>{selectedActivity.delivery_address}</Text></>}{selectedActivity?.notes && <><Text style={styles.fieldLabel}>Notes</Text><Text style={styles.cardDescription}>{selectedActivity.notes}</Text></>}<View style={styles.rowBetween}><Text style={styles.muted}>Subtotal</Text><Text style={styles.cardDescription}>{money(selectedActivity?.subtotal ?? selectedActivity?.total_amount)}</Text></View><View style={styles.rowBetween}><Text style={styles.cardTitle}>Total</Text><Text style={styles.price}>{money(selectedActivity?.total_amount)}</Text></View>{selectedActivity?.payment_status?.toLowerCase() === "pending" && <Text style={styles.muted}>Pending amount · {money(selectedActivity?.total_amount)}</Text>}<Text style={styles.muted}>Order date · {new Date(selectedActivity?.created_at ?? "").toLocaleDateString("en-ZM")}</Text>{selectedActivity?.updated_at && <Text style={styles.muted}>Last updated · {new Date(selectedActivity.updated_at).toLocaleString("en-ZM")}</Text>}<Text style={styles.muted}>Order ID · {selectedActivity?.id}</Text></Card><Button title="Browse products" gold onPress={() => { setIsBrowsingCartProducts(true); setScreen("order"); }} /></>}</Refreshable>;  else if (screen === "messages" || screen === "messageNew") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{screen === "messageNew" ? <><Back onPress={() => goBack("messages")} />{header(selectedCommunication ? "Reply to Message" : "New Message", "Send a message to Alessandro Enterprises.")}{selectedCommunication && <Card style={styles.infoCard}><Text style={styles.cardTitle}>{selectedCommunication.sender_name}</Text><Text style={styles.cardDescription}>{selectedCommunication.body}</Text></Card>}<Field label="Subject" onChangeText={setMessageSubject} placeholder="What would you like to discuss?" value={messageSubject || (selectedCommunication?.subject ? `Re: ${selectedCommunication.subject}` : "")} /><Text style={styles.fieldLabel}>Message</Text><TextInput multiline textAlignVertical="top" onChangeText={setMessageBody} placeholder="Write your message here…" placeholderTextColor="#94A3B8" style={[styles.input, styles.multilineInput]} value={messageBody} /><Text style={styles.muted}>{messageBody.length} characters</Text><Card style={styles.infoCard}><Text style={styles.cardTitle}>What happens next?</Text><Text style={styles.cardDescription}>Your message will appear in the customer Messages area. The team can respond through your account.</Text></Card><Button title={busy ? "Sending…" : "Send Message"} disabled={busy || !messageSubject.trim() || !messageBody.trim()} onPress={() => void sendCustomerMessage()} /></> : <>{header("Messages", "Your conversations with Alessandro Enterprises.")}<Button title="New Message" gold onPress={() => { setSelectedCommunication(null); setMessageSubject(""); setScreen("messageNew"); }} />{messages.map((item) => <Card key={item.id} onPress={() => { setSelectedCommunication(item); setScreen("messageDetail"); }}><View style={styles.rowBetween}><Text numberOfLines={1} style={styles.cardTitle}>{item.subject || "Message"}</Text><Text style={styles.status}>{item.status}</Text></View><Text numberOfLines={2} style={styles.cardDescription}>{item.body}</Text><Text style={styles.muted}>{new Date(item.created_at).toLocaleString()}</Text></Card>)}{messages.length === 0 && <Empty text="Your messages and replies will appear here." />}</>}</Refreshable>;
  else if (screen === "messageDetail") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("messages")} />{header(selectedCommunication?.subject || "Message", "Your customer conversation.")}<Card><Text style={styles.cardTitle}>{selectedCommunication?.sender_name}</Text><Text style={styles.muted}>{selectedCommunication?.sender_email}</Text><Text style={styles.cardDescription}>{selectedCommunication?.body}</Text><Text style={styles.muted}>{selectedCommunication && new Date(selectedCommunication.created_at).toLocaleString()}</Text></Card><Button title="Reply" onPress={() => { setMessageSubject(selectedCommunication?.subject ? `Re: ${selectedCommunication.subject}` : ""); setMessageBody(""); setScreen("messageNew"); }} /></Refreshable>;
  else if (screen === "emails") { const visibleEmails = emails.filter((item) => emailFilter === "all" || (emailFilter === "unread" && item.status === "Unread") || (emailFilter === "sent" && item.status === "Sent") || (emailFilter === "received" && item.status !== "Sent")); page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("My Emails", "View your communication with Alessandro Enterprises.")}<Button title="Compose Email" gold onPress={() => { setEmailRecipient("alessandrosenterprises@gmail.com"); setEmailSubject(""); setEmailBody(""); setScreen("emailCompose"); }} /><View style={styles.filterRow}>{(["all", "unread", "received", "sent"] as const).map((filter) => <Pressable key={filter} onPress={() => setEmailFilter(filter)} style={[styles.filterChip, emailFilter === filter && styles.filterChipActive]}><Text style={[styles.filterChipText, emailFilter === filter && styles.filterChipTextActive]}>{filter[0].toUpperCase() + filter.slice(1)}</Text></Pressable>)}</View>{visibleEmails.map((item) => <Card key={item.id} onPress={() => { setSelectedCommunication(item); setScreen("emailDetail"); }}><Text style={styles.cardTitle}>{item.subject || "No subject"}</Text><Text style={styles.muted}>{item.sender_name} · {new Date(item.created_at).toLocaleDateString()}</Text><Text numberOfLines={3} style={styles.cardDescription}>{item.body}</Text><Text style={styles.linkText}>Read email  ›</Text></Card>)}{visibleEmails.length === 0 && <Empty text="There are no emails in this view." />}</Refreshable>; }
  else if (screen === "emailDetail") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("emails")} />{header(selectedCommunication?.subject || "Email", "Customer email correspondence.")}<Card><Text style={styles.cardTitle}>{selectedCommunication?.sender_name}</Text><Text style={styles.muted}>{selectedCommunication?.sender_email}</Text><Text style={styles.cardDescription}>{selectedCommunication?.body}</Text><Text style={styles.muted}>{selectedCommunication && new Date(selectedCommunication.created_at).toLocaleString()}</Text></Card><Button title="Reply by email" onPress={() => { setEmailRecipient(selectedCommunication?.sender_email || ""); setEmailSubject(selectedCommunication?.subject?.startsWith("Re:") ? selectedCommunication.subject : `Re: ${selectedCommunication?.subject || ""}`); setEmailBody(""); setScreen("emailCompose"); }} /></Refreshable>;
  else if (screen === "emailCompose") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("emails")} />{header("Compose Email", "Send a message to Alessandro Enterprises.")}<Field label="To" keyboardType="email-address" onChangeText={setEmailRecipient} placeholder="Recipient email" value={emailRecipient} /><Field label="Subject" onChangeText={setEmailSubject} placeholder="Email subject" value={emailSubject} /><Text style={styles.fieldLabel}>Message</Text><TextInput multiline textAlignVertical="top" onChangeText={setEmailBody} placeholder="Write your message…" placeholderTextColor="#94A3B8" style={[styles.input, styles.multilineInput]} value={emailBody} /><Button title={busy ? "Sending…" : "Send Email"} gold disabled={busy || !emailRecipient.trim() || !emailBody.trim()} onPress={() => void sendCustomerEmail()} /><Button title="Open email app instead" secondary disabled={!emailRecipient.trim()} onPress={() => void openEmailComposer()} /></Refreshable>;
  else if (screen === "preferences") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Preferences", "Choose how Alessandro Enterprises keeps in touch and how the app looks.")}{([ ["email_notifications", "Email Notifications", "Receive important account updates."], ["push_notifications", "Push Notifications", "Receive updates on this device."], ["booking_reminders", "Booking Reminders", "Get reminders about upcoming bookings."], ["message_notifications", "Message Notifications", "Know when you receive a new message."], ["promotional_notifications", "Promotional Notifications", "Receive offers and announcements."] ] as const).map(([key, label, description]) => <Pressable key={key} onPress={() => void saveCustomerPreference(key, !preferenceValues[key])} style={styles.preferenceRow}><View style={styles.flex}><Text style={styles.cardTitle}>{label}</Text><Text style={styles.cardDescription}>{description}</Text></View><View style={[styles.switchTrack, preferenceValues[key] && styles.switchTrackActive]}><View style={[styles.switchKnob, preferenceValues[key] && styles.switchKnobActive]} /></View></Pressable>)}<Card><Text style={styles.cardTitle}>Communication</Text><Text style={styles.cardDescription}>Manage the messages and email conversations attached to your account.</Text><Button title="Email Preferences" secondary onPress={() => setScreen("emails")} /><Button title="Messages" secondary onPress={() => setScreen("messages")} /></Card><Card><Text style={styles.cardTitle}>Language</Text><Text style={styles.cardDescription}>Choose the language used in your customer experience.</Text><View style={styles.filterRow}><Pressable onPress={() => void saveCustomerPreference("language", "en")} style={[styles.filterChip, preferenceValues.language === "en" && styles.filterChipActive]}><Text style={[styles.filterChipText, preferenceValues.language === "en" && styles.filterChipTextActive]}>English</Text></Pressable></View></Card><Card><Text style={styles.cardTitle}>Appearance</Text><View style={styles.filterRow}>{(["system", "light", "dark"] as const).map((appearance) => <Pressable key={appearance} onPress={() => void saveCustomerPreference("appearance", appearance)} style={[styles.filterChip, preferenceValues.appearance === appearance && styles.filterChipActive]}><Text style={[styles.filterChipText, preferenceValues.appearance === appearance && styles.filterChipTextActive]}>{appearance[0].toUpperCase() + appearance.slice(1)}</Text></Pressable>)}</View><Text style={styles.muted}>Your appearance preference is saved to your customer account.</Text></Card><Card><Text style={styles.cardTitle}>Privacy & Security</Text><Text style={styles.cardDescription}>Your profile information is used to manage bookings, orders and support requests. Password changes are sent through a secure reset email.</Text><Button title="Account & Security Settings" secondary onPress={() => setScreen("accountSettings")} /></Card><Card style={styles.infoCard}><Text style={styles.cardTitle}>Your preferences are private</Text><Text style={styles.cardDescription}>These settings belong to your customer account and personalize your Alessandro Enterprises experience.</Text></Card></Refreshable>;
  else if (screen === "supportRequest") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("techHome")} />{header("Request IT Support", "Tell Tech Solutions what is happening with your device.")}<Text style={styles.fieldLabel}>Support area</Text><View style={styles.filterRow}>{["Computer & Laptop Support", "Troubleshooting & Repairs", "Software & Security", "Networking & Connectivity", "General Technical Assistance"].map((value) => <Pressable key={value} onPress={() => setSupportIssueType(value)} style={[styles.filterChip, supportIssueType === value && styles.filterChipActive]}><Text style={[styles.filterChipText, supportIssueType === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Device</Text><View style={styles.filterRow}>{["Laptop", "Desktop Computer", "Phone", "Tablet", "Printer", "Router / Wi-Fi", "CCTV / Security Device", "Other"].map((value) => <Pressable key={value} onPress={() => setSupportDevice(value)} style={[styles.filterChip, supportDevice === value && styles.filterChipActive]}><Text style={[styles.filterChipText, supportDevice === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Urgency</Text><View style={styles.filterRow}>{["Low", "Normal", "High", "Urgent"].map((value) => <Pressable key={value} onPress={() => setSupportUrgency(value)} style={[styles.filterChip, supportUrgency === value && styles.filterChipActive]}><Text style={[styles.filterChipText, supportUrgency === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Preferred contact</Text><View style={styles.filterRow}>{["Phone", "WhatsApp", "Email"].map((value) => <Pressable key={value} onPress={() => setSupportContactPreference(value)} style={[styles.filterChip, supportContactPreference === value && styles.filterChipActive]}><Text style={[styles.filterChipText, supportContactPreference === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Describe the problem</Text><TextInput multiline textAlignVertical="top" onChangeText={setSupportProblem} placeholder="What is happening with your device?" placeholderTextColor="#94A3B8" style={[styles.input, styles.multilineInput]} value={supportProblem} /><Field label="Additional details (optional)" onChangeText={setSupportAdditionalDetails} placeholder="Anything else we should know" value={supportAdditionalDetails} /><Button title={busy ? "Sending…" : "Send IT Support Request"} gold disabled={busy || !supportDevice || !supportProblem.trim()} onPress={() => void submitTechRequest("support")} /><Card style={styles.infoCard}><Text style={styles.cardDescription}>Your request will appear in Messages, where you can follow the conversation with the support team.</Text></Card></Refreshable>;
  else if (screen === "repairRequest") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("techHome")} />{header("Repair & Maintenance", "Share your device details to request a repair review.")}<Field label="Device" onChangeText={setRepairDevice} placeholder="Laptop, phone, printer…" value={repairDevice} /><Field label="Brand" onChangeText={setRepairBrand} placeholder="Device brand" value={repairBrand} /><Field label="Model" onChangeText={setRepairModel} placeholder="Model name or number" value={repairModel} /><Text style={styles.fieldLabel}>Device condition</Text><View style={styles.filterRow}>{["Powers on", "Powers on with issue", "Does not power on", "Physically damaged", "Not sure"].map((value) => <Pressable key={value} onPress={() => setRepairCondition(value)} style={[styles.filterChip, repairCondition === value && styles.filterChipActive]}><Text style={[styles.filterChipText, repairCondition === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Describe the problem</Text><TextInput multiline textAlignVertical="top" onChangeText={setRepairProblem} placeholder="Describe the fault or repair needed" placeholderTextColor="#94A3B8" style={[styles.input, styles.multilineInput]} value={repairProblem} /><Text style={styles.fieldLabel}>Preferred contact</Text><View style={styles.filterRow}>{["Phone", "WhatsApp", "Email"].map((value) => <Pressable key={value} onPress={() => setRepairContactPreference(value)} style={[styles.filterChip, repairContactPreference === value && styles.filterChipActive]}><Text style={[styles.filterChipText, repairContactPreference === value && styles.filterChipTextActive]}>{value}</Text></Pressable>)}</View><Field label="Additional information" onChangeText={setRepairNotes} placeholder="Optional notes" value={repairNotes} /><Button title={busy ? "Sending…" : "Submit Repair Request"} gold disabled={busy || !repairDevice.trim() || !repairProblem.trim()} onPress={() => void submitTechRequest("repair")} /><Card style={styles.infoCard}><Text style={styles.cardDescription}>The team will review your device details and follow up using your profile contact information.</Text></Card></Refreshable>;  else if (screen === "support") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Customer Support", "We are here to help with your Alessandro Enterprises experience.")}{supportContacts.phone && <Card onPress={() => void openSupportChannel("phone")}><Text style={styles.quickEyebrow}>PHONE SUPPORT</Text><Text style={styles.cardTitle}>{supportContacts.phone}</Text><Text style={styles.cardDescription}>Tap to call Alessandro Enterprises Support.</Text></Card>}{supportContacts.whatsapp && <Card onPress={() => void openSupportChannel("whatsapp")}><Text style={styles.quickEyebrow}>WHATSAPP</Text><Text style={styles.cardTitle}>{supportContacts.whatsapp}</Text><Text style={styles.cardDescription}>Tap to chat with support using WhatsApp.</Text></Card>}{supportContacts.email && <Card onPress={() => void openSupportChannel("email")}><Text style={styles.quickEyebrow}>EMAIL</Text><Text style={styles.cardTitle}>{supportContacts.email}</Text><Text style={styles.cardDescription}>Tap to email the support team.</Text></Card>}{!supportContacts.phone && !supportContacts.whatsapp && !supportContacts.email && <Empty text="Support contacts are currently unavailable." />}<Button title="Send a message" onPress={() => { setSelectedCommunication(null); setMessageSubject(""); setScreen("messageNew"); }} /></Refreshable>;
  else if (screen === "consultation") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("businesses")} />{header("Technology Consultation", "Tell Tech Solutions what you need help with.")}<Text style={styles.fieldLabel}>What do you need help with?</Text><View style={styles.filterRow}>{["general", "repair", "networking", "software", "consultation"].map((kind) => <Pressable key={kind} onPress={() => setConsultationType(kind)} style={[styles.filterChip, consultationType === kind && styles.filterChipActive]}><Text style={[styles.filterChipText, consultationType === kind && styles.filterChipTextActive]}>{kind[0].toUpperCase() + kind.slice(1)}</Text></Pressable>)}</View><Field label="Subject (optional)" onChangeText={setConsultationSubject} placeholder="Brief title" value={consultationSubject} /><Text style={styles.fieldLabel}>Preferred date</Text><Pressable style={styles.input} onPress={() => setShowConsultationDatePicker(true)}><Text style={styles.pickerValue}>{consultationDate ? new Date(`${consultationDate}T12:00:00`).toLocaleDateString() : "Choose a date (optional)"}</Text></Pressable>{showConsultationDatePicker && <DateTimePicker value={consultationDate ? new Date(`${consultationDate}T12:00:00`) : new Date()} mode="date" minimumDate={new Date()} onChange={(_event, date) => { setShowConsultationDatePicker(false); if (date) setConsultationDate(date.toISOString().slice(0, 10)); }} />}<Field label="Preferred time" onChangeText={setConsultationTime} placeholder="09:00" value={consultationTime} /><Text style={styles.fieldLabel}>Describe your request</Text><TextInput multiline textAlignVertical="top" onChangeText={setConsultationBody} placeholder="Describe your technology problem or project…" placeholderTextColor="#94A3B8" style={[styles.input, styles.multilineInput]} value={consultationBody} /><Button title={busy ? "Sending…" : "Send Request"} disabled={busy || !consultationBody.trim()} onPress={() => void submitConsultation()} /><Card style={styles.infoCard}><Text style={styles.cardDescription}>Our team will review your request and contact you using the details on your profile.</Text></Card></Refreshable>;
  else if (screen === "loan" || screen === "loanHistory") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header(screen === "loan" ? "Alessandro Soft Loans" : "Loan History", "View your applications and their current status.")}<Button title="Apply for a loan" gold onPress={() => setScreen("loanApply")} />{loans.map((loan) => <Card key={loan.id}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{loan.application_number || loan.loan_type}</Text><Text style={styles.status}>{loan.status}</Text></View><Text style={styles.cardDescription}>Requested {money(loan.requested_amount)}{loan.approved_amount ? ` · Approved ${money(loan.approved_amount)}` : ""}</Text>{loan.outstanding_balance != null && <Text style={styles.price}>Outstanding {money(loan.outstanding_balance)}</Text>}<Text style={styles.muted}>{new Date(loan.application_date).toLocaleDateString()}</Text>{loan.loan_purpose && <Text style={styles.cardDescription}>{loan.loan_purpose}</Text>}{loan.rejection_reason && <Text style={styles.statusTextBad}>{loan.rejection_reason}</Text>}</Card>)}{loans.length === 0 && <Empty text="You do not have any loan applications yet." />}</Refreshable>;
  else if (screen === "loanApply") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("loan")} />{header("Loan Application", "Choose a loan product and provide your application details.")}{loanProducts.length === 0 ? <Card style={styles.infoCard}><Text style={styles.cardTitle}>No loan products available</Text><Text style={styles.cardDescription}>Please check again later or contact Alessandro Soft Loans for help.</Text></Card> : <><Text style={styles.fieldLabel}>Choose a loan product</Text>{loanProducts.map((product) => <Pressable key={product.id} onPress={() => { setSelectedLoanProduct(product); setSelectedLoanTerm(product.terms?.[0]?.id ?? ""); setSelectedCollateral(""); }} style={[styles.loanProductCard, selectedLoanProduct?.id === product.id && styles.loanProductCardSelected]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{product.name}</Text>{selectedLoanProduct?.id === product.id && <MaterialCommunityIcons name="check-circle" size={20} color={GOLD} />}</View>{product.description && <Text style={styles.cardDescription}>{product.description}</Text>}<Text style={styles.muted}>Amount: {money(product.min_amount)} – {money(product.max_amount)} · Interest: {Number(product.interest_rate ?? 0)}%</Text></Pressable>)}{selectedLoanProduct && <><Text style={styles.fieldLabel}>Application date</Text><Pressable style={styles.input} onPress={() => setShowLoanDatePicker(true)}><Text style={styles.pickerValue}>{new Date(`${loanApplicationDate}T12:00:00`).toLocaleDateString()}</Text></Pressable>{showLoanDatePicker && <DateTimePicker value={new Date(`${loanApplicationDate}T12:00:00`)} mode="date" maximumDate={new Date()} onChange={(_event, date) => { setShowLoanDatePicker(false); if (date) setLoanApplicationDate(date.toISOString().slice(0, 10)); }} />}<Text style={styles.fieldLabel}>Repayment term</Text><View style={styles.filterRow}>{(selectedLoanProduct.terms ?? []).map((term) => <Pressable key={term.id} onPress={() => setSelectedLoanTerm(term.id)} style={[styles.filterChip, selectedLoanTerm === term.id && styles.filterChipActive]}><Text style={[styles.filterChipText, selectedLoanTerm === term.id && styles.filterChipTextActive]}>{term.period_days} days · {term.interest_rate}%</Text></Pressable>)}</View>{!selectedLoanProduct.terms?.length && <Text style={styles.statusTextBad}>This product has no active repayment terms.</Text>}<Field label={`Requested amount (ZMW) · max ${money(selectedLoanProduct.max_amount)}`} keyboardType="phone-pad" onChangeText={setLoanAmount} placeholder={`Between ${selectedLoanProduct.min_amount ?? 0} and ${selectedLoanProduct.max_amount ?? ""}`} value={loanAmount} /><Field label="Loan purpose" onChangeText={setLoanPurpose} placeholder="What will the loan be used for?" value={loanPurpose} /><Field label="Residential address" onChangeText={setLoanResidentialAddress} placeholder="House/plot, area, town" value={loanResidentialAddress} /><Text style={styles.fieldLabel}>Next of kin</Text><Field label="Full name" onChangeText={setNextOfKinName} placeholder="Next of kin name" value={nextOfKinName} /><Field label="Relationship" onChangeText={setNextOfKinRelationship} placeholder="e.g. spouse, parent" value={nextOfKinRelationship} /><Field label="Phone number" keyboardType="phone-pad" onChangeText={setNextOfKinPhone} placeholder="Next of kin phone" value={nextOfKinPhone} />{selectedLoanProduct.requires_collateral && <><Text style={styles.fieldLabel}>Collateral</Text><View style={styles.filterRow}>{collateralOptions.map((option) => <Pressable key={option.id} onPress={() => setSelectedCollateral(option.id)} style={[styles.filterChip, selectedCollateral === option.id && styles.filterChipActive]}><Text style={[styles.filterChipText, selectedCollateral === option.id && styles.filterChipTextActive]}>{option.name}</Text></Pressable>)}</View><Field label="Estimated collateral value (ZMW)" keyboardType="phone-pad" onChangeText={setCollateralWorth} placeholder="Value" value={collateralWorth} /></>}<Field label="Additional notes" onChangeText={setLoanNotes} placeholder="Optional information for the loan team" value={loanNotes} /><Card style={styles.infoCard}><Text style={styles.cardTitle}>Identity verification</Text><Text style={styles.cardDescription}>The app will ask you to capture the front and back of your NRC and a selfie before securely submitting your application.</Text></Card><Button title={busy ? "Submitting…" : "Capture documents & submit"} disabled={busy || !loanAmount || !selectedLoanTerm} gold onPress={() => void submitLoanApplication()} /></>}</>}</Refreshable>;
  else if (screen === "accountSettings") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}><Back onPress={() => goBack("profile")} />{header("Account Settings", "Manage the personal details associated with your customer account.")}<Card><Text style={styles.cardTitle}>Profile Photo</Text><Text style={styles.cardDescription}>Take a new picture or choose one from your device. Photos must be 5 MB or smaller.</Text><View style={styles.profilePhotoActions}><Button title="Take photo" secondary disabled={busy} onPress={() => void updateAvatar("camera")} /><Button title="Choose from library" secondary disabled={busy} onPress={() => void updateAvatar("library")} />{profile?.avatar_url && <Button title="Remove photo" secondary disabled={busy} onPress={() => void removeAvatar()} />}</View></Card><Field label="First name" onChangeText={(value) => { setProfileFirstNameDraft(value); setProfileNameDraft(`${value} ${profileLastNameDraft}`.trim()); }} placeholder="First name" value={profileFirstNameDraft} /><Field label="Last name" onChangeText={(value) => { setProfileLastNameDraft(value); setProfileNameDraft(`${profileFirstNameDraft} ${value}`.trim()); }} placeholder="Last name" value={profileLastNameDraft} /><Field label="Display name" onChangeText={setProfileDisplayNameDraft} placeholder="Name shown in your account" value={profileDisplayNameDraft} /><Card><Text style={styles.fieldLabel}>Login email</Text><Text style={styles.cardTitle}>{profile?.email || "Not provided"}</Text><Text style={styles.muted}>Your login email cannot be changed here.</Text></Card><Field label="Phone number" keyboardType="phone-pad" onChangeText={setProfilePhoneDraft} placeholder="Your phone number" value={profilePhoneDraft} /><Button title={busy ? "Saving…" : "Save account details"} gold disabled={busy} onPress={() => void saveCustomerProfile()} /><Card style={styles.infoCard}><Text style={styles.cardTitle}>Password & security</Text><Text style={styles.cardDescription}>For account safety, password changes are completed through a secure reset link sent to your login email.</Text><Button title="Send password reset email" secondary disabled={busy || !profile?.email} onPress={() => { setEmail(profile?.email ?? ""); void resetPassword(); }} /></Card><Card><Text style={styles.cardTitle}>Privacy</Text><Text style={styles.cardDescription}>Your profile details are used to manage customer bookings, orders and requests. Only share information needed to complete a service.</Text></Card></Refreshable>;  else if (screen === "profile") page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("My Profile", "Manage your Alessandro customer account.")}<Card><View style={styles.profileCard}><View style={styles.profileAvatar}>{profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatarImage} /> : <Text style={styles.profileAvatarText}>{profile?.full_name.trim().charAt(0).toUpperCase() || "C"}</Text>}</View><View style={styles.flex}><Text style={styles.cardTitle}>{profile?.full_name}</Text><Text style={styles.cardDescription}>{profile?.email}</Text></View></View><View style={styles.profilePhotoActions}><Button title="Take photo" secondary disabled={busy} onPress={() => void updateAvatar("camera")} /><Button title="Choose photo" secondary disabled={busy} onPress={() => void updateAvatar("library")} />{profile?.avatar_url && <Button title="Remove photo" secondary disabled={busy} onPress={() => void removeAvatar()} />}</View></Card><Field label="Full name" onChangeText={setProfileNameDraft} placeholder="Your full name" value={profileNameDraft} /><Field label="Phone number" keyboardType="phone-pad" onChangeText={setProfilePhoneDraft} placeholder="Your phone number" value={profilePhoneDraft} /><Button title={busy ? "Saving…" : "Save profile"} disabled={busy} onPress={() => void saveCustomerProfile()} /><Button title="Account Settings" secondary onPress={() => setScreen("accountSettings")} /><Button title="Preferences" secondary onPress={() => setScreen("preferences")} /><Button title="Sign out" secondary onPress={() => void signOut()} /></Refreshable>;
  else page = <Refreshable refreshing={refreshing} onRefresh={() => void refresh()}>{header("Customer Area", "Choose a section from your profile menu.")}<Button title="Back to Home" onPress={() => { setScreen("home"); setTab("home"); }} /></Refreshable>;

  if (initialDataLoading) return <LoadingExperience message="Getting your customer experience ready…" />;

  const activeTab: Screen = ["businesses", "business", "businessContent"].includes(screen) ? "businesses" : ["services", "service", "book"].includes(screen) ? "services" : ["bookings", "bookingDetail"].includes(screen) ? "bookings" : ["orders", "order", "orderDetail", "product"].includes(screen) ? "orders" : screen === "home" ? "home" : tab;
  return <SafeAreaView style={[styles.app, styles.appChrome]} edges={["top", "bottom"]}><StatusBar style="light" /><CustomerHeader profile={profile} unread={notifications.some((item) => item.unread)} onProfile={() => setScreen("profile")} onNotifications={() => setScreen("notifications")} onBookings={() => { setScreen("bookings"); setTab("bookings"); }} onSignOut={() => void signOut()} onNavigate={(target) => setScreen(target)} /><PageTransition key={screen}>{page}</PageTransition><View style={styles.tabDock}><View style={styles.tabs}>{(["home", "businesses", "services", "bookings", "orders"] as const).map((value) => { const active = activeTab === value; const icon = ({ home: "home-variant-outline", businesses: "storefront-outline", services: "tools", bookings: "calendar-month-outline", orders: "shopping-outline" } as const)[value]; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={() => { setTab(value); setScreen(value); }} style={styles.tab}><MaterialCommunityIcons name={icon} size={20} color={active ? GOLD : "#B9C4D4"} /><Text style={[styles.tabText, active && styles.tabSelected]}>{tabLabel(value)}</Text>{active && <View style={styles.tabIndicator} />}</Pressable>; })}</View></View><Modal visible={!!imagePreview} transparent animationType="fade" onRequestClose={() => setImagePreview(null)}><View style={styles.imagePreviewBackdrop}><View style={styles.imagePreviewHeader}><Text numberOfLines={1} style={styles.imagePreviewTitle}>{imagePreview?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close image preview" onPress={() => setImagePreview(null)} style={styles.imagePreviewClose}><MaterialCommunityIcons name="close" size={25} color="#FFFFFF" /></Pressable></View>{imagePreview && <Image source={{ uri: imagePreview.uri }} resizeMode="contain" style={styles.imagePreviewImage} />}</View></Modal></SafeAreaView>;
}

function Section({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={styles.linkText}>{action}</Text></Pressable> : null}</View>; }
function Back({ onPress }: { onPress: () => void }) { return <Pressable onPress={onPress} style={styles.back}><Text style={styles.linkText}>‹  Back</Text></Pressable>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.muted}>{text}</Text></View>; }
function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function tabLabel(screen: Screen) { return ({ home: "Home", businesses: "Businesses", services: "Services", bookings: "Bookings", orders: "Orders" } as Partial<Record<Screen, string>>)[screen] ?? screen; }

const lightStyles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F1F5F9' },
  appChrome: { backgroundColor: NAVY },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 30, backgroundColor: NAVY },
  loadingBrand: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  loadingHalo: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: GOLD },
  loadingLogo: { width: 106, height: 106, borderRadius: 26, backgroundColor: '#FFFFFF' },
  loadingBrandName: { marginTop: 22, color: '#FFFFFF', fontSize: 21, fontWeight: '900', letterSpacing: 2.4 },
  loadingBrandSubname: { marginTop: 4, color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 5.2 },
  loadingSpinner: { marginTop: 30 },
  loadingMessage: { marginTop: 12, color: '#CBD5E1', fontSize: 13, textAlign: 'center' },
  loadingSkeletons: { width: '100%', gap: 10 },
  loadingSkeletonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#24405E', backgroundColor: '#0B2342' },
  loadingSkeletonIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#24405E' },
  loadingSkeletonLines: { flex: 1, gap: 8 },
  loadingSkeletonLine: { height: 8, width: '78%', borderRadius: 8, backgroundColor: '#42607F' },
  loadingSkeletonLineShort: { width: '48%' },
  pageTransition: { flex: 1 },
  page: { flex: 1, backgroundColor: '#F1F5F9' },
  fixedPageHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: '#F1F5F9' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 28, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26, gap: 12, backgroundColor: '#F8FAFC' },
  authScreen: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: NAVY },
  authCard: { padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF', gap: 13 },
  brand: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD },
  brandText: { color: NAVY, fontSize: 28, fontWeight: '900' },
  eyebrow: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  heading: { color: NAVY, fontSize: 27, fontWeight: '900' },
  subtitle: { color: MUTED, fontSize: 14, lineHeight: 21 },
  header: { marginBottom: 8, gap: 7 },
  pageHero: { marginBottom: 8, padding: 18, gap: 7, overflow: 'hidden', borderRadius: 22, backgroundColor: NAVY },
  heroEyebrow: { color: GOLD, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  heroHeading: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontWeight: '900' },
  heroSubtitle: { color: '#D3DCE8', fontSize: 13, lineHeight: 19 },
  headerContainer: { position: 'relative', zIndex: 20, elevation: 20 },
  topBar: { width: '100%', maxWidth: 760, height: 72, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: NAVY, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.10)' },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  headerLogo: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: GOLD },
  brandCopy: { justifyContent: 'center', gap: 3 },
  brandName: { color: GOLD, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  brandSubname: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 2.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerIconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  notificationDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, borderWidth: 1, borderColor: NAVY },
  profileButton: { maxWidth: 112, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 3, borderRadius: 22 },
  profileName: { maxWidth: 64, color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  avatarButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  avatarText: { color: NAVY, fontSize: 16, fontWeight: '900' },
  avatarImage: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: GOLD },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 32, backgroundColor: GOLD },
  profileAvatarImage: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarText: { color: NAVY, fontSize: 24, fontWeight: '900' },
  menuOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', backgroundColor: 'rgba(3,22,47,0.18)' },
  accountMenu: { width: 320, maxWidth: '100%', height: 540, maxHeight: '82%', overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', shadowColor: NAVY, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 20 },
  accountMenuScroll: { flex: 1 },
  accountMenuContent: { paddingBottom: 12 },
  accountMenuHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 8 },
  accountMenuAvatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 22, backgroundColor: GOLD },
  accountMenuAvatarImage: { width: 44, height: 44, borderRadius: 22 },
  accountMenuAvatarText: { color: NAVY, fontSize: 17, fontWeight: '900' },
  accountMenuName: { color: NAVY, fontSize: 13, fontWeight: '900' },
  accountMenuEmail: { marginTop: 3, color: MUTED, fontSize: 10 },
  menuDivider: { height: 1, marginTop: 4, marginBottom: 7, backgroundColor: '#E2E8F0' },
  menuRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13 },
  menuIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  menuIconDestructive: { backgroundColor: '#FEF2F2' },
  menuLabel: { flex: 1, color: '#334155', fontSize: 12, fontWeight: '600' },
  menuLabelDestructive: { color: '#EF4444' },
  field: { gap: 7, marginTop: 7 },
  fieldLabel: { color: NAVY, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', color: NAVY, backgroundColor: '#FFFFFF', fontSize: 15, justifyContent: 'center' },
  pickerValue: { color: NAVY, fontSize: 15 },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 7, paddingHorizontal: 16, borderRadius: 13, backgroundColor: NAVY },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: NAVY },
  secondaryButtonText: { color: NAVY },
  goldButton: { backgroundColor: GOLD },
  goldButtonText: { color: NAVY },
  authNote: { color: MUTED, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 8 },
  authLink: { color: NAVY, fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  errorText: { color: '#B42318', fontSize: 12, lineHeight: 18 },
  card: { padding: 15, gap: 11, borderRadius: 19, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', shadowColor: NAVY, shadowOpacity: 0.055, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  flex: { flex: 1 },
  cardTitle: { color: NAVY, fontSize: 15, lineHeight: 21, fontWeight: '800', flexShrink: 1 },
  muted: { color: MUTED, fontSize: 12, lineHeight: 18 },
  cardDescription: { color: '#475569', fontSize: 13, lineHeight: 19 },
  price: { color: NAVY, fontSize: 14, fontWeight: '800' },
  linkText: { color: '#9A7910', fontSize: 12, fontWeight: '800' },
  logo: { width: 62, height: 62, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  logoFallback: { width: 62, height: 62, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: NAVY },
  logoFallbackText: { color: GOLD, fontSize: 22, fontWeight: '900' },
  itemImage: { width: 78, height: 78, borderRadius: 15, backgroundColor: '#F1F5F9' },
  itemIcon: { width: 60, height: 60, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F3DF' },
  itemIconText: { color: GOLD, fontSize: 23, fontWeight: '900' },
  heroImage: { width: '100%', height: 220, borderRadius: 18, backgroundColor: '#E2E8F0' },
  productHeroFallback: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F8F3DF' },
  homeHero: { marginHorizontal: -16, marginTop: -16, marginBottom: 8, paddingHorizontal: 22, paddingTop: 25, paddingBottom: 24, gap: 10, overflow: 'hidden', backgroundColor: NAVY, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  homeWelcome: { marginHorizontal: -16, marginTop: -16, paddingHorizontal: 20, paddingTop: 19, paddingBottom: 18, gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF3' },
  homeWelcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  homeBrandLine: { color: '#9A7910', fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  liveDot: { color: '#10B981', fontSize: 10 },
  homeWelcomeTitle: { marginTop: 5, color: NAVY, fontSize: 25, lineHeight: 30, fontWeight: '900', letterSpacing: -0.5 },
  homeWelcomeSubtitle: { marginTop: 2, color: MUTED, fontSize: 11, lineHeight: 16 },
  homeNotificationButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  homeNotificationBadge: { position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderRadius: 9, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFFFFF' },
  homeNotificationBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  homeDateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  homeDateText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  homeDateDivider: { width: 1, height: 13, marginHorizontal: 2, backgroundColor: '#CBD5E1' },
  homeCarouselWrap: { gap: 9, marginTop: 3 },
  homeCarouselHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  homeSectionEyebrow: { color: '#9A7910', fontSize: 8, fontWeight: '900', letterSpacing: 1.25 },
  homeCarouselCount: { color: '#94A3B8', fontSize: 9, fontWeight: '700' },
  homeCarouselContent: { gap: 12, paddingRight: 8 },
  homeSlide: { height: 205, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 21, backgroundColor: '#DCE4ED' },
  homeSlideImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  homeSlideShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,22,47,0.22)' },
  homeSlideContent: { gap: 4, paddingHorizontal: 16, paddingBottom: 16, paddingRight: 55 },
  homeSlideTag: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, backgroundColor: GOLD, color: NAVY, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  homeSlideTitle: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6 },
  homeSlideSubtitle: { color: '#F1F5F9', fontSize: 10, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 },
  homeSlideArrow: { position: 'absolute', right: 13, bottom: 15, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: GOLD },
  homeSlideDots: { flexDirection: 'row', alignSelf: 'center', gap: 5, paddingVertical: 1 },
  homeSlideDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  homeSlideDotActive: { width: 16, backgroundColor: NAVY },
  homeWelcomeFallback: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  homeWelcomeFallbackTitle: { color: NAVY, fontSize: 13, fontWeight: '900' },
  homeSectionTitleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginTop: 5, paddingHorizontal: 1 },
  homeSectionTitle: { marginTop: 2, color: NAVY, fontSize: 17, lineHeight: 21, fontWeight: '900' },
  homeSectionAside: { color: MUTED, fontSize: 9, fontWeight: '700' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, backgroundColor: '#ECFDF5' },
  livePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  livePillText: { color: '#047857', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  homeMetricRail: { gap: 9, paddingRight: 16 },
  homeMetric: { width: 133, minHeight: 95, justifyContent: 'center', gap: 2, padding: 12, borderRadius: 16, borderWidth: 1 },
  homeMetricBlue: { borderColor: '#D7E7FF', backgroundColor: '#F3F8FF' },
  homeMetricGreen: { borderColor: '#CDEFE0', backgroundColor: '#F1FCF7' },
  homeMetricGold: { borderColor: '#F4E5B5', backgroundColor: '#FFFCF2' },
  homeMetricViolet: { borderColor: '#E8DDFC', backgroundColor: '#FAF7FF' },
  homeMetricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeMetricHint: { color: '#64748B', fontSize: 7, fontWeight: '900', letterSpacing: 0.45 },
  homeMetricValue: { marginTop: 4, color: NAVY, fontSize: 22, lineHeight: 24, fontWeight: '900' },
  homeMetricLabel: { color: MUTED, fontSize: 10, fontWeight: '700' },
  homeReminderList: { gap: 7, padding: 9, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2' },
  homeReminder: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  homeReminderIcon: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  homeReminderTitle: { color: NAVY, fontSize: 11, fontWeight: '900' },
  homeReminderText: { marginTop: 2, color: MUTED, fontSize: 9, lineHeight: 13 },
  homeQuickRail: { gap: 9, paddingRight: 16 },
  homeQuickAction: { width: 78, minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, borderWidth: 1, borderColor: '#E6EBF1', backgroundColor: '#FFFFFF' },
  homeQuickIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F5F7FA' },
  homeQuickLabel: { color: '#334155', fontSize: 9, fontWeight: '800' },
  homeProductRail: { gap: 10, paddingRight: 16 },
  homeProductCard: { width: 168, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: '#E3E8EF', backgroundColor: '#FFFFFF' },
  homeProductImage: { width: '100%', height: 118, backgroundColor: '#F1F5F9' },
  homeProductPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  homeProductBody: { gap: 3, padding: 10 },
  homeProductName: { color: NAVY, fontSize: 11, fontWeight: '900' },
  homeProductBusiness: { color: MUTED, fontSize: 9 },
  homeProductPrice: { marginTop: 2, color: NAVY, fontSize: 10, fontWeight: '900' },
  homeProductNew: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 99, backgroundColor: GOLD },
  homeProductNewText: { color: NAVY, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  homeBusinessRail: { gap: 9, paddingRight: 16 },
  homeBusinessCard: { width: 112, minHeight: 129, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#E5EAF0', backgroundColor: '#FFFFFF' },
  homeBusinessLogo: { width: 47, height: 47, borderRadius: 15, borderWidth: 1, borderColor: '#E8EDF3', backgroundColor: '#FFFFFF' },
  homeBusinessLogoFallback: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: NAVY },
  homeBusinessName: { minHeight: 26, color: NAVY, fontSize: 9, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  homeBusinessLink: { color: '#9A7910', fontSize: 8, fontWeight: '900' },
  homeOfferRail: { gap: 9, paddingRight: 16 },
  homeOfferCard: { width: 220, overflow: 'hidden', borderRadius: 15, borderWidth: 1, borderColor: '#E5EAF0', backgroundColor: '#FFFFFF' },
  homeOfferImage: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
  homeOfferBody: { gap: 3, padding: 10 },
  homeOfferTitle: { color: NAVY, fontSize: 11, fontWeight: '900' },
  homeOfferDescription: { color: MUTED, fontSize: 9 },
  homeUpdateRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 15, borderWidth: 1, borderColor: '#E5EAF0', backgroundColor: '#FFFFFF' },
  homeUpdateImage: { width: 54, height: 54, borderRadius: 12, backgroundColor: '#F1F5F9' },
  homeUpdateIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F5EEFF' },
  homeUpdateBusiness: { flex: 1, color: '#64748B', fontSize: 8, fontWeight: '700' },
  homeUpdateNew: { color: '#047857', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  homeUpdateTitle: { marginTop: 3, color: NAVY, fontSize: 10, fontWeight: '900' },
  homeUpdateDescription: { marginTop: 2, color: MUTED, fontSize: 9 },
  homeEmptyFeed: { padding: 14, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF0' },
  homeEmptyText: { color: MUTED, fontSize: 10 },
  dashboardBell: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dashboardBellBadge: { position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderRadius: 9, backgroundColor: '#EF4444', borderWidth: 1, borderColor: NAVY },
  dashboardBellBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  todayStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5, padding: 11, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  todayIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: GOLD },
  todayLabel: { color: '#CBD5E1', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  todayValue: { marginTop: 2, color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  todayActivity: { color: GOLD, fontSize: 10, fontWeight: '900' },
  heroActionRow: { flexDirection: 'row', gap: 9, marginTop: 2 },
  heroPrimaryAction: { minHeight: 42, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 12, backgroundColor: GOLD },
  heroPrimaryActionText: { color: NAVY, fontSize: 11, fontWeight: '900' },
  heroSecondaryAction: { minHeight: 42, minWidth: 105, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  heroSecondaryActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  dashboardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dashboardAction: { flexBasis: '47%', flexGrow: 1, minHeight: 106, gap: 5, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', shadowColor: NAVY, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  dashboardActionIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 2, borderRadius: 11 },
  dashboardActionTitle: { color: NAVY, fontSize: 12, fontWeight: '900' },
  dashboardActionHint: { color: MUTED, fontSize: 10, lineHeight: 14 },
  attentionCard: { borderColor: '#FDE68A', backgroundColor: '#FFFCF1' },
  attentionIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  clearCard: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  clearIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#DCFCE7' },
  dashboardGallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dashboardGalleryItem: { flexBasis: '47%', flexGrow: 1, overflow: 'hidden', borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  dashboardGalleryImage: { width: '100%', height: 135, backgroundColor: '#E2E8F0' },
  dashboardGalleryCaption: { paddingHorizontal: 10, paddingVertical: 9, color: NAVY, fontSize: 10, fontWeight: '800' },
  featuredBusiness: { padding: 18, gap: 12, borderRadius: 25, borderWidth: 1, borderColor: '#C5A02C', backgroundColor: '#E7CC70' },
  featuredBadge: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, backgroundColor: NAVY },
  featuredBadgeText: { color: GOLD, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  featuredLogo: { width: 72, height: 72, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#FFFFFF' },
  featuredLogoFallback: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: NAVY },
  homeCta: { marginTop: 7, padding: 20, gap: 9, borderRadius: 25, backgroundColor: NAVY },
  homeCtaTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  saveServiceButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  saveServiceText: { color: NAVY, fontSize: 13, fontWeight: '800' },
  homeHeading: { color: '#FFFFFF', fontSize: 29, lineHeight: 34, letterSpacing: -0.5, fontWeight: '900' },
  homeHeadingGold: { color: GOLD },
  quickHeading: { gap: 4, marginTop: 4, marginBottom: 2 },
  quickEyebrow: { color: '#9A7910', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flexBasis: '47%', flexGrow: 1, minHeight: 112, justifyContent: 'center', padding: 13, gap: 3 },
  statBlue: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  statGreen: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  statGold: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  statViolet: { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' },
  statIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 3, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.82)' },
  stat: { color: NAVY, fontSize: 23, fontWeight: '900' },
  cardFooter: { minHeight: 31, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerEyebrow: { color: '#94A3B8', fontSize: 8, fontWeight: '800', letterSpacing: 0.7, flexShrink: 1 },
  arrowCircle: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F8FAFC' },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  businessIntro: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  businessLogoLarge: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 17, backgroundColor: NAVY },
  businessLogoImage: { width: 60, height: 60, backgroundColor: '#FFFFFF' },
  businessHero: { zIndex: 10, elevation: 8, gap: 0, padding: 14, borderRadius: 22, backgroundColor: NAVY },
  businessHeroIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  businessHeroLogo: { width: 54, height: 54, borderRadius: 15, backgroundColor: '#FFFFFF' },
  businessHeroLogoFallback: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#203957' },
  businessHeroTag: { marginBottom: 3, color: GOLD, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  businessHeroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '900' },
  businessHeroDescription: { marginTop: 3, color: '#D3DCE8', fontSize: 11, lineHeight: 15 },
  businessActions: { flexDirection: 'row', justifyContent: 'space-around', gap: 5, marginTop: 44 },
  businessAction: { flex: 1, minWidth: 0, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 5, padding: 2, borderRadius: 12, backgroundColor: 'transparent' },
  businessActionText: { color: '#FFFFFF', fontSize: 8, lineHeight: 10, fontWeight: '700', textAlign: 'center' },
  businessFeature: { borderColor: '#D4AF37', backgroundColor: '#FFFCF1' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  filterChipActive: { borderColor: NAVY, backgroundColor: NAVY },
  filterChipText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF' },
  promoBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: '900' },
  galleryImage: { width: '100%', height: 220, borderRadius: 15, backgroundColor: '#E2E8F0' },
  multilineInput: { minHeight: 150, paddingTop: 14, lineHeight: 21 },
  infoCard: { borderColor: '#F3E8C3', backgroundColor: '#FFFCF1' },
  loanProductCard: { gap: 8, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  loanProductCardSelected: { borderColor: GOLD, backgroundColor: '#FFFCF1' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quantityButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  quantityValue: { minWidth: 20, color: NAVY, textAlign: 'center', fontWeight: '800' },
  segmented: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 12 },
  segmentActive: { backgroundColor: NAVY },
  segmentText: { color: MUTED, fontSize: 12, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' },
  activityMeta: { gap: 4, marginTop: 4 },
  serviceHeroImage: { width: '100%', height: 260, borderRadius: 22, backgroundColor: '#E2E8F0' },
  serviceHeroFallback: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: NAVY },
  serviceBusinessLogo: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  serviceBusinessLogoFallback: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: NAVY },
  serviceTitle: { marginTop: 14, color: NAVY, fontSize: 26, fontWeight: '900' },
  serviceActions: { gap: 10 },
  catalogCardImage: { width: '100%', height: 176, marginBottom: 12, borderRadius: 15, backgroundColor: '#F1F5F9' },
  catalogCardImageFallback: { width: '100%', height: 176, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderRadius: 15, backgroundColor: '#F1F5F9' },
  fashionCatalogImage: { width: '100%', aspectRatio: 4 / 5, marginBottom: 12, borderRadius: 15, backgroundColor: '#F1F5F9' },
  fashionDetailImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: 18, backgroundColor: '#E2E8F0' },
  imagePreviewBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(2, 8, 23, 0.96)', padding: 14 },
  imagePreviewHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  imagePreviewTitle: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  imagePreviewClose: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)' },
  imagePreviewImage: { width: '100%', flex: 1 },
  preferenceRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  switchTrack: { width: 48, height: 28, justifyContent: 'center', padding: 3, borderRadius: 99, backgroundColor: '#CBD5E1' },
  switchTrackActive: { backgroundColor: GOLD },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', shadowColor: NAVY, shadowOpacity: 0.15, shadowRadius: 3, elevation: 1 },
  switchKnobActive: { alignSelf: 'flex-end' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { color: NAVY, fontSize: 17, fontWeight: '900' },
  empty: { alignItems: 'center', padding: 28, borderRadius: 16, backgroundColor: '#FFFFFF' },
  status: { fontSize: 10, fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  statusGood: { backgroundColor: '#D1FAE5' },
  statusBad: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusTextGood: { color: '#047857' },
  statusTextBad: { color: '#B91C1C' },
  statusTextPending: { color: '#B45309' },
  unread: { color: '#9A7910', fontSize: 10, fontWeight: '900' },
  back: { paddingVertical: 4 },
  tabDock: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 5, backgroundColor: '#F1F5F9' },
  tabs: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: NAVY, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', shadowColor: NAVY, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  tab: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabText: { color: '#B9C4D4', fontSize: 9, fontWeight: '700' },
  tabSelected: { color: GOLD, fontWeight: '900' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 19, height: 3, borderRadius: 2, backgroundColor: GOLD },
  profilePhotoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techHero: { padding: 18, gap: 12, overflow: 'hidden', borderRadius: 24, backgroundColor: NAVY },
  techHeroIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)' },
  techBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  techBadge: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.14)', fontSize: 10, fontWeight: '800' },
  techQuickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  techQuickAction: { flexBasis: '47%', flexGrow: 1, minHeight: 105, justifyContent: 'center', gap: 6, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  techCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  techCategoryCard: { flexBasis: '47%', flexGrow: 1, minHeight: 148, justifyContent: 'space-between', gap: 8, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  techCategoryIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#FFFCF1' },
  techCta: { borderColor: GOLD, backgroundColor: '#FFFCF1' },
  techRequestCard: { borderColor: '#C5A02C', backgroundColor: '#FFFCF1' },
  mobileMoneyHero: { padding: 18, gap: 12, overflow: 'hidden', borderRadius: 24, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5' },
  mobileMoneyIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#FFFFFF' },
  mobileMoneyBadge: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, color: '#047857', backgroundColor: '#D1FAE5', fontSize: 10, fontWeight: '800' },
  mobileMoneyLogo: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFFFFF' },
});

function recolorStyle(style: unknown): unknown {
  const surfaces: Record<string, string> = {
    "#FFFFFF": "#10233A", "#FFF": "#10233A", "#F1F5F9": "#071426", "#F8FAFC": "#0B1B30",
    "#FFFCF1": "#242114", "#ECFDF5": "#102A26", "#D1FAE5": "#1B433A", "#EFF6FF": "#10294A",
    "#DBEAFE": "#1B3557", "#FEF3C7": "#433515", "#FFFBEB": "#352A12", "#F5F3FF": "#282141",
    "#FDF2F8": "#3A2234", "#FFF7ED": "#382719", "#F0FDF4": "#123024",
  };
  const textColors: Record<string, string> = {
    "#03162F": "#F1F5F9", "#0C3B78": "#A9C5EF", "#64748B": "#AAB8C9", "#94A3B8": "#8798AE",
    "#475569": "#CBD5E1", "#334155": "#D7E0EB", "#FFFFFF": "#F1F5F9", "#FFF": "#F1F5F9",
    "#047857": "#6EE7B7", "#1D4ED8": "#93C5FD", "#7C3AED": "#C4B5FD", "#B45309": "#FCD34D",
  };
  const borders: Record<string, string> = { "#E2E8F0": "#26384F", "#CBD5E1": "#354960", "#D1FAE5": "#245B4F", "#DBEAFE": "#294C77" };
  const visit = (value: unknown, property = ""): unknown => {
    if (Array.isArray(value)) return value.map((item) => visit(item, property));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item, key)]));
    if (typeof value !== "string") return value;
    const normalized = value.toUpperCase();
    if (property === "backgroundColor") return surfaces[normalized] ?? (normalized === "#03162F" ? "#0B1B30" : value);
    if (property === "color" || property === "placeholderTextColor") return textColors[normalized] ?? value;
    if (property === "borderColor") return borders[normalized] ?? value;
    if (property === "shadowColor") return "#000000";
    return value;
  };
  return visit(style);
}

const darkStyles = StyleSheet.create(Object.fromEntries(Object.entries(lightStyles).map(([name, style]) => [name, recolorStyle(StyleSheet.flatten(style))])) as typeof lightStyles);
let styles: typeof lightStyles = lightStyles;

