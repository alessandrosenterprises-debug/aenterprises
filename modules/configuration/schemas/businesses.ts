import { ConfigurationSchema } from "../types/configuration";

export const businessesSchema: ConfigurationSchema = {
  table: "businesses",

  title: "Businesses",

  description:
    "Manage the businesses operating under Alessandro Enterprises.",

  fields: [
    {
      key: "name",
      label: "Business Name",
      type: "text",
      required: true,
      placeholder: "Business name",
    },

    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Business description",
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