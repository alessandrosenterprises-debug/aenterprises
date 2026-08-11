import { BusinessCatalogSchema } from "../types/catalog";

export const softLoansSchema: BusinessCatalogSchema = {
  business: "soft-loans",

  title: "Loan Product",

  itemType: "financial",

  fields: [
    {
      key: "interest_rate",
      label: "Interest Rate (%)",
      type: "number",
    },
    {
      key: "minimum_loan",
      label: "Minimum Loan",
      type: "currency",
    },
    {
      key: "maximum_loan",
      label: "Maximum Loan",
      type: "currency",
    },
    {
      key: "repayment_period",
      label: "Repayment Period",
      type: "text",
    },
  ],
};