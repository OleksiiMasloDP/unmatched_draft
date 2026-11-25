import { reactive, watch } from "vue";
import { user } from "../cloud/useAuth.js";
import { getClient } from "../cloud/client.js";
import { notifyChanged, registerSyncable } from "../cloud/sync.js";
import { heroKeys, heroName } from "./profileStore.js";
import { usernameFrom } from "./tabletopParse.js";

const prefix = "tabletop:";
const STORE_KEY = "unmatched_tabletop";

const empty = () => ({ current: null, previous: null });

export const tabletop = reactive(empty());

let loadedFor = null;

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const keyByName = new Map(
  heroKeys.map((key) => [normalize(heroName(key)), key]),
);

const read = (id) => {
  try {
    const current = JSON.parse(localStorage.getItem(STORE_KEY));
    if (current && current.owner === id) return current;
    return JSON.parse(localStorage.getItem(prefix + id));
  } catch {
    return null;
  }
};

function save() {
  if (!loadedFor) return;
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ ...tabletop, owner: loadedFor }),
    );
  } catch {
    return;
  }
  notifyChanged("tabletop");
}

const loadFor = (account) => {
  loadedFor = account ? account.id : null;
  const saved = account ? read(account.id) : null;
  Object.assign(tabletop, empty(), saved || {});
  delete tabletop.owner;
};

watch(user, loadFor, { immediate: true });

registerSyncable({
  name: "tabletop",
  docKey: "tabletop",
  storageKey: STORE_KEY,
  toRemote: (raw) => (raw ? JSON.parse(raw) : null),
  fromRemote: (value) => (value == null ? null : JSON.stringify(value)),
  apply: () => loadFor(user.value),
});

export const importTabletop = async (input) => {
  const username = usernameFrom(input);
  if (!username) return { error: "bad_input" };
  if (!loadedFor) return { error: "signin" };
  const client = await getClient();
  if (!client || !client.functions) return { error: "network" };
  let response;
  try {
    response = await client.functions.invoke("tabletop-import", {
      body: { username },
    });
  } catch {
    return { error: "network" };
  }
  let payload = response.data;
  if (response.error) {
    try {
      payload = await response.error.context.json();
    } catch {
      payload = null;
    }
    return { error: (payload && payload.error) || "network" };
  }
  if (!payload || payload.error || !Array.isArray(payload.fighters))
    return { error: (payload && payload.error) || "network" };
  tabletop.previous = tabletop.current;
  tabletop.current = {
    username: payload.username || username,
    rating: payload.rating,
    deviation: payload.deviation,
    ratedMatches: payload.ratedMatches,
    importedAt: Date.now(),
    fighters: payload.fighters.map((row) => ({
      name: row.name,
      key: keyByName.get(normalize(row.name)) || "",
      wins: row.wins,
      losses: row.losses,
      games: row.games,
    })),
  };
  save();
  return { ok: true };
};

export const revertTabletop = () => {
  tabletop.current = tabletop.previous;
  tabletop.previous = null;
  save();
};
