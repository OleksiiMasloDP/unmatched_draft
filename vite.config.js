import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
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

export default defineConfig({
  plugins: [vue(), spa404Fallback()],
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
