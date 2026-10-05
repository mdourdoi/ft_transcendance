<script lang="ts" module>
	export type Game = {
		id: string;
		result: string;
		mode: string;
		opponent: string;
		opponentId?: string;
		avatar: string;
		duration: string;
		date: string;
		reason?: string;
		xpEarned?: number;
		ratingDelta?: number;
		movesCount?: number;
	};
</script>

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';

	let { game, onclose }: { game: Game; onclose: () => void } = $props();

	const modeLabels: Record<string, string> = { Ranked: 'Classées', Normal: 'Normales', Training: 'Entraînement' };
	const resultLabels: Record<string, string> = { Victory: 'Victoire', Defeat: 'Défaite' };

	const details = $derived([
		{ label: 'Mode', value: modeLabels[game.mode] ?? game.mode },
		{ label: 'Durée', value: game.duration },
		{ label: 'Fin de partie', value: game.reason ?? 'Non renseigné' },
		{ label: 'XP gagnés', value: game.xpEarned ?? '—' },
		{ label: 'Variation du classement', value: game.ratingDelta == null ? '—' : `${game.ratingDelta > 0 ? '+' : ''}${game.ratingDelta}` },
		{ label: 'Nombre de coups', value: game.movesCount ?? '—' },
	]);
</script>

<Dialog.Root open onOpenChange={(open) => { if (!open) onclose(); }}>
	<Dialog.Content class="border-4 border-double border-border sm:max-w-xl">
		<Dialog.Header class="border-b border-border pb-3">
			<span class="text-[10px] tracking-[0.3em] text-muted-foreground">ONITAMA · LE DOJO</span>
			<Dialog.Title class="font-display text-2xl">Détail de la partie</Dialog.Title>
		</Dialog.Header>

		<div class="flex items-center gap-4">
			<Avatar.Root class="size-14">
				<Avatar.Image src={game.avatar} alt="" />
				<Avatar.Fallback>{game.opponent.slice(0, 2)}</Avatar.Fallback>
			</Avatar.Root>
			<div class="min-w-0 flex-1">
				<strong class="text-lg">{game.opponent}</strong>
				<p class="text-xs text-muted-foreground">{game.date}</p>
			</div>
			<Badge variant={game.result === 'Victory' ? 'default' : 'secondary'} class="text-sm">
				{resultLabels[game.result] ?? game.result}
			</Badge>
		</div>

		<dl class="grid grid-cols-2 gap-3">
			{#each details as item (item.label)}
				<div class="rounded-md border border-border bg-muted/40 p-3">
					<dt class="text-xs text-muted-foreground">{item.label}</dt>
					<dd class="mt-1 font-medium">{item.value}</dd>
				</div>
			{/each}
		</dl>
	</Dialog.Content>
</Dialog.Root>
