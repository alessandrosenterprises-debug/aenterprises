import {
  configurationSchemas,
  ConfigurationType,
} from "../schemas";

export function getConfigurationSchema(
  type: ConfigurationType
) {
  return configurationSchemas[type];
}