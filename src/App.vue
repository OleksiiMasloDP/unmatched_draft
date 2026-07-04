<template>
  <Header 
    :lang="lang" 
    :t="t" 
    @update:lang="lang = $event" 
    @navigate="currentScreen = $event"
  />
  
  <main class="content">
    <div v-if="currentScreen === 'main'">
        <div class="container py-3 py-md-4">
          <div class="top-wrap" :class="{ 'sticky-active': current }">
            <div class="turn-banner" :style="{ background: turnColor, boxShadow: '0 0 20px ' + turnColor + '44' }">
              {{ currentTurnText }}
            </div>

            <div class="controls-row">
              <input v-model="search" class="form-control form-control-sm search-field" :placeholder="t('searchPlaceholder')" />

              <div class="custom-select-wrapper">
                <select v-model="currentFormat" @change="saveToStorage">
                  <option v-for="(fData, fKey) in availableFormats" :key="fKey" :value="fKey">
                    {{ fData.name }}
                  </option>
                </select>
              </div>

              <div class="custom-select-wrapper">
                <select v-model="firstPicker" @change="saveToStorage">
                  <option value="player">{{ t('userFirst') }}</option>
                  <option value="opponent">{{ t('opponentFirst') }}</option>
                </select>
              </div>

              <div class="custom-select-wrapper">
                <select v-model="sortMode">
                  <option value="elo">{{ t('sortDraft') }}</option>
                  <option value="name">{{ t('sortName') }}</option>
                </select>
              </div>

              <button v-if="current && history.length > 0" class="btn btn-primary btn-sm action-btn" @click="undo">
                {{ t('btnUndo') }}
              </button>
              <button class="btn btn-danger btn-sm action-btn" @click="triggerRestart">
                {{ t('btnRestart') }}
              </button>
            </div>
          </div>

          <div class="row g-3 g-md-4 main-draft-row">

            <div class="col-lg-3 order-player">
              <div class="team-title-banner" :style="{ backgroundColor: player.color }">
                {{ t('teamYou') }}
              </div>

              <h6 v-if="currentStep === 'characters'">{{ t('bannedSlots') }}</h6>
              <div v-if="currentStep === 'characters'" class="slot-box mb-3 mb-md-4">
                <div v-for="i in 3" :key="i" class="ban-slot" :class="{ 'filled': player.bans[i-1] }" :style="{ '--ban-color-rgb': '79, 124, 255' }">
                  <span class="ban-icon" v-if="!player.bans[i-1]">[✕]</span>
                  {{ player.bans[i-1]?.name || t('emptyCell') }}
                </div>
              </div>

              <h6>{{ t('activeLineup') }}</h6>
              <div class="slot-box">
                <div v-for="char in player.picks" :key="char.id">
                  <div v-if="currentStep === 'characters' || !postBans.player.has(char.id)" 
                      class="pick-card player-card" 
                      :class="{ 'clickable-post-draft': !current, 'post-banned': postBans.player.has(char.id) }" 
                      @click="togglePostBan('player', char.id)">
                    <img :src="char.image" />
                    <div class="pick-name">
                      <div class="char-title-bold">{{ char.name }}</div>
                      <div class="mu-list">
                        <template v-for="enemy in opponent.picks" :key="enemy.id">
                          <div v-if="char.matchups?.[enemy.name] && !postBans.opponent.has(enemy.id)">
                            {{ getMatchupText(char, enemy) }}
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-6 order-pool">
              <CharacterDraft v-if="currentStep === 'characters'" />
              <MapSelect v-else-if="currentStep === 'maps'" draftMode />
            </div>

            <div class="col-lg-3 order-opponent">
              <div class="team-title-banner" :style="{ backgroundColor: opponent.color }">
                {{ t('teamOpponent') }}
              </div>

              <h6 v-if="currentStep === 'characters'">{{ t('bannedSlots') }}</h6>
              <div v-if="currentStep === 'characters'" class="slot-box mb-3 mb-md-4">
                <div v-for="i in 3" :key="i" class="ban-slot" :class="{ 'filled': opponent.bans[i-1] }" :style="{ '--ban-color-rgb': '255, 79, 109' }">
                  <span class="ban-icon" v-if="!opponent.bans[i-1]">[✕]</span>
                  {{ opponent.bans[i-1]?.name || t('emptyCell') }}
                </div>
              </div>

              <h6>{{ t('activeLineup') }}</h6>
              <div class="slot-box">
                <div v-for="enemyChar in opponent.picks" :key="enemyChar.id">
                  <div v-if="currentStep === 'characters' || !postBans.opponent.has(enemyChar.id)" 
                      class="pick-card opponent-card" 
                      :class="{ 'clickable-post-draft': !current, 'post-banned': postBans.opponent.has(enemyChar.id) }" 
                      @click="togglePostBan('opponent', enemyChar.id)">
                    <img :src="enemyChar.image" />
                    <div class="pick-name">
                      <div class="char-title-bold">{{ enemyChar.name }}</div>
                      <div class="mu-list">
                        <template v-for="yourChar in player.picks" :key="yourChar.id">
                          <div v-if="enemyChar.matchups?.[yourChar.name] && !postBans.player.has(yourChar.id)">
                            {{ getMatchupText(enemyChar, yourChar) }}
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="modal fade" id="resetConfirmModal" data-bs-backdrop="static" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title fw-bold text-white">⚠️ {{ t('modalTitle') }}</h5>
                <button type="button" class="btn-close" @click="cancelReset" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-0 modal-body-text">{{ t('modalDesc') }}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-dark fw-semibold btn-modal-cancel" @click="cancelReset">
                  {{ t('modalCancel') }}
                </button>
                <button type="button" class="btn btn-danger fw-bold btn-modal-confirm" @click="confirmReset">
                  {{ t('modalConfirm') }}
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    
    <div v-if="currentScreen === 'maps'">
      <HeroMapGuide/>
    </div>
  </main>

  <ScrollToTop />
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import { useDraftState } from './composables/useDraftState';
  import CharacterDraft from './components/CharacterDraft.vue';
  import MapSelect from './components/MapSelect.vue';
  import Header from './components/Header.vue';
  import HeroMapGuide from './components/HeroMapGuide.vue';
  import ScrollToTop from './components/ScrollToTop.vue';

  const {
    search, currentFormat, availableFormats, firstPicker, sortMode, lang,
    current, history, turnColor, currentTurnText, player, opponent, currentStep, postBans,
    t, loadChars, loadMaps, loadFromStorage, saveToStorage, undo, resetAll, togglePostBan, getMatchupText
  } = useDraftState();

  const currentScreen = ref('main'); 

  let bsModalInstance = null;

  onMounted(async () => {
    await Promise.all([loadChars(), loadMaps()]);
    loadFromStorage();

    const modalEl = document.getElementById('resetConfirmModal');
    if (modalEl && window.bootstrap) {
      bsModalInstance = new window.bootstrap.Modal(modalEl);
    }
  });

  function triggerRestart() { if (bsModalInstance) bsModalInstance.show(); }
  defineExpose({ triggerRestart });

  function cancelReset() { if (bsModalInstance) bsModalInstance.hide(); }
  function confirmReset() { resetAll(); if (bsModalInstance) bsModalInstance.hide(); }
</script>