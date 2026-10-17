# Alessandro Enterprises Customer App

This Expo app uses native sign-in, account controls, and bottom navigation. Customer page content currently comes from the production AEOS site at `https://aenterprises-dashboard.vercel.app`, preserving its complete designs, cards, and customer workflows inside the native shell while native versions are built and checked for full parity.

## Preview in Expo Go

Run `npm install`, then use `npm run start:lan` when the phone and computer share Wi-Fi. If the phone is on cellular data or another network, use `npm run start:tunnel` and scan that session's QR code. The customer site itself always uses the public production URL so it does not depend on a private LAN address.

## Build an installable Android APK

From this folder, install dependencies and run the EAS `production-apk` profile. EAS creates/signs the Android keystore remotely and produces an APK for device installation.
