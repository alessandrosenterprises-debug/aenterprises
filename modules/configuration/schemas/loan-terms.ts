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
    label: "Repayment Period (Days)",
    type: "number",
    required: true,
    min: 1,
    step: 1,
    placeholder: "e.g. 31",
  },

  {
    key: "interest_rate",
    label: "Interest Rate (%)",
    type: "number",
    required: true,
    min: 0,
    step: 0.01,
    placeholder: "e.g. 30",
  },

  {
    key: "active",
    label: "Available to customers",
    type: "boolean",
  },
],
};
