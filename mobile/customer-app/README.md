# Alessandro Enterprises Customer App

This Android app opens the production customer interface at `https://aenterprises-dashboard.vercel.app/customer` in a native WebView. Customer pages, styles, sign-in, navigation, and server features come from the main Next.js app, so the APK uses the same interface as the website.

## Build an installable Android APK

From this folder, install dependencies and run the EAS `production-apk` profile. EAS creates/signs the Android keystore remotely and produces an APK for device installation.
