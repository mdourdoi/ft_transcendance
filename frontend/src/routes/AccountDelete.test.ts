import { fireEvent, render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { token } from "$lib/auth";
import en from "$lib/i18n/locales/en.json";
import AccountDelete from "./AccountDelete.svelte";

const fetchMock = vi.fn<typeof fetch>();
const confirmButton = () => screen.getByRole("button", { name: en.PRIVACY.DELETE_CONFIRM });

function open(search: string) {
  history.replaceState({}, "", `/account/delete${search}`);
  render(AccountDelete);
}

describe("AccountDelete page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    token.set("jwt");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects a link without token and never calls the API", () => {
    open("");
    expect(screen.getByText(en.ACCOUNT_DELETE.INVALID)).toBeTruthy();
    expect(screen.queryByRole("button", { name: en.PRIVACY.DELETE_CONFIRM })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not delete anything just by opening the link", async () => {
    open("?token=abc");
    await Promise.resolve();

    expect(screen.getByText(en.PRIVACY.DELETE_WARNING)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes on click, then logs out", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    open("?token=abc");
    await fireEvent.click(confirmButton());

    await screen.findByText(en.ACCOUNT_DELETE.DONE);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/users/delete-confirm");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ token: "abc" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(get(token)).toBeNull();
    expect(screen.queryByRole("button", { name: en.PRIVACY.DELETE_CONFIRM })).toBeNull();
  });

  it("reports an expired or already used link and keeps the session", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 400 }));
    open("?token=expired");
    await fireEvent.click(confirmButton());

    await screen.findByText(en.ACCOUNT_DELETE.INVALID);
    expect(get(token)).toBe("jwt");
  });

  it("lets the user retry after a server error", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    open("?token=abc");
    await fireEvent.click(confirmButton());

    await screen.findByText(en.PRIVACY.STATUS_ERROR);
    expect(get(token)).toBe("jwt");

    await fireEvent.click(confirmButton());
    await screen.findByText(en.ACCOUNT_DELETE.DONE);
  });

  it("lets the user retry after a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    open("?token=abc");
    await fireEvent.click(confirmButton());

    await screen.findByText(en.PRIVACY.STATUS_ERROR);
    expect(confirmButton()).toBeTruthy();
  });
});
