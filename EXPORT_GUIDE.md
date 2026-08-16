# MWONGOZO WA KU-EXPORT APP YAKO (YMA ENERGY GROUP)

Ili kupata App yako na kuibadilisha kuwa APK au kuiweka kwenye server yako (kama Vercel, Render au cPanel), fuata hatua hizi rahisi.

## HATUA YA 1: KU-EXPORT KUTOKA HAPA (AI STUDIO)

Huwezi kutengeneza APK moja kwa moja kwa kutumia "command" ukiwa hapa ndani, badala yake unatumia menyu ya mfumo huu:

1. Angalia juu upande wa kulia kwenye kioo chako (kwenye hii screen unayochat na mimi).
2. Bonyeza kitufe cha **"Settings" (kama gia/kibaskeli)** au **"Share"**.
3. Chagua **"Export to ZIP"** (Kupakua mafaili yote kwenye kompyuta yako) AU chagua **"Export to GitHub"** (Kuiweka kwenye GitHub moja kwa moja).

## HATUA YA 2: JINSI YA KUTENGENEZA APK (ANDROID APP)

Kwa kuwa hii ni Web App (PWA) iliyokamilika, ukishaiweka hewani (kwa mfano uki-deploy kwenye Vercel/Netlify au Render), una njia mbili za kupata APK:

### Njia ya 1: PWABuilder (Njia Rahisi na ya Haraka zaidi)
1. Hakikisha umedeploy app yako (mfano ipo kwenye `https://yma-energy.vercel.app`).
2. Nenda kwenye tovuti ya **[PWABuilder](https://www.pwabuilder.com/)**.
3. Weka link ya App yako uliyodeploy.
4. PWABuilder itasoma `manifest.json` tuliyotengeneza (yenye jina "YMA ENERGY GROUP") na itakupa kitufe cha kudownload **Android APK** au AAB (kwa ajili ya PlayStore).

### Njia ya 2: Kutumia Capacitor (Kama wewe ni Developer)
Ukishadownload ZIP file la app hii kwenye kompyuta yako, fungua Terminal/CMD na u-run command hizi:

```bash
# 1. Install dependencies
npm install

# 2. Build the app for production (Inatengeneza folder la 'dist')
npm run build

# 3. Install Capacitor (Kama huna)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# 4. Initialize Capacitor
npx cap init "YMA ENERGY GROUP" "com.ymaenergy.app" --web-dir dist

# 5. Add Android Platform
npx cap add android

# 6. Copy web assets to Android
npx cap sync

# 7. Fungua kwenye Android Studio kutengeneza APK
npx cap open android
```

## KWA UFUPI
Hapa ndani ya AI Studio, **huitaji ku-run command yoyote**. Unachotakiwa kufanya ni:
👉 Bonyeza **Settings (⚙️)** > **Export to ZIP / GitHub**.
Kisha tumia faili hilo ku-deploy na kutengeneza APK yako!
