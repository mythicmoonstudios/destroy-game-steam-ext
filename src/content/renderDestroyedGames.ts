import { AppDetails, ChosenGame, ChosenGamesResponse, ShowAuthorsGame } from "../types";
import { CALENDAR_SELECTOR, CAPSULES_ID, DEFAULT_SETTINGS, Messages, SPONSORED_GAME, UTM_SOURCE } from "../shared/consts";
import { escapeHtml, sendMessage, toSafeUrl } from "../shared/utils";
import { lucideUpIcon } from "../shared/icons";

async function getChosenGames(): Promise<ChosenGamesResponse> {
  const response = await sendMessage<ChosenGamesResponse>({ type: Messages.GetChosenGames });
  return response ?? { games: [], settings: DEFAULT_SETTINGS };
}

async function fetchAppDetails(appId: string): Promise<AppDetails> {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    if (!response.ok) {
      return { name: null, headerImage: null };
    }
    const data = await response.json();
    const appData = data?.[appId]?.data;
    return { name: appData?.name ?? null, headerImage: appData?.header_image ?? null };
  } catch (error) {
    console.warn(`Destroy Game: failed to fetch app details for appid ${appId}`, error);
    return { name: null, headerImage: null };
  }
}

async function enrichGame(id: string, title: string | null, capsule: string | null): Promise<void> {
  await sendMessage({ type: Messages.EnrichGame, id, title, capsule });
}

function buildUpvoteBadge(game: ChosenGame): string {
  const redditUrl = toSafeUrl(game.redditUrl, UTM_SOURCE);
  if (!redditUrl) {
    console.warn("Destroy Game: rejected reddit URL", game.redditUrl);
    return '';
  }

  const upvotes = Number(game.upvotes) || 0;
  return `<a class="dgx-capsule-upvotes" href="${escapeHtml(redditUrl)}" target="_blank" rel="noopener noreferrer">${lucideUpIcon()}<span>${upvotes}</span></a>`;
}

function buildCapsule(game: ChosenGame, imageUrl: string | null): string {
  const gameUrl = toSafeUrl(game.url, UTM_SOURCE);
  if (!gameUrl) return '';

  const safeImageUrl = imageUrl && toSafeUrl(imageUrl);
  if (!safeImageUrl) return '';

  return `
    <div class="dgx-capsule">
      <a class="dgx-capsule-link" href="${escapeHtml(gameUrl)}" target="_blank" rel="noopener noreferrer"
         data-ds-appid="${escapeHtml(game.id)}">
         <img class="dgx-capsule-img" src="${escapeHtml(safeImageUrl)}">
      </a>
      ${buildUpvoteBadge(game)}
    </div>
  `;
}

function buildFooter(showAuthorsGame: ShowAuthorsGame): string {
  if (showAuthorsGame !== "show") return '';

  const footerUrl = toSafeUrl(SPONSORED_GAME.url, UTM_SOURCE);
  if (!footerUrl) return ''; // theortically never happens

  return `
    <div class="dgx-footer">
      Destroyed games brought to you by
      <a class="dgx-footer-link" href="${escapeHtml(footerUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(SPONSORED_GAME.name)}</a>
    </div>
  `;
}

async function getCapsuleImage(game: ChosenGame): Promise<string | null> {
  if (game.capsule) return game.capsule;
  const details = await fetchAppDetails(game.id);
  if (details.name || details.headerImage) {
    void enrichGame(game.id, details.name, details.headerImage);
  }
  return details.headerImage;
}

async function buildCapsules(games: ChosenGame[], showAuthorsGame: ShowAuthorsGame): Promise<HTMLDivElement> {
  const imageUrls = await Promise.all(games.map(getCapsuleImage));
  const capsules = games.map((game, i) => buildCapsule(game, imageUrls[i])).join("");

  const container = document.createElement("div");
  container.id = CAPSULES_ID;
  container.className = "dgx-capsules";
  container.innerHTML = `
    <div class="home_pagecontent_ctn">
      <div class="title_grid">
        <div class="home_section_title" id="home_destroyed_games" role="heading" aria-level="2">Destroyed Games</div>
      </div>
      <div class="dgx-capsule-row">${capsules}</div>
      ${buildFooter(showAuthorsGame)}
    </div>
  `;

  return container;
}

export async function renderDestroyedGames(): Promise<void> {
  if (document.getElementById(CAPSULES_ID)) return;
  const { games, settings } = await getChosenGames();
  if (games.length === 0) return;
  const calendar = document.querySelector(CALENDAR_SELECTOR);
  if (!calendar) return;
  calendar.before(await buildCapsules(games, settings.showAuthorsGame));
}
