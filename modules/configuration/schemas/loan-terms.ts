import { ConfigurationSchema } from "../types/configuration";

export const loanTermsSchema: ConfigurationSchema = {
  table: "loan_product_terms",

  title: "Loan Terms",

  description:
    "Configure repayment periods and interest rates for each loan product.",

  fields: [
  {
    key: "loan_product_id",
    label: "Loan Product",
    type: "select",
    required: true,
    options: [],
  },

  {
    key: "period_days",
    label: "Repayment Period",
    type: "select",
    required: true,
    options: [
      {
        label: "7 Days",
        value: "7",
      },
      {
        label: "15 Days",
        value: "15",
      },
      {
        label: "31 Days",
        value: "31",
      },
    ],
  },

  {
    key: "interest_rate",
    label: "Interest Rate (%)",
    type: "number",
    required: true,
    placeholder: "e.g. 30",
  },

  {
    key: "active",
    label: "Active",
    type: "boolean",
  },
],
};