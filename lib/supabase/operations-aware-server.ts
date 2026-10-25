import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Attach the staff-session token only while its manager-opened session is valid. */
export async function createOperationsAwareServerClient() {
  const token = (await cookies()).get("aeos_ops_token")?.value;
  if (!token) return createClient({ includeOperationsSession: false });
  const sessionClient = await createClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await sessionClient.rpc("get_operations_context", { p_token_hash: tokenHash });
  return createClient({ includeOperationsSession: !error && Boolean(data?.length) });
}
