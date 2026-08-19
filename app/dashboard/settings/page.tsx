"use client";

import { useState, type ReactNode } from "react";

import ImageUpload from "@/components/ui/image-upload/ImageUpload";

import {
  AlertTriangle,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  Lock,
  Palette,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  User,
  Users,
  Database,
  Mail,
  RotateCcw,
  Eye,
  EyeOff,
  Monitor,
} from "lucide-react";

type SettingsSection =
  | "enterprise"
  | "profile"
  | "customer-app"
  | "website"
  | "businesses"
  | "communications"
  | "appearance"
  | "security"
  | "system"
  | "factory";

interface SettingsItem {
  id: SettingsSection;
  title: string;
  description: string;
  icon: typeof Building2;
}

const settingsSections: SettingsItem[] = [
  {
    id: "enterprise",
    title: "Enterprise Profile",
    description:
      "Manage your company information, branding and contact details.",
    icon: Building2,
  },
  {
    id: "profile",
    title: "My Profile",
    description:
      "Manage your administrator profile and personal account details.",
    icon: User,
  },
  {
    id: "customer-app",
    title: "Customer App",
    description:
      "Control the appearance and behaviour of the customer application.",
    icon: Smartphone,
  },
  {
    id: "website",
    title: "Website",
    description:
      "Manage website branding, visibility and public-facing content.",
    icon: Globe,
  },
  {
    id: "businesses",
    title: "Businesses",
    description:
      "Configure how businesses are presented and managed across the platform.",
    icon: SlidersHorizontal,
  },
  {
    id: "communications",
    title: "Communications",
    description:
      "Manage notifications, emails, reminders and customer communication.",
    icon: Bell,
  },
  {
    id: "appearance",
    title: "Appearance & Branding",
    description:
      "Control colours, logos and the visual identity of your platform.",
    icon: Palette,
  },
  {
    id: "security",
    title: "Security & Permissions",
    description:
      "Manage roles, permissions, passwords and account security.",
    icon: ShieldCheck,
  },
  {
    id: "system",
    title: "System & Data",
    description:
      "Manage system configuration, storage, data and platform health.",
    icon: Database,
  },
  {
    id: "factory",
    title: "Factory Settings",
    description:
      "Restore selected platform settings to their original defaults.",
    icon: RotateCcw,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("enterprise");

  const [saved, setSaved] = useState(false);

  const [companyLogo, setCompanyLogo] =
    useState("");

  const [appLogo, setAppLogo] =
    useState("");

  const [websiteLogo, setWebsiteLogo] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  function handleSave() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 3000);
  }

  const active =
    settingsSections.find(
      (section) =>
        section.id === activeSection
    ) ?? settingsSections[0];

  const ActiveIcon = active.icon;

  return (
    <div className="flex h-[calc(100dvh-80px)] min-h-0 flex-col overflow-hidden">
      {/* =====================================================
          FIXED PAGE HEADER
      ===================================================== */}

      <header className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#03162F] sm:text-3xl">
                Enterprise Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Control your Alessandro Enterprises platform from one place.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A2852]"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Changes Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          SETTINGS CONTROL CENTER
          ONLY THIS AREA IS ALLOWED TO SCROLL
      ===================================================== */}

      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ===================================================
            LEFT SETTINGS NAVIGATION
            INDEPENDENT SCROLL
        =================================================== */}

        <aside
          className="
            min-h-0
            overflow-y-scroll
            overscroll-contain
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
          "
        >
          <div className="px-3 pb-3 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enterprise Control Center
            </p>
          </div>

          <div className="space-y-1">
            {settingsSections.map(
              (section) => {
                const Icon = section.icon;

                const isActive =
                  activeSection ===
                  section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        section.id
                      )
                    }
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isActive
                        ? "bg-[#03162F] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#03162F]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-[#03162F]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isActive
                            ? "text-white"
                            : "text-[#03162F]"
                        }`}
                      >
                        {section.title}
                      </p>

                      <p
                        className={`mt-0.5 hidden text-[11px] leading-4 xl:block ${
                          isActive
                            ? "text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {section.description}
                      </p>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive
                          ? "text-white"
                          : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500"
                      }`}
                    />
                  </button>
                );
              }
            )}
          </div>

          {/* System Status */}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                <p className="text-xs font-bold text-emerald-800">
                  System Operational
                </p>
              </div>

              <p className="mt-1 text-[11px] leading-4 text-emerald-700">
                Your enterprise platform is running normally.
              </p>
            </div>
          </div>
        </aside>

        {/* ===================================================
            RIGHT SETTINGS CONTENT
            INDEPENDENT SCROLL
        =================================================== */}

        <section
          className="
            min-h-0
            min-w-0
            overflow-y-auto
            overscroll-contain
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          {/* Section Header */}

          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
                <ActiveIcon className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#03162F]">
                  {active.title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {active.description}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              ENTERPRISE PROFILE
          ================================================= */}

          {activeSection === "enterprise" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Company Information"
                description="Basic information displayed across the enterprise platform."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="Company Name"
                    defaultValue="Alessandro Enterprises"
                  />

                  <SettingInput
                    label="Tagline"
                    placeholder="Your company tagline"
                  />

                  <SettingInput
                    label="Phone"
                    placeholder="+260 ..."
                  />

                  <SettingInput
                    label="Email"
                    type="email"
                    placeholder="info@example.com"
                  />

                  <SettingInput
                    label="Website"
                    placeholder="https://..."
                  />

                  <SettingInput
                    label="Country"
                    defaultValue="Zambia"
                  />

                  <SettingInput
                    label="City"
                    defaultValue="Lusaka"
                  />

                  <SettingInput
                    label="Currency"
                    defaultValue="ZMW"
                  />

                  <SettingInput
                    label="Timezone"
                    defaultValue="Africa/Lusaka"
                  />

                  <SettingInput
                    label="Address"
                    placeholder="Company address"
                  />
                </div>

                <SettingTextarea
                  label="Company Description"
                  placeholder="Describe Alessandro Enterprises..."
                />
              </SettingGroup>

              <SettingGroup
                title="Company Logo"
                description="This logo can be used throughout the enterprise platform."
              >
                <ImageUpload
                  value={companyLogo}
                  onChange={setCompanyLogo}
                />
              </SettingGroup>

              <ToggleSetting
                title="Enterprise Active"
                description="Keep the enterprise platform operational."
                defaultChecked
              />
            </div>
          )}

          {/* =================================================
              MY PROFILE
          ================================================= */}

          {activeSection === "profile" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Administrator Profile"
                description="Manage your administrator account information."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="Display Name"
                    defaultValue="Alessandro"
                  />

                  <SettingInput
                    label="Email"
                    type="email"
                    placeholder="Administrator email"
                  />

                  <SettingInput
                    label="Role"
                    defaultValue="Super Administrator"
                    disabled
                  />

                  <SettingInput
                    label="Phone"
                    placeholder="+260 ..."
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Password Management"
                description="Change your administrator password."
              >
                <div className="space-y-5">
                  <PasswordInput
                    label="Current Password"
                    showPassword={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                  />

                  <PasswordInput
                    label="New Password"
                    showPassword={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    showPassword={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                  />
                </div>
              </SettingGroup>

              <InfoBox>
                <KeyRound className="h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Keep your administrator account secure
                  </p>

                  <p className="mt-1 text-sm">
                    Use a strong password and never share administrator credentials.
                  </p>
                </div>
              </InfoBox>
            </div>
          )}

          {/* =================================================
              CUSTOMER APP
          ================================================= */}

          {activeSection === "customer-app" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Customer App Branding"
                description="Configure how Alessandro Enterprises appears inside the customer application."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="App Name"
                    defaultValue="Alessandro Enterprises"
                  />

                  <SettingInput
                    label="Welcome Message"
                    defaultValue="Welcome to Alessandro Enterprises"
                  />
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold text-[#03162F]">
                    Customer App Logo
                  </p>

                  <ImageUpload
                    value={appLogo}
                    onChange={setAppLogo}
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Customer Experience"
                description="Control what customers can access."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Customer Registration"
                    description="Allow new customers to create accounts."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Bookings"
                    description="Allow customers to make bookings."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Products"
                    description="Show products inside the customer app."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Promotions"
                    description="Show active promotions to customers."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Customer Notifications"
                    description="Allow push and in-app notifications."
                    defaultChecked
                  />
                </div>
              </SettingGroup>
            </div>
          )}

          {/* =================================================
              WEBSITE
          ================================================= */}

          {activeSection === "website" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Website Identity"
                description="Manage the public-facing Alessandro Enterprises website."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="Website Title"
                    defaultValue="Alessandro Enterprises"
                  />

                  <SettingInput
                    label="Homepage Heading"
                    defaultValue="Welcome to Alessandro Enterprises"
                  />

                  <SettingInput
                    label="Meta Description"
                    placeholder="Website search description"
                  />

                  <SettingInput
                    label="Favicon URL"
                    placeholder="Favicon"
                  />
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-sm font-semibold text-[#03162F]">
                    Website Logo
                  </p>

                  <ImageUpload
                    value={websiteLogo}
                    onChange={setWebsiteLogo}
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Website Features"
                description="Control which enterprise content is publicly visible."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Show Businesses"
                    description="Display your businesses on the website."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Products"
                    description="Display products and services."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Promotions"
                    description="Display active promotions."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Contact Information"
                    description="Display company contact information."
                    defaultChecked
                  />
                </div>
              </SettingGroup>
            </div>
          )}

          {/* =================================================
              BUSINESSES
          ================================================= */}

          {activeSection === "businesses" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Business Platform Behaviour"
                description="Configure how businesses behave across your enterprise platform."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Show Active Businesses"
                    description="Only active businesses appear to customers."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Allow Business Requests"
                    description="Allow new business requests from administrators."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Business Availability"
                    description="Display business availability to customers."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Business Promotions"
                    description="Allow businesses to publish promotions."
                    defaultChecked
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Default Business Settings"
                description="Default values used when creating new businesses."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="Default Currency"
                    defaultValue="ZMW"
                  />

                  <SettingInput
                    label="Default Country"
                    defaultValue="Zambia"
                  />

                  <SettingInput
                    label="Default Timezone"
                    defaultValue="Africa/Lusaka"
                  />

                  <SettingInput
                    label="Default Status"
                    defaultValue="Active"
                  />
                </div>
              </SettingGroup>

              <InfoBox>
                <SlidersHorizontal className="h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Business records remain separate
                  </p>

                  <p className="mt-1 text-sm">
                    These settings control platform behaviour. Actual business records can still be managed from the Businesses module.
                  </p>
                </div>
              </InfoBox>
            </div>
          )}

          {/* =================================================
              COMMUNICATIONS
          ================================================= */}

          {activeSection === "communications" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Notifications"
                description="Control enterprise notifications."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Booking Notifications"
                    description="Notify administrators when bookings are created."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Customer Messages"
                    description="Notify administrators when customers send messages."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Issue Notifications"
                    description="Notify management when an issue is raised."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="System Notifications"
                    description="Receive important system notifications."
                    defaultChecked
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Email"
                description="Configure automated email communication."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <SettingInput
                    label="Sender Name"
                    defaultValue="Alessandro Enterprises"
                  />

                  <SettingInput
                    label="Sender Email"
                    type="email"
                    placeholder="notifications@example.com"
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <ToggleSetting
                    title="Booking Confirmation Emails"
                    description="Send confirmation emails after bookings."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Reminder Emails"
                    description="Send scheduled customer reminders."
                    defaultChecked
                  />
                </div>
              </SettingGroup>
            </div>
          )}

          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeSection === "appearance" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Brand Colours"
                description="Manage the visual identity of Alessandro Enterprises."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <ColorSetting
                    label="Primary Colour"
                    defaultValue="#03162F"
                  />

                  <ColorSetting
                    label="Accent Colour"
                    defaultValue="#D4AF37"
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Platform Branding"
                description="Choose which branding assets are used across the platform."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Use Company Branding"
                    description="Use the enterprise branding across all platforms."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Show Company Logo"
                    description="Display the company logo in navigation and headers."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Use Brand Accent"
                    description="Apply the enterprise accent colour to buttons and highlights."
                    defaultChecked
                  />
                </div>
              </SettingGroup>

              <InfoBox>
                <Palette className="h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Consistent branding
                  </p>

                  <p className="mt-1 text-sm">
                    Branding changes can be adopted by the dashboard, customer app and website after their configuration is refreshed.
                  </p>
                </div>
              </InfoBox>
            </div>
          )}

          {/* =================================================
              SECURITY
          ================================================= */}

          {activeSection === "security" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="Access Control"
                description="Manage enterprise access and permissions."
              >
                <div className="space-y-3">
                  <ActionSetting
                    icon={Users}
                    title="User Management"
                    description="Manage administrator and staff accounts."
                  />

                  <ActionSetting
                    icon={ShieldCheck}
                    title="Roles & Permissions"
                    description="Control what each role can access."
                  />

                  <ActionSetting
                    icon={Lock}
                    title="Security Policies"
                    description="Configure password and authentication policies."
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Session Security"
                description="Protect administrator accounts."
              >
                <div className="space-y-3">
                  <ToggleSetting
                    title="Session Timeout"
                    description="Automatically sign out inactive administrators."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Login Notifications"
                    description="Notify administrators when a new login occurs."
                    defaultChecked
                  />

                  <ToggleSetting
                    title="Audit Logging"
                    description="Record important administrative actions."
                    defaultChecked
                  />
                </div>
              </SettingGroup>
            </div>
          )}

          {/* =================================================
              SYSTEM
          ================================================= */}

          {activeSection === "system" && (
            <div className="space-y-7 p-5 sm:p-7">
              <SettingGroup
                title="System Status"
                description="View the current status of your enterprise platform."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatusCard
                    icon={Database}
                    title="Database"
                    status="Operational"
                  />

                  <StatusCard
                    icon={Monitor}
                    title="Dashboard"
                    status="Operational"
                  />

                  <StatusCard
                    icon={Globe}
                    title="Website"
                    status="Operational"
                  />

                  <StatusCard
                    icon={Smartphone}
                    title="Customer App"
                    status="Operational"
                  />
                </div>
              </SettingGroup>

              <SettingGroup
                title="Data Management"
                description="Manage enterprise data operations."
              >
                <div className="space-y-3">
                  <ActionSetting
                    icon={Database}
                    title="Export Enterprise Data"
                    description="Export supported enterprise information."
                  />

                  <ActionSetting
                    icon={RefreshCw}
                    title="Refresh Configuration"
                    description="Reload platform configuration after changes."
                  />

                  <ActionSetting
                    icon={Mail}
                    title="Email Configuration"
                    description="Manage system email configuration."
                  />
                </div>
              </SettingGroup>
            </div>
          )}

          {/* =================================================
              FACTORY SETTINGS
          ================================================= */}

          {activeSection === "factory" && (
            <div className="space-y-7 p-5 sm:p-7">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-red-900">
                      Factory Settings
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      These settings can restore parts of the platform to their default configuration. Use them carefully.
                    </p>
                  </div>
                </div>
              </div>

              <SettingGroup
                title="Reset Preferences"
                description="Reset non-destructive platform preferences."
              >
                <div className="space-y-3">
                  <DangerAction
                    title="Reset Dashboard Appearance"
                    description="Restore dashboard appearance settings."
                  />

                  <DangerAction
                    title="Reset Customer App Configuration"
                    description="Restore customer app preferences."
                  />

                  <DangerAction
                    title="Reset Website Configuration"
                    description="Restore website presentation settings."
                  />

                  <DangerAction
                    title="Restore Default Branding"
                    description="Restore the default enterprise branding configuration."
                  />
                </div>
              </SettingGroup>

              <div className="rounded-2xl border-2 border-red-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div className="min-w-0">
                    <h3 className="font-bold text-red-900">
                      Destructive actions
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Database deletion, customer deletion and other destructive operations should require additional confirmation and administrator authorization.
                    </p>

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                      onClick={() => {
                        const confirmed =
                          window.confirm(
                            "Factory reset has not been enabled yet. This action will be connected only after a protected reset workflow is implemented."
                          );

                        if (confirmed) {
                          window.alert(
                            "Protected factory reset is not enabled yet."
                          );
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              SAVE BAR
          ================================================= */}

          <div className="sticky bottom-0 z-10 flex flex-col justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

              <span>
                Changes are applied when the configuration is saved and refreshed.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2852]"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Changes Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE SETTINGS COMPONENTS
============================================================ */

function SettingGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#03162F]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SettingInput({
  label,
  type = "text",
  placeholder,
  defaultValue,
  disabled = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />
    </label>
  );
}

function SettingTextarea({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <textarea
        rows={5}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50"
      />
    </label>
  );
}

function PasswordInput({
  label,
  showPassword,
  onToggle,
}: {
  label: string;
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function ToggleSetting({
  title,
  description,
  defaultChecked = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#03162F]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />

      <div className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
    </label>
  );
}

function ColorSetting({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
        <input
          type="color"
          defaultValue={defaultValue}
          className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
        />

        <input
          type="text"
          defaultValue={defaultValue}
          className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm font-semibold text-[#03162F] outline-none"
        />
      </div>
    </label>
  );
}

function ActionSetting({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#03162F] hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#03162F] text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#03162F]">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#03162F]" />
    </button>
  );
}

function DangerAction({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4 text-left transition hover:border-red-300 hover:bg-red-50"
      onClick={() => {
        window.alert(
          `${title} will be connected to the protected configuration reset workflow.`
        );
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-red-600">
          {description}
        </p>
      </div>

      <RotateCcw className="h-5 w-5 shrink-0 text-red-500 transition group-hover:rotate-[-45deg]" />
    </button>
  );
}

function StatusCard({
  icon: Icon,
  title,
  status,
}: {
  icon: typeof Database;
  title: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#03162F]">
            {title}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs text-emerald-600">
              {status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
      {children}
    </div>
  );
}