import { get } from "svelte/store";
import { token } from "$lib/auth";

const BASE = "/api";

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const jwt = get(token);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && jwt) token.set(null);
  return res;
}
