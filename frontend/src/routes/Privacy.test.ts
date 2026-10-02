import { fireEvent, render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { token } from "$lib/auth";
import en from "$lib/i18n/locales/en.json";
import Privacy from "./Privacy.svelte";

const T = en.PRIVACY;
const fetchMock = vi.fn<typeof fetch>();
const button = (name: string) => screen.getByRole("button", { name });
const click = (name: string) => fireEvent.click(button(name));

describe("Privacy page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    token.set("jwt");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks to log in when there is no session", () => {
    token.set(null);
    render(Privacy);
    expect(screen.getByText(T.LOGIN_REQUIRED)).toBeTruthy();
    expect(screen.queryByRole("button", { name: T.EXPORT })).toBeNull();
    expect(screen.queryByRole("button", { name: T.DELETE })).toBeNull();
  });

  describe("export", () => {
    let anchorClick: MockInstance<() => void>;
    const downloaded = () => anchorClick.mock.contexts[0] as HTMLAnchorElement | undefined;

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => "blob:export");
      URL.revokeObjectURL = vi.fn();
      anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    });

    it("downloads the file named by the server", async () => {
      fetchMock.mockResolvedValue(
        new Response('{"profile":{}}', {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="export-7.json"' },
        }),
      );
      render(Privacy);
      await click(T.EXPORT);

      await screen.findByText(T.STATUS_EXPORTED);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/users/me/export");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
      expect(anchorClick).toHaveBeenCalledOnce();
      expect(downloaded()?.download).toBe("export-7.json");
      expect(downloaded()?.href).toBe("blob:export");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:export");
    });

    it("falls back to a default file name", async () => {
      fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
      render(Privacy);
      await click(T.EXPORT);

      await screen.findByText(T.STATUS_EXPORTED);
      expect(downloaded()?.download).toBe("my-data.json");
    });

    it("reports a failed export without downloading anything", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
      render(Privacy);
      await click(T.EXPORT);

      await screen.findByText(T.STATUS_ERROR);
      expect(anchorClick).not.toHaveBeenCalled();
    });

    it("reports a network failure", async () => {
      fetchMock.mockRejectedValue(new TypeError("network"));
      render(Privacy);
      await click(T.EXPORT);

      await screen.findByText(T.STATUS_ERROR);
      expect(anchorClick).not.toHaveBeenCalled();
    });

    it("returns to the login prompt when the session has expired", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
      render(Privacy);
      await click(T.EXPORT);

      await screen.findByText(T.LOGIN_REQUIRED);
      expect(get(token)).toBeNull();
    });
  });

  describe("account deletion", () => {
    it("warns first and calls nothing until confirmed", async () => {
      render(Privacy);
      await click(T.DELETE);

      expect(screen.getByText(T.DELETE_WARNING)).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("can be cancelled", async () => {
      render(Privacy);
      await click(T.DELETE);
      await click(T.CANCEL);

      expect(screen.queryByText(T.DELETE_WARNING)).toBeNull();
      expect(button(T.DELETE)).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("requests the confirmation email once confirmed", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      render(Privacy);
      await click(T.DELETE);
      await click(T.DELETE_CONFIRM);

      await screen.findByText(T.STATUS_SENT);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/users/me/delete-request");
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
      expect(screen.queryByText(T.DELETE_WARNING)).toBeNull();
      expect(get(token)).toBe("jwt");
    });

    it("explains the one-minute limit between emails", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429 }));
      render(Privacy);
      await click(T.DELETE);
      await click(T.DELETE_CONFIRM);

      await screen.findByText(T.STATUS_RATE);
    });

    it("reports a mail server failure", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
      render(Privacy);
      await click(T.DELETE);
      await click(T.DELETE_CONFIRM);

      await screen.findByText(T.STATUS_ERROR);
    });
  });
});
