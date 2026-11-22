// Синхронізація даних користувача між пристроями.
//
// Що синхронізується (кожне - окремий "документ" у таблиці user_docs):
//   draft   - поточний драфт (без мови інтерфейсу)
//   formats - власні формати
//   decks   - збережені колоди для гри
//
// Правила:
//  - Локально дані лишаються в localStorage, застосунок працює і без акаунта.
//  - Зміна -> debounce -> upsert в хмару. Інші пристрої отримують зміну миттєво
//    (Realtime) або при поверненні на вкладку.
//  - Конфлікт: перемагає остання зміна. Перша синхронізація на пристрої з
//    гостьовими даними: формати й колоди зливаються за id, драфт бере хмарний.
//  - Вихід з акаунта прибирає прив'язані до акаунта локальні дані (спільний ПК).
import { ref } from "vue";
import { getClient } from "./client.js";

const TABLE = "user_docs";

const sameJson = (a, b) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function createSyncEngine(options = {}) {
  const storage =
    options.storage ||
    (typeof localStorage !== "undefined" ? localStorage : null);
  const getClientFn = options.getClient || getClient;
  const debounceMs = options.debounceMs ?? 1500;
  const guardMs = options.guardMs ?? 400;
  const retryMs = options.retryMs ?? 15000;
  const now = options.now || (() => Date.now());
  const win = options.window ?? (typeof window !== "undefined" ? window : null);

  const status = ref("off"); // off | idle | syncing | synced | offline | error
  const lastSyncedAt = ref(null);

  const registry = new Map(); // name -> definition
  const lastSyncedStr = {};
  const pushTimers = {};
  const guardUntil = {};
  const pushing = new Set();

  let userId = null;
  let client = null;
  let channel = null;
  let retryTimer = null;
  let started = false;
  let focusTimer = null;

  // ---------- допоміжне ----------
  const metaKey = (name) => `cloud_meta_${name}`;
  function readMeta(name) {
    try {
      return JSON.parse(storage.getItem(metaKey(name))) || {};
    } catch {
      return {};
    }
  }
  function writeMeta(name, meta) {
    try {
      storage.setItem(metaKey(name), JSON.stringify(meta));
    } catch {
      // сховище переповнене - не критично
    }
  }

  function snapshot(def) {
    try {
      return def.toRemote(storage.getItem(def.storageKey));
    } catch {
      return null;
    }
  }
  const snapshotStr = (def) => JSON.stringify(snapshot(def) ?? null);

  function setStatus(next) {
    status.value = next;
  }

  // ---------- реєстрація ----------
  // def: { name, docKey, storageKey, toRemote(raw), fromRemote(value), apply(raw), merge? }
  function registerSyncable(def) {
    registry.set(def.name, def);
    lastSyncedStr[def.name] = snapshotStr(def);
  }

  // Викликається з місць, де застосунок зберігає дані локально.
  function notifyChanged(name) {
    const def = registry.get(name);
    if (!def || !storage) return;
    if (now() < (guardUntil[name] || 0)) return; // зміна від самої синхронізації
    const current = snapshotStr(def);
    if (current === lastSyncedStr[name]) return; // нічого нового для хмари
    writeMeta(name, { ...readMeta(name), dirty: true, localEditedAt: now() });
    if (userId) schedulePush(name, debounceMs);
  }

  function schedulePush(name, delay) {
    clearTimeout(pushTimers[name]);
    pushTimers[name] = setTimeout(() => push(name), delay);
  }

  // ---------- відправка ----------
  async function push(name) {
    const def = registry.get(name);
    if (!def || !userId || !client) return;
    const value = snapshot(def);
    const str = JSON.stringify(value ?? null);
    pushing.add(name);
    setStatus("syncing");
    try {
      const { data, error } = await client
        .from(TABLE)
        .upsert(
          { user_id: userId, doc_key: def.docKey, value: { v: value } },
          { onConflict: "user_id,doc_key" },
        )
        .select("updated_at")
        .single();
      if (error) throw error;
      lastSyncedStr[name] = str;
      const stillDirty = snapshotStr(def) !== str;
      writeMeta(name, {
        syncedAt: data.updated_at,
        dirty: stillDirty,
        localEditedAt: readMeta(name).localEditedAt || 0,
      });
      if (stillDirty) schedulePush(name, debounceMs);
      afterOk();
    } catch (error) {
      handleError(error);
    } finally {
      pushing.delete(name);
    }
  }

  function afterOk() {
    clearTimeout(retryTimer);
    lastSyncedAt.value = new Date(now()).toISOString();
    setStatus(pushing.size > 1 ? "syncing" : "synced");
  }

  function handleError(error) {
    console.warn("[cloud sync]", error?.message || error);
    const offline =
      error instanceof TypeError ||
      (win && win.navigator && win.navigator.onLine === false);
    setStatus(offline ? "offline" : "error");
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => pullAll(), retryMs);
  }

  // ---------- отримання ----------
  async function pullAll() {
    if (!userId || !client) return;
    setStatus("syncing");
    try {
      const { data, error } = await client
        .from(TABLE)
        .select("doc_key,value,updated_at")
        .eq("user_id", userId);
      if (error) throw error;
      for (const def of registry.values()) {
        const row = (data || []).find((item) => item.doc_key === def.docKey);
        handleRemote(def, row || null);
      }
      afterOk();
    } catch (error) {
      handleError(error);
    }
  }

  function applyRemote(def, value, updatedAt) {
    const name = def.name;
    guardUntil[name] = now() + guardMs;
    const raw = def.fromRemote(value);
    if (raw == null) storage.removeItem(def.storageKey);
    else storage.setItem(def.storageKey, raw);
    try {
      def.apply(raw);
    } catch (error) {
      console.error(error);
    }
    writeMeta(name, { syncedAt: updatedAt, dirty: false, localEditedAt: 0 });
    lastSyncedStr[name] = snapshotStr(def);
    // застосунок може "нормалізувати" дані й перезаписати їх - це не наша зміна
    setTimeout(() => {
      lastSyncedStr[name] = snapshotStr(def);
    }, guardMs + 50);
  }

  function handleRemote(def, row) {
    const name = def.name;
    const meta = readMeta(name);
    const localVal = snapshot(def);

    if (!row) {
      if (localVal != null) schedulePush(name, 0);
      return;
    }
    const remoteVal = row.value ? (row.value.v ?? null) : null;

    // хмара не змінилась з останньої синхронізації
    if (meta.syncedAt && meta.syncedAt === row.updated_at) {
      if (meta.dirty) schedulePush(name, 0);
      return;
    }

    // перша синхронізація цього пристрою з цим акаунтом
    if (!meta.syncedAt) {
      let merged = remoteVal;
      if (def.merge && localVal != null)
        merged = def.merge(localVal, remoteVal);
      applyRemote(def, merged, row.updated_at);
      if (def.merge && localVal != null && !sameJson(merged, remoteVal)) {
        writeMeta(name, {
          ...readMeta(name),
          dirty: true,
          localEditedAt: now(),
        });
        schedulePush(name, 0);
      }
      return;
    }

    // хмара змінилась після нашої останньої синхронізації
    if (!meta.dirty) {
      applyRemote(def, remoteVal, row.updated_at);
      return;
    }
    const remoteTime = Date.parse(row.updated_at) || 0;
    if ((meta.localEditedAt || 0) > remoteTime) schedulePush(name, 0);
    else applyRemote(def, remoteVal, row.updated_at);
  }

  function onRealtime(payload) {
    const row = payload && payload.new;
    if (!row || payload.eventType === "DELETE") return;
    const def = [...registry.values()].find(
      (item) => item.docKey === row.doc_key,
    );
    if (!def || pushing.has(def.name)) return;
    if (readMeta(def.name).syncedAt === row.updated_at) return; // ехо власного запису
    handleRemote(def, row);
  }

  // ---------- життєвий цикл ----------
  async function startSync(uid) {
    if (!storage || !uid) return;
    if (started && userId === uid) return;
    stopSync();
    userId = uid;
    started = true;

    const previous = storage.getItem("cloud_user_id");
    if (previous && previous !== uid) clearLocalData(); // інший акаунт на цьому пристрої
    storage.setItem("cloud_user_id", uid);

    setStatus("syncing");
    client = await getClientFn();
    if (!client || userId !== uid) return;

    try {
      channel = client
        .channel(`user_docs_${uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: TABLE,
            filter: `user_id=eq.${uid}`,
          },
          onRealtime,
        )
        .subscribe();
    } catch (error) {
      console.warn("[cloud sync] realtime unavailable", error);
    }

    if (win && win.addEventListener) {
      win.addEventListener("online", onOnline);
      win.addEventListener("focus", onFocus);
      win.document?.addEventListener?.("visibilitychange", onVisible);
    }
    await pullAll();
  }

  function onOnline() {
    pullAll();
  }
  function onFocus() {
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => pullAll(), 400);
  }
  function onVisible() {
    if (win.document.visibilityState === "visible") onFocus();
  }

  function stopSync() {
    for (const timer of Object.values(pushTimers)) clearTimeout(timer);
    clearTimeout(retryTimer);
    clearTimeout(focusTimer);
    if (channel && client && client.removeChannel) {
      try {
        client.removeChannel(channel);
      } catch {
        // вже закрито
      }
    }
    if (win && win.removeEventListener) {
      win.removeEventListener("online", onOnline);
      win.removeEventListener("focus", onFocus);
      win.document?.removeEventListener?.("visibilitychange", onVisible);
    }
    channel = null;
    userId = null;
    started = false;
    setStatus("off");
  }

  // Після виходу з акаунта прибираємо дані, прив'язані до цього акаунта.
  function clearLocalData() {
    if (!storage || !storage.getItem("cloud_user_id")) return;
    for (const def of registry.values()) {
      guardUntil[def.name] = now() + guardMs;
      storage.removeItem(def.storageKey);
      storage.removeItem(metaKey(def.name));
      try {
        def.apply(null);
      } catch (error) {
        console.error(error);
      }
      lastSyncedStr[def.name] = snapshotStr(def);
    }
    storage.removeItem("cloud_user_id");
  }

  async function syncNow() {
    if (!userId) return;
    for (const name of registry.keys()) {
      if (readMeta(name).dirty) await push(name);
    }
    await pullAll();
  }

  return {
    status,
    lastSyncedAt,
    registerSyncable,
    notifyChanged,
    startSync,
    stopSync,
    clearLocalData,
    syncNow,
    // для тестів
    _pullAll: pullAll,
    _readMeta: readMeta,
  };
}

// ---- єдиний екземпляр для застосунку ----
const engine = createSyncEngine();
export const syncStatus = engine.status;
export const lastSyncedAt = engine.lastSyncedAt;
export const registerSyncable = engine.registerSyncable;
export const notifyChanged = engine.notifyChanged;
export const startSync = engine.startSync;
export const stopSync = engine.stopSync;
export const clearLocalData = engine.clearLocalData;
export const syncNow = engine.syncNow;
