import { useCallback, useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";
import type { WebViewNavigation } from "react-native-webview";
import { CustomerLoginScreen } from "./src/screens/CustomerLoginScreen";
import { CustomerConnectionErrorScreen } from "./src/screens/CustomerConnectionErrorScreen";
import { CustomerWebPage } from "./src/screens/CustomerWebPage";
import { NativePermissionsScreen } from "./src/screens/NativePermissionsScreen";
import { NativeCustomerTabs } from "./src/components/NativeCustomerTabs";
import { NativeCustomerHeader } from "./src/components/NativeCustomerHeader";
import { isSupabaseConfigured, supabase } from "./src/services/supabase";
import { theme } from "./src/theme";

type AppState = "signed-out" | "signed-in" | "connection-error";
const NATIVE_PERMISSIONS_PATH = "native:permissions";
type CustomerRecord = { id: string; full_name: string | null; is_active: boolean | null; status: string | null };
type ProfileRecord = { id: string; avatar_url: string | null };

export default function App() {
  const [appState, setAppState] = useState<AppState>("signed-out");
  const [session, setSession] = useState<Session | null>(null);
  const [customerName, setCustomerName] = useState("Customer");
  const [profileId, setProfileId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [webCanGoBack, setWebCanGoBack] = useState(false);

  const acceptSession = useCallback(async (nextSession: Session | null) => {
    if (!nextSession || !isSupabaseConfigured) {
      setSession(null);
      setProfileId("");
      setAvatarUrl("");
      setCurrentPath(null);
      setWebCanGoBack(false);
      setAppState("signed-out");
      return;
    }
    try {
      const [{ data, error }, { data: profile }] = await Promise.all([
        supabase.from("customers").select("id, full_name, is_active, status").eq("auth_user_id", nextSession.user.id).maybeSingle<CustomerRecord>(),
        supabase.from("profiles").select("id, avatar_url").eq("auth_user_id", nextSession.user.id).maybeSingle<ProfileRecord>(),
      ]);
      if (error) {
        setSession(nextSession);
        setProfileId("");
        setAvatarUrl("");
        setAppState("connection-error");
        return;
      }
      if (data?.is_active !== true || data.status?.toLowerCase() !== "active") {
        await supabase.auth.signOut().catch(() => undefined);
        setSession(null);
        setProfileId("");
        setAvatarUrl("");
        setCurrentPath(null);
        setWebCanGoBack(false);
        setAppState("signed-out");
        return;
      }
      setSession(nextSession);
      setProfileId(profile?.id ?? "");
      setAvatarUrl(profile?.avatar_url ?? "");
      setCustomerName(data.full_name?.trim() || nextSession.user.user_metadata?.full_name || "Customer");
      setCurrentPath(null);
      setAppState("signed-in");
    } catch {
      setSession(nextSession);
      setProfileId("");
      setAvatarUrl("");
      setCurrentPath(null);
      setWebCanGoBack(false);
      setAppState("connection-error");
    }
  }, []);

  useEffect(() => {
    if (!profileId) { setUnreadNotifications(0); return; }
    let mounted = true;
    const refreshUnreadCount = async () => {
      const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", profileId).eq("unread", true);
      if (mounted && !error) setUnreadNotifications(count ?? 0);
    };
    void refreshUnreadCount();
    const channel = supabase.channel(`native-notifications-${profileId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profileId}` }, () => void refreshUnreadCount()).subscribe();
    const timer = setInterval(() => void refreshUnreadCount(), 30_000);
    return () => { mounted = false; clearInterval(timer); void supabase.removeChannel(channel); };
  }, [profileId]);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      if (!isSupabaseConfigured) {
        setAppState("signed-out");
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) await acceptSession(data.session);
      } catch {
        if (mounted) {
          setCurrentPath(null);
          setWebCanGoBack(false);
          setAppState("signed-out");
        }
      }
    }
    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        if (!nextSession) {
          setProfileId("");
          setAvatarUrl("");
          setCurrentPath(null);
          setWebCanGoBack(false);
          setAppState("signed-out");
        }
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [acceptSession]);

  const goToPath = useCallback((path: string) => {
    setCurrentPath(path === "/customer" ? null : path);
    setWebCanGoBack(false);
  }, []);

  const handleBack = useCallback(() => {
    if (currentPath && webCanGoBack) return false;
    if (currentPath) {
      setCurrentPath(null);
      setWebCanGoBack(false);
      return true;
    }
    return false;
  }, [currentPath, webCanGoBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      {appState === "signed-out" && !currentPath ? (
        <CustomerLoginScreen onSignedIn={(nextSession) => void acceptSession(nextSession)} onOpenWebsite={goToPath} />
      ) : appState === "signed-out" ? (
        <CustomerWebPage
          path={currentPath ?? "/customer/login"}
          session={null}
          onClose={() => setCurrentPath(null)}
          onNavigationStateChange={(state: WebViewNavigation) => setWebCanGoBack(state.canGoBack)}
        />
      ) : appState === "connection-error" && session ? (
        <CustomerConnectionErrorScreen onRetry={() => acceptSession(session)} onSignOut={() => void supabase.auth.signOut()} />
      ) : (
        <View style={styles.app}>
          <NativeCustomerHeader customerName={customerName} avatarUrl={avatarUrl} unreadNotifications={unreadNotifications} onNavigate={goToPath} onOpenPermissions={() => { setCurrentPath(NATIVE_PERMISSIONS_PATH); setWebCanGoBack(false); }} onSignOut={() => void supabase.auth.signOut()} />
          <View style={styles.screenContent}>
            {currentPath === NATIVE_PERMISSIONS_PATH ? <NativePermissionsScreen onBack={() => { setCurrentPath(null); setWebCanGoBack(false); }} /> : <CustomerWebPage
                path={currentPath ?? "/customer"}
                session={session}
                onClose={() => { setCurrentPath(null); setWebCanGoBack(false); }}
                onNavigationStateChange={(state: WebViewNavigation) => {
                  setWebCanGoBack(state.canGoBack);
                  try {
                    if (session && new URL(state.url).pathname === "/customer/login") {
                      setCurrentPath(null);
                      void supabase.auth.signOut().catch(() => undefined);
                    }
                  } catch { /* Ignore non-URL WebView state values. */ }
                }}
              />}
          </View>
          <NativeCustomerTabs
            currentPath={currentPath}
            onNavigate={(path) => { setCurrentPath(path); setWebCanGoBack(false); }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.navy },
  app: { flex: 1, backgroundColor: theme.colors.background },
  screenContent: { flex: 1, backgroundColor: theme.colors.background },
});
