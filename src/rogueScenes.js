const TILE_W = 640;
const TILE_H = 560;

const makeRng = (seed) => {
  let state = seed;
  return () => {
    state = (state * 16807 + 11) % 2147483647;
    return state / 2147483647;
  };
};

const R = (x, y, w, h, fill, extra = {}) => ({
  tag: "rect",
  attrs: { x, y, width: w, height: h, fill, ...extra },
});
const C = (cx, cy, r, fill, extra = {}) => ({
  tag: "circle",
  attrs: { cx, cy, r, fill, ...extra },
});
const E = (cx, cy, rx, ry, fill, extra = {}) => ({
  tag: "ellipse",
  attrs: { cx, cy, rx, ry, fill, ...extra },
});
const P = (points, fill, extra = {}) => ({
  tag: "polygon",
  attrs: { points, fill, ...extra },
});
const L = (d, stroke, width, extra = {}) => ({
  tag: "path",
  attrs: {
    d,
    fill: "none",
    stroke,
    "stroke-width": width,
    "stroke-linecap": "round",
    ...extra,
  },
});
const G = (attrs, children) => ({ tag: "g", attrs, children });

const shadow = (x, y, w, h) =>
  R(x + 7, y + 9, w, h, "#000", { opacity: 0.4, rx: 2 });

function roof(items, rng, x, y, w, h, base, rim) {
  items.push(shadow(x, y, w, h));
  items.push(R(x, y, w, h, base, { stroke: rim, "stroke-width": 5 }));
  items.push(
    R(x + 8, y + 8, w - 16, h - 16, "none", { stroke: rim, opacity: 0.5 }),
  );
  const units = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < units; i += 1) {
    const ux = x + 14 + rng() * Math.max(1, w - 50);
    const uy = y + 14 + rng() * Math.max(1, h - 44);
    const uw = 14 + rng() * 16;
    const uh = 12 + rng() * 14;
    items.push(R(ux + 3, uy + 4, uw, uh, "#000", { opacity: 0.35 }));
    items.push(R(ux, uy, uw, uh, "#5a5f6a", { opacity: 0.9 }));
    items.push(C(ux + uw / 2, uy + uh / 2, Math.min(uw, uh) / 3, "#2b2e36"));
  }
  if (rng() < 0.5) {
    items.push(
      R(x + w * 0.2, y + h * 0.55, w * 0.3, h * 0.22, "#27465a", {
        opacity: 0.85,
      }),
    );
  }
}

function car(items, x, y, rot, fill) {
  items.push(
    G({ transform: `translate(${x},${y}) rotate(${rot})` }, [
      R(-17 + 4, -8 + 5, 34, 16, "#000", { opacity: 0.4, rx: 5 }),
      R(-17, -8, 34, 16, fill, { rx: 5 }),
      R(-6, -6, 13, 12, "#0a0c10", { rx: 3, opacity: 0.85 }),
      R(8, -6, 6, 12, "#7a9ab0", { rx: 2, opacity: 0.6 }),
    ]),
  );
}

function plane(items, x, y, rot, scale, fill) {
  items.push(
    G({ transform: `translate(${x},${y}) rotate(${rot}) scale(${scale})` }, [
      E(6, 8, 34, 7, "#000", { opacity: 0.35 }),
      E(0, 0, 36, 6, fill),
      P("-2,0 -14,-46 0,-46 14,0", fill),
      P("-2,0 -14,46 0,46 14,0", fill),
      P("-30,0 -40,-16 -34,-16 -22,0", fill),
      P("-30,0 -40,16 -34,16 -22,0", fill),
      E(24, 0, 7, 3, "#0a0c10", { opacity: 0.6 }),
    ]),
  );
}

function fire(items, x, y, s = 1) {
  items.push(
    C(x, y, 52 * s, "url(#rmap-fireglow)", { class: "rmap-pulse" }),
    E(x, y, 9 * s, 14 * s, "#ff6a1a", { opacity: 0.9, class: "rmap-fire" }),
    E(x, y + 4 * s, 4.5 * s, 8 * s, "#ffd166", { class: "rmap-fire" }),
  );
}

function smoke(items, x, y) {
  for (let i = 0; i < 4; i += 1) {
    items.push(
      E(x + i * 9 + 6, y - i * 20, 20 + i * 12, 14 + i * 7, "#0c0808", {
        opacity: 0.4 - i * 0.07,
        class: "rmap-drift",
      }),
    );
  }
}

function goo(items, rng, x, y, size) {
  const blobs = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < blobs; i += 1) {
    const a = rng() * Math.PI * 2;
    const d = rng() * size * 0.7;
    const r = size * (0.25 + rng() * 0.35);
    items.push(
      C(x + Math.cos(a) * d, y + Math.sin(a) * d, r, "#06030b", {
        opacity: 0.95,
      }),
    );
  }
  for (let i = 0; i < 3; i += 1) {
    items.push(
      E(
        x + (rng() - 0.5) * size,
        y + (rng() - 0.5) * size,
        size * 0.2,
        size * 0.08,
        "#6a2fb0",
        {
          opacity: 0.4,
        },
      ),
    );
  }
  for (let i = 0; i < 5; i += 1) {
    const a = rng() * Math.PI * 2;
    const len = size * (1 + rng() * 1.2);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const mx = x + Math.cos(a + 0.5) * len * 0.5;
    const my = y + Math.sin(a + 0.5) * len * 0.5;
    items.push(
      L(`M${x} ${y} Q${mx} ${my} ${ex} ${ey}`, "#06030b", 4 + rng() * 6, {
        opacity: 0.95,
      }),
    );
    items.push(C(ex, ey, 4, "#06030b"));
  }
}

function eyes(items, x, y, s = 1, rot = 0) {
  items.push(
    G(
      {
        transform: `translate(${x},${y}) rotate(${rot}) scale(${s})`,
        class: "rmap-blink",
      },
      [
        P("-16,-3 -4,-9 -2,0 -12,3", "#f4f0ff"),
        P("16,-3 4,-9 2,0 12,3", "#f4f0ff"),
      ],
    ),
  );
}

function crater(items, x, y, r) {
  items.push(C(x, y, r + 6, "#2c211b", { opacity: 0.7 }));
  items.push(C(x, y, r, "#070504"));
  items.push(C(x, y, r * 0.6, "#000"));
}

function venomStreets() {
  const rng = makeRng(31);
  const items = [R(0, 0, TILE_W, TILE_H, "#14111b")];
  const blocks = [
    [24, 24, 220, 180],
    [396, 24, 220, 180],
    [24, 356, 220, 180],
    [396, 356, 220, 180],
  ];
  items.push(
    R(0, 226, TILE_W, 108, "#1f1c29"),
    R(256, 0, 128, TILE_H, "#1f1c29"),
  );
  items.push(R(0, 222, TILE_W, 4, "#34304a"), R(0, 334, TILE_W, 4, "#34304a"));
  items.push(R(252, 0, 4, TILE_H, "#34304a"), R(384, 0, 4, TILE_H, "#34304a"));
  for (let x = 0; x < TILE_W; x += 44) {
    if (x > 236 && x < 396) continue;
    items.push(R(x, 278, 24, 4, "#cdbf7a", { opacity: 0.55 }));
  }
  for (let y = 0; y < TILE_H; y += 44) {
    if (y > 206 && y < 346) continue;
    items.push(R(318, y, 4, 24, "#cdbf7a", { opacity: 0.55 }));
  }
  for (let i = 0; i < 7; i += 1) {
    items.push(R(262 + i * 16, 232, 8, 20, "#d8d2e8", { opacity: 0.35 }));
    items.push(R(262 + i * 16, 308, 8, 20, "#d8d2e8", { opacity: 0.35 }));
  }
  blocks.forEach(([x, y, w, h], i) =>
    roof(items, rng, x, y, w, h, i % 2 ? "#2a2634" : "#322b3a", "#0e0c14"),
  );
  car(items, 90, 262, 4, "#7a2230");
  car(items, 170, 300, 186, "#2a4a78");
  car(items, 470, 258, 12, "#6a6a72");
  car(items, 520, 305, 168, "#8a5a22");
  car(items, 300, 120, 92, "#3a3a46");
  car(items, 345, 440, 80, "#7a2230");
  goo(items, rng, 130, 110, 56);
  goo(items, rng, 480, 450, 64);
  goo(items, rng, 320, 290, 40);
  eyes(items, 130, 110, 0.9, -8);
  eyes(items, 480, 450, 1.1, 10);
  fire(items, 330, 60, 0.8);
  fire(items, 70, 450, 0.7);
  return items;
}

function venomTower() {
  const rng = makeRng(47);
  const items = [R(0, 0, TILE_W, TILE_H, "#191c26")];
  for (let x = 0; x < TILE_W; x += 64)
    items.push(R(x, 0, 2, TILE_H, "#0f1118", { opacity: 0.7 }));
  for (let y = 0; y < TILE_H; y += 56)
    items.push(R(0, y, TILE_W, 2, "#0f1118", { opacity: 0.7 }));
  items.push(
    R(10, 10, TILE_W - 20, TILE_H - 20, "none", {
      stroke: "#0a0b10",
      "stroke-width": 14,
    }),
  );
  items.push(
    R(22, 22, TILE_W - 44, TILE_H - 44, "none", {
      stroke: "#3a3f52",
      "stroke-width": 3,
    }),
  );
  items.push(
    C(190, 280, 104, "#10131b"),
    C(190, 280, 92, "none", { stroke: "#b89b2a", "stroke-width": 6 }),
  );
  items.push(
    R(160, 242, 8, 76, "#b89b2a"),
    R(212, 242, 8, 76, "#b89b2a"),
    R(160, 276, 60, 8, "#b89b2a"),
  );
  for (let i = 0; i < 3; i += 1) {
    items.push(
      R(400, 50 + i * 80, 150, 56, "#0a1a26", {
        stroke: "#2c5a78",
        "stroke-width": 3,
      }),
    );
    items.push(
      P(
        `${410},${58 + i * 80} ${470},${58 + i * 80} ${440},${98 + i * 80} ${410},${98 + i * 80}`,
        "#3a7aa0",
        { opacity: 0.25 },
      ),
    );
  }
  for (let i = 0; i < 6; i += 1) {
    const ux = 60 + (i % 3) * 110;
    const uy = i < 3 ? 70 : 430;
    items.push(R(ux + 4, uy + 5, 60, 40, "#000", { opacity: 0.4 }));
    items.push(R(ux, uy, 60, 40, "#4a5060"));
    items.push(
      C(ux + 30, uy + 20, 14, "#20232c"),
      C(ux + 30, uy + 20, 5, "#0a0b0f"),
    );
  }
  items.push(
    C(470, 430, 46, "#0e1016"),
    C(470, 430, 30, "#2a2e3a"),
    C(470, 430, 8, "#c33"),
  );
  items.push(
    L("M470 430 L560 360", "#2a2e3a", 5),
    L("M470 430 L380 360", "#2a2e3a", 5),
    L("M470 430 L470 530", "#2a2e3a", 5),
  );
  goo(items, rng, 520, 300, 70);
  goo(items, rng, 120, 140, 60);
  goo(items, rng, 330, 520, 56);
  goo(items, rng, 30, 400, 44);
  eyes(items, 520, 300, 1.3, -12);
  eyes(items, 120, 140, 1, 10);
  eyes(items, 330, 520, 1.1, 0);
  items.push(
    C(190, 280, 60, "url(#rmap-purple)", { opacity: 0.4, class: "rmap-pulse" }),
  );
  return items;
}

function venomLab() {
  const rng = makeRng(59);
  const items = [R(0, 0, TILE_W, TILE_H, "#181a23")];
  for (let x = 0; x < TILE_W; x += 40)
    items.push(R(x, 0, 1.5, TILE_H, "#0d0e14", { opacity: 0.8 }));
  for (let y = 0; y < TILE_H; y += 40)
    items.push(R(0, y, TILE_W, 1.5, "#0d0e14", { opacity: 0.8 }));
  items.push(shadow(110, 40, 420, 190));
  items.push(
    R(110, 40, 420, 190, "#262a38", { stroke: "#0a0b10", "stroke-width": 6 }),
  );
  items.push(
    R(130, 58, 380, 154, "#1b1e2a", { stroke: "#3a4058", "stroke-width": 2 }),
  );
  items.push(
    R(256, 150, 128, 80, "#07080d", { stroke: "#b44bff", "stroke-width": 3 }),
  );
  items.push(R(262, 156, 56, 74, "#12141c"), R(322, 156, 56, 74, "#12141c"));
  for (let i = 0; i < 8; i += 1) {
    items.push(
      P(
        `${262 + i * 16},232 ${272 + i * 16},232 ${282 + i * 16},244 ${272 + i * 16},244`,
        i % 2 ? "#e6c229" : "#15161c",
      ),
    );
  }
  items.push(
    C(320, 100, 26, "#10121a", { stroke: "#b44bff", "stroke-width": 3 }),
  );
  for (let i = 0; i < 3; i += 1)
    items.push(
      C(
        320 + Math.cos(i * 2.094) * 11,
        100 + Math.sin(i * 2.094) * 11,
        7,
        "#b44bff",
        { opacity: 0.85 },
      ),
    );
  items.push(C(320, 100, 4, "#10121a"));
  items.push(
    C(320, 220, 150, "url(#rmap-purple)", {
      opacity: 0.5,
      class: "rmap-pulse",
    }),
  );
  for (let i = 0; i < 5; i += 1) {
    const x = 70 + i * 120;
    items.push(R(x + 3, 330 + 4, 60, 12, "#000", { opacity: 0.4 }));
    items.push(R(x, 330, 60, 12, i % 2 ? "#e6c229" : "#d1d1d1", { rx: 3 }));
  }
  for (const [x, y] of [
    [40, 300],
    [600, 300],
    [40, 520],
    [600, 520],
  ]) {
    items.push(C(x, y, 40, "url(#rmap-lamp)"), C(x, y, 6, "#ffe9a6"));
  }
  goo(items, rng, 80, 440, 64);
  goo(items, rng, 560, 420, 70);
  goo(items, rng, 320, 300, 54);
  goo(items, rng, 320, 510, 50);
  eyes(items, 80, 440, 1.2, -10);
  eyes(items, 560, 420, 1.4, 8);
  eyes(items, 320, 300, 1, 0);
  eyes(items, 320, 510, 1.2, 4);
  return items;
}

function dannyGate() {
  const rng = makeRng(71);
  const items = [R(0, 0, TILE_W, TILE_H, "#1d2119")];
  for (let i = 0; i < 26; i += 1) {
    items.push(
      E(
        rng() * TILE_W,
        rng() * TILE_H,
        10 + rng() * 26,
        6 + rng() * 14,
        "#252b1f",
        { opacity: 0.7 },
      ),
    );
  }
  items.push(
    R(0, 226, TILE_W, 108, "#2a2c2b"),
    R(0, 222, TILE_W, 4, "#46483f"),
    R(0, 334, TILE_W, 4, "#46483f"),
  );
  for (let x = 0; x < TILE_W; x += 48)
    items.push(R(x, 278, 26, 4, "#e8e2c0", { opacity: 0.55 }));
  items.push(
    L("M0 190 L640 190", "#7a7d78", 3, { "stroke-dasharray": "6 8" }),
    L("M0 372 L640 372", "#7a7d78", 3, { "stroke-dasharray": "6 8" }),
  );
  items.push(
    shadow(290, 150, 60, 40),
    R(290, 150, 60, 40, "#4a5046", { stroke: "#15180f", "stroke-width": 4 }),
    R(300, 160, 40, 20, "#27465a"),
  );
  items.push(
    shadow(290, 372, 60, 40),
    R(290, 372, 60, 40, "#4a5046", { stroke: "#15180f", "stroke-width": 4 }),
    R(300, 382, 40, 20, "#27465a"),
  );
  for (let i = 0; i < 8; i += 1)
    items.push(R(300 + i * 5.5, 232, 5.5, 14, i % 2 ? "#d33" : "#f4f4f4"));
  items.push(R(296, 226, 8, 28, "#15180f"));
  for (let i = 0; i < 6; i += 1) {
    items.push(
      R(70 + i * 90, 200, 16, 8, "#6a6d62"),
      R(70 + i * 90, 352, 16, 8, "#6a6d62"),
    );
  }
  items.push(
    R(40, 40, 200, 100, "#34402c", { stroke: "#15180f", "stroke-width": 4 }),
    R(50, 50, 180, 80, "none", { stroke: "#1c2418", opacity: 0.7 }),
  );
  items.push(
    R(420, 430, 190, 100, "#2e3a28", { stroke: "#15180f", "stroke-width": 4 }),
  );
  car(items, 130, 255, 0, "#3b4a2c");
  car(items, 190, 305, 180, "#4a4a44");
  car(items, 500, 258, 2, "#4a3a2a");
  for (let i = 0; i < 4; i += 1) {
    items.push(C(60 + i * 160, 150, 3, "#ffd166", { class: "rmap-blink" }));
    items.push(C(60 + i * 160, 412, 3, "#ff6a4d", { class: "rmap-blink" }));
  }
  fire(items, 560, 90, 0.8);
  smoke(items, 560, 90);
  fire(items, 110, 470, 0.7);
  smoke(items, 110, 470);
  return items;
}

function dannyHangars() {
  const rng = makeRng(83);
  const items = [R(0, 0, TILE_W, TILE_H, "#22251f")];
  for (let i = 0; i < 20; i += 1) {
    items.push(
      E(
        rng() * TILE_W,
        rng() * TILE_H,
        14 + rng() * 30,
        8 + rng() * 14,
        "#1b1d18",
        { opacity: 0.6 },
      ),
    );
  }
  items.push(
    L("M0 290 L640 290", "#d8c24a", 3, {
      "stroke-dasharray": "14 10",
      opacity: 0.7,
    }),
  );
  items.push(
    L("M320 0 L320 560", "#d8c24a", 3, {
      "stroke-dasharray": "14 10",
      opacity: 0.7,
    }),
  );
  const halls = [
    [26, 30, 270, 180],
    [344, 350, 270, 180],
  ];
  halls.forEach(([x, y, w, h]) => {
    items.push(shadow(x, y, w, h));
    items.push(
      R(x, y, w, h, "#3a4048", {
        stroke: "#0f1114",
        "stroke-width": 5,
        rx: 40,
      }),
    );
    for (let i = 1; i < 12; i += 1)
      items.push(
        R(x + 20, y + i * (h / 12), w - 40, 2, "#232830", { opacity: 0.8 }),
      );
    items.push(R(x + w / 2 - 3, y, 6, h, "#232830"));
  });
  plane(items, 480, 130, -20, 1.1, "#5a6a58");
  plane(items, 120, 400, 160, 1, "#4a5a4a");
  plane(items, 520, 250, 15, 0.8, "#6a6a56");
  car(items, 340, 160, 90, "#8a6a22");
  car(items, 300, 430, 270, "#8a2222");
  fire(items, 150, 90, 1);
  smoke(items, 150, 90);
  fire(items, 220, 150, 0.7);
  fire(items, 480, 440, 0.8);
  smoke(items, 480, 440);
  for (let i = 0; i < 8; i += 1) {
    items.push(
      C(40 + i * 80, 290 + 14, 2.5, "#ffd166", { class: "rmap-blink" }),
    );
    items.push(
      C(40 + i * 80, 290 - 14, 2.5, "#4dd0ff", { class: "rmap-blink" }),
    );
  }
  return items;
}

function dannyBurn() {
  const rng = makeRng(97);
  const items = [R(0, 0, TILE_W, TILE_H, "#1a1210")];
  for (let i = 0; i < 30; i += 1) {
    items.push(
      E(
        rng() * TILE_W,
        rng() * TILE_H,
        14 + rng() * 40,
        8 + rng() * 18,
        "#0d0807",
        { opacity: 0.7 },
      ),
    );
  }
  items.push(R(0, 236, TILE_W, 88, "#201a18"));
  for (let x = 0; x < TILE_W; x += 56)
    items.push(R(x, 278, 30, 4, "#e8e2c0", { opacity: 0.5 }));
  crater(items, 150, 280, 30);
  crater(items, 430, 270, 24);
  crater(items, 300, 130, 26);
  crater(items, 90, 450, 22);
  crater(items, 540, 460, 34);
  for (const [x, y, w, h] of [
    [40, 40, 150, 100],
    [420, 50, 170, 110],
    [230, 390, 160, 110],
  ]) {
    items.push(shadow(x, y, w, h));
    items.push(
      P(
        `${x},${y + 10} ${x + w * 0.4},${y} ${x + w * 0.7},${y + 24} ${x + w},${y + 6} ${x + w},${y + h} ${x},${y + h}`,
        "#2c2522",
        { stroke: "#0a0706", "stroke-width": 4 },
      ),
    );
    for (let i = 0; i < 5; i += 1)
      items.push(
        P(
          `${x + rng() * w},${y + rng() * h} ${x + rng() * w},${y + rng() * h} ${x + rng() * w},${y + rng() * h}`,
          "#15100e",
          { opacity: 0.8 },
        ),
      );
  }
  plane(items, 520, 290, 200, 1, "#2a2220");
  plane(items, 260, 270, 30, 0.9, "#352a24");
  items.push(R(0, 0, TILE_W, TILE_H, "url(#rmap-burn)", { opacity: 0.5 }));
  [
    [110, 90],
    [500, 100],
    [310, 440],
    [150, 280],
    [540, 290],
    [60, 500],
    [600, 380],
  ].forEach(([x, y], i) => {
    fire(items, x, y, 1.1 + (i % 3) * 0.2);
    smoke(items, x, y);
  });
  return items;
}

export const TILE = { w: TILE_W, h: TILE_H };

const SCENES = {
  venom: [venomStreets, venomTower, venomLab],
  danny: [dannyGate, dannyHangars, dannyBurn],
};

export function sceneTiles(theme) {
  const list = SCENES[theme];
  return list ? list.map((build) => build()) : null;
}
