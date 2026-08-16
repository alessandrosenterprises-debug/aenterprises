import { ConfigurationSchema } from "../types/configuration";

export const rolesSchema: ConfigurationSchema = {
  table: "roles",

  title: "Roles",

  description:
    "Manage system roles and access levels.",

  fields: [
    {
      key: "name",
      label: "Role Name",
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
