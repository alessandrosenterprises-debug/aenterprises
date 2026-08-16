import { ConfigurationSchema } from "../types/configuration";

export const categoriesSchema: ConfigurationSchema = {
  table: "categories",

  title: "Categories",

  description:
    "Manage categories used across products and services.",

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
