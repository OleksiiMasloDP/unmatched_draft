// Завантаження даних для сторінок героїв і мап у браузері.
import { buildSeoModel } from "./seoData.js";

let modelPromise = null;

export function loadSeoModel() {
  if (!modelPromise) {
    modelPromise = Promise.all([
      fetch("characters.json").then((res) => res.json()),
      fetch("maps.json").then((res) => res.json()),
    ]).then(([characters, maps]) =>
      buildSeoModel({
        characters: characters.characters,
        matchups: characters.matchups,
        maps,
      }),
    );
    modelPromise.catch(() => (modelPromise = null));
  }
  return modelPromise;
}

const guideCache = new Map();

// Гайд є не для всіх героїв: немає файлу - повертаємо null.
export async function loadGuide(name) {
  if (guideCache.has(name)) return guideCache.get(name);
  let guide = null;
  try {
    const res = await fetch(`guides/${encodeURIComponent(name)}.json`);
    const type = res.headers.get("content-type") || "";
    if (res.ok && type.includes("json")) guide = await res.json();
  } catch {
    guide = null;
  }
  guideCache.set(name, guide);
  return guide;
}
