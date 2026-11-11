import { createRouter, createWebHistory } from "vue-router";
import DraftPage from "./components/pages/DraftPage.vue";
import HeroMapGuide from "./components/pages/HeroMapGuide.vue";
import MatchupExplorer from "./components/pages/MatchupExplorer.vue";
import CharacterGuide from "./components/pages/CharacterGuide.vue";
import FormatsPage from "./components/pages/FormatsPage.vue";
import FormatEditor from "./components/pages/FormatEditor.vue";
import PackDraftPage from "./components/pages/PackDraftPage.vue";
import GamePage from "./components/pages/GamePage.vue";
import MapEditor from "./components/pages/MapEditor.vue";
import HomePage from "./components/pages/HomePage.vue";
import BotEditor from "./components/pages/BotEditor.vue";
import SeoEntityPage from "./components/pages/SeoEntityPage.vue";

export const routes = [
  { path: "/", name: "home", component: HomePage },
  { path: "/draft", name: "main", component: DraftPage },
  { path: "/maps", name: "maps", component: HeroMapGuide },
  { path: "/matchups", name: "matchups", component: MatchupExplorer },
  { path: "/guide", name: "guide", component: CharacterGuide },
  { path: "/formats", name: "formats", component: FormatsPage },
  { path: "/formats/new", name: "format-new", component: FormatEditor },
  {
    path: "/formats/:id",
    name: "format-edit",
    component: FormatEditor,
    props: true,
  },
  {
    path: "/pack-draft",
    name: "pack-draft",
    component: PackDraftPage,
  },
  { path: "/game", name: "game", component: GamePage },
  {
    path: "/heroes",
    name: "heroes",
    component: SeoEntityPage,
    props: { kind: "heroes" },
  },
  {
    path: "/heroes/:slug",
    name: "hero",
    component: SeoEntityPage,
    props: (route) => ({ kind: "hero", slug: String(route.params.slug) }),
  },
  {
    path: "/map-list",
    name: "map-list",
    component: SeoEntityPage,
    props: { kind: "maps" },
  },
  {
    path: "/maps/:slug",
    name: "map-detail",
    component: SeoEntityPage,
    props: (route) => ({ kind: "map", slug: String(route.params.slug) }),
  },
  { path: "/map-editor", name: "map-editor", component: MapEditor },
  { path: "/bot-editor", name: "bot-editor", component: BotEditor },
  { path: "/:pathMatch(.*)*", redirect: { name: "main" } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// Аналітика: та сама подія, що раніше відправлялась при зміні active_screen
router.afterEach((to) => {
  if (typeof window.gtag === "function") {
    const screen = String(to.name || "main");
    window.gtag("config", "G-6BTH35KNGC", {
      page_title: `Screen: ${screen}`,
      page_path: to.path,
    });
  }
});

export default router;
