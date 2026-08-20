import { supabase } from "@/lib/supabase/client";

/* ============================================================
   TYPES
============================================================ */

export type PlatformSettingsSection =
  | "customer_app"
  | "website"
  | "businesses"
  | "communications"
  | "appearance"
  | "system";

export interface CustomerAppSettings {
  app_name: string;
  logo_url: string;
  welcome_message: string;
  bookings_enabled: boolean;
  products_enabled: boolean;
  promotions_enabled: boolean;
  registration_enabled: boolean;
  notifications_enabled: boolean;
}

export interface WebsiteSettings {
  title: string;
  logo_url: string;
  favicon_url: string;
  show_products: boolean;
  show_businesses: boolean;
  show_promotions: boolean;
  homepage_heading: string;
  meta_description: string;
  show_contact_information: boolean;
}

export interface BusinessSettings {
  default_status: string;
  default_country: string;
  default_currency: string;
  default_timezone: string;
  show_active_businesses: boolean;
  allow_business_requests: boolean;
  show_business_promotions: boolean;
  show_business_availability: boolean;
}

export interface CommunicationSettings {
  sender_name: string;
  sender_email: string;
  reminder_emails: boolean;
  customer_messages: boolean;
  issue_notifications: boolean;
  system_notifications: boolean;
  booking_notifications: boolean;
  booking_confirmation_emails: boolean;
}

export interface AppearanceSettings {
  accent_color: string;
  primary_color: string;
  use_brand_accent: boolean;
  show_company_logo: boolean;
  use_company_branding: boolean;
}

export interface SystemSettings {
  audit_logging: boolean;
  login_notifications: boolean;
  session_timeout_enabled: boolean;
}

export interface PlatformSettings {
  id: string;

  customer_app: CustomerAppSettings;

  website: WebsiteSettings;

  businesses: BusinessSettings;

  communications: CommunicationSettings;

  appearance: AppearanceSettings;

  system: SystemSettings;

  created_at?: string;

  updated_at?: string;
}

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

export const defaultCustomerAppSettings: CustomerAppSettings = {
  app_name: "Alessandro Enterprises",
  logo_url: "",
  welcome_message:
    "Welcome to Alessandro Enterprises",

  bookings_enabled: true,
  products_enabled: true,
  promotions_enabled: true,
  registration_enabled: true,
  notifications_enabled: true,
};

export const defaultWebsiteSettings: WebsiteSettings = {
  title: "Alessandro Enterprises",
  logo_url: "",
  favicon_url: "",

  show_products: true,
  show_businesses: true,
  show_promotions: true,

  homepage_heading:
    "Welcome to Alessandro Enterprises",

  meta_description: "",

  show_contact_information: true,
};

export const defaultBusinessSettings: BusinessSettings = {
  default_status: "Active",
  default_country: "Zambia",
  default_currency: "ZMW",
  default_timezone: "Africa/Lusaka",

  show_active_businesses: true,
  allow_business_requests: true,
  show_business_promotions: true,
  show_business_availability: true,
};

export const defaultCommunicationSettings: CommunicationSettings = {
  sender_name: "Alessandro Enterprises",
  sender_email: "",

  reminder_emails: true,
  customer_messages: true,
  issue_notifications: true,
  system_notifications: true,
  booking_notifications: true,
  booking_confirmation_emails: true,
};

export const defaultAppearanceSettings: AppearanceSettings = {
  accent_color: "#D4AF37",
  primary_color: "#03162F",

  use_brand_accent: true,
  show_company_logo: true,
  use_company_branding: true,
};

export const defaultSystemSettings: SystemSettings = {
  audit_logging: true,
  login_notifications: true,
  session_timeout_enabled: true,
};

/* ============================================================
   DEFAULT PLATFORM SETTINGS
============================================================ */

export const defaultPlatformSettings: Omit<
  PlatformSettings,
  "id"
> = {
  customer_app:
    defaultCustomerAppSettings,

  website:
    defaultWebsiteSettings,

  businesses:
    defaultBusinessSettings,

  communications:
    defaultCommunicationSettings,

  appearance:
    defaultAppearanceSettings,

  system:
    defaultSystemSettings,
};

/* ============================================================
   ERROR HANDLING
============================================================ */

function getSupabaseErrorMessage(
  error: unknown
): string {
  if (!error) {
    return "Unknown Supabase error.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null
  ) {
    const err =
      error as Record<string, unknown>;

    return String(
      err.message ??
        err.details ??
        err.hint ??
        err.code ??
        "Unknown Supabase error."
    );
  }

  return String(error);
}

function throwSupabaseError(
  operation: string,
  error: unknown
): never {
  console.error(
    `Supabase ${operation} error:`,
    error
  );

  throw new Error(
    getSupabaseErrorMessage(error)
  );
}

/* ============================================================
   NORMALIZE SETTINGS
============================================================ */

function normalizePlatformSettings(
  data: any
): PlatformSettings {
  return {
    id: data?.id ?? "",

    customer_app: {
      ...defaultCustomerAppSettings,
      ...(data?.customer_app ?? {}),
    },

    website: {
      ...defaultWebsiteSettings,
      ...(data?.website ?? {}),
    },

    businesses: {
      ...defaultBusinessSettings,
      ...(data?.businesses ?? {}),
    },

    communications: {
      ...defaultCommunicationSettings,
      ...(data?.communications ?? {}),
    },

    appearance: {
      ...defaultAppearanceSettings,
      ...(data?.appearance ?? {}),
    },

    system: {
      ...defaultSystemSettings,
      ...(data?.system ?? {}),
    },

    created_at:
      data?.created_at,

    updated_at:
      data?.updated_at,
  };
}

/* ============================================================
   GET ALL PLATFORM SETTINGS
============================================================ */

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const {
    data,
    error,
  } = await supabase
    .from("platform_settings")
    .select(
      `
        id,
        customer_app,
        website,
        businesses,
        communications,
        appearance,
        system,
        created_at,
        updated_at
      `
    )
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throwSupabaseError(
      "loading platform settings",
      error
    );
  }

  /*
   * If the database row does not exist,
   * return the defaults.
   *
   * We do NOT insert automatically here.
   * Loading should never unexpectedly
   * create database records.
   */

  if (!data) {
    return {
      id: "",
      ...defaultPlatformSettings,
    };
  }

  return normalizePlatformSettings(
    data
  );
}

/* ============================================================
   GET ONE SETTINGS SECTION
============================================================ */

export async function getPlatformSettingsSection<
  T extends PlatformSettingsSection
>(
  section: T
): Promise<PlatformSettings[T]> {
  const settings =
    await getPlatformSettings();

  return settings[section];
}

/* ============================================================
   UPDATE ONE SETTINGS SECTION
============================================================ */

export async function updatePlatformSettingsSection<
  T extends PlatformSettingsSection
>(
  section: T,
  values: Partial<
    PlatformSettings[T]
  >
): Promise<PlatformSettings> {
  const current =
    await getPlatformSettings();

  const currentSection =
    current[section];

  const updatedSection = {
    ...currentSection,
    ...values,
  };

  const updateValues = {
    [section]: updatedSection,
    updated_at:
      new Date().toISOString(),
  };

  /*
   * Existing platform_settings row
   */

  if (current.id) {
    const {
      data,
      error,
    } = await supabase
      .from("platform_settings")
      .update(updateValues)
      .eq("id", current.id)
      .select(
        `
          id,
          customer_app,
          website,
          businesses,
          communications,
          appearance,
          system,
          created_at,
          updated_at
        `
      )
      .single();

    if (error) {
      throwSupabaseError(
        `updating ${section} settings`,
        error
      );
    }

    return normalizePlatformSettings(
      data
    );
  }

  /*
   * No row exists yet.
   *
   * Create the complete configuration
   * using defaults for all other sections.
   */

  const insertValues = {
    customer_app:
      section === "customer_app"
        ? updatedSection
        : current.customer_app,

    website:
      section === "website"
        ? updatedSection
        : current.website,

    businesses:
      section === "businesses"
        ? updatedSection
        : current.businesses,

    communications:
      section === "communications"
        ? updatedSection
        : current.communications,

    appearance:
      section === "appearance"
        ? updatedSection
        : current.appearance,

    system:
      section === "system"
        ? updatedSection
        : current.system,
  };

  const {
    data,
    error,
  } = await supabase
    .from("platform_settings")
    .insert(insertValues)
    .select(
      `
        id,
        customer_app,
        website,
        businesses,
        communications,
        appearance,
        system,
        created_at,
        updated_at
      `
    )
    .single();

  if (error) {
    throwSupabaseError(
      `creating platform settings for ${section}`,
      error
    );
  }

  return normalizePlatformSettings(
    data
  );
}

/* ============================================================
   UPDATE MULTIPLE SETTINGS SECTIONS
============================================================ */

export async function updatePlatformSettings(
  values: Partial<
    Pick<
      PlatformSettings,
      | "customer_app"
      | "website"
      | "businesses"
      | "communications"
      | "appearance"
      | "system"
    >
  >
): Promise<PlatformSettings> {
  const current =
    await getPlatformSettings();

  const updateValues = {
    customer_app:
      values.customer_app ??
      current.customer_app,

    website:
      values.website ??
      current.website,

    businesses:
      values.businesses ??
      current.businesses,

    communications:
      values.communications ??
      current.communications,

    appearance:
      values.appearance ??
      current.appearance,

    system:
      values.system ??
      current.system,

    updated_at:
      new Date().toISOString(),
  };

  /*
   * Update existing row.
   */

  if (current.id) {
    const {
      data,
      error,
    } = await supabase
      .from("platform_settings")
      .update(updateValues)
      .eq("id", current.id)
      .select(
        `
          id,
          customer_app,
          website,
          businesses,
          communications,
          appearance,
          system,
          created_at,
          updated_at
        `
      )
      .single();

    if (error) {
      throwSupabaseError(
        "updating platform settings",
        error
      );
    }

    return normalizePlatformSettings(
      data
    );
  }

  /*
   * Create the configuration row
   * if it doesn't exist.
   */

  const {
    data,
    error,
  } = await supabase
    .from("platform_settings")
    .insert(updateValues)
    .select(
      `
        id,
        customer_app,
        website,
        businesses,
        communications,
        appearance,
        system,
        created_at,
        updated_at
      `
    )
    .single();

  if (error) {
    throwSupabaseError(
      "creating platform settings",
      error
    );
  }

  return normalizePlatformSettings(
    data
  );
}

/* ============================================================
   SAVE CUSTOMER APP SETTINGS
============================================================ */

export async function saveCustomerAppSettings(
  values: Partial<CustomerAppSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "customer_app",
    values
  );
}

/* ============================================================
   SAVE WEBSITE SETTINGS
============================================================ */

export async function saveWebsiteSettings(
  values: Partial<WebsiteSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "website",
    values
  );
}

/* ============================================================
   SAVE BUSINESS SETTINGS
============================================================ */

export async function saveBusinessSettings(
  values: Partial<BusinessSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "businesses",
    values
  );
}

/* ============================================================
   SAVE COMMUNICATION SETTINGS
============================================================ */

export async function saveCommunicationSettings(
  values: Partial<CommunicationSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "communications",
    values
  );
}

/* ============================================================
   SAVE APPEARANCE SETTINGS
============================================================ */

export async function saveAppearanceSettings(
  values: Partial<AppearanceSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "appearance",
    values
  );
}

/* ============================================================
   SAVE SYSTEM SETTINGS
============================================================ */

export async function saveSystemSettings(
  values: Partial<SystemSettings>
): Promise<PlatformSettings> {
  return updatePlatformSettingsSection(
    "system",
    values
  );
}

/* ============================================================
   LEGACY GENERIC CREATE
   ------------------------------------------------------------
   Kept temporarily so existing configuration modules
   do not break while we migrate them to the new service.
============================================================ */

export async function createConfiguration(
  table: string,
  values: Record<string, unknown>
) {
  console.warn(
    `createConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) {
    throwSupabaseError(
      `creating configuration in ${table}`,
      error
    );
  }

  return data;
}

/* ============================================================
   LEGACY GENERIC UPDATE
   ------------------------------------------------------------
   Kept temporarily for compatibility.
============================================================ */

export async function updateConfiguration(
  table: string,
  id: string,
  values: Record<string, unknown>
) {
  console.warn(
    `updateConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throwSupabaseError(
      `updating configuration in ${table}`,
      error
    );
  }

  return data;
}

/* ============================================================
   LEGACY GENERIC DELETE
   ------------------------------------------------------------
   Kept temporarily for compatibility.
============================================================ */

export async function deleteConfiguration(
  table: string,
  id: string
) {
  console.warn(
    `deleteConfiguration("${table}") is using the legacy generic configuration API.`
  );

  const {
    error,
  } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    throwSupabaseError(
      `deleting configuration from ${table}`,
      error
    );
  }

  return true;
}

/* ============================================================
   CONFIGURATION FORM TYPES
   ------------------------------------------------------------
   Existing configuration pages can continue importing these.
============================================================ */

export type ConfigurationFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "boolean"
  | "date"
  | "email"
  | "phone"
  | "image";

export interface ConfigurationField {
  key: string;

  label: string;

  type: ConfigurationFieldType;

  required?: boolean;

  placeholder?: string;

  options?: {
    label: string;
    value: string;
  }[];
}

export interface ConfigurationSchema {
  table: string;

  title: string;

  description?: string;

  fields: ConfigurationField[];
}