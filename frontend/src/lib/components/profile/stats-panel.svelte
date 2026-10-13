<script lang="ts">
  import { BarChart, LineChart, PieChart } from "layerchart";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Card from "$lib/components/ui/card";
  import * as Chart from "$lib/components/ui/chart";
  import { InkQuote } from "$lib/components/onitama";
  import { cn } from "$lib/utils";
  import { t, locale } from "$lib/i18n";
  import { StatManager } from "$lib/stores/stat.svelte";
  import { onMount } from "svelte";
  import { SvelteDate, SvelteMap } from "svelte/reactivity";

  let {
    playerId,
    currentRating,
  }: { playerId?: number; currentRating?: number | null } = $props();
  const statManager = $derived(new StatManager(playerId));

  onMount(() => {
    statManager.getstat();
  });

  const summary = $derived([
    {
      label: $t("STATS.SUMMARY.GAMES"),
      value: statManager.matches.length,
      icon: "⚔",
    },
    {
      label: $t("STATS.SUMMARY.WINS"),
      value: statManager.wins,
      icon: "♛",
      highlight: true,
    },
    {
      label: $t("STATS.SUMMARY.LOSSES"),
      value: statManager.matches.length - statManager.wins,
      icon: "☠",
    },
    {
      label: $t("STATS.SUMMARY.WINRATE"),
      value: `${
        statManager.matches.length
          ? Math.round((statManager.wins * 100) / statManager.matches.length)
          : 0
      }%`,
      icon: "★",
    },
  ]);

  const modesConfig = $derived({
    ranked: { label: $t("STATS.MODES.RANKED"), color: "var(--chart-1)" },
    normal: { label: $t("STATS.MODES.NORMAL"), color: "var(--chart-2)" },
    challenge: { label: $t("STATS.MODES.CHALLENGE"), color: "var(--chart-3)" },
  } satisfies Chart.ChartConfig);

  const statsModes = $derived([
    {
      mode: "ranked",
      value: statManager.matches.length
        ? Math.round((statManager.ranked * 100) / statManager.matches.length)
        : 0,
      color: "var(--color-ranked)",
    },
    {
      mode: "normal",
      value: statManager.matches.length
        ? Math.round((statManager.normal * 100) / statManager.matches.length)
        : 0,
      color: "var(--color-normal)",
    },
    {
      mode: "challenge",
      value: statManager.matches.length
        ? Math.round((statManager.defis * 100) / statManager.matches.length)
        : 0,
      color: "var(--color-challenge)",
    },
  ] as const);

  const rankConfig = $derived({
    elo: { label: $t("STATS.ELO"), color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig);

  const monthFormat = $derived(
    new Intl.DateTimeFormat($locale ?? undefined, { month: "short" }),
  );
  const eloProgress = $derived.by(() => {
    if (currentRating == null) return [];

    const rankedMatches = statManager.matches
      .filter(
        (
          match,
        ): match is typeof match & { ratingDelta: number; finishedAt: string } =>
          match.mode === "RANKED" &&
          typeof match.ratingDelta === "number" &&
          !!match.finishedAt,
      )
      .toSorted(
        (a, b) =>
          new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime(),
      );
    const initialRating =
      currentRating -
      rankedMatches.reduce(
        (total, match) =>
          total + (match.won ? match.ratingDelta : -match.ratingDelta),
        0,
      );
    let elo = initialRating;
    const months = new SvelteMap<
      string,
      { month: Date; delta: number; elo: number }
    >();

    for (const match of rankedMatches) {
      const date = new Date(match.finishedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const delta = match.won ? match.ratingDelta : -match.ratingDelta;
      elo += delta;
      const entry = months.get(key) ?? { month: date, delta: 0, elo };
      entry.delta += delta;
      entry.elo = elo;
      months.set(key, entry);
    }

    return [...months.values()].map(({ month, delta, elo: monthElo }) => ({
      month: monthFormat.format(month),
      elo: monthElo,
      delta,
    }));
  });
  const eloRange = $derived.by(() => {
    const values = [
      currentRating ?? 0,
      ...eloProgress.map((point) => point.elo),
    ];
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? [min - 1, max + 1] : [min, max];
  });

  const dayConfig = $derived({
    value: { label: $t("STATS.PERFORMANCE"), color: "var(--chart-2)" },
    peak: { label: $t("STATS.PEAK"), color: "var(--chart-1)" },
  } satisfies Chart.ChartConfig);

  const dayFormat = $derived(
    new Intl.DateTimeFormat($locale ?? undefined, {
      weekday: "short",
      day: "numeric",
    }),
  );
  const dailyStats = $derived.by(() => {
    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new SvelteDate(today);
      date.setDate(today.getDate() - (6 - index));
      return { date, wins: 0, games: 0 };
    });

    for (const match of statManager.matches) {
      const finishedAt = match.finishedAt ?? match.createdAt;
      if (!finishedAt) continue;
      const matchDate = new SvelteDate(finishedAt);
      matchDate.setHours(0, 0, 0, 0);
      const day = days.find(
        (entry) => entry.date.getTime() === matchDate.getTime(),
      );
      if (!day) continue;
      day.games += 1;
      if (match.won) day.wins += 1;
    }

    const values = days.map((day) =>
      day.games ? Math.round((day.wins * 100) / day.games) : 0,
    );
    const peak = Math.max(...values);

    return days.map((day, index) => ({
      label: dayFormat.format(day.date),
      value: values[index],
      color:
        day.games > 0 && values[index] === peak
          ? "var(--color-peak)"
          : "var(--color-value)",
    }));
  });

  const rankings = $derived([
    {
      title: $t("STATS.MOST_PLAYED_CARDS"),
      rows: statManager.mostPlayedCards.map(({ card, ...row }) => ({
        ...row,
        name: $t(`CARDS.${card}`),
      })),
    },
    {
      title: $t("STATS.FREQUENT_OPPONENTS"),
      rows: statManager.frequentOpponents,
    },
  ]);
</script>

<section class="grid grid-cols-4 gap-4">
  {#each summary as item (item.label)}
    <Card.Root size="sm" class="bg-card/80 backdrop-blur-sm">
      <Card.Content class="flex flex-col gap-1">
        <div
          class={cn(
            "flex items-center gap-3 font-display text-3xl font-bold",
            item.highlight && "text-primary",
          )}
        >
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
      <Card.Title class="font-display text-lg">{$t("STATS.BY_MODE")}</Card.Title
      >
    </Card.Header>
    <Card.Content
      class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
    >
      <Chart.Container config={modesConfig} class="aspect-square max-h-[200px]">
        <PieChart
          data={statsModes}
          key="mode"
          value="value"
          c="color"
          innerRadius={0.6}
          padAngle={0.02}
          cornerRadius={3}
        >
          {#snippet tooltip()}
            <Chart.Tooltip hideLabel />
          {/snippet}
        </PieChart>
      </Chart.Container>
      <ul class="flex flex-col gap-2">
        {#each statsModes as mode (mode.mode)}
          <li class="flex items-center gap-2 text-sm">
            <span
              class="size-2.5 rounded-[2px]"
              style={`background:${modesConfig[mode.mode].color}`}
            ></span>
            <span class="text-muted-foreground"
              >{modesConfig[mode.mode].label}</span
            >
            <strong class="ml-auto pl-3">{mode.value}%</strong>
          </li>
        {/each}
      </ul>
    </Card.Content>
  </Card.Root>

  <Card.Root class="bg-card/80 backdrop-blur-sm">
    <Card.Header>
      <Card.Title class="font-display text-lg"
        >{$t("STATS.RANK_PROGRESS")}</Card.Title
      >
    </Card.Header>
    <Card.Content>
      <Chart.Container config={rankConfig} class="aspect-auto h-[200px] w-full">
        <LineChart
          data={eloProgress}
          x="month"
          y="elo"
          yDomain={eloRange}
          padding={{ left: 64, bottom: 24, top: 8, right: 16 }}
          series={[
            { key: "elo", label: $t("STATS.ELO"), color: rankConfig.elo.color },
          ]}
          points={{ r: 4 }}
          props={{
            spline: { strokeWidth: 2 },
            yAxis: { format: (value: number) => `${Math.round(value)}` },
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
          <div
            class="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-accent/60"
          >
            <span class="w-4 font-display font-bold text-primary"
              >{row.rank}</span
            >
            <Avatar.Root class="size-8 rounded-md after:rounded-md">
              <Avatar.Image src={row.image} alt={row.name} class="rounded-md" />
              <Avatar.Fallback>{row.name.slice(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
            <span class="flex-1 truncate">{row.name}</span>
            <span class="text-xs text-muted-foreground"
              >{$t("STATS.GAMES_COUNT", { values: { count: row.games } })}</span
            >
          </div>
        {/each}
      </Card.Content>
    </Card.Root>
  {/each}

  <div class="flex flex-col gap-4">
    <Card.Root class="bg-card/80 backdrop-blur-sm">
      <Card.Header>
        <Card.Title class="font-display text-lg"
          >{$t("STATS.DAILY")}</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <Chart.Container
          config={dayConfig}
          class="aspect-auto h-[160px] w-full"
        >
          <BarChart
            data={dailyStats}
            x="label"
            y="value"
            c="color"
            cRange={["var(--color-value)", "var(--color-peak)"]}
            yDomain={[0, 100]}
            bandPadding={0.3}
            padding={{ left: 32, bottom: 20, top: 4 }}
            props={{
              bars: { stroke: "none", rounded: "top", radius: 3 },
              yAxis: {
                ticks: [0, 25, 75, 100],
                format: (value: number) => `${value}%`,
              },
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
