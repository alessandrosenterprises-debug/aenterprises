import { redirect } from "next/navigation";

interface LoansPageProps {
  searchParams?: Promise<{ month?: string }>;
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const month = (await searchParams)?.month;
  const query = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ? `?month=${encodeURIComponent(month)}`
    : "";
  redirect(`/dashboard/enterprise/soft-loans${query}#loan-applications`);
}
