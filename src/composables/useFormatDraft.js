import { reactive, computed } from "vue";
import { DEFAULT_BAN_PRESET } from "../draftFormats.js";

// Чернетка власного формату, яку користувач заповнює у два кроки
// (1 — назва, схема банів і герої, 2 — мапи). Живе лише в памʼяті:
// між кроками дані зберігаються, а при виході зі сторінки (за згодою
// користувача) або після збереження — повністю очищаються.
const draft = reactive({
  step: 1,
  editingId: null,
  name: "",
  banPreset: DEFAULT_BAN_PRESET,
  heroIds: new Set(),
  mapIds: new Set(),
  initialSnapshot: "",
});

function snapshot() {
  return JSON.stringify({
    name: draft.name,
    banPreset: draft.banPreset,
    heroIds: [...draft.heroIds].sort((a, b) => a - b),
    mapIds: [...draft.mapIds].sort((a, b) => a - b),
  });
}

const isDirty = computed(() => snapshot() !== draft.initialSnapshot);

function resetFields() {
  draft.step = 1;
  draft.editingId = null;
  draft.name = "";
  draft.banPreset = DEFAULT_BAN_PRESET;
  draft.heroIds = new Set();
  draft.mapIds = new Set();
}

export function useFormatDraft() {
  // existing — збережений формат (редагування) або null (створення).
  // allMapIds потрібен, щоб розгорнути старі формати з allowedMapIds: ["all"].
  function startDraft(existing, allMapIds) {
    resetFields();

    if (existing) {
      const maps = existing.allowedMapIds;
      draft.editingId = existing.id;
      draft.name = existing.name;
      draft.banPreset = existing.banPreset;
      draft.heroIds = new Set(existing.allowedHeroIds);
      draft.mapIds = new Set(maps.includes("all") ? allMapIds : maps);
    }

    draft.initialSnapshot = snapshot();
  }

  // Повне очищення пам'яті: поля, крок і знімок для порівняння
  function clearDraft() {
    resetFields();
    draft.initialSnapshot = snapshot();
  }

  return { draft, isDirty, startDraft, clearDraft };
}
