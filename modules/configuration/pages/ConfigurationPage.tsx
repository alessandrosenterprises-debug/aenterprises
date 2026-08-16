import {
  getConfiguration,
} from "../services/configuration.server.service";

import {
  getConfigurationSchema,
} from "../utils/get-schema";

import ConfigurationManager from "../components/ConfigurationManager";

import { getBusinesses } from "@/modules/businesses/services/business.service";

interface ConfigurationPageProps {
  type: string;
}

export default async function ConfigurationPage({
  type,
}: ConfigurationPageProps) {
  const schema =
    getConfigurationSchema(type as any);

  if (!schema) {
    throw new Error(
      `Configuration schema not found for "${type}".`
    );
  }

  const rows =
    await getConfiguration(schema.table);

  const businesses =
    schema.table === "branches"
      ? await getBusinesses()
      : [];

  const columns = schema.fields
    .filter(
      (field) =>
        field.type !== "image"
    )
    .map((field) => ({
      key: field.key,
      label: field.label,
    }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#03162F]">
          {schema.title}
        </h1>

        <p className="text-slate-500">
          {schema.description}
        </p>
      </div>

      <ConfigurationManager
        schema={schema}
        initialRows={rows}
        columns={columns}
        businesses={businesses}
      />
    </div>
  );
}