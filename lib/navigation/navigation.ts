import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  UserCog,
  Package,
  CalendarDays,
  BarChart3,
  Globe,
  Bell,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  MessageCircle,
  UsersRound,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

import { Mail } from "lucide-react";

export interface NavigationItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
  badge?: number;
  permission?: string;
  children?: NavigationItem[];
}

export const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    title: "Enterprise",
    href: "/dashboard/enterprise",
    icon: Building2,
  },

  {
    title: "Businesses",
    icon: Briefcase,
    children: [
      {
        title: "Alessandro Elite Fashion",
        href: "/businesses/elite-fashion",
      },
      {
        title: "Alessandro Classic Barbershop",
        href: "/businesses/classic-barbershop",
      },
      {
        title: "Alessandro Mobile Money",
        href: "/businesses/mobile-money",
      },
      {
        title: "Alessandro Soft Loans",
        href: "/businesses/soft-loans",
      },
      {
        title: "Alessandro Tech Solutions",
        href: "/businesses/tech-solutions",
      },
    ],
  },

  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },

  /*
   * ==========================================================
   * CUSTOMER LOANS
   *
   * Operational customer loan management lives here.
   * This is separate from HR employee loans & advances.
   * ==========================================================
   */
  {
    title: "Customer Loans",
    href: "/dashboard/loans",
    icon: HandCoins,
  },

  /*
   * ==========================================================
   * HUMAN RESOURCES
   *
   * Everything related to employees, departments,
   * payroll and future HR functionality lives here.
   * ==========================================================
   */
  {
    title: "Human Resources",
    icon: UsersRound,
    children: [
      {
        title: "HR Overview",
        href: "/dashboard/hr",
      },
      {
        title: "Employees",
        href: "/dashboard/hr/employees",
      },
      {
        title: "Departments",
        href: "/dashboard/hr/departments",
      },
      {
        title: "Leave & Attendance",
        href: "/dashboard/hr/leave-attendance",
      },
      {
        title: "Employee Documents",
        href: "/dashboard/hr/documents",
      },
      {
        title: "Loans & Advances",
        href: "/dashboard/hr/loans-advances",
      },
      {
        title: "Payroll",
        href: "/dashboard/hr/payroll",
      },
      {
        title: "HR Reports",
        href: "/dashboard/hr/reports",
      },
    ],
  },

  {
    title: "Emails",
    href: "/dashboard/emails",
    icon: Mail,
  },

  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: MessageCircle,
  },

  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },

  {
    title: "Catalog",
    href: "/dashboard/catalog",
    icon: Package,
  },

  {
    title: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarDays,
  },

  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },

  /*
   * ==========================================================
   * CONFIGURATION
   * ==========================================================
   */
  {
    title: "Configuration",
    icon: SlidersHorizontal,
    children: [
      {
        title: "Roles",
        href: "/dashboard/configuration/roles",
      },
      {
        title: "Permissions",
        href: "/dashboard/configuration/permissions",
      },
      {
        title: "Businesses",
        href: "/dashboard/configuration/businesses",
      },
      {
        title: "Branches",
        href: "/dashboard/configuration/branches",
      },
      {
        title: "Operators",
        href: "/dashboard/configuration/operators",
      },
      {
        title: "Mobile Money Services",
        href: "/dashboard/configuration/mobile-money-services",
      },
      {
        title: "Loan Products",
        href: "/dashboard/configuration/loan-products",
      },
      {
        title: "Loan Terms",
        href: "/dashboard/configuration/loan-terms",
      },
      {
        title: "Categories",
        href: "/dashboard/configuration/categories",
      },
      {
        title: "Company Settings",
        href: "/dashboard/configuration/company-settings",
      },
    ],
  },

  {
    title: "Website CMS",
    href: "/dashboard/website",
    icon: Globe,
  },

  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },

  {
    title: "Administration",
    href: "/dashboard/administration",
    icon: ShieldCheck,
  },

  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];