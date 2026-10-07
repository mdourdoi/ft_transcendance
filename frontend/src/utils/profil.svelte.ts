import { authFetch } from '$lib/auth';
import { navigate } from "$lib/router";

export class ProfilManager {
    username = $state<string>('');
    newusername = $state<string>('');
    email = $state('');
    oldpassword = $state('');
    newpassword1 = $state('');
    newpassword2 = $state('');
    error_username = $state('');
    error_password = $state('');
    two_fa = $state('');
    qr_image = $state('');
    qr_code = $state('');
    is_2fa_enabled = $state(false);
    email_verified = $state(false);
    email_status = $state('');
    error_email = $state('');

    able_two_fa() {
        this.is_2fa_enabled = true;
    }

    denable_two_fa() {
        this.is_2fa_enabled = false;
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
            const is2fa = data.isTwoFactorEnabled ?? data.isTwoFactorAuthEnabled ?? data.twoFactorEnabled;
            if (typeof is2fa !== 'undefined') {
                this.is_2fa_enabled = Boolean(is2fa);
            }
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
        } catch (err) {
            this.error_username = err instanceof Error ? err.message : String(err);
        }
    }

    async change_password(event: SubmitEvent) {
        event.preventDefault();
        this.error_password = '';
        if (this.newpassword1 !== this.newpassword2) {
            this.error_password = 'NOTE_SAME_PASSWORD';
            return;
        }
        try {
            const res = await authFetch('/api/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldPassword: this.oldpassword.trim(),
                    newPassword: this.newpassword1.trim()
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

export const profilManager = new ProfilManager();