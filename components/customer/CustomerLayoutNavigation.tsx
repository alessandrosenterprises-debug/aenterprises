"use client";

import { usePathname } from "next/navigation";

import CustomerNavigationClient from "@/components/customer/CustomerNavigationClient";

export default function CustomerLayoutNavigation() {
  const pathname = usePathname();

  if (pathname === "/customer/login" || pathname === "/customer/register") {
    return null;
  }

  return <CustomerNavigationClient />;
}
