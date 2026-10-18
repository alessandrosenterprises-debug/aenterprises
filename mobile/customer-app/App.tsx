import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, BackHandler, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
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
import { disableCustomerPushTokens, registerCustomerPushToken } from "./src/services/pushNotifications";
import { theme } from "./src/theme";

type CustomerAppState = "restoring" | "signed-out" | "signed-in" | "connection-error";
const NATIVE_PERMISSIONS_PATH = "native:permissions";
const customerPageStorageKey = (userId: string) => `aeos-current-page-${userId}`;
type CustomerRecord = { id: string; full_name: string | null; is_active: boolean | null; status: string | null };
type ProfileRecord = { id: string; avatar_url: string | null };

export default function App() {
  const [appState, setAppState] = useState<CustomerAppState>("restoring");
  const [session, setSession] = useState<Session | null>(null);
  const [customerName, setCustomerName] = useState("Customer");
  const [profileId, setProfileId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [webCanGoBack, setWebCanGoBack] = useState(false);
  const [routeRestoreReady, setRouteRestoreReady] = useState(false);
  const handledNotificationResponse = useRef<string | null>(null);
  const refreshUnreadRef = useRef<() => Promise<void>>(async () => undefined);
  const lastAuthenticatedUserId = useRef<string | null>(null);

  const acceptSession = useCallback(async (nextSession: Session | null) => {
    if (!nextSession || !isSupabaseConfigured) {
      const previousUserId = lastAuthenticatedUserId.current;
      lastAuthenticatedUserId.current = null;
      if (previousUserId) void SecureStore.deleteItemAsync(customerPageStorageKey(previousUserId)).catch(() => undefined);
      setSession(null);
      setProfileId("");
      setAvatarUrl("");
      setCurrentPath(null);
      setWebCanGoBack(false);
      void Notifications.setBadgeCountAsync(0).catch(() => undefined);
      setAppState("signed-out");
      return;
    }
    lastAuthenticatedUserId.current = nextSession.user.id;
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
      setAppState("signed-in");
    } catch {
      setSession(nextSession);
      setProfileId("");
      setAvatarUrl("");
      setWebCanGoBack(false);
      setAppState("connection-error");
    }
  }, []);

  useEffect(() => {
    if (!routeRestoreReady || !session) return;
    const key = customerPageStorageKey(session.user.id);
    if (currentPath === NATIVE_PERMISSIONS_PATH) return;
    if (currentPath && currentPath.startsWith("/") && !currentPath.startsWith("//") && !currentPath.startsWith("/customer/login")) {
      void SecureStore.setItemAsync(key, currentPath).catch(() => undefined);
    } else {
      void SecureStore.deleteItemAsync(key).catch(() => undefined);
    }
  }, [currentPath, routeRestoreReady, session?.user.id]);

  const refreshUnreadCount = useCallback(async () => {
    if (!profileId) return;
    try {
      const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", profileId).eq("unread", true);
      if (error || count === null) return;
      setUnreadNotifications(count);
      void Notifications.setBadgeCountAsync(count).catch(() => undefined);
      void SecureStore.setItemAsync(`aeos-unread-${profileId}`, String(count)).catch(() => undefined);
    } catch {
      // Preserve the last cached badge count while the network is unavailable.
    }
  }, [profileId]);
  refreshUnreadRef.current = refreshUnreadCount;

  useEffect(() => {
    if (!profileId) { setUnreadNotifications(0); return; }
    let mounted = true;
    void SecureStore.getItemAsync(`aeos-unread-${profileId}`).then((value) => {
      if (mounted && value !== null) setUnreadNotifications(Number(value) || 0);
      if (mounted) void refreshUnreadCount();
    }).catch(() => { if (mounted) void refreshUnreadCount(); });
    const channel = supabase.channel(`native-notifications-${profileId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profileId}` }, () => void refreshUnreadCount()).subscribe();
    const timer = setInterval(() => void refreshUnreadCount(), 30_000);
    const appStateListener = AppState.addEventListener("change", (state) => { if (state === "active") void refreshUnreadCount(); });
    return () => { mounted = false; clearInterval(timer); appStateListener.remove(); void supabase.removeChannel(channel); };
  }, [profileId, refreshUnreadCount]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const register = (askPermission: boolean) => {
      if (active) void registerCustomerPushToken(session, askPermission);
    };
    // Ask once after sign-in. A later app resume retries token registration without
    // repeating a permission prompt that the customer has already answered.
    register(true);
    const received = Notifications.addNotificationReceivedListener(() => {
      void refreshUnreadRef.current();
    });
    const openNotification = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledNotificationResponse.current === id) return;
      handledNotificationResponse.current = id;
      const destination = response.notification.request.content.data?.action_url;
      if (typeof destination === "string" && destination.startsWith("/")) {
        setCurrentPath(destination === "/customer" ? null : destination);
        setWebCanGoBack(false);
      }
      void refreshUnreadRef.current();
    };
    const responseListener = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) openNotification(response);
    }).catch(() => undefined);
    const appStateListener = AppState.addEventListener("change", (state) => {
      if (state === "active") register(false);
    });
    return () => {
      active = false;
      received.remove();
      responseListener.remove();
      appStateListener.remove();
    };
  }, [session?.user.id]);

  const signOutCustomer = useCallback(async () => {
    try { if (session?.user.id) await disableCustomerPushTokens(session.user.id); } catch { /* Sign-out must still finish on a weak network. */ }
    await supabase.auth.signOut();
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      if (!isSupabaseConfigured) {
        setRouteRestoreReady(true);
        setAppState("signed-out");
        return;
      }
      const restorePage = async (userId: string) => {
        try {
          const savedPath = await SecureStore.getItemAsync(customerPageStorageKey(userId));
          if (mounted && savedPath?.startsWith("/") && !savedPath.startsWith("//") && !savedPath.startsWith("/customer/login")) {
            setCurrentPath(savedPath === "/customer" ? null : savedPath);
          }
        } catch { /* If page state is unavailable, continue to the customer home page. */ }
      };
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          lastAuthenticatedUserId.current = data.session.user.id;
          await restorePage(data.session.user.id);
        }
        if (mounted) {
          setRouteRestoreReady(true);
          await acceptSession(data.session);
        }
      } catch {
        if (mounted) {
          // Keep any persisted customer session on weak networks. A transient
          // refresh failure is not a sign-out; show the retry screen instead.
          const { data: cached } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          if (cached.session) {
            lastAuthenticatedUserId.current = cached.session.user.id;
            await restorePage(cached.session.user.id);
            setSession(cached.session);
            setAppState("connection-error");
          } else {
            setCurrentPath(null);
            setWebCanGoBack(false);
            setAppState("signed-out");
          }
          setRouteRestoreReady(true);
        }
      }
    }
    void restoreSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        if (!nextSession) {
          const previousUserId = lastAuthenticatedUserId.current;
          lastAuthenticatedUserId.current = null;
          if (previousUserId) void SecureStore.deleteItemAsync(customerPageStorageKey(previousUserId)).catch(() => undefined);
          setProfileId("");
          setAvatarUrl("");
          setCurrentPath(null);
          setWebCanGoBack(false);
          void Notifications.setBadgeCountAsync(0).catch(() => undefined);
          setAppState("signed-out");
        }
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [acceptSession]);

  useEffect(() => {
    if (appState !== "connection-error" || !session) return;
    let retrying = false;
    const retry = () => {
      if (retrying || AppState.currentState !== "active") return;
      retrying = true;
      void acceptSession(session).finally(() => { retrying = false; });
    };
    const timer = setInterval(retry, 15_000);
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") retry(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [appState, session, acceptSession]);

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
      {appState === "restoring" ? (
        <View style={styles.restoring}><ActivityIndicator size="small" color={theme.colors.gold} /></View>
      ) : appState === "signed-out" && !currentPath ? (
        <CustomerLoginScreen onSignedIn={(nextSession) => void acceptSession(nextSession)} onOpenWebsite={goToPath} />
      ) : appState === "signed-out" ? (
        <CustomerWebPage
          path={currentPath ?? "/customer/login"}
          session={null}
          onClose={() => setCurrentPath(null)}
          onNavigationStateChange={(state: WebViewNavigation) => setWebCanGoBack(state.canGoBack)}
        />
      ) : appState === "connection-error" && session ? (
        <CustomerConnectionErrorScreen onRetry={() => acceptSession(session)} onSignOut={() => void signOutCustomer()} />
      ) : (
        <View style={styles.app}>
          <NativeCustomerHeader customerName={customerName} avatarUrl={avatarUrl} unreadNotifications={unreadNotifications} onNavigate={goToPath} onOpenPermissions={() => { setCurrentPath(NATIVE_PERMISSIONS_PATH); setWebCanGoBack(false); }} onSignOut={() => void signOutCustomer()} />
          <View style={styles.screenContent}>
            {currentPath === NATIVE_PERMISSIONS_PATH ? <NativePermissionsScreen onBack={() => { setCurrentPath(null); setWebCanGoBack(false); }} onNotificationsEnabled={() => { if (session) void registerCustomerPushToken(session); }} /> : <CustomerWebPage
                path={currentPath ?? "/customer"}
                session={session}
                onClose={() => { setCurrentPath(null); setWebCanGoBack(false); }}
                onNavigationStateChange={(state: WebViewNavigation) => {
                  setWebCanGoBack(state.canGoBack);
                  try {
                    const webUrl = new URL(state.url);
                    if (session && webUrl.origin === "https://aenterprises-dashboard.vercel.app") {
                      const pagePath = `${webUrl.pathname}${webUrl.search}${webUrl.hash}`;
                      if (pagePath.startsWith("/") && !pagePath.startsWith("/customer/login")) {
                        void SecureStore.setItemAsync(customerPageStorageKey(session.user.id), pagePath).catch(() => undefined);
                      }
                    }
                    if (session && webUrl.pathname === "/customer/login" && webUrl.searchParams.get("loggedOut") === "1") {
                      setCurrentPath(null);
                      void signOutCustomer().catch(() => undefined);
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
  restoring: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.navy },
  app: { flex: 1, backgroundColor: theme.colors.background },
  screenContent: { flex: 1, backgroundColor: theme.colors.background },
});
