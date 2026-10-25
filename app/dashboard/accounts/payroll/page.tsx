import { getAccountsStatutoryData } from "../statutory/actions";
import StatutoryRemittancesWorkspace from "@/modules/accounts/components/StatutoryRemittancesWorkspace";

export default async function AccountsPayrollPage() {
  const data = await getAccountsStatutoryData();
  return <StatutoryRemittancesWorkspace initialData={data} />;
}
