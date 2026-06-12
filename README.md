
THIS IS CURRENTLY NOT COMPLETED
PLZ DONT JUDGE

# KashDog

KashDog is an educational Android-first offline payment prototype. It uses virtual demo coins only and does not connect to UPI, banks, cards, or real money rails.

## Run

Install mobile dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm install --prefix backend
```

Start the sync backend:

```bash
npm run backend
```

Start the Expo app:

```bash
npm run mobile
```

Scan the QR code with Expo Go on Android. Keep the terminal open; edits live-refresh on the phone.

If Expo Go says "use the latest version" even after installing from Play Store, install the SDK 56 Android build from Expo's official download page:

```text
https://expo.dev/go?device=true&platform=android&sdkVersion=56
```

Direct APK used by Expo for SDK 56:

```text
https://github.com/expo/expo-go-releases/releases/download/Expo-Go-56.0.1/Expo-Go-56.0.1.apk
```

If the phone keeps buffering, use tunnel mode:

```bash
npm run mobile:tunnel
```

If Expo seems stuck on an old bundle, clear Metro's cache:

```bash
npm run mobile:clear
```

The app is Android-first. `npm run typecheck` and `npx expo export --platform android` are the recommended local verification checks.

## Prototype Flow

1. Complete onboarding and create a demo wallet.
2. The app generates a local user ID, Ed25519 key pair, PIN hash, and 1000 demo coins.
3. Receiver opens `Receive` and shows a dynamic QR.
4. Sender opens `Send`, scans or pastes the receive payload, enters an amount, and signs a transaction.
5. For same-device testing, the Expo prototype can copy the offline transaction packet to the clipboard as a BLE transport stand-in.
6. For two phones online, sender taps `Sync` after sending, then receiver taps `Sync` to pull the signed transaction and credit their wallet.
7. Receiver-side sync verifies the signature/hash before applying the incoming balance change.

## Backend

The backend runs with in-memory storage by default. To use PostgreSQL, copy `backend/.env.example`, set `DATABASE_URL`, and run `npm run backend`.

For a physical phone, the Sync screen automatically prefers your Expo LAN host, for example `http://192.168.x.x:4100`. If sync fails, make sure the phone and laptop are on the same Wi-Fi and that `npm run backend` is still running.
