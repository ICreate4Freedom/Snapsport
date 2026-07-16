import Purchases, { LOG_LEVEL, CustomerInfoUpdateListener } from 'react-native-purchases';

// Get this from https://app.revenuecat.com → Project → API Keys → iOS
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// Must match the entitlement identifier you create in the RevenueCat dashboard
const ENTITLEMENT_ID = 'unlock';

// Store product ids that grant the unlock. The offering should contain exactly
// one purchasable package, but selecting it by index is nondeterministic — a
// stray extra package (e.g. a leftover test product, or a future tier) could sit
// at [0]. Match the package by its product id instead. Ids differ per store:
// the App Store product vs the RevenueCat Test Store product used in dev.
const UNLOCK_PRODUCT_IDS = ['snapsport_unlock', 'unlock_all_test'];

export function initRevenueCat() {
  if (!RC_API_KEY_IOS) {
    console.warn('RevenueCat API key not set — purchases disabled');
    return;
  }
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}

export type UnlockStatus = 'active' | 'inactive' | 'unknown';

export async function checkUnlockStatus(): Promise<UnlockStatus> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] ? 'active' : 'inactive';
  } catch (err) {
    // A failed check is NOT proof of "not purchased" — a returning paid user must
    // not be shoved behind the paywall because a network hiccup broke the lookup.
    // Report 'unknown'; addUnlockListener grants access once the SDK can refresh.
    console.warn('checkUnlockStatus failed:', err);
    return 'unknown';
  }
}

// Grants access whenever RevenueCat refreshes CustomerInfo and the entitlement is
// active — covers network recovery after a failed startup check, a restore, or a
// purchase made on another device, without requiring an app relaunch. Grant-only
// by design: never revokes here, to avoid a transient empty refresh downgrading a
// paying user mid-session. Returns an unsubscribe function.
export function addUnlockListener(onActive: () => void): () => void {
  const listener: CustomerInfoUpdateListener = (info) => {
    if (info.entitlements.active[ENTITLEMENT_ID]) onActive();
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export type PurchaseResult =
  | 'purchased' // entitlement is active
  | 'cancelled' // user backed out — no charge occurred
  | 'unverified'; // purchase call resolved but entitlement isn't active (may have charged)

export async function purchaseUnlock(): Promise<PurchaseResult> {
  const offerings = await Purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  // Prefer the package whose product is our unlock; fall back to the first only
  // if the offering is configured with something we don't recognize.
  const pkg =
    packages.find((p) => UNLOCK_PRODUCT_IDS.includes(p.product.identifier)) ?? packages[0];
  if (!pkg) throw new Error('No offerings configured in RevenueCat dashboard.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    // Only a genuine user cancel throws with userCancelled. If we get here the
    // purchase call completed, so a charge may have occurred — never treat a
    // missing entitlement as a cancel.
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ? 'purchased' : 'unverified';
  } catch (err: any) {
    if (err?.userCancelled) return 'cancelled';
    throw err;
  }
}

export async function restoreUnlock(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}
