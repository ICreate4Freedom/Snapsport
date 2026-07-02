# SnapsPort — App Store Connect listing pack

Everything here is copy-paste ready. Character limits noted in [brackets].

---

## App name [30]
`SnapsPort`

## Subtitle [30]
`Save Snapchat memories forever`
<!-- exactly 30 chars -->

## Promotional text [170] — editable anytime without review
`Snapchat now charges for storage past 5GB. Export your Memories and save every photo and
video straight to iCloud Photos — before your download links expire.`

## Keywords [100, comma-separated, no spaces]
`snapchat,memories,export,save,icloud,photos,transfer,backup,download,cameraroll,album,storage,rescue`
<!-- Don't repeat words already in the app name/subtitle; Apple indexes those separately. -->

## Description [4000]
```
Snapchat is now charging for Memories storage over 5GB — and your export download links
expire after 7 days. SnapsPort gets your memories out and into your iPhone's photo library
for good, in three simple steps.

HOW IT WORKS
1. Request your data from Snapchat (Settings → My Data → export Memories).
2. Download the ZIP file(s) Snapchat emails you.
3. Open the ZIP in SnapsPort — it finds every photo and video and saves them to iCloud Photos.

WHY SNAPSPORT
• Everything happens on your device. Your memories are never uploaded to a server.
• No account, no sign-up. Just open your ZIP and go.
• Save to a dedicated "SnapsPort" album or straight to your Camera Roll.
• Handles large exports and multiple ZIP files in one pass.
• Real progress tracking so you always know how far along you are.
• Once saved, iCloud syncs your memories to all your Apple devices automatically.

FREE + ONE-TIME UNLOCK
Save your first 50 memories free. Unlock unlimited saving with a single one-time $0.99
purchase — no subscription, ever.

Stop paying Snapchat to hold your memories hostage. Get them back with SnapsPort.
```

## What's New (version 1.0.0) [4000]
`First release of SnapsPort. Move your Snapchat Memories into iCloud Photos in three steps.`

## Support URL
`https://github.com/<your-username>/snapsport`   <!-- or a simple contact/support page -->

## Marketing URL (optional)
`(leave blank or link a landing page)`

---

## In-App Purchase metadata — `snapsport_unlock`

- **Reference Name (internal):** Unlock All Memories
- **Display Name [30]:** `Unlock All Memories`
- **Description [45]:** `Save all your memories, not just the first 50`
- **Price:** $0.99 (Tier 1) — Non-Consumable

### IAP review screenshot
Apple requires a screenshot of the purchase point. Use the paywall screen
("Unlock all N memories · First 50 free · One-time $0.99 purchase").

---

## ⚠️ Reviewer notes (paste into "Notes" on the submission) — IMPORTANT

App Review must be able to reach and test the $0.99 purchase, but the paywall only appears
after importing a Snapchat export ZIP with MORE THAN 50 photos/videos. The in-app debug
shortcuts are disabled in production builds, so reviewers cannot fake it. Give them a way in:

```
SnapsPort processes a Snapchat "My Data" export ZIP that the user opens via the Share sheet
(Share → SnapsPort) or the in-app file picker.

To test the in-app purchase:
1. Download this sample export ZIP (contains 60+ photos so the paywall appears):
   <PASTE A LINK TO A SAMPLE ZIP YOU HOST — e.g. a Dropbox/Drive/GitHub release link>
2. Open the Files app on the device and tap the ZIP, or use the in-app "Choose ZIP file(s)".
3. In SnapsPort, tap "Choose ZIP file(s)" and select the downloaded ZIP.
4. After scanning, the paywall appears. Tap "Unlock All — $0.99" to test the purchase.

The app saves photos to the device photo library only; nothing is uploaded.
```

TODO before submitting: create a small sample ZIP of 60+ throwaway images named like
`2016-08-15 00-47-02 UTC.jpg` (so the date parser has something to chew on) and host it at a
stable public link. Without this, IAP review is a common rejection.

---

## App Privacy nutrition labels (App Store Connect → App Privacy)

Declare these — reviewers cross-check against the app and privacy policy:

| Data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
|-----------|-----------|---------------------|--------------------|---------|
| Purchases (purchase history) | Yes (via RevenueCat) | Linked to a device identifier, not to real identity | No | App Functionality |
| Identifiers (device / app-user ID) | Yes (via RevenueCat) | Linked | No | App Functionality |
| Photos or Videos | **No** (processed on device, never collected/transmitted) | — | — | — |
| Contact info / Location / Contacts / Usage / Diagnostics | No | — | — | — |

> Verify the exact RevenueCat data types against their current App Privacy guide before
> submitting: https://www.revenuecat.com/docs/app-store-privacy — SDK behavior can change.

---

## Screenshot shot list (6.7", iPhone 16 Pro Max — min 3, recommended 5–6)

Capture on the simulator or device. Suggested order + on-image caption ideas:

1. **Onboarding / 3-step hero** — caption: "Your Snapchat memories, saved forever"
2. **Import screen** ("Choose ZIP file(s)") — caption: "Just open your export ZIP"
3. **Extraction progress** (progress bar + "Extracting ZIP…") — caption: "Handles huge exports"
4. **Processing / paywall** (memories found + unlock card) — caption: "First 50 free"
5. **Saving in progress** (Saved/Remaining/Failed stats) — caption: "Straight to iCloud Photos"
6. **Complete screen** ("All done!") — caption: "Done. Cancel your Snapchat storage."

Tip: the debug shortcuts on the onboarding screen (visible only in a dev build) jump
straight to the processing/paywall and complete screens — handy for capturing shots 4–6
without a real 50+ import.
