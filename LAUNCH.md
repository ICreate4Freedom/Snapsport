# SnapsPort — Launch Checklist

Track progress here. Items are ordered by dependency — don't skip ahead.

---

## 1. RevenueCat + IAP setup (blocker for paywall)

- [ ] Create account at https://app.revenuecat.com
- [ ] Add iOS app with bundle ID `com.snapsport.app`
- [ ] In App Store Connect: create a Non-Consumable IAP product, price $0.99
      Suggested product ID: `snapsport_unlock`
- [ ] In RevenueCat dashboard: Products → add the App Store product ID
- [ ] In RevenueCat dashboard: Entitlements → create one named exactly `unlock` → attach the product
- [ ] Copy the iOS API key from RevenueCat → paste into `src/core/revenuecat.ts` replacing `appl_REPLACE_WITH_YOUR_REVENUECAT_IOS_KEY`
- [ ] Run `npx expo prebuild --platform ios && cd ios && pod install`
- [ ] Rebuild and verify the paywall screen appears for >50 memories in debug mode

## 2. Test the real user flow

- [ ] Re-download Snapchat data export (Settings → Privacy → My Data; toggle both
      "Export your Memories" AND "Export JSON Files")
- [ ] Wait for the email from no-reply@snapchat.com
- [ ] Open the ZIP in SnapsPort via Share → SnapsPort from Mail
- [ ] Confirm memory count is parsed correctly
- [ ] Run a full download to Camera Roll, verify photos appear in Photos app
- [ ] Run a full download to SnapsPort Album, verify the album appears

## 3. App icon

- [ ] Create a 1024×1024 PNG (no transparency, no rounded corners — Apple adds those)
- [ ] Add to `assets/` and reference in `app.json` under `expo.icon`
- [ ] Run `npx expo prebuild --platform ios` again after updating app.json

## 4. Privacy policy

- [ ] Publish a privacy policy page (can be a simple GitHub Gist or Notion page)
      It just needs to state: "No data leaves your device. We collect nothing."
- [ ] Add the URL to App Store Connect under App Privacy

## 5. App Store screenshots

- [ ] 6.7" size (iPhone 16 Pro Max): minimum 3, recommended 5–6
      Suggested shots: onboarding, processing/paywall, download in progress, complete
- [ ] Upload in App Store Connect under the iOS app listing

## 6. App Store listing copy

- [ ] App name: `SnapsPort`
- [ ] Subtitle (30 chars): `Save Snapchat memories forever`
- [ ] Description: lead with the urgency (Snapchat storage fees), then the 3-step flow
- [ ] Keywords: `snapchat memories export save icloud photos transfer backup`
- [ ] Support URL: your GitHub repo or a contact page
- [ ] Replace the placeholder App Store URL in `app/complete.tsx` → `APP_STORE_URL`

## 7. EAS build config

- [ ] Fill in `eas.json` with your Apple Team ID and Apple ID
- [ ] Run `eas build --platform ios --profile preview` → distribute via TestFlight
- [ ] Test the TestFlight build on at least 2 devices before submitting to App Store

## 8. App Store submission

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Typical App Store review time: 24–48 hours.

## 9. Post-launch distribution

- [ ] r/DataHoarder — technical users who'll validate it works
- [ ] r/snapchat — core audience
- [ ] r/LifeHacks — broad reach
- [ ] Twitter/X: #SnapchatMemories #SnapchatStorage
- [ ] Fork https://github.com/ToTheMax/Snapchat-All-Memories-Downloader and publish
      the Python CLI as open source, linking back to this iOS app

---

## Already done

- [x] Zero-server architecture (Snapchat S3 → iPhone → iCloud Photos)
- [x] ZIP handler: "Open In → SnapsPort" works from Mail and Files app
- [x] Memory parser supporting real Snapchat export schema
- [x] Concurrent download queue (5 parallel, 3 retries per file)
- [x] Export destination: SnapsPort Album or Camera Roll picker
- [x] Free tier (50 memories) + RevenueCat paywall skeleton
- [x] Post-free-tier unlock path on complete screen (buy remaining without re-importing)
- [x] Email app picker (ActionSheet of installed apps, Safari fallback)
- [x] Snapchat deep link with snapchat.com fallback
- [x] App review prompt (expo-store-review)
- [x] Debug mode with shortcuts for all screens and states
- [x] EAS build config
