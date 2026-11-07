<template>
  <div class="game-page container">
    <template v-if="game.phase === 'setup'">
      <div class="game-title-row">
        <h1 class="page-main-title">{{ t("gameTitle") }}</h1>
        <span class="game-beta">{{ t("packBeta") }}</span>
      </div>

      <div v-if="game.notice" class="game-notice">
        {{ replacePlayer(game.notice.key, game.notice.player) }}
      </div>

      <div class="game-note">{{ t("gameTestNote") }}</div>
    </template>

    <OnlinePanel
      v-if="game.phase === 'setup' || netState.status === 'closed'"
    />

    <template v-if="game.phase === 'setup'">
      <div class="game-setup">
        <h2 class="game-subtitle">{{ t("gameMapLabel") }}</h2>
        <div class="map-tiles">
          <button
            v-for="item in maps"
            :key="item.id"
            type="button"
            class="map-tile"
            :class="{ 'is-selected': game.mapId === item.id }"
            :disabled="!canPickMap"
            @click="setMap(item.id)"
          >
            <img :src="item.image" :alt="item.name" />
            <span>{{ item.name }}</span>
          </button>
        </div>

        <div
          v-for="player in setupPlayers"
          :key="player"
          class="game-setup-row"
        >
          <h2 class="game-subtitle">
            {{ playerLabel(player) }} · {{ t("gameDeckLabel") }}
          </h2>
          <p v-if="online && !game.toss" class="game-prompt-line">
            {{ t("tossMapHint") }}
          </p>
          <div class="deck-tiles">
            <div
              v-for="deck in allDecks"
              :key="deck.id"
              class="deck-tile"
              :class="{
                'is-selected': selected[player] === deck.id,
                'is-disabled': takenBy(player, deck),
              }"
              role="button"
              tabindex="0"
              :data-deck="deck.id"
              :title="takenBy(player, deck) ? t('gameHeroTaken') : ''"
              @click="pickDeck(player, deck)"
              @keyup.enter="pickDeck(player, deck)"
            >
              <img
                v-if="getHero(deck.heroId).image"
                :src="getHero(deck.heroId).image"
                :alt="getHero(deck.heroId).name"
              />
              <div class="deck-tile-info">
                <div class="deck-name">
                  {{ deck.name }}
                  <span v-if="deck.isTest" class="deck-test">
                    {{ t("gameTestDeck") }}
                  </span>
                </div>
                <div class="deck-meta">{{ deckMeta(deck) }}</div>
              </div>
            </div>
          </div>
        </div>

        <p v-if="!savedDecks.length" class="game-empty">
          {{ t("gameNoSaved") }}
          <router-link :to="{ name: 'pack-draft' }">
            {{ t("packDraftTitle") }}
          </router-link>
        </p>

        <template v-if="online">
          <button
            class="btn btn-primary btn-sm action-btn"
            @click="onChooseDeck"
            :disabled="Boolean(game.toss)"
          >
            {{
              game.lobby[mySeat]
                ? t("onlineChangeDeck")
                : t("onlineConfirmDeck")
            }}
          </button>
          <div v-for="player in players" :key="player" class="game-lobby-line">
            {{ playerLabel(player) }}:
            {{
              game.lobby[player]
                ? `${t("onlineDeckReady")} · ${game.lobby[player].name} (${getHero(game.lobby[player].heroId).name})`
                : t("onlineNotReady")
            }}
          </div>
          <button
            v-if="isHost && !game.toss"
            class="btn btn-success btn-sm action-btn"
            :disabled="!game.lobby.p1 || !game.lobby.p2"
            @click="startOnlineGame"
          >
            {{ t("tossRoll") }}
          </button>
          <p v-else-if="!isHost && !game.toss" class="game-prompt-line">
            {{ t("onlineWaitHost") }}
          </p>

          <div v-if="game.toss" class="toss">
            <h2 class="game-subtitle">{{ t("tossTitle") }}</h2>
            <div class="toss-dice">
              <div
                v-for="player in players"
                :key="player"
                class="toss-side"
                :class="{
                  'is-winner': tossDone && game.toss.winner === player,
                }"
              >
                <div class="toss-die" :class="{ 'is-rolling': !tossDone }">
                  {{ dice[player] }}
                </div>
                <div class="toss-name">
                  {{ playerLabel(player) }}
                  <template v-if="player === mySeat">
                    · {{ t("packYou") }}
                  </template>
                </div>
              </div>
            </div>

            <template v-if="tossDone">
              <p v-if="game.toss.rerolls" class="game-prompt-line">
                {{ t("tossReroll") }}
              </p>
              <p class="game-prompt-line">
                {{ t(iWonToss ? "tossYouWon" : "tossOppWon") }}
              </p>

              <template v-if="game.toss.stage === 'map'">
                <button
                  v-if="iWonToss"
                  class="btn btn-success btn-sm action-btn"
                  @click="confirmMap"
                >
                  {{ t("tossConfirmMap") }}
                </button>
                <p v-else class="game-prompt-line">{{ t("tossWaitMap") }}</p>
              </template>

              <template v-else>
                <div v-if="!iWonToss" class="toss-order">
                  <p class="game-prompt-line">{{ t("tossPickOrder") }}</p>
                  <button
                    class="btn btn-success btn-sm action-btn"
                    @click="chooseOrder(true)"
                  >
                    {{ t("tossFirst") }}
                  </button>
                  <button
                    class="btn btn-primary btn-sm action-btn"
                    @click="chooseOrder(false)"
                  >
                    {{ t("tossSecond") }}
                  </button>
                </div>
                <p v-else class="game-prompt-line">{{ t("tossWaitOrder") }}</p>
              </template>
            </template>
          </div>
        </template>
        <button
          v-else
          class="btn btn-success btn-sm action-btn game-start"
          @click="onStart"
        >
          {{ t("gameStart") }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="game-bar">
        <div
          class="game-banner"
          :class="game.phase === 'over' ? 'is-done' : 'is-' + game.turn"
        >
          <template v-if="game.phase === 'over'">
            {{ replacePlayer("gameWinner", game.winner) }}
          </template>
          <template v-else-if="game.phase === 'mulligan'">
            {{ t("mulliganBanner") }}
          </template>
          <template v-else-if="game.phase === 'startpick'">
            {{ t("gameStartPickBanner") }}
          </template>
          <template v-else>
            {{ replacePlayer("gameTurnOf", game.turn) }} ·
            {{ t("gameActionsLeft").replace("{n}", game.actions) }}
          </template>
        </div>

        <div class="game-actions">
          <button
            class="btn btn-success btn-sm action-btn"
            :disabled="!available.maneuver"
            @click="doManeuver"
          >
            <ActionIcon name="maneuver" />{{ t("gameManeuver") }}
          </button>
          <button
            class="btn btn-sm action-btn game-boost"
            :class="{ 'is-on': boostOpen }"
            :disabled="!canBoost"
            @click="boostOpen = !boostOpen"
          >
            <ActionIcon name="boost" />{{ t("gameBoost") }}
          </button>
          <button
            class="btn btn-warning btn-sm action-btn"
            :disabled="!available.scheme"
            @click="doScheme"
          >
            <ActionIcon name="scheme" />{{ t("gameScheme") }}
          </button>
          <button
            class="btn btn-danger btn-sm action-btn"
            :disabled="!available.attack"
            @click="doAttack"
          >
            <ActionIcon name="attack" />{{ t("gameAttack") }}
          </button>
          <button
            v-if="spacePrompt"
            class="btn btn-sm action-btn game-skip"
            @click="answerPrompt(null)"
          >
            <ActionIcon name="skip" />{{
              t(spacePrompt.left ? "gameStopMove" : "gameSkip")
            }}
          </button>
        </div>
      </div>

      <p v-if="game.phase === 'startpick'" class="game-prompt-line">
        {{
          startPickMine
            ? t("gameStartPickYou")
            : replacePlayer("gameStartPickWait", startPickTurn)
        }}
      </p>
      <p v-else-if="waitingOpponent" class="game-prompt-line">
        {{ t("onlineWaitMove") }}
      </p>
      <p v-else-if="placingKid" class="game-prompt-line">
        {{ kidPending ? t("promptPlaceKidConfirm") : promptTitle(spacePrompt) }}
        <button
          v-if="kidPending"
          class="btn btn-success btn-sm action-btn"
          @click="confirmKid"
        >
          {{ t("gameConfirm") }}
        </button>
        <button
          v-if="kidPending"
          class="btn btn-sm btn-outline-light action-btn"
          @click="kidPending = null"
        >
          {{ t("gameCancel") }}
        </button>
      </p>
      <p v-else-if="spacePrompt && boostOpen" class="game-prompt-line">
        {{ t("promptBoostMove") }}
        <button
          class="btn btn-sm btn-outline-light action-btn"
          @click="boostOpen = false"
        >
          {{ t("gameCancel") }}
        </button>
      </p>
      <p v-else-if="spacePrompt" class="game-prompt-line">
        {{ promptTitle(spacePrompt) }}
        <button
          v-if="spacePrompt.undo"
          class="btn btn-sm btn-outline-light action-btn"
          @click="doUndo"
        >
          ↶ {{ t("gameUndo") }}
        </button>
      </p>
      <p v-else-if="handPrompt" class="game-prompt-line">
        {{ promptTitle(handPrompt) }}
        <span v-if="handPrompt.hint" class="game-hint">
          {{ t(handPrompt.hint.key).replace("{n}", handPrompt.hint.n) }}
        </span>
        <button
          class="btn btn-success btn-sm action-btn"
          :disabled="selection.length < handPrompt.min"
          @click="confirmCards"
        >
          {{ selection.length ? t("gameConfirm") : t(handPrompt.skip) }}
          <template v-if="handPrompt.max > 1">
            ({{ selection.length }}/{{ handPrompt.max }})
          </template>
        </button>
      </p>

      <div class="game-layout">
        <div
          v-for="player in players"
          :key="player"
          class="game-player"
          :class="[
            'is-' + player,
            'slot-' + player,
            {
              'is-active': game.phase !== 'over' && game.turn === player,
              'is-idle': game.phase !== 'over' && game.turn !== player,
            },
          ]"
        >
          <img
            v-if="heroOf(player).image"
            class="game-player-avatar"
            :src="heroOf(player).image"
            :alt="heroOf(player).name"
          />
          <div class="game-player-name">{{ playerTag(player) }}</div>
          <div class="game-player-hero">{{ heroOf(player).name }}</div>
          <div class="game-player-hp">
            <span class="game-hp-icon">❤</span>
            <span class="game-hp-value">{{ game.players[player].hp }}</span>
            <span class="game-hp-max">/ {{ game.players[player].maxHp }}</span>
          </div>
          <div class="game-hp">
            <div
              class="game-hp-fill"
              :style="{
                width:
                  (game.players[player].hp / game.players[player].maxHp) * 100 +
                  '%',
              }"
            ></div>
          </div>
          <div v-if="heroOf(player).sidekick" class="game-sidekick">
            <span class="game-sidekick-name">
              {{ heroOf(player).sidekick.name }}
            </span>
            <span
              v-for="kid in game.players[player].sidekicks"
              :key="kid.id"
              class="game-sidekick-hp"
            >
              ❤ {{ kid.hp
              }}<template v-if="kid.maxHp > 1">/{{ kid.maxHp }}</template>
            </span>
            <span
              v-if="!game.players[player].sidekicks.length"
              class="game-sidekick-hp is-down"
            >
              {{ heroOf(player).sidekick.summon ? "—" : "✝" }}
            </span>
          </div>
          <div
            v-if="heroOf(player).id === 'jill-trent' && game.gadget?.[player]"
            class="game-sidekick"
          >
            <span class="game-sidekick-name">
              ⚙
              {{
                t(
                  game.gadget[player] === "tonic"
                    ? "gadgetTonic"
                    : "gadgetHypnoray",
                )
              }}
            </span>
          </div>
          <div v-if="heroOf(player).id === 'blackbeard'" class="game-sidekick">
            <span class="game-sidekick-name">
              🪙 {{ game.players[player].coins }}
            </span>
          </div>
          <div
            v-else-if="heroOf(opponentOf(player))?.id === 'blackbeard'"
            class="game-sidekick"
          >
            <span class="game-sidekick-name"> 🪙 {{ game.treasury }} </span>
            <span class="game-sidekick-hp">{{ t("gameTreasury") }}</span>
          </div>
          <button
            v-if="heroOf(player).id === 'black-panther'"
            type="button"
            class="game-suit"
            @click="suitView = player"
          >
            <span class="game-suit-icon">🛡</span>
            <span class="game-suit-title">{{ t("gameSuit") }}</span>
            <span class="game-suit-count">
              {{ (game.players[player].suit || []).length }}
            </span>
          </button>
          <div class="game-counters">
            <div class="game-counter" :title="t('gameHand')">
              <span class="game-counter-icon">🖐</span>
              <span class="game-counter-value">
                {{ game.players[player].hand.length }}
              </span>
              <span class="game-counter-label">{{ t("gameHand") }}</span>
            </div>
            <div class="game-counter" :title="t('gameDeck')">
              <span class="game-counter-icon">📚</span>
              <span class="game-counter-value">
                {{ game.players[player].deck.length }}
              </span>
              <span class="game-counter-label">{{ t("gameDeck") }}</span>
            </div>
            <button
              type="button"
              class="game-counter is-button"
              :title="t('gameViewDiscard')"
              @click="discardView = player"
            >
              <span class="game-counter-icon">🗑</span>
              <span class="game-counter-value">
                {{ game.players[player].discard.length }}
              </span>
              <span class="game-counter-label">
                {{ t("gameDiscard") }} 🔍
              </span>
            </button>
          </div>
          <details class="game-player-passive">
            <summary>{{ heroOf(player).passive.name }}</summary>
            <p>
              {{
                heroOf(player).passive.text[lang] ||
                heroOf(player).passive.text.en
              }}
            </p>
          </details>
        </div>

        <div class="game-center">
          <CombatPopup
            v-if="showCombat"
            :combat="game.combat"
            :players="game.players"
            :viewer="viewer"
            :preview="blockPreview"
          />
          <GameBoard
            :map="map"
            :players="game.players"
            :options="
              spacePrompt && !boostOpen ? spacePrompt.options : startPickOptions
            "
            :active="activeFighter"
            :fx="game.fx"
            :tokens="game.tokens"
            :hide-heroes="game.phase === 'startpick'"
            :ghost="kidGhost"
            :pending="kidPending"
            @select="onBoardSelect"
          />

          <div class="game-log" :class="{ 'is-open': logOpen }">
            <button
              type="button"
              class="game-log-toggle"
              @click="logOpen = !logOpen"
            >
              <span>{{ t("gameLog") }} ({{ game.log.length }})</span>
              <span>{{ logOpen ? "▴" : "▾" }}</span>
            </button>
            <div v-if="logOpen" class="game-log-body">
              <div
                v-for="block in logBlocks"
                :key="block.key"
                class="game-log-block"
              >
                <div
                  v-for="(group, gi) in block.groups"
                  :key="gi"
                  class="game-log-group"
                  :class="group.cls"
                >
                  <div v-if="group.title" class="game-log-group-title">
                    {{ group.title }}
                  </div>
                  <div
                    v-for="(entry, index) in group.entries"
                    :key="index"
                    class="game-log-line"
                    :class="logClass(entry)"
                  >
                    <button
                      v-if="entry.params.cardId && logCard(entry)"
                      type="button"
                      class="game-log-card"
                      :title="logCard(entry).name"
                      @click="logCardView = logCard(entry)"
                    >
                      <img
                        :src="logCard(entry).image"
                        :alt="logCard(entry).name"
                      />
                    </button>
                    <span>
                      <span
                        v-for="(part, pi) in logParts(entry)"
                        :key="pi"
                        :class="part.cls"
                        >{{ part.text }}</span
                      >
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 class="game-subtitle">
        {{ t("gameYourHand") }} · {{ playerTag(viewer) }}
      </h2>
      <div class="row g-2 game-hand">
        <div
          v-for="card in handCards"
          :key="card.id"
          class="col-4 col-md-3 col-lg-2"
          :class="{ 'is-dim': handMode && !pickable(card.id) }"
        >
          <PackCard
            :card="card"
            :clickable="Boolean(handMode) && pickable(card.id)"
            :selected="selection.includes(card.id)"
            @select="onHandSelect"
          />
        </div>
      </div>

      <template v-if="suitCards.length">
        <h2 class="game-subtitle">{{ t("gameSuit") }}</h2>
        <div class="row g-2 game-hand">
          <div
            v-for="card in suitCards"
            :key="card.id"
            class="col-4 col-md-3 col-lg-2"
            :class="{ 'is-dim': handMode && !pickable(card.id) }"
          >
            <PackCard
              :card="card"
              :clickable="Boolean(handMode) && pickable(card.id)"
              :selected="selection.includes(card.id)"
              @select="onHandSelect"
            />
          </div>
        </div>
      </template>

      <div class="game-footer">
        <ReportBugButton section="game" class="game-bug" />
        <button
          v-if="game.phase === 'play'"
          class="btn btn-sm game-surrender is-danger"
          @click="surrenderOpen = true"
        >
          <ActionIcon name="flag" />{{ t("gameSurrender") }}
        </button>
        <button
          v-else-if="!isGuest"
          class="btn btn-sm btn-primary game-surrender"
          @click="onNewGame"
        >
          {{ t("gameNewGame") }}
        </button>
        <button
          v-if="netState.role"
          class="btn btn-sm game-leave"
          @click="leaveRoom"
        >
          {{ t("onlineLeave") }}
        </button>
      </div>

      <div
        v-if="modalPrompt && !needsPass && !effectBlocking"
        class="game-modal"
      >
        <div
          class="game-modal-box"
          :class="{
            'is-versus':
              blockingPrompt.kind === 'info' && blockingPrompt.combat,
          }"
        >
          <h3
            v-if="blockingPrompt.kind !== 'info' || blockingPrompt.mists"
            class="game-modal-title"
          >
            {{ promptTitle(blockingPrompt) }}
          </h3>

          <template v-if="blockingPrompt.kind === 'cards'">
            <div class="row g-2">
              <div
                v-for="card in promptCards"
                :key="card.id"
                class="col-6 col-md-3"
              >
                <PackCard
                  :card="card"
                  :selected="selection.includes(card.id)"
                  clickable
                  @select="toggleSelection"
                />
              </div>
            </div>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                :disabled="selection.length < blockingPrompt.min"
                @click="confirmCards"
              >
                {{
                  selection.length ? t("gameConfirm") : t(blockingPrompt.skip)
                }}
                <template v-if="blockingPrompt.max > 1">
                  ({{ selection.length }}/{{ blockingPrompt.max }})
                </template>
              </button>
            </div>
          </template>

          <div
            v-else-if="blockingPrompt.kind === 'confirm'"
            class="game-modal-actions"
          >
            <button
              class="btn btn-success btn-sm action-btn"
              @click="answerPrompt(true)"
            >
              {{ t("gameYes") }}
            </button>
            <button
              class="btn btn-danger btn-sm action-btn"
              @click="answerPrompt(false)"
            >
              {{ t("gameNo") }}
            </button>
          </div>

          <div
            v-else-if="blockingPrompt.kind === 'choice'"
            class="game-modal-actions"
          >
            <button
              v-for="choice in blockingPrompt.choices"
              :key="choice.value"
              class="btn btn-primary btn-sm action-btn"
              @click="answerPrompt(choice.value)"
            >
              {{ t(choice.label) }}
            </button>
          </div>

          <template v-else-if="blockingPrompt.mists">
            <p class="game-hint-empty">
              {{ replacePlayer("gameMistsText", blockingPrompt.mists.owner) }}
            </p>
            <div v-if="mistsRejected.length" class="row g-2">
              <div
                v-for="card in mistsRejected"
                :key="card.id"
                class="col-4 col-md-3"
              >
                <PackCard :card="card" />
              </div>
            </div>
            <p v-if="mistsFound" class="game-hint-empty">
              {{ t("gameMistsFound") }}
            </p>
            <div v-if="mistsFound" class="row g-2 justify-content-center">
              <div class="col-6 col-md-4">
                <PackCard :card="mistsFound" />
              </div>
            </div>
            <p v-else class="game-hint-empty">{{ t("gameMistsKept") }}</p>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                @click="answerPrompt()"
              >
                {{ t("gameConfirm") }}
              </button>
            </div>
          </template>

          <template v-else-if="blockingPrompt.kind === 'info'">
            <div class="vs-grid">
              <div
                v-for="side in revealSides"
                :key="side.player"
                class="vs-side"
                :class="'is-' + side.player"
              >
                <div class="reveal-label">
                  {{ side.label }} · {{ t(side.roleKey) }}
                  <template v-if="side.fighterName">
                    · {{ side.fighterName }}
                  </template>
                </div>
                <img
                  v-if="side.fighterImage"
                  class="vs-avatar"
                  :src="side.fighterImage"
                  :alt="side.fighterName || heroOf(side.player).name"
                />
                <PackCard
                  v-if="side.card"
                  class="reveal-card"
                  :card="side.card"
                />
                <div v-else class="reveal-empty">{{ t("gameNoCard") }}</div>
                <div class="vs-calc">
                  <span v-if="side.card">
                    {{ t("gameCardValue").replace("{n}", side.base) }}
                  </span>
                  <span v-if="side.boost" class="is-boost">
                    {{ t("gameBoostValue").replace("{n}", side.boost) }}
                  </span>
                  <span v-if="side.tokenName" class="is-boost">
                    {{ t("token_" + side.tokenName) }}
                  </span>
                  <span v-if="side.bonus" class="is-boost">
                    {{ t("gameBonusValue").replace("{n}", side.bonus) }}
                  </span>
                  <span v-if="side.terrain" class="is-boost">
                    {{ t("gameTerrainValue").replace("{n}", side.terrain) }}
                  </span>
                  <strong>{{ side.total }}</strong>
                </div>
                <div v-if="side.boostCards.length" class="vs-boost">
                  <span>{{ t("vsBoosted") }}</span>
                  <div class="vs-boost-row">
                    <PackCard
                      v-for="boost in side.boostCards"
                      :key="boost.id"
                      class="vs-boost-card"
                      :card="boost"
                    />
                  </div>
                </div>
              </div>
              <div class="vs-center">
                <div class="vs-mark">VS</div>
                <div class="vs-score">
                  {{ revealSides[0].total }} – {{ revealSides[1].total }}
                </div>
                <div class="vs-damage">
                  {{
                    blockingPrompt.combat.dealt
                      ? t("gameDamageDealt").replace(
                          "{n}",
                          blockingPrompt.combat.dealt,
                        )
                      : t("logNoDamage")
                  }}
                </div>
              </div>
            </div>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                @click="answerPrompt()"
              >
                {{ t("gameConfirm") }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <div
        v-if="logCardView"
        class="game-modal"
        @click.self="logCardView = null"
      >
        <div class="game-modal-box is-logcard">
          <button
            type="button"
            class="game-modal-close"
            :aria-label="t('combatHide')"
            @click="logCardView = null"
          >
            ✕
          </button>
          <PackCard :card="logCardView" />
        </div>
      </div>

      <div
        v-if="discardView"
        class="game-modal"
        @click.self="discardView = null"
      >
        <div class="game-modal-box is-discard">
          <button
            type="button"
            class="game-modal-close"
            :aria-label="t('combatHide')"
            @click="discardView = null"
          >
            ✕
          </button>
          <h3 class="game-modal-title">
            {{ replacePlayer("gameDiscardOf", discardView) }}
            ({{ discardCount }})
          </h3>
          <p v-if="!discardGroups.length" class="game-hint-empty">
            {{ t("gameDiscardEmpty") }}
          </p>
          <div v-else class="discard-grid">
            <div
              v-for="group in discardGroups"
              :key="group.key"
              class="discard-stack"
              :style="{ '--n': group.cards.length }"
              :title="group.cards[0].name"
            >
              <div
                v-for="(card, index) in group.cards"
                :key="card.id"
                class="discard-stack-card"
                :style="{ '--i': index }"
              >
                <PackCard :card="card" />
              </div>
              <span v-if="group.cards.length > 1" class="discard-count">
                ×{{ group.cards.length }}
              </span>
            </div>
          </div>
          <div class="game-modal-actions">
            <button
              class="btn btn-primary btn-sm action-btn"
              @click="discardView = null"
            >
              {{ t("combatHide") }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="suitView" class="game-modal" @click.self="suitView = null">
        <div class="game-modal-box is-discard">
          <button
            type="button"
            class="game-modal-close"
            :aria-label="t('combatHide')"
            @click="suitView = null"
          >
            ✕
          </button>
          <h3 class="game-modal-title">
            {{ replacePlayer("gameSuitOf", suitView) }}
            ({{ suitGroups.reduce((n, g) => n + g.cards.length, 0) }})
          </h3>
          <p v-if="!suitGroups.length" class="game-hint-empty">
            {{ t("gameSuitEmpty") }}
          </p>
          <div v-else class="discard-grid">
            <div
              v-for="group in suitGroups"
              :key="group.key"
              class="discard-stack"
              :style="{ '--n': group.cards.length }"
              :title="group.cards[0].name"
            >
              <div
                v-for="(card, index) in group.cards"
                :key="card.id"
                class="discard-stack-card"
                :style="{ '--i': index }"
              >
                <PackCard :card="card" />
              </div>
              <span v-if="group.cards.length > 1" class="discard-count">
                ×{{ group.cards.length }}
              </span>
            </div>
          </div>
          <div class="game-modal-actions">
            <button
              class="btn btn-primary btn-sm action-btn"
              @click="suitView = null"
            >
              {{ t("combatHide") }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="surrenderOpen" class="game-modal">
        <div class="game-modal-box game-confirm-box">
          <h3 class="game-modal-title">{{ t("gameSurrenderAsk") }}</h3>
          <div class="game-modal-actions">
            <button
              class="btn btn-danger btn-sm action-btn"
              @click="onSurrender"
            >
              {{ t("gameSurrenderYes") }}
            </button>
            <button
              class="btn btn-sm action-btn game-cancel"
              @click="surrenderOpen = false"
            >
              {{ t("gameCancel") }}
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="effectHidden && effectEntry && !needsPass"
        type="button"
        class="modal-peek"
        @click="effectHidden = false"
      >
        👁 {{ t("gameShowPopup") }}
      </button>
      <EffectDialog
        v-if="effectEntry && !effectHidden && !needsPass"
        :entry="effectEntry"
        :lines="effectLines"
        :picks="effectPicks"
        :prompt="effectPrompt"
        :cards="effectCards"
        :selection="selection"
        :mine="effectMine"
        :blocking="effectBlocking"
        :player-label="playerLabel(effectEntry.player)"
        @answer="answerPrompt"
        @toggle="toggleSelection"
        @confirm="confirmCards"
        @close="onEffectClose"
      />

      <TransitionGroup name="toast" tag="div" class="game-toasts">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="game-toast"
          :class="['is-' + toast.type, 'side-' + toast.player]"
        >
          <img
            v-if="toast.image"
            class="game-toast-card"
            :src="toast.image"
            :alt="toast.card"
          />
          <span class="game-toast-text">{{ toast.text }}</span>
        </div>
      </TransitionGroup>

      <div
        v-if="game.phase === 'mulligan' && game.mulligan && !needsPass"
        class="game-modal"
      >
        <div class="game-modal-box is-mulligan">
          <template v-if="game.mulligan.reveal">
            <h3 class="game-modal-title">{{ t("mulliganRevealTitle") }}</h3>
            <div class="mulligan-reveal">
              <div
                v-for="player in players"
                :key="player"
                class="mulligan-reveal-row"
                :class="'is-' + game.mulligan.reveal[player]"
              >
                <span>{{ playerTag(player) }}</span>
                <span>
                  {{
                    t(
                      game.mulligan.reveal[player] === "mulligan"
                        ? "mulliganChoiceRedraw"
                        : "mulliganChoiceKeep",
                    )
                  }}
                </span>
              </div>
            </div>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                @click="continueMulligan"
              >
                {{ t("mulliganStart") }}
              </button>
            </div>
          </template>

          <template v-else-if="mulliganTurn">
            <h3 class="game-modal-title">
              {{ t("mulliganTitle") }} · {{ playerTag(mulliganTurn) }}
            </h3>
            <p class="mulligan-note">{{ t("mulliganNote") }}</p>
            <div class="mulligan-hand">
              <PackCard v-for="card in handCards" :key="card.id" :card="card" />
            </div>
            <div class="game-modal-actions is-center">
              <button
                class="btn btn-success btn-sm action-btn"
                @click="decideMulligan(false)"
              >
                {{ t("mulliganKeep") }}
              </button>
              <button
                class="btn btn-warning btn-sm action-btn"
                @click="decideMulligan(true)"
              >
                {{ t("mulliganRedraw") }}
              </button>
            </div>
          </template>

          <template v-else>
            <h3 class="game-modal-title">{{ t("mulliganWaitTitle") }}</h3>
            <p class="mulligan-note">{{ t("mulliganWaitText") }}</p>
          </template>
        </div>
      </div>

      <div v-if="needsPass" class="game-pass">
        <div class="game-pass-box">
          <h3>{{ replacePlayer("gamePassTitle", passTarget) }}</h3>
          <button
            class="btn btn-success btn-sm action-btn"
            @click="game.viewer = passTarget"
          >
            {{ replacePlayer("gamePassBtn", passTarget) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { useGame } from "../../composables/useGame";
import { useSavedDecks } from "../../composables/useSavedDecks";
import { getCard, getHero, testDecks } from "../../gameDecks";
import ActionIcon from "../ActionIcon.vue";
import CombatPopup from "../CombatPopup.vue";
import EffectDialog from "../EffectDialog.vue";
import ReportBugButton from "../ReportBugButton.vue";
import GameBoard from "../GameBoard.vue";
import PackCard from "../PackCard.vue";
import OnlinePanel from "../OnlinePanel.vue";
import { useOnline } from "../../composables/useOnline";

const { t, lang } = useDraftState();
const {
  game,
  map,
  maps,
  setMap,
  confirmMap,
  chooseOrder,
  startGame,
  startOnlineGame,
  chooseDeck,
  resetGame,
  answerPrompt,
  chooseMulligan,
  continueMulligan,
  doManeuver,
  doScheme,
  doAttack,
  doUndo,
  surrender,
  availableActions,
  heroOf,
  pickStart,
} = useGame();
const { savedDecks } = useSavedDecks();
const {
  net: netState,
  online,
  mySeat,
  isHost,
  isGuest,
  leave: leaveRoom,
} = useOnline();
const boostOpen = ref(false);
const TOSS_ANIM_MS = 1800;
const dice = ref({ p1: 1, p2: 1 });
const tossDone = ref(false);
let tossSpin = null;
let tossEnd = null;

function stopToss() {
  clearInterval(tossSpin);
  clearTimeout(tossEnd);
}

watch(
  () => game.toss?.id,
  () => {
    stopToss();
    const current = game.toss;
    tossDone.value = false;
    if (!current) return;
    tossSpin = setInterval(() => {
      dice.value = {
        p1: 1 + Math.floor(Math.random() * 6),
        p2: 1 + Math.floor(Math.random() * 6),
      };
    }, 90);
    tossEnd = setTimeout(() => {
      stopToss();
      dice.value = { p1: current.rolls.p1, p2: current.rolls.p2 };
      tossDone.value = true;
    }, TOSS_ANIM_MS);
  },
  { immediate: true },
);

onBeforeUnmount(stopToss);

const iWonToss = computed(() => game.toss?.winner === mySeat.value);

const canPickMap = computed(
  () =>
    !online.value ||
    (tossDone.value &&
      game.toss?.stage === "map" &&
      game.toss.winner === mySeat.value),
);
const logOpen = ref(false);
const logCardView = ref(null);
const surrenderOpen = ref(false);

const players = ["p1", "p2"];
const allDecks = computed(() => [...testDecks, ...savedDecks.value]);
const selected = ref({ p1: testDecks[0].id, p2: testDecks[1].id });
const selection = ref([]);

const available = computed(() => availableActions());

const canBoost = computed(() =>
  Boolean(spacePrompt.value?.boostOptions?.length),
);

const toasts = ref([]);
let lastFx = Math.max(0, ...game.fx.map((item) => item.id));
const toastTimers = [];

function toastFor(item) {
  const kidName = heroOf(item.player)?.sidekick?.name;
  const who =
    playerLabel(item.player) +
    (item.fighter && item.fighter !== "hero" && kidName ? ` (${kidName})` : "");
  if (item.type === "damage") {
    return {
      text: t(item.src ? "fxDamageSrc" : "fxDamage")
        .replace("{player}", who)
        .replace("{n}", item.n)
        .replace("{card}", item.src || ""),
    };
  }
  if (item.type === "heal") {
    return {
      text: t("fxHeal").replace("{player}", who).replace("{n}", item.n),
    };
  }
  if (item.type === "draw") {
    return {
      text: t("fxDraw").replace("{player}", who).replace("{n}", item.n),
    };
  }
  const card = getCard(item.cardId);
  if (!card) return null;
  return {
    text: t("fxDiscard").replace("{player}", who).replace("{card}", card.name),
    image: card.image,
    card: card.name,
  };
}

watch(
  () => game.fx.map((item) => item.id).join(","),
  () => {
    const fresh = game.fx.filter((item) => item.id > lastFx);
    lastFx = Math.max(lastFx, ...game.fx.map((item) => item.id));
    for (const item of fresh) {
      const toast = toastFor(item);
      if (!toast) continue;
      const entry = {
        id: item.id,
        type: item.type,
        player: item.player,
        ...toast,
      };
      toasts.value = [...toasts.value, entry].slice(-5);
      toastTimers.push(
        setTimeout(() => {
          toasts.value = toasts.value.filter((x) => x.id !== entry.id);
        }, 3200),
      );
    }
  },
);

watch(
  () => game.phase,
  () => {
    lastFx = Math.max(0, ...game.fx.map((item) => item.id));
    toasts.value = [];
  },
);

onBeforeUnmount(() => {
  toastTimers.forEach(clearTimeout);
});

const playerLabel = (player) =>
  t(player === "p1" ? "packPlayer1" : "packPlayer2");

const replacePlayer = (key, player) =>
  t(key).replace("{player}", playerLabel(player));

const deckMeta = (deck) =>
  t("gameDeckMeta")
    .replace("{hero}", getHero(deck.heroId).name)
    .replace("{n}", deck.cardIds.length);

const setupPlayers = computed(() => (online.value ? [mySeat.value] : players));

const mine = (prompt) =>
  !online.value || prompt.player === null || prompt.player === mySeat.value;

const spacePrompt = computed(() =>
  game.prompt?.kind === "space" && mine(game.prompt) ? game.prompt : null,
);

const activeFighter = computed(() =>
  game.prompt?.kind === "space" && game.prompt.fighter
    ? { player: game.prompt.player, fighter: game.prompt.fighter }
    : null,
);

const blockingPrompt = computed(() =>
  game.prompt && game.prompt.kind !== "space" && mine(game.prompt)
    ? game.prompt
    : null,
);

const handIds = computed(() => handCards.value.map((card) => card.id));

const handPrompt = computed(() => {
  const prompt = blockingPrompt.value;
  if (!prompt || prompt.kind !== "cards" || needsPass.value) return null;
  return prompt.options.every((id) => handIds.value.includes(id))
    ? prompt
    : null;
});

const modalPrompt = computed(() =>
  blockingPrompt.value === handPrompt.value ? null : blockingPrompt.value,
);

const handMode = computed(() => {
  if (handPrompt.value) return "prompt";
  if (boostOpen.value && canBoost.value) return "boost";
  return null;
});

function pickable(cardId) {
  if (handMode.value === "prompt") {
    return handPrompt.value.options.includes(cardId);
  }
  if (handMode.value === "boost") {
    return spacePrompt.value.boostOptions.includes(cardId);
  }
  return false;
}

function onHandSelect(cardId) {
  if (handMode.value === "boost") onBoost(cardId);
  else if (handMode.value === "prompt") toggleSelection(cardId);
}

const waitingOpponent = computed(() => {
  if (!online.value || game.phase !== "play") return false;
  const owner = game.prompt ? game.prompt.player : game.turn;
  return owner !== null && owner !== mySeat.value;
});

const startPickTurn = computed(() =>
  game.phase === "startpick" && game.startPick
    ? game.startPick.order[game.startPick.index]
    : null,
);

const startPickMine = computed(
  () =>
    startPickTurn.value !== null &&
    (!online.value || startPickTurn.value === mySeat.value),
);

const startPickOptions = computed(() =>
  startPickMine.value
    ? Object.values(map.value.starts).filter(
        (id) => !game.startPick.taken.includes(id),
      )
    : [],
);

const kidPending = ref(null);

const placingKid = computed(
  () => spacePrompt.value?.title === "promptPlaceKid",
);

const kidGhost = computed(() => {
  if (!placingKid.value) return null;
  const heroId = game.players[spacePrompt.value.player]?.heroId;
  return { image: getHero(heroId)?.sidekick?.image || null };
});

function confirmKid() {
  const space = kidPending.value;
  kidPending.value = null;
  if (space) answerPrompt(space);
}

watch(
  () =>
    JSON.stringify([
      game.prompt?.title,
      game.prompt?.player,
      game.prompt?.options,
    ]),
  () => {
    kidPending.value = null;
  },
);

function onBoardSelect(space) {
  if (game.phase === "startpick") pickStart(space, startPickTurn.value);
  else if (placingKid.value) kidPending.value = space;
  else answerPrompt(space);
}

const mulliganTurn = computed(() => {
  const state = game.mulligan;
  if (game.phase !== "mulligan" || !state || state.reveal) return null;
  if (online.value) return state.decided[mySeat.value] ? null : mySeat.value;
  return players.find((player) => !state.decided[player]) ?? null;
});

const decideMulligan = (redraw) => chooseMulligan(redraw, viewer.value);

const passTarget = computed(
  () => mulliganTurn.value ?? game.prompt?.player ?? game.turn,
);

const needsPass = computed(() => {
  if (online.value) return false;
  if (game.phase === "mulligan") {
    return mulliganTurn.value !== null && mulliganTurn.value !== game.viewer;
  }
  if (game.phase !== "play") return false;
  const owner = game.prompt ? game.prompt.player : game.turn;
  return owner !== null && owner !== game.viewer;
});

const viewer = computed(() => (online.value ? mySeat.value : game.viewer));

const handCards = computed(() =>
  game.players[viewer.value]
    ? game.players[viewer.value].hand.map(getCard).filter(Boolean)
    : [],
);

const suitCards = computed(() =>
  game.players[viewer.value]?.suit &&
  heroOf(viewer.value).id === "black-panther"
    ? game.players[viewer.value].suit.map(getCard).filter(Boolean)
    : [],
);

const promptCards = computed(() =>
  blockingPrompt.value?.kind === "cards"
    ? blockingPrompt.value.options.map(getCard)
    : [],
);

const ACTION_KEYS = new Set(["logManeuver", "logAttack", "logScheme"]);

const logBlocks = computed(() => {
  const blocks = [];
  let block = null;
  let group = null;
  let actionNo = 0;
  const entries = game.log.slice(-120);
  entries.forEach((entry, index) => {
    if (entry.key === "logTurn" || !block) {
      actionNo = 0;
      block = { key: index, groups: [] };
      blocks.push(block);
      group = null;
      if (entry.key === "logTurn") {
        group = {
          cls: ["is-turn-head", "is-" + entry.params.player],
          entries: [entry],
        };
        block.groups.push(group);
        group = null;
        return;
      }
    }
    if (entry.params.act && ACTION_KEYS.has(entry.key)) {
      actionNo += 1;
      group = {
        cls: ["is-action", "is-" + entry.params.player],
        title: t("logActionNo").replace("{n}", actionNo),
        entries: [],
      };
      block.groups.push(group);
    } else if (!group) {
      group = { cls: ["is-misc"], entries: [] };
      block.groups.push(group);
    }
    group.entries.push(entry);
  });
  return blocks.reverse();
});

const logCard = (entry) => getCard(entry.params.cardId);

const LOG_PARTS = /(\{[a-zA-Z]+\})/;

function logParts(entry) {
  const parts = [];
  for (const piece of t(entry.key).split(LOG_PARTS)) {
    const match = piece.match(/^\{([a-zA-Z]+)\}$/);
    if (!match) {
      if (piece) parts.push({ text: piece });
      continue;
    }
    const name = match[1];
    const value = entry.params[name];
    if (["player", "attacker", "defender"].includes(name)) {
      parts.push({ text: playerLabel(value), cls: "log-" + value });
    } else if (name === "token") {
      parts.push({ text: t("token_" + value), cls: "log-name" });
    } else if (["card", "who", "hero", "src"].includes(name)) {
      parts.push({ text: String(value), cls: "log-name" });
    } else {
      parts.push({ text: String(value), cls: "log-num" });
    }
  }
  return parts;
}

const logClass = (entry) => ({
  "is-move": entry.key === "logMove",
  "is-action-start": Boolean(entry.params.act),
  "is-turn": entry.key === "logTurn",
  "is-damage": entry.key.startsWith("logDamage"),
  "is-reveal": entry.key.startsWith("logReveal"),
});

const showCombat = computed(
  () =>
    Boolean(game.combat) &&
    blockingPrompt.value?.kind !== "info" &&
    game.prompt?.kind !== "space",
);

const blockPreview = computed(() =>
  handPrompt.value &&
  game.combat?.defense === "pending" &&
  handPrompt.value.player === game.combat.defender
    ? selection.value[0] || null
    : null,
);

const EFFECT_MIN_MS = 3000;
const EFFECT_HIDE_MS = 8000;
const effectShown = ref(null);
const effectHidden = ref(false);
let effectQueue = [];
let effectSeen = game.announces.reduce(
  (max, item) => Math.max(max, item.id),
  0,
);
let effectShownAt = 0;
let effectPump = null;
let effectHide = null;

const effectEntry = computed(
  () => game.announces.find((item) => item.id === effectShown.value) || null,
);

const effectPrompt = computed(() => {
  const note = game.announce;
  if (!note || !note.open || !game.prompt) return null;
  const prompt = game.prompt;
  if (!["confirm", "choice", "cards"].includes(prompt.kind)) return null;
  if (prompt.kind === "cards" && mine(prompt) && handPrompt.value) return null;
  return {
    ...prompt,
    title: promptTitle(prompt),
  };
});

const effectBlocking = computed(
  () =>
    Boolean(effectPrompt.value) &&
    effectEntry.value !== null &&
    effectEntry.value.id === game.announce?.id &&
    !(online.value === false && needsPass.value),
);

const effectMine = computed(
  () => Boolean(effectPrompt.value) && mine(effectPrompt.value),
);

const effectCards = computed(() =>
  effectPrompt.value && effectMine.value && effectPrompt.value.kind === "cards"
    ? effectPrompt.value.options.map(getCard).filter(Boolean)
    : [],
);

const effectLines = computed(() =>
  (effectEntry.value?.lines || []).map((line) => ({
    text: formatLog(line),
    card: line.params?.cardId ? getCard(line.params.cardId) : null,
  })),
);

const effectPicks = computed(() =>
  (effectEntry.value?.picks || []).map(pickText),
);

function showEffect(id, pinned) {
  effectShown.value = id;
  effectHidden.value = false;
  effectShownAt = Date.now();
  clearTimeout(effectHide);
  if (!pinned) {
    effectHide = setTimeout(() => (effectShown.value = null), EFFECT_HIDE_MS);
  }
}

function pumpEffects() {
  clearTimeout(effectPump);
  const note = game.announce;
  if (note && note.open && effectPrompt.value) {
    effectQueue = effectQueue.filter((id) => id > note.id);
    showEffect(note.id, true);
    return;
  }
  if (!effectQueue.length) return;
  const wait = effectShownAt + EFFECT_MIN_MS - Date.now();
  if (effectShown.value && wait > 0) {
    effectPump = setTimeout(pumpEffects, wait);
    return;
  }
  showEffect(effectQueue.shift(), false);
  if (effectQueue.length) effectPump = setTimeout(pumpEffects, EFFECT_MIN_MS);
}

watch(
  () => game.announces.map((item) => item.id).join(","),
  () => {
    for (const item of game.announces) {
      if (item.id > effectSeen) {
        effectSeen = item.id;
        effectQueue.push(item.id);
      }
    }
    pumpEffects();
  },
);

watch(
  () => [game.prompt, game.announce?.open],
  () => pumpEffects(),
);

watch(
  () => game.phase,
  () => {
    effectShown.value = null;
    effectQueue = [];
    effectSeen = game.announces.reduce(
      (max, item) => Math.max(max, item.id),
      0,
    );
  },
);

function onEffectClose() {
  if (effectBlocking.value) effectHidden.value = true;
  else effectShown.value = null;
}

onBeforeUnmount(() => {
  clearTimeout(effectPump);
  clearTimeout(effectHide);
});

// Перегляд скиду (свого і суперника): скид відкритий для обох.
const discardView = ref(null);
const discardCards = computed(() =>
  discardView.value
    ? [...game.players[discardView.value].discard]
        .reverse()
        .map((id) => getCard(id))
        .filter(Boolean)
    : [],
);
const discardCount = computed(() => discardCards.value.length);

// Однакові карти складаємо стопкою: одразу видно, скільки копій уже в скиді.
const discardGroups = computed(() => {
  const groups = new Map();
  for (const card of discardCards.value) {
    const key = `${card.heroId}:${card.key}`;
    if (!groups.has(key)) groups.set(key, { key, cards: [] });
    groups.get(key).cards.push(card);
  }
  return [...groups.values()].sort((a, b) => b.cards.length - a.cards.length);
});

const suitView = ref(null);
const suitGroups = computed(() => {
  const groups = new Map();
  const ids = suitView.value ? game.players[suitView.value].suit || [] : [];
  for (const card of ids.map((id) => getCard(id)).filter(Boolean)) {
    const key = `${card.heroId}:${card.key}`;
    if (!groups.has(key)) groups.set(key, { key, cards: [] });
    groups.get(key).cards.push(card);
  }
  return [...groups.values()];
});

watch(
  () => game.phase,
  () => {
    discardView.value = null;
    suitView.value = null;
  },
);

function pickText(pick) {
  const label = t(pick.key);
  return typeof pick.yes === "boolean"
    ? `${label} — ${t(pick.yes ? "gameYes" : "gameNo")}`
    : label;
}

watch(
  () => game.prompt,
  () => {
    selection.value = [];
    boostOpen.value = false;
  },
);

function promptTitle(prompt) {
  const base = t(prompt.title);
  const title = prompt.left ? `${base} (${prompt.left})` : base;
  return prompt.player ? `${playerLabel(prompt.player)}: ${title}` : title;
}

const boostPrompt = { title: "promptBoostMove", player: null };

const boostCards = computed(() =>
  spacePrompt.value?.boostOptions
    ? spacePrompt.value.boostOptions.map(getCard).filter(Boolean)
    : [],
);

function onBoost(cardId) {
  boostOpen.value = false;
  answerPrompt({ boost: cardId });
}

function toggleSelection(cardId) {
  const prompt = blockingPrompt.value;
  if (!prompt) return;
  const index = selection.value.indexOf(cardId);
  if (index !== -1) {
    selection.value.splice(index, 1);
  } else if (prompt.max === 1) {
    selection.value = [cardId];
  } else if (selection.value.length < prompt.max) {
    selection.value.push(cardId);
  }
}

function confirmCards() {
  answerPrompt([...selection.value]);
}

const mistsRejected = computed(() =>
  (blockingPrompt.value?.mists?.rejected || []).map(getCard).filter(Boolean),
);

const mistsFound = computed(() =>
  blockingPrompt.value?.mists?.found
    ? getCard(blockingPrompt.value.mists.found)
    : null,
);

const revealSides = computed(() => {
  const prompt = blockingPrompt.value;
  if (!prompt || prompt.kind !== "info") return [];
  const combat = prompt.combat;
  const seat = viewer.value;
  return [seat, opponentOf(seat)].map((player) => {
    const cardId = combat.cardIds[player];
    const boostIds =
      combat.boostCardLists?.[player] ||
      (combat.boostCardIds?.[player] ? [combat.boostCardIds[player]] : []);
    const fighter = combat.fighters?.[player];
    const kid = game.players[player]?.sidekicks?.find((k) => k.id === fighter);
    return {
      player,
      label: online.value
        ? t(player === seat ? "gameYouLabel" : "gameOpponentLabel")
        : playerLabel(player),
      roleKey: combat.attacker === player ? "gameAttacker" : "gameDefender",
      card: cardId ? getCard(cardId) : null,
      boostCards: boostIds.map(getCard).filter(Boolean),
      fighterName:
        fighter && fighter !== "hero"
          ? (kid?.name ?? heroOf(player).sidekick?.name)
          : null,
      fighterImage:
        fighter && fighter !== "hero"
          ? (heroOf(player).sidekick?.image ?? heroOf(player).image)
          : heroOf(player).image,
      base: combat.base?.[player] ?? 0,
      boost: combat.boosts?.[player] ?? 0,
      tokenName: combat.tokenBoost?.[player] ?? null,
      bonus: combat.attacker === player ? (combat.bonus ?? 0) : 0,
      terrain: combat.attacker === player ? (combat.terrain ?? 0) : 0,
      total: combat.values[player],
    };
  });
});

function formatLog(entry) {
  let text = t(entry.key);
  for (const [name, value] of Object.entries(entry.params)) {
    let shown = value;
    if (["player", "attacker", "defender"].includes(name)) {
      shown = playerLabel(value);
    }
    if (name === "token") shown = t("token_" + value);
    if (name === "gadget") {
      shown = t(value === "tonic" ? "gadgetTonic" : "gadgetHypnoray");
    }
    text = text.replace(`{${name}}`, shown);
  }
  return text;
}

const findDeck = (id) => allDecks.value.find((deck) => deck.id === id);
const opponentOf = (player) => (player === "p1" ? "p2" : "p1");

const takenBy = (player, deck) =>
  online.value && game.lobby[opponentOf(player)]?.heroId === deck.heroId;

function ensureUnique(keep) {
  if (online.value) return;
  const other = opponentOf(keep);
  const mine = findDeck(selected.value[keep]);
  const theirs = findDeck(selected.value[other]);
  if (mine && theirs && mine.heroId === theirs.heroId) {
    const alt = allDecks.value.find((deck) => deck.heroId !== mine.heroId);
    if (alt) selected.value[other] = alt.id;
  }
}

function pickDeck(player, deck) {
  if (takenBy(player, deck)) return;
  selected.value[player] = deck.id;
  ensureUnique(player);
}

function onStart() {
  ensureUnique("p1");
  startGame(findDeck(selected.value.p1), findDeck(selected.value.p2));
}

function onChooseDeck() {
  const deck = allDecks.value.find(
    (item) => item.id === selected.value[mySeat.value],
  );
  if (deck && !takenBy(mySeat.value, deck)) chooseDeck(deck);
}

const playerTag = (player) =>
  playerLabel(player) +
  (online.value && mySeat.value === player ? ` · ${t("packYou")}` : "");

function onSurrender() {
  surrenderOpen.value = false;
  boostOpen.value = false;
  selection.value = [];
  surrender(viewer.value);
}

function onNewGame() {
  resetGame();
}
</script>

<style scoped>
.game-page {
  padding: 2rem 1rem;
}

.game-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.game-beta {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(var(--color-info-rgb), 0.15);
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  color: var(--color-info);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-note {
  margin: 8px 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(var(--color-info-rgb), 0.4);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-muted);
  font-size: 12.5px;
}

.game-subtitle {
  margin: 20px 0 12px;
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-setup {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.game-setup-map {
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-setup-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.game-setup-row label {
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-setup .action-btn {
  flex: 0 0 auto;
  align-self: flex-start;
}

.game-empty {
  color: var(--text-dim);
  font-size: 13px;
  font-style: italic;
}

.deck-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deck-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.deck-name {
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
}

.deck-meta {
  color: var(--text-dim);
  font-size: 12px;
}

.game-banner {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 14px;
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  box-shadow: inset 0 0 20px var(--border-strong);
}

.game-banner.is-p1 {
  background: var(--color-player);
}

.game-banner.is-p2 {
  background: var(--color-opponent);
}

.game-banner.is-done {
  background: var(--color-proceed);
}

.map-tiles,
.deck-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.map-tile {
  width: 180px;
  padding: 6px;
  border-radius: 10px;
  border: 2px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.map-tile img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin-bottom: 4px;
  border-radius: 6px;
  object-fit: cover;
}

.map-tile.is-selected,
.deck-tile.is-selected {
  border-color: var(--color-proceed);
  background: rgba(var(--color-proceed-rgb), 0.12);
}

.map-tile:disabled {
  cursor: default;
}

.deck-tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 260px;
  padding: 8px 40px 8px 8px;
  border-radius: 10px;
  border: 2px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
  cursor: pointer;
}

.deck-tile img {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
}

.deck-tile-info {
  min-width: 0;
}

.deck-test {
  margin-left: 4px;
  color: var(--color-info);
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.game-start {
  margin-top: 16px;
}

.game-lobby-line {
  color: var(--text-muted);
  font-size: 13px;
}

.game-prompt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(var(--color-proceed-rgb), 0.5);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-white);
  font-size: 14px;
  font-weight: 700;
}

.game-skip {
  margin-left: auto;
  background: var(--bg-slate-hover);
  border: 1px solid var(--border-medium);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0;
}

.game-player {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.game-player.is-p1 {
  border-color: rgba(var(--color-player-rgb), 0.7);
}

.game-player.is-p2 {
  border-color: rgba(var(--color-opponent-rgb), 0.7);
}

.game-player {
  position: relative;
}

.game-player.is-active {
  box-shadow: 0 0 16px rgba(var(--color-proceed-rgb), 0.45);
}

.game-player-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.game-player-avatar {
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 3px solid var(--border-medium);
  object-fit: cover;
  object-position: top;
}

.game-player.is-p1 .game-player-avatar {
  border-color: rgba(var(--color-player-rgb), 0.9);
}

.game-player.is-p2 .game-player-avatar {
  border-color: rgba(var(--color-opponent-rgb), 0.9);
}

.game-player-who {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.game-player-name {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-player-hero {
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.game-player-hp {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--color-danger);
}

.game-hp-icon {
  font-size: 18px;
}

.game-hp-value {
  color: var(--text-white);
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.game-sidekick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.game-sidekick-name {
  color: var(--text-white);
}

.game-sidekick-hp {
  color: var(--color-danger);
  font-weight: 800;
}

.game-sidekick-hp.is-down {
  color: var(--text-dim);
}

.game-hp-max {
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 700;
}

.game-hp {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(var(--bg-dark-rgb), 0.9);
}

.game-hp-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.game-counters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.game-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border-radius: 10px;
  background: rgba(var(--bg-dark-rgb), 0.6);
  border: 1px solid var(--border-light);
}

.game-counter-icon {
  font-size: 16px;
  line-height: 1;
}

.game-counter-value {
  color: var(--text-white);
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
}

.game-counter-label {
  color: var(--text-dim);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.game-player-passive {
  margin-top: 10px;
  color: var(--text-dim);
  font-size: 11.5px;
  line-height: 1.4;
}

.game-boost {
  background: linear-gradient(180deg, #ffb347, #f08c00);
  border: 2px solid #ffd27a;
  color: #1a1a1a;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(255, 170, 40, 0.45);
}

.game-boost:not(:disabled):hover {
  filter: brightness(1.12);
}

.game-boost:disabled {
  box-shadow: none;
  filter: grayscale(0.6);
}

.game-surrender.is-danger {
  background: #c62828;
  border: 2px solid #ff8a80;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 0 10px rgba(255, 80, 80, 0.35);
}

.game-surrender.is-danger:hover {
  background: #e53935;
  color: #fff;
}

.game-cancel {
  background: var(--bg-slate-hover);
  border: 2px solid var(--text-light);
  color: var(--text-white);
  font-weight: 700;
}

.game-cancel:hover {
  background: var(--text-light);
  color: #1a1a1a;
}

.game-notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #ff8a80;
  background: rgba(198, 40, 40, 0.25);
  color: var(--text-white);
  font-weight: 700;
}

.game-log {
  overflow: hidden;
  background: rgba(var(--bg-dark-rgb), 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}

.game-log-toggle {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-log-body {
  max-height: 380px;
  overflow-y: auto;
  padding: 0 14px 12px;
}

.game-log-line {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.game-log-line.is-reveal {
  color: var(--text-light);
  font-weight: 700;
}

.game-log-line.is-damage {
  color: #f87171;
  font-weight: 700;
}

.game-log-line.is-turn {
  padding: 2px 0;
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-log-card {
  flex: none;
  width: 56px;
  height: 78px;
  padding: 0;
  border: 1px solid var(--color-warning);
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  cursor: zoom-in;
}

.game-log-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-log-block {
  margin-top: 14px;
}

.game-log-group {
  margin-top: 8px;
  padding: 6px 10px;
  border-left: 3px solid var(--border-medium);
  border-radius: 0 8px 8px 0;
  background: rgba(255, 255, 255, 0.03);
}

.game-log-group.is-p1 {
  border-left-color: var(--color-player);
}

.game-log-group.is-p2 {
  border-left-color: var(--color-opponent);
}

.game-log-group.is-turn-head {
  background: rgba(255, 255, 255, 0.07);
}

.game-log-group-title {
  color: var(--text-dim);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-log-line > span {
  white-space: pre-wrap;
}

.game-log-line.is-action-start {
  color: var(--text-white);
  font-weight: 800;
}

.log-p1 {
  color: var(--color-player);
  font-weight: 800;
}

.log-p2 {
  color: var(--color-opponent);
  font-weight: 800;
}

.log-name {
  color: var(--color-warning);
  font-weight: 700;
}

.log-num {
  color: var(--text-white);
  font-weight: 800;
}

.game-modal-box.is-logcard {
  width: min(340px, 90vw);
}

.game-modal,
.game-pass {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 24px 12px;
  background: rgba(var(--bg-dark-rgb), 0.9);
}

.game-pass {
  z-index: 2100;
  align-items: center;
  background: var(--bg-dark);
}

.game-modal-box,
.game-pass-box {
  width: 100%;
  max-width: 760px;
  padding: 18px;
  background: var(--bg-slate);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
}

.game-pass-box {
  max-width: 420px;
  text-align: center;
}

.game-pass-box h3 {
  margin: 0 0 16px;
  color: var(--text-white);
  font-size: 18px;
  font-weight: 800;
}

.toss {
  margin-top: 16px;
}
.toss-dice {
  display: flex;
  gap: 28px;
  margin: 12px 0;
}
.toss-side {
  text-align: center;
}
.toss-die {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  margin: 0 auto 8px;
  border: 2px solid var(--border-medium);
  border-radius: 16px;
  background: var(--bg-slate);
  color: var(--text-white);
  font-size: 40px;
  font-weight: 900;
}
.toss-die.is-rolling {
  animation: toss-roll 0.45s linear infinite;
}
.toss-side.is-winner .toss-die {
  border-color: #f59e0b;
  box-shadow: 0 0 18px rgba(245, 158, 11, 0.55);
}
.toss-name {
  color: var(--text-light);
  font-size: 13px;
  font-weight: 800;
}
.toss-order {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
@keyframes toss-roll {
  0% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(14deg) scale(1.08);
  }
  50% {
    transform: rotate(0deg) scale(1);
  }
  75% {
    transform: rotate(-14deg) scale(1.08);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
}

.game-modal-box.is-mulligan {
  max-width: min(1180px, 96vw);
  max-height: 92vh;
  padding: 24px;
  overflow-y: auto;
}

.game-modal-box.is-mulligan .game-modal-title {
  font-size: 20px;
}

.mulligan-hand {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.game-modal-actions.is-center {
  justify-content: center;
}

@media (max-width: 900px) {
  .mulligan-hand {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .mulligan-hand {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.mulligan-note {
  margin: 0 0 14px;
  color: var(--text-light);
  font-size: 14px;
}

.mulligan-reveal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mulligan-reveal-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-white);
  font-weight: 800;
}

.mulligan-reveal-row.is-mulligan {
  border-color: rgba(245, 158, 11, 0.6);
  background: rgba(245, 158, 11, 0.12);
}

.game-modal-title {
  margin: 0 0 14px;
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.game-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.reveal-label {
  margin-bottom: 8px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.reveal-empty {
  padding: 24px 12px;
  border: 1px dashed var(--border-medium);
  border-radius: 12px;
  color: var(--text-dim);
  text-align: center;
}

.reveal-value {
  margin-top: 8px;
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.reveal-result {
  margin: 14px 0 0;
  color: var(--color-warning);
  font-size: 14px;
  font-weight: 800;
}

.game-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-bottom: 12px;
}

.game-bar .game-banner {
  flex: 1 1 260px;
  margin: 0;
  padding: 10px 14px;
}

.game-bar .game-actions {
  flex: 0 1 auto;
  margin: 0;
}

.game-layout {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) 160px;
  gap: 12px;
  align-items: start;
}

.game-layout .slot-p1 {
  grid-column: 1;
  grid-row: 1;
}

.game-layout .slot-p2 {
  grid-column: 3;
  grid-row: 1;
}

.game-center {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

.game-center .game-log {
  margin-top: 10px;
}

@media (max-width: 991px) {
  .game-layout {
    grid-template-columns: 1fr 1fr;
  }

  .game-layout .slot-p1 {
    grid-column: 1;
    grid-row: 1;
  }

  .game-layout .slot-p2 {
    grid-column: 2;
    grid-row: 1;
  }

  .game-center {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}

.game-layout .game-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 12px 8px;
  text-align: center;
}

.game-layout .game-player-avatar {
  width: 76px;
  height: 76px;
}

.game-layout .game-player-hp {
  justify-content: center;
}

.game-layout .game-hp {
  width: 100%;
}

.game-layout .game-counters {
  grid-template-columns: 1fr;
  width: 100%;
  gap: 6px;
}

.game-layout .game-counter {
  flex-direction: row;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 10px;
}

.game-layout .game-counter-value {
  font-size: 18px;
}

.game-layout .game-counter-label {
  flex: 1 1 auto;
  text-align: left;
}

.game-player-passive summary {
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 700;
}

.game-player-passive p {
  margin: 6px 0 0;
  text-align: left;
}

.game-suit {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px solid var(--color-warning);
  border-radius: 10px;
  background: rgba(var(--bg-slate-rgb), 0.6);
  color: var(--text-light);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.game-suit:hover {
  background: rgba(var(--bg-slate-rgb), 0.9);
}

.game-suit-title {
  flex: 1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.game-suit-count {
  min-width: 26px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--color-warning);
  color: #111827;
  text-align: center;
}

.game-modal-box {
  position: relative;
}

.game-modal-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-medium);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  color: var(--text-white);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.game-modal-close:hover {
  background: var(--color-warning);
  color: #111827;
}

.game-hand .is-dim {
  opacity: 0.4;
}

.game-boost.is-on,
.game-boost.is-on:disabled {
  opacity: 1;
  background: var(--color-warning) !important;
  border-color: var(--color-warning) !important;
  color: #1a1a1a !important;
}

.game-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 16px 0;
}

.deck-tile.is-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.game-confirm-box {
  max-width: 420px;
  text-align: center;
}

.game-toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: min(320px, calc(100vw - 32px));
  pointer-events: none;
}

.game-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border-left: 5px solid var(--text-light);
  background: rgba(var(--bg-dark-rgb), 0.95);
  color: var(--text-white);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.game-toast.is-damage {
  border-left-color: #ff5252;
}

.game-toast.is-heal {
  border-left-color: #4cd964;
}

.game-toast.is-draw {
  border-left-color: #4aa8ff;
}

.game-toast.is-discard {
  border-left-color: #ffb347;
}

.game-toast-card {
  width: 44px;
  border-radius: 4px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* активний герой виділений, неактивний - менший і приглушений */
.game-layout .game-player {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    filter 0.3s ease,
    box-shadow 0.3s ease;
}

.game-layout .game-player.is-active {
  z-index: 2;
  transform: scale(1.05);
}

.game-layout .game-player.is-idle {
  transform: scale(0.94);
  opacity: 0.5;
  filter: grayscale(0.55) brightness(0.7);
}

/* попап бою лежить поверх мапи */
.game-center {
  position: relative;
}

.game-hint {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(var(--color-info-rgb), 0.6);
  background: rgba(var(--color-info-rgb), 0.15);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 800;
}

/* ---------- кнопки в рядку підказки ---------- */
.game-prompt-line .btn,
.game-prompt-line .action-btn {
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  padding: 6px 14px !important;
  font-size: 12px;
}

.game-prompt-line .btn-outline-light.action-btn {
  border: 2px solid var(--border-strong) !important;
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--text-white) !important;
}

.game-prompt-line .btn-outline-light.action-btn:hover {
  border-color: var(--color-info) !important;
  color: var(--color-info) !important;
}

.game-footer .game-bug {
  margin-right: auto;
}

/* ---------- вікно бою VS ---------- */
.game-modal-box.is-versus .game-modal-actions {
  justify-content: center;
}

.game-modal-box.is-versus {
  max-width: 800px;
  background: linear-gradient(180deg, #1e293b, #0f172a);
}

.vs-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
}

.vs-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vs-side:nth-child(1) {
  grid-column: 1;
  grid-row: 1;
}

.vs-side:nth-child(2) {
  grid-column: 3;
  grid-row: 1;
}

.vs-center {
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  text-align: center;
}

.vs-avatar {
  width: 54px;
  height: 54px;
  border: 3px solid var(--border-strong);
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
}

.vs-side.is-p1 .vs-avatar {
  border-color: var(--color-player);
}

.vs-side.is-p2 .vs-avatar {
  border-color: var(--color-opponent);
}

.vs-grid .reveal-card {
  width: 160px;
  max-width: 160px;
}

.vs-grid .reveal-label {
  text-align: center;
}

.vs-calc {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 4px 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

.vs-calc .is-boost {
  color: var(--color-warning);
}

.vs-calc strong {
  color: var(--text-white);
  font-size: 24px;
}

.vs-boost {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px dashed var(--color-warning);
  border-radius: 10px;
  color: var(--color-warning);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.vs-boost-row {
  display: flex;
  gap: 6px;
}

.vs-boost-card {
  width: 92px;
}

.vs-mark {
  color: var(--color-warning);
  font-size: 46px;
  font-style: italic;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 18px rgba(250, 204, 21, 0.6);
}

.vs-score {
  margin-top: 6px;
  color: var(--text-white);
  font-size: 22px;
  font-weight: 800;
}

.vs-damage {
  margin-top: 6px;
  color: #ff7a8c;
  font-size: 14px;
  font-weight: 800;
}

.game-modal-actions .action-btn {
  flex: 0 0 auto;
  width: auto;
  min-width: 160px;
}

.modal-peek {
  position: fixed;
  bottom: 24px;
  left: 50%;
  z-index: 2050;
  padding: 10px 20px;
  border: 2px solid var(--color-warning);
  border-radius: 999px;
  background: var(--bg-dark);
  color: var(--color-warning);
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  transform: translateX(-50%);
  cursor: pointer;
}

@media (max-width: 575px) {
  .vs-grid {
    grid-template-columns: 1fr 1fr;
  }

  .vs-center {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .vs-side:nth-child(2) {
    grid-column: 2;
  }

  .vs-grid .reveal-card {
    width: 120px;
  }
}

/* лічильник скиду - кнопка для перегляду */
.game-counter.is-button {
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.game-counter.is-button:hover {
  border-color: var(--color-info, #38bdf8);
  background: rgba(var(--bg-slate-rgb), 0.8);
}

.game-hint-empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

/* перегляд скиду: великі карти, однакові складені стопкою */
.game-modal-box.is-discard {
  max-width: min(1180px, 96vw);
  max-height: 92vh;
  overflow-y: auto;
}

.discard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 22px 16px;
  padding: 6px 6px 18px;
}

.discard-stack {
  --offset-x: 16px;
  --offset-y: 12px;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 230px;
  padding-right: calc((var(--n) - 1) * var(--offset-x));
  padding-bottom: calc((var(--n) - 1) * var(--offset-y));
}

.discard-stack-card {
  grid-area: 1 / 1;
  width: 100%;
  transform: translate(
    calc(var(--i) * var(--offset-x)),
    calc(var(--i) * var(--offset-y))
  );
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.discard-count {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 5;
  min-width: 34px;
  padding: 3px 9px;
  text-align: center;
  border-radius: 999px;
  background: var(--color-warning);
  color: #111827;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

@media (max-width: 575px) {
  .discard-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
