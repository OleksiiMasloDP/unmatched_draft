import { createRouter, createWebHistory } from "vue-router";
import DraftPage from "./components/pages/DraftPage.vue";
import HeroMapGuide from "./components/pages/HeroMapGuide.vue";
import MatchupExplorer from "./components/pages/MatchupExplorer.vue";
import CharacterGuide from "./components/pages/CharacterGuide.vue";
import FormatsPage from "./components/pages/FormatsPage.vue";
import FormatEditor from "./components/pages/FormatEditor.vue";
import PackDraftPage from "./components/pages/PackDraftPage.vue";
import GamePage from "./components/pages/GamePage.vue";
import HomePage from "./components/pages/HomePage.vue";

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
    meta: { beta: true },
  },
  { path: "/game", name: "game", component: GamePage, meta: { beta: true } },
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
