import { ConfigurationSchema } from "../types/configuration";

export const companySettingsSchema: ConfigurationSchema = {
  table: "company_settings",

  title: "Company Settings",

  description:
    "Manage the main Alessandro Enterprises company information and settings.",

  fields: [
    {
      key: "company_name",
      label: "Company Name",
      type: "text",
      required: true,
    },
    {
      key: "tagline",
      label: "Tagline",
      type: "text",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
    {
      key: "logo_url",
      label: "Logo URL",
      type: "text",
    },
    {
      key: "phone",
      label: "Phone",
      type: "text",
    },
    {
      key: "email",
      label: "Email",
      type: "text",
    },
    {
      key: "address",
      label: "Address",
      type: "text",
    },
    {
      key: "city",
      label: "City",
      type: "text",
    },
    {
      key: "country",
      label: "Country",
      type: "text",
    },
    {
      key: "website",
      label: "Website",
      type: "text",
    },
    {
      key: "currency",
      label: "Currency",
      type: "text",
    },
    {
      key: "timezone",
      label: "Timezone",
      type: "text",
    },
    {
      key: "active",
      label: "Active",
      type: "checkbox",
    },
  ],
};