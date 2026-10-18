/** Normalize Zambian customer numbers to the E.164 format Supabase Auth expects. */
export function toE164PhoneNumber(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("260")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+260${digits.slice(1)}`;
  if (digits.length === 9) return `+260${digits}`;
  return `+${digits}`;
}
