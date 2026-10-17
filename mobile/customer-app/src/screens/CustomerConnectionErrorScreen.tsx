import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CloudOff, LogOut, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { theme } from "../theme";

export function CustomerConnectionErrorScreen({ onRetry, onSignOut }: { onRetry: () => Promise<void>; onSignOut: () => void }) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <View style={styles.icon}><CloudOff size={27} color={theme.colors.gold} /></View>
        <Text style={styles.title}>We couldn’t load your account</Text>
        <Text style={styles.message}>Check your internet connection, then try again. Your account information is safe.</Text>
        <Pressable accessibilityRole="button" disabled={retrying} onPress={() => void retry()} style={({ pressed }) => [styles.retry, pressed && styles.pressed, retrying && styles.disabled]}>
          {retrying ? <ActivityIndicator size="small" color="#FFFFFF" /> : <RefreshCw size={16} color="#FFFFFF" />}
          <Text style={styles.retryText}>{retrying ? "Trying again…" : "Try again"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOut}><LogOut size={15} color={theme.colors.muted} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background, padding: 22 },
  card: { width: "100%", maxWidth: 420, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, backgroundColor: "#FFFFFF", paddingHorizontal: 24, paddingVertical: 30, shadowColor: "#03162F", shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  icon: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: theme.colors.navy },
  title: { marginTop: 18, color: theme.colors.navy, fontSize: 18, fontWeight: "900", textAlign: "center" },
  message: { marginTop: 8, color: theme.colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  retry: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "stretch", marginTop: 20, borderRadius: 13, backgroundColor: theme.colors.navy, paddingHorizontal: 15 },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 15, padding: 8 },
  signOutText: { color: theme.colors.muted, fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.65 },
});
