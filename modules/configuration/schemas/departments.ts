import { ConfigurationSchema } from "../types/configuration";

export const departmentsSchema: ConfigurationSchema = {
  table: "departments",

  title: "Departments",

  description:
    "Manage departments within Alessandro Enterprises.",

  fields: [
    {
      key: "name",
      label: "Department Name",
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
