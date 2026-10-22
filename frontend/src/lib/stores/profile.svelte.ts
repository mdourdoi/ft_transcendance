import { authFetch, token } from '$lib/auth';
import { friendManager } from './friend.svelte';

export class ProfileManager {
    username = $state<string>('');
    newusername = $state<string>('');
    email = $state('');
    oldpassword = $state('');
    newpassword1 = $state('');
    newpassword2 = $state('');
    password_code = $state('');
    error_username = $state('');
    error_password = $state('');
    username_updated = $state(false);
    password_updated = $state(false);
    error_avatar = $state('');
    two_fa = $state('');
    qr_image = $state('');
    qr_code = $state('');
    is_2fa_enabled = $state(false);
    email_verified = $state(false);
    email_status = $state('');
    error_email = $state('');
    avatarUrl = $state<string | null>(null);
    rating = $state<number | null>(null);

    reset() {
        this.username = '';
        this.newusername = '';
        this.email = '';
        this.oldpassword = '';
        this.newpassword1 = '';
        this.newpassword2 = '';
        this.password_code = '';
        this.error_username = '';
        this.error_password = '';
        this.username_updated = false;
        this.password_updated = false;
        this.error_avatar = '';
        this.two_fa = '';
        this.qr_image = '';
        this.qr_code = '';
        this.is_2fa_enabled = false;
        this.email_verified = false;
        this.email_status = '';
        this.error_email = '';
        this.avatarUrl = null;
        this.rating = null;
    }

    able_two_fa() {
        this.is_2fa_enabled = true;
    }

    denable_two_fa() {
        this.is_2fa_enabled = false;
    }

    async change_avatar(file: File) {
        this.error_avatar = '';
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await authFetch('/api/users/me/avatar', {
                method: 'POST',
                body,
            });
            if (res.status === 413) {
                this.error_avatar = 'FILE_TOO_LARGE';
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const errorCode = Array.isArray(data?.message) ? data.message[0] : data?.message;
                this.error_avatar = errorCode ?? 'UNKNOWN_ERROR';
                return;
            }
            const data = await res.json();
            this.avatarUrl = data.avatarUrl;
            friendManager.get_user();
        }
        catch {
            this.error_avatar = 'NETWORK_ERROR';
        }
    }

    async get_user() {
        try {
            const res = await authFetch('/api/users/me');
            const data = await res.json();
            if (!res.ok) {
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.error_username = errorCode;
                return;
            }
            this.username = data.username;
            this.email = data.email;
            this.email_verified = Boolean(data.emailVerifiedAt);
            this.avatarUrl = data.avatarUrl;
            this.rating = data.rating;
            this.is_2fa_enabled = Boolean(data.twoFactorEnabled);
        } catch (err) {
            this.error_username = err instanceof Error ? err.message : String(err);
        }
    }

    async request_email_verification() {
        this.error_email = '';
        this.email_status = '';
        try {
            const res = await authFetch('/api/users/me/verify-email', { method: 'POST' });
            if (res.ok) {
                this.email_status = 'SENT';
                return;
            }
            const data = await res.json();
            const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
            if (errorCode === 'EMAIL_ALREADY_VERIFIED') this.email_verified = true;
            else this.error_email = errorCode;
        } catch {
            this.error_email = 'NETWORK_ERROR';
        }
    }

    async change_username(event: SubmitEvent) {
        event.preventDefault();
        this.error_username = '';
        this.username_updated = false;
        if (this.username === this.newusername) {
            this.error_username = 'SAME_USERNAME';
            return;
        }
        try {
            const res = await authFetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: this.newusername.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.error_username = errorCode;
                return;
            }
            this.newusername = '';
            await this.get_user();
            friendManager.username = this.username;
            this.username_updated = true;
        } catch (err) {
            this.error_username = err instanceof Error ? err.message : String(err);
        }
    }

    async change_password(event: SubmitEvent) {
        event.preventDefault();
        this.error_password = '';
        this.password_updated = false;
        if (this.newpassword1 !== this.newpassword2) {
            this.error_password = 'NOTE_SAME_PASSWORD';
            return;
        }
        try {
            const res = await authFetch('/api/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldPassword: this.oldpassword,
                    newPassword: this.newpassword1,
                    ...(this.is_2fa_enabled && { code: this.password_code.trim() })
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.error_password = errorCode;
                return;
            }
            this.oldpassword = '';
            this.newpassword1 = '';
            this.newpassword2 = '';
            this.password_code = '';
            this.password_updated = true;
            await this.get_user();
        } catch (err) {
            this.error_password = err instanceof Error ? err.message : String(err);
        }
    }

    async active_two_fa() {
        this.two_fa = '';
        try {
            const res = await authFetch('/api/twofa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    this.able_two_fa();
                    return;
                }
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.two_fa = errorCode;
                return;
            }
            this.qr_image = data.qr;
        } catch (err) {
            this.two_fa = err instanceof Error ? err.message : String(err);
        }
    }

    async validat_two_fa(event: SubmitEvent) {
        event.preventDefault();
        this.two_fa = '';
        try {
            const res = await authFetch('/api/twofa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: this.qr_code.trim() })
            });
            const data = await res.json();
            if (!res.ok) {
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.two_fa = errorCode;
                return;
            }
            this.qr_image = '';
            this.qr_code = '';
            this.able_two_fa();
            await this.get_user();
        } catch (err) {
            this.two_fa = err instanceof Error ? err.message : String(err);
        }
    }

    async delite_two_fa(event?: Event) {
        if (event) event.preventDefault();
        this.two_fa = '';
        try {
            const res = await authFetch('/api/twofa/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: this.qr_code.trim() })
            });
            const data = await res.json();
            if (!res.ok) {
                const errorCode = Array.isArray(data.message) ? data.message[0] : data.message;
                this.two_fa = errorCode;
                return;
            }
            this.qr_code = '';
            this.denable_two_fa();
            await this.get_user();
        } catch (err) {
            this.two_fa = err instanceof Error ? err.message : String(err);
        }
    }
}

export const profileManager = new ProfileManager();

token.subscribe((value) => {
    if (!value) profileManager.reset();
});