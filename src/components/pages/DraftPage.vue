<template>
  <div class="container py-3 py-md-4">
    <Disclaimer
      title-key="charDisclaimerTitle"
      text-key="charDisclaimerText"
      storage-key="disclaimer_characters_dismissed"
    />
    <div class="top-wrap" :class="{ 'sticky-active': isPicking }">
      <div
        class="turn-banner"
        :style="{
          background: turnColor,
          boxShadow: '0 0 20px ' + turnColor + '44',
        }"
      >
        {{ currentTurnText }}
      </div>

      <div class="controls-row">
        <input
          v-model="search"
          class="form-control form-control-sm search-field"
          :placeholder="t('searchPlaceholder')"
        />

        <div class="custom-select-wrapper">
          <select v-model="currentFormat" @change="saveToStorage">
            <option
              v-for="(fData, fKey) in availableFormats"
              :key="fKey"
              :value="fKey"
            >
              {{ fData.name }}
            </option>
          </select>
        </div>

        <div v-if="!isSimultaneous" class="custom-select-wrapper">
          <select v-model="firstPicker" @change="saveToStorage">
            <option value="player">{{ t("userFirst") }}</option>
            <option value="opponent">{{ t("opponentFirst") }}</option>
          </select>
        </div>
        <div v-else-if="isLadderPicking" class="custom-select-wrapper">
          <select v-model="ladderSort">
            <option value="average">{{ t("ladderSortAverage") }}</option>
            <option value="worst">{{ t("ladderSortWorst") }}</option>
            <option value="name">{{ t("ladderSortName") }}</option>
          </select>
        </div>

        <!--
        <div class="custom-select-wrapper">
          <select v-model="sortMode">
            <option value="elo">{{ t("sortDraft") }}</option>
            <option value="name">{{ t("sortName") }}</option>
          </select>
        </div>
        -->

        <button
          v-if="currentStep === 'characters' && history.length > 0"
          class="btn btn-primary btn-sm action-btn"
          @click="undo"
        >
          {{ t("btnUndo") }}
        </button>
        <button
          class="btn btn-danger btn-sm action-btn"
          @click="triggerRestart"
        >
          {{ t("btnRestart") }}
        </button>
      </div>
    </div>

    <div class="row g-3 gy-md-4 gx-lg-5 main-draft-row">
      <div
        class="order-player"
        :class="isPicking ? 'col-12 col-lg-2' : 'col-12 col-lg-3'"
      >
        <div
          class="team-title-banner"
          :style="{ backgroundColor: player.color }"
        >
          {{ t("teamYou") }}
        </div>

        <h6 v-if="showBans">{{ t("bannedSlots") }}</h6>
        <div v-if="showBans" class="slot-box mb-3 mb-md-4">
          <div
            v-for="i in playerBansCount"
            :key="i"
            class="ban-slot"
            :class="{ filled: player.bans[i - 1] }"
          >
            <span class="ban-icon" v-if="!player.bans[i - 1]">[✕]</span>
            {{ player.bans[i - 1]?.name || t("emptyCell") }}
          </div>
        </div>

        <h6>{{ t("activeLineup") }}</h6>
        <div class="slot-box">
          <template v-for="char in displayPlayerPicks" :key="char.id">
            <div
              v-if="
                currentStep === 'characters' || !postBans.player.has(char.id)
              "
              class="pick-card player-card"
              :class="{
                'clickable-post-draft': canPostBan,
                'post-banned': postBans.player.has(char.id),
              }"
              @click="togglePostBan('player', char.id)"
            >
              <button
                v-if="isLadderPicking"
                type="button"
                class="ladder-remove"
                @click.stop="removeLadderChoice('player', char.id)"
              >
                ✕
              </button>
              <img :src="char.image" />
              <div class="pick-name">
                <div class="char-title-bold">{{ char.name }}</div>
                <LadderHeroInfo
                  v-if="isLadderPicking"
                  :char="char"
                  :expand-key="'player:' + char.id"
                  :highlight-ids="ladderOpponentIds"
                  highlight-rgb="255, 79, 109"
                />
                <MatchupList
                  v-else
                  :char-name="char.name"
                  :opponent-picks="displayOpponentPicks"
                  :ignored-ids="postBans.opponent"
                />
              </div>
            </div>
          </template>
        </div>
      </div>

      <div
        class="order-pool"
        :class="isPicking ? 'col-12 col-lg-8' : 'col-12 col-lg-6'"
      >
        <CharacterDraft
          v-if="currentStep === 'characters' && !isSimultaneous"
        />
        <LadderDraft v-else-if="currentStep === 'characters'" />
        <MapSelect v-else-if="currentStep === 'maps'" draftMode />
      </div>

      <div
        class="col-lg-2 order-opponent"
        :class="isPicking ? 'col-12 col-lg-2' : 'col-12 col-lg-3'"
      >
        <div
          class="team-title-banner"
          :style="{ backgroundColor: opponent.color }"
        >
          {{ t("teamOpponent") }}
        </div>

        <h6 v-if="showBans">{{ t("bannedSlots") }}</h6>
        <div v-if="showBans" class="slot-box mb-3 mb-md-4">
          <div
            v-for="i in opponentBansCount"
            :key="i"
            class="ban-slot"
            :class="{ filled: opponent.bans[i - 1] }"
            :style="{ '--ban-color-rgb': '255, 79, 109' }"
          >
            <span class="ban-icon" v-if="!opponent.bans[i - 1]">[✕]</span>
            {{ opponent.bans[i - 1]?.name || t("emptyCell") }}
          </div>
        </div>

        <h6>{{ t("activeLineup") }}</h6>
        <div class="slot-box">
          <template
            v-for="enemyChar in displayOpponentPicks"
            :key="enemyChar.id"
          >
            <div
              v-if="
                currentStep === 'characters' ||
                !postBans.opponent.has(enemyChar.id)
              "
              class="pick-card opponent-card"
              :class="{
                'clickable-post-draft': canPostBan,
                'post-banned': postBans.opponent.has(enemyChar.id),
              }"
              @click="togglePostBan('opponent', enemyChar.id)"
            >
              <button
                v-if="isLadderPicking"
                type="button"
                class="ladder-remove"
                @click.stop="removeLadderChoice('opponent', enemyChar.id)"
              >
                ✕
              </button>
              <img :src="enemyChar.image" />
              <div class="pick-name">
                <div class="char-title-bold">{{ enemyChar.name }}</div>
                <LadderHeroInfo
                  v-if="isLadderPicking"
                  :char="enemyChar"
                  :expand-key="'opponent:' + enemyChar.id"
                  :highlight-ids="ladderPlayerIds"
                  highlight-rgb="79, 124, 255"
                />
                <MatchupList
                  v-else
                  :char-name="enemyChar.name"
                  :opponent-picks="displayPlayerPicks"
                  :ignored-ids="postBans.player"
                />
              </div>
            </div>
          </template>

          <template v-if="isLadderPicking">
            <CharacterSlot
              v-for="n in ladderEmptyOpponentSlots"
              :key="'opponent-slot-' + n"
              block
              class="pick-slot"
              :label="t('ladderAddOpponent')"
              @pick="opponentPickerOpen = true"
            />
          </template>
        </div>
      </div>
    </div>

    <CharPickerModal
      v-if="opponentPickerOpen"
      :characters-list="opponentPickerList"
      @close="opponentPickerOpen = false"
      @select="onOpponentSelect"
    />
  </div>

  <div
    class="modal fade"
    id="resetConfirmModal"
    data-bs-backdrop="static"
    tabindex="-1"
    aria-hidden="true"
    aria-labelledby="resetModalLabel"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-bold text-white">
            ⚠️ {{ t("modalTitle") }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="cancelReset"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p class="mb-0 modal-body-text">{{ t("modalDesc") }}</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-dark fw-semibold btn-modal-cancel"
            @click="cancelReset"
          >
            {{ t("modalCancel") }}
          </button>
          <button
            type="button"
            class="btn btn-danger fw-bold btn-modal-confirm"
            @click="confirmReset"
          >
            {{ t("modalConfirm") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from "vue";
import { useDraftState } from "../../composables/useDraftState.js";
import CharacterDraft from "../CharacterDraft.vue";
import LadderDraft from "../LadderDraft.vue";
import LadderHeroInfo from "../LadderHeroInfo.vue";
import CharacterSlot from "../CharacterSlot.vue";
import CharPickerModal from "../CharPickerModal.vue";
import MapSelect from "../MapSelect.vue";
import Disclaimer from "../Disclaimer.vue";
import MatchupList from "../MatchupList.vue";

const {
  search,
  currentFormat,
  availableFormats,
  firstPicker,
  sortMode,
  current,
  history,
  turnColor,
  currentTurnText,
  player,
  opponent,
  currentStep,
  postBans,
  t,
  saveToStorage,
  undo,
  resetAll,
  togglePostBan,
  playerBansCount,
  opponentBansCount,
  isSimultaneous,
  displayPlayerPicks,
  displayOpponentPicks,
  canPostBan,
  formatPool,
  ladderChoice,
  ladderSort,
  ladderEmptyOpponentSlots,
  addLadderOpponent,
  removeLadderChoice,
  getWinrate,
} = useDraftState();

// Йде вибір героїв: покроково (є поточний хід) або у ladder на кроці героїв
const isPicking = computed(
  () =>
    Boolean(current.value) ||
    (isSimultaneous.value && currentStep.value === "characters"),
);

// Ladder на кроці вибору героїв (немає банів, обидві сторони обирають одночасно)
const isLadderPicking = computed(
  () => isSimultaneous.value && currentStep.value === "characters",
);

// Кого вже обрала кожна сторона: за цим виділяємо рядки в списках матчапів
const ladderPlayerIds = computed(() => ladderChoice.player.map((c) => c.id));
const ladderOpponentIds = computed(() =>
  ladderChoice.opponent.map((c) => c.id),
);

// Вибір героя опонента: у списку показуємо середній вінрейт наших обраних
// героїв проти кандидата, а вже обраних опонентом героїв прибираємо
const opponentPickerOpen = ref(false);

const opponentPickerList = computed(() => {
  const taken = new Set(ladderChoice.opponent.map((c) => c.id));
  const mine = ladderChoice.player;

  return formatPool.value
    .filter((char) => !taken.has(char.id))
    .map((char) => {
      if (!mine.length) return char;
      const rates = mine
        .map((m) => getWinrate(m.name, char.name))
        .filter((rate) => rate !== null);
      const refWinrate = rates.length
        ? Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length)
        : null;
      return { ...char, refWinrate };
    });
});

function onOpponentSelect(char) {
  addLadderOpponent(char);
  opponentPickerOpen.value = false;
}

// Слоти банів є лише в покроковому форматі
const showBans = computed(
  () => currentStep.value === "characters" && !isSimultaneous.value,
);

let bsModalInstance = null;

onMounted(async () => {
  nextTick(() => {
    const modalEl = document.getElementById("resetConfirmModal");
    if (modalEl && window.bootstrap) {
      bsModalInstance = new window.bootstrap.Modal(modalEl);
    }
  });
});

function triggerRestart() {
  if (bsModalInstance) bsModalInstance.show();
}
defineExpose({ triggerRestart });

function cancelReset() {
  if (bsModalInstance) bsModalInstance.hide();
}
function confirmReset() {
  resetAll();
  if (bsModalInstance) bsModalInstance.hide();
}
</script>
