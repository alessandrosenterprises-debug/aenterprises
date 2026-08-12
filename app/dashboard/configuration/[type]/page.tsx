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

export default async function Page({
  params,
}: PageProps) {
  const { type } = await params;

  if (
    !(type in configurationSchemas)
  ) {
    notFound();
  }

  return (
    <ConfigurationPage
      type={type as ConfigurationType}
    />
  );
}