import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { theme } from "../theme";

export function CustomerLoginScreen({
  onSignedIn,
  onOpenWebsite,
}: {
  onSignedIn: (session: Session) => void;
  onOpenWebsite: (path: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(isSupabaseConfigured ? "" : "Sign-in is temporarily unavailable. Please try again later.");

  async function submit() {
    if (!isSupabaseConfigured) {
      setError("Sign-in is temporarily unavailable. Please try again later.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.session) {
        const message = signInError?.message ?? "";
        const networkFailure = /fetch failed|failed to fetch|network|unable to resolve host|timed? ?out|connection/i.test(message);
        setError(networkFailure ? "We’re having trouble connecting. Check your internet connection and try again." : "We couldn’t sign you in. Check your email and password, then try again.");
        return;
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("is_active, status")
        .eq("auth_user_id", data.session.user.id)
        .maybeSingle();

      if (customerError) {
        await supabase.auth.signOut();
        const networkFailure = /fetch failed|failed to fetch|network|unable to resolve host|timed? ?out|connection/i.test(customerError.message);
        setError(networkFailure ? "We’re having trouble connecting. Check your internet connection and try again." : "We couldn’t verify your customer account right now. Please try again.");
        return;
      }
      if (customer?.is_active !== true || customer.status?.toLowerCase() !== "active") {
        await supabase.auth.signOut();
        setError("This account isn’t active for customer access. Please contact AEOS support.");
        return;
      }

      onSignedIn(data.session);
    } catch {
      setError("We couldn’t connect right now. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image source={require("../../assets/app-icon.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>ALESSANDRO</Text>
          <Text style={styles.brandSub}>ENTERPRISES</Text>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.intro}>Sign in to your customer account.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Customer sign in</Text>
          <Text style={styles.note}>Use your customer account to continue.</Text>

          <Text style={styles.fieldLabel}>Email address</Text>
          <View style={styles.inputWrap}>
            <Mail size={17} color={theme.colors.muted} />
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>

          <Text style={[styles.fieldLabel, styles.passwordLabel]}>Password</Text>
          <View style={styles.inputWrap}>
            <LockKeyhole size={17} color={theme.colors.muted} />
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
          </View>

          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <Pressable disabled={busy || !email.trim() || !password || !isSupabaseConfigured} onPress={() => void submit()} style={({ pressed }) => [styles.signIn, pressed && styles.pressed, (busy || !email.trim() || !password || !isSupabaseConfigured) && styles.disabled]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.signInText}>Sign in</Text><ArrowRight color="#FFFFFF" size={17} /></>}
          </Pressable>

          <Pressable onPress={() => onOpenWebsite("/customer/register")} style={styles.createAccount}>
            <Text style={styles.createText}>New to AEOS? <Text style={styles.createEmphasis}>Create an account</Text></Text>
          </Pressable>
          <Pressable onPress={() => onOpenWebsite("/forgot-password")} style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.navy },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingTop: 32, paddingBottom: 32 },
  brand: { alignItems: "center", marginBottom: 23 },
  logo: { width: 72, height: 72, backgroundColor: "#FFFFFF", borderRadius: 20, marginBottom: 12 },
  brandName: { color: theme.colors.goldLight, fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  brandSub: { marginTop: 2, color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
  welcome: { marginTop: 23, color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -0.5 },
  intro: { marginTop: 5, color: "#C7D2E1", fontSize: 13 },
  formCard: { width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: theme.colors.surface, borderRadius: 24, padding: 21 },
  title: { color: theme.colors.navy, fontSize: 20, fontWeight: "900" },
  note: { marginTop: 4, marginBottom: 20, color: theme.colors.muted, fontSize: 12 },
  fieldLabel: { marginBottom: 7, color: "#475569", fontSize: 12, fontWeight: "800" },
  passwordLabel: { marginTop: 15 },
  inputWrap: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, paddingHorizontal: 13, backgroundColor: "#FFFFFF" },
  input: { flex: 1, minWidth: 0, color: theme.colors.text, paddingVertical: 11, fontSize: 14 },
  error: { marginTop: 12, color: theme.colors.danger, fontSize: 12, lineHeight: 17 },
  signIn: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18, borderRadius: 13, backgroundColor: theme.colors.navy },
  signInText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  createAccount: { alignItems: "center", paddingTop: 18 },
  createText: { color: theme.colors.muted, fontSize: 12 },
  createEmphasis: { color: theme.colors.navy, fontWeight: "900" },
  forgot: { alignItems: "center", paddingTop: 12 },
  forgotText: { color: "#8A6D13", fontSize: 12, fontWeight: "800" },
});
