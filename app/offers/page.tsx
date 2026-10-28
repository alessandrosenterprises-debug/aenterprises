import PublicWebsiteRoute from "@/modules/website/components/PublicWebsiteRoute";
import { getPublicPageMetadata } from "@/modules/website/services/metadata.service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> { return getPublicPageMetadata("offers"); }

export default function OffersPage() {
  return <PublicWebsiteRoute />;
}
