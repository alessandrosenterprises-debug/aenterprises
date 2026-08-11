import { BusinessCatalogSchema } from "../types/catalog";

export const techSolutionsSchema: BusinessCatalogSchema = {
  business: "tech-solutions",

  title: "Tech Product",

  itemType: "product",

  fields: [
    {
      key: "name",
      label: "Product Name",
      type: "text",
      required: true,
    },

    {
      key: "category",
      label: "Category",
      type: "text",
    },

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
      key: "serialNumber",
      label: "Serial Number",
      type: "text",
    },

    {
      key: "warranty",
      label: "Warranty",
      type: "text",
    },

    {
      key: "price",
      label: "Price (ZMW)",
      type: "currency",
    },

    {
      key: "quantity",
      label: "Quantity",
      type: "number",
    },

    {
      key: "description",
      label: "Description",
      type: "textarea",
    },

    {
      key: "image",
      label: "Image",
      type: "image",
    },
  ],
};