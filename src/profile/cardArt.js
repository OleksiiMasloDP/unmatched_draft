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
};

export const artFrames = Object.keys(cardArt).map((id) => ({
  id: "art-" + id,
  art: id,
  lvl: 1,
}));
