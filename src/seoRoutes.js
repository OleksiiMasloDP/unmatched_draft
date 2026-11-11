export const SITE_URL = "https://oleksiimaslodp.github.io/unmatched_draft";
export const SITE_NAME = "Unmatched Draftsim";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const seoPages = [
  {
    path: "/",
    names: ["home"],
    changefreq: "weekly",
    priority: "1.0",
    title: {
      en: "Unmatched Draftsim: draft tool, hero matchups and map guide",
      ua: "Unmatched Draftsim: драфт, матчапи героїв і гайд по мапах",
    },
    description: {
      en: "Free online draft tool for the Unmatched board game: pick and ban heroes, choose maps, explore hero matchups and read character guides.",
      ua: "Безкоштовний онлайн-інструмент для драфту в настільній грі Unmatched: піки та бани героїв, вибір мап, матчапи й гайди на персонажів.",
    },
    h1: {
      en: "Unmatched Draftsim",
      ua: "Unmatched Draftsim",
    },
  },
  {
    path: "/draft",
    names: ["main"],
    changefreq: "monthly",
    priority: "0.9",
    title: {
      en: "Unmatched Draft Simulator: pick, ban and choose maps",
      ua: "Симулятор драфту Unmatched: піки, бани та вибір мап",
    },
    description: {
      en: "Run an Unmatched draft online: ban and pick heroes in turns or in ladder mode, get ban recommendations and win rates, then choose the best map.",
      ua: "Проведіть драфт Unmatched онлайн: бани та піки героїв по черзі або в режимі ladder, рекомендації щодо банів, вінрейти й вибір найкращої мапи.",
    },
    h1: {
      en: "Unmatched Draft Simulator",
      ua: "Симулятор драфту Unmatched",
    },
  },
  {
    path: "/matchups",
    names: ["matchups"],
    changefreq: "monthly",
    priority: "0.8",
    title: {
      en: "Unmatched Hero Matchups: head-to-head win rates",
      ua: "Матчапи героїв Unmatched: вінрейти у дуелях",
    },
    description: {
      en: "Analyze head-to-head win rates between Unmatched heroes, find the best maps for the duel, or generate a balanced matchup from your own collection.",
      ua: "Аналізуйте вінрейти героїв Unmatched у дуелях, знаходьте найкращі мапи для поєдинку або згенеруйте збалансований матчап зі своєї колекції.",
    },
    h1: {
      en: "Unmatched Hero Matchups",
      ua: "Матчапи героїв Unmatched",
    },
  },
  {
    path: "/maps",
    names: ["maps"],
    changefreq: "monthly",
    priority: "0.8",
    title: {
      en: "Unmatched Map Guide: best maps for every hero",
      ua: "Гайд по мапах Unmatched: найкращі мапи для кожного героя",
    },
    description: {
      en: "Hero map guide for Unmatched: see which maps favor or disfavor each hero and pick the right battlefield for your fighter.",
      ua: "Гайд по мапах Unmatched: які мапи підходять кожному герою, а які ні, і як обрати правильне поле бою для свого бійця.",
    },
    h1: {
      en: "Unmatched Hero Map Guide",
      ua: "Гайд по мапах Unmatched",
    },
  },
  {
    path: "/guide",
    names: ["guide"],
    changefreq: "monthly",
    priority: "0.8",
    title: {
      en: "Unmatched Character Guides: tips and matchups",
      ua: "Гайди на персонажів Unmatched: поради та матчапи",
    },
    description: {
      en: "Character guides for Unmatched: meta insights, tactical tips and strategic matchup breakdowns for your favorite fighters.",
      ua: "Гайди на персонажів Unmatched: мета-інсайти, тактичні поради та розбір матчапів для ваших улюблених бійців.",
    },
    h1: {
      en: "Unmatched Character Guides",
      ua: "Гайди на персонажів Unmatched",
    },
  },
  {
    path: "/heroes",
    names: ["heroes"],
    changefreq: "weekly",
    priority: "0.8",
    title: {
      en: "All Unmatched Heroes: ratings, maps and matchups",
      ua: "Усі герої Unmatched: рейтинги, мапи та матчапи",
    },
    description: {
      en: "Browse Unmatched heroes with Elo ratings, best maps, matchups and character guides.",
      ua: "Перегляньте героїв Unmatched з рейтингами Elo, найкращими мапами, матчапами та гайдами.",
    },
    h1: {
      en: "All Unmatched Heroes",
      ua: "Усі герої Unmatched",
    },
  },
  {
    path: "/map-list",
    names: ["map-list"],
    changefreq: "weekly",
    priority: "0.7",
    title: {
      en: "All Unmatched Maps: favored and disfavored heroes",
      ua: "Усі мапи Unmatched: вигідні й невигідні герої",
    },
    description: {
      en: "Browse Unmatched maps and see which heroes are favored or disfavored on each of them.",
      ua: "Перегляньте мапи Unmatched і дізнайтесь, яким героям кожна з них вигідна чи невигідна.",
    },
    h1: {
      en: "All Unmatched Maps",
      ua: "Усі мапи Unmatched",
    },
  },
  {
    path: "/formats",
    names: ["formats"],
    changefreq: "monthly",
    priority: "0.6",
    title: {
      en: "Unmatched Draft Formats: bans, picks and custom rules",
      ua: "Формати драфту Unmatched: бани, піки та власні правила",
    },
    description: {
      en: "Choose or create your own Unmatched draft format: set the number of bans, picks and post-bans, the pick order and allowed heroes and maps.",
      ua: "Оберіть або створіть власний формат драфту Unmatched: кількість банів, піків і постбанів, порядок піків, дозволені герої та мапи.",
    },
    h1: {
      en: "Unmatched Draft Formats",
      ua: "Формати драфту Unmatched",
    },
  },
];

export const pageUrl = (path) =>
  path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}/`;

export const findSeoPage = (routeName) =>
  seoPages.find((page) => page.names.includes(routeName)) || null;

const esc = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function renderHead(page, lang = "en") {
  const title = esc(page.title[lang]);
  const description = esc(page.description[lang]);
  const url = pageUrl(page.path);
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ];
  if (page.path === "/") {
    const ld = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      description: page.description.en,
      inLanguage: ["en", "uk"],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    );
  }
  return lines.join("\n    ");
}

export function renderBody(page, lang = "en") {
  if (page.bodyHtml) {
    return `<main class="seo-fallback seo-entity">${page.bodyHtml}</main>`;
  }
  const links = seoPages
    .filter((item) => item.path !== "/")
    .map((item) => `<a href="${pageUrl(item.path)}">${esc(item.h1[lang])}</a>`)
    .join(" · ");
  return `<main class="seo-fallback"><h1>${esc(page.h1[lang])}</h1><p>${esc(
    page.description[lang],
  )}</p><nav>${links}</nav></main>`;
}

export function renderSitemap(date, pages = seoPages) {
  const urls = pages
    .map(
      (page) =>
        `  <url><loc>${pageUrl(page.path)}</loc><lastmod>${date}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
