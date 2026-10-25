import {
  LayoutDashboard,
  Building2,
  Boxes,
  ArrowRightLeft,
  BriefcaseBusiness,
  Users,
  Package,
  PackageCheck,
  CalendarDays,
  BarChart3,
  Globe,
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
  UserCog,
  Building,
  CalendarCheck,
  FolderOpen,
  WalletCards,
  CreditCard,
  ReceiptText,
  Landmark,
  BookOpenCheck,
  Calculator,
  Scale,
  Mail,
  BellRing,
  Store,
  ShoppingBag,
  ListTree,
  ClipboardList,
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
  superAdminOnly?: boolean;
}

export const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workspaces",
    icon: LayoutDashboard,
    children: [
      { title: "Super Admin Dashboard", href: "/dashboard", icon: LayoutDashboard, superAdminOnly: true },
      { title: "Staff Workspace", href: "/dashboard/staff", icon: BriefcaseBusiness, superAdminOnly: true },
      { title: "Manager Dashboard", href: "/dashboard/manager", icon: UsersRound, superAdminOnly: true },
      { title: "Administration Dashboard", href: "/dashboard/administration", icon: ShieldCheck, superAdminOnly: true },
    ],
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
    title: "HR",
    icon: UsersRound,
    children: [
      { title: "HR Overview", href: "/dashboard/hr", icon: UsersRound },
      { title: "Employees", href: "/dashboard/hr/employees", icon: UserCog },
      { title: "Departments", href: "/dashboard/hr/departments", icon: Building2 },
      { title: "Rider Management", href: "/dashboard/hr/riders", icon: Bike },
      { title: "Leave & Attendance", href: "/dashboard/hr/leave-attendance", icon: CalendarCheck },
      { title: "Employee Documents", href: "/dashboard/hr/documents", icon: FolderOpen },
      { title: "Loans & Advances", href: "/dashboard/hr/loans-advances", icon: HandCoins },
      { title: "Payroll", href: "/dashboard/hr/payroll", icon: WalletCards },
      { title: "Payslips", href: "/dashboard/hr/payroll/payslips", icon: WalletCards },
      { title: "HR Reports", href: "/dashboard/hr/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    children: [
      { title: "Enterprise Reports", href: "/dashboard/reports", icon: BarChart3 },
      { title: "Department Reports", href: "/dashboard/reports/submissions", icon: ClipboardList },
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
    title: "Stock Management",
    icon: Boxes,
    children: [
      { title: "Branch Inventory", href: "/dashboard/stock", icon: PackageCheck },
      { title: "Stock Movements", href: "/dashboard/stock/movements", icon: ArrowRightLeft },
      { title: "Stock Reports", href: "/dashboard/stock/reports", icon: BarChart3 },
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
    title: "Cash Office",
    icon: WalletCards,
    children: [
      { title: "Daily Cash Reconciliation", href: "/dashboard/reports/cash-reconciliation", icon: WalletCards },
      { title: "Cashier Management", href: "/dashboard/reports/cash-reconciliation/cashiers", icon: UserCog, permission: "cash.manage" },
      { title: "Payment Modes", href: "/dashboard/reports/cash-reconciliation/modes", icon: CreditCard, permission: "cash.manage" },
    ],
  },
  {
    title: "Accounts Department",
    icon: Landmark,
    children: [
      { title: "Accounts Overview", href: "/dashboard/accounts", icon: Landmark, permission: "accounts.view" },
      { title: "Invoices & Quotations", href: "/dashboard/accounts/invoices", icon: ReceiptText, permission: "billing.view" },
      { title: "Payroll & Statutory Returns", href: "/dashboard/accounts/payroll", icon: Calculator, permission: "accounts.view" },
      { title: "Shortages & Salary Recovery", href: "/dashboard/accounts/shortages", icon: Scale, permission: "accounts.view" },
      { title: "General Ledger Journals", href: "/dashboard/accounts/journals", icon: BookOpenCheck, permission: "accounts.view" },
      { title: "Financial Statements", href: "/dashboard/accounts/reports", icon: BarChart3, permission: "accounts.view" },
      { title: "Cash-up Review", href: "/dashboard/reports/cash-reconciliation/account-review", icon: WalletCards, permission: "cash.finalize" },
      { title: "Cash Balancing & Shortages", href: "/dashboard/reports/cash-reconciliation", icon: Scale, permission: "reports.view" },
      { title: "Financial Reports", href: "/dashboard/reports", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    title: "Configuration",
    icon: SlidersHorizontal,
    children: [
      { title: "Roles & Permissions", href: "/dashboard/configuration/roles", icon: ShieldCheck },
      { title: "Staff Accounts", href: "/dashboard/administration/access", icon: UserCog, permission: "access.manage_permissions" },
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
      { title: "App Health & Errors", href: "/dashboard/administration/monitoring", icon: BarChart3, permission: "access.view_audit" },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
