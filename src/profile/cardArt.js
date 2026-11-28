const W = 280;
const H = 400;

const quad = (inner) =>
  `<g>${inner}</g><g transform="translate(${W} 0) scale(-1 1)">${inner}</g><g transform="translate(0 ${H}) scale(1 -1)">${inner}</g><g transform="translate(${W} ${H}) scale(-1 -1)">${inner}</g>`;

const rng = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const sweep = (id, color = "#fff", dur = 3.2) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="-120" y1="0" x2="0" y2="120"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity=".95"/><stop offset="1" stop-color="${color}" stop-opacity="0"/><animateTransform attributeName="gradientTransform" type="translate" from="-80 -80" to="420 520" dur="${dur}s" repeatCount="indefinite"/></linearGradient>`;

const glow = (id, std = 3) =>
  `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${std}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const filigree = () => {
  const curls = `
    <path d="M6 58V28Q6 6 28 6H58" fill="none" stroke="url(#fg1)" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M15 50V30Q15 15 30 15H50" fill="none" stroke="url(#fg1)" stroke-width="1.4"/>
    <path d="M20 21C34 20 43 29 40 39C37 48 26 47 27 39C28 33 35 32 36 36" fill="none" stroke="url(#fg1)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M62 6C74 6 80 14 74 19C70 22 65 19 67 15" fill="none" stroke="url(#fg1)" stroke-width="2" stroke-linecap="round"/>
    <path d="M6 62C6 74 14 80 19 74C22 70 19 65 15 67" fill="none" stroke="url(#fg1)" stroke-width="2" stroke-linecap="round"/>
    <path d="M44 6C46 12 52 14 58 12M6 44C12 46 14 52 12 58" fill="none" stroke="url(#fg1)" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="23" cy="23" r="5" fill="url(#fgem)" stroke="#7c2d12" stroke-width="1"/>
    <circle cx="21.5" cy="21.5" r="1.6" fill="#fff" opacity=".85"/>`;
  return `<defs>
    <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#f4b73a"/><stop offset="1" stop-color="#8a4b0f"/></linearGradient>
    <radialGradient id="fgem" cx=".35" cy=".3"><stop offset="0" stop-color="#ffd1d1"/><stop offset=".5" stop-color="#e11d48"/><stop offset="1" stop-color="#4c0519"/></radialGradient>
    ${sweep("fsw", "#fff7cc", 3.6)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#fg1)" stroke-width="3"/>
  <rect x="11" y="11" width="258" height="378" rx="10" fill="none" stroke="#3b1d05" stroke-width="2" opacity=".7"/>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#fsw)" stroke-width="4"/>
  ${quad(curls)}
  <g class="pcx-pulse">
    <path d="M118 7C126 13 134 5 140 12C146 5 154 13 162 7C156 18 148 19 140 24C132 19 124 18 118 7Z" fill="url(#fg1)" stroke="#5c2d06" stroke-width="1"/>
    <circle cx="140" cy="13" r="5.5" fill="url(#fgem)" stroke="#5c2d06"/>
    <path d="M118 393C126 387 134 395 140 388C146 395 154 387 162 393C156 382 148 381 140 376C132 381 124 382 118 393Z" fill="url(#fg1)" stroke="#5c2d06" stroke-width="1"/>
  </g>`;
};

const runeGlyphs = [
  "M0 -6V6M0 -6L5 -2L0 2",
  "M-4 -6V6M-4 -6L4 0L-4 6",
  "M0 -6V6M-4 -2L4 2",
  "M-4 -6L4 6M4 -6L-4 6",
  "M-4 6L0 -6L4 6M-3 1H3",
  "M0 -6L5 0L0 6L-5 0Z",
  "M-4 -6V6H4M-4 0H3",
  "M-4 -6L4 -2L-4 2L4 6",
];

const arcane = () => {
  const glyphs = [];
  let n = 0;
  const put = (x, y, rot) => {
    glyphs.push(
      `<path class="pcx-rune" style="animation-delay:${((n * 0.37) % 4).toFixed(2)}s" transform="translate(${x} ${y}) rotate(${rot})" d="${runeGlyphs[n % runeGlyphs.length]}" fill="none" stroke="#e9d5ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
    n += 1;
  };
  for (let i = 0; i < 9; i++) {
    put(60 + i * 20, 8, 0);
    put(60 + i * 20, 392, 0);
  }
  for (let i = 0; i < 14; i++) {
    put(8, 60 + i * 21.5, 90);
    put(272, 60 + i * 21.5, 90);
  }
  const rand = rng(7);
  const sparks = Array.from({ length: 12 }, () => {
    const x = 20 + rand() * 240;
    return `<circle class="pcx-spark" style="animation-delay:${(rand() * 5).toFixed(2)}s;animation-duration:${(3 + rand() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="390" r="${(1 + rand() * 1.4).toFixed(1)}" fill="#e9d5ff"/>`;
  }).join("");
  const crystal = `<path d="M4 30L18 4L40 18L22 40Z" fill="url(#ag)" stroke="#f5d0fe" stroke-width="1.2"/><path d="M18 4L22 40" stroke="#fff" stroke-opacity=".5"/><circle cx="14" cy="16" r="2" fill="#fff"/>`;
  return `<defs>
    <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0abfc"/><stop offset=".5" stop-color="#9333ea"/><stop offset="1" stop-color="#3b0764"/></linearGradient>
    ${glow("agl", 2.4)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="14" fill="none" stroke="url(#ag)" stroke-width="3"/>
  <rect x="17" y="17" width="246" height="366" rx="6" fill="none" stroke="#c084fc" stroke-width="1" opacity=".7"/>
  <g filter="url(#agl)">${glyphs.join("")}</g>
  ${quad(`<g class="pcx-pulse">${crystal}</g>`)}
  ${sparks}`;
};

const hud = () => {
  const outer =
    "M24 3H92L102 12H178L188 3H256L277 24V376L256 397H188L178 388H102L92 397H24L3 376V24Z";
  const inner =
    "M30 15H88L98 24H182L192 15H250L265 30V370L250 385H192L182 376H98L88 385H30L15 370V30Z";
  const pod = (y, c) =>
    `<rect class="pcx-blink" style="animation-delay:${(y % 3) * 0.4}s" x="-2" y="${y}" width="9" height="30" rx="3" fill="${c}" filter="url(#hg)"/><rect x="273" y="${y}" width="9" height="30" rx="3" fill="${c}" filter="url(#hg)" class="pcx-blink" style="animation-delay:${(y % 3) * 0.4 + 0.5}s"/>`;
  return `<defs>
    <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient>
    ${glow("hg", 3)}
    <linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc" stop-opacity="0"/><stop offset=".5" stop-color="#7dd3fc" stop-opacity=".35"/><stop offset="1" stop-color="#7dd3fc" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="${outer}" fill="none" stroke="url(#hl)" stroke-width="3" filter="url(#hg)"/>
  <path d="${inner}" fill="none" stroke="#38bdf8" stroke-width="1" opacity=".7"/>
  <path class="pcx-flow" d="${inner}" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-dasharray="26 500" pathLength="1000"/>
  <path d="M96 -4H184L172 8H108Z" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="1.5"/>
  <path d="M100 404H180L170 392H110Z" fill="#0c4a6e" stroke="#7dd3fc" stroke-width="1.5"/>
  <rect x="124" y="1" width="32" height="3" fill="#e0f2fe" opacity=".8"/>
  ${pod(96, "#f87171")}${pod(150, "#facc15")}${pod(250, "#f87171")}${pod(304, "#facc15")}
  <path d="M30 50V84M250 50V84M30 316V350M250 316V350" stroke="#38bdf8" stroke-width="2" opacity=".7"/>
  <rect class="pcx-scan" x="14" y="14" width="252" height="40" fill="url(#hs)"/>`;
};

const metal = () => {
  const screw = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="4.2" fill="url(#mm)" stroke="#0f172a" stroke-width="1"/><path d="M${x - 2.6} ${y - 2.6}L${x + 2.6} ${y + 2.6}" stroke="#0f172a" stroke-width="1.2"/>`;
  const corner = `<path d="M3 46V16Q3 3 16 3H46L38 12H20Q12 12 12 20V38Z" fill="url(#mm)" stroke="#0f172a" stroke-width="1"/><circle cx="14" cy="14" r="7" fill="url(#mo)" class="pcx-pulse"/>${screw(30, 9)}${screw(9, 30)}`;
  return `<defs>
    <linearGradient id="mm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cbd5e1"/><stop offset=".4" stop-color="#64748b"/><stop offset=".7" stop-color="#94a3b8"/><stop offset="1" stop-color="#334155"/></linearGradient>
    <radialGradient id="mo" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#e879f9"/><stop offset="1" stop-color="#86198f"/></radialGradient>
    <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#c026d3"/></linearGradient>
    ${glow("mgl", 3)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="12" fill="none" stroke="url(#mm)" stroke-width="9"/>
  <rect x="9" y="9" width="262" height="382" rx="9" fill="none" stroke="url(#mg)" stroke-width="2" class="pcx-pulse" filter="url(#mgl)"/>
  ${quad(corner)}
  <g filter="url(#mgl)">
    <path d="M114 394L92 380L118 378L140 390L162 378L188 380L166 394Z" fill="url(#mm)" stroke="#0f172a"/>
    <path d="M98 380L70 366L104 372Z M182 380L210 366L176 372Z" fill="#a855f7" opacity=".85" class="pcx-pulse"/>
    <circle cx="140" cy="384" r="9" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/>
    <circle cx="137" cy="381" r="2.5" fill="#fff" opacity=".8"/>
  </g>
  <path d="M26 372H92M188 372H254" stroke="#d946ef" stroke-width="2" stroke-linecap="round" class="pcx-pulse" filter="url(#mgl)"/>`;
};

const pixelVines = () => {
  const rand = rng(21);
  const leaves = [];
  const flowers = [];
  const px = (x, y, c, cls = "") =>
    `<rect ${cls ? `class="${cls}"` : ""} x="${x}" y="${y}" width="4" height="4" fill="${c}"/>`;
  const greens = ["#14532d", "#166534", "#22c55e", "#4ade80"];
  const edge = (len, fixed, vertical) => {
    for (let t = 6; t < len - 6; t += 8) {
      const g = greens[Math.floor(rand() * 4)];
      const off = Math.floor(rand() * 3) * 4;
      const out = rand() > 0.5 ? 4 : 8;
      const sway = rand() > 0.5 ? "pcx-sway" : "";
      const x = vertical ? fixed + off : t;
      const y = vertical ? t : fixed + off;
      leaves.push(
        `<g class="${sway}" style="animation-delay:${(rand() * 2).toFixed(2)}s">${px(x, y, g)}${px(vertical ? x + out : x, vertical ? y : y + out, greens[2])}</g>`,
      );
      if (rand() > 0.9) {
        const fx = vertical ? fixed + 8 : t;
        const fy = vertical ? t : fixed + 8;
        flowers.push(
          `<g class="pcx-blink" style="animation-delay:${(rand() * 3).toFixed(2)}s">${px(fx, fy, "#f472b6")}${px(fx + 4, fy, "#fbcfe8")}${px(fx, fy + 4, "#fbcfe8")}${px(fx - 4, fy, "#f472b6")}${px(fx, fy - 4, "#f472b6")}</g>`,
        );
      }
    }
  };
  edge(W, 0, false);
  edge(W, H - 12, false);
  edge(H, 0, true);
  edge(H, W - 12, true);
  return `<g shape-rendering="crispEdges">
    <rect x="3" y="3" width="274" height="394" fill="none" stroke="#3f2a14" stroke-width="8"/>
    <rect x="3" y="3" width="274" height="394" fill="none" stroke="#78552e" stroke-width="4"/>
    <rect x="9" y="9" width="262" height="382" fill="none" stroke="#14532d" stroke-width="4" stroke-dasharray="8 4"/>
    ${leaves.join("")}${flowers.join("")}
    <rect x="124" y="0" width="32" height="8" fill="#451a03"/><rect x="128" y="0" width="24" height="4" fill="#a16207"/>
    <rect x="136" y="-2" width="8" height="8" fill="#fde047"/>
  </g>`;
};

const dragonFire = () => {
  const rand = rng(5);
  const tongues = [];
  const tongue = (x, y, dx, dy, s, delay) => {
    const nx = -dy;
    const ny = dx;
    tongues.push(
      `<path class="pcx-flame" style="animation-delay:${delay}s" d="M${x - nx * 7 * s} ${y - ny * 7 * s}Q${x + dx * 14 * s - nx * 6 * s} ${y + dy * 14 * s - ny * 6 * s} ${x + dx * 30 * s + (rand() - 0.5) * 6} ${y + dy * 30 * s + (rand() - 0.5) * 6}Q${x + dx * 14 * s + nx * 8 * s} ${y + dy * 14 * s + ny * 8 * s} ${x + nx * 7 * s} ${y + ny * 7 * s}Z" fill="url(#df)"/>`,
    );
  };
  for (let i = 0; i < 13; i++) {
    tongue(
      14 + i * 21,
      12,
      0,
      -1,
      0.7 + rand() * 0.6,
      (rand() * 1.2).toFixed(2),
    );
    tongue(14 + i * 21, 388, 0, 1, 1 + rand() * 0.8, (rand() * 1.2).toFixed(2));
  }
  for (let i = 0; i < 18; i++) {
    tongue(
      12,
      20 + i * 20.5,
      -1,
      0,
      0.6 + rand() * 0.5,
      (rand() * 1.2).toFixed(2),
    );
    tongue(
      268,
      20 + i * 20.5,
      1,
      0,
      0.6 + rand() * 0.5,
      (rand() * 1.2).toFixed(2),
    );
  }
  const embers = Array.from({ length: 14 }, () => {
    return `<circle class="pcx-spark" style="animation-delay:${(rand() * 4).toFixed(2)}s;animation-duration:${(2 + rand() * 3).toFixed(2)}s" cx="${(10 + rand() * 260).toFixed(0)}" cy="392" r="${(1 + rand() * 1.6).toFixed(1)}" fill="#fde047"/>`;
  }).join("");
  return `<defs>
    <linearGradient id="df" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b91c1c"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#fde047"/></linearGradient>
    <linearGradient id="dm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#57534e"/><stop offset=".5" stop-color="#1c1917"/><stop offset="1" stop-color="#44403c"/></linearGradient>
    <filter id="dw" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="2" seed="3" result="n"><animate attributeName="baseFrequency" dur="3s" values="0.03 0.06;0.04 0.09;0.03 0.06" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>
    ${glow("dg", 3)}
  </defs>
  <rect x="5" y="5" width="270" height="390" rx="8" fill="none" stroke="url(#dm)" stroke-width="10"/>
  <rect x="11" y="11" width="258" height="378" rx="4" fill="none" stroke="#ef4444" stroke-width="2" filter="url(#dg)" class="pcx-pulse"/>
  <g filter="url(#dw)">${tongues.join("")}</g>
  ${embers}`;
};

const frost = () => {
  const shard = `<path d="M3 3H70L52 14L40 40L22 52L14 70L3 70Z" fill="url(#ig)" stroke="#e0f2fe" stroke-width="1.2"/><path d="M3 3L40 40M3 30L22 52M30 3L52 14" stroke="#fff" stroke-opacity=".55"/><path d="M62 3L96 20L70 22Z M3 62L20 96L22 70Z" fill="#bae6fd" stroke="#fff" stroke-width=".8"/>`;
  const rand = rng(13);
  const stars = Array.from({ length: 16 }, () => {
    const x = 20 + rand() * 240;
    const y = 12 + rand() * 376;
    const side = rand();
    const px = side < 0.5 ? (rand() < 0.5 ? 10 : 270) : x;
    const py = side < 0.5 ? y : rand() < 0.5 ? 10 : 390;
    return `<path class="pcx-twinkle" style="animation-delay:${(rand() * 3).toFixed(2)}s" transform="translate(${px.toFixed(0)} ${py.toFixed(0)})" d="M0 -5L1.4 -1.4L5 0L1.4 1.4L0 5L-1.4 1.4L-5 0L-1.4 -1.4Z" fill="#fff"/>`;
  }).join("");
  return `<defs>
    <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f9ff"/><stop offset=".5" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0369a1"/></linearGradient>
    ${sweep("isw", "#ffffff", 4.2)}
    ${glow("igl", 2.4)}
  </defs>
  <rect x="4" y="4" width="272" height="392" rx="6" fill="none" stroke="url(#ig)" stroke-width="5"/>
  <rect x="4" y="4" width="272" height="392" rx="6" fill="none" stroke="url(#isw)" stroke-width="6"/>
  <rect x="14" y="14" width="252" height="372" rx="3" fill="none" stroke="#e0f2fe" stroke-opacity=".6" stroke-width="1"/>
  ${quad(shard)}
  <g filter="url(#igl)">${stars}</g>`;
};

const storm = () => {
  const rand = rng(33);
  const arc = (x1, y1, x2, y2, n) => {
    let d = `M${x1} ${y1}`;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const jx = (rand() - 0.5) * 10;
      const jy = (rand() - 0.5) * 10;
      d += `L${(x1 + (x2 - x1) * t + (i < n ? jx : 0)).toFixed(1)} ${(y1 + (y2 - y1) * t + (i < n ? jy : 0)).toFixed(1)}`;
    }
    return d;
  };
  const bolts = [
    arc(10, 10, 270, 10, 22),
    arc(10, 390, 270, 390, 22),
    arc(10, 10, 10, 390, 30),
    arc(270, 10, 270, 390, 30),
    arc(10, 10, 270, 10, 22),
    arc(270, 10, 270, 390, 30),
  ]
    .map(
      (d, i) =>
        `<path class="pcx-bolt" style="animation-delay:${(i * 0.23).toFixed(2)}s" d="${d}" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-linejoin="round"/>`,
    )
    .join("");
  const coil = (x, y) =>
    `<circle cx="${x}" cy="${y}" r="11" fill="#1e293b" stroke="#64748b" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="#bae6fd" class="pcx-pulse" filter="url(#sg)"/>`;
  return `<defs>
    <linearGradient id="sm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#475569"/><stop offset=".5" stop-color="#1e293b"/><stop offset="1" stop-color="#334155"/></linearGradient>
    ${glow("sg", 3)}
    <filter id="sw" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="2" result="n"><animate attributeName="seed" values="1;5;2;8;3" dur="0.9s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
  </defs>
  <rect x="5" y="5" width="270" height="390" rx="8" fill="none" stroke="url(#sm)" stroke-width="10"/>
  <g filter="url(#sg)"><g filter="url(#sw)">${bolts}</g></g>
  ${coil(14, 14)}${coil(266, 14)}${coil(14, 386)}${coil(266, 386)}`;
};

const gear = (cx, cy, r, teeth, cls) => {
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const b = ((i + 0.5) / teeth) * Math.PI * 2;
    const p = (ang, rad) =>
      `${(cx + Math.cos(ang) * rad).toFixed(1)} ${(cy + Math.sin(ang) * rad).toFixed(1)}`;
    d += `${i ? "L" : "M"}${p(a - 0.12, r)}L${p(a + 0.12, r + 6)}L${p(b - 0.12, r + 6)}L${p(b + 0.12, r)}`;
  }
  return `<g class="${cls}"><path d="${d}Z" fill="url(#bg)" stroke="#451a03" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="#1c0f05" stroke="#fbbf24"/><circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="#fbbf24"/></g>`;
};

const steam = () => {
  const rivets = [];
  for (let i = 0; i < 12; i++) {
    rivets.push(
      `<circle cx="${40 + i * 18.2}" cy="8" r="2.4" fill="#fde68a"/><circle cx="${40 + i * 18.2}" cy="392" r="2.4" fill="#fde68a"/>`,
    );
  }
  for (let i = 0; i < 18; i++) {
    rivets.push(
      `<circle cx="8" cy="${46 + i * 19.4}" r="2.4" fill="#fde68a"/><circle cx="272" cy="${46 + i * 19.4}" r="2.4" fill="#fde68a"/>`,
    );
  }
  const puffs = [0, 1, 2, 3, 4]
    .map(
      (i) =>
        `<circle class="pcx-puff" style="animation-delay:${i * 0.8}s" cx="${236 + (i % 2) * 6}" cy="30" r="5" fill="#e2e8f0"/>`,
    )
    .join("");
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".4" stop-color="#d97706"/><stop offset=".75" stop-color="#b45309"/><stop offset="1" stop-color="#78350f"/></linearGradient>
  </defs>
  <rect x="5" y="5" width="270" height="390" rx="10" fill="none" stroke="url(#bg)" stroke-width="10"/>
  <rect x="11" y="11" width="258" height="378" rx="6" fill="none" stroke="#451a03" stroke-width="2"/>
  ${rivets.join("")}
  ${gear(24, 24, 15, 10, "pcx-gear")}
  ${gear(256, 24, 15, 10, "pcx-gear pcx-rev")}
  ${gear(24, 376, 15, 10, "pcx-gear pcx-rev")}
  ${gear(256, 376, 15, 10, "pcx-gear")}
  ${gear(48, 44, 8, 8, "pcx-gear pcx-rev")}
  ${puffs}`;
};

const circuit = () => {
  const traces = [
    "M14 70V30Q14 14 30 14H110L124 24H156L170 14H250Q266 14 266 30V70",
    "M14 330V370Q14 386 30 386H110L124 376H156L170 386H250Q266 386 266 370V330",
    "M14 110V290",
    "M266 110V290",
    "M30 14V36H44",
    "M250 14V36H236",
    "M30 386V364H44",
    "M250 386V364H236",
  ];
  const nodes = [
    [14, 70],
    [266, 70],
    [14, 330],
    [266, 330],
    [44, 36],
    [236, 36],
    [44, 364],
    [236, 364],
    [140, 24],
    [140, 376],
  ];
  return `<defs>
    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
    ${glow("cgl", 2.6)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="6" fill="none" stroke="#0f3d36" stroke-width="3"/>
  <g filter="url(#cgl)">
    ${traces.map((d) => `<path d="${d}" fill="none" stroke="url(#cg)" stroke-width="2" stroke-linejoin="round"/>`).join("")}
    ${traces.map((d, i) => `<path class="pcx-flow2" style="animation-delay:${(i * 0.45).toFixed(2)}s" d="${d}" fill="none" stroke="#ecfeff" stroke-width="3" stroke-dasharray="14 600" pathLength="600"/>`).join("")}
    ${nodes.map(([x, y], i) => `<circle class="pcx-blink" style="animation-delay:${(i * 0.3).toFixed(2)}s" cx="${x}" cy="${y}" r="4.5" fill="#0b1f1c" stroke="#5eead4" stroke-width="2"/>`).join("")}
  </g>`;
};

const baroque = () => {
  const swirl = `<path d="M8 70C8 30 30 8 70 8" fill="none" stroke="url(#rg)" stroke-width="3.5" stroke-linecap="round"/><path d="M18 62C18 36 36 18 62 18" fill="none" stroke="url(#rg)" stroke-width="1.6"/><path d="M26 30C40 22 52 32 46 42C42 50 32 46 36 40" fill="none" stroke="url(#rg)" stroke-width="2.4" stroke-linecap="round"/><path d="M84 8C96 8 100 18 92 22" fill="none" stroke="url(#rg)" stroke-width="2.2" stroke-linecap="round"/><path d="M8 84C8 96 18 100 22 92" fill="none" stroke="url(#rg)" stroke-width="2.2" stroke-linecap="round"/><path d="M30 8L38 18L30 28L22 18Z" fill="url(#rgem)" stroke="#f5d0fe" stroke-width=".8" transform="translate(2 2)"/>`;
  return `<defs>
    <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#d946ef"/><stop offset="1" stop-color="#7e22ce"/></linearGradient>
    <radialGradient id="rgem" cx=".4" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#22d3ee"/><stop offset="1" stop-color="#0e7490"/></radialGradient>
    ${sweep("rsw", "#fdf4ff", 3.4)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="12" fill="none" stroke="url(#rg)" stroke-width="3"/>
  <rect x="3" y="3" width="274" height="394" rx="12" fill="none" stroke="url(#rsw)" stroke-width="4"/>
  ${quad(`<g class="pcx-pulse">${swirl}</g>`)}
  <g class="pcx-pulse"><path d="M110 6H170L158 20H122Z" fill="url(#rg)" stroke="#fdf4ff" stroke-width=".8"/><circle cx="140" cy="12" r="5" fill="url(#rgem)"/><path d="M110 394H170L158 380H122Z" fill="url(#rg)"/></g>`;
};

const celtic = () => {
  const knot = `<circle cx="34" cy="34" r="20" fill="none" stroke="url(#clg)" stroke-width="4"/><circle cx="52" cy="34" r="14" fill="none" stroke="url(#clg)" stroke-width="3.2"/><circle cx="34" cy="52" r="14" fill="none" stroke="url(#clg)" stroke-width="3.2"/><circle cx="34" cy="34" r="6" fill="#facc15" stroke="#713f12"/><path d="M70 10H112M10 70V112" stroke="url(#clg)" stroke-width="3" stroke-linecap="round"/><path d="M80 18Q92 6 104 18M18 80Q6 92 18 104" fill="none" stroke="url(#clg)" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<defs>
    <linearGradient id="clg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset=".55" stop-color="#16a34a"/><stop offset="1" stop-color="#facc15"/></linearGradient>
    ${sweep("clsw", "#ecfccb", 3.8)}
  </defs>
  <rect x="3" y="3" width="274" height="394" rx="14" fill="none" stroke="url(#clg)" stroke-width="3.5"/>
  <rect x="10" y="10" width="260" height="380" rx="9" fill="none" stroke="#14532d" stroke-width="2"/>
  <rect x="3" y="3" width="274" height="394" rx="14" fill="none" stroke="url(#clsw)" stroke-width="4.5"/>
  ${quad(`<g class="pcx-pulse">${knot}</g>`)}
  <g class="pcx-pulse"><circle cx="140" cy="6" r="9" fill="none" stroke="url(#clg)" stroke-width="3"/><circle cx="140" cy="394" r="9" fill="none" stroke="url(#clg)" stroke-width="3"/></g>`;
};

const blossom = (x, y, r, cls, delay) => {
  let p = "";
  for (let i = 0; i < 5; i++)
    p += `<ellipse cx="${x}" cy="${(y - r).toFixed(1)}" rx="${(r * 0.55).toFixed(1)}" ry="${r}" transform="rotate(${i * 72} ${x} ${y})" fill="#fbcfe8" stroke="#db2777" stroke-width=".8"/>`;
  return `<g class="${cls}" style="animation-delay:${delay}s">${p}<circle cx="${x}" cy="${y}" r="${(r * 0.3).toFixed(1)}" fill="#facc15"/></g>`;
};

const sakura = () => {
  const branch = `<path d="M6 120C10 70 30 40 70 20C90 11 110 8 130 8" fill="none" stroke="#5b2a1a" stroke-width="5" stroke-linecap="round"/><path d="M26 70C40 66 52 56 56 44M50 36C62 36 72 30 78 22" fill="none" stroke="#7a3b22" stroke-width="3" stroke-linecap="round"/>${blossom(24, 76, 8, "pcx-twinkle", 0)}${blossom(58, 40, 7, "pcx-twinkle", 0.7)}${blossom(92, 16, 7, "pcx-twinkle", 1.4)}${blossom(12, 110, 6, "pcx-twinkle", 2)}`;
  return `<defs>${sweep("sksw", "#fff1f2", 4)}</defs>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="#f9a8d4" stroke-width="2.5"/>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#sksw)" stroke-width="3.5"/>
  ${quad(branch)}`;
};

const crypt = () => {
  const skull = (x, y) =>
    `<g transform="translate(${x} ${y})"><path d="M-14 4C-14-12-6-18 0-18C6-18 14-12 14 4C14 10 9 12 9 17H-9C-9 12-14 10-14 4Z" fill="#e5e7eb" stroke="#374151" stroke-width="1.4"/><circle cx="-6" cy="2" r="4" fill="#1f0a2e"/><circle cx="6" cy="2" r="4" fill="#1f0a2e"/><circle class="pcx-blink" cx="-6" cy="2" r="2" fill="#c084fc"/><circle class="pcx-blink" cx="6" cy="2" r="2" fill="#c084fc"/><path d="M-4 17V12M0 17V12M4 17V12" stroke="#374151"/></g>`;
  const bone = `<path d="M44 8H120" stroke="#d1d5db" stroke-width="6" stroke-linecap="round"/><circle cx="44" cy="5" r="4" fill="#d1d5db"/><circle cx="44" cy="11" r="4" fill="#d1d5db"/><circle cx="120" cy="5" r="4" fill="#d1d5db"/><circle cx="120" cy="11" r="4" fill="#d1d5db"/><path d="M8 44V120" stroke="#d1d5db" stroke-width="6" stroke-linecap="round"/><circle cx="5" cy="44" r="4" fill="#d1d5db"/><circle cx="11" cy="44" r="4" fill="#d1d5db"/><circle cx="5" cy="120" r="4" fill="#d1d5db"/><circle cx="11" cy="120" r="4" fill="#d1d5db"/>`;
  return `<rect x="3" y="3" width="274" height="394" rx="8" fill="none" stroke="#6b7280" stroke-width="3"/>
  <rect x="9" y="9" width="262" height="382" rx="4" fill="none" stroke="#2e1065" stroke-width="2"/>
  ${quad(bone)}
  ${skull(26, 28)}${skull(254, 28)}${skull(26, 372)}${skull(254, 372)}
  <g class="pcx-pulse">${skull(140, 18)}</g>`;
};

const crystal = () => {
  const gems = `<path d="M6 80L6 30L30 6L80 6L64 22L36 22L22 36L22 64Z" fill="url(#cyg)" stroke="#ecfeff" stroke-width="1"/><path d="M30 6L36 22M6 30L22 36" stroke="#fff" stroke-opacity=".7"/><path class="pcx-twinkle" d="M44 44L52 56L44 68L36 56Z" fill="#f0abfc" stroke="#fff"/><path class="pcx-twinkle" style="animation-delay:1.2s" d="M96 14L102 22L96 30L90 22Z" fill="#67e8f9" stroke="#fff"/><path class="pcx-twinkle" style="animation-delay:.6s" d="M14 96L22 102L14 108L6 102Z" fill="#67e8f9" stroke="#fff"/>`;
  return `<defs><linearGradient id="cyg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5f3fc"/><stop offset=".5" stop-color="#22d3ee"/><stop offset="1" stop-color="#a855f7"/></linearGradient>${sweep("cysw", "#ffffff", 3)}</defs>
  <rect x="3" y="3" width="274" height="394" fill="none" stroke="url(#cyg)" stroke-width="3" stroke-linejoin="bevel"/>
  <rect x="3" y="3" width="274" height="394" fill="none" stroke="url(#cysw)" stroke-width="4"/>
  ${quad(gems)}`;
};

const ocean = () => {
  const wave = (y, c, cls) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < 280; x += 28)
      d += `Q${x + 7} ${y - 8} ${x + 14} ${y}T${x + 28} ${y}`;
    return `<path class="${cls}" d="${d}" fill="none" stroke="${c}" stroke-width="3"/>`;
  };
  const bubbles = Array.from(
    { length: 9 },
    (_, i) =>
      `<circle class="pcx-twinkle" style="animation-delay:${(i * 0.4).toFixed(1)}s" cx="${18 + ((i * 53) % 244)}" cy="${380 + ((i * 7) % 14)}" r="${2 + (i % 3)}" fill="none" stroke="#bae6fd"/>`,
  ).join("");
  return `<rect x="3" y="3" width="274" height="394" rx="18" fill="none" stroke="#0ea5e9" stroke-width="3"/>
  <g transform="translate(0 -6)">${wave(8, "#7dd3fc", "pcx-pulse")}</g>
  <g transform="translate(0 384)">${wave(8, "#38bdf8", "pcx-pulse")}${wave(0, "#0284c7", "pcx-blink")}</g>
  <path d="M6 40V360" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="3 9" class="pcx-flow" pathLength="320"/>
  <path d="M274 40V360" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="3 9" class="pcx-flow" pathLength="320"/>
  ${bubbles}`;
};

const cosmic = () => {
  const r = rng(77);
  let stars = "";
  for (let i = 0; i < 46; i++) {
    const edge = i % 4;
    const t = r();
    const d = 4 + r() * 18;
    const x =
      edge === 0 ? t * 280 : edge === 1 ? 280 - d : edge === 2 ? t * 280 : d;
    const y =
      edge === 0 ? d : edge === 1 ? t * 400 : edge === 2 ? 400 - d : t * 400;
    stars += `<circle class="pcx-twinkle" style="animation-delay:${(r() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="#fff"/>`;
  }
  return `<defs><linearGradient id="cog" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset=".5" stop-color="#d946ef"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>${sweep("cosw", "#e0e7ff", 4)}</defs>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#cog)" stroke-width="3"/>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#cosw)" stroke-width="4"/>
  <path d="M20 60L48 30L80 44L104 14" fill="none" stroke="#a5b4fc" stroke-opacity=".6"/>
  <path d="M260 340L232 370L200 356L176 386" fill="none" stroke="#a5b4fc" stroke-opacity=".6"/>
  <g class="pcx-gear" style="animation-duration:30s"><ellipse cx="248" cy="40" rx="22" ry="8" fill="none" stroke="#c4b5fd" transform="rotate(-25 248 40)"/><circle cx="248" cy="40" r="6" fill="#fbbf24"/></g>
  <g class="pcx-gear pcx-rev" style="animation-duration:36s"><ellipse cx="32" cy="360" rx="22" ry="8" fill="none" stroke="#67e8f9" transform="rotate(25 32 360)"/><circle cx="32" cy="360" r="6" fill="#38bdf8"/></g>
  ${stars}`;
};

const egypt = () => {
  const zig = (y) => {
    let d = `M30 ${y}`;
    for (let x = 30; x < 250; x += 16) d += `L${x + 8} ${y + 6}L${x + 16} ${y}`;
    return d;
  };
  return `<defs><linearGradient id="egg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#d4a017"/><stop offset="1" stop-color="#7c4a0a"/></linearGradient><linearGradient id="egb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e7490"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>${sweep("egsw", "#fff7cc", 3.6)}</defs>
  <rect x="3" y="3" width="274" height="394" rx="4" fill="none" stroke="url(#egg)" stroke-width="4"/>
  <rect x="3" y="3" width="274" height="394" rx="4" fill="none" stroke="url(#egsw)" stroke-width="5"/>
  <rect x="11" y="11" width="258" height="378" fill="none" stroke="url(#egb)" stroke-width="2"/>
  <path d="${zig(14)}" fill="none" stroke="url(#egg)" stroke-width="2"/>
  <path d="${zig(380)}" fill="none" stroke="url(#egg)" stroke-width="2"/>
  <g class="pcx-pulse"><path d="M120 8Q140 -8 160 8Q140 20 120 8Z" fill="#0b1b2b" stroke="url(#egg)" stroke-width="2"/><circle cx="140" cy="8" r="4" fill="#22d3ee"/></g>
  <path d="M6 6L40 6L6 40Z M274 6L240 6L274 40Z M6 394L40 394L6 360Z M274 394L240 394L274 360Z" fill="url(#egg)"/>`;
};

const thorns = () => {
  const rose = (x, y, s, d) =>
    `<g class="pcx-pulse" style="animation-delay:${d}s" transform="translate(${x} ${y}) scale(${s})"><circle r="11" fill="#be123c" stroke="#4c0519" stroke-width="1.2"/><path d="M-7 0C-7-7 7-7 7 0C7 5-3 6-3 1C-3-2 2-2 2 0" fill="none" stroke="#fecdd3" stroke-width="1.4"/><circle r="11" fill="none" stroke="#fb7185" stroke-opacity=".5"/></g>`;
  const vine = `<path d="M8 130C4 80 20 40 60 14C80 4 110 6 134 8" fill="none" stroke="#14532d" stroke-width="4.5" stroke-linecap="round"/><path d="M12 100l-8-4l9-3M20 62l-9-5l10-1M44 30l-6-8l9 2M78 12l-1-9l7 5M108 9l2-9l5 7" fill="none" stroke="#bbf7d0" stroke-width="1.8" stroke-linejoin="round"/>${rose(26, 46, 1.2, 0)}${rose(58, 20, 0.8, 0.8)}${rose(10, 100, 0.7, 1.6)}`;
  return `<rect x="3" y="3" width="274" height="394" rx="12" fill="none" stroke="#14532d" stroke-width="3"/>
  <rect x="9" y="9" width="262" height="382" rx="8" fill="none" stroke="#7f1d1d" stroke-width="1.5" stroke-dasharray="2 6"/>
  ${quad(vine)}`;
};

const holy = () => {
  const wing = `<path d="M6 60C6 30 20 14 44 8C60 4 80 6 100 4C84 12 76 20 70 28C84 24 96 24 108 24C92 32 84 40 80 50C90 48 100 48 110 50C94 56 84 64 78 76C66 70 54 66 40 70C28 74 18 82 6 96Z" fill="url(#hwg)" stroke="#a16207" stroke-width="1.2"/><path d="M20 60C34 40 52 30 72 28M26 76C40 60 56 52 78 50" fill="none" stroke="#fef3c7" stroke-width="1.2" stroke-opacity=".8"/>`;
  return `<defs><linearGradient id="hwg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fef3c7"/><stop offset="1" stop-color="#facc15"/></linearGradient>${glow("hgl", 3)}${sweep("hsw", "#fffbeb", 3.4)}</defs>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="#fde68a" stroke-width="2.5"/>
  <rect x="3" y="3" width="274" height="394" rx="16" fill="none" stroke="url(#hsw)" stroke-width="4"/>
  <g filter="url(#hgl)" class="pcx-pulse">${quad(`<g transform="scale(.62)">${wing}</g>`)}</g>
  <g filter="url(#hgl)" class="pcx-blink"><ellipse cx="140" cy="6" rx="26" ry="7" fill="none" stroke="#fde047" stroke-width="3.5"/><ellipse cx="140" cy="394" rx="26" ry="7" fill="none" stroke="#fde047" stroke-width="3.5"/></g>`;
};

const lava = () => {
  const crack = (d, i) =>
    `<path d="${d}" fill="none" stroke="#7c2d12" stroke-width="5" stroke-linejoin="round"/><path class="pcx-blink" style="animation-delay:${(i * 0.37).toFixed(2)}s" d="${d}" fill="none" stroke="#fb923c" stroke-width="2.4" stroke-linejoin="round"/>`;
  const cracks = [
    "M6 20L26 30L20 50L40 64L34 90L52 110",
    "M274 20L254 34L262 56L240 70L248 100",
    "M6 380L30 366L24 344L48 330L42 306",
    "M274 380L250 364L258 340L236 326L244 300",
    "M60 6L72 22L98 14L112 28L140 12L168 28L186 14L212 22L222 6",
    "M60 394L74 378L96 386L116 372L140 388L168 374L188 386L208 378L222 394",
    "M6 150L20 170L10 200L24 230L12 260",
    "M274 150L260 176L270 204L256 236L268 262",
  ];
  return `<rect x="3" y="3" width="274" height="394" rx="6" fill="none" stroke="#292524" stroke-width="6"/>
  <rect x="3" y="3" width="274" height="394" rx="6" fill="none" stroke="#57534e" stroke-width="2"/>
  ${cracks.map(crack).join("")}
  <g class="pcx-flame"><path d="M140 2C132 10 136 16 140 20C144 16 148 10 140 2Z" fill="#fde047"/></g>`;
};

const neonSign = () =>
  `<defs>${glow("nsg", 3.5)}</defs>
  <g filter="url(#nsg)">
    <rect class="pcx-blink" x="6" y="6" width="268" height="388" rx="26" fill="none" stroke="#f472b6" stroke-width="3.5"/>
    <rect class="pcx-pulse" x="14" y="14" width="252" height="372" rx="18" fill="none" stroke="#22d3ee" stroke-width="2.5"/>
    <path class="pcx-bolt" d="M84 6H196M84 394H196" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="4" fill="#fff"/><circle cx="256" cy="24" r="4" fill="#fff"/><circle cx="24" cy="376" r="4" fill="#fff"/><circle cx="256" cy="376" r="4" fill="#fff"/>
  </g>`;

export const cardArt = {
  filigree: { svg: filigree(), pad: 16, glow: "rgba(250,204,21,.6)" },
  arcane: { svg: arcane(), pad: 18, glow: "rgba(168,85,247,.7)" },
  hud: { svg: hud(), pad: 16, glow: "rgba(56,189,248,.65)" },
  metal: { svg: metal(), pad: 16, glow: "rgba(217,70,239,.6)" },
  pixel: { svg: pixelVines(), pad: 16, glow: "rgba(74,222,128,.5)" },
  dragon: { svg: dragonFire(), pad: 18, glow: "rgba(249,115,22,.75)" },
  frost: { svg: frost(), pad: 16, glow: "rgba(125,211,252,.7)" },
  storm: { svg: storm(), pad: 16, glow: "rgba(186,230,253,.7)" },
  steam: { svg: steam(), pad: 16, glow: "rgba(217,119,6,.6)" },
  circuit: { svg: circuit(), pad: 16, glow: "rgba(52,211,153,.65)" },
  baroque: { svg: baroque(), pad: 16, glow: "rgba(217,70,239,.65)" },
  celtic: { svg: celtic(), pad: 16, glow: "rgba(74,222,128,.55)" },
  sakura: { svg: sakura(), pad: 16, glow: "rgba(244,114,182,.6)" },
  crypt: { svg: crypt(), pad: 16, glow: "rgba(168,85,247,.55)" },
  crystal: { svg: crystal(), pad: 16, glow: "rgba(34,211,238,.65)" },
  ocean: { svg: ocean(), pad: 14, glow: "rgba(14,165,233,.6)" },
  cosmic: { svg: cosmic(), pad: 16, glow: "rgba(129,140,248,.7)" },
  egypt: { svg: egypt(), pad: 16, glow: "rgba(212,160,23,.6)" },
  thorns: { svg: thorns(), pad: 14, glow: "rgba(225,29,72,.55)" },
  holy: { svg: holy(), pad: 16, glow: "rgba(253,224,71,.7)" },
  lava: { svg: lava(), pad: 16, glow: "rgba(249,115,22,.7)" },
  neonsign: { svg: neonSign(), pad: 16, glow: "rgba(244,114,182,.7)" },
};

export const artFrames = Object.keys(cardArt).map((id) => ({
  id: "art-" + id,
  art: id,
  lvl: 1,
}));
