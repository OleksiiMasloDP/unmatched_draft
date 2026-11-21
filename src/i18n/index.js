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
import { chupacabraText } from "./heroes/chupacabra.js";
import { draculaText } from "./heroes/dracula.js";
import { hamletText } from "./heroes/hamlet.js";
import { lukeCageText } from "./heroes/lukeCage.js";
import { sheHulkText } from "./heroes/sheHulk.js";
import { annieChristmasText } from "./heroes/annieChristmas.js";
import { kingArthurText } from "./heroes/kingArthur.js";
import { medusaText } from "./heroes/medusa.js";
import { deadmanDannyText } from "./heroes/deadmanDanny.js";
import { odaNobunagaText } from "./heroes/odaNobunaga.js";
import { invisibleManText } from "./heroes/invisibleMan.js";
import { jillText } from "./heroes/jill.js";
import { raptorsText } from "./heroes/raptors.js";
import { robinHoodText } from "./heroes/robinHood.js";
import { wyattText } from "./heroes/wyatt.js";
import { combatText } from "./combat.js";
import { setupText } from "./setup.js";
import { tokensText } from "./tokens.js";
import { botEditorText } from "./botEditor.js";
import { rogueText } from "./rogue.js";

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
  chupacabraText,
  draculaText,
  hamletText,
  lukeCageText,
  sheHulkText,
  annieChristmasText,
  kingArthurText,
  medusaText,
  deadmanDannyText,
  odaNobunagaText,
  houdiniText,
  invisibleManText,
  jillText,
  raptorsText,
  robinHoodText,
  wyattText,
  combatText,
  setupText,
  tokensText,
  botEditorText,
  rogueText,
];

export const translations = { en: {}, ua: {} };

for (const part of parts) {
  Object.assign(translations.en, part.en);
  Object.assign(translations.ua, part.ua);
}
