<template>
  <footer class="fc">
    <div v-if="roster.length" class="fc-ticker" aria-hidden="true">
      <div class="fc-track">
        <img
          v-for="(c, i) in [...roster, ...roster]"
          :key="i"
          :src="c.image"
          alt=""
          loading="lazy"
        />
      </div>
    </div>
    <div class="fc-in">
      <span class="fc-logo">UNMATCHED <b>DRAFT</b></span>
      <nav class="fc-nav">
        <router-link
          v-for="l in links"
          :key="l.route"
          :to="{ name: l.route }"
          >{{ l.label }}</router-link
        >
        <button type="button" @click="openFeedback()">{{ T.report }}</button>
      </nav>
    </div>
    <p class="fc-stats">
      {{ characters.length }} {{ T.heroes }} · {{ maps.length }}
      {{ T.mapsWord }} · {{ T.disclaimer }} · © {{ year }}
    </p>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { useFeedback } from "../composables/useFeedback";

const { lang, characters, maps } = useDraftState();
const { openFeedback } = useFeedback();

const ua = computed(() => lang.value === "ua");
const year = new Date().getFullYear();

const T = computed(() =>
  ua.value
    ? {
        heroes: "героїв",
        mapsWord: "мап",
        report: "Повідомити про баг",
        disclaimer: "Фанатський проєкт, не пов'язаний з видавцями гри",
      }
    : {
        heroes: "heroes",
        mapsWord: "maps",
        report: "Report a bug",
        disclaimer: "Fan-made, not affiliated with the game's publishers",
      },
);

const links = computed(() => [
  { route: "main", label: ua.value ? "Драфт" : "Draft" },
  { route: "formats", label: ua.value ? "Формати" : "Formats" },
  { route: "maps", label: ua.value ? "Мапи героїв" : "Hero maps" },
  { route: "matchups", label: ua.value ? "Матчапи" : "Matchups" },
  { route: "guide", label: ua.value ? "Гайди" : "Guides" },
  { route: "pack-draft", label: "Pack Draft" },
  { route: "game", label: ua.value ? "Гра" : "Game" },
]);

const roster = computed(() => characters.value.filter((c) => c.image));
</script>

<style scoped>
.fc {
  margin-top: 100px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.55);
  border-top: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
}
.fc-ticker {
  overflow: hidden;
  padding: 16px 0 6px;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent,
    #000 12%,
    #000 88%,
    transparent
  );
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 12%,
    #000 88%,
    transparent
  );
}
.fc-track {
  display: flex;
  gap: 8px;
  width: max-content;
  animation: fc-scroll 160s linear infinite;
}
.fc-ticker:hover .fc-track {
  animation-play-state: paused;
}
.fc-track img {
  flex: none;
  width: 44px;
  height: 44px;
  object-fit: cover;
  object-position: top;
  border-radius: 10px;
  filter: grayscale(1);
  opacity: 0.45;
  transition:
    filter 0.25s ease,
    opacity 0.25s ease,
    transform 0.25s ease;
}
.fc-track img:hover {
  filter: none;
  opacity: 1;
  transform: translateY(-4px);
}
@keyframes fc-scroll {
  to {
    transform: translateX(-50%);
  }
}
.fc-in {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 16px 14px;
}
.fc-logo {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main, #f8fafc);
}
.fc-logo b {
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.fc-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}
.fc-nav a,
.fc-nav button {
  padding: 0;
  font-size: 0.85rem;
  text-decoration: none;
  color: var(--text-dim, #94a3b8);
  background: none;
  border: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}
.fc-nav a:hover,
.fc-nav button:hover {
  color: var(--text-white, #fff);
}
.fc-stats {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 20px;
  font-size: 0.75rem;
  color: var(--text-dim, #94a3b8);
  opacity: 0.7;
}

@media (prefers-reduced-motion: reduce) {
  .fc-track {
    animation: none;
  }
}
</style>
