import { authFetch, token } from '$lib/auth';

export class FriendManager {
	friends = $state<any[]>([]);
	friend_requests = $state<any[]>([]);
	username = $state<string>('');
	email = $state<string>('');
	to_add = $state<string>('');
	error = $state<string>('');
	blocked = $state<any[]>([]);
	sent = $state<any[]>([]);
	avatar = $state('');

	async get_user() {
		this.error = '';
		try {
			const res = await authFetch('/api/users/me');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			this.username = data.username;
			this.email = data.email;
			this.avatar = data.avatarUrl;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	reset() {
		this.friends = [];
		this.friend_requests = [];
		this.username = '';
		this.email = '';
		this.to_add = '';
		this.error = '';
		this.blocked = [];
		this.sent = [];
		this.avatar = '';
	}

	async get_friends() {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			this.friends = data;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async refresh() {
		await Promise.all([
			this.get_friends(),
			this.friendships_requests(),
			this.get_blocked(),
			this.get_sent_requests()
		]);
	}

	async get_blocked() {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/blocked');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			this.blocked = data;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async friendships_requests() {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/requests');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			this.friend_requests = data;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async get_sent_requests() {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/pending');
			const data = await res.json();
			if (!res.ok) {
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			this.sent = data;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	add_friend = async (event: SubmitEvent) => {
		event.preventDefault();
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: this.to_add })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			this.to_add = '';
			await this.get_friends();
			await this.friendships_requests();
			await this.get_sent_requests();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async accept_request(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.get_friends();
			await this.friendships_requests();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
			await this.refresh();
		}
	}

	async deny_request(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/deny', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.friendships_requests();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
			await this.refresh();
		}
	}

	async remove_friend(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/remove', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.get_friends();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async block_friend(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/block', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.get_friends();
			await this.get_blocked();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async unblock_friend(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/unblock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.get_friends();
			await this.get_blocked();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}

	async cancel_invitation(friend_id: number) {
		this.error = '';
		try {
			const res = await authFetch('/api/friendships/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId: friend_id })
			});
			if (!res.ok) {
				const data = await res.json();
				const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				this.error = errorCode;
				return;
			}
			await this.get_sent_requests();
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		}
	}
}

export const friendManager = new FriendManager();

import { get } from 'svelte/store';
import { onFriendRequest } from '$lib/socket';

// Only incoming requests are pushed over the socket; other changes are picked up by polling.
const REFRESH_INTERVAL_MS = 30_000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

token.subscribe((value) => {
	if (refreshTimer) clearInterval(refreshTimer);
	refreshTimer = null;
	if (!value) {
		friendManager.reset();
	} else {
		friendManager.get_user();
		friendManager.refresh();
		refreshTimer = setInterval(() => friendManager.refresh(), REFRESH_INTERVAL_MS);
	}
});

onFriendRequest(() => friendManager.friendships_requests());

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible' && get(token)) friendManager.refresh();
});
