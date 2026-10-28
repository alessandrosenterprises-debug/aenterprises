import { NextResponse } from "next/server";
import { processFacebookPublishQueue } from "@/modules/website/services/facebook-publisher.server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processFacebookPublishQueue({ limit: 20 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Facebook publisher cron failed", error instanceof Error ? error.message : "Unknown publisher error");
    return NextResponse.json({ error: "Facebook publishing worker failed." }, { status: 500 });
  }
}
