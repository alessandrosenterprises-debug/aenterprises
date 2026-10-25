import AccountsBillingWorkspace from "@/modules/accounts/components/AccountsBillingWorkspace";
import { getBillingWorkspaceData } from "./actions";

export default async function AccountsInvoicesPage() {
  const data = await getBillingWorkspaceData();
  return <AccountsBillingWorkspace data={data} />;
}
