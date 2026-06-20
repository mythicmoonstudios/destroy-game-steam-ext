import { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../shared/consts";

export class SettingsService {
  public async getSettings(): Promise<Settings> {
    const { settings } = await chrome.storage.local.get("settings");
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  public async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ settings });
  }
}
