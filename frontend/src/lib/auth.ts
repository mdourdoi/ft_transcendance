import { writable, get } from "svelte/store";
import { navigate } from "$lib/router";

const saved =
  typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
export const token = writable<string>(saved ?? "");

token.subscribe((value) => {
  if (value) localStorage.setItem("token", value);
  else localStorage.removeItem("token");
});

export const logout = () => {
  token.set("");
  navigate("/", { replace: true });
};

export const isTokenExpired = (value = get(token)): boolean => {
  if (!value) return true;

  try {
    const payload = value.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as {
      exp?: number;
    };

    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
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
