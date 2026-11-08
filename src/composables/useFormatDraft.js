import { reactive, computed } from "vue";
import {
  DEFAULT_BANS,
  DEFAULT_BAN_PRESET,
  DEFAULT_PICKS,
  LADDER_KEY,
} from "../draftFormats.js";

const draft = reactive({
  step: 1,
  editingId: null,
  name: "",
  mode: DEFAULT_BAN_PRESET === LADDER_KEY ? "ladder" : "turns",
  bans: DEFAULT_BANS,
  picks: DEFAULT_PICKS,
  heroIds: new Set(),
  mapIds: new Set(),
  initialSnapshot: "",
});

function snapshot() {
  return JSON.stringify({
    name: draft.name,
    mode: draft.mode,
    bans: draft.bans,
    picks: draft.picks,
    heroIds: [...draft.heroIds].sort((a, b) => a - b),
    mapIds: [...draft.mapIds].sort((a, b) => a - b),
  });
}

const isDirty = computed(() => snapshot() !== draft.initialSnapshot);

function resetFields() {
  draft.step = 1;
  draft.editingId = null;
  draft.name = "";
  draft.mode = DEFAULT_BAN_PRESET === LADDER_KEY ? "ladder" : "turns";
  draft.bans = DEFAULT_BANS;
  draft.picks = DEFAULT_PICKS;
  draft.heroIds = new Set();
  draft.mapIds = new Set();
}

export function useFormatDraft() {
  function startDraft(existing, allMapIds) {
    resetFields();

    if (existing) {
      const maps = existing.allowedMapIds;
      draft.editingId = existing.id;
      draft.name = existing.name;
      draft.mode = existing.banPreset === LADDER_KEY ? "ladder" : "turns";
      draft.bans = existing.bans ?? DEFAULT_BANS;
      draft.picks = existing.picks ?? DEFAULT_PICKS;
      draft.heroIds = new Set(existing.allowedHeroIds);
      draft.mapIds = new Set(maps.includes("all") ? allMapIds : maps);
    }

    draft.initialSnapshot = snapshot();
  }

  function clearDraft() {
    resetFields();
    draft.initialSnapshot = snapshot();
  }

  return { draft, isDirty, startDraft, clearDraft };
}
