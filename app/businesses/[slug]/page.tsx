import PublicBusinessProfile from "@/modules/website/components/PublicBusinessProfile";
import { getPublicWebsiteData } from "@/modules/website/services/public-website.service";
import type { Metadata } from "next";

interface BusinessAliasPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BusinessAliasPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicWebsiteData();
  const business = data.businesses.find((item) => item.slug === decodeURIComponent(slug));
  if (!business) return { title: `Business | ${data.website.title || data.company.company_name}` };
  return {
    title: `${business.name} | ${data.website.title || data.company.company_name}`,
    description: business.description || `Explore services and products from ${business.name}. Continue through the AEOS customer portal to make a request.`,
    icons: data.website.favicon_url ? { icon: data.website.favicon_url } : undefined,
    openGraph: { title: business.name, description: business.description || `Discover ${business.name} from Alessandro Enterprises.`, images: business.logo_url ? [business.logo_url] : undefined },
  };
}

export default async function BusinessAliasPage({ params }: BusinessAliasPageProps) {
  const { slug } = await params;
  const data = await getPublicWebsiteData();
  return <PublicBusinessProfile data={data} slug={decodeURIComponent(slug)} />;
}
