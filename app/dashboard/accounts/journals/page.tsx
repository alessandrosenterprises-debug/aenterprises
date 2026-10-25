import AccountsJournalWorkspace from "@/modules/accounts/components/AccountsJournalWorkspace";
import { getAccountsJournalData } from "../actions";

export default async function AccountsJournalsPage() {
  const data = await getAccountsJournalData();
  return <AccountsJournalWorkspace data={data} />;
}
