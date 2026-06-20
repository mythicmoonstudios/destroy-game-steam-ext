import { APP_PAGE_GLANCE_SELECTOR, APP_PAGE_PATH_REGEX, CALENDAR_SELECTOR, OBSERVER_DEBOUNCE_MS } from "../shared/consts";
import { debounce } from "../shared/utils";
import { renderDestroyedGames } from "./renderDestroyedGames";
import { renderAppStats } from "./renderAppStats";

function renderUi(): boolean {
  if (document.querySelector(CALENDAR_SELECTOR)) {
    renderDestroyedGames();
    return true;
  }

  const isAppPath = APP_PAGE_PATH_REGEX.test(location.pathname);
  const glanceFound = !!document.querySelector(APP_PAGE_GLANCE_SELECTOR);
  if (isAppPath && glanceFound) {
    renderAppStats();
    return true;
  }

  return false;
}

const uiRendered = renderUi();

if (!uiRendered) {
  const observer = new MutationObserver(
    debounce(() => {
      if (renderUi()) {
        observer.disconnect();
      }
    }, OBSERVER_DEBOUNCE_MS)
  );
  observer.observe(document.body, { childList: true, subtree: true });
}