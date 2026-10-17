import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Bell, Camera, Check, ChevronRight, Contact, Image as ImageIcon, LocateFixed, ShieldCheck } from "lucide-react-native";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import type { PermissionResponse } from "expo";
import { theme } from "../theme";

type PermissionKey = "location" | "contacts" | "notifications" | "camera" | "photos";
type PermissionState = PermissionResponse | null;
type PermissionItem = { key: PermissionKey; title: string; detail: string; Icon: typeof LocateFixed };

const permissionItems: PermissionItem[] = [
  { key: "location", title: "Location", detail: "Use your current position for pickup and delivery addresses.", Icon: LocateFixed },
  { key: "contacts", title: "Contacts", detail: "Choose a recipient from your address book when that option is available.", Icon: Contact },
  { key: "notifications", title: "Notifications", detail: "Allow delivery, booking, and account alerts on this device.", Icon: Bell },
  { key: "camera", title: "Camera", detail: "Take a photo for your profile or to attach to a request.", Icon: Camera },
  { key: "photos", title: "Photos and files", detail: "Select profile photos and supporting documents from your device.", Icon: ImageIcon },
];

const permissionReaders: Record<PermissionKey, () => Promise<PermissionState>> = {
  location: () => Location.getForegroundPermissionsAsync(),
  contacts: () => Contacts.getPermissionsAsync(),
  notifications: () => Notifications.getPermissionsAsync(),
  camera: () => ImagePicker.getCameraPermissionsAsync(),
  photos: () => ImagePicker.getMediaLibraryPermissionsAsync(),
};

const permissionRequests: Record<PermissionKey, () => Promise<PermissionState>> = {
  location: () => Location.requestForegroundPermissionsAsync(),
  contacts: () => Contacts.requestPermissionsAsync(),
  notifications: () => Notifications.requestPermissionsAsync(),
  camera: () => ImagePicker.requestCameraPermissionsAsync(),
  photos: () => ImagePicker.requestMediaLibraryPermissionsAsync(),
};

export function NativePermissionsScreen({ onBack }: { onBack: () => void }) {
  const [states, setStates] = useState<Partial<Record<PermissionKey, PermissionState>>>({});
  const [busy, setBusy] = useState<PermissionKey | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(permissionItems.map(async ({ key }) => [key, await permissionReaders[key]()] as const));
      setStates(Object.fromEntries(entries) as Partial<Record<PermissionKey, PermissionState>>);
    } catch {
      Alert.alert("Permissions unavailable", "Device permission settings could not be read. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const request = async (key: PermissionKey) => {
    const current = states[key];
    if (current?.granted) return;
    if (current && !current.canAskAgain) {
      Alert.alert("Permission is off", "Enable this permission in your device settings to use the related feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open settings", onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    setBusy(key);
    try {
      const result = await permissionRequests[key]();
      setStates((previous) => ({ ...previous, [key]: result }));
      if (key === "notifications" && result?.granted && Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("customer-updates", {
          name: "Customer updates",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
    } catch {
      Alert.alert("Couldn’t update permission", "Please try again from this screen or your device settings.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}><ArrowLeft size={19} color={theme.colors.navy} /></Pressable>
        <View style={styles.heading}><Text style={styles.title}>Device permissions</Text><Text style={styles.subtitle}>Choose what AEOS can access on this device.</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}><ShieldCheck size={20} color={theme.colors.gold} /></View>
          <View style={styles.privacyText}><Text style={styles.privacyTitle}>Your choice, when needed</Text><Text style={styles.privacyDetail}>AEOS asks only when you allow access here or use a feature that needs it. You can change access in device settings any time.</Text></View>
        </View>
        {permissionItems.map(({ key, title, detail, Icon }) => {
          const state = states[key];
          const granted = Boolean(state?.granted);
          const blocked = Boolean(state && !state.granted && !state.canAskAgain);
          const isBusy = busy === key;
          return (
            <View key={key} style={styles.permissionCard}>
              <View style={styles.itemIcon}><Icon size={19} color={theme.colors.navy} /></View>
              <View style={styles.itemText}><Text style={styles.itemTitle}>{title}</Text><Text style={styles.itemDetail}>{detail}</Text><Text style={[styles.status, granted ? styles.allowed : blocked ? styles.blocked : styles.notAllowed]}>{granted ? "Allowed" : blocked ? "Blocked in device settings" : "Not allowed"}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel={granted ? `${title} permission allowed` : `${blocked ? "Open settings for" : "Allow"} ${title}`} disabled={loading || isBusy || granted} onPress={() => void request(key)} style={({ pressed }) => [styles.action, granted && styles.actionAllowed, pressed && !granted && styles.actionPressed]}>
                {isBusy ? <ActivityIndicator size="small" color={theme.colors.navy} /> : granted ? <Check size={16} color="#047857" /> : blocked ? <ChevronRight size={16} color={theme.colors.navy} /> : <Text style={styles.actionText}>Allow</Text>}
              </Pressable>
            </View>
          );
        })}
        {loading && <ActivityIndicator style={styles.loader} color={theme.colors.gold} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, backgroundColor: "#FFFFFF", paddingHorizontal: 15 },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#F1F5F9" },
  heading: { flex: 1 },
  title: { color: theme.colors.navy, fontSize: 15, fontWeight: "900" },
  subtitle: { marginTop: 3, color: theme.colors.muted, fontSize: 10 },
  content: { gap: 10, padding: 14, paddingBottom: 28 },
  privacyCard: { flexDirection: "row", gap: 11, borderWidth: 1, borderColor: "#E8D999", borderRadius: 15, backgroundColor: "#FFFCF1", padding: 13 },
  privacyIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: theme.colors.navy },
  privacyText: { flex: 1 },
  privacyTitle: { color: theme.colors.navy, fontSize: 11, fontWeight: "900" },
  privacyDetail: { marginTop: 4, color: theme.colors.muted, fontSize: 10, lineHeight: 15 },
  permissionCard: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, backgroundColor: "#FFFFFF", padding: 12 },
  itemIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#F1F5F9" },
  itemText: { flex: 1 },
  itemTitle: { color: theme.colors.navy, fontSize: 11, fontWeight: "900" },
  itemDetail: { marginTop: 3, color: theme.colors.muted, fontSize: 9, lineHeight: 13 },
  status: { marginTop: 5, fontSize: 9, fontWeight: "800" },
  allowed: { color: "#047857" },
  blocked: { color: "#BE123C" },
  notAllowed: { color: "#64748B" },
  action: { minWidth: 54, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#F1F5F9", paddingHorizontal: 10 },
  actionAllowed: { backgroundColor: "#ECFDF5" },
  actionPressed: { opacity: 0.7 },
  actionText: { color: theme.colors.navy, fontSize: 10, fontWeight: "900" },
  loader: { marginTop: 4 },
});
