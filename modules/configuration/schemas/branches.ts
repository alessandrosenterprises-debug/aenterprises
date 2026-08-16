import { ConfigurationSchema } from "../types/configuration";

export const branchesSchema: ConfigurationSchema = {
  table: "branches",

  title: "Branches",

  description:
    "Manage business branches and locations.",

  fields: [
    {
      key: "business_id",
      label: "Business",
      type: "select",
      required: true,
      options: [],
    },
    {
      key: "name",
      label: "Branch Name",
      type: "text",
      required: true,
    },
    {
      key: "code",
      label: "Branch Code",
      type: "text",
    },
    {
      key: "city",
      label: "City",
      type: "text",
    },
    {
      key: "address",
      label: "Address",
      type: "textarea",
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
      key: "manager_name",
      label: "Manager",
      type: "text",
    },
    {
      key: "active",
      label: "Active",
      type: "checkbox",
    },
  ],
};
