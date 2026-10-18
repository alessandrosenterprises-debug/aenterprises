import {
  LayoutDashboard,
  Building2,
  BriefcaseBusiness,
  Users,
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
  Shirt,
  Scissors,
  Smartphone,
  Laptop,
  UserRound,
  UserCog,
  Building,
  CalendarCheck,
  FolderOpen,
  WalletCards,
  Mail,
  BellRing,
  Store,
  ShoppingBag,
  ListTree,
  Bike,
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
    title: "Management",
    icon: Building2,
    children: [
      { title: "Enterprise Overview", href: "/dashboard/enterprise", icon: Building },
      { title: "Business Content Manager", href: "/dashboard/enterprise/content", icon: ListTree },
      { title: "Alessandro Elite Fashion", href: "/dashboard/enterprise/elite-fashion", icon: Shirt },
      { title: "Alessandro Classic Barbershop", href: "/dashboard/enterprise/classic-barbershop", icon: Scissors },
      { title: "Alessandro Mobile Money", href: "/dashboard/enterprise/mobile-money", icon: Smartphone },
      { title: "Alessandro Soft Loans", href: "/dashboard/enterprise/soft-loans", icon: HandCoins },
      { title: "Alessandro Tech Solutions", href: "/dashboard/enterprise/tech-solutions", icon: Laptop },
      { title: "Enterprise Reports", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Customer & Technology Services",
    icon: Laptop,
    children: [
      { title: "Tech Solutions Consultations", href: "/dashboard/enterprise/tech-solutions/consultations", icon: MessageCircle },
      { title: "Customers", href: "/dashboard/customers", icon: Users },
      { title: "Customer Loans", href: "/dashboard/loans", icon: HandCoins },
    ],
  },
  {
    title: "Staff Management",
    icon: UserCog,
    children: [
      { title: "Employees", href: "/dashboard/hr/employees", icon: UserCog },
      { title: "Departments", href: "/dashboard/hr/departments", icon: Building2 },
    ],
  },
  {
    title: "HR Management",
    icon: UsersRound,
    children: [
      { title: "HR Overview", href: "/dashboard/hr", icon: UsersRound },
      { title: "Rider Management", href: "/dashboard/hr/riders", icon: Bike },
      { title: "Leave & Attendance", href: "/dashboard/hr/leave-attendance", icon: CalendarCheck },
      { title: "Employee Documents", href: "/dashboard/hr/documents", icon: FolderOpen },
      { title: "Loans & Advances", href: "/dashboard/hr/loans-advances", icon: HandCoins },
      { title: "Payroll", href: "/dashboard/hr/payroll", icon: WalletCards },
      { title: "HR Reports", href: "/dashboard/hr/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Communication",
    icon: MessageCircle,
    children: [
      { title: "Emails", href: "/dashboard/emails", icon: Mail },
      { title: "Messages", href: "/dashboard/messages", icon: MessageCircle },
    ],
  },
  {
    title: "Operations",
    icon: BriefcaseBusiness,
    children: [
      { title: "Products", href: "/dashboard/products", icon: Package },
      { title: "Products Catalog", href: "/dashboard/catalog", icon: Package },
      { title: "Bookings", href: "/dashboard/bookings", icon: CalendarDays },
      { title: "Customer Orders", href: "/dashboard/orders", icon: ShoppingBag },
      { title: "My Deliveries", href: "/dashboard/orders/my-deliveries", icon: Bike },
      { title: "Delivery & Rider Reports", href: "/dashboard/orders/delivery-reports", icon: BarChart3, permission: "orders.view" },
      { title: "Customer Reviews", href: "/dashboard/orders/reviews", icon: MessageCircle, permission: "orders.view" },
    ],
  },
  {
    title: "Configuration",
    icon: SlidersHorizontal,
    children: [
      { title: "Roles & Permissions", href: "/dashboard/configuration/roles", icon: ShieldCheck },
      { title: "Permissions", href: "/dashboard/configuration/permissions", icon: ShieldCheck },
      { title: "Businesses", href: "/dashboard/configuration/businesses", icon: BriefcaseBusiness },
      { title: "Branches", href: "/dashboard/configuration/branches", icon: Building2 },
      { title: "Operators", href: "/dashboard/configuration/operators", icon: Users },
      { title: "Mobile Money Services", href: "/dashboard/configuration/mobile-money-services", icon: Smartphone },
      { title: "Loan Products", href: "/dashboard/configuration/loan-products", icon: HandCoins },
      { title: "Loan Terms", href: "/dashboard/configuration/loan-terms", icon: ListTree },
      { title: "Categories", href: "/dashboard/configuration/categories", icon: Store },
      { title: "Company Settings", href: "/dashboard/configuration/company-settings", icon: Settings },
    ],
  },
  {
    title: "Administration",
    icon: ShieldCheck,
    children: [
      { title: "Website CMS", href: "/dashboard/website", icon: Globe },
      { title: "Notifications", href: "/dashboard/notifications", icon: BellRing },
      { title: "Administration Settings", href: "/dashboard/administration", icon: ShieldCheck },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
