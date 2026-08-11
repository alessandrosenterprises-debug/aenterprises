import { BusinessCatalogSchema } from "../types/catalog";

export const fashionSchema: BusinessCatalogSchema = {
  business: "fashion",

  title: "Fashion Product",

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
      required: true,
    },

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