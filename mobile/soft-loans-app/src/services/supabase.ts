import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const apiUrl = process.env.EXPO_PUBLIC_AEOS_API_URL?.replace(/\/$/, "");
export const configured = Boolean(url && key && apiUrl);

const storage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const supabase = createClient(url ?? "https://invalid.supabase.co", key ?? "missing-key", {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: "pkce" },
});

export async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) throw new Error("The AEOS service address has not been configured for this app.");
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${accessToken}`, ...(init?.headers ?? {}) },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
      return body as T;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (!/fetch|network|timed? ?out|connection|load failed/i.test(message) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 700 : 1600));
    }
  }
  const message = lastError instanceof Error ? lastError.message : "";
  if (/fetch|network|timed? ?out|connection|load failed/i.test(message)) {
    throw new Error("Connection is weak right now. Your entries are still here; reconnect and try again.");
  }
  throw lastError instanceof Error ? lastError : new Error("The request could not be completed.");
}
