import PublicWebsiteHome from "@/modules/website/components/PublicWebsiteHome";
import { getPublicWebsiteData } from "@/modules/website/services/public-website.service";

export default async function PublicWebsiteRoute() {
  const data = await getPublicWebsiteData();
  return <PublicWebsiteHome data={data} />;
}
