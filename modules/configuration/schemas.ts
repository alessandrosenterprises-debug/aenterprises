import { operatorsSchema } from "./schemas/operators";
import {
  ConfigurationSchema,
  ConfigurationFieldType,
} from "./types/configuration";

/**
 * Central configuration schema registry.
 *
 * Each schema uses `key` as the database table name.
 * Individual complex schemas can live in ./schemas/*.ts
 * and be registered here.
 */

export const configurationSchemas = {
  departments: {
    key: "departments",

    title: "Departments",

    description:
      "Manage departments within Alessandro Enterprises.",

    fields: [
      {
        key: "name",
        label: "Department",
        type: "text",
        required: true,
        placeholder: "Department name",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Department description",
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
  },

  roles: {
    key: "roles",

    title: "Roles",

    description:
      "Manage system roles and access levels.",

    fields: [
      {
        key: "name",
        label: "Role Name",
        type: "text",
        required: true,
        placeholder: "Role name",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Role description",
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
  },

  permissions: {
    key: "permissions",

    title: "Permissions",

    description:
      "Manage permissions available to system roles.",

    fields: [
      {
        key: "module",
        label: "Module",
        type: "text",
        required: true,
        placeholder: "e.g. accounting",
      },

      {
        key: "action",
        label: "Action",
        type: "text",
        required: true,
        placeholder: "e.g. view",
      },

      {
        key: "name",
        label: "Permission",
        type: "text",
        required: true,
        placeholder: "e.g. accounting.view",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
      },
    ],
  },

  branches: {
    key: "branches",

    title: "Branches",

    description:
      "Manage business branches and locations.",

    fields: [
      {
        key: "name",
        label: "Branch Name",
        type: "text",
        required: true,
        placeholder: "Branch name",
      },

      {
        key: "code",
        label: "Branch Code",
        type: "text",
        placeholder: "e.g. AE-LSK",
      },

      {
        key: "city",
        label: "City",
        type: "text",
        placeholder: "City",
      },

      {
        key: "address",
        label: "Address",
        type: "textarea",
        placeholder: "Branch address",
      },

      {
        key: "phone",
        label: "Phone",
        type: "phone",
        placeholder: "+260 ...",
      },

      {
        key: "email",
        label: "Email",
        type: "email",
        placeholder: "branch@example.com",
      },

      {
        key: "manager_name",
        label: "Manager",
        type: "text",
        placeholder: "Branch manager",
      },

      {
        key: "active",
        label: "Active",
        type: "checkbox",
      },
    ],
  },

  /*
   * Operators already has its own schema because it contains
   * operator-specific fields such as logo and operator type.
   */
  operators: operatorsSchema,

  mobileMoneyServices: {
    key: "mobile_money_services",

    title: "Mobile Money Services",

    description:
      "Configure Mobile Money services such as Cash In, Cash Out, Transfers and Payments.",

    fields: [
      {
        key: "name",
        label: "Service Name",
        type: "text",
        required: true,
        placeholder: "Cash In",
      },

      {
        key: "service_type",
        label: "Service Type",
        type: "select",

        options: [
          {
            label: "Cash In",
            value: "cash_in",
          },
          {
            label: "Cash Out",
            value: "cash_out",
          },
          {
            label: "Person-to-Person Transfer",
            value: "transfer",
          },
          {
            label: "Bank Transfer",
            value: "bank_transfer",
          },
          {
            label: "International Remittance",
            value: "international_remittance",
          },
          {
            label: "Bill Payment",
            value: "bill_payment",
          },
          {
            label: "Merchant Payment",
            value: "merchant_payment",
          },
          {
            label: "Bulk Payment",
            value: "bulk_payment",
          },
          {
            label: "Airtime",
            value: "airtime",
          },
          {
            label: "Data",
            value: "data",
          },
        ],
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
  },

  loanProducts: {
    key: "loan_products",

    title: "Loan Products",

    description:
      "Configure loan products, limits and repayment requirements.",

    fields: [
      {
        key: "name",
        label: "Loan Product",
        type: "text",
        required: true,
        placeholder: "Business Loan",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
      },

      {
        key: "min_amount",
        label: "Minimum Amount (ZMW)",
        type: "currency",
        placeholder: "0.00",
      },

      {
        key: "max_amount",
        label: "Maximum Amount (ZMW)",
        type: "currency",
        placeholder: "0.00",
      },

      {
        key: "interest_rate",
        label: "Interest Rate (%)",
        type: "number",
        placeholder: "0",
      },

      {
        key: "repayment_period",
        label: "Repayment Period",
        type: "number",
        placeholder: "Months",
      },

      {
        key: "requires_collateral",
        label: "Requires Collateral",
        type: "checkbox",
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
  },

  categories: {
    key: "categories",

    title: "Categories",

    description:
      "Manage categories used across products and services.",

    fields: [
      {
        key: "name",
        label: "Category",
        type: "text",
        required: true,
        placeholder: "Category name",
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
  },
} satisfies Record<string, ConfigurationSchema>;

/**
 * Supported configuration route types.
 */
export type ConfigurationType =
  keyof typeof configurationSchemas;

/**
 * Re-export the field type so configuration-related
 * files can import it from the central schema module if needed.
 */
export type { ConfigurationFieldType };