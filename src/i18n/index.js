import { draftText } from "./draft.js";
import { guidesText } from "./guides.js";
import { formatsText } from "./formats.js";
import { packDraftText } from "./packDraft.js";
import { gameText } from "./game.js";
import { onlineText } from "./online.js";
import { gameLogText } from "./gameLog.js";
import { botText } from "./bot.js";
import { blackPantherText } from "./heroes/blackPanther.js";
import { houdiniText } from "./heroes/houdini.js";
import { jillText } from "./heroes/jill.js";
import { raptorsText } from "./heroes/raptors.js";
import { robinHoodText } from "./heroes/robinHood.js";
import { wyattText } from "./heroes/wyatt.js";
import { combatText } from "./combat.js";
import { setupText } from "./setup.js";
import { tokensText } from "./tokens.js";
import { botEditorText } from "./botEditor.js";

const parts = [
  draftText,
  guidesText,
  formatsText,
  packDraftText,
  gameText,
  onlineText,
  gameLogText,
  botText,
  blackPantherText,
  houdiniText,
  jillText,
  raptorsText,
  robinHoodText,
  wyattText,
  combatText,
  setupText,
  tokensText,
  botEditorText,
];

export const translations = { en: {}, ua: {} };

for (const part of parts) {
  Object.assign(translations.en, part.en);
  Object.assign(translations.ua, part.ua);
}
