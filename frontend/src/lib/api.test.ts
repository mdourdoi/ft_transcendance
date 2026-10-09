import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "$lib/api";
import { token } from "$lib/auth";

const fetchMock = vi.fn<typeof fetch>();

function respond(status: number) {
  fetchMock.mockResolvedValue(new Response(null, { status }));
}

function sent() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init, headers: init?.headers as Record<string, string> };
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    token.set(null);
    respond(204);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("goes through the /api proxy", async () => {
    await api("/users/me");
    expect(sent().url).toBe("/api/users/me");
  });

  it("sends the JWT when logged in", async () => {
    token.set("jwt");
    await api("/users/me");
    expect(sent().headers.Authorization).toBe("Bearer jwt");
  });

  it("sends no Authorization header when logged out", async () => {
    await api("/users/delete-confirm", { method: "POST" });
    expect(sent().headers.Authorization).toBeUndefined();
  });

  it("declares JSON only when there is a body", async () => {
    await api("/users/me");
    expect(sent().headers["Content-Type"]).toBeUndefined();

    fetchMock.mockClear();
    await api("/users/delete-confirm", { method: "POST", body: "{}" });
    expect(sent().headers["Content-Type"]).toBe("application/json");
    expect(sent().init?.method).toBe("POST");
  });

  it("logs out when the server rejects the JWT", async () => {
    token.set("jwt");
    respond(401);
    await api("/users/me");
    expect(get(token)).toBeNull();
  });

  it("keeps the JWT on other errors", async () => {
    token.set("jwt");
    respond(429);
    await api("/users/me/delete-request", { method: "POST" });
    expect(get(token)).toBe("jwt");
  });
});
