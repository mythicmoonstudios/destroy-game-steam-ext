import { GamesService } from "./GamesService";
import { SettingsService } from "./SettingsService";
import { SteamCommunityService } from "./SteamCommunityService";
import { Messages } from "../shared/consts";

const gamesService = new GamesService();
const settingsService = new SettingsService();
const steamCommunityService = new SteamCommunityService();

async function getChosenGamesResponse() {
  const settings = await settingsService.getSettings();
  const games = await gamesService.getChosenGames(settings);
  return { games, settings };
}

async function handleMessage(message: any) {
  switch (message?.type) {
    case Messages.GetChosenGames:
      return getChosenGamesResponse();
    case Messages.GetAllGames:
      return gamesService.getAllGames();
    case Messages.GetHiddenGames:
      return gamesService.getHiddenGames();
    case Messages.DeleteGame:
      return gamesService.deleteGame(message.id);
    case Messages.UndeleteGame:
      return gamesService.undeleteGame(message.id);
    case Messages.GetSettings:
      return settingsService.getSettings();
    case Messages.SaveSettings:
      return settingsService.saveSettings(message.settings);
    case Messages.GetFollowerCount:
      return steamCommunityService.getFollowerCount(message.appId);
    case Messages.EnrichGame:
      return gamesService.enrichGame(message.id, message.title, message.capsule);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!Object.values(Messages).includes(message?.type)) return;
  handleMessage(message).then((result) => {
    // ensure promise<void> messages return true for consistency.
    const res = result === undefined ? true : result;
    sendResponse(res);
  });
  return true;
});
