import { authFetch } from '$lib/auth';

// Validation errors without an explicit code come back as English sentences.
function toErrorCode(err: unknown): string {
	const message = err instanceof Error ? err.message : err;
	return typeof message === 'string' && /^[A-Z0-9_]+$/.test(message) ? message : 'UNKNOWN_ERROR';
}

export class FriendManager {
	
	friends = $state<any[]>([]);
    friend_requests = $state<any[]>([]);
    username = $state<string>('');
    email = $state<string>('');
    to_add = $state<string>('');
    error = $state<string | null>(null);
	
	async get_user()
		{
			try{
				const res = await authFetch('/api/users/me');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.username = data.username;
				this.email = data.email;
			} catch (err) {
				this.error = toErrorCode(err);
			}

		}

	reset() {
		this.friends = [];
		this.friend_requests = [];
		this.username = '';
		this.email = '';
		this.to_add = '';
		this.error = null;
	}

		async get_friends()
		{
			try{
				const res = await authFetch('/api/friendships');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.friends = data;
			} catch (err) {
				this.error = toErrorCode(err);
			}

		}

		async refresh() {
			await Promise.all([this.get_friends(), this.friendships_requests()]);
		}

		async friendships_requests(){
			try {
				const res = await authFetch('/api/friendships/requests');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.friend_requests = data;
			} catch (err) {
				this.error = toErrorCode(err);
			}
		}

		add_friend = async (event: SubmitEvent) => {
			event.preventDefault();
			this.error = null;
			try {
				const res = await authFetch('/api/friendships/send', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username: this.to_add })
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message);
				}
				this.to_add = '';
				await this.get_friends();
				await this.friendships_requests();
			} catch (err) {
				this.error = toErrorCode(err);
			}
		}

		async accept_request(friend_id: number) {
			this.error = null;
			try {
				const res = await authFetch('/api/friendships/accept', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ targetId: friend_id })
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message);
				}
				await this.get_friends();
				await this.friendships_requests();
			} catch (err) {
				this.error = toErrorCode(err);
				await this.refresh();
			}
		}

		async deny_request(friend_id: number) {
			this.error = null;
			try {
				const res = await authFetch('/api/friendships/deny', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ targetId: friend_id })
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.message);
				}
				await this.friendships_requests();
			} catch (err) {
				this.error = toErrorCode(err);
				await this.refresh();
			}
		}
}

export const friendManager = new FriendManager();

import { get } from 'svelte/store';
import { token } from '$lib/auth';
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
