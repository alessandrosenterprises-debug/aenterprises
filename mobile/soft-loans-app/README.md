# Alessandro Soft Loans (Android)

This is a separate Expo / React Native app. Its sign-in, product catalogue, application form, identity capture, and application tracking are native screens; it does not display AEOS pages in a WebView.

## Connected customer journey

- Customers sign in with their existing AEOS Customer Portal email and password. The app accepts active customer accounts only and retains the Supabase session securely on the device.
- Active loan products, product-specific active terms, and collateral options come from the AEOS native catalogue API.
- The customer enters an amount, address, next-of-kin details, optional collateral and notes. The app shows the interest and estimated total from the selected AEOS product term.
- The app sends an SMS verification code through the existing Supabase phone-auth setup and requires the verified phone to match the customer record.
- NRC front, NRC back, and selfie can be photographed or selected from the phone. Submission goes to the existing authenticated AEOS loan-application API, which validates the product and term and stores the images privately.
- Submitted applications and rejection reasons are read from the customer’s AEOS loan records.

## Configure local development

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_SUPABASE_URL`: the same Supabase project URL used by AEOS.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: that project’s publishable/anon key. Never put a service-role key in the app.
- `EXPO_PUBLIC_AEOS_API_URL`: the base URL of the AEOS website, without a trailing slash (for example the production website domain or `http://10.0.2.2:3000` for an Android emulator running against a developer machine).

Run `npm install`, then `npm run start`. Use the Expo development build or EAS for Android.

## Android builds

The EAS profiles in `eas.json` produce an internal APK (`production-apk`) or Play Store bundle (`production-aab`). This app has its own Android application ID, `com.alessandroenterprises.softloans`. Before the first EAS build, run `eas init` in this directory to create and attach a separate EAS project, then build using the desired profile. EAS will manage the signing key for the APK/AAB build.

Phone verification delivery depends on SMS being enabled and correctly configured for the AEOS Supabase Auth project. The AEOS site also needs the new customer catalogue API route deployed for app product loading.
