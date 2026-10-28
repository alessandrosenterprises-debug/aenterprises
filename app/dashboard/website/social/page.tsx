import { requireBusinessContentAdmin } from "@/modules/enterprise/services/business-content-admin.service";
import FacebookPublishingDashboard from "@/modules/website/components/FacebookPublishingDashboard";

export const dynamic = "force-dynamic";

export default async function FacebookPublishingPage() {
  const supabase = await requireBusinessContentAdmin();
  const { data, error } = await supabase.from("facebook_publish_queue")
    .select("id,business_id,content_type,content_id,title,message,media_url,link_url,scheduled_at,status,attempt_count,next_attempt_at,facebook_post_id,published_at,last_error,created_at,businesses(name)")
    .order("created_at", { ascending: false }).limit(100);
  const migrationError = error ? "Apply database migration 054_facebook_publishing_queue.sql, then refresh this page." : null;
  return <FacebookPublishingDashboard
    items={(data ?? []) as never[]}
    migrationError={migrationError}
    pageId={process.env.FACEBOOK_PAGE_ID ? `${process.env.FACEBOOK_PAGE_ID.slice(0, 4)}••••${process.env.FACEBOOK_PAGE_ID.slice(-4)}` : "Not configured"}
    hasPageToken={Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)}
    hasCronSecret={Boolean(process.env.CRON_SECRET)}
  />;
}
