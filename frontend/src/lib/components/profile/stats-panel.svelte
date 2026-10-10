<script lang="ts">
	import { BarChart, LineChart, PieChart } from "layerchart";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as Card from "$lib/components/ui/card";
	import * as Chart from "$lib/components/ui/chart";
	import * as NativeSelect from "$lib/components/ui/native-select";
	import { InkQuote, PageShell } from "$lib/components/onitama";
	import { cn } from "$lib/utils";
	import { t, locale } from "$lib/i18n";
	import { statManager } from "$lib/stores/stat.svelte";
	import { onMount } from "svelte";
	onMount(() => {
		statManager.getstat();
	});


	const summary = $derived([
		{ label: $t("STATS.SUMMARY.GAMES"), value: statManager.matches.length, icon: "⚔" },
		{ label: $t("STATS.SUMMARY.WINS"), value: statManager.wins, icon: "♛", highlight: true },
		{ label: $t("STATS.SUMMARY.LOSSES"), value: (statManager.matches.length - statManager.wins), icon: "☠" },
		{ label: $t("STATS.SUMMARY.WINRATE"), value: `${statManager.matches.length
			? Math.round((statManager.wins * 100) / statManager.matches.length)
			: 0}%`, icon: "★" },
		]);

	const modesConfig = $derived({
		ranked: { label: $t("STATS.MODES.RANKED"), color: "var(--chart-1)" },
		normal: { label: $t("STATS.MODES.NORMAL"), color: "var(--chart-2)" },
		challenge: { label: $t("STATS.MODES.CHALLENGE"), color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig);

	const statsModes = $derived([
		{ mode: "ranked", value: statManager.matches.length
			? Math.round((statManager.ranked * 100) / statManager.matches.length)
			: 0, color: "var(--color-ranked)" },
		{ mode: "normal", value: statManager.matches.length
			? Math.round((statManager.normal * 100) / statManager.matches.length)
			: 0, color: "var(--color-normal)" },
		{ mode: "challenge", value: statManager.matches.length
			? Math.round((statManager.defis * 100) / statManager.matches.length)
			: 0, color: "var(--color-challenge)" },
	] as const);

	const ranks = $derived(["NOVICE", "DISCIPLE", "ADEPT", "EXPERT", "MASTER"].map((rank) => $t(`STATS.RANKS.${rank}`)));

	const rankConfig = $derived({
		rank: { label: $t("STATS.RANK"), color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig);

	const monthFormat = $derived(new Intl.DateTimeFormat($locale ?? undefined, { month: "short" }));
	const rankProgress = $derived(
		[0.6, 1.2, 1.8, 2.3, 2.3, 3.4].map((rank, month) => ({ month: monthFormat.format(new Date(2026, month, 1)), rank }))
	);

	const hourConfig = $derived({
		value: { label: $t("STATS.PERFORMANCE"), color: "var(--chart-2)" },
		peak: { label: $t("STATS.PEAK"), color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig);

	const hourlyStats = [
		{ label: "0h", value: 6 },
		{ label: "4h", value: 12 },
		{ label: "6h", value: 17 },
		{ label: "8h", value: 23 },
		{ label: "10h", value: 28 },
		{ label: "12h", value: 42 },
		{ label: "14h", value: 78 },
		{ label: "16h", value: 88 },
		{ label: "18h", value: 51 },
		{ label: "20h", value: 36 },
		{ label: "22h", value: 24 },
	].map((hour, index) => ({ ...hour, color: index === 6 || index === 7 ? "var(--color-peak)" : "var(--color-value)" }));


	const rankings = $derived([
	{
		title: $t("STATS.MOST_PLAYED_CARDS"),
		rows: statManager.mostPlayedCards.map(({ card, ...row }) => ({ ...row, name: $t(`CARDS.${card}`) })),
	},
	{ title: $t("STATS.FREQUENT_OPPONENTS"), rows: statManager.frequentOpponents },
]);
</script>

<PageShell title={$t("STATS.TITLE")} subtitle={$t("STATS.SUBTITLE")}>
	{#snippet sidebar()}
		<div class="min-h-0 flex-1 rounded-xl bg-[url(/assets/home/background/samourai3.png)] bg-cover bg-top"></div>
	{/snippet}

	<section class="grid grid-cols-4 gap-4">
		{#each summary as item (item.label)}
			<Card.Root size="sm" class="bg-card/80 backdrop-blur-sm">
				<Card.Content class="flex flex-col gap-1">
					<div class={cn("flex items-center gap-3 font-display text-3xl font-bold", item.highlight && "text-primary")}>
						<span class="text-2xl text-muted-foreground">{item.icon}</span>
						{item.value}
					</div>
					<span class="text-sm text-muted-foreground">{item.label}</span>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
		<Card.Root class="bg-card/80 backdrop-blur-sm">
			<Card.Header>
				<Card.Title class="font-display text-lg">{$t("STATS.BY_MODE")}</Card.Title>
			</Card.Header>
			<Card.Content class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
				<Chart.Container config={modesConfig} class="aspect-square max-h-[200px]">
					<PieChart data={statsModes} key="mode" value="value" c="color" innerRadius={0.6} padAngle={0.02} cornerRadius={3}>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>
				<ul class="flex flex-col gap-2">
					{#each statsModes as mode (mode.mode)}
						<li class="flex items-center gap-2 text-sm">
							<span class="size-2.5 rounded-[2px]" style={`background:${modesConfig[mode.mode].color}`}></span>
							<span class="text-muted-foreground">{modesConfig[mode.mode].label}</span>
							<strong class="ml-auto pl-3">{mode.value}%</strong>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>

		<Card.Root class="bg-card/80 backdrop-blur-sm">
			<Card.Header>
				<Card.Title class="font-display text-lg">{$t("STATS.RANK_PROGRESS")}</Card.Title>
				<Card.Action>
					<NativeSelect.Root size="sm">
						<NativeSelect.Option>{$t("STATS.LAST_6_MONTHS")}</NativeSelect.Option>
					</NativeSelect.Root>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={rankConfig} class="aspect-auto h-[200px] w-full">
					<LineChart
						data={rankProgress}
						x="month"
						y="rank"
						yDomain={[0, 4]}
						padding={{ left: 64, bottom: 24, top: 8, right: 16 }}
						series={[{ key: "rank", label: $t("STATS.RANK"), color: rankConfig.rank.color }]}
						points={{ r: 4 }}
						props={{
							spline: { strokeWidth: 2 },
							yAxis: { ticks: [0, 1, 2, 3, 4], format: (value: number) => ranks[Math.round(value)] ?? "" },
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip indicator="line" />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</section>

	<section class="grid grid-cols-3 gap-4">
		{#each rankings as ranking (ranking.title)}
			<Card.Root class="bg-card/80 backdrop-blur-sm">
				<Card.Header>
					<Card.Title class="font-display text-lg">{ranking.title}</Card.Title>
				</Card.Header>
				<Card.Content class="flex flex-col gap-1">
					{#each ranking.rows as row (row.rank)}
						<div class="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-accent/60">
							<span class="w-4 font-display font-bold text-primary">{row.rank}</span>
							<Avatar.Root class="size-8 rounded-md after:rounded-md">
								<Avatar.Image src={row.image} alt={row.name} class="rounded-md" />
								<Avatar.Fallback>{row.name.slice(0, 2)}</Avatar.Fallback>
							</Avatar.Root>
							<span class="flex-1 truncate">{row.name}</span>
							<span class="text-xs text-muted-foreground">{$t("STATS.GAMES_COUNT", { values: { count: row.games } })}</span>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}

		<div class="flex flex-col gap-4">
			<Card.Root class="bg-card/80 backdrop-blur-sm">
				<Card.Header>
					<Card.Title class="font-display text-lg">{$t("STATS.HOURLY")}</Card.Title>
				</Card.Header>
				<Card.Content>
					<Chart.Container config={hourConfig} class="aspect-auto h-[160px] w-full">
						<BarChart
							data={hourlyStats}
							x="label"
							y="value"
							c="color"
							cRange={["var(--color-value)", "var(--color-peak)"]}
							yDomain={[0, 100]}
							bandPadding={0.3}
							padding={{ left: 32, bottom: 20, top: 4 }}
							props={{
								bars: { stroke: "none", rounded: "top", radius: 3 },
								yAxis: { ticks: [0, 25, 75, 100], format: (value: number) => `${value}%` },
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip hideIndicator />
							{/snippet}
						</BarChart>
					</Chart.Container>
				</Card.Content>
			</Card.Root>
			<InkQuote quote={$t("STATS.QUOTE")} stamp />
		</div>
	</section>
</PageShell>
