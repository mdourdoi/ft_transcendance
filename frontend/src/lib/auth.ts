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
  navigate("/", { replace: true });
};

const decodeToken = (
  value: string | null,
): { sub?: number; exp?: number } | null => {
  if (!value) return null;

  try {
    const payload = value.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

export const isTokenExpired = (value = get(token)): boolean => {
  const exp = decodeToken(value)?.exp;
  return typeof exp !== "number" || exp * 1000 <= Date.now();
};

export const tokenUserId = (value = get(token)): number | null => {
  const sub = decodeToken(value)?.sub;
  return typeof sub === "number" ? sub : null;
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
    } catch {}
  }

  return res;
};
