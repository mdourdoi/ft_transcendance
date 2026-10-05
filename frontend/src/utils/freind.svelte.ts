import { authFetch } from '$lib/auth';

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
				const res = await authFetch('http://localhost:3000/users/me');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.username = data.username;
				this.email = data.email;
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
		this.error = null;
	}

		async get_friends()
		{
			try{
				const res = await authFetch('http://localhost:3000/friendships');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.friends = data;
			} catch (err) {
				this.error = err instanceof Error ? err.message : String(err);
			}

		}

		async friendships_requests(){
			try {
				const res = await authFetch('http://localhost:3000/friendships/requests');
				const data = await res.json();
				if (!res.ok) throw new Error(data.message);
				this.friend_requests = data;
				//console.log($state.snapshot(this.friend_requests));
			} catch (err) {
				this.error = err instanceof Error ? err.message : String(err);
			}
		}

		add_freind = async (event: SubmitEvent) => {
			event.preventDefault();
			//const targetId = Number(this.to_add.trim());
			//if (!Number.isInteger(targetId)) return;
			try {
				const res = await authFetch('http://localhost:3000/friendships/send', {
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
				this.error = err instanceof Error ? err.message : String(err);
			}
		}

		async accept_request(friend_id: number) {
			try {
				const res = await authFetch('http://localhost:3000/friendships/accept', {
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
				this.error = err instanceof Error ? err.message : String(err);
				await this.friendships_requests();
			}
		}

		async deny_request(friend_id: number) {
			try {
				const res = await authFetch('http://localhost:3000/friendships/deny', {
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
				this.error = err instanceof Error ? err.message : String(err);
				await this.friendships_requests();
			}
		}
}

export const friendManager = new FriendManager();

import { token } from '$lib/auth'; // ajoute token à ton import existant

token.subscribe((value) => {
    if (!value) {
        friendManager.reset();
    } else {
        friendManager.get_user();
        friendManager.get_friends();
        friendManager.friendships_requests();
    }
});