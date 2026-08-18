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

  {
    title: "Employees",
    href: "/dashboard/employees",
    icon: UserCog,
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

  {
    title: "Configuration",
    icon: SlidersHorizontal,
    children: [
      {
        title: "Departments",
        href: "/dashboard/configuration/departments",
      },
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