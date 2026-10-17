import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, CalendarDays, ChevronDown, Clock3, FileText, Headphones, Mail, MessageCircle, Settings, ShieldCheck, UserRound, X } from "lucide-react-native";
import { theme } from "../theme";

const menuItems = [
  { label: "My Profile", path: "/customer/profile", Icon: UserRound },
  { label: "Account Settings", path: "/customer/profile?section=settings", Icon: Settings },
  { label: "Notifications", path: "/customer/notifications", Icon: Bell },
  { label: "Messages", path: "/customer/messages", Icon: MessageCircle },
  { label: "My Bookings", path: "/customer/bookings", Icon: CalendarDays },
  { label: "Activity History", path: "/customer/activity", Icon: Clock3 },
  { label: "Requests", path: "/customer/requests", Icon: FileText },
  { label: "Emails", path: "/customer/emails", Icon: Mail },
  { label: "Preferences", path: "/customer/preferences", Icon: Settings },
  { label: "Device permissions", path: "native:permissions", Icon: ShieldCheck },
  { label: "Support", path: "/customer/support", Icon: Headphones },
];

export function NativeCustomerHeader({ customerName, avatarUrl, unreadNotifications, onNavigate, onOpenPermissions, onSignOut }: {
  customerName: string;
  avatarUrl: string;
  unreadNotifications: number;
  onNavigate: (path: string) => void;
  onOpenPermissions: () => void;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = customerName.trim().split(/\s+/)[0] || "Account";
  return <>
    <View style={styles.header}>
      <Pressable accessibilityLabel="AEOS home" onPress={() => onNavigate("/customer")} style={styles.brand}>
        <Image source={require("../../assets/app-icon.png")} style={styles.logo} resizeMode="contain" />
        <View><Text style={styles.brandName}>ALESSANDRO</Text><Text style={styles.brandSub}>Enterprises</Text></View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityLabel={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : "Notifications"} onPress={() => onNavigate("/customer/notifications")} style={styles.bell}>
          <Bell size={19} color="#FFFFFF" />
          {unreadNotifications > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</Text></View>}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open account menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={styles.profile}>
          <View style={styles.avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" /> : <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>}</View>
          <Text numberOfLines={1} style={styles.name}>{firstName}</Text><ChevronDown size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close account menu" onPress={() => setMenuOpen(false)} style={styles.scrim} />
        <View style={styles.menu}>
          <View style={styles.menuHeader}>
            <View style={styles.menuAvatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.menuAvatarImage} resizeMode="cover" /> : <Text style={styles.menuAvatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>}</View>
            <View style={styles.menuIntro}><Text style={styles.menuWelcome}>Hello, {firstName}</Text><Text style={styles.menuCompany}>Alessandro Enterprises</Text></View>
            <Pressable accessibilityLabel="Close account menu" onPress={() => setMenuOpen(false)} style={styles.closeButton}><X size={18} color={theme.colors.muted} /></Pressable>
          </View>
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            {menuItems.map(({ label, path, Icon }, index) => <View key={path}>
              {index === 9 && <View style={styles.separator} />}
              <Pressable onPress={() => { setMenuOpen(false); path === "native:permissions" ? onOpenPermissions() : onNavigate(path); }} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                <View style={styles.menuIcon}><Icon size={16} color={theme.colors.navy} /></View><Text style={styles.menuLabel}>{label}</Text>
              </Pressable>
            </View>)}
            <Pressable onPress={() => { setMenuOpen(false); onSignOut(); }} style={({ pressed }) => [styles.menuItem, styles.signOut, pressed && styles.pressed]}>
              <View style={[styles.menuIcon, styles.signOutIcon]}><X size={16} color="#E11D48" /></View><Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.colors.navy, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.14)" },
  brand: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }, logo: { width: 41, height: 41, borderRadius: 11, backgroundColor: "#FFFFFF" }, brandName: { color: theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, brandSub: { marginTop: 1, color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 9 }, bell: { position: "relative", width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)" }, badge: { position: "absolute", top: -2, right: -3, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: theme.colors.navy, borderRadius: 8, backgroundColor: "#E11D48", paddingHorizontal: 2 }, badgeText: { color: "#FFFFFF", fontSize: 7, fontWeight: "900" }, profile: { maxWidth: 115, flexDirection: "row", alignItems: "center", gap: 5 }, avatar: { width: 34, height: 34, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1.5, borderColor: theme.colors.gold, borderRadius: 18, backgroundColor: theme.colors.navySoft }, avatarImage: { width: 31, height: 31, borderRadius: 16 }, avatarText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, name: { maxWidth: 52, color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  modalRoot: { flex: 1 }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(1,10,24,0.16)" }, menu: { position: "absolute", top: 8, right: 8, width: 310, maxWidth: "88%", maxHeight: "85%", overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 21, backgroundColor: "#FFFFFF", elevation: 18, shadowColor: "#000000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }, menuHeader: { minHeight: 75, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#EEF2F6", paddingHorizontal: 13 }, menuAvatar: { width: 40, height: 40, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 22, backgroundColor: theme.colors.navy }, menuAvatarImage: { width: 38, height: 38, borderRadius: 20 }, menuAvatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, menuIntro: { flex: 1 }, menuWelcome: { color: theme.colors.navy, fontSize: 12, fontWeight: "900" }, menuCompany: { marginTop: 3, color: theme.colors.muted, fontSize: 9 }, closeButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#F1F5F9" }, menuScroll: { maxHeight: 510, paddingHorizontal: 8, paddingVertical: 7 }, menuItem: { minHeight: 43, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 11, paddingHorizontal: 7 }, menuIcon: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#F1F5F9" }, menuLabel: { color: "#334155", fontSize: 10, fontWeight: "700" }, separator: { height: 1, marginVertical: 6, backgroundColor: "#EEF2F6" }, signOut: { marginTop: 4, marginBottom: 6 }, signOutIcon: { backgroundColor: "#FFF1F2" }, signOutText: { color: "#E11D48", fontSize: 10, fontWeight: "800" }, pressed: { backgroundColor: "#F8FAFC" },
});
