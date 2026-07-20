// src/utils/gaAnalytics.js

/**
 * Внутрішній хелпер, щоб не дублювати перевірку window.gtag
 */
function sendEvent(eventName, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/**
 * Трекінг перегляду екранів (сторінок)
 */
export function trackPageView(newScreen) {
  sendEvent("page_view", {
    page_title: `Screen: ${newScreen}`,
    page_path: `/${newScreen}`,
  });
}

/**
 * Фінальний збір та відправка даних драфту перед переходом на карти
 */
export function trackProceedToMaps() {
  try {
    const localState = JSON.parse(
      localStorage.getItem("unmatched_draft_state_v4") || "{}",
    );

    const playerBans = localState.playerBans || [];
    const opponentBans = localState.opponentBans || [];
    const playerPicks = localState.playerPicks || [];
    const opponentPicks = localState.opponentPicks || [];

    const postBansPlayerIds = localState.postBansPlayer || [];
    const postBansOpponentIds = localState.postBansOpponent || [];

    // 1. Пре-бани
    playerBans.forEach((char) =>
      sendEvent("hero_banned", {
        character_name: char.name,
        banned_by: "pre_ban",
      }),
    );
    opponentBans.forEach((char) =>
      sendEvent("hero_banned", {
        character_name: char.name,
        banned_by: "pre_ban",
      }),
    );

    // 2. Піки, пост-бани та фінал матчу для Player
    playerPicks.forEach((char) => {
      sendEvent("hero_picked_total", { character_name: char.name });
      if (postBansPlayerIds.includes(char.id)) {
        sendEvent("hero_banned", {
          character_name: char.name,
          banned_by: "post_draft_click",
        });
      } else {
        sendEvent("hero_final_match", { character_name: char.name });
      }
    });

    // 3. Піки, пост-бани та фінал матчу для Opponent
    opponentPicks.forEach((char) => {
      sendEvent("hero_picked_total", { character_name: char.name });
      if (postBansOpponentIds.includes(char.id)) {
        sendEvent("hero_banned", {
          character_name: char.name,
          banned_by: "post_draft_click",
        });
      } else {
        sendEvent("hero_final_match", { character_name: char.name });
      }
    });
  } catch (e) {
    console.error("Помилка відправки даних в GA4 з localState:", e);
  }
}
