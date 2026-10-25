import AccountsShortageWorkspace from "@/modules/accounts/components/AccountsShortageWorkspace";
import { getAccountsShortageData } from "../actions";

export default async function AccountsShortagesPage() {
  const data = await getAccountsShortageData();
  return <AccountsShortageWorkspace data={data} />;
}
