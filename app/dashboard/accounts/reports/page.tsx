import { getAccountsFinancialReport } from "../actions";
import AccountsFinancialReports from "@/modules/accounts/components/AccountsFinancialReports";

function todayInLusaka() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")?.value}-${p.find((x) => x.type === "month")?.value}-${p.find((x) => x.type === "day")?.value}`;
}

export default async function AccountsReportsPage() {
  const today = todayInLusaka();
  const start = `${today.slice(0, 4)}-01-01`;
  const data = await getAccountsFinancialReport(start, today);
  return <AccountsFinancialReports initialData={data} today={today} />;
}
