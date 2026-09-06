"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Globe2,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
} from "lucide-react";

import type {
  CustomerPreferences,
  CustomerPreferencesUpdate,
} from "@/modules/customers/services/customer-preferences.service";

interface PreferencesClientProps {
  initialPreferences: CustomerPreferences;
}

export default function PreferencesClient({
  initialPreferences,
}: PreferencesClientProps) {
  const [preferences, setPreferences] =
    useState<CustomerPreferences>(initialPreferences);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updatePreference(
    updates: CustomerPreferencesUpdate
  ) {
    setSaving(true);
    setSaved(false);
    setError(null);

    const previousPreferences = preferences;

    setPreferences(current => ({
      ...current,
      ...updates,
    }));

    try {
      const response = await fetch(
        "/api/customer/preferences",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to save your preference."
        );
      }

      if (result?.preferences) {
        setPreferences(result.preferences);

        if (
          updates.appearance &&
          typeof window !== "undefined"
        ) {
          window.dispatchEvent(
            new CustomEvent(
              "customer-appearance-change",
              {
                detail: {
                  appearance:
                    result.preferences.appearance,
                },
              }
            )
          );
        }
      }

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      setPreferences(previousPreferences);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your preference."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {(saving || saved) && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {saved ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              Preferences saved
            </>
          ) : (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#D4AF37]" />
              Saving...
            </>
          )}
        </div>
      )}

      <PreferenceSection
        title="Account & Profile"
        description="Manage your customer account."
      >
        <PreferenceLink
          icon={<User className="h-5 w-5" />}
          title="My Profile"
          description="Update your personal information and profile picture."
          href="/customer/profile"
        />

        <PreferenceLink
          icon={<Lock className="h-5 w-5" />}
          title="Account Settings"
          description="Manage account-related settings."
          href="/customer/profile?section=settings"
        />
      </PreferenceSection>

      <PreferenceSection
        title="Notifications"
        description="Choose which notifications you want to receive."
      >
        <PreferenceToggle
          icon={<Mail className="h-5 w-5" />}
          title="Email Notifications"
          description="Receive important updates by email."
          checked={preferences.email_notifications}
          disabled={saving}
          onChange={checked =>
            updatePreference({
              email_notifications: checked,
            })
          }
        />

        <PreferenceToggle
          icon={<Smartphone className="h-5 w-5" />}
          title="Push Notifications"
          description="Receive notifications on your device."
          checked={preferences.push_notifications}
          disabled={saving}
          onChange={checked =>
            updatePreference({
              push_notifications: checked,
            })
          }
        />

        <PreferenceToggle
          icon={<Bell className="h-5 w-5" />}
          title="Booking Reminders"
          description="Get reminders about upcoming bookings."
          checked={preferences.booking_reminders}
          disabled={saving}
          onChange={checked =>
            updatePreference({
              booking_reminders: checked,
            })
          }
        />

        <PreferenceToggle
          icon={<MessageSquare className="h-5 w-5" />}
          title="Message Notifications"
          description="Get notified when you receive messages."
          checked={preferences.message_notifications}
          disabled={saving}
          onChange={checked =>
            updatePreference({
              message_notifications: checked,
            })
          }
        />

        <PreferenceToggle
          icon={<Bell className="h-5 w-5" />}
          title="Promotional Notifications"
          description="Receive offers, promotions and special announcements."
          checked={preferences.promotional_notifications}
          disabled={saving}
          onChange={checked =>
            updatePreference({
              promotional_notifications: checked,
            })
          }
        />
      </PreferenceSection>

      <PreferenceSection
        title="Communication"
        description="Manage your communication options."
      >
        <PreferenceLink
          icon={<Mail className="h-5 w-5" />}
          title="Email Preferences"
          description="Manage your email communication."
          href="/customer/emails"
        />

        <PreferenceLink
          icon={<MessageSquare className="h-5 w-5" />}
          title="Messages"
          description="View your conversations with Alessandro Enterprises."
          href="/customer/messages"
        />
      </PreferenceSection>

      <PreferenceSection
        title="App Experience"
        description="Customize how the customer portal looks and behaves."
      >
        <PreferenceRow
          icon={<Globe2 className="h-5 w-5" />}
          title="Language"
          description="Choose your preferred language."
        >
          <select
            value={preferences.language}
            disabled={saving}
            onChange={event =>
              updatePreference({
                language: event.target.value,
              })
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="en">English</option>
          </select>
        </PreferenceRow>

        <PreferenceRow
          icon={<Monitor className="h-5 w-5" />}
          title="Appearance"
          description="Choose how the portal should look."
        >
          <select
            value={preferences.appearance}
            disabled={saving}
            onChange={event =>
              updatePreference({
                appearance: event.target.value as
                  | "system"
                  | "light"
                  | "dark",
              })
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#03162F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </PreferenceRow>

        <div className="grid grid-cols-3 gap-2 px-1 pb-2 sm:max-w-md">
          <AppearanceHint
            icon={<Monitor className="h-4 w-4" />}
            label="System"
            active={preferences.appearance === "system"}
          />

          <AppearanceHint
            icon={<Sun className="h-4 w-4" />}
            label="Light"
            active={preferences.appearance === "light"}
          />

          <AppearanceHint
            icon={<Moon className="h-4 w-4" />}
            label="Dark"
            active={preferences.appearance === "dark"}
          />
        </div>
      </PreferenceSection>

      <PreferenceSection
        title="Privacy & Security"
        description="Manage your account protection and privacy."
      >
        <PreferenceLink
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Security"
          description="Review your account security settings."
          href="/customer/profile?section=settings"
        />

        <PreferenceLink
          icon={<Lock className="h-5 w-5" />}
          title="Privacy"
          description="Review privacy-related account information."
          href="/customer/profile?section=settings"
        />
      </PreferenceSection>

      <div className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#03162F] to-[#0C3B78] p-5 text-white shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#D4AF37]">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <h2 className="font-bold">
              Your preferences are private
            </h2>

            <p className="mt-1 text-sm leading-6 text-white/70">
              These settings belong to your customer account and
              are used to personalize your Alessandro Enterprises
              experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
        <h2 className="text-base font-bold text-[#03162F] dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </section>
  );
}

function PreferenceToggle({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0C3B78] dark:bg-slate-800 dark:text-[#D4AF37]">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#03162F] dark:text-white">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#D4AF37]" : "bg-slate-300 dark:bg-slate-700"
        } ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function PreferenceLink({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0C3B78] dark:bg-slate-800 dark:text-[#D4AF37]">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#03162F] dark:text-white">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
    </a>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0C3B78] dark:bg-slate-800 dark:text-[#D4AF37]">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#03162F] dark:text-white">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AppearanceHint({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
        active
          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#03162F] dark:text-white"
          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}