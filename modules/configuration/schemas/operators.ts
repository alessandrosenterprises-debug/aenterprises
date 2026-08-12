import { ConfigurationSchema } from "../types/configuration";

export const operatorsSchema: ConfigurationSchema = {
  key: "operators",

  title: "Operators",

  description:
    "Mobile Money and Banking Operators",

  fields: [
    {
      key: "name",
      label: "Operator Name",
      type: "text",
      required: true,
    },
    {
      key: "type",
      label: "Operator Type",
      type: "select",
      options: [
        {
          label: "Mobile Money",
          value: "mobile_money",
        },
        {
          label: "Bank",
          value: "bank",
        },
      ],
    },
    {
      key: "code",
      label: "Code",
      type: "text",
    },
    {
      key: "logo",
      label: "Logo",
      type: "image",
    },
    {
      key: "active",
      label: "Active",
      type: "checkbox",
    },
  ],
};