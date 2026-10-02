import { writable } from "svelte/store";

const STORAGE_KEY = "token";

function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const token = writable<string | null>(stored());

token.subscribe((value) => {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
});
