import type { Metadata } from "next";
import PublicWebsiteHome from "@/modules/website/components/PublicWebsiteHome";
import { getPublicWebsiteData } from "@/modules/website/services/public-website.service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicWebsiteData();
  return {
    title: data.website.title || data.company.company_name,
    description: data.website.meta_description || data.company.description || data.company.tagline || "Discover businesses, products and services from Alessandro Enterprises.",
    icons: data.website.favicon_url ? { icon: data.website.favicon_url } : undefined,
  };
}

export default async function HomePage() {
  const data = await getPublicWebsiteData();
  return <PublicWebsiteHome data={data} />;
}
