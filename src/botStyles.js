export const BOT_STYLES = Object.freeze({
  NEUTRAL: "neutral",
  PASS: "pass",
  PRESSURE: "pressure",
});

export const BOT_STYLE_INFO = Object.freeze({
  neutral: "No bias: balances attacks, schemes and maneuvers by value.",
  pass: "Prefers passes (actions that give no action and draw no card): attack and retreat, plays for fatigue.",
  pressure:
    "Always pushes: attacks often, draws cards and chains actions, mostly ignores fatigue.",
});
