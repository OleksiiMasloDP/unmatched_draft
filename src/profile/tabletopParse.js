const entities = [
  [/&nbsp;/g, " "],
  [/&middot;|&#183;|&#xB7;/gi, "·"],
  [/&plusmn;|&#177;|&#xB1;/gi, "±"],
  [/&#x27;|&#39;|&apos;/g, "'"],
  [/&quot;/g, '"'],
  [/&amp;/g, "&"],
];

export const pageText = (html) => {
  let text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  entities.forEach(([pattern, value]) => {
    text = text.replace(pattern, value);
  });
  return text.replace(/\s+/g, " ").trim();
};

export const parseProfile = (html) => {
  const text = pageText(html);
  const ratingMatch = text.match(
    /Current rating\s+(\d+)\s*(?:±\s*(\d+))?\s*over\s+(\d+)\s+rated/i,
  );
  const rowPattern = /(\d+)-(\d+)\s*·\s*(\d+)\s*games?\s*(\d+)\s*%/g;
  const fighters = [];
  const seen = new Set();
  let last = 0;
  let match = rowPattern.exec(text);
  while (match) {
    let segment = text.slice(last, match.index);
    if (!fighters.length) {
      const header = segment.lastIndexOf("Win %");
      if (header >= 0) segment = segment.slice(header + 5);
    }
    const name = segment.replace(/^[#\d\s]+/, "").trim();
    const wins = Number(match[1]);
    const losses = Number(match[2]);
    const games = Number(match[3]);
    last = match.index + match[0].length;
    if (
      name &&
      name.length <= 40 &&
      games >= wins + losses &&
      !seen.has(name.toLowerCase())
    ) {
      seen.add(name.toLowerCase());
      fighters.push({ name, wins, losses, games });
    }
    match = rowPattern.exec(text);
  }
  return {
    rating: ratingMatch ? Number(ratingMatch[1]) : null,
    deviation: ratingMatch && ratingMatch[2] ? Number(ratingMatch[2]) : null,
    ratedMatches: ratingMatch ? Number(ratingMatch[3]) : 0,
    fighters,
  };
};

export const usernameFrom = (input) => {
  const raw = String(input || "").trim();
  const fromUrl = raw.match(/\/players\/([^/?#\s]+)/i);
  const name = (fromUrl ? fromUrl[1] : raw).replace(/^@/, "");
  return /^[A-Za-z0-9_.-]{2,40}$/.test(name) ? name : "";
};
