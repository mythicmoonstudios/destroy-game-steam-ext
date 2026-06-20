import { Games, GameInfo, Settings, ShowAuthorsGame } from "../types";
import { DEFAULT_SETTINGS, Messages, SPONSORED_GAME, UTM_SOURCE } from "../shared/consts";
import { escapeHtml, formatUpdated, sendMessage, toSafeUrl } from "../shared/utils";
import {
  lucideTrashIcon,
  lucideExternalLinkIcon,
  lucideHomeIcon,
  lucideSettingsIcon,
  lucideRestoreIcon,
  lucideUpIcon,
  lucideHeartIcon,
  lucideHeartCrackIcon,
} from "../shared/icons";

type Tab = "home" | "trash" | "settings";
type Game = GameInfo & { id: string };

const TAB_ICONS: Record<Tab, () => string> = {
  home: lucideHomeIcon,
  trash: lucideTrashIcon,
  settings: lucideSettingsIcon,
};

function sortByLastSeenDesc(games: Games): Game[] {
  return Object.entries(games)
    .map(([id, game]) => ({ ...game, id }))
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
}

function buildGameRow(game: Game, actionHtml: string, showLink: boolean): string {
  const gameUrl = toSafeUrl(game.url, UTM_SOURCE);
  const redditUrl = toSafeUrl(game.redditUrl, UTM_SOURCE);

  let linkHtml = "";
  if (showLink) {
    if (gameUrl) {
      linkHtml = `<a class="icon-btn" href="${escapeHtml(gameUrl)}" target="_blank" rel="noopener noreferrer" title="View on Steam">${lucideExternalLinkIcon()}</a>`;
    } else {
      console.warn("Destroy Game: rejected game URL", game.url);
    }
  }

  let upvoteHtml = `<span class="row-upvote">${lucideUpIcon()}<span>${game.upvotes}</span></span>`;
  if (redditUrl) {
    upvoteHtml = `<a class="row-upvote" href="${escapeHtml(redditUrl)}" target="_blank" rel="noopener noreferrer" title="View on Reddit">${lucideUpIcon()}<span>${game.upvotes}</span></a>`;
  } else {
    console.warn("Destroy Game: rejected reddit URL", game.redditUrl);
  }

  return `
    <li class="row" data-id="${escapeHtml(game.id)}">
      ${upvoteHtml}
      <span class="row-info">
        <span class="row-title">${escapeHtml(game.title)}</span>
        <span class="row-meta">${formatUpdated(game.lastSeen)}</span>
      </span>
      <span class="row-actions">${actionHtml}${linkHtml}</span>
    </li>
  `;
}

async function renderHome(list: HTMLElement): Promise<void> {
  const games = await sendMessage<Games>({ type: Messages.GetAllGames });
  const rows = sortByLastSeenDesc(games ?? {})
    .map(game => buildGameRow(game, `<button class="icon-btn delete-btn" data-id="${escapeHtml(game.id)}" title="Delete">${lucideTrashIcon()}</button>`, true))
    .join("");
  list.innerHTML = rows;

  list.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id) return;
      await sendMessage({ type: Messages.DeleteGame, id });
      renderHome(list);
    });
  });
}

async function renderTrash(list: HTMLElement): Promise<void> {
  const hiddenGames = await sendMessage<Games>({ type: Messages.GetHiddenGames });
  const sortedGames = sortByLastSeenDesc(hiddenGames ?? {});
  if (sortedGames.length === 0) {
    list.innerHTML = `<div class="empty-state">No deleted games found.</div>`;
    return;
  }

  const rows = sortedGames
    .map(game => buildGameRow(game, `<button class="icon-btn restore-btn" data-id="${escapeHtml(game.id)}" title="Restore">${lucideRestoreIcon()}</button>`, false))
    .join("");
  list.innerHTML = rows;

  list.querySelectorAll<HTMLButtonElement>(".restore-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!id) return;
      await sendMessage({ type: Messages.UndeleteGame, id });
      renderTrash(list);
    });
  });
}

function getInput(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function getSelect(id: string): HTMLSelectElement {
  return document.getElementById(id) as HTMLSelectElement;
}

function getSettingsControls() {
  return {
    showDestroyedGames: getInput("setting-show-destroyed-games"),
    minimumUpvotes: getInput("setting-minimum-upvotes"),
    showEstimatedRevenue: getInput("setting-show-estimated-revenue"),
    showEstimatedWishlists: getInput("setting-show-estimated-wishlists"),
    showSteamDb: getInput("setting-show-steam-db"),
    showGamalytic: getInput("setting-show-gamalytic"),
    showAuthorsGame: getSelect("setting-show-authors-game"),
  };
}

const settingsControls = getSettingsControls();

function applySettingsToControls(settings: Settings): void {
  settingsControls.showDestroyedGames.checked = settings.showDestroyedGames;
  settingsControls.minimumUpvotes.value = String(settings.minimumUpvotes);
  settingsControls.showEstimatedRevenue.checked = settings.showEstimatedRevenue;
  settingsControls.showEstimatedWishlists.checked = settings.showEstimatedWishlists;
  settingsControls.showSteamDb.checked = settings.showSteamDb;
  settingsControls.showGamalytic.checked = settings.showGamalytic;
  settingsControls.showAuthorsGame.value = settings.showAuthorsGame;
}

function readSettingsFromControls(): Settings {
  return {
    showDestroyedGames: settingsControls.showDestroyedGames.checked,
    minimumUpvotes: Math.max(0, Number(settingsControls.minimumUpvotes.value) || 0),
    showEstimatedRevenue: settingsControls.showEstimatedRevenue.checked,
    showEstimatedWishlists: settingsControls.showEstimatedWishlists.checked,
    showSteamDb: settingsControls.showSteamDb.checked,
    showGamalytic: settingsControls.showGamalytic.checked,
    showAuthorsGame: settingsControls.showAuthorsGame.value as ShowAuthorsGame,
  };
}

async function saveSettings(): Promise<void> {
  const settings = readSettingsFromControls();
  await sendMessage({ type: Messages.SaveSettings, settings });
  renderSettingsPromo(settings.showAuthorsGame);
}

function renderSettingsPromo(showAuthorsGame: ShowAuthorsGame): void {
  document.querySelectorAll<HTMLElement>("[data-promo]").forEach(state => {
    state.hidden = state.dataset.promo !== showAuthorsGame;
  });
}

async function initSettings(): Promise<void> {
  const settings = (await sendMessage<Settings>({ type: Messages.GetSettings })) ?? DEFAULT_SETTINGS;
  applySettingsToControls(settings);
  renderSettingsPromo(settings.showAuthorsGame);

  Object.values(settingsControls).forEach(control => {
    control.addEventListener("change", saveSettings);
  });
}

const homeList = document.getElementById("home-list");
const trashList = document.getElementById("trash-list");

function showTab(tab: Tab): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("tab-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll<HTMLElement>(".panel").forEach(panel => {
    panel.hidden = panel.dataset.panel !== tab;
  });

  if (tab === "home" && homeList) {
    renderHome(homeList);
  } else if (tab === "trash" && trashList) {
    renderTrash(trashList);
  }
}

function initPromo(): void {
  const link = document.querySelector<HTMLAnchorElement>(".settings-promo-link");
  const img = document.querySelector<HTMLImageElement>(".settings-promo-img");
  const promoUrl = toSafeUrl(SPONSORED_GAME.url, UTM_SOURCE);
  if (link && promoUrl) link.href = promoUrl;
  if (img) {
    img.src = SPONSORED_GAME.capsule;
    img.alt = SPONSORED_GAME.name;
  }

  document.querySelector("[data-promo='wishlisted'] svg")!.outerHTML = lucideHeartIcon();
  document.querySelector("[data-promo='hide'] svg")!.outerHTML = lucideHeartCrackIcon();
}

document.querySelectorAll<HTMLButtonElement>(".tab").forEach(btn => {
  const tab = btn.dataset.tab as Tab;
  const svg = btn.querySelector("svg");
  if (svg) {
    svg.outerHTML = TAB_ICONS[tab]();
  }
  btn.addEventListener("click", () => showTab(tab));
});

showTab("home");
initSettings();
initPromo();
