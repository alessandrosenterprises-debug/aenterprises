import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewNavigation } from "react-native-webview";

// The app previews the published customer interface. A LAN development URL
// cannot be reached when Expo Go is running over cellular data.
const CUSTOMER_URL = "https://aenterprises-dashboard.vercel.app/customer/login";
const CUSTOMER_HOST = new URL(CUSTOMER_URL).host;
const CUSTOMER_PROTOCOL = new URL(CUSTOMER_URL).protocol;

export default function App() {
  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [progress, setProgress] = useState(0.04);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webView.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  useEffect(() => {
    if (!loading || hasLoaded) return;
    const timeout = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(timeout);
  }, [loading, hasLoaded]);

  function handleNavigationRequest(request: { url: string }) {
    let target: URL;
    try {
      target = new URL(request.url);
    } catch {
      return false;
    }
    if (target.host === CUSTOMER_HOST && target.protocol === CUSTOMER_PROTOCOL) return true;
    if (target.protocol === "mailto:" || target.protocol === "tel:") {
      void Linking.openURL(request.url);
      return false;
    }
    if (target.protocol === "https:" || target.protocol === "http:") {
      void Linking.openURL(request.url);
    }
    return false;
  }

  function handleNavigationChange(state: WebViewNavigation) {
    setCanGoBack(state.canGoBack);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <WebView
          ref={webView}
          source={{ uri: CUSTOMER_URL }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={handleNavigationRequest}
          onLoadStart={() => {
            setLoading(true);
            setProgress(0.04);
            setTimedOut(false);
            setFailed(false);
          }}
          onLoadProgress={({ nativeEvent }) => {
            setProgress(Math.max(0.04, nativeEvent.progress));
            // Reveal the original customer site as soon as its document is
            // underway; don't wait on every image and third-party resource.
          }}
          onLoadEnd={() => { setHasLoaded(true); setLoading(false); setProgress(1); setFailed(false); setTimedOut(false); }}
          onError={() => { setLoading(false); setFailed(true); setTimedOut(false); }}
          onHttpError={(event) => {
            if (new URL(event.nativeEvent.url).host === CUSTOMER_HOST && event.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setFailed(true);
              setTimedOut(false);
            }
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowFileAccess
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          startInLoadingState={false}
          cacheEnabled
          overScrollMode="never"
          bounces={false}
          pullToRefreshEnabled={false}
        />
        {loading && <View pointerEvents="none" style={styles.progressTrack}><View style={[styles.progressBar, { width: `${Math.max(5, Math.round(progress * 100))}%` }]} /></View>}
        {failed && (
          <View style={styles.messageOverlay}>
            <View style={styles.messageCard}>
              <Text style={styles.errorTitle}>We couldn’t connect</Text>
              <Text style={styles.errorMessage}>Check your connection and try again.</Text>
              <Pressable style={styles.retryButton} onPress={() => { setFailed(false); setTimedOut(false); setLoading(true); setProgress(0.04); setHasLoaded(false); webView.current?.reload(); }}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          </View>
        )}
        {timedOut && loading && !failed && (
          <View style={styles.slowLoadNotice}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.slowLoadText}>The customer page is taking longer than usual.</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.slowRetryButton}
              onPress={() => {
                setTimedOut(false);
                setLoading(true);
                setProgress(0.04);
                webView.current?.reload();
              }}
            >
              <Text style={styles.slowRetryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#03162F" },
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  webView: { flex: 1, backgroundColor: "#F4F6FA" },
  progressTrack: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#E6EAF0" },
  progressBar: { height: 3, backgroundColor: "#D4AF37" },
  messageOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(244,246,250,0.94)" },
  messageCard: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "white", alignItems: "center", paddingHorizontal: 24, paddingVertical: 25, elevation: 3 },
  slowLoadNotice: { position: "absolute", top: 12, left: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 12, elevation: 5 },
  slowLoadText: { flex: 1, color: "#475569", fontSize: 12, lineHeight: 17 },
  slowRetryButton: { borderRadius: 9, backgroundColor: "#03162F", paddingHorizontal: 12, paddingVertical: 8 },
  slowRetryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  errorTitle: { color: "#03162F", fontSize: 20, fontWeight: "800", textAlign: "center" },
  errorMessage: { marginTop: 8, color: "#64748B", fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: { marginTop: 20, minWidth: 140, alignItems: "center", borderRadius: 12, backgroundColor: "#03162F", paddingHorizontal: 22, paddingVertical: 13 },
  retryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }
});
