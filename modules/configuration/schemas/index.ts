import { operatorsSchema } from "./operators";

/*
Future imports

import { businessesSchema } from "./businesses";
import { branchesSchema } from "./branches";
import { loanProductsSchema } from "./loan-products";
import { categoriesSchema } from "./categories";
import { mobileMoneyServicesSchema } from "./mobile-money-services";
*/

export const configurationSchemas = {
  operators: operatorsSchema,

  /*
  businesses: businessesSchema,
  branches: branchesSchema,
  loanProducts: loanProductsSchema,
  categories: categoriesSchema,
  mobileMoneyServices: mobileMoneyServicesSchema,
  */
};

export type ConfigurationType =
  keyof typeof configurationSchemas;