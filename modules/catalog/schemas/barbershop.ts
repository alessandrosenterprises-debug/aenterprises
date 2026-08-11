import { BusinessCatalogSchema } from "../types/catalog";

export const barbershopSchema: BusinessCatalogSchema = {
  business: "classic-barbershop",

  title: "Barbershop Service",

  itemType: "service",

  fields: [
    {
      key: "service_duration",
      label: "Service Duration",
      type: "text",
    },
    {
      key: "hair_type",
      label: "Hair Type",
      type: "text",
    },
    {
      key: "tools_required",
      label: "Tools Required",
      type: "textarea",
    },
  ],
};