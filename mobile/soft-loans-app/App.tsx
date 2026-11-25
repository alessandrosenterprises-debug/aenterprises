import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, BadgeCheck, Banknote, Camera, Check, ChevronDown, CircleAlert, FileCheck2, Landmark, LockKeyhole, LogOut, Mail, UserRound, Wallet } from "lucide-react-native";
import { apiFetch, configured, supabase } from "./src/services/supabase";

const C = { navy: "#03162F", gold: "#D4AF37", goldPale: "#FFF8E4", bg: "#F4F7FB", ink: "#10243E", muted: "#61748D", border: "#DCE4EE", green: "#07845D", red: "#B42318", blue: "#245BD6", white: "#FFFFFF" };
type Term = { id: string; period_days: number; interest_rate: number };
type Product = { id: string; name: string; description: string | null; min_amount: number | null; max_amount: number | null; requires_collateral: boolean; terms: Term[] };
type Collateral = { id: string; name: string; description: string | null };
type Catalog = { products: Product[]; collaterals: Collateral[] };
type Loan = { id: string; application_number: string | null; loan_type: string; requested_amount: number; outstanding_balance: number | null; status: string; rejection_reason: string | null; created_at: string; loan_products?: { name: string } | null };
type Picked = { uri: string; name: string; type: string };
type Tab = "Home" | "Apply" | "My loans" | "Account";
const money = (n: number) => `ZMW ${Number(n || 0).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const toE164 = (value: string) => { const raw = value.trim(); const digits = raw.replace(/\D/g, ""); if (!digits) return ""; if (raw.startsWith("+")) return `+${digits}`; if (digits.startsWith("00")) return `+${digits.slice(2)}`; if (digits.startsWith("260")) return `+${digits}`; if (digits.startsWith("0") && digits.length === 10) return `+260${digits.slice(1)}`; if (digits.length === 9) return `+260${digits}`; return `+${digits}`; };
const errorText = (e: unknown) => e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [customerName, setCustomerName] = useState("Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneChallenge, setPhoneChallenge] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("Home");
  const [catalog, setCatalog] = useState<Catalog>({ products: [], collaterals: [] });
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [kinName, setKinName] = useState("");
  const [kinRelationship, setKinRelationship] = useState("");
  const [kinPhone, setKinPhone] = useState("");
  const [collateralId, setCollateralId] = useState("");
  const [collateralWorth, setCollateralWorth] = useState("");
  const [notes, setNotes] = useState("");
  const [nrcFront, setNrcFront] = useState<Picked | null>(null);
  const [nrcBack, setNrcBack] = useState<Picked | null>(null);
  const [selfie, setSelfie] = useState<Picked | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = catalog.products.find((p) => p.id === selectedProductId) ?? null;
  const selectedTerm = selectedProduct?.terms.find((t) => t.id === selectedTermId) ?? null;
  const principal = Number(amount) || 0;
  const interest = selectedTerm ? principal * Number(selectedTerm.interest_rate) / 100 : 0;
  const total = principal + interest;

  async function loadProfile(next: Session) {
    const { data, error: profileError } = await supabase.from("customers").select("full_name,phone,is_active,status").eq("auth_user_id", next.user.id).maybeSingle();
    if (profileError) {
      if (/fetch|network|connection|timeout|load failed/i.test(profileError.message)) {
        setCustomerName(next.user.user_metadata?.full_name || "Customer");
        setCustomerPhone(next.user.phone ?? "");
        setPhoneVerified(false);
        setSession(next);
        setError("Your saved sign-in is kept. The connection is too weak to refresh your customer profile; reconnect and refresh.");
        return;
      }
      throw profileError;
    }
    if (!data || data.is_active !== true || data.status?.toLowerCase() !== "active") {
      await supabase.auth.signOut();
      throw new Error("This login is not an active customer account. Please contact Alessandro Soft Loans support.");
    }
    setCustomerName(data.full_name?.trim() || "Customer");
    setCustomerPhone(data.phone ?? "");
    const authPhone = next.user.phone?.replace(/\D/g, "").slice(-9);
    const profilePhone = data.phone?.replace(/\D/g, "").slice(-9);
    setPhoneVerified(Boolean(next.user.phone_confirmed_at && authPhone && authPhone === profilePhone));
    setSession(next);
  }

  async function refreshData(next = session) {
    if (!next) return;
    setLoading(true); setError("");
    try {
      const [catalogResult, applicationResult] = await Promise.allSettled([
        apiFetch<Catalog>("/api/customer/soft-loans/catalog", next.access_token),
        apiFetch<{ applications: Loan[] }>("/api/customer/loan-applications", next.access_token),
      ]);
      if (catalogResult.status === "fulfilled") setCatalog(catalogResult.value);
      if (applicationResult.status === "fulfilled") setLoans(applicationResult.value.applications ?? []);
      if (catalogResult.status === "rejected") throw catalogResult.reason;
      if (applicationResult.status === "rejected") throw applicationResult.reason;
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session) { try { await loadProfile(data.session); } catch (e) { setError(errorText(e)); } }
      setRestoring(false);
    }).catch(() => { if (mounted) { setRestoring(false); setError("Unable to restore your saved sign-in. Check your connection and try again."); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      if (!next) { setSession(null); setTab("Home"); setLoans([]); }
      else if (next.user.id !== session?.user.id) void loadProfile(next).catch((e) => setError(errorText(e)));
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (session) void refreshData(session); }, [session?.user.id]);

  async function signIn(email: string, password: string) {
    setLoading(true); setError("");
    try {
      let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;
      for (let i = 0; i < 3; i++) {
        result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!result.error || i === 2 || !/fetch|network|connection|timeout/i.test(result.error.message)) break;
        await new Promise((resolve) => setTimeout(resolve, i === 0 ? 700 : 1600));
      }
      if (result?.error || !result?.data.session) throw new Error("Sign-in failed. Check your details and connection, then try again.");
      await loadProfile(result.data.session);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }

  async function pickDocument(setPicked: (v: Picked) => void, camera: boolean) {
    setError("");
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError(camera ? "Allow camera access to take this document photo." : "Allow photo access to choose this document."); return; }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], cameraType: ImagePicker.CameraType.back, allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      setPicked({ uri: asset.uri, name: asset.fileName || `identity.${ext}`, type: asset.mimeType || "image/jpeg" });
    }
  }

  async function sendPhoneCode() {
    const phone = toE164(customerPhone);
    if (!phone || phone.replace(/\D/g, "").length < 10) { setPhoneMessage("Add a valid phone number to your customer profile first."); return; }
    setPhoneBusy(true); setPhoneMessage(""); setPhoneVerified(false); setPhoneCode("");
    try {
      const authUser = (await supabase.auth.getUser()).data.user;
      const currentPhone = authUser?.phone?.replace(/\D/g, "").slice(-9);
      const profilePhone = phone.replace(/\D/g, "").slice(-9);
      const result = currentPhone === profilePhone
        ? await supabase.auth.resend({ type: "phone_change", phone })
        : await supabase.auth.updateUser({ phone });
      if (result.error) throw result.error;
      setPhoneChallenge(phone); setPhoneMessage(`A 6-digit verification code was sent to ${phone}.`);
    } catch { setPhoneMessage("We could not send a code. Check the number or try again later."); }
    finally { setPhoneBusy(false); }
  }

  async function verifyPhoneCode() {
    if (!phoneChallenge || !/^\d{6}$/.test(phoneCode)) { setPhoneMessage("Enter the six-digit code sent to your phone."); return; }
    setPhoneBusy(true); setPhoneMessage("");
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({ phone: phoneChallenge, token: phoneCode, type: "phone_change" });
      if (otpError) throw otpError;
      const user = data.user ?? (await supabase.auth.getUser()).data.user;
      const samePhone = user?.phone?.replace(/\D/g, "").slice(-9) === toE164(customerPhone).replace(/\D/g, "").slice(-9);
      if (!user?.phone_confirmed_at || !samePhone) throw new Error("The verified number does not match your customer profile.");
      setPhoneVerified(true); setPhoneMessage("Phone number verified.");
      const fresh = (await supabase.auth.getSession()).data.session;
      if (fresh) setSession(fresh);
    } catch { setPhoneVerified(false); setPhoneMessage("That code could not be verified. Check the code and try again."); }
    finally { setPhoneBusy(false); }
  }

  function startApplication(productId = "") {
    const product = catalog.products.find((p) => p.id === productId);
    setSelectedProductId(product?.id ?? ""); setSelectedTermId(product?.terms[0]?.id ?? "");
    setCollateralId("none"); setSuccess(""); setError(""); setTab("Apply");
  }

  async function submitApplication() {
    setError(""); setSuccess("");
    if (!session || !selectedProduct || !selectedTerm) return setError("Choose an available loan product and repayment term.");
    if (!phoneVerified) return setError("Verify the phone number on your customer account before applying. Your profile phone must match a verified AEOS account phone.");
    if (principal <= 0 || (selectedProduct.min_amount !== null && principal < Number(selectedProduct.min_amount)) || (selectedProduct.max_amount !== null && principal > Number(selectedProduct.max_amount))) return setError("Enter an amount within this loan product’s displayed limits.");
    if (address.trim().length < 5 || kinName.trim().length < 2 || kinRelationship.trim().length < 2 || kinPhone.trim().length < 7) return setError("Complete your residential address and all next-of-kin details.");
    if (!nrcFront || !nrcBack || !selfie) return setError("Add the front and back of your NRC and a clear selfie to continue.");
    if (!collateralId) return setError("Choose None or select a collateral item.");
    if (collateralId !== "none" && collateralWorth && (!Number.isFinite(Number(collateralWorth)) || Number(collateralWorth) < 0)) return setError("Enter a valid collateral value.");

    setSubmitting(true);
    try {
      const form = new FormData();
      const fields: Record<string, string> = {
        product_id: selectedProduct.id, term_id: selectedTerm.id, application_date: today(), requested_amount: String(principal),
        residential_address: address.trim(), next_of_kin_name: kinName.trim(), next_of_kin_relationship: kinRelationship.trim(), next_of_kin_phone: kinPhone.trim(),
        collateral_id: collateralId, notes: notes.trim(),
      };
      if (collateralId !== "none" && collateralWorth) fields.collateral_worth = String(Number(collateralWorth));
      Object.entries(fields).forEach(([key, value]) => form.append(key, value));
      const addFile = (key: string, file: Picked) => form.append(key, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
      addFile("nrc_front", nrcFront); addFile("nrc_back", nrcBack); addFile("selfie", selfie);
      const response = await fetch(`${process.env.EXPO_PUBLIC_AEOS_API_URL?.replace(/\/$/, "")}/api/customer/loan-applications`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to submit your application. Check your connection and retry.");
      setSuccess(`Application ${body.application?.application_number ?? "submitted"} received. Alessandro Soft Loans will review it and update your account.`);
      setNrcFront(null); setNrcBack(null); setSelfie(null); setTab("My loans");
      await refreshData(session);
    } catch (e) { setError(errorText(e)); }
    finally { setSubmitting(false); }
  }

  if (restoring) return <Splash label="Restoring your secure session…" />;
  if (!session) return <Login onSignIn={signIn} onReset={async (email) => { if (!email.trim()) throw new Error("Enter your email address first."); const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim()); if (resetError) throw resetError; }} busy={loading} error={error} />;

  return <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
    <StatusBar style="light" />
    <View style={s.header}>
      <View style={s.brandRow}><Image source={require("./assets/app-icon.png")} style={s.logo} /><View><Text style={s.brand}>ALESSANDRO</Text><Text style={s.brandSub}>SOFT LOANS</Text></View></View>
      <View style={s.greeting}><Text style={s.eyebrow}>CUSTOMER FINANCE</Text><Text style={s.greetingTitle}>Hello, {customerName.split(" ")[0]}</Text><Text style={s.greetingCopy}>Clear loan options. A simple application.</Text></View>
    </View>
    <View style={s.tabBar}>{(["Home", "Apply", "My loans", "Account"] as Tab[]).map((item) => <Pressable key={item} onPress={() => { setError(""); setSuccess(""); if (item === "Apply" && !selectedProductId && catalog.products[0]) startApplication(catalog.products[0].id); else setTab(item); }} style={[s.tab, tab === item && s.tabActive]}><Text style={[s.tabText, tab === item && s.tabTextActive]}>{item}</Text></Pressable>)}</View>
    {(error || success) ? <View style={[s.notice, error ? s.noticeError : s.noticeSuccess]}><Text style={s.noticeText}>{error || success}</Text></View> : null}
    {tab === "Home" && <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshData()} tintColor={C.navy} colors={[C.navy, C.gold]} />}>
      <View style={s.welcomeCard}><View style={s.welcomeIcon}><Landmark color={C.gold} size={22} /></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>Loan options for your plans</Text><Text style={s.muted}>Choose a product to see its approved amount limits and repayment options.</Text></View></View>
      <SectionTitle title="Available loan products" action={loading ? "Updating…" : "Pull to refresh"} />
      {loading && catalog.products.length === 0 ? <ActivityIndicator color={C.navy} style={{ marginTop: 36 }} /> : catalog.products.length === 0 ? <Empty icon={<Banknote color={C.muted} />} title="Loan options are not available yet" subtitle="Reconnect and refresh to load current products from AEOS." onPress={() => void refreshData()} /> : catalog.products.map((product) => <ProductCard key={product.id} product={product} onApply={() => startApplication(product.id)} />)}
      <Text style={s.footnote}>Your application is reviewed by Alessandro Soft Loans. Submitting an application does not guarantee approval.</Text>
    </ScrollView>}
    {tab === "Apply" && <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Loan application" action="Secure submission" />
      {!phoneVerified && <View style={[s.notice, s.noticeWarn]}><Text style={s.noticeText}>Phone verification required: verify the same phone number as your AEOS customer profile before submitting.</Text></View>}
      <View style={s.card}><Text style={s.sectionTitle}>1 · Loan details</Text><Label>Loan product</Label><SelectList values={catalog.products.map((p) => ({ id: p.id, label: p.name }))} selected={selectedProductId} onSelect={(id) => { setSelectedProductId(id); setSelectedTermId(catalog.products.find((p) => p.id === id)?.terms[0]?.id ?? ""); }} />
        {!!selectedProduct && <><Text style={s.helper}>{selectedProduct.description || "Select a repayment option and enter the amount you would like to request."}</Text><Text style={s.limits}>Available amount: {selectedProduct.min_amount === null ? "No minimum" : money(Number(selectedProduct.min_amount))} – {selectedProduct.max_amount === null ? "No maximum" : money(Number(selectedProduct.max_amount))}</Text><Label>Repayment option</Label><SelectList values={selectedProduct.terms.map((t) => ({ id: t.id, label: `${t.period_days} days · ${t.interest_rate}% interest` }))} selected={selectedTermId} onSelect={setSelectedTermId} />{selectedProduct.terms.length === 0 && <Text style={s.error}>No active repayment options are configured for this product.</Text>}<Label>Amount requested (ZMW)</Label><Field value={amount} onChangeText={setAmount} placeholder="Enter amount" keyboardType="decimal-pad" />{principal > 0 && selectedTerm && <View style={s.summary}><SummaryRow label="Principal" value={money(principal)} /><SummaryRow label={`Interest (${selectedTerm.interest_rate}%)`} value={money(interest)} /><SummaryRow label="Estimated total" value={money(total)} strong /></View>}</>}
      </View>
      <View style={s.card}><Text style={s.sectionTitle}>2 · Your details</Text><Label>Residential address</Label><Field value={address} onChangeText={setAddress} placeholder="House, area and town" /><Text style={s.subheading}>Next of kin</Text><Label>Full name</Label><Field value={kinName} onChangeText={setKinName} placeholder="Next-of-kin name" /><Label>Relationship</Label><Field value={kinRelationship} onChangeText={setKinRelationship} placeholder="e.g. Spouse, parent" /><Label>Phone number</Label><Field value={kinPhone} onChangeText={setKinPhone} placeholder="Next-of-kin phone" keyboardType="phone-pad" /><View style={[s.phoneStatus, phoneVerified ? s.phoneOkay : s.phoneMissing]}>{phoneVerified ? <BadgeCheck size={18} color={C.green} /> : <CircleAlert size={18} color="#B54708" />}<Text style={s.phoneStatusText}>{phoneVerified ? `Verified customer phone · ${customerPhone}` : `Phone verification · ${customerPhone || "No phone on account"}`}</Text></View>{!phoneVerified && <><View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}><Pressable disabled={phoneBusy || !customerPhone} onPress={() => void sendPhoneCode()} style={s.secondaryButton}><Text style={s.secondaryText}>{phoneBusy ? "Please wait…" : phoneChallenge ? "Resend code" : "Send code"}</Text></Pressable>{phoneChallenge && <><Field value={phoneCode} onChangeText={(v) => setPhoneCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} style={{ minWidth: 100 }} /><Pressable disabled={phoneBusy || phoneCode.length !== 6} onPress={() => void verifyPhoneCode()} style={s.verifyButton}><Text style={s.primaryText}>{phoneBusy ? "Checking" : "Verify"}</Text></Pressable></>}</View>{!!phoneMessage && <Text style={s.helper}>{phoneMessage}</Text>}</>}</View>
      <View style={s.card}><Text style={s.sectionTitle}>3 · Identity verification</Text><Text style={s.helper}>Images are uploaded securely to AEOS and visible only to authorized loan reviewers. JPEG, PNG or WebP, up to 5 MB each.</Text><DocumentPicker title="NRC front" value={nrcFront} onPick={(camera) => void pickDocument(setNrcFront, camera)} /><DocumentPicker title="NRC back" value={nrcBack} onPick={(camera) => void pickDocument(setNrcBack, camera)} /><DocumentPicker title="Verification selfie" value={selfie} onPick={(camera) => void pickDocument(setSelfie, camera)} /></View>
      <View style={s.card}><Text style={s.sectionTitle}>4 · Collateral and notes</Text><Text style={s.helper}>Collateral choice is available when the selected product permits it. Choose None if you are not pledging an item.</Text><SelectList values={[{ id: "none", label: "None" }, ...catalog.collaterals.map((c) => ({ id: c.id, label: c.name }))]} selected={collateralId} onSelect={setCollateralId} />{collateralId && collateralId !== "none" && <><Label>Estimated collateral worth (ZMW)</Label><Field value={collateralWorth} onChangeText={setCollateralWorth} placeholder="Enter estimated value" keyboardType="decimal-pad" /></>}<Label>Additional notes (optional)</Label><Field value={notes} onChangeText={setNotes} placeholder="Tell us anything important about your request" multiline /></View>
      <Pressable disabled={submitting || !selectedProduct?.terms.length} onPress={() => void submitApplication()} style={[s.primaryButton, submitting && s.disabled]}>{submitting ? <ActivityIndicator color={C.white} /> : <><Text style={s.primaryText}>Submit loan application</Text><ArrowRight color={C.white} size={18} /></>}</Pressable>
      <Text style={s.footnote}>By submitting, you confirm that the information provided is accurate and consent to its review for this loan request.</Text>
    </ScrollView>}
    {tab === "My loans" && <ScrollView contentContainerStyle={s.content}><SectionTitle title="My applications" action={loading ? "Refreshing…" : `${loans.length} total`} />{loading && loans.length === 0 ? <ActivityIndicator color={C.navy} style={{ marginTop: 36 }} /> : loans.length === 0 ? <Empty icon={<FileCheck2 color={C.muted} />} title="No applications yet" subtitle="Your submitted applications and status updates will appear here." onPress={() => startApplication(catalog.products[0]?.id)} /> : loans.map((loan) => <View key={loan.id} style={s.loanCard}><View style={s.loanTop}><View style={{ flex: 1 }}><Text style={s.loanProduct}>{loan.loan_products?.name || loan.loan_type || "Loan application"}</Text><Text style={s.helper}>{loan.application_number || new Date(loan.created_at).toLocaleDateString()}</Text></View><StatusPill status={loan.status} /></View><View style={s.loanAmounts}><SummaryRow label="Requested" value={money(Number(loan.requested_amount))} /><SummaryRow label="Outstanding" value={money(Number(loan.outstanding_balance ?? 0))} /></View>{loan.status === "Rejected" && loan.rejection_reason ? <View style={s.rejection}><Text style={s.rejectionTitle}>Review message</Text><Text style={s.helper}>{loan.rejection_reason}</Text></View> : null}</View>)}<Pressable onPress={() => void refreshData()} style={s.secondaryButton}><Text style={s.secondaryText}>Refresh applications</Text></Pressable></ScrollView>}
    {tab === "Account" && <ScrollView contentContainerStyle={s.content}><View style={s.profileCard}><View style={s.profileIcon}><UserRound color={C.navy} size={24} /></View><Text style={s.profileName}>{customerName}</Text><Text style={s.muted}>{session.user.email || "Customer account"}</Text><Text style={s.muted}>{customerPhone}</Text><View style={[s.phoneStatus, phoneVerified ? s.phoneOkay : s.phoneMissing]}>{phoneVerified ? <BadgeCheck size={17} color={C.green} /> : <CircleAlert size={17} color="#B54708" />}<Text style={s.phoneStatusText}>{phoneVerified ? "Phone verified" : "Phone verification needed to submit a loan"}</Text></View></View><View style={s.card}><Text style={s.sectionTitle}>Your data and privacy</Text><Text style={s.helper}>Loan application details and identity images are sent securely to AEOS. Your account stays signed in on this device until you choose to sign out.</Text></View><Pressable onPress={() => void supabase.auth.signOut()} style={s.signOut}><LogOut color={C.red} size={18} /><Text style={s.signOutText}>Sign out</Text></Pressable></ScrollView>}
    <View style={s.bottom}><Text style={s.bottomText}>ALESSANDRO SOFT LOANS  ·  CONNECTED TO AEOS</Text></View>
  </SafeAreaView>;
}

function Login({ onSignIn, onReset, busy, error }: { onSignIn: (email: string, password: string) => void; onReset: (email: string) => Promise<void>; busy: boolean; error: string }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [resetMessage, setResetMessage] = useState(""); const [resetBusy, setResetBusy] = useState(false);
  return <SafeAreaView style={s.loginSafe}><StatusBar style="light" /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView contentContainerStyle={s.loginContent} keyboardShouldPersistTaps="handled"><Image source={require("./assets/app-icon.png")} style={s.loginLogo} /><Text style={s.loginBrand}>ALESSANDRO</Text><Text style={s.loginSub}>SOFT LOANS</Text><Text style={s.loginWelcome}>Loan options, made clear.</Text><Text style={s.loginCopy}>Sign in with your AEOS customer account to view products and apply securely.</Text><View style={s.loginCard}><Text style={s.cardTitle}>Customer sign in</Text><Label>Email address</Label><Field value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" icon={<Mail size={17} color={C.muted} />} /><Label>Password</Label><Field value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry icon={<LockKeyhole size={17} color={C.muted} />} /><Text style={s.helper}>Use the same customer credentials as the AEOS Customer Portal.</Text>{!!error && <Text style={s.error}>{error}</Text>}<Pressable disabled={busy || !configured || !email.trim() || !password} onPress={() => onSignIn(email, password)} style={[s.primaryButton, (busy || !configured || !email.trim() || !password) && s.disabled]}>{busy ? <ActivityIndicator color={C.white} /> : <><Text style={s.primaryText}>Sign in securely</Text><ArrowRight color={C.white} size={18} /></>}</Pressable><Pressable disabled={resetBusy || !configured} onPress={() => { setResetBusy(true); setResetMessage(""); void onReset(email).then(() => setResetMessage("If this email belongs to an account, a password reset message has been sent.")).catch((e) => setResetMessage(errorText(e))).finally(() => setResetBusy(false)); }} style={s.forgot}><Text style={s.forgotText}>{resetBusy ? "Sending reset email…" : "Forgot password?"}</Text></Pressable>{!!resetMessage && <Text style={s.helper}>{resetMessage}</Text>}{!configured && <Text style={s.error}>App connection settings are missing. Configure the three values in the setup guide.</Text>}</View><Text style={s.loginFoot}>Your account remains signed in until you sign out.</Text></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Splash({ label }: { label: string }) { return <View style={s.splash}><StatusBar style="light" /><Image source={require("./assets/app-icon.png")} style={s.loginLogo} /><ActivityIndicator color={C.gold} style={{ marginTop: 20 }} /><Text style={s.splashText}>{label}</Text></View>; }
function SectionTitle({ title, action }: { title: string; action?: string }) { return <View style={s.sectionHeading}><Text style={s.sectionHeadingTitle}>{title}</Text>{action ? <Text style={s.helper}>{action}</Text> : null}</View>; }
function Label({ children }: { children: React.ReactNode }) { return <Text style={s.label}>{children}</Text>; }
function Field(props: React.ComponentProps<typeof TextInput> & { icon?: React.ReactNode }) { const { icon, style, ...rest } = props; return <View style={[s.fieldWrap, rest.multiline && s.multilineWrap]}>{icon}<TextInput {...rest} placeholderTextColor="#94A3B8" style={[s.input, rest.multiline && s.multiline, style]} /></View>; }
function SelectList({ values, selected, onSelect }: { values: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void }) { const [open, setOpen] = useState(false); const choice = values.find((v) => v.id === selected); return <View><Pressable onPress={() => setOpen((v) => !v)} style={s.select}><Text style={[s.selectText, !choice && s.placeholder]} numberOfLines={1}>{choice?.label || "Choose an option"}</Text><ChevronDown size={18} color={C.muted} /></Pressable>{open && <View style={s.optionList}>{values.length ? values.map((v) => <Pressable key={v.id} onPress={() => { onSelect(v.id); setOpen(false); }} style={s.option}><Text style={[s.optionText, selected === v.id && s.optionSelected]}>{v.label}</Text>{selected === v.id ? <Check size={17} color={C.green} /> : null}</Pressable>) : <Text style={s.helper}>No options available.</Text>}</View>}</View>; }
function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <View style={s.summaryRow}><Text style={[s.summaryLabel, strong && s.summaryStrong]}>{label}</Text><Text style={[s.summaryValue, strong && s.summaryStrong]}>{value}</Text></View>; }
function ProductCard({ product, onApply }: { product: Product; onApply: () => void }) { const terms = product.terms ?? []; return <View style={s.productCard}><View style={s.productTop}><View style={s.productIcon}><Wallet color={C.gold} size={22} /></View><View style={{ flex: 1 }}><Text style={s.productName}>{product.name}</Text><Text style={s.helper}>{product.description || "Flexible financing from Alessandro Soft Loans."}</Text></View></View><View style={s.productMeta}><Text style={s.productMetaText}>{product.min_amount === null ? "Flexible minimum" : `From ${money(Number(product.min_amount))}`}</Text><Text style={s.productMetaText}>{product.max_amount === null ? "Flexible maximum" : `Up to ${money(Number(product.max_amount))}`}</Text></View><Text style={s.termCaption}>{terms.length} repayment options · {product.requires_collateral ? "Collateral may be required" : "No collateral required"}</Text><View style={s.termChips}>{terms.slice(0, 3).map((term) => <View key={term.id} style={s.termChip}><Text style={s.termChipText}>{term.period_days} days · {term.interest_rate}%</Text></View>)}</View><Pressable onPress={onApply} style={s.applyButton}><Text style={s.applyButtonText}>Apply for this loan</Text><ArrowRight color={C.navy} size={17} /></Pressable></View>; }
function DocumentPicker({ title, value, onPick }: { title: string; value: Picked | null; onPick: (camera: boolean) => void }) { return <View style={s.documentBox}><View style={{ flex: 1 }}><Text style={s.docTitle}>{title}</Text><Text style={s.helper}>{value ? value.name : "No image added"}</Text></View><Pressable onPress={() => onPick(true)} style={s.cameraButton}><Camera color={C.navy} size={17} /><Text style={s.cameraText}>{value ? "Retake" : "Camera"}</Text></Pressable><Pressable onPress={() => onPick(false)} style={s.galleryButton}><Text style={s.galleryText}>Choose</Text></Pressable></View>; }
function StatusPill({ status }: { status: string }) { const color = status === "Approved" || status === "Active" || status === "Completed" ? C.green : status === "Rejected" || status === "Cancelled" ? C.red : C.blue; return <View style={[s.statusPill, { backgroundColor: `${color}18` }]}><Text style={[s.statusText, { color }]}>{status}</Text></View>; }
function Empty({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) { return <View style={s.empty}>{icon}<Text style={s.emptyTitle}>{title}</Text><Text style={s.helper}>{subtitle}</Text><Pressable onPress={onPress} style={s.secondaryButton}><Text style={s.secondaryText}>Refresh</Text></Pressable></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, loginSafe: { flex: 1, backgroundColor: C.navy }, header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 19 }, brandRow: { flexDirection: "row", alignItems: "center", gap: 11 }, logo: { width: 43, height: 43, borderRadius: 12, backgroundColor: C.white }, brand: { color: C.gold, fontSize: 12, fontWeight: "900", letterSpacing: 2 }, brandSub: { color: C.white, marginTop: 2, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 }, greeting: { marginTop: 20 }, eyebrow: { color: C.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.8 }, greetingTitle: { color: C.white, fontSize: 25, fontWeight: "900", marginTop: 4 }, greetingCopy: { color: "#D2DCE8", fontSize: 12, marginTop: 3 }, tabBar: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 9, gap: 6, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }, tab: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 }, tabActive: { backgroundColor: C.navy }, tabText: { fontSize: 10, fontWeight: "800", color: C.muted }, tabTextActive: { color: C.gold }, content: { padding: 16, paddingBottom: 28, gap: 12 }, notice: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 12, borderWidth: 1 }, noticeError: { backgroundColor: "#FFF1F0", borderColor: "#FECACA" }, noticeSuccess: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }, noticeWarn: { marginHorizontal: 0, marginTop: 0, backgroundColor: C.goldPale, borderColor: "#F4D983" }, noticeText: { color: C.ink, fontSize: 12, lineHeight: 18, fontWeight: "600" }, welcomeCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 16, backgroundColor: C.navy, borderRadius: 17 }, welcomeIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF16" }, cardTitle: { color: C.ink, fontSize: 17, fontWeight: "900" }, muted: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, sectionHeading: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 5 }, sectionHeadingTitle: { color: C.ink, fontSize: 18, fontWeight: "900" }, card: { padding: 16, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, gap: 4 }, sectionTitle: { color: C.navy, fontSize: 15, fontWeight: "900", marginBottom: 7 }, label: { color: C.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 6 }, fieldWrap: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.white, paddingHorizontal: 12 }, input: { flex: 1, minWidth: 0, paddingVertical: 12, color: C.ink, fontSize: 14 }, multilineWrap: { minHeight: 92, alignItems: "flex-start" }, multiline: { minHeight: 82, textAlignVertical: "top" }, helper: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, select: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.white }, selectText: { flex: 1, color: C.ink, fontSize: 13, fontWeight: "700", marginRight: 8 }, placeholder: { color: C.muted, fontWeight: "400" }, optionList: { marginTop: 5, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.white, overflow: "hidden" }, option: { minHeight: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.bg }, optionText: { flex: 1, color: C.ink, fontSize: 13 }, optionSelected: { color: C.green, fontWeight: "800" }, limits: { color: C.blue, fontSize: 11, fontWeight: "800", marginTop: 8 }, summary: { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginTop: 12, gap: 7 }, summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, summaryLabel: { color: C.muted, fontSize: 12 }, summaryValue: { color: C.ink, fontSize: 12, fontWeight: "800" }, summaryStrong: { color: C.navy, fontSize: 13, fontWeight: "900" }, subheading: { color: C.ink, fontSize: 13, fontWeight: "900", marginTop: 17 }, phoneStatus: { flexDirection: "row", alignItems: "center", gap: 8, padding: 11, borderRadius: 11, marginTop: 14 }, phoneOkay: { backgroundColor: "#ECFDF5" }, phoneMissing: { backgroundColor: C.goldPale }, phoneStatusText: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "700" }, documentBox: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 66, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.bg }, docTitle: { color: C.ink, fontSize: 13, fontWeight: "800" }, cameraButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8, borderRadius: 9, backgroundColor: C.goldPale }, cameraText: { color: C.navy, fontSize: 10, fontWeight: "800" }, galleryButton: { padding: 8 }, galleryText: { color: C.blue, fontSize: 10, fontWeight: "800" }, primaryButton: { minHeight: 51, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: C.navy, borderRadius: 13, paddingHorizontal: 16 }, primaryText: { color: C.white, fontSize: 14, fontWeight: "900" }, disabled: { opacity: 0.55 }, footnote: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginVertical: 6 }, productCard: { padding: 15, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border }, productTop: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, productIcon: { width: 43, height: 43, backgroundColor: C.navy, borderRadius: 13, alignItems: "center", justifyContent: "center" }, productName: { color: C.navy, fontSize: 16, fontWeight: "900" }, productMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.bg }, productMetaText: { color: C.ink, fontSize: 10, fontWeight: "800" }, termCaption: { color: C.muted, fontSize: 10, marginTop: 10 }, termChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, termChip: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, backgroundColor: C.goldPale }, termChipText: { color: "#7A5B00", fontSize: 10, fontWeight: "800" }, applyButton: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 10, backgroundColor: C.gold, marginTop: 14 }, applyButtonText: { color: C.navy, fontSize: 12, fontWeight: "900" }, empty: { alignItems: "center", padding: 28, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, gap: 9 }, emptyTitle: { color: C.ink, fontSize: 16, fontWeight: "900", textAlign: "center" }, secondaryButton: { alignSelf: "center", paddingHorizontal: 17, paddingVertical: 11, borderWidth: 1, borderColor: C.border, borderRadius: 10, marginTop: 8 }, secondaryText: { color: C.navy, fontSize: 12, fontWeight: "800" }, verifyButton: { minWidth: 66, minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 11, backgroundColor: C.navy, borderRadius: 10 }, forgot: { alignSelf: "center", paddingVertical: 12 }, forgotText: { color: "#8A6D13", fontSize: 12, fontWeight: "800" }, loanCard: { padding: 15, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.border }, loanTop: { flexDirection: "row", alignItems: "center", gap: 8 }, loanProduct: { color: C.navy, fontSize: 15, fontWeight: "900" }, loanAmounts: { marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderColor: C.bg, gap: 8 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 }, statusText: { fontSize: 10, fontWeight: "900" }, rejection: { marginTop: 12, padding: 11, backgroundColor: "#FFF1F0", borderRadius: 10 }, rejectionTitle: { color: C.red, fontSize: 11, fontWeight: "900" }, profileCard: { alignItems: "center", padding: 22, backgroundColor: C.white, borderRadius: 17, borderWidth: 1, borderColor: C.border }, profileIcon: { width: 53, height: 53, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: C.goldPale }, profileName: { color: C.navy, fontSize: 18, fontWeight: "900", marginTop: 10 }, signOut: { flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", minHeight: 48, borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, backgroundColor: C.white }, signOutText: { color: C.red, fontSize: 13, fontWeight: "900" }, bottom: { paddingVertical: 8, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border, alignItems: "center" }, bottomText: { color: C.muted, fontSize: 8, letterSpacing: 1, fontWeight: "800" }, loginContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 23, paddingVertical: 26 }, loginLogo: { width: 76, height: 76, alignSelf: "center", borderRadius: 21, backgroundColor: C.white }, loginBrand: { alignSelf: "center", color: C.gold, fontSize: 15, fontWeight: "900", letterSpacing: 2.4, marginTop: 14 }, loginSub: { alignSelf: "center", color: C.white, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginTop: 4 }, loginWelcome: { color: C.white, fontSize: 27, fontWeight: "900", textAlign: "center", marginTop: 26 }, loginCopy: { color: "#CAD6E4", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8, marginBottom: 22 }, loginCard: { padding: 20, borderRadius: 21, backgroundColor: C.white }, loginFoot: { color: "#CAD6E4", textAlign: "center", fontSize: 11, marginTop: 18 }, error: { color: C.red, fontSize: 12, lineHeight: 18, marginTop: 11 }, splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.navy }, splashText: { color: C.white, fontSize: 12, marginTop: 12 },
});
