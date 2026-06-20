import { Settings } from "../types";
import {
  APP_PAGE_GLANCE_SELECTOR,
  APP_PAGE_PATH_REGEX,
  APP_STATS_MARKER,
  GAMALYTIC_BASE_URL,
  Messages,
  STEAMDB_BASE_URL,
} from "../shared/consts";
import { escapeHtml, sendMessage, toSafeUrl } from "../shared/utils";
import { estimateGrossRevenue, estimateUnitsSold, estimateWishlists, formatCompactCurrency, formatCount } from "./estimates";

const REVIEW_COUNT_REGEX = /of the ([\d,]+) user reviews/i;
const PRICE_REGEX = /\$\s*([\d,]+(?:\.\d+)?)/;

async function getSettings(): Promise<Settings | null> {
  return sendMessage<Settings>({ type: Messages.GetSettings });
}

async function getFollowerCount(appId: string): Promise<number | null> {
  return sendMessage<number | null>({ type: Messages.GetFollowerCount, appId });
}

function getAppId(): string | null {
  const match = location.pathname.match(APP_PAGE_PATH_REGEX);
  return match?.[1] ?? null;
}

function parseReviewCount(): number | null {
  const rows = Array.from(document.querySelectorAll<HTMLElement>(".user_reviews_summary_row"));
  for (const row of rows) {
    const tooltip = row.getAttribute("data-tooltip-html") ?? "";
    const match = tooltip.match(REVIEW_COUNT_REGEX);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
  }
  return null;
}

function parsePrice(): number | null {
  const priceEl = document.querySelector(".game_purchase_price, .discount_final_price");
  const text = priceEl?.textContent ?? "";
  const match = text.match(PRICE_REGEX);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

function parseReleaseInfo(): { year: number | null; isPreLaunch: boolean } {
  const dateText = document.querySelector(".release_date .date")?.textContent?.trim() ?? "";
  const parsed = new Date(dateText);
  if (isNaN(parsed.getTime())) {
    return { year: null, isPreLaunch: true };
  }
  return { year: parsed.getFullYear(), isPreLaunch: parsed.getTime() > Date.now() };
}

function buildStatRow(label: string, value: string, pad: boolean = false): string {
  return `<div class="dev_row" style="margin-top: ${pad ? '8' : '0'}px;">
    <div class="subtitle column">${escapeHtml(label)}</div>
    <div class="summary column">${escapeHtml(value)}</div>
  </div>`;
}

function buildLink(label: string, baseUrl: string, appId: string): string {
  const url = toSafeUrl(`${baseUrl}${appId}`);
  if (!url) return '';

  return `<a href="${escapeHtml(url)}" class="app_tag" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function buildRevenueRow(settings: Settings, releaseYear: number | null): string {
  if (!settings.showEstimatedRevenue) return '';

  const reviewCount = parseReviewCount();
  const price = parsePrice();
  if (reviewCount === null || price === null) return '';

  const units = estimateUnitsSold(reviewCount, releaseYear);
  const revenue = estimateGrossRevenue(units, price);
  return buildStatRow("Est. Revenue:", formatCompactCurrency(revenue), true);
}

async function buildWishlistsRow(settings: Settings, appId: string, isPreLaunch: boolean): Promise<string> {
  if (!settings.showEstimatedWishlists) return '';

  const followerCount = await getFollowerCount(appId);
  if (followerCount === null) return '';

  const wishlists = estimateWishlists(followerCount, isPreLaunch);
  return buildStatRow("Est. Wishlists:", formatCount(wishlists));
}

function buildLinksRow(appId: string, settings: Settings): string {
  const links: string[] = [];

  if (settings.showSteamDb) {
    links.push(buildLink("SteamDB", STEAMDB_BASE_URL, appId));
  }
  if (settings.showGamalytic) {
    links.push(buildLink("Gamalytic", GAMALYTIC_BASE_URL, appId));
  }

  const linksHtml = links.filter(Boolean).join("");
  if (!linksHtml) return '';

  return `<div class="dgx-app-links">${linksHtml}</div>`;
}

export async function renderAppStats(): Promise<void> {
  const appId = getAppId();
  if (!appId) return;

  const glance = document.querySelector(APP_PAGE_GLANCE_SELECTOR);
  if (!glance || glance.hasAttribute(APP_STATS_MARKER)) return;

  const settings = await getSettings();
  if (!settings) return;

  const { year: releaseYear, isPreLaunch } = parseReleaseInfo();

  let rowsHtml = "";
  rowsHtml += buildRevenueRow(settings, releaseYear);
  rowsHtml += await buildWishlistsRow(settings, appId, isPreLaunch);
  rowsHtml += buildLinksRow(appId, settings);

  if (!rowsHtml) return;

  glance.setAttribute(APP_STATS_MARKER, "true");
  glance.insertAdjacentHTML("beforeend", rowsHtml);
}
