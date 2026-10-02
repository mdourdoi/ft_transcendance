import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  return (await import("$lib/auth")).token;
}

describe("token store", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty when nothing is stored", async () => {
    expect(get(await load())).toBeNull();
  });

  it("restores the stored token on load", async () => {
    localStorage.setItem("token", "jwt");
    expect(get(await load())).toBe("jwt");
  });

  it("persists a new token", async () => {
    (await load()).set("jwt");
    expect(localStorage.getItem("token")).toBe("jwt");
  });

  it("forgets the token when cleared", async () => {
    const token = await load();
    token.set("jwt");
    token.set(null);
    expect(localStorage.getItem("token")).toBeNull();
  });
});
