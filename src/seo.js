import {
  OG_IMAGE,
  SITE_NAME,
  findSeoPage,
  pageUrl,
} from "./seoRoutes.js";

function setMeta(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const metaByName = (name, content) =>
  setMeta(
    `meta[name="${name}"]`,
    () => Object.assign(document.createElement("meta"), { name }),
    "content",
    content,
  );

const metaByProperty = (property, content) =>
  setMeta(
    `meta[property="${property}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute("property", property);
      return el;
    },
    "content",
    content,
  );

// Сторінки героїв і мап самі задають SEO-дані після завантаження даних.
const DYNAMIC_ROUTES = new Set(["hero", "map-detail"]);

// SEO для сторінки з готовим вмістом (герой, мапа). content = null - не знайдено.
export function applySeoContent(content, lang = "en") {
  const key = lang === "ua" ? "ua" : "en";
  document.documentElement.lang = key === "ua" ? "uk" : "en";
  if (!content) {
    document.title = SITE_NAME;
    metaByName("robots", "noindex, nofollow");
    return;
  }
  const url = pageUrl(content.path);
  document.title = content.title;
  metaByName("description", content.description);
  metaByName("robots", "index, follow, max-image-preview:large");
  setMeta(
    'link[rel="canonical"]',
    () => Object.assign(document.createElement("link"), { rel: "canonical" }),
    "href",
    url,
  );
  metaByProperty("og:title", content.title);
  metaByProperty("og:description", content.description);
  metaByProperty("og:url", url);
  metaByName("twitter:title", content.title);
  metaByName("twitter:description", content.description);
}

// Оновлює title, description, canonical, Open Graph та robots під поточну
// сторінку й мову. Сторінки без запису в seoPages (редактори, бета) - noindex.
export function applySeo(routeName, lang) {
  const key = lang === "ua" ? "ua" : "en";
  if (DYNAMIC_ROUTES.has(routeName)) return;
  document.documentElement.lang = key === "ua" ? "uk" : "en";

  const page = findSeoPage(routeName);
  if (!page) {
    document.title = SITE_NAME;
    metaByName("robots", "noindex, nofollow");
    return;
  }

  const title = page.title[key];
  const description = page.description[key];
  const url = pageUrl(page.path);

  document.title = title;
  metaByName("description", description);
  metaByName("robots", "index, follow, max-image-preview:large");
  setMeta(
    'link[rel="canonical"]',
    () => Object.assign(document.createElement("link"), { rel: "canonical" }),
    "href",
    url,
  );
  metaByProperty("og:title", title);
  metaByProperty("og:description", description);
  metaByProperty("og:url", url);
  metaByProperty("og:image", OG_IMAGE);
  metaByName("twitter:title", title);
  metaByName("twitter:description", description);
}
