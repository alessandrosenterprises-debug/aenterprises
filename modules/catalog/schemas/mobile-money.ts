import { BusinessCatalogSchema } from "../types/catalog";

export const mobileMoneySchema: BusinessCatalogSchema = {
  business: "mobile-money",

  title: "Mobile Money Service",

  itemType: "service",

  fields: [
    {
      key: "minimum_amount",
      label: "Minimum Amount",
      type: "currency",
    },
    {
      key: "maximum_amount",
      label: "Maximum Amount",
      type: "currency",
    },
    {
      key: "transaction_fee",
      label: "Transaction Fee",
      type: "currency",
    },
  ],
};