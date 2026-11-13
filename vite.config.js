import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import {
  SITE_URL,
  renderBody,
  renderHead,
  renderSitemap,
  seoPages,
} from "./src/seoRoutes.js";
import {
  buildSeoModel,
  contentToHtml,
  heroContent,
  heroesHubContent,
  mapContent,
  mapsHubContent,
} from "./src/seoData.js";
import vue from "@vitejs/plugin-vue";

// GitHub Pages віддає 404.html для будь-якого невідомого шляху. Якщо це копія
// index.html, то прямі посилання на /maps, /formats тощо відкривають додаток,
// а далі маршрут обробляє vue-router.
function spa404Fallback() {
  let outDir = "dist";
  return {
    name: "spa-404-fallback",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

// Сторінки героїв, мап і каталогів зі статичним HTML (див. src/seoData.js).
function entityPages(root) {
  const read = (relative) =>
    JSON.parse(
      readFileSync(resolve(root, "public", relative), "utf8").replace(/^\uFEFF/, ""),
    );
  const characters = read("characters.json");
  const model = buildSeoModel({
    characters: characters.characters,
    matchups: characters.matchups,
    maps: read("maps.json"),
  });
  const guides = {};
  for (const name of read("guides/index.json")) {
    try {
      guides[name] = read(`guides/${name}.json`);
    } catch {
      /* гайд не обов'язковий */
    }
  }

  const toPage = (en, ua, extra) => ({
    path: en.path,
    names: [],
    changefreq: "monthly",
    title: { en: en.title, ua: ua.title },
    description: { en: en.description, ua: ua.description },
    h1: { en: en.h1, ua: ua.h1 },
    bodyHtml: contentToHtml(en, SITE_URL),
    ...extra,
  });

  const hubs = seoPages
    .filter((page) => page.names.includes("heroes") || page.names.includes("map-list"))
    .map((hub) => {
      const build = hub.names.includes("heroes") ? heroesHubContent : mapsHubContent;
      return {
        ...hub,
        bodyHtml: contentToHtml(build(model, "en"), SITE_URL),
      };
    });

  const heroes = model.heroes.map((hero) => {
    const guide = guides[hero.name] || null;
    return toPage(
      heroContent(model, hero, guide, "en"),
      heroContent(model, hero, guide, "ua"),
      { priority: "0.6" },
    );
  });
  const maps = model.maps.map((map) =>
    toPage(mapContent(model, map, "en"), mapContent(model, map, "ua"), {
      priority: "0.5",
    }),
  );
  return [...hubs, ...heroes, ...maps];
}

// SEO: вставляє мета-теги та статичний вміст у index.html, а під час збірки
// створює окремий index.html для кожної сторінки (dist/draft/index.html тощо) і
// sitemap.xml. Так GitHub Pages віддає прямі посилання зі статусом 200, а не
// через 404.html, і кожна сторінка має власні title/description/canonical.
function seoPrerender() {
  let outDir = "dist";
  let root = process.cwd();
  const head = (page) =>
    `<!--seo:start-->${renderHead(page)}\n    <!--seo:end-->`;
  const body = (page) => `<!--seo-body:start-->${renderBody(page)}<!--seo-body:end-->`;
  return {
    name: "seo-prerender",
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      const home = seoPages[0];
      return html
        .replace("<!--seo-head-->", head(home))
        .replace("<!--seo-body-->", body(home));
    },
    closeBundle() {
      const template = readFileSync(resolve(outDir, "index.html"), "utf8");
      const pages = [...seoPages.slice(1), ...entityPages(root)];
      for (const page of pages) {
        const html = template
          .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, () => head(page))
          .replace(
            /<!--seo-body:start-->[\s\S]*?<!--seo-body:end-->/,
            () => body(page),
          );
        const dir = resolve(outDir, page.path.slice(1));
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, "index.html"), html);
      }
      const today = new Date().toISOString().slice(0, 10);
      writeFileSync(
        resolve(outDir, "sitemap.xml"),
        renderSitemap(today, [seoPages[0], ...pages]),
      );
    },
  };
}

export default defineConfig({
  plugins: [vue(), seoPrerender(), spa404Fallback()],
  base: "/unmatched_draft/",
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
