<template>
  <div class="rhist" @click.self="emit('close')">
    <div class="rhist-box">
      <div class="rhist-head">
        <h3>
          <RogueIcon name="trophy" metal="gold" size="1.2em" />
          {{ t("rogueBest") }}
        </h3>
        <button type="button" class="rhist-close" @click="emit('close')">
          ×
        </button>
      </div>
      <div class="rhist-tabs">
        <button :class="{ active: tab === 'best' }" @click="tab = 'best'">
          {{ t("rogueHistoryBest") }}
        </button>
        <button :class="{ active: tab === 'recent' }" @click="tab = 'recent'">
          {{ t("rogueHistoryRecent") }}
        </button>
      </div>
      <p v-if="!rows.length" class="rhist-empty">
        {{ t("rogueHistoryEmpty") }}
      </p>
      <div v-else class="rhist-scroll">
        <table class="rhist-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ t("rogueHistoryHero") }}</th>
              <th></th>
              <th>{{ t("rogueHistoryWins") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="row.date">
              <td>{{ index + 1 }}</td>
              <td class="rhist-hero">
                <div class="rhist-hero-in">
                  <img :src="assetUrl(row.image)" alt="" />
                  <span>{{ row.name }}</span>
                </div>
              </td>
              <td>
                <span class="rhist-badge" :class="{ win: row.victory }">
                  <RogueIcon
                    :name="row.victory ? 'laurels' : 'skullCrossedBones'"
                    :metal="row.victory ? 'gold' : 'ruby'"
                    size="1.1em"
                  />
                </span>
              </td>
              <td>
                <b>{{ row.wins }}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { getHero } from "../gameDecks";
import { packDraftHeroes } from "../packDraftData";
import RogueIcon from "./RogueIcon.vue";

const props = defineProps({
  history: { type: Array, required: true },
});

const emit = defineEmits(["close"]);
const { t, lang } = useDraftState();
const tab = ref("best");

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path || ""}`;
const formatDate = (value) =>
  new Date(value).toLocaleDateString(lang.value === "ua" ? "uk-UA" : "en-GB", {
    day: "2-digit",
    month: "short",
  });

const rows = computed(() => {
  const list = props.history.map((entry) => ({
    ...entry,
    name: getHero(entry.hero)?.name || entry.hero,
    image: packDraftHeroes.find((hero) => hero.id === entry.hero)?.image,
  }));
  if (tab.value === "recent") return list.slice(0, 10);
  return [...list]
    .sort(
      (a, b) =>
        Number(b.victory) - Number(a.victory) ||
        b.wins - a.wins ||
        b.date - a.date,
    )
    .slice(0, 10);
});
</script>

<style scoped>
.rhist {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.75);
}

.rhist-box {
  width: min(1040px, 100%);
  max-height: 94vh;
  overflow-y: auto;
  padding: 16px;
  border: 2px solid #8a6c43;
  border-radius: 16px;
  background: #151a22;
}

.rhist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rhist-head h3 {
  margin: 0;
}

.rhist-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}

.rhist-tabs {
  display: flex;
  gap: 6px;
  margin: 12px 0;
}

.rhist-tabs button {
  padding: 5px 14px;
  border: 1px solid #8a6c43;
  border-radius: 999px;
  background: none;
  color: #ffecc8;
  font-size: 0.8rem;
  cursor: pointer;
}

.rhist-tabs button.active {
  background: #8a6c43;
  color: #1b130a;
  font-weight: 800;
}

.rhist-empty {
  color: var(--text-dim);
}

.rhist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.rhist-table th {
  padding: 6px 8px;
  border-bottom: 1px solid #8a6c43;
  color: #d9b878;
  font-size: 0.7rem;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rhist-table td,
.rhist-table th {
  white-space: nowrap;
}

.rhist-table td {
  padding: 7px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.rhist-table tbody tr:first-child td {
  background: rgba(246, 201, 69, 0.08);
}

.rhist-hero {
  font-weight: 700;
}

.rhist-hero-in {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rhist-hero img {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  border: 2px solid #8a6c43;
}

.rhist-badge {
  color: #ff7b8f;
  font-weight: 700;
  white-space: nowrap;
}

.rhist-badge.win {
  color: #f6c945;
}

.rhist-date {
  color: var(--text-dim);
  white-space: nowrap;
}

@media (max-width: 560px) {
  .rhist {
    padding: 8px;
  }

  .rhist-box {
    padding: 12px;
  }
}

.rhist-scroll {
  overflow-x: auto;
}

.rhist-table {
  min-width: 380px;
}

.rhist-table th:nth-child(1),
.rhist-table td:nth-child(1),
.rhist-table th:nth-child(2),
.rhist-table td:nth-child(2) {
  position: sticky;
  z-index: 1;
  background: #151a22;
}

.rhist-table th:nth-child(1),
.rhist-table td:nth-child(1) {
  left: 0;
  width: 32px;
  min-width: 32px;
}

.rhist-table th:nth-child(2),
.rhist-table td:nth-child(2) {
  left: 32px;
  width: 150px;
  min-width: 150px;
  max-width: 150px;
}

.rhist-table tbody tr:first-child td:nth-child(1),
.rhist-table tbody tr:first-child td:nth-child(2) {
  background: #25251f;
}

.rhist-hero span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
