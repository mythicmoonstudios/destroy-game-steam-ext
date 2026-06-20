import { ChosenGame, Games, Settings } from "../types";
import { GAMES_DATA_SOURCE, GAMES_TO_SHOW, GAMES_TTL_MINS } from "../shared/consts";

const TTL_MS = GAMES_TTL_MINS * 60 * 1000;

export class GamesService {
  // prefer title from steam, the json titles come from reddit url slug
  private mergePreservingEnrichment(freshGames: Games, existingGames: Games): Games {
    const merged: Games = {};
    for (const id of Object.keys(freshGames)) {
      const fresh = freshGames[id];
      const existing = existingGames[id];
      const title = existing?.title || fresh.title;
      const capsule = existing?.capsule ?? fresh.capsule;
      merged[id] = { ...fresh, title, capsule };
    }
    return merged;
  }

  private async dataIsExpired(): Promise<boolean> {
    const { lastUpdated } = await chrome.storage.local.get('lastUpdated');
    return !lastUpdated || Date.now() - lastUpdated >= TTL_MS;
  }

  private shuffle(ids: string[]): string[] {
    return [...ids].sort(() => Math.random() - 0.5);
  }

  private chooseGames(gamesData: Games): ChosenGame[] {
    const gameIds = this.shuffle(Object.keys(gamesData));
    const chosenGames = gameIds.slice(0, GAMES_TO_SHOW).map(id => ({
      ...gamesData[id],
      id
    }));
    return chosenGames;
  }

  private excludeHidden(gamesData: Games, hiddenGames: Games): Games {
    const result: Games = {};
    for (const id of Object.keys(gamesData)) {
      if (!(id in hiddenGames)) {
        result[id] = gamesData[id];
      }
    }
    return result;
  }

  private async fetchGames(): Promise<Games> {
    const response = await fetch(GAMES_DATA_SOURCE);
    if (!response.ok) throw new Error(`Failed to fetch games data: ${response.statusText}`);
    const gamesData = await response.json();
    return gamesData;
  }

  private async updateGames(): Promise<void> {
    if (!await this.dataIsExpired()) return;
    try {
      const fetchedGames = await this.fetchGames();
      const stored = await chrome.storage.local.get(['hiddenGames', 'games']);
      const { hiddenGames = {}, games: existingGames = {} } = stored;
      const mergedGames = this.mergePreservingEnrichment(fetchedGames, existingGames);
      const games = this.excludeHidden(mergedGames, hiddenGames);
      const lastUpdated = new Date().getTime();
      const chosenGames = this.chooseGames(games);
      await chrome.storage.local.set({ games, lastUpdated, chosenGames });
    } catch (error) {
      console.error('Error updating games data:', error);
    }
  }

  public async enrichGame(id: string, title: string | null, capsule: string | null): Promise<void> {
    const { games = {} } = await chrome.storage.local.get('games');
    const existing = games[id];
    if (!existing) return;
    const updatedTitle = title ?? existing.title;
    const updatedCapsule = capsule ?? existing.capsule;
    games[id] = { ...existing, title: updatedTitle, capsule: updatedCapsule };
    await chrome.storage.local.set({ games });
  }

  private isValid(gameId: string, games: Games, minimumUpvotes: number): boolean {
    if (!gameId || !games[gameId]) return false;
    return games[gameId].upvotes >= minimumUpvotes;
  }

  private fetchValidGame(games: Games, minimumUpvotes: number, excludedIds: string[]): ChosenGame | null {
    const ids = this.shuffle(Object.keys(games));
    for (const id of ids) {
      if (excludedIds.includes(id)) continue;
      if (this.isValid(id, games, minimumUpvotes)) {
        return { ...games[id], id };
      }
    }
    return null;
  }

  public async getChosenGames(settings: Settings): Promise<ChosenGame[]> {
    const { minimumUpvotes: votes, showDestroyedGames } = settings;
    await this.updateGames();
    if (!showDestroyedGames) return [];

    const stored = await chrome.storage.local.get(['games', 'chosenGames']);
    const { games = {}, chosenGames = [] } = stored as { games: Games; chosenGames: ChosenGame[] };
    const takenIds = chosenGames.map(game => game.id);

    const result: ChosenGame[] = [];
    for (let i = 0; i < GAMES_TO_SHOW; i++) {
      const chosen = chosenGames[i];
      const isValid = this.isValid(chosen?.id, games, votes);
      const validGame = isValid ? chosen : this.fetchValidGame(games, votes, takenIds);
      if (validGame) {
        result.push(validGame);
        takenIds.push(validGame.id);
      }
    }

    if (result.length !== chosenGames.length || result.some((game, i) => game.id !== chosenGames[i]?.id)) {
      await chrome.storage.local.set({ chosenGames: result });
    }

    return result;
  }

  public async getAllGames(): Promise<Games> {
    await this.updateGames();
    const { games = {} } = await chrome.storage.local.get('games');
    return games;
  }

  public async getHiddenGames(): Promise<Games> {
    await this.updateGames();
    const { hiddenGames = {} } = await chrome.storage.local.get('hiddenGames');
    return hiddenGames;
  }

  public async deleteGame(id: string): Promise<void> {
    const stored = await chrome.storage.local.get(['games', 'hiddenGames']);
    const { games = {}, hiddenGames = {} } = stored;
    const game = games[id];
    if (!game) return;
    delete games[id];
    hiddenGames[id] = game;
    await chrome.storage.local.set({ games, hiddenGames });
  }

  public async undeleteGame(id: string): Promise<void> {
    const stored = await chrome.storage.local.get(['games', 'hiddenGames']);
    const { games = {}, hiddenGames = {} } = stored;
    const game = hiddenGames[id];
    if (!game) return;
    delete hiddenGames[id];
    games[id] = game;
    await chrome.storage.local.set({ games, hiddenGames });
  }
}
