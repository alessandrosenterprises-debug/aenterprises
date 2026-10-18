import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";

const PROJECT_ID = "32337b20-cc1f-488e-a55a-2f9562c57784";
export const CUSTOMER_NOTIFICATION_CHANNEL = "customer-updates-v2";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function configureCustomerNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CUSTOMER_NOTIFICATION_CHANNEL, {
    name: "Customer updates",
    description: "Bookings, orders, delivery, and account updates",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 150, 250],
    enableVibrate: true,
    enableLights: true,
    lightColor: "#D4AF37",
    showBadge: true,
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Register or refresh this device token. Bounded retries handle brief network loss. */
export async function registerCustomerPushToken(session: Session, requestPermission = false) {
  try {
    await configureCustomerNotificationChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && requestPermission && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
    }
    if (!permission.granted) return false;

    for (const delay of [0, 1500, 5000]) {
      if (delay) await wait(delay);
      try {
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
        const { error } = await supabase.from("customer_push_tokens").upsert({
          auth_user_id: session.user.id,
          expo_push_token: expoPushToken,
          platform: Platform.OS,
          is_enabled: true,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: "auth_user_id,expo_push_token" });
        if (!error) return true;
      } catch {
        // Keep the customer signed in; the next retry or app resume can register again.
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function disableCustomerPushTokens(authUserId: string) {
  if (!authUserId) return;
  await supabase.from("customer_push_tokens").update({ is_enabled: false }).eq("auth_user_id", authUserId);
}

