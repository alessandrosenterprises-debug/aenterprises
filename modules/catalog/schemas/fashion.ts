import { BusinessCatalogSchema } from "../types/catalog";

export const fashionSchema: BusinessCatalogSchema = {
  business: "fashion",

  title: "Fashion Product",

  itemType: "product",

  fields: [
    {
      key: "brand",
      label: "Brand",
      type: "text",
    },
    {
      key: "size",
      label: "Size",
      type: "text",
    },
    {
      key: "color",
      label: "Color",
      type: "text",
    },
    {
      key: "material",
      label: "Material",
      type: "text",
    },
  ],
};