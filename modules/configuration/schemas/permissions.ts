import { ConfigurationSchema } from "../types/configuration";

export const permissionsSchema: ConfigurationSchema = {
  table: "permissions",

  title: "Permissions",

  description:
    "Manage permissions available to system roles.",

  fields: [
    {
      key: "module",
      label: "Module",
      type: "text",
      required: true,
    },
    {
      key: "action",
      label: "Action",
      type: "text",
      required: true,
    },
    {
      key: "name",
      label: "Permission",
      type: "text",
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
  ],
};
