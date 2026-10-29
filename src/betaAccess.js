import { ref } from "vue";
import { BETA_PASSWORD_HASH } from "./betaPassword.js";

const STORAGE_KEY = "beta_access";

const gateOn = import.meta.env.VITE_BETA_GATE !== "off";

function isStoredOk() {
  try {
    return localStorage.getItem(STORAGE_KEY) === BETA_PASSWORD_HASH;
  } catch {
    return false;
  }
}

export const unlocked = ref(!gateOn || isStoredOk());

async function hashPassword(value) {
  const data = new TextEncoder().encode("unmatched-draft-beta:" + value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function tryUnlock(password) {
  const hash = await hashPassword(password);
  if (hash !== BETA_PASSWORD_HASH) return false;
  try {
    localStorage.setItem(STORAGE_KEY, hash);
  } catch {
    // без localStorage просто спитає пароль знову при наступному заході
  }
  unlocked.value = true;
  return true;
}
