import { writable, get } from "svelte/store";
import { navigate } from "$lib/router";

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

export const logout = () => {
  token.set(null);
  navigate("/");
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${get(token)}` },
  });

  if (res.status === 401) {
    try {
      const data = await res.clone().json();
      if (data.message === "INVALID_TOKEN") {
        logout();
      }
    } catch {
    }
  }

  return res;
};
