import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Get this from https://app.revenuecat.com → Project → API Keys → iOS
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// Must match the entitlement identifier you create in the RevenueCat dashboard
const ENTITLEMENT_ID = 'unlock';

export function initRevenueCat() {
  if (!RC_API_KEY_IOS) {
    console.warn('RevenueCat API key not set — purchases disabled');
    return;
  }
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}

export async function checkUnlockStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export type PurchaseResult =
  | 'purchased' // entitlement is active
  | 'cancelled' // user backed out — no charge occurred
  | 'unverified'; // purchase call resolved but entitlement isn't active (may have charged)

export async function purchaseUnlock(): Promise<PurchaseResult> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages?.[0];
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
