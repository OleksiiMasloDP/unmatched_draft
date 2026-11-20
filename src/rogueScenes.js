const TILE_W = 640;
const TILE_H = 560;

function makeRng(seed) {
  let state = seed;
  return () => {
    state = (state * 16807 + 11) % 2147483647;
    return state / 2147483647;
  };
}

const rect = (x, y, w, h, fill, extra = {}) => ({
  tag: "rect",
  attrs: { x, y, width: w, height: h, fill, ...extra },
});
const poly = (points, fill, extra = {}) => ({
  tag: "polygon",
  attrs: { points, fill, ...extra },
});
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => ({
  tag: "ellipse",
  attrs: { cx, cy, rx, ry, fill, ...extra },
});
const circle = (cx, cy, r, fill, extra = {}) => ({
  tag: "circle",
  attrs: { cx, cy, r, fill, ...extra },
});

function building(rng, items, x, base, w, h, hue, light, windows) {
  const top = base - h;
  const slant = 6 + rng() * 22;
  const broken = rng() < 0.7;
  const pts = broken
    ? `${x},${base} ${x},${top + slant} ${x + w * 0.3},${top} ${x + w * 0.5},${top + slant * 1.6} ${x + w * 0.75},${top + slant * 0.4} ${x + w},${top + slant * 2} ${x + w},${base}`
    : `${x},${base} ${x},${top} ${x + w},${top} ${x + w},${base}`;
  items.push(poly(pts, `hsl(${hue}, 14%, ${light}%)`));
  if (windows) {
    for (let wx = x + 5; wx < x + w - 7; wx += 9) {
      for (let wy = top + slant * 2 + 8; wy < base - 10; wy += 12) {
        if (rng() < 0.55) {
          const lit = rng() < 0.3;
          items.push(
            rect(wx, wy, 4, 6, lit ? "#ffb84d" : "#000", {
              opacity: lit ? 0.85 : 0.35,
            }),
          );
        }
      }
    }
  }
  return { x, top, w };
}

function fireAt(items, x, y, scale = 1) {
  items.push(
    circle(x, y, 46 * scale, "url(#rmap-fireglow)", { class: "rmap-pulse" }),
    ellipse(x, y, 8 * scale, 14 * scale, "#ff6a1a", {
      opacity: 0.85,
      class: "rmap-fire",
    }),
    ellipse(x, y + 4 * scale, 4 * scale, 8 * scale, "#ffd166", {
      class: "rmap-fire",
    }),
  );
}

function citySmoke(items, x, y) {
  for (let i = 0; i < 4; i += 1) {
    items.push(
      ellipse(x + i * 7 - 10, y - i * 34, 22 + i * 12, 16 + i * 6, "#120a0a", {
        opacity: 0.38 - i * 0.06,
        class: "rmap-drift",
      }),
    );
  }
}

function cityTile() {
  const rng = makeRng(11);
  const items = [rect(0, 0, TILE_W, TILE_H, "url(#rmap-sky-city)")];
  items.push(circle(470, 120, 90, "url(#rmap-fireglow)", { opacity: 0.5 }));
  items.push(circle(470, 120, 26, "#f5d9a8", { opacity: 0.55 }));
  for (let x = -10; x < TILE_W;) {
    const w = 26 + rng() * 38;
    building(rng, items, x, 410, w, 90 + rng() * 140, 8, 9, false);
    x += w + rng() * 6;
  }
  items.push(rect(0, 0, TILE_W, TILE_H, "#2a0c08", { opacity: 0.15 }));
  const fires = [];
  for (let x = -20; x < TILE_W;) {
    const w = 30 + rng() * 40;
    const h = 70 + rng() * 150;
    const b = building(rng, items, x, 490, w, h, 14, 13, true);
    if (rng() < 0.4) fires.push([b.x + b.w * 0.5, b.top]);
    x += w + 2 + rng() * 10;
  }
  items.push(rect(0, 490, TILE_W, 70, "#0c0707"));
  items.push(rect(0, 486, TILE_W, 6, "#1d1210"));
  for (let x = 10; x < TILE_W; x += 54) {
    items.push(rect(x, 524, 28, 3, "#5b4a2a", { opacity: 0.6 }));
  }
  for (let i = 0; i < 6; i += 1) {
    const x = 20 + rng() * 580;
    const y = 500 + rng() * 40;
    const hue = rng() < 0.5 ? 0 : 215;
    items.push(
      rect(x, y, 34, 10, `hsl(${hue}, 18%, ${10 + rng() * 8}%)`, { rx: 3 }),
      rect(x + 7, y - 7, 18, 9, `hsl(${hue}, 18%, 8%)`, { rx: 3 }),
      circle(x + 8, y + 11, 3.5, "#050505"),
      circle(x + 26, y + 11, 3.5, "#050505"),
    );
  }
  for (let i = 0; i < 14; i += 1) {
    const x = rng() * TILE_W;
    const y = 496 + rng() * 60;
    const w = 6 + rng() * 14;
    items.push(
      poly(`${x},${y} ${x + w},${y - w * 0.8} ${x + w * 1.5},${y}`, "#171010"),
    );
  }
  const cracks = [
    "M40 540 L90 520 L120 530 L170 505",
    "M360 548 L410 524 L440 536 L500 510 L520 520",
  ];
  for (const d of cracks) {
    items.push({
      tag: "path",
      attrs: {
        d,
        fill: "none",
        stroke: "#ff5a1f",
        "stroke-width": 1.5,
        opacity: 0.5,
      },
    });
  }
  fires.forEach(([x, y]) => {
    citySmoke(items, x, y);
    fireAt(items, x, y, 1);
  });
  fireAt(items, 230, 506, 0.8);
  fireAt(items, 560, 512, 0.7);
  items.push({
    tag: "g",
    attrs: { class: "rmap-heli", fill: "#050505" },
    children: [
      ellipse(0, 0, 18, 7, "#050505"),
      rect(14, -2, 28, 3, "#050505"),
      rect(-16, -11, 32, 2, "#050505"),
      poly("-6,6 -22,70 10,70", "url(#rmap-beam)", { opacity: 0.6 }),
    ],
  });
  return items;
}

function airTile() {
  const rng = makeRng(23);
  const items = [rect(0, 0, TILE_W, TILE_H, "url(#rmap-sky-air)")];
  for (let i = 0; i < 40; i += 1) {
    items.push(
      circle(rng() * TILE_W, rng() * 250, 0.6 + rng() * 1.1, "#dfe8ff", {
        opacity: 0.3 + rng() * 0.5,
      }),
    );
  }
  for (let i = 0; i < 6; i += 1) {
    items.push(
      ellipse(
        rng() * TILE_W,
        80 + rng() * 280,
        90 + rng() * 80,
        14 + rng() * 10,
        "#1b2540",
        {
          opacity: 0.4,
          class: "rmap-drift",
        },
      ),
    );
  }
  const beams = [90, 300, 520];
  beams.forEach((x, i) => {
    items.push({
      tag: "g",
      attrs: {
        class: i % 2 ? "rmap-sweep rmap-sweep-b" : "rmap-sweep",
        style: `transform-origin:${x}px 500px`,
      },
      children: [
        poly(
          `${x - 10},500 ${x - 90},-40 ${x + 70},-40 ${x + 10},500`,
          "url(#rmap-beam)",
          {
            opacity: 0.55,
          },
        ),
      ],
    });
  });
  for (let i = 0; i < 2; i += 1) {
    const x = 120 + i * 300 + rng() * 80;
    const y = 90 + rng() * 120;
    items.push({
      tag: "g",
      attrs: { class: "rmap-fly", style: `transform:translate(${x}px,${y}px)` },
      children: [
        ellipse(0, 0, 34, 5, "#03060d"),
        poly("-6,0 -30,-26 -20,-26 8,0", "#03060d"),
        poly("-6,0 -30,26 -20,26 8,0", "#03060d"),
        poly("-30,0 -42,-9 -36,0 -42,9", "#03060d"),
      ],
    });
  }
  for (let i = 0; i < 9; i += 1) {
    const x = rng() * TILE_W;
    const y = 60 + rng() * 300;
    items.push(
      circle(x, y, 14 + rng() * 16, "url(#rmap-fireglow)", {
        opacity: 0.65,
        class: "rmap-flak",
      }),
      circle(x, y, 3, "#ffe3a3", { class: "rmap-flak" }),
    );
  }
  for (let i = 0; i < 12; i += 1) {
    const x = rng() * TILE_W;
    const y = 120 + rng() * 260;
    items.push({
      tag: "path",
      attrs: {
        d: `M${x} ${y} L${x - 5} ${y + 34}`,
        stroke: "#ffcf70",
        "stroke-width": 1.4,
        opacity: 0.55,
        "stroke-linecap": "round",
      },
    });
  }
  items.push(rect(0, 430, TILE_W, 130, "#05070d"));
  items.push(ellipse(320, 432, 420, 36, "#7a2a14", { opacity: 0.35 }));
  for (let x = -10; x < TILE_W;) {
    const w = 70 + rng() * 60;
    const h = 26 + rng() * 26;
    items.push(
      poly(
        `${x},470 ${x},${470 - h} ${x + w * 0.5},${470 - h - 20} ${x + w},${470 - h} ${x + w},470`,
        "#0a0d16",
      ),
      rect(x + w * 0.35, 470 - h * 0.6, w * 0.3, h * 0.6, "#030407"),
    );
    x += w + 20 + rng() * 40;
  }
  items.push(rect(0, 478, TILE_W, 82, "#0b0e17"));
  items.push(rect(0, 510, TILE_W, 22, "#12161f"));
  for (let x = 6; x < TILE_W; x += 32) {
    items.push(rect(x, 520, 14, 2, "#e8eef9", { opacity: 0.45 }));
    items.push(circle(x + 5, 507, 1.8, "#4dd0ff", { class: "rmap-blink" }));
    items.push(circle(x + 5, 535, 1.8, "#ff6a4d", { class: "rmap-blink" }));
  }
  for (let i = 0; i < 4; i += 1) {
    const x = 30 + i * 160 + rng() * 60;
    items.push(
      ellipse(x, 548, 36, 8, "#020306"),
      ellipse(x, 546, 36, 6, "#1a0d08", { opacity: 0.8 }),
    );
    fireAt(items, x, 538, 0.5);
  }
  return items;
}

export const TILE = { w: TILE_W, h: TILE_H };

export function sceneTile(theme) {
  if (theme === "city") return cityTile();
  if (theme === "air") return airTile();
  return null;
}
