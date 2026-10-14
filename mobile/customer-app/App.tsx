import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewNavigation } from "react-native-webview";

declare const process: { env: { EXPO_PUBLIC_CUSTOMER_URL?: string } };

const CUSTOMER_URL =
  process.env.EXPO_PUBLIC_CUSTOMER_URL ??
  "https://aenterprises-dashboard.vercel.app/customer/login";
const CUSTOMER_HOST = new URL(CUSTOMER_URL).host;
const CUSTOMER_PROTOCOL = new URL(CUSTOMER_URL).protocol;

export default function App() {
  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

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
    const timeout = setTimeout(() => {
      setLoading(false);
      setFailed(true);
    }, 15_000);
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
    setFailed(false);
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
          onLoadStart={() => { if (!hasLoaded) setLoading(true); setFailed(false); }}
          onLoadProgress={({ nativeEvent }) => {
            // Show the customer page as soon as the main document is underway,
            // rather than keeping the launch screen up while every asset settles.
            if (!hasLoaded && nativeEvent.progress >= 0.55) {
              setHasLoaded(true);
              setLoading(false);
              setFailed(false);
            }
          }}
          onLoadEnd={() => { setHasLoaded(true); setLoading(false); }}
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={(event) => {
            if (event.nativeEvent.url === CUSTOMER_URL && event.nativeEvent.statusCode >= 500) setFailed(true);
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
        {loading && !hasLoaded && !failed && (
          <View pointerEvents="none" style={styles.loading}>
            <View style={styles.loadingBrand}>
              <Image source={require("./assets/splash-logo.png")} style={styles.loadingLogo} resizeMode="contain" />
            </View>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loadingText}>Loading customer sign-in</Text>
          </View>
        )}
        {failed && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>The customer hub is taking too long to respond</Text>
            <Text style={styles.errorMessage}>Check your connection and try loading the sign-in page again.</Text>
            <Pressable style={styles.retryButton} onPress={() => { setFailed(false); setLoading(true); webView.current?.reload(); }}>
              <Text style={styles.retryText}>Try again</Text>
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
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 14, padding: 28, backgroundColor: "#03162F" },
  loadingBrand: { width: 148, height: 148, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 24, backgroundColor: "#FFFFFF", elevation: 5 },
  loadingLogo: { width: 140, height: 140 },
  loadingText: { color: "#E2E8F0", fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  errorOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#F4F6FA" },
  errorTitle: { color: "#03162F", fontSize: 20, fontWeight: "800", textAlign: "center" },
  errorMessage: { marginTop: 8, color: "#64748B", fontSize: 14, lineHeight: 21, textAlign: "center" },
  retryButton: { marginTop: 20, minWidth: 140, alignItems: "center", borderRadius: 12, backgroundColor: "#03162F", paddingHorizontal: 22, paddingVertical: 13 },
  retryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }
});
