const MODERN_RELEASE_YEAR_CUTOFF = 2020;
const MODERN_REVIEW_MULTIPLIER = 30;
const CLASSIC_REVIEW_MULTIPLIER = 50;
const PRE_LAUNCH_FOLLOWER_MULTIPLIER = 10;
const POST_LAUNCH_FOLLOWER_MULTIPLIER = 5;

export function getUnitsMultiplier(releaseYear: number | null): number {
  if (releaseYear !== null && releaseYear >= MODERN_RELEASE_YEAR_CUTOFF) {
    return MODERN_REVIEW_MULTIPLIER;
  }
  return CLASSIC_REVIEW_MULTIPLIER;
}

export function estimateUnitsSold(reviewCount: number, releaseYear: number | null): number {
  return reviewCount * getUnitsMultiplier(releaseYear);
}

export function estimateGrossRevenue(units: number, price: number): number {
  return units * price;
}

export function getWishlistMultiplier(isPreLaunch: boolean): number {
  if (isPreLaunch) {
    return PRE_LAUNCH_FOLLOWER_MULTIPLIER;
  }
  return POST_LAUNCH_FOLLOWER_MULTIPLIER;
}

export function estimateWishlists(followers: number, isPreLaunch: boolean): number {
  return followers * getWishlistMultiplier(isPreLaunch);
}

export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatCount(count: number): string {
  return Math.round(count).toLocaleString("en-US");
}
