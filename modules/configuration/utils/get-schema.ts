import {
  configurationSchemas,
  type ConfigurationType,
} from "../schemas";

export function getConfigurationSchema(
  type: string
) {
  const configurationType =
    type as ConfigurationType;

  const schema =
    configurationSchemas[configurationType];

  if (!schema) {
    throw new Error(
      `Unknown configuration type: ${type}`
    );
  }

  return schema;
}