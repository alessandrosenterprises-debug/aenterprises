import type { Metadata } from "next";
import { getPublicWebsiteData } from "@/modules/website/services/public-website.service";

const pageDetails: Record<string, { title: string; description: string }> = {
  about: { title: "About us", description: "Learn about Alessandro Enterprises, our businesses and the services we bring together." },
  businesses: { title: "Our businesses", description: "Explore the active businesses and customer services offered by Alessandro Enterprises." },
  products: { title: "Products and services", description: "Browse current products and services from Alessandro Enterprises businesses." },
  offers: { title: "Current offers", description: "See active promotions and announcements published by Alessandro Enterprises businesses." },
  contact: { title: "Contact", description: "Contact Alessandro Enterprises for service information, support and business enquiries." },
};

export async function getPublicPageMetadata(page: keyof typeof pageDetails): Promise<Metadata> {
  const data = await getPublicWebsiteData();
  const detail = pageDetails[page];
  const title = data.website.title?.trim() || data.company.company_name;
  const description = data.website.meta_description?.trim() || detail.description;
  return {
    title: `${detail.title} | ${title}`,
    description,
    icons: data.website.favicon_url ? { icon: data.website.favicon_url } : undefined,
    openGraph: { title: `${detail.title} | ${title}`, description, type: "website" },
  };
}
