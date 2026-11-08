// Тексти редактора форматів: окремий вибір кількості банів і піків.
import { translations } from "./i18n.js";

Object.assign(translations.en, {
  formatModeLabel: "Draft mode",
  formatModeTurns: "Turns (bans and picks)",
  formatModeLadder: "Ladder",
  formatBansLabel: "Bans (per player)",
  formatPicksLabel: "Picks (per player)",
  formatNoBans: "No bans",
  formatsSchemeBansPicks: "{bans} bans / {picks} picks",
  formatsSchemeNoBans: "No bans / {picks} picks",
});

Object.assign(translations.ua, {
  formatModeLabel: "Режим драфту",
  formatModeTurns: "По черзі (бани та піки)",
  formatModeLadder: "Ladder",
  formatBansLabel: "Бани (на гравця)",
  formatPicksLabel: "Піки (на гравця)",
  formatNoBans: "Без банів",
  formatsSchemeBansPicks: "{bans} банів / {picks} піків",
  formatsSchemeNoBans: "Без банів / {picks} піків",
});
