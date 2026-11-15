import { getAccountsFinancialReport } from "../actions";
import AccountsFinancialReports from "@/modules/accounts/components/AccountsFinancialReports";

function todayInLusaka() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export default async function AccountsStatementsPage() {
  const today = todayInLusaka();
  const start = `${today.slice(0, 4)}-01-01`;
  const data = await getAccountsFinancialReport(start, today);
  return <AccountsFinancialReports initialData={data} today={today} mode="statements" />;
}
