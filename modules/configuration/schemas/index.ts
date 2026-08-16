import { departmentsSchema } from "./departments";
import { rolesSchema } from "./roles";
import { permissionsSchema } from "./permissions";
import { branchesSchema } from "./branches";
import { operatorsSchema } from "./operators";
import { mobileMoneyServicesSchema } from "./mobile-money-services";
import { loanProductsSchema } from "./loan-products";
import { categoriesSchema } from "./categories";
import { businessesSchema } from "./businesses";
import { companySettingsSchema } from "./company-settings";

export const configurationSchemas = {
  departments: departmentsSchema,
  roles: rolesSchema,
  permissions: permissionsSchema,
  businesses: businessesSchema,
  branches: branchesSchema,
  operators: operatorsSchema,
  mobileMoneyServices: mobileMoneyServicesSchema,
  loanProducts: loanProductsSchema,
  categories: categoriesSchema,
  companySettings: companySettingsSchema,
};

export type ConfigurationType =
  keyof typeof configurationSchemas;