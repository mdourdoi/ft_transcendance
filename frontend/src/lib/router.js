import { writable } from "svelte/store";

export const path = writable(window.location.pathname);

window.addEventListener("popstate", () => path.set(window.location.pathname));

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname) return;
  history[replace ? "replaceState" : "pushState"]({}, "", to);
  path.set(to);
}

function match(pattern, pathname) {
  const parts = pattern.split("/").filter(Boolean);
  const segments = pathname.split("/").filter(Boolean);
  if (parts.length !== segments.length) return null;

  const params = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith(":")) {
      params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
    } else if (parts[i] !== segments[i]) {
      return null;
    }
  }
  return params;
}

export function resolve(routes, pathname) {
  for (const [pattern, component] of Object.entries(routes)) {
    const params = match(pattern, pathname);
    if (params) return { component, params };
  }
  return null;
}
