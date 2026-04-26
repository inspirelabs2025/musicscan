# 📦 MusicScan — Android Release AAB Build Guide

Complete stappenplan om een **release AAB (Android App Bundle)** te bouwen voor publicatie in de **Google Play Console** onder account `rogier@adup.io`.

---

## 📋 App Specs

| Veld | Waarde |
|------|--------|
| App Name | MusicScan |
| Package / Application ID | `com.inspirelabs.musicscan` |
| Version Code | 1 |
| Version Name | 1.0.0 |
| Min SDK | 23 (Android 6.0) |
| Target SDK | 34 (Android 14) |

---

## 🛠 Vereisten (eenmalig op je Mac/PC)

1. **Node 20+** & **npm** of **bun**
2. **JDK 17** (Temurin/Adoptium aanbevolen) — `java -version` → `17.x`
3. **Android Studio** met Android SDK 34 + Build Tools
4. **Environment variables** (`~/.zshrc` of `~/.bashrc`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk      # of jouw pad
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

---

## 🚀 Stap-voor-stap Build

### 1. Pull het project & installeer dependencies
```bash
git pull
npm install
```

### 2. Bouw de webapp
```bash
npm run build
```
Output: `dist/`

### 3. Sync naar Android
```bash
npx cap sync android
```
Dit kopieert `dist/` naar `android/app/src/main/assets/public/` en update de Capacitor plugin-registratie.

> 💡 Eerste keer? Run eerst `npx cap add android` als de `android/` folder ontbreekt — die zit echter al in deze repo.

### 4. Maak een upload keystore (eenmalig!)
```bash
keytool -genkey -v \
  -keystore ~/musicscan-upload-key.keystore \
  -alias musicscan-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
Bewaar het wachtwoord goed — je hebt het bij **elke release** nodig.

### 5. Exporteer signing env vars
```bash
export KEYSTORE_PATH=$HOME/musicscan-upload-key.keystore
export KEYSTORE_PASSWORD='jouw-keystore-wachtwoord'
export KEY_ALIAS=musicscan-upload
export KEY_PASSWORD='jouw-key-wachtwoord'
```

> ⚠️ **NOOIT committen.** Zet deze 4 vars in een lokale `~/.musicscan-signing.env` en source 'm vóór de build.

### 6. Build de AAB
```bash
cd android
./gradlew bundleRelease
```

### 7. Resultaat
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## ☁️ Upload naar Google Play Console

1. Login op [play.google.com/console](https://play.google.com/console) met **rogier@adup.io**
2. Maak een nieuwe app aan: **"MusicScan"** (Nederlands, gratis)
3. Ga naar **Productie** → **Nieuwe release maken**
4. Upload `app-release.aab`
5. Vul release notes, screenshots, content rating, privacy policy in
6. Submit voor review

---

## 🔄 Nieuwe versie uitbrengen

In `android/app/build.gradle` verhoog:
```gradle
versionCode 2          // ALTIJD +1
versionName "1.0.1"    // semver
```
Daarna: stap 2 → 6 herhalen.

---

## 🧪 Lokaal testen op device/emulator

```bash
npm run build
npx cap sync android
npx cap run android
```

Of open in Android Studio:
```bash
npx cap open android
```

---

## 🔒 Belangrijk: voeg dit toe aan `.gitignore`

`.gitignore` is read-only beheerd, dus voeg lokaal toe (of via een PR):

```gitignore
# Android signing
*.keystore
*.jks
keystore.properties
android/app/release/
android/app/build/
android/build/
android/.gradle/
android/local.properties
android/captures/
```

---

## 🆘 Troubleshooting

| Probleem | Oplossing |
|----------|-----------|
| `SDK location not found` | Maak `android/local.properties` met `sdk.dir=/pad/naar/Android/sdk` |
| `Java version mismatch` | Gebruik JDK 17 — check met `java -version` |
| `Failed to find Build Tools` | Open Android Studio → SDK Manager → installeer Build Tools 34.0.0 |
| Plugin niet gevonden na install | `npx cap sync android` opnieuw draaien |
| Hot reload faalt op device | Verwijder `server.url` uit `capacitor.config.ts` voor productie-builds |

---

## 📝 Productie vs Development server URL

In `capacitor.config.ts` staat momenteel een **dev server URL** voor hot-reload via Lovable sandbox. **Voor de release AAB** moet je deze regel verwijderen of uitcommenten zodat de app de gebundelde `dist/` files gebruikt:

```ts
server: {
  androidScheme: 'https',
  // url: 'https://0638cdc3-....lovableproject.com?forceHideBadge=true',  // ← UITCOMMENTEN voor release
  // cleartext: true,
}
```

Anders draait de Play Store-app tegen de Lovable preview in plaats van offline web-assets.

---

✅ **Klaar!** Vragen of issues? Lees de [Capacitor Android docs](https://capacitorjs.com/docs/android).
