# Alessandro Enterprises Customer App

This Android app opens the production customer interface at `https://aenterprises-dashboard.vercel.app/customer` in a native WebView. Customer pages, styles, sign-in, navigation, and server features come from the main Next.js app, so the APK uses the same interface as the website.

## Preview in Expo Go

Run `npm install`, then use `npm run start:lan` when the phone and computer share Wi-Fi. If the phone is on cellular data or another network, use `npm run start:tunnel` and scan that session's QR code. The customer site itself always uses the public production URL so it does not depend on a private LAN address.

## Build an installable Android APK

From this folder, install dependencies and run the EAS `production-apk` profile. EAS creates/signs the Android keystore remotely and produces an APK for device installation.
