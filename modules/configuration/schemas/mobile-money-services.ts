import { ConfigurationSchema } from "../types/configuration";

export const mobileMoneyServicesSchema: ConfigurationSchema = {
  table: "mobile_money_services",

  title: "Mobile Money Services",

  description:
    "Configure Mobile Money services such as Cash In, Cash Out, Transfers and Payments.",

  fields: [
    {
      key: "name",
      label: "Service Name",
      type: "text",
      required: true,
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
          label: "Transfer",
          value: "transfer",
        },
        {
          label: "Bank Transfer",
          value: "bank_transfer",
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
          label: "Airtime",
          value: "airtime",
        },
        {
          label: "Data",
          value: "data",
        },
        {
          label: "International Remittance",
          value: "international_remittance",
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
};
