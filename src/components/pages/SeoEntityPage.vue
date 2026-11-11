<template>
  <div class="entity-page container">
    <nav class="entity-crumbs">
      <router-link :to="{ name: 'home' }">{{ crumbs.home }}</router-link>
      <span>/</span>
      <router-link :to="{ name: hubRoute }">{{ crumbs.hub }}</router-link>
    </nav>

    <p v-if="status === 'loading'" class="entity-note">…</p>

    <template v-else-if="status === 'missing'">
      <h1 class="page-main-title">{{ crumbs.notFound }}</h1>
      <router-link :to="{ name: hubRoute }" class="entity-link">
        {{ crumbs.hub }}
      </router-link>
    </template>

    <template v-else-if="content">
      <div class="entity-head">
        <img
          v-if="content.image"
          class="entity-image"
          :class="{ 'is-map': kind === 'map' }"
          :src="content.image.src"
          :alt="content.image.alt"
        />
        <div>
          <h1 class="page-main-title">{{ content.h1 }}</h1>
          <p class="entity-intro">{{ content.intro }}</p>
        </div>
      </div>

      <section v-for="block in content.blocks" :key="block.h2" class="entity-block">
        <h2 class="entity-h2">{{ block.h2 }}</h2>

        <template v-if="block.kind === 'paragraphs'">
          <p v-for="(text, index) in block.items" :key="index" class="entity-p">
            {{ text }}
          </p>
        </template>

        <div v-else-if="block.kind === 'cards'" class="entity-cards">
          <figure v-for="item in block.items" :key="item.src" class="entity-card">
            <img :src="item.src" :alt="item.alt" loading="lazy" decoding="async" />
            <figcaption>{{ item.text }}</figcaption>
          </figure>
        </div>

        <ul v-else class="entity-list">
          <li v-for="item in block.items" :key="item.text">
            <router-link v-if="item.path" :to="item.path">{{ item.text }}</router-link>
            <span v-else>{{ item.text }}</span>
            <span v-if="item.note" class="entity-note-inline"> · {{ item.note }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { applySeoContent } from "../../seo.js";
import { loadGuide, loadSeoModel } from "../../seoClient.js";
import {
  heroContent,
  heroesHubContent,
  mapContent,
  mapsHubContent,
} from "../../seoData.js";

const props = defineProps({
  kind: { type: String, required: true },
  slug: { type: String, default: "" },
});

const { lang } = useDraftState();
const status = ref("loading");
const model = ref(null);
const guide = ref(null);

const isHero = computed(() => props.kind === "hero" || props.kind === "heroes");
const hubRoute = computed(() => (isHero.value ? "heroes" : "map-list"));

const crumbs = computed(() =>
  lang.value === "ua"
    ? {
        home: "Головна",
        hub: isHero.value ? "Усі герої" : "Усі мапи",
        notFound: "Сторінку не знайдено",
      }
    : {
        home: "Home",
        hub: isHero.value ? "All heroes" : "All maps",
        notFound: "Page not found",
      },
);

const entity = computed(() => {
  if (!model.value) return null;
  if (props.kind === "hero") return model.value.heroBySlug.get(props.slug) || null;
  if (props.kind === "map") return model.value.mapBySlug.get(props.slug) || null;
  return {};
});

const content = computed(() => {
  if (!model.value || !entity.value) return null;
  const language = lang.value === "ua" ? "ua" : "en";
  if (props.kind === "hero") {
    return heroContent(model.value, entity.value, guide.value, language);
  }
  if (props.kind === "map") return mapContent(model.value, entity.value, language);
  return props.kind === "heroes"
    ? heroesHubContent(model.value, language)
    : mapsHubContent(model.value, language);
});

async function load() {
  status.value = "loading";
  guide.value = null;
  try {
    model.value = await loadSeoModel();
  } catch {
    status.value = "missing";
    return;
  }
  if (!entity.value) {
    status.value = "missing";
    return;
  }
  if (props.kind === "hero") guide.value = await loadGuide(entity.value.name);
  status.value = "ready";
}

watch(() => [props.kind, props.slug], load, { immediate: true });

// title/description/canonical під поточну сторінку й мову
watch(
  [content, status],
  ([page, state]) => {
    if (state === "missing") applySeoContent(null);
    else if (page) applySeoContent(page, lang.value);
  },
  { immediate: true },
);
</script>

<style scoped>
.entity-page {
  padding: 2rem 1rem;
  max-width: 960px;
}

.entity-crumbs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 700;
}

.entity-crumbs a,
.entity-link,
.entity-list a {
  color: #4f7cff;
  text-decoration: none;
}

.entity-crumbs a:hover,
.entity-link:hover,
.entity-list a:hover {
  text-decoration: underline;
}

.entity-head {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 18px;
}

.entity-image {
  flex: 0 0 auto;
  width: 160px;
  height: 160px;
  border-radius: 16px;
  object-fit: cover;
  object-position: top;
  border: 1px solid var(--border-medium);
}

.entity-image.is-map {
  width: 260px;
  height: 160px;
  object-position: center;
}

.entity-intro {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.55;
}

.entity-block {
  margin-top: 22px;
  padding: 16px 18px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 14px;
}

.entity-h2 {
  margin: 0 0 10px;
  color: var(--text-white);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.entity-p {
  margin: 0 0 8px;
  color: var(--text-light);
  font-size: 14px;
  line-height: 1.55;
}

.entity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  font-weight: 700;
}

.entity-note-inline {
  color: var(--text-dim);
  font-weight: 600;
}

.entity-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.entity-card {
  width: 150px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

.entity-card img {
  display: block;
  width: 100%;
  height: auto;
  margin-bottom: 4px;
  border-radius: 8px;
}

.entity-note {
  color: var(--text-dim);
}

@media (max-width: 640px) {
  .entity-head {
    flex-direction: column;
  }
  .entity-image.is-map {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
  }
}
</style>
