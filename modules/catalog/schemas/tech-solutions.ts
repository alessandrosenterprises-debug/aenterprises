import { BusinessCatalogSchema } from "../types/catalog";

export const techSchema: BusinessCatalogSchema = {
  business: "tech-solutions",

  title: "Tech Product",

  itemType: "product",

  fields: [
    {
      key: "brand",
      label: "Brand",
      type: "text",
    },
    {
      key: "model",
      label: "Model",
      type: "text",
    },
    {
      key: "serial_number",
      label: "Serial Number",
      type: "text",
    },
    {
      key: "warranty",
      label: "Warranty",
      type: "text",
    },
  ],
};