import { notFound } from "next/navigation";

import BusinessWorkspace from "@/modules/enterprise/components/BusinessWorkspace";
import { getEnterpriseBusinessWorkspace } from "@/modules/enterprise/services/business-workspace.service";

interface EnterpriseBusinessPageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams?: Promise<{ month?: string }>;
}

const supportedBusinessSlugs = new Set([
  "elite-fashion",
  "classic-barbershop",
  "mobile-money",
  "soft-loans",
]);

export default async function EnterpriseBusinessPage({ params, searchParams }: EnterpriseBusinessPageProps) {
  const { businessSlug } = await params;
  if (!supportedBusinessSlugs.has(businessSlug)) notFound();

  const data = await getEnterpriseBusinessWorkspace(businessSlug);
  if (!data) notFound();

  const month = (await searchParams)?.month;
  return <BusinessWorkspace data={data} month={month} />;
}
