interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  public async get<T>(key: string): Promise<T | null> {
    const stored = await chrome.storage.session.get(key);
    const entry: CacheEntry<T> | undefined = stored[key];
    if (!entry || Date.now() >= entry.expiresAt) return null;
    return entry.value;
  }

  public async set<T>(key: string, value: T, ttlMins: number): Promise<void> {
    const expiresAt = Date.now() + ttlMins * 60 * 1000;
    const entry: CacheEntry<T> = { value, expiresAt };
    await chrome.storage.session.set({ [key]: entry });
  }
}
