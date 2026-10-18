import { ConfigurationSchema } from "../types/configuration";

export const loanProductsSchema: ConfigurationSchema = {
  table: "loan_products",

  title: "Loan Products",

  description:
    "Define customer-facing loan types, eligible amount limits and collateral rules. Add repayment periods and interest rates separately under Loan Terms.",

  fields: [
    {
      key: "name",
      label: "Loan Product",
      type: "text",
      required: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
    },
    {
      key: "min_amount",
      label: "Minimum Amount (ZMW)",
      type: "number",
      min: 0,
      step: 0.01,
    },
    {
      key: "max_amount",
      label: "Maximum Amount (ZMW)",
      type: "number",
      min: 0,
      step: 0.01,
    },
    {
      key: "requires_collateral",
      label: "Requires Collateral",
      type: "boolean",
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
