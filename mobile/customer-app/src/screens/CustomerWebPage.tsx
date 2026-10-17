import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import WebView, { type WebViewNavigation } from "react-native-webview";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseUrl } from "../services/supabase";
import { theme } from "../theme";

const CUSTOMER_ORIGIN = "https://aenterprises-dashboard.vercel.app";

export function CustomerWebPage({
  path,
  session,
  onClose,
  onNavigationStateChange,
}: {
  path: string;
  session: Session | null;
  onClose: () => void;
  onNavigationStateChange: (state: WebViewNavigation) => void;
}) {
  const ref = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const uri = useMemo(() => path.startsWith("http") ? path : `${CUSTOMER_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`, [path]);
  const injectedAuthCookie = useMemo(() => {
    const supabaseUrl = getSupabaseUrl();
    if (!session || !supabaseUrl) return "true;";
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const sessionJson = JSON.stringify(session);
    return `(()=>{try{const data=btoa(unescape(encodeURIComponent(${JSON.stringify(sessionJson)}))).replace(/=/g,'').replace(/\\+/g,'-').replace(/\\//g,'_');document.cookie=${JSON.stringify(`${storageKey}=base64-`)}+data+'; Path=/; Secure; SameSite=Lax';}catch(e){}})();true;`;
  }, [session]);

  useEffect(() => {
    if (session) ref.current?.injectJavaScript(injectedAuthCookie);
  }, [injectedAuthCookie, session]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) ref.current?.goBack();
      else onClose();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack, onClose]);

  function shouldStart(request: { url: string }) {
    let target: URL;
    try { target = new URL(request.url); } catch { return false; }
    if (target.origin === CUSTOMER_ORIGIN) return true;
    if (target.protocol === "mailto:" || target.protocol === "tel:") {
      void Linking.openURL(request.url).catch(() => undefined);
      return false;
    }
    if (target.protocol === "http:" || target.protocol === "https:") {
      void Linking.openURL(request.url).catch(() => undefined);
    }
    return false;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={ref}
        source={{ uri }}
        style={styles.webView}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        geolocationEnabled
        domStorageEnabled
        cacheEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        injectedJavaScriptBeforeContentLoaded={injectedAuthCookie}
        injectedJavaScript={`(()=>{const style=document.createElement('style');style.textContent='.customer-mobile-header,.customer-mobile-bottom-nav{display:none!important}button[aria-label^="Open live chat"],button[aria-label="Close live chat"]{bottom:10px!important}section[aria-label="Live chat"]{bottom:74px!important}';document.head.appendChild(style)})();true;`}
        onNavigationStateChange={(state) => { setCanGoBack(state.canGoBack); onNavigationStateChange(state); }}
        onShouldStartLoadWithRequest={shouldStart}
        onLoadStart={() => { setLoading(true); setFailed(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={(event) => { if (event.nativeEvent.statusCode >= 500) { setLoading(false); setFailed(true); } }}
      />
      {failed && <View style={styles.errorOverlay}><Text style={styles.errorTitle}>We couldn’t load this page</Text><Text style={styles.errorText}>Check your connection and try again.</Text><Pressable accessibilityRole="button" onPress={() => { setFailed(false); setLoading(true); ref.current?.reload(); }} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View>}
      {loading && !failed && <View pointerEvents="none" style={styles.loading}><ActivityIndicator size="small" color={theme.colors.gold} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  webView: { flex: 1, backgroundColor: theme.colors.background },
  loading: { position: "absolute", top: 8, left: 0, right: 0, alignItems: "center", paddingTop: 12 },
  errorOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background, padding: 22 },
  errorTitle: { color: theme.colors.navy, fontSize: 16, fontWeight: "900", textAlign: "center" },
  errorText: { marginTop: 6, color: theme.colors.muted, fontSize: 11, textAlign: "center" },
  retry: { marginTop: 15, borderRadius: 11, backgroundColor: theme.colors.navy, paddingHorizontal: 19, paddingVertical: 10 },
  retryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
});
