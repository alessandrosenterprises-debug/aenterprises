"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase/client";
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

/* ============================================================
   TYPES
============================================================ */

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

interface CompanySettings {
  id: string;
  company_name: string;
  tagline: string;
  description: string;
  logo_url: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  website: string;
  currency: string;
  timezone: string;
  active: boolean;
}

interface PlatformSettings {
  id: string;

  customer_app: CustomerAppSettings;
  website: WebsiteSettings;
  businesses: BusinessSettings;
  communications: CommunicationSettings;
  appearance: AppearanceSettings;
  system: SystemSettings;
}

interface CustomerAppSettings {
  app_name: string;
  logo_url: string;
  welcome_message: string;
  bookings_enabled: boolean;
  products_enabled: boolean;
  promotions_enabled: boolean;
  registration_enabled: boolean;
  notifications_enabled: boolean;
}

interface WebsiteSettings {
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

interface BusinessSettings {
  default_status: string;
  default_country: string;
  default_currency: string;
  default_timezone: string;
  show_active_businesses: boolean;
  allow_business_requests: boolean;
  show_business_promotions: boolean;
  show_business_availability: boolean;
}

interface CommunicationSettings {
  sender_name: string;
  sender_email: string;
  reminder_emails: boolean;
  customer_messages: boolean;
  issue_notifications: boolean;
  system_notifications: boolean;
  booking_notifications: boolean;
  booking_confirmation_emails: boolean;
}

interface AppearanceSettings {
  accent_color: string;
  primary_color: string;
  use_brand_accent: boolean;
  show_company_logo: boolean;
  use_company_branding: boolean;
}

interface SystemSettings {
  audit_logging: boolean;
  login_notifications: boolean;
  session_timeout_enabled: boolean;
}

interface ProfileSettings {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role_id: string;
  role_name: string;
  active: boolean;
}

/* ============================================================
   SETTINGS NAVIGATION
============================================================ */

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

/* ============================================================
   DEFAULT COMPANY SETTINGS
============================================================ */

const defaultCompanySettings: CompanySettings = {
  id: "",
  company_name: "Alessandro Enterprises",
  tagline: "The Name That Covers All",
  description: "",
  logo_url: "",
  phone: "",
  email: "",
  address: "",
  city: "Lusaka",
  country: "Zambia",
  website: "",
  currency: "ZMW",
  timezone: "Africa/Lusaka",
  active: true,
};

/* ============================================================
   DEFAULT PLATFORM SETTINGS
============================================================ */

const defaultCustomerAppSettings: CustomerAppSettings = {
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

const defaultWebsiteSettings: WebsiteSettings = {
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

const defaultBusinessSettings: BusinessSettings = {
  default_status: "Active",
  default_country: "Zambia",
  default_currency: "ZMW",
  default_timezone: "Africa/Lusaka",
  show_active_businesses: true,
  allow_business_requests: true,
  show_business_promotions: true,
  show_business_availability: true,
};

const defaultCommunicationSettings: CommunicationSettings = {
  sender_name: "Alessandro Enterprises",
  sender_email: "",
  reminder_emails: true,
  customer_messages: true,
  issue_notifications: true,
  system_notifications: true,
  booking_notifications: true,
  booking_confirmation_emails: true,
};

const defaultAppearanceSettings: AppearanceSettings = {
  accent_color: "#D4AF37",
  primary_color: "#03162F",
  use_brand_accent: true,
  show_company_logo: true,
  use_company_branding: true,
};

const defaultSystemSettings: SystemSettings = {
  audit_logging: true,
  login_notifications: true,
  session_timeout_enabled: true,
};

const defaultProfileSettings: ProfileSettings = {
  id: "",
  auth_user_id: "",
  first_name: "",
  last_name: "",
  display_name: "",
  email: "",
  phone: "",
  avatar_url: "",
  role_id: "",
  role_name: "",
  active: true,
};

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function SettingsPage() {
    useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("enterprise");

  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     COMPANY SETTINGS
  ========================================================== */

  const [companySettings, setCompanySettings] =
    useState<CompanySettings>(
      defaultCompanySettings
    );

  const [companyLogo, setCompanyLogo] =
    useState("");

  /* ==========================================================
     PLATFORM SETTINGS
  ========================================================== */

  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings>({
      id: "",
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
    });

  const [appLogo, setAppLogo] =
    useState("");

  const [websiteLogo, setWebsiteLogo] =
    useState("");

  /* ==========================================================
     PROFILE
  ========================================================== */

  const [profile, setProfile] =
    useState<ProfileSettings>(
      defaultProfileSettings
    );

  const [showPassword, setShowPassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  /* ==========================================================
     LOAD EVERYTHING
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        /* ======================================================
           LOAD COMPANY SETTINGS
        ====================================================== */

        const {
          data: companyData,
          error: companyError,
        } = await supabase
          .from("company_settings")
          .select(
            `
              id,
              company_name,
              tagline,
              description,
              logo_url,
              phone,
              email,
              address,
              city,
              country,
              website,
              currency,
              timezone,
              active
            `
          )
          .order("created_at", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        /* ======================================================
           LOAD PLATFORM SETTINGS
        ====================================================== */

        const {
          data: platformData,
          error: platformError,
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
              system
            `
          )
          .order("created_at", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

        if (platformError) {
          throw platformError;
        }

        /* ======================================================
           LOAD CURRENT PROFILE
        ====================================================== */

        const {
          data: {
            user,
          },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        let loadedProfile =
          defaultProfileSettings;

        if (user) {
          const {
            data: profileData,
            error: profileError,
          } = await supabase
            .from("profiles")
            .select(
              `
                id,
                auth_user_id,
                first_name,
                last_name,
                display_name,
                email,
                phone,
                avatar_url,
                role_id,
                active
              `
            )
            .eq(
              "auth_user_id",
              user.id
            )
            .maybeSingle();

          if (profileError) {
            console.error(
              "Failed to load profile:",
              profileError
            );
          }

          if (profileData) {
            let roleName = "";

            if (profileData.role_id) {
              const {
                data: roleData,
              } = await supabase
                .from("roles")
                .select("name")
                .eq(
                  "id",
                  profileData.role_id
                )
                .maybeSingle();

              roleName =
                roleData?.name ?? "";
            }

            loadedProfile = {
              id:
                profileData.id ?? "",
              auth_user_id:
                profileData.auth_user_id ??
                user.id,
              first_name:
                profileData.first_name ??
                "",
              last_name:
                profileData.last_name ??
                "",
              display_name:
                profileData.display_name ??
                user.email?.split(
                  "@"
                )[0] ??
                "",
              email:
                profileData.email ??
                user.email ??
                "",
              phone:
                profileData.phone ??
                "",
              avatar_url:
                profileData.avatar_url ??
                "",
              role_id:
                profileData.role_id ??
                "",
              role_name:
                roleName,
              active:
                profileData.active ??
                true,
            };
          }
        }

        if (cancelled) {
          return;
        }

        /* ======================================================
           NORMALIZE COMPANY SETTINGS
        ====================================================== */

        if (companyData) {
          const normalizedCompany: CompanySettings =
            {
              id:
                companyData.id ?? "",
              company_name:
                companyData.company_name ??
                defaultCompanySettings.company_name,
              tagline:
                companyData.tagline ??
                defaultCompanySettings.tagline,
              description:
                companyData.description ??
                "",
              logo_url:
                companyData.logo_url ??
                "",
              phone:
                companyData.phone ??
                "",
              email:
                companyData.email ??
                "",
              address:
                companyData.address ??
                "",
              city:
                companyData.city ??
                defaultCompanySettings.city,
              country:
                companyData.country ??
                defaultCompanySettings.country,
              website:
                companyData.website ??
                "",
              currency:
                companyData.currency ??
                defaultCompanySettings.currency,
              timezone:
                companyData.timezone ??
                defaultCompanySettings.timezone,
              active:
                companyData.active ??
                true,
            };

          setCompanySettings(
            normalizedCompany
          );

          setCompanyLogo(
            normalizedCompany.logo_url
          );
        } else {
          setCompanySettings(
            defaultCompanySettings
          );

          setCompanyLogo("");
        }

        /* ======================================================
           NORMALIZE PLATFORM SETTINGS
        ====================================================== */

        if (platformData) {
          const customerApp =
            normalizeObject(
              platformData.customer_app,
              defaultCustomerAppSettings
            );

          const website =
            normalizeObject(
              platformData.website,
              defaultWebsiteSettings
            );

          const businesses =
            normalizeObject(
              platformData.businesses,
              defaultBusinessSettings
            );

          const communications =
            normalizeObject(
              platformData.communications,
              defaultCommunicationSettings
            );

          const appearance =
            normalizeObject(
              platformData.appearance,
              defaultAppearanceSettings
            );

          const system =
            normalizeObject(
              platformData.system,
              defaultSystemSettings
            );

          setPlatformSettings({
            id:
              platformData.id ?? "",
            customer_app:
              customerApp,
            website,
            businesses,
            communications,
            appearance,
            system,
          });

          setAppLogo(
            customerApp.logo_url ?? ""
          );

          setWebsiteLogo(
            website.logo_url ?? ""
          );
        } else {
          setPlatformSettings({
            id: "",
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
          });

          setAppLogo("");
          setWebsiteLogo("");
        }

        setProfile(
          loadedProfile
        );
      } catch (loadError) {
        console.error(
          "Failed to load settings:",
          loadError
        );

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load enterprise settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ==========================================================
     COMPANY FIELD
  ========================================================== */

  function updateCompanyField<
    K extends keyof CompanySettings
  >(
    field: K,
    value: CompanySettings[K]
  ) {
    setCompanySettings(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     CUSTOMER APP FIELD
  ========================================================== */

  function updateCustomerAppField<
    K extends keyof CustomerAppSettings
  >(
    field: K,
    value: CustomerAppSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        customer_app: {
          ...current.customer_app,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     WEBSITE FIELD
  ========================================================== */

  function updateWebsiteField<
    K extends keyof WebsiteSettings
  >(
    field: K,
    value: WebsiteSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        website: {
          ...current.website,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     BUSINESS FIELD
  ========================================================== */

  function updateBusinessField<
    K extends keyof BusinessSettings
  >(
    field: K,
    value: BusinessSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        businesses: {
          ...current.businesses,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     COMMUNICATION FIELD
  ========================================================== */

  function updateCommunicationField<
    K extends keyof CommunicationSettings
  >(
    field: K,
    value: CommunicationSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        communications: {
          ...current.communications,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     APPEARANCE FIELD
  ========================================================== */

  function updateAppearanceField<
    K extends keyof AppearanceSettings
  >(
    field: K,
    value: AppearanceSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        appearance: {
          ...current.appearance,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     SYSTEM FIELD
  ========================================================== */

  function updateSystemField<
    K extends keyof SystemSettings
  >(
    field: K,
    value: SystemSettings[K]
  ) {
    setPlatformSettings(
      (current) => ({
        ...current,
        system: {
          ...current.system,
          [field]: value,
        },
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     PROFILE FIELD
  ========================================================== */

  function updateProfileField<
    K extends keyof ProfileSettings
  >(
    field: K,
    value: ProfileSettings[K]
  ) {
    setProfile(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setSaved(false);
    setError("");
  }

  /* ==========================================================
     SAVE COMPANY SETTINGS
  ========================================================== */

  async function saveCompanySettings() {
    const values = {
      company_name:
        companySettings.company_name.trim(),

      tagline:
        companySettings.tagline.trim() ||
        null,

      description:
        companySettings.description.trim() ||
        null,

      logo_url:
        companyLogo.trim() || null,

      phone:
        companySettings.phone.trim() ||
        null,

      email:
        companySettings.email.trim() ||
        null,

      address:
        companySettings.address.trim() ||
        null,

      city:
        companySettings.city.trim() ||
        null,

      country:
        companySettings.country.trim() ||
        null,

      website:
        companySettings.website.trim() ||
        null,

      currency:
        companySettings.currency.trim() ||
        "ZMW",

      timezone:
        companySettings.timezone.trim() ||
        "Africa/Lusaka",

      active:
        companySettings.active,
    };

    if (companySettings.id) {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("company_settings")
        .update(values)
        .eq(
          "id",
          companySettings.id
        )
        .select(
          `
            id,
            company_name,
            tagline,
            description,
            logo_url,
            phone,
            email,
            address,
            city,
            country,
            website,
            currency,
            timezone,
            active
          `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setCompanySettings({
          id: data.id,
          company_name:
            data.company_name ?? "",
          tagline:
            data.tagline ?? "",
          description:
            data.description ?? "",
          logo_url:
            data.logo_url ?? "",
          phone:
            data.phone ?? "",
          email:
            data.email ?? "",
          address:
            data.address ?? "",
          city:
            data.city ?? "",
          country:
            data.country ?? "",
          website:
            data.website ?? "",
          currency:
            data.currency ?? "ZMW",
          timezone:
            data.timezone ??
            "Africa/Lusaka",
          active:
            data.active ?? true,
        });

        setCompanyLogo(
          data.logo_url ?? ""
        );
      }
    } else {
      const {
        data,
        error: insertError,
      } = await supabase
        .from("company_settings")
        .insert({
          ...values,
          singleton_key:
            "default",
        })
        .select(
          `
            id,
            company_name,
            tagline,
            description,
            logo_url,
            phone,
            email,
            address,
            city,
            country,
            website,
            currency,
            timezone,
            active
          `
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setCompanySettings({
          id: data.id,
          company_name:
            data.company_name ?? "",
          tagline:
            data.tagline ?? "",
          description:
            data.description ?? "",
          logo_url:
            data.logo_url ?? "",
          phone:
            data.phone ?? "",
          email:
            data.email ?? "",
          address:
            data.address ?? "",
          city:
            data.city ?? "",
          country:
            data.country ?? "",
          website:
            data.website ?? "",
          currency:
            data.currency ?? "ZMW",
          timezone:
            data.timezone ??
            "Africa/Lusaka",
          active:
            data.active ?? true,
        });

        setCompanyLogo(
          data.logo_url ?? ""
        );
      }
    }
  }

  /* ==========================================================
     SAVE PLATFORM SETTINGS
  ========================================================== */

  async function savePlatformSettings() {
    const values = {
      customer_app: {
        ...platformSettings.customer_app,
        logo_url:
          appLogo.trim() || "",
      },

      website: {
        ...platformSettings.website,
        logo_url:
          websiteLogo.trim() || "",
      },

      businesses:
        platformSettings.businesses,

      communications:
        platformSettings.communications,

      appearance:
        platformSettings.appearance,

      system:
        platformSettings.system,

      updated_at:
        new Date().toISOString(),
    };

    if (platformSettings.id) {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("platform_settings")
        .update(values)
        .eq(
          "id",
          platformSettings.id
        )
        .select(
          `
            id,
            customer_app,
            website,
            businesses,
            communications,
            appearance,
            system
          `
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        const customerApp =
          normalizeObject(
            data.customer_app,
            defaultCustomerAppSettings
          );

        const website =
          normalizeObject(
            data.website,
            defaultWebsiteSettings
          );

        setPlatformSettings({
          id: data.id,
          customer_app:
            customerApp,
          website,
          businesses:
            normalizeObject(
              data.businesses,
              defaultBusinessSettings
            ),
          communications:
            normalizeObject(
              data.communications,
              defaultCommunicationSettings
            ),
          appearance:
            normalizeObject(
              data.appearance,
              defaultAppearanceSettings
            ),
          system:
            normalizeObject(
              data.system,
              defaultSystemSettings
            ),
        });

        setAppLogo(
          customerApp.logo_url ?? ""
        );

        setWebsiteLogo(
          website.logo_url ?? ""
        );
      }
    } else {
      const {
        data,
        error: insertError,
      } = await supabase
        .from("platform_settings")
        .insert({
          customer_app:
            values.customer_app,
          website:
            values.website,
          businesses:
            values.businesses,
          communications:
            values.communications,
          appearance:
            values.appearance,
          system:
            values.system,
        })
        .select(
          `
            id,
            customer_app,
            website,
            businesses,
            communications,
            appearance,
            system
          `
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setPlatformSettings({
          id: data.id,
          customer_app:
            normalizeObject(
              data.customer_app,
              defaultCustomerAppSettings
            ),
          website:
            normalizeObject(
              data.website,
              defaultWebsiteSettings
            ),
          businesses:
            normalizeObject(
              data.businesses,
              defaultBusinessSettings
            ),
          communications:
            normalizeObject(
              data.communications,
              defaultCommunicationSettings
            ),
          appearance:
            normalizeObject(
              data.appearance,
              defaultAppearanceSettings
            ),
          system:
            normalizeObject(
              data.system,
              defaultSystemSettings
            ),
        });
      }
    }
  }

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  async function saveProfileSettings() {
    if (!profile.id) {
      throw new Error(
        "Your profile could not be found."
      );
    }

    if (!profile.display_name.trim()) {
      throw new Error(
        "Display name is required."
      );
    }

    const {
      data: {
        user,
      },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      throw new Error(
        "You are not logged in."
      );
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        first_name:
          profile.first_name.trim(),

        last_name:
          profile.last_name.trim(),

        display_name:
          profile.display_name.trim(),

        email:
          profile.email.trim(),

        phone:
          profile.phone.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "auth_user_id",
        user.id
      )
      .select(
        `
          id,
          auth_user_id,
          first_name,
          last_name,
          display_name,
          email,
          phone,
          avatar_url,
          role_id,
          active
        `
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    if (data) {
      setProfile(
        (current) => ({
          ...current,
          id:
            data.id ??
            current.id,
          auth_user_id:
            data.auth_user_id ??
            current.auth_user_id,
          first_name:
            data.first_name ?? "",
          last_name:
            data.last_name ?? "",
          display_name:
            data.display_name ?? "",
          email:
            data.email ?? "",
          phone:
            data.phone ?? "",
          avatar_url:
            data.avatar_url ?? "",
          role_id:
            data.role_id ?? "",
          active:
            data.active ?? true,
        })
      );
    }
  }

  /* ==========================================================
     SAVE CHANGES
  ========================================================== */

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      if (activeSection === "enterprise") {
        await saveCompanySettings();
      }

      if (
        activeSection ===
          "customer-app" ||
        activeSection ===
          "website" ||
        activeSection ===
          "businesses" ||
        activeSection ===
          "communications" ||
        activeSection ===
          "appearance" ||
        activeSection === "system"
      ) {
        await savePlatformSettings();
      }

      if (activeSection === "profile") {
        await saveProfileSettings();
      }

      /*
       * Security contains navigation/action
       * controls rather than editable platform
       * JSON configuration in this table.
       *
       * Factory actions are intentionally not
       * included in the normal Save Changes
       * workflow.
       */

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (saveError) {
  console.error(
    "FAILED TO SAVE SETTINGS:",
    saveError
  );

  let message =
    "Failed to save settings.";

  if (
    saveError &&
    typeof saveError === "object"
  ) {
    const errorObject =
      saveError as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
        code?: unknown;
      };

    message =
      String(
        errorObject.message ??
          errorObject.details ??
          errorObject.hint ??
          errorObject.code ??
          message
      );
  } else if (
    saveError instanceof Error
  ) {
    message =
      saveError.message;
  }

  setError(message);
} finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     CHANGE PASSWORD
  ========================================================== */

  async function changePassword() {
    setChangingPassword(true);
    setError("");
    setSaved(false);

    try {
      if (!currentPassword) {
        throw new Error(
          "Enter your current password."
        );
      }

      if (!newPassword) {
        throw new Error(
          "Enter a new password."
        );
      }

      if (newPassword.length < 6) {
        throw new Error(
          "The new password must contain at least 6 characters."
        );
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        throw new Error(
          "The new passwords do not match."
        );
      }

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.email) {
        throw new Error(
          "Your authenticated email could not be found."
        );
      }

      const {
        error: signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              user.email,
            password:
              currentPassword,
          }
        );

      if (signInError) {
        throw new Error(
          "Your current password is incorrect."
        );
      }

      const {
        error: passwordError,
      } =
        await supabase.auth.updateUser({
          password:
            newPassword,
        });

      if (passwordError) {
        throw passwordError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (passwordError) {
      console.error(
        "Password change failed:",
        passwordError
      );

      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* ==========================================================
     REFRESH SETTINGS
  ========================================================== */

  function markChanged() {
    setSaved(false);
    setError("");
  }

  /* ==========================================================
     ACTIVE SECTION
  ========================================================== */

  const active =
    settingsSections.find(
      (section) =>
        section.id ===
        activeSection
    ) ??
    settingsSections[0];

  const ActiveIcon =
    active.icon;

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#03162F]" />

          <p className="text-sm text-slate-500">
            Loading enterprise settings...
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">

      {/* =====================================================
          FIXED SETTINGS HEADER
      ===================================================== */}

      <header className="relative z-30 shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 shadow-sm sm:px-6">
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
                Control your Alessandro
                Enterprises platform from one
                place.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={
              saving ||
              loading
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#03162F] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
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
          ERROR
      ===================================================== */}

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 sm:px-6">

          <div className="flex items-start gap-3 text-sm text-red-800">

            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0">

              <p className="font-semibold">
                Settings could not be loaded or saved
              </p>

              <p className="mt-1 break-words text-xs text-red-700">
                {error}
              </p>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SETTINGS WORKSPACE
      ===================================================== */}

      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">

        {/* ===================================================
            LEFT SETTINGS NAVIGATION
        =================================================== */}

        <aside
          className="
            min-h-0
            overflow-y-auto
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

                const Icon =
                  section.icon;

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
                        {
                          section.description
                        }
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

          <div className="mt-4 border-t border-slate-100 pt-4">

            <div className="rounded-xl bg-emerald-50 p-3">

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                <p className="text-xs font-bold text-emerald-800">
                  System Operational
                </p>

              </div>

              <p className="mt-1 text-[11px] leading-4 text-emerald-700">
                Your enterprise platform
                is running normally.
              </p>

            </div>

          </div>

        </aside>

        {/* ===================================================
            RIGHT SETTINGS CONTENT
        =================================================== */}

        <section
          className="
            min-h-0
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >

          {/* SECTION HEADER */}

          <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">

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
              SCROLLING SETTINGS CONTENT
          ================================================= */}

          <div className="min-h-0 h-[calc(100%-89px)] overflow-y-auto overscroll-contain">

            {/* =================================================
                ENTERPRISE PROFILE
            ================================================= */}

            {activeSection ===
              "enterprise" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Company Information"
                  description="Basic information displayed across the enterprise platform."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <SettingInput
                      label="Company Name"
                      value={
                        companySettings.company_name
                      }
                      onChange={(value) =>
                        updateCompanyField(
                          "company_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Tagline"
                      value={
                        companySettings.tagline
                      }
                      placeholder="Your company tagline"
                      onChange={(value) =>
                        updateCompanyField(
                          "tagline",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Phone"
                      value={
                        companySettings.phone
                      }
                      placeholder="+260 ..."
                      onChange={(value) =>
                        updateCompanyField(
                          "phone",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Email"
                      type="email"
                      value={
                        companySettings.email
                      }
                      placeholder="info@example.com"
                      onChange={(value) =>
                        updateCompanyField(
                          "email",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Website"
                      value={
                        companySettings.website
                      }
                      placeholder="https://..."
                      onChange={(value) =>
                        updateCompanyField(
                          "website",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Country"
                      value={
                        companySettings.country
                      }
                      onChange={(value) =>
                        updateCompanyField(
                          "country",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="City"
                      value={
                        companySettings.city
                      }
                      onChange={(value) =>
                        updateCompanyField(
                          "city",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Currency"
                      value={
                        companySettings.currency
                      }
                      onChange={(value) =>
                        updateCompanyField(
                          "currency",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Timezone"
                      value={
                        companySettings.timezone
                      }
                      onChange={(value) =>
                        updateCompanyField(
                          "timezone",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Address"
                      value={
                        companySettings.address
                      }
                      placeholder="Company address"
                      onChange={(value) =>
                        updateCompanyField(
                          "address",
                          value
                        )
                      }
                    />

                  </div>

                  <SettingTextarea
                    label="Company Description"
                    value={
                      companySettings.description
                    }
                    placeholder="Describe Alessandro Enterprises..."
                    onChange={(value) =>
                      updateCompanyField(
                        "description",
                        value
                      )
                    }
                  />

                </SettingGroup>

                <SettingGroup
                  title="Company Logo"
                  description="This logo can be used throughout the enterprise platform."
                >

                  <ImageUpload
                    value={companyLogo}
                    onChange={(value) => {
                      setCompanyLogo(value);
                      markChanged();
                    }}
                  />

                </SettingGroup>

                <ToggleSetting
                  title="Enterprise Active"
                  description="Keep the enterprise platform operational."
                  checked={
                    companySettings.active
                  }
                  onChange={(checked) =>
                    updateCompanyField(
                      "active",
                      checked
                    )
                  }
                />

              </div>
            )}

            {/* =================================================
                MY PROFILE
            ================================================= */}

            {activeSection ===
              "profile" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Administrator Profile"
                  description="Manage your administrator account information."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <SettingInput
                      label="First Name"
                      value={
                        profile.first_name
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "first_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Last Name"
                      value={
                        profile.last_name
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "last_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Display Name"
                      value={
                        profile.display_name
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "display_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Email"
                      type="email"
                      value={
                        profile.email
                      }
                      onChange={(value) =>
                        updateProfileField(
                          "email",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Phone"
                      value={
                        profile.phone
                      }
                      placeholder="+260 ..."
                      onChange={(value) =>
                        updateProfileField(
                          "phone",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Role"
                      value={
                        profile.role_name ||
                        "Administrator"
                      }
                      disabled
                    />

                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#03162F] text-white">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Account Status
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#03162F]">
                          {profile.active
                            ? "Active"
                            : "Inactive"}
                        </p>

                      </div>

                    </div>

                  </div>

                </SettingGroup>

                <SettingGroup
                  title="Password Management"
                  description="Change your administrator password."
                >

                  <div className="space-y-5">

                    <PasswordInput
                      label="Current Password"
                      value={
                        currentPassword
                      }
                      showPassword={
                        showPassword
                      }
                      onChange={
                        setCurrentPassword
                      }
                      onToggle={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                    />

                    <PasswordInput
                      label="New Password"
                      value={
                        newPassword
                      }
                      showPassword={
                        showPassword
                      }
                      onChange={
                        setNewPassword
                      }
                      onToggle={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                    />

                    <PasswordInput
                      label="Confirm New Password"
                      value={
                        confirmPassword
                      }
                      showPassword={
                        showPassword
                      }
                      onChange={
                        setConfirmPassword
                      }
                      onToggle={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                    />

                  </div>

                  <div className="mt-5 flex justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        void changePassword()
                      }
                      disabled={
                        changingPassword
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-[#03162F] bg-white px-5 py-3 text-sm font-semibold text-[#03162F] transition hover:bg-[#03162F] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {changingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          Change Password
                        </>
                      )}

                    </button>

                  </div>

                </SettingGroup>

                <InfoBox>

                  <KeyRound className="h-5 w-5 shrink-0" />

                  <div>

                    <p className="font-semibold">
                      Keep your administrator
                      account secure
                    </p>

                    <p className="mt-1 text-sm">
                      Use a strong password
                      and never share
                      administrator
                      credentials.
                    </p>

                  </div>

                </InfoBox>

              </div>
            )}

            {/* =================================================
                CUSTOMER APP
            ================================================= */}

            {activeSection ===
              "customer-app" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Customer App Branding"
                  description="Configure how Alessandro Enterprises appears inside the customer application."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <SettingInput
                      label="App Name"
                      value={
                        platformSettings
                          .customer_app
                          .app_name
                      }
                      onChange={(value) =>
                        updateCustomerAppField(
                          "app_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Welcome Message"
                      value={
                        platformSettings
                          .customer_app
                          .welcome_message
                      }
                      onChange={(value) =>
                        updateCustomerAppField(
                          "welcome_message",
                          value
                        )
                      }
                    />

                  </div>

                  <div className="mt-5">

                    <p className="mb-3 text-sm font-semibold text-[#03162F]">
                      Customer App Logo
                    </p>

                    <ImageUpload
                      value={appLogo}
                      onChange={(value) => {
                        setAppLogo(value);

                        updateCustomerAppField(
                          "logo_url",
                          value
                        );
                      }}
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
                      checked={
                        platformSettings
                          .customer_app
                          .registration_enabled
                      }
                      onChange={(checked) =>
                        updateCustomerAppField(
                          "registration_enabled",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Bookings"
                      description="Allow customers to make bookings."
                      checked={
                        platformSettings
                          .customer_app
                          .bookings_enabled
                      }
                      onChange={(checked) =>
                        updateCustomerAppField(
                          "bookings_enabled",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Products"
                      description="Show products inside the customer app."
                      checked={
                        platformSettings
                          .customer_app
                          .products_enabled
                      }
                      onChange={(checked) =>
                        updateCustomerAppField(
                          "products_enabled",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Promotions"
                      description="Show active promotions to customers."
                      checked={
                        platformSettings
                          .customer_app
                          .promotions_enabled
                      }
                      onChange={(checked) =>
                        updateCustomerAppField(
                          "promotions_enabled",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Customer Notifications"
                      description="Allow push and in-app notifications."
                      checked={
                        platformSettings
                          .customer_app
                          .notifications_enabled
                      }
                      onChange={(checked) =>
                        updateCustomerAppField(
                          "notifications_enabled",
                          checked
                        )
                      }
                    />

                  </div>

                </SettingGroup>

              </div>
            )}

            {/* =================================================
                WEBSITE
            ================================================= */}

            {activeSection ===
              "website" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Website Identity"
                  description="Manage the public-facing Alessandro Enterprises website."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <SettingInput
                      label="Website Title"
                      value={
                        platformSettings
                          .website
                          .title
                      }
                      onChange={(value) =>
                        updateWebsiteField(
                          "title",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Homepage Heading"
                      value={
                        platformSettings
                          .website
                          .homepage_heading
                      }
                      onChange={(value) =>
                        updateWebsiteField(
                          "homepage_heading",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Meta Description"
                      value={
                        platformSettings
                          .website
                          .meta_description
                      }
                      placeholder="Website search description"
                      onChange={(value) =>
                        updateWebsiteField(
                          "meta_description",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Favicon URL"
                      value={
                        platformSettings
                          .website
                          .favicon_url
                      }
                      placeholder="Favicon"
                      onChange={(value) =>
                        updateWebsiteField(
                          "favicon_url",
                          value
                        )
                      }
                    />

                  </div>

                  <div className="mt-5">

                    <p className="mb-3 text-sm font-semibold text-[#03162F]">
                      Website Logo
                    </p>

                    <ImageUpload
                      value={websiteLogo}
                      onChange={(value) => {
                        setWebsiteLogo(value);

                        updateWebsiteField(
                          "logo_url",
                          value
                        );
                      }}
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
                      checked={
                        platformSettings
                          .website
                          .show_businesses
                      }
                      onChange={(checked) =>
                        updateWebsiteField(
                          "show_businesses",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Products"
                      description="Display products and services."
                      checked={
                        platformSettings
                          .website
                          .show_products
                      }
                      onChange={(checked) =>
                        updateWebsiteField(
                          "show_products",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Promotions"
                      description="Display active promotions."
                      checked={
                        platformSettings
                          .website
                          .show_promotions
                      }
                      onChange={(checked) =>
                        updateWebsiteField(
                          "show_promotions",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Contact Information"
                      description="Display company contact information."
                      checked={
                        platformSettings
                          .website
                          .show_contact_information
                      }
                      onChange={(checked) =>
                        updateWebsiteField(
                          "show_contact_information",
                          checked
                        )
                      }
                    />

                  </div>

                </SettingGroup>

              </div>
            )}

            {/* =================================================
                BUSINESSES
            ================================================= */}

            {activeSection ===
              "businesses" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Business Platform Behaviour"
                  description="Configure how businesses behave across your enterprise platform."
                >

                  <div className="space-y-3">

                    <ToggleSetting
                      title="Show Active Businesses"
                      description="Only active businesses appear to customers."
                      checked={
                        platformSettings
                          .businesses
                          .show_active_businesses
                      }
                      onChange={(checked) =>
                        updateBusinessField(
                          "show_active_businesses",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Allow Business Requests"
                      description="Allow new business requests from administrators."
                      checked={
                        platformSettings
                          .businesses
                          .allow_business_requests
                      }
                      onChange={(checked) =>
                        updateBusinessField(
                          "allow_business_requests",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Business Availability"
                      description="Display business availability to customers."
                      checked={
                        platformSettings
                          .businesses
                          .show_business_availability
                      }
                      onChange={(checked) =>
                        updateBusinessField(
                          "show_business_availability",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Business Promotions"
                      description="Allow businesses to publish promotions."
                      checked={
                        platformSettings
                          .businesses
                          .show_business_promotions
                      }
                      onChange={(checked) =>
                        updateBusinessField(
                          "show_business_promotions",
                          checked
                        )
                      }
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
                      value={
                        platformSettings
                          .businesses
                          .default_currency
                      }
                      onChange={(value) =>
                        updateBusinessField(
                          "default_currency",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Default Country"
                      value={
                        platformSettings
                          .businesses
                          .default_country
                      }
                      onChange={(value) =>
                        updateBusinessField(
                          "default_country",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Default Timezone"
                      value={
                        platformSettings
                          .businesses
                          .default_timezone
                      }
                      onChange={(value) =>
                        updateBusinessField(
                          "default_timezone",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Default Status"
                      value={
                        platformSettings
                          .businesses
                          .default_status
                      }
                      onChange={(value) =>
                        updateBusinessField(
                          "default_status",
                          value
                        )
                      }
                    />

                  </div>

                </SettingGroup>

                <InfoBox>

                  <SlidersHorizontal className="h-5 w-5 shrink-0" />

                  <div>

                    <p className="font-semibold">
                      Business records remain
                      separate
                    </p>

                    <p className="mt-1 text-sm">
                      These settings control
                      platform behaviour.
                      Actual business records
                      can still be managed from
                      the Businesses module.
                    </p>

                  </div>

                </InfoBox>

              </div>
            )}

            {/* =================================================
                COMMUNICATIONS
            ================================================= */}

            {activeSection ===
              "communications" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Notifications"
                  description="Control enterprise notifications."
                >

                  <div className="space-y-3">

                    <ToggleSetting
                      title="Booking Notifications"
                      description="Notify administrators when bookings are created."
                      checked={
                        platformSettings
                          .communications
                          .booking_notifications
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "booking_notifications",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Customer Messages"
                      description="Notify administrators when customers send messages."
                      checked={
                        platformSettings
                          .communications
                          .customer_messages
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "customer_messages",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Issue Notifications"
                      description="Notify management when an issue is raised."
                      checked={
                        platformSettings
                          .communications
                          .issue_notifications
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "issue_notifications",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="System Notifications"
                      description="Receive important system notifications."
                      checked={
                        platformSettings
                          .communications
                          .system_notifications
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "system_notifications",
                          checked
                        )
                      }
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
                      value={
                        platformSettings
                          .communications
                          .sender_name
                      }
                      onChange={(value) =>
                        updateCommunicationField(
                          "sender_name",
                          value
                        )
                      }
                    />

                    <SettingInput
                      label="Sender Email"
                      type="email"
                      value={
                        platformSettings
                          .communications
                          .sender_email
                      }
                      placeholder="notifications@example.com"
                      onChange={(value) =>
                        updateCommunicationField(
                          "sender_email",
                          value
                        )
                      }
                    />

                  </div>

                  <div className="mt-5 space-y-3">

                    <ToggleSetting
                      title="Booking Confirmation Emails"
                      description="Send confirmation emails after bookings."
                      checked={
                        platformSettings
                          .communications
                          .booking_confirmation_emails
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "booking_confirmation_emails",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Reminder Emails"
                      description="Send scheduled customer reminders."
                      checked={
                        platformSettings
                          .communications
                          .reminder_emails
                      }
                      onChange={(checked) =>
                        updateCommunicationField(
                          "reminder_emails",
                          checked
                        )
                      }
                    />

                  </div>

                </SettingGroup>

              </div>
            )}

            {/* =================================================
                APPEARANCE
            ================================================= */}

            {activeSection ===
              "appearance" && (
              <div className="space-y-7 p-5 sm:p-7">

                <SettingGroup
                  title="Brand Colours"
                  description="Manage the visual identity of Alessandro Enterprises."
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <ColorSetting
                      label="Primary Colour"
                      value={
                        platformSettings
                          .appearance
                          .primary_color
                      }
                      onChange={(value) =>
                        updateAppearanceField(
                          "primary_color",
                          value
                        )
                      }
                    />

                    <ColorSetting
                      label="Accent Colour"
                      value={
                        platformSettings
                          .appearance
                          .accent_color
                      }
                      onChange={(value) =>
                        updateAppearanceField(
                          "accent_color",
                          value
                        )
                      }
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
                      checked={
                        platformSettings
                          .appearance
                          .use_company_branding
                      }
                      onChange={(checked) =>
                        updateAppearanceField(
                          "use_company_branding",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Show Company Logo"
                      description="Display the company logo in navigation and headers."
                      checked={
                        platformSettings
                          .appearance
                          .show_company_logo
                      }
                      onChange={(checked) =>
                        updateAppearanceField(
                          "show_company_logo",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Use Brand Accent"
                      description="Apply the enterprise accent colour to buttons and highlights."
                      checked={
                        platformSettings
                          .appearance
                          .use_brand_accent
                      }
                      onChange={(checked) =>
                        updateAppearanceField(
                          "use_brand_accent",
                          checked
                        )
                      }
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
                      Branding changes can be
                      adopted by the dashboard,
                      customer app and website
                      after their configuration
                      is refreshed.
                    </p>

                  </div>

                </InfoBox>

              </div>
            )}

            {/* =================================================
                SECURITY
            ================================================= */}

            {activeSection ===
              "security" && (
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
                      checked={
                        platformSettings
                          .system
                          .session_timeout_enabled
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "session_timeout_enabled",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Login Notifications"
                      description="Notify administrators when a new login occurs."
                      checked={
                        platformSettings
                          .system
                          .login_notifications
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "login_notifications",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Audit Logging"
                      description="Record important administrative actions."
                      checked={
                        platformSettings
                          .system
                          .audit_logging
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "audit_logging",
                          checked
                        )
                      }
                    />

                  </div>

                </SettingGroup>

                <InfoBox>

                  <ShieldCheck className="h-5 w-5 shrink-0" />

                  <div>

                    <p className="font-semibold">
                      Security controls
                    </p>

                    <p className="mt-1 text-sm">
                      Roles and permissions are
                      managed using the existing
                      roles, permissions,
                      role_permissions and
                      user_roles tables.
                    </p>

                  </div>

                </InfoBox>

              </div>
            )}

            {/* =================================================
                SYSTEM
            ================================================= */}

            {activeSection ===
              "system" && (
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
                  title="System Configuration"
                  description="Control important enterprise platform behaviour."
                >

                  <div className="space-y-3">

                    <ToggleSetting
                      title="Audit Logging"
                      description="Record important administrative actions."
                      checked={
                        platformSettings
                          .system
                          .audit_logging
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "audit_logging",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Login Notifications"
                      description="Notify administrators when a new login occurs."
                      checked={
                        platformSettings
                          .system
                          .login_notifications
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "login_notifications",
                          checked
                        )
                      }
                    />

                    <ToggleSetting
                      title="Session Timeout"
                      description="Automatically sign out inactive administrators."
                      checked={
                        platformSettings
                          .system
                          .session_timeout_enabled
                      }
                      onChange={(checked) =>
                        updateSystemField(
                          "session_timeout_enabled",
                          checked
                        )
                      }
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
                      onClick={() =>
                        window.location.reload()
                      }
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

            {activeSection ===
              "factory" && (
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
                        These settings can
                        restore parts of the
                        platform to their
                        default configuration.
                        Use them carefully.
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
                        Database deletion,
                        customer deletion and
                        other destructive
                        operations should require
                        additional confirmation
                        and administrator
                        authorization.
                      </p>

                      <button
                        type="button"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        onClick={() => {

                          const confirmed =
                            window.confirm(
                              "Factory reset has not been enabled yet. This action will only be connected after a protected reset workflow is implemented."
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

          </div>

        </section>

      </div>

    </div>
  );
}

/* ============================================================
   NORMALIZE JSON SETTINGS
============================================================ */

function normalizeObject<T extends object>(
  value: unknown,
  defaults: T
): T {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return {
      ...defaults,
      ...(value as Partial<T>),
    };
  }

  return {
    ...defaults,
  };
}

/* ============================================================
   SETTING GROUP
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

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

function SettingInput({
  label,
  type = "text",
  placeholder,
  defaultValue,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <input
        type={type}
        defaultValue={defaultValue}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) =>
          onChange?.(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

    </label>
  );
}

/* ============================================================
   TEXTAREA
============================================================ */

function SettingTextarea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="mt-5 block">

      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <textarea
        rows={5}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange?.(
            event.target.value
          )
        }
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#03162F] outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-yellow-50"
      />

    </label>
  );
}

/* ============================================================
   PASSWORD INPUT
============================================================ */

function PasswordInput({
  label,
  value,
  showPassword,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  showPassword: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="relative">

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
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

/* ============================================================
   TOGGLE
============================================================ */

function ToggleSetting({
  title,
  description,
  defaultChecked = false,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const [internalChecked, setInternalChecked] =
    useState(defaultChecked);

  const isControlled =
    typeof checked === "boolean";

  const isChecked = isControlled
    ? checked
    : internalChecked;

  function handleToggle() {
    const nextValue = !isChecked;

    if (!isControlled) {
      setInternalChecked(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#03162F]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={title}
        onClick={handleToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 ${
          isChecked
            ? "bg-emerald-500"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isChecked
              ? "translate-x-5"
              : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* ============================================================
   COLOR SETTING
============================================================ */

function ColorSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeColor =
    /^#[0-9A-Fa-f]{6}$/.test(value)
      ? value
      : "#03162F";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#03162F]">
        {label}
      </span>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
        <input
          type="color"
          value={safeColor}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
          aria-label={`${label} color picker`}
        />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="#03162F"
          className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-[#03162F] outline-none"
        />
      </div>
    </label>
  );
}

/* ============================================================
   ACTION SETTING
============================================================ */

function ActionSetting({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Database;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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

/* ============================================================
   DANGER ACTION
============================================================ */

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

/* ============================================================
   STATUS CARD
============================================================ */

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

/* ============================================================
   INFO BOX
============================================================ */

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