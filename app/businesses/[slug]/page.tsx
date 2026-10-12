import { redirect } from "next/navigation";

interface BusinessAliasPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessAliasPage({ params }: BusinessAliasPageProps) {
  const { slug } = await params;
  redirect(`/customer/businesses/${encodeURIComponent(slug)}`);
}
