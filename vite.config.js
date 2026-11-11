import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import {
  renderBody,
  renderHead,
  renderSitemap,
  seoPages,
} from "./src/seoRoutes.js";
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

// SEO: вставляє мета-теги та статичний вміст у index.html, а під час збірки
// створює окремий index.html для кожної сторінки (dist/draft/index.html тощо) і
// sitemap.xml. Так GitHub Pages віддає прямі посилання зі статусом 200, а не
// через 404.html, і кожна сторінка має власні title/description/canonical.
function seoPrerender() {
  let outDir = "dist";
  const head = (page) =>
    `<!--seo:start-->${renderHead(page)}\n    <!--seo:end-->`;
  const body = (page) => `<!--seo-body:start-->${renderBody(page)}<!--seo-body:end-->`;
  return {
    name: "seo-prerender",
    configResolved(config) {
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
      for (const page of seoPages.slice(1)) {
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
      writeFileSync(resolve(outDir, "sitemap.xml"), renderSitemap(today));
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
