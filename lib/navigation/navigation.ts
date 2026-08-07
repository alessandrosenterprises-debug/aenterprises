import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  Package,
  CalendarDays,
  BarChart3,
  Globe,
  Bell,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

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
    href: "/enterprise",
    icon: Building2,
  },
  {
    title: "Businesses",
    icon: Briefcase,
    children: [
      {
        title: "Alessandro Elite Fashion",
        href: "/businesses/fashion",
      },
      {
        title: "Alessandro Classic Barbershop",
        href: "/businesses/barbershop",
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
    href: "/customers",
    icon: Users,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: CalendarDays,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Website CMS",
    href: "/website",
    icon: Globe,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Administration",
    href: "/administration",
    icon: ShieldCheck,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];