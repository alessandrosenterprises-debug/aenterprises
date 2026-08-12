import {
  getConfigurationSchema,
} from "../utils/get-schema";

import {
  getConfiguration,
} from "../services/configuration.service";

import ConfigurationTable from "../components/ConfigurationTable";

interface ConfigurationPageProps {
  type: string;
}

export default async function ConfigurationPage({
  type,
}: ConfigurationPageProps) {
  const schema =
    getConfigurationSchema(type as any);

  const rows =
    await getConfiguration(type);

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
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-[#03162F]">
          {schema.title}
        </h1>

        <p className="text-slate-500">
          {schema.description}
        </p>

      </div>

      <ConfigurationTable
        title={schema.title}
        rows={rows}
        columns={columns}
      />

    </div>
  );
}