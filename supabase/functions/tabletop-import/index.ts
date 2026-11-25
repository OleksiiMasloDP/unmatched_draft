const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const entities: [RegExp, string][] = [
  [/&nbsp;/g, " "],
  [/&middot;|&#183;|&#xB7;/gi, "·"],
  [/&plusmn;|&#177;|&#xB1;/gi, "±"],
  [/&#x27;|&#39;|&apos;/g, "'"],
  [/&quot;/g, '"'],
  [/&amp;/g, "&"],
];

const pageText = (html: string) => {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  entities.forEach(([pattern, value]) => {
    text = text.replace(pattern, value);
  });
  return text.replace(/\s+/g, " ").trim();
};

const parseProfile = (html: string) => {
  const text = pageText(html);
  const ratingMatch = text.match(
    /Current rating\s+(\d+)\s*(?:±\s*(\d+))?\s*over\s+(\d+)\s+rated/i,
  );
  const rowPattern = /(\d+)-(\d+)\s*·\s*(\d+)\s*games?\s*(\d+)\s*%/g;
  const fighters: {
    name: string;
    wins: number;
    losses: number;
    games: number;
  }[] = [];
  const seen = new Set<string>();
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

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  let username = "";
  try {
    const body = await req.json();
    username = String(body.username || "");
  } catch {
    return reply({ error: "bad_request" }, 400);
  }
  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(username))
    return reply({ error: "bad_request" }, 400);
  let response: Response;
  try {
    response = await fetch(
      `https://www.tabletopleague.com/players/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent":
            "UnmatchedDraft/1.0 (+https://oleksiimaslodp.github.io/unmatched_draft/)",
          Accept: "text/html",
        },
      },
    );
  } catch {
    return reply({ error: "upstream" }, 502);
  }
  if (response.status === 404) return reply({ error: "not_found" }, 404);
  if (!response.ok) return reply({ error: "upstream" }, 502);
  const parsed = parseProfile(await response.text());
  if (!parsed.fighters.length) return reply({ error: "parse_failed" }, 422);
  return reply({ username, ...parsed });
});
