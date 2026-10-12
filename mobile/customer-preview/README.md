# Alessandro Enterprises Customer App

This is a native Expo customer app. It uses native screens and navigation controls, persists Supabase sign-in on the device, and reads customer businesses, catalogue services and products, bookings, orders, notifications, and profile data from the same Supabase project as the website. Data screens use native pull-to-refresh.

## Local device preview

1. Create `mobile/customer-preview/.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Use the project URL and publishable/anon client key from the existing root `.env.local`; never put a service role key in the mobile app.
2. From this directory, run `npm install`, then `npm run start:lan`.
3. Scan the Expo QR code with Expo Go. Sign in using an existing customer account.

## Android APK

The `preview` EAS profile produces an installable APK. Install EAS CLI, sign in to the owner's Expo account, link this app to its EAS project with `eas init`, add the two public Supabase values as EAS environment variables for the preview profile, and run `eas build --platform android --profile preview`.

Before APK build, apply the repository's Supabase migrations, including `016_customer_mobile_booking_insert.sql`, to allow customers to send service booking requests under customer-owned row-level security. The current customer registration flow remains on the existing website; this app signs in existing customer accounts.
