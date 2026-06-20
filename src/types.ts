export interface GameInfo {
  title: string;
  url: string;
  redditUrl: string;
  upvotes: number;
  lastSeen: string;
  capsule?: string;
}

export type Games = Record<string, GameInfo>;

export interface ChosenGame extends GameInfo {
  id: string;
}

export type ShowAuthorsGame = "show" | "wishlisted" | "hide";

export interface Settings {
  showDestroyedGames: boolean;
  minimumUpvotes: number;
  showEstimatedRevenue: boolean;
  showEstimatedWishlists: boolean;
  showSteamDb: boolean;
  showGamalytic: boolean;
  showAuthorsGame: ShowAuthorsGame;
}

export interface ChosenGamesResponse {
  games: ChosenGame[];
  settings: Settings;
}

export interface AppDetails {
  name: string | null;
  headerImage: string | null;
}
