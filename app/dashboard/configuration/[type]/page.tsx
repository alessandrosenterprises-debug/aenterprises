import { notFound } from "next/navigation";

import ConfigurationPage from "@/modules/configuration/pages/ConfigurationPage";

import {
  configurationSchemas,
  ConfigurationType,
} from "@/modules/configuration/schemas";

interface PageProps {
  params: Promise<{
    type: string;
  }>;
}

const routeToConfigurationType: Record<
  string,
  ConfigurationType
> = {
  businesses: "businesses",
  branches: "branches",
  operators: "operators",

  "mobile-money-services":
    "mobileMoneyServices",

  "loan-products":
    "loanProducts",

  "loan-terms":
    "loanTerms",

  categories: "categories",
  roles: "roles",
  permissions: "permissions",

  "company-settings":
    "companySettings",

  // Backward-compatible aliases
  mobileMoneyServices:
    "mobileMoneyServices",

  loanProducts:
    "loanProducts",

  loanTerms:
    "loanTerms",

  companySettings:
    "companySettings",

  departments:
    "departments",
};

export default async function Page({
  params,
}: PageProps) {
  const { type } = await params;

  const configurationType =
    routeToConfigurationType[type];

  if (
    !configurationType ||
    !configurationSchemas[configurationType]
  ) {
    notFound();
  }

  return (
    <ConfigurationPage
      type={configurationType}
    />
  );
}