import { authFetch } from '$lib/auth';
import { navigate } from '$lib/router';

export type InviteSender = { id: number; username: string; avatarUrl: string };

export class InviteManager {
	incoming = $state<Record<number, { from: InviteSender; expiresAt: number }>>({});
	outgoing = $state<Record<number, number>>({});
	declined = $state<Record<number, boolean>>({});
	error = $state('');
	now = $state(Date.now());

	constructor() {
		setInterval(() => this.tick(), 1000);
	}

	private tick() {
		this.now = Date.now();
		for (const id of Object.keys(this.incoming).map(Number))
			if (this.incoming[id].expiresAt <= this.now) delete this.incoming[id];
		for (const id of Object.keys(this.outgoing).map(Number))
			if (this.outgoing[id] <= this.now) delete this.outgoing[id];
	}

	secondsLeft(expiresAt: number) {
		return Math.max(0, Math.ceil((expiresAt - this.now) / 1000));
	}

	reset() {
		this.incoming = {};
		this.outgoing = {};
		this.declined = {};
		this.error = '';
	}

	receive(from: InviteSender, expiresAt: number) {
		this.incoming[from.id] = { from, expiresAt };
	}

	accepted(opponentId: number) {
		delete this.outgoing[opponentId];
		navigate('/game/normal', { useAnimation: true });
	}

	refused(userId: number) {
		delete this.outgoing[userId];
		this.declined[userId] = true;
	}

	withdrawn(userId: number) {
		delete this.incoming[userId];
	}

	private async post(action: string, targetId: number) {
		this.error = '';
		try {
			const res = await authFetch(`/api/game-invites/${action}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetId })
			});
			const data = await res.json().catch(() => null);
			if (!res.ok) {
				this.error = (Array.isArray(data?.message) ? data.message[0] : data?.message) ?? 'UNKNOWN_ERROR';
				return null;
			}
			return data ?? {};
		} catch {
			this.error = 'NETWORK_ERROR';
			return null;
		}
	}

	async send(targetId: number) {
		delete this.declined[targetId];
		const data = await this.post('send', targetId);
		if (data) this.outgoing[targetId] = data.expiresAt;
	}

	async accept(senderId: number) {
		const data = await this.post('accept', senderId);
		delete this.incoming[senderId];
		if (data) navigate('/game/normal', { useAnimation: true });
	}

	async decline(senderId: number) {
		await this.post('decline', senderId);
		delete this.incoming[senderId];
	}

	async cancel(targetId: number) {
		await this.post('cancel', targetId);
		delete this.outgoing[targetId];
	}
}

export const inviteManager = new InviteManager();
