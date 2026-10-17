import { BriefcaseBusiness, CalendarDays, House, ShoppingBag, Wrench } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

const tabs = [
  { label: "Home", path: null, Icon: House },
  { label: "Businesses", path: "/customer/businesses", Icon: BriefcaseBusiness },
  { label: "Services", path: "/customer/services", Icon: Wrench },
  { label: "Bookings", path: "/customer/bookings", Icon: CalendarDays },
  { label: "Orders", path: "/customer/orders", Icon: ShoppingBag },
] as const;

export function NativeCustomerTabs({
  currentPath,
  onNavigate,
}: {
  currentPath: string | null;
  onNavigate: (path: string | null) => void;
}) {
  const activePath = currentPath === null ? null : tabs.find((tab) => tab.path && currentPath.startsWith(tab.path))?.path ?? currentPath;

  return (
    <View style={styles.container}>
      {tabs.map(({ label, path, Icon }) => {
        const active = path === activePath;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            key={label}
            onPress={() => onNavigate(path)}
            style={styles.tab}
          >
            <View style={[styles.iconBox, active && styles.activeIconBox]}>
              <Icon size={19} color={active ? theme.colors.gold : "#B8C4D3"} strokeWidth={active ? 2.5 : 2} />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
            {active && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 68, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.navy, paddingHorizontal: 3, paddingTop: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.16)" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minWidth: 0, paddingVertical: 3 },
  iconBox: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "rgba(255,255,255,0.05)" },
  activeIconBox: { backgroundColor: "rgba(212,175,55,0.12)" },
  label: { marginTop: 2, color: "#B8C4D3", fontSize: 9, fontWeight: "600" },
  activeLabel: { color: theme.colors.goldLight, fontWeight: "800" },
  indicator: { position: "absolute", bottom: -2, width: 17, height: 2, borderRadius: 2, backgroundColor: theme.colors.gold },
});
