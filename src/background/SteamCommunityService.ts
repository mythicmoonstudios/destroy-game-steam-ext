import { CacheService } from "./CacheService";
import { FOLLOWER_TTL_MINS, STEAM_COMMUNITY_MEMBERS_URL } from "../shared/consts";

const MEMBER_COUNT_REGEX = /<groupDetails>[\s\S]*?<memberCount>(\d+)<\/memberCount>/i;

export class SteamCommunityService {
  constructor(private cache: CacheService = new CacheService()) {}

  public async getFollowerCount(appId: string): Promise<number | null> {
    const cacheKey = `follower:${appId}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const count = await this.fetchFollowerCount(appId);
      if (count === null) return null;
      await this.cache.set(cacheKey, count, FOLLOWER_TTL_MINS);
      return count;
    } catch (error) {
      console.error("Destroy Game: failed to fetch follower count:", error);
      return null;
    }
  }

  // may not work sometimes, accepted tradeoff
  private async fetchFollowerCount(appId: string): Promise<number | null> {
    const response = await fetch(`${STEAM_COMMUNITY_MEMBERS_URL}${appId}/memberslistxml/?xml=1`);
    if (!response.ok) return null;
    const xml = await response.text();
    const match = xml.match(MEMBER_COUNT_REGEX);
    if (!match) return null;
    return parseInt(match[1], 10);
  }
}
