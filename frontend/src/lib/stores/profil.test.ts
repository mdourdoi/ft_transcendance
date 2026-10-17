import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { token } from "$lib/auth";
import { ProfilManager } from "./profil.svelte";

const fetchMock = vi.fn<typeof fetch>();

function respond(status: number, body?: unknown) {
  fetchMock.mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
}

describe("email verification", () => {
  let profil: ProfilManager;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    token.set("jwt");
    profil = new ProfilManager();
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("reads the verified state from the profile", async () => {
    respond(200, { username: "a", email: "a@b.c", emailVerifiedAt: "2026-01-01T00:00:00Z" });
    await profil.get_user();
    expect(profil.email_verified).toBe(true);
  });

  it("is unverified when the profile has no verification date", async () => {
    respond(200, { username: "a", email: "a@b.c", emailVerifiedAt: null });
    await profil.get_user();
    expect(profil.email_verified).toBe(false);
  });

  it("asks the backend for a verification link with the JWT", async () => {
    respond(204);
    await profil.request_email_verification();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/users/me/verify-email");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
    expect(profil.email_status).toBe("SENT");
    expect(profil.error_email).toBe("");
  });

  it("marks the email verified when the backend says it already is", async () => {
    respond(409, { message: "EMAIL_ALREADY_VERIFIED" });
    await profil.request_email_verification();
    expect(profil.email_verified).toBe(true);
    expect(profil.email_status).toBe("");
    expect(profil.error_email).toBe("");
  });

  it("surfaces the rate limit code", async () => {
    respond(429, { message: "MAIL_RATE_LIMITED" });
    await profil.request_email_verification();
    expect(profil.error_email).toBe("MAIL_RATE_LIMITED");
    expect(profil.email_status).toBe("");
  });

  it("keeps the first code when validation returns a list", async () => {
    respond(400, { message: ["MAIL_SEND_FAILED", "OTHER"] });
    await profil.request_email_verification();
    expect(profil.error_email).toBe("MAIL_SEND_FAILED");
  });

  it("reports a network error when the request fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await profil.request_email_verification();
    expect(profil.error_email).toBe("NETWORK_ERROR");
  });

  it("clears the previous outcome before retrying", async () => {
    respond(429, { message: "MAIL_RATE_LIMITED" });
    await profil.request_email_verification();
    respond(204);
    await profil.request_email_verification();
    expect(profil.error_email).toBe("");
    expect(profil.email_status).toBe("SENT");
  });
});

describe("two-factor state", () => {
  let profil: ProfilManager;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    token.set("jwt");
    profil = new ProfilManager();
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  function submit() {
    return profil.change_password(new SubmitEvent("submit"));
  }

  function sentBody() {
    const call = fetchMock.mock.calls.find(([url]) => url === "/api/users/me/password");
    return JSON.parse(call?.[1]?.body as string);
  }

  it("reads the two-factor state from the profile", async () => {
    respond(200, { username: "a", email: "a@b.c", twoFactorEnabled: true });
    await profil.get_user();
    expect(profil.is_2fa_enabled).toBe(true);

    respond(200, { username: "a", email: "a@b.c", twoFactorEnabled: false });
    await profil.get_user();
    expect(profil.is_2fa_enabled).toBe(false);
  });

  it("sends the two-factor code with a password change when enabled", async () => {
    profil.is_2fa_enabled = true;
    profil.oldpassword = " Old1!pass ";
    profil.newpassword1 = profil.newpassword2 = "N3w!password";
    profil.password_code = " 123456 ";
    respond(200, {});
    await submit();

    expect(sentBody()).toEqual({ oldPassword: " Old1!pass ", newPassword: "N3w!password", code: "123456" });
    expect(profil.password_code).toBe("");
  });

  it("sends no code when two-factor is disabled", async () => {
    profil.oldpassword = "Old1!pass";
    profil.newpassword1 = profil.newpassword2 = "N3w!password";
    respond(200, {});
    await submit();

    expect(sentBody()).not.toHaveProperty("code");
  });

  it("keeps the code when the backend rejects it", async () => {
    profil.is_2fa_enabled = true;
    profil.oldpassword = "Old1!pass";
    profil.newpassword1 = profil.newpassword2 = "N3w!password";
    profil.password_code = "000000";
    respond(401, { message: "INVALID_TWOFA_CODE" });
    await submit();

    expect(profil.error_password).toBe("INVALID_TWOFA_CODE");
    expect(profil.password_code).toBe("000000");
  });

  it("forgets the previous account on reset", () => {
    profil.username = "a";
    profil.email = "a@b.c";
    profil.is_2fa_enabled = true;
    profil.qr_image = "data:image/png;base64,x";
    profil.password_code = "123456";
    profil.reset();

    expect(profil.username).toBe("");
    expect(profil.email).toBe("");
    expect(profil.is_2fa_enabled).toBe(false);
    expect(profil.qr_image).toBe("");
    expect(profil.password_code).toBe("");
  });
});
