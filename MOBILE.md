# Shwe Meza — Native builds (Android APK/AAB + iOS IPA)

Shwe Meza runs fully on the device (all data lives in the browser's local storage),
so the native apps work on a LAN with no internet connection.

## What is already set up

- `capacitor.config.ts` — app id `com.heinhtetsoe.shwemeza`, app name **Shwe Meza**
- `android/` and `ios/` — native projects, already generated
- `scripts/build-mobile.mjs` — produces the static bundle at `dist/mobile`
- npm scripts:
  | script | what it does |
  |---|---|
  | `npm run build:mobile` | builds the web app and writes `dist/mobile` |
  | `npm run mobile:sync` | build + copy into the Android/iOS projects |
  | `npm run mobile:android` | opens the project in Android Studio |
  | `npm run mobile:ios` | opens the project in Xcode |

## Requirements (on your own machine)

- Node 20+
- **Android:** Android Studio + JDK 17
- **iOS:** macOS, Xcode 15+, CocoaPods (`sudo gem install cocoapods`)

## Android — APK / AAB

```bash
npm install
npm run mobile:sync
npm run mobile:android      # opens Android Studio
```

In Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)** (or *Build Bundle* for Play Store `.aab`).

Command line alternative:

```bash
cd android
./gradlew assembleDebug            # app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease            # app/build/outputs/bundle/release/app-release.aab (needs signing)
```

Release signing: create a keystore with `keytool -genkey -v -keystore shwemeza.keystore -alias shwemeza -keyalg RSA -keysize 2048 -validity 10000`, then add the credentials to `android/keystore.properties` and reference them in `android/app/build.gradle`.

## iOS — IPA

```bash
npm run mobile:sync
npm run mobile:ios          # opens Xcode
```

In Xcode: pick your Team under **Signing & Capabilities**, then **Product → Archive → Distribute App**.

## App icons and splash screens

```bash
npm i -D @capacitor/assets
# put a 1024x1024 icon at resources/icon.png and resources/splash.png
npx capacitor-assets generate
```

The brand logo is bundled at `src/assets/shwe-meza-logo-512.png` and can be used as the source icon.

## Permissions (voice notes, camera, files)

- Android: add `RECORD_AUDIO`, `CAMERA`, `READ_MEDIA_IMAGES` to `android/app/src/main/AndroidManifest.xml`.
- iOS: add `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` to `ios/App/App/Info.plist`.

## Live reload against your LAN dev server

```bash
npx cap run android --livereload --external
```

Or set `server.url` in `capacitor.config.ts` to `http://<your-lan-ip>:8080` to point the native shell at a LAN-hosted server (e.g. PocketBase + this app) instead of the bundled files.

---
Created by Hein Htet Soe.
