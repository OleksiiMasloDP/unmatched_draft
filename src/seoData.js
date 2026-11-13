// Дані та тексти для окремих сторінок героїв і мап (SEO). Модуль без залежностей
// від Vue/DOM: його використовують і сторінка у браузері (SeoEntityPage.vue), і
// збірка (vite.config.js створює з нього статичні HTML-сторінки та sitemap).
const LABELS = {
  en: {
    heroTitle: "{name}: Unmatched hero guide, maps and matchups",
    heroIntro:
      "{name} is an Unmatched hero from {set}. Elo rating {elo}, ranked #{rank} of {total} heroes.",
    style: "Playstyle: {style}.",
    complexity: "Complexity: {n}/5.",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    tips: "General tips",
    keyCards: "Key cards",
    bestMaps: "Best maps for {name}",
    worstMaps: "Maps to avoid with {name}",
    bestMatchups: "Strongest matchups",
    worstMatchups: "Toughest matchups",
    matchupTips: "Matchup tips",
    sameSet: "More heroes from {set}",
    winrate: "{n}% win rate",
    heroDescBase: "Unmatched {name} guide: Elo {elo}",
    heroDescMaps: ", best maps ({list})",
    heroDescMatchups: ", strongest and toughest matchups",
    heroDescGuide: ", tips and key cards",
    mapTitle: "{name} map in Unmatched: best and worst heroes",
    mapIntro:
      "{name} is an Unmatched map from {set}. {f} heroes are favored here, {n} are neutral and {d} are disfavored.",
    favored: "Heroes favored on {name}",
    neutral: "Neutral heroes on {name}",
    disfavored: "Heroes disfavored on {name}",
    sameSetMaps: "More maps from {set}",
    mapDesc:
      "Unmatched {name} map: heroes that thrive here{good} and heroes that struggle{bad}.",
    mapDescList: " ({list})",
    heroesTitle: "All Unmatched Heroes: ratings, maps and matchups",
    heroesDesc:
      "Browse {n} Unmatched heroes with Elo ratings, best maps, matchups and character guides.",
    heroesH1: "All Unmatched Heroes",
    heroesIntro: "{n} heroes with ratings, favored maps and matchup data.",
    mapsTitle: "All Unmatched Maps: favored and disfavored heroes",
    mapsDesc:
      "Browse {n} Unmatched maps and see which heroes are favored or disfavored on each of them.",
    mapsH1: "All Unmatched Maps",
    mapsIntro: "{n} maps with the heroes that prefer and avoid them.",
    elo: "Elo {n}",
    cardsAlt: "{card} card, {name}",
    heroAlt: "{name}, Unmatched hero",
    mapAlt: "{name} map, Unmatched",
  },
  ua: {
    heroTitle: "{name}: гайд на героя Unmatched, мапи та матчапи",
    heroIntro:
      "{name} - герой Unmatched із набору {set}. Рейтинг Elo {elo}, місце #{rank} із {total} героїв.",
    style: "Стиль гри: {style}.",
    complexity: "Складність: {n}/5.",
    strengths: "Сильні сторони",
    weaknesses: "Слабкі сторони",
    tips: "Загальні поради",
    keyCards: "Ключові карти",
    bestMaps: "Найкращі мапи для {name}",
    worstMaps: "Мапи, яких варто уникати з {name}",
    bestMatchups: "Найсильніші матчапи",
    worstMatchups: "Найскладніші матчапи",
    matchupTips: "Поради щодо матчапів",
    sameSet: "Інші герої з набору {set}",
    winrate: "вінрейт {n}%",
    heroDescBase: "Гайд на {name} в Unmatched: рейтинг Elo {elo}",
    heroDescMaps: ", найкращі мапи ({list})",
    heroDescMatchups: ", найсильніші й найскладніші матчапи",
    heroDescGuide: ", поради та ключові карти",
    mapTitle: "Мапа {name} в Unmatched: найкращі й найгірші герої",
    mapIntro:
      "{name} - мапа Unmatched із набору {set}. Тут вигідно {f} героям, нейтрально {n}, невигідно {d}.",
    favored: "Героям вигідна мапа {name}",
    neutral: "Нейтральні герої на мапі {name}",
    disfavored: "Героям невигідна мапа {name}",
    sameSetMaps: "Інші мапи з набору {set}",
    mapDesc:
      "Мапа {name} в Unmatched: герої, яким вона підходить{good}, і герої, яким вона заважає{bad}.",
    mapDescList: " ({list})",
    heroesTitle: "Усі герої Unmatched: рейтинги, мапи та матчапи",
    heroesDesc:
      "Перегляньте {n} героїв Unmatched з рейтингами Elo, найкращими мапами, матчапами та гайдами.",
    heroesH1: "Усі герої Unmatched",
    heroesIntro: "{n} героїв із рейтингами, вигідними мапами та матчапами.",
    mapsTitle: "Усі мапи Unmatched: вигідні й невигідні герої",
    mapsDesc:
      "Перегляньте {n} мап Unmatched і дізнайтесь, яким героям кожна з них вигідна чи невигідна.",
    mapsH1: "Усі мапи Unmatched",
    mapsIntro: "{n} мап та герої, яким вони підходять або заважають.",
    elo: "Elo {n}",
    cardsAlt: "карта {card}, {name}",
    heroAlt: "{name}, герой Unmatched",
    mapAlt: "Мапа {name}, Unmatched",
  },
};

const tt = (lang, key, vars = {}) => {
  let text = (LABELS[lang] || LABELS.en)[key] ?? LABELS.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
};

export const slugify = (name) =>
  String(name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normName = (name) => slugify(name);

const clip = (text, max = 158) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

const humanize = (file) =>
  String(file)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

function withSlugs(items) {
  const used = new Set();
  return items.map((item) => {
    const base = slugify(item.name) || `item-${item.id}`;
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return { ...item, slug };
  });
}

// characters: [{id,name,elo,image,set}], matchups: [{a,b,winrate_a}], maps: [...]
export function buildSeoModel({ characters, matchups, maps }) {
  const heroes = withSlugs(characters).sort((a, b) => b.elo - a.elo);
  heroes.forEach((hero, index) => (hero.rank = index + 1));
  const mapList = withSlugs(maps);

  const heroByNorm = new Map(heroes.map((hero) => [normName(hero.name), hero]));
  const heroRef = (name) => {
    const hero = heroByNorm.get(normName(name));
    return hero ? { name: hero.name, slug: hero.slug } : { name, slug: null };
  };

  for (const hero of heroes) {
    hero.maps = { favored: [], neutral: [], disfavored: [] };
    hero.matchups = [];
  }
  for (const map of mapList) {
    const place = (names, field) => {
      for (const name of names || []) {
        const hero = heroByNorm.get(normName(name));
        if (hero) hero.maps[field].push({ name: map.name, slug: map.slug });
      }
    };
    place(map.favoredBy, "favored");
    place(map.neutralTo, "neutral");
    place(map.disfavoredBy, "disfavored");
  }
  for (const entry of matchups) {
    const a = heroByNorm.get(normName(entry.a));
    const b = heroByNorm.get(normName(entry.b));
    if (a && b) {
      a.matchups.push({ name: b.name, slug: b.slug, winrate: entry.winrate_a });
      b.matchups.push({
        name: a.name,
        slug: a.slug,
        winrate: 100 - entry.winrate_a,
      });
    }
  }

  return {
    heroes,
    maps: mapList,
    heroBySlug: new Map(heroes.map((hero) => [hero.slug, hero])),
    mapBySlug: new Map(mapList.map((map) => [map.slug, map])),
    heroRef,
  };
}

// ---------- сторінка героя ----------
export function heroContent(model, hero, guide, lang = "en") {
  const key = lang === "ua" ? "ua" : "en";
  const vars = { name: hero.name, set: hero.set, elo: hero.elo };
  const blocks = [];
  const intro = [
    tt(key, "heroIntro", { ...vars, rank: hero.rank, total: model.heroes.length }),
  ];
  if (guide?.style?.[key]) intro.push(tt(key, "style", { style: guide.style[key] }));
  if (guide?.complexity) {
    intro.push(tt(key, "complexity", { n: guide.complexity }));
  }

  const list = (h2, items) => items.length && blocks.push({ kind: "list", h2, items });
  const paras = (h2, items) =>
    items?.length && blocks.push({ kind: "paragraphs", h2, items });

  paras(tt(key, "strengths"), guide?.features?.[key]);
  paras(tt(key, "weaknesses"), guide?.weaknesses?.[key]);
  paras(tt(key, "tips"), guide?.generalTips?.[key]);
  if (guide?.keyCards?.length) {
    blocks.push({
      kind: "cards",
      h2: tt(key, "keyCards"),
      items: guide.keyCards.map((card) => ({
        src: `images/cards/${hero.name}/${card.image}`,
        alt: tt(key, "cardsAlt", { card: humanize(card.image), name: hero.name }),
        text: humanize(card.image),
      })),
    });
  }

  const mapItems = (maps) =>
    maps.map((map) => ({ text: map.name, path: `/maps/${map.slug}` }));
  list(tt(key, "bestMaps", vars), mapItems(hero.maps.favored));
  list(tt(key, "worstMaps", vars), mapItems(hero.maps.disfavored));

  const ranked = [...hero.matchups].sort((x, y) => y.winrate - x.winrate);
  const matchItem = (m) => ({
    text: m.name,
    path: m.slug ? `/heroes/${m.slug}` : null,
    note: tt(key, "winrate", { n: m.winrate }),
  });
  list(tt(key, "bestMatchups"), ranked.slice(0, 6).map(matchItem));
  list(
    tt(key, "worstMatchups"),
    ranked
      .slice(-6)
      .reverse()
      .filter((m) => m.winrate < 50)
      .map(matchItem),
  );

  const tips = guide?.matchups ? Object.entries(guide.matchups) : [];
  if (tips.length) {
    blocks.push({
      kind: "paragraphs",
      h2: tt(key, "matchupTips"),
      items: tips.flatMap(([opponent, data]) => {
        const lines = data?.tips?.[key] || [];
        return lines.map((line, index) => (index === 0 ? `${opponent}: ${line}` : line));
      }),
    });
  }

  list(
    tt(key, "sameSet", vars),
    model.heroes
      .filter((other) => other.set === hero.set && other.slug !== hero.slug)
      .map((other) => ({ text: other.name, path: `/heroes/${other.slug}` })),
  );

  const mapNames = hero.maps.favored.slice(0, 2).map((m) => m.name).join(", ");
  return {
    path: `/heroes/${hero.slug}`,
    title: clip(tt(key, "heroTitle", vars), 70),
    description: clip(
      tt(key, "heroDescBase", vars) +
        (mapNames ? tt(key, "heroDescMaps", { list: mapNames }) : "") +
        (hero.matchups.length ? tt(key, "heroDescMatchups") : "") +
        (guide ? tt(key, "heroDescGuide") : "") +
        ".",
    ),
    h1: key === "ua" ? `${hero.name}: гайд на героя Unmatched` : `${hero.name}: Unmatched hero guide`,
    intro: intro.join(" "),
    image: { src: hero.image, alt: tt(key, "heroAlt", vars) },
    blocks,
  };
}

// ---------- сторінка мапи ----------
export function mapContent(model, map, lang = "en") {
  const key = lang === "ua" ? "ua" : "en";
  const vars = { name: map.name, set: map.set };
  const heroItems = (names) =>
    (names || []).map((name) => {
      const ref = model.heroRef(name);
      return { text: ref.name, path: ref.slug ? `/heroes/${ref.slug}` : null };
    });
  const favored = heroItems(map.favoredBy);
  const neutral = heroItems(map.neutralTo);
  const disfavored = heroItems(map.disfavoredBy);
  const blocks = [];
  const list = (h2, items) => items.length && blocks.push({ kind: "list", h2, items });
  list(tt(key, "favored", vars), favored);
  list(tt(key, "neutral", vars), neutral);
  list(tt(key, "disfavored", vars), disfavored);
  list(
    tt(key, "sameSetMaps", vars),
    model.maps
      .filter((other) => other.set === map.set && other.slug !== map.slug)
      .map((other) => ({ text: other.name, path: `/maps/${other.slug}` })),
  );
  const names = (items) =>
    items.slice(0, 3).map((item) => item.text).join(", ");
  return {
    path: `/maps/${map.slug}`,
    title: clip(tt(key, "mapTitle", vars), 70),
    description: clip(
      tt(key, "mapDesc", {
        ...vars,
        good: favored.length ? tt(key, "mapDescList", { list: names(favored) }) : "",
        bad: disfavored.length
          ? tt(key, "mapDescList", { list: names(disfavored) })
          : "",
      }),
    ),
    h1: key === "ua" ? `Мапа ${map.name} в Unmatched` : `${map.name} map in Unmatched`,
    intro: tt(key, "mapIntro", {
      ...vars,
      f: favored.length,
      n: neutral.length,
      d: disfavored.length,
    }),
    image: { src: map.image, alt: tt(key, "mapAlt", vars) },
    blocks,
  };
}

// ---------- сторінки-каталоги ----------
function groupedBySet(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.set)) groups.set(item.set, []);
    groups.get(item.set).push(item);
  }
  return [...groups.entries()];
}

export function heroesHubContent(model, lang = "en") {
  const key = lang === "ua" ? "ua" : "en";
  const sorted = [...model.heroes].sort((a, b) => a.name.localeCompare(b.name));
  return {
    path: "/heroes",
    title: tt(key, "heroesTitle"),
    description: tt(key, "heroesDesc", { n: model.heroes.length }),
    h1: tt(key, "heroesH1"),
    intro: tt(key, "heroesIntro", { n: model.heroes.length }),
    blocks: groupedBySet(sorted).map(([set, heroes]) => ({
      kind: "list",
      h2: set,
      items: heroes.map((hero) => ({
        text: hero.name,
        path: `/heroes/${hero.slug}`,
        note: tt(key, "elo", { n: hero.elo }),
      })),
    })),
  };
}

export function mapsHubContent(model, lang = "en") {
  const key = lang === "ua" ? "ua" : "en";
  const sorted = [...model.maps].sort((a, b) => a.name.localeCompare(b.name));
  return {
    path: "/map-list",
    title: tt(key, "mapsTitle"),
    description: tt(key, "mapsDesc", { n: model.maps.length }),
    h1: tt(key, "mapsH1"),
    intro: tt(key, "mapsIntro", { n: model.maps.length }),
    blocks: groupedBySet(sorted).map(([set, maps]) => ({
      kind: "list",
      h2: set,
      items: maps.map((map) => ({ text: map.name, path: `/maps/${map.slug}` })),
    })),
  };
}

// ---------- статичний HTML для пошукових ботів ----------
const esc = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function contentToHtml(content, siteUrl) {
  const link = (item) =>
    item.path
      ? `<a href="${siteUrl}${item.path}/">${esc(item.text)}</a>`
      : esc(item.text);
  const parts = [`<h1>${esc(content.h1)}</h1>`];
  if (content.image) {
    parts.push(
      `<img src="${siteUrl}/${content.image.src}" alt="${esc(content.image.alt)}" width="320" />`,
    );
  }
  if (content.intro) parts.push(`<p>${esc(content.intro)}</p>`);
  for (const block of content.blocks) {
    parts.push(`<h2>${esc(block.h2)}</h2>`);
    if (block.kind === "paragraphs") {
      parts.push(...block.items.map((text) => `<p>${esc(text)}</p>`));
    } else if (block.kind === "cards") {
      parts.push(
        `<ul>${block.items
          .map(
            (item) =>
              `<li><img src="${siteUrl}/${item.src}" alt="${esc(item.alt)}" width="160" /> ${esc(item.text)}</li>`,
          )
          .join("")}</ul>`,
      );
    } else {
      parts.push(
        `<ul>${block.items
          .map((item) => `<li>${link(item)}${item.note ? ` - ${esc(item.note)}` : ""}</li>`)
          .join("")}</ul>`,
      );
    }
  }
  return parts.join("\n");
}
