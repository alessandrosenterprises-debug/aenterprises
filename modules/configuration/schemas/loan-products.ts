import { ConfigurationSchema } from "../types/configuration";

export const loanProductsSchema: ConfigurationSchema = {
  table: "loan_products",

  title: "Loan Products",

  description:
    "Configure loan products, limits and repayment requirements.",

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
    },
    {
      key: "max_amount",
      label: "Maximum Amount (ZMW)",
      type: "number",
    },
    {
      key: "interest_rate",
      label: "Interest Rate (%)",
      type: "number",
    },
    {
      key: "repayment_period",
      label: "Repayment Period",
      type: "number",
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
