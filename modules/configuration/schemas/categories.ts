import { ConfigurationSchema } from "../types/configuration";

export const categoriesSchema: ConfigurationSchema = {
  table: "categories",

  title: "Categories",

  description:
    "Keep catalog categories consistent. Active categories are suggested when staff add or edit products and services.",

  fields: [
    {
      key: "name",
      label: "Category",
      type: "text",
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        {
          label: "Active",
          value: "Active",
        },
        {
          label: "Inactive",
          value: "Inactive",
        },
      ],
    },
  ],
};
