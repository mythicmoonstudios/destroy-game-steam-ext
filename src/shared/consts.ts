import { Settings } from "../types";

export const Messages = {
  GetChosenGames: "GET_CHOSEN_GAMES",
  GetAllGames: "GET_ALL_GAMES",
  GetHiddenGames: "GET_HIDDEN_GAMES",
  DeleteGame: "DELETE_GAME",
  UndeleteGame: "UNDELETE_GAME",
  GetSettings: "GET_SETTINGS",
  SaveSettings: "SAVE_SETTINGS",
  GetFollowerCount: "GET_FOLLOWER_COUNT",
  EnrichGame: "ENRICH_GAME",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  showDestroyedGames: true,
  minimumUpvotes: 0,
  showEstimatedRevenue: true,
  showEstimatedWishlists: true,
  showSteamDb: true,
  showGamalytic: true,
  showAuthorsGame: "show",
};

export const UTM_SOURCE = "destroy_games_ext";

export const SPONSORED_GAME = {
  name: "Claw and Conjure",
  url: "https://store.steampowered.com/app/4290080/Claw_and_Conjure/",
  capsule: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4290080/04b361635a54eeec3fb412908fa6d97a6a19e7bc/header.jpg?t=1781103006"
};

export const CAPSULES_ID = "destroy-game-capsules";
export const CALENDAR_SELECTOR = ".personal_calendar_ctn";
export const OBSERVER_DEBOUNCE_MS = 200;

export const APP_STATS_MARKER = "data-dgx-app-stats";
export const APP_PAGE_PATH_REGEX = /^\/app\/(\d+)\//;
export const APP_PAGE_GLANCE_SELECTOR = ".glance_ctn_responsive_left";
export const STEAMDB_BASE_URL = "https://steamdb.info/app/";
export const GAMALYTIC_BASE_URL = "https://gamalytic.com/game/";

// hopefully its impossible, but we might as well be extra sure a link to
// weird hosts cant sneak in
export const ALLOWED_LINK_HOSTS = new Set([
  "store.steampowered.com",
  "www.reddit.com",
  "shared.akamai.steamstatic.com",
  "shared.fastly.steamstatic.com",
  "steamdb.info",
  "gamalytic.com",
]);

export const GAMES_TTL_MINS = 60;
export const GAMES_TO_SHOW = 5;
export const GAMES_DATA_SOURCE = "https://mythicmoonstudios.com/data/steam-app-ids.json";

export const FOLLOWER_TTL_MINS = 60;
export const STEAM_COMMUNITY_MEMBERS_URL = "https://steamcommunity.com/games/";
