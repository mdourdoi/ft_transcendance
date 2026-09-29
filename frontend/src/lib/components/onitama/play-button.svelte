<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	let { class: className, children, ...restProps }: HTMLButtonAttributes = $props();

	const id = $props.id();

	const leftFlowers = [
		{ x: 38, y: 38, s: 1.81, r: 10 },
		{ x: 78, y: 18, s: 1.38, r: 40 },
		{ x: 104, y: 50, s: 1.59, r: -15 },
		{ x: 22, y: 92, s: 1.23, r: 25 },
		{ x: 60, y: 120, s: 1.52, r: 60 },
		{ x: 92, y: 150, s: 1.3, r: -30 },
		{ x: 138, y: 24, s: 1.01, r: 15 },
	];

	const rightFlowers = [
		{ x: 398, y: 92, s: 1.59, r: 20 },
		{ x: 420, y: 58, s: 1.09, r: -20 },
		{ x: 382, y: 140, s: 1.23, r: 45 },
	];

	const buds = [
		{ x: 70, y: 6, r: 10 },
		{ x: 150, y: 6, r: 60 },
		{ x: 8, y: 86, r: -70 },
		{ x: 112, y: 166, r: 130 },
		{ x: 232, y: 33, r: 80 },
		{ x: 432, y: 40, r: 20 },
		{ x: 372, y: 158, r: 150 },
	];

	const loosePetals = [
		{ x: 170, y: 20, r: 40, s: 0.8 },
		{ x: 140, y: 176, r: -60, s: 0.7 },
		{ x: 438, y: 138, r: 100, s: 0.75 },
		{ x: 6, y: 128, r: 200, s: 0.65 },
	];

	const splatters = [
		{ x: 14, y: 60, r: 2.5 },
		{ x: 150, y: 8, r: 2 },
		{ x: 128, y: 160, r: 2.2 },
		{ x: 430, y: 118, r: 2 },
		{ x: 360, y: 30, r: 1.6 },
		{ x: 410, y: 160, r: 1.8 },
		{ x: 180, y: 170, r: 1.4 },
		{ x: 48, y: 4, r: 1.2 },
		{ x: 118, y: 72, r: 1.5 },
		{ x: 162, y: 44, r: 1.1 },
		{ x: 30, y: 140, r: 1.6 },
		{ x: 394, y: 52, r: 1.2 },
		{ x: 420, y: 150, r: 1.3 },
		{ x: 200, y: 22, r: 1 },
	];
</script>

<button
	type="button"
	class={cn(
		"group relative aspect-[440/180] cursor-pointer select-none transition-transform duration-300 @container hover:-translate-y-1 hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale disabled:hover:translate-y-0 disabled:hover:scale-100 rounded-[50%] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
		className
	)}
	{...restProps}
>
	<svg viewBox="0 0 440 180" class="absolute inset-0 size-full overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]" aria-hidden="true">
		<defs>
			<filter id="{id}-ink" x="-10%" y="-20%" width="120%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" />
				<feDisplacementMap in="SourceGraphic" scale="7" />
			</filter>
			<filter id="{id}-dry" x="-10%" y="-20%" width="120%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="2" seed="7" result="noise" />
				<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.5" result="streaks" />
				<feComposite in="SourceGraphic" in2="streaks" operator="in" />
			</filter>
			<filter id="{id}-brush" x="-5%" y="-10%" width="110%" height="120%">
				<feTurbulence type="fractalNoise" baseFrequency="0.35 0.05" numOctaves="2" seed="3" result="noise" />
				<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.75" result="streaks" />
				<feComposite in="SourceGraphic" in2="streaks" operator="in" result="dry" />
				<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="warp" />
				<feDisplacementMap in="dry" in2="warp" scale="3" />
			</filter>
			<filter id="{id}-grain" x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" result="fine" />
				<feColorMatrix in="fine" type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 -0.9 0.5" result="fibers" />
				<feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="3" seed="11" result="coarse" />
				<feColorMatrix in="coarse" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0 0.24  0 0 0 -1.6 0.8" result="stains" />
				<feMerge result="texture">
					<feMergeNode in="stains" />
					<feMergeNode in="fibers" />
				</feMerge>
				<feComposite in="texture" in2="SourceGraphic" operator="in" />
			</filter>
			<radialGradient id="{id}-paper" cx="50%" cy="45%" r="60%">
				<stop offset="0%" stop-color="#f8eedb" />
				<stop offset="70%" stop-color="#efe0c4" />
				<stop offset="100%" stop-color="#dcc39a" />
			</radialGradient>
			<filter id="{id}-watercolor" x="-20%" y="-20%" width="140%" height="140%">
				<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="5" result="noise" />
				<feDisplacementMap in="SourceGraphic" in2="noise" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="warped" />
				<feGaussianBlur in="warped" stdDeviation="0.45" result="soft" />
				<feMorphology in="soft" operator="erode" radius="0.9" result="inner" />
				<feComposite in="soft" in2="inner" operator="out" result="edge" />
				<feColorMatrix in="edge" type="matrix" values="0.55 0 0 0 0  0 0.35 0 0 0  0 0 0.35 0 0  0 0 0 0.75 0" result="pooled" />
				<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="8" result="grainNoise" />
				<feColorMatrix in="grainNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.1" result="grainAlpha" />
				<feComposite in="soft" in2="grainAlpha" operator="in" result="granulated" />
				<feMerge>
					<feMergeNode in="granulated" />
					<feMergeNode in="pooled" />
				</feMerge>
			</filter>
			<filter id="{id}-wash" x="-50%" y="-50%" width="200%" height="200%">
				<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="12" result="noise" />
				<feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="B" result="bleed" />
				<feGaussianBlur in="bleed" stdDeviation="3.5" />
			</filter>
			<radialGradient id="{id}-petal" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="13">
				<stop offset="0%" stop-color="#fbd9d2" />
				<stop offset="30%" stop-color="#f08f84" />
				<stop offset="75%" stop-color="#df5a4e" />
				<stop offset="100%" stop-color="#c23a31" />
			</radialGradient>
			<linearGradient id="{id}-bud" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0%" stop-color="#86231e" />
				<stop offset="100%" stop-color="#e06a5e" />
			</linearGradient>
			<path id="{id}-petal-shape" d="M0 0 C -6 -2, -8 -8, -4.5 -12.5 L 0 -10.5 L 4.5 -12.5 C 8 -8, 6 -2, 0 0 Z" />
			<g id="{id}-flower">
				{#each [0, 72, 144, 216, 288] as angle (angle)}
					<use href="#{id}-petal-shape" transform="rotate({angle})" fill="url(#{id}-petal)" opacity={0.78 + (angle % 144) / 1000} />
				{/each}
				{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle (angle)}
					<g transform="rotate({angle})">
						<line x1="0" y1="0" x2="0" y2={angle % 90 === 0 ? -5.5 : -4.2} stroke="#86231e" stroke-width="0.4" opacity="0.7" />
						<circle cy={angle % 90 === 0 ? -5.5 : -4.2} r="0.75" fill="#5c1410" />
					</g>
				{/each}
				<circle r="2" fill="#a22520" opacity="0.85" />
			</g>
			<g id="{id}-bud">
				<path d="M0 0 L 0 5" stroke="#1c1611" stroke-width="1.2" stroke-linecap="round" />
				<path d="M0 0 C -3.5 -2.5, -3.5 -7, 0 -10 C 3.5 -7, 3.5 -2.5, 0 0 Z" fill="url(#{id}-bud)" />
			</g>
		</defs>

		<g filter="url(#{id}-ink)">
			<ellipse cx="245" cy="95" rx="172" ry="56" transform="rotate(-3 245 95)" fill="url(#{id}-paper)" />
			<ellipse cx="245" cy="95" rx="172" ry="56" transform="rotate(-3 245 95)" fill="#000" filter="url(#{id}-grain)" />
			<ellipse cx="245" cy="95" rx="172" ry="56" transform="rotate(-3 245 95)" fill="none" stroke="#141110" stroke-width="10" />
			<path d="M60 112 C 20 128, 8 150, 30 160 C 60 150, 70 132, 80 120" fill="#141110" />
			<path d="M20 70 C 60 40, 150 30, 230 34" fill="none" stroke="#141110" stroke-width="5" stroke-linecap="round" />
			<path d="M8 88 C 40 70, 60 50, 100 34 M60 56 C 40 30, 50 12, 70 6 M100 34 C 120 20, 130 10, 150 6 M52 120 C 70 140, 80 150, 110 164" fill="none" stroke="#1c1611" stroke-width="4" stroke-linecap="round" />
			<path d="M432 40 C 418 60, 410 76, 398 92 M404 84 C 396 110, 388 130, 372 158" fill="none" stroke="#1c1611" stroke-width="3" stroke-linecap="round" />
		</g>

		<ellipse cx="248" cy="92" rx="182" ry="63" transform="rotate(-3 248 92)" fill="none" stroke="#141110" stroke-width="4" filter="url(#{id}-dry)" opacity="0.8" />
		<path d="M190 150 C 260 162, 330 150, 400 120" fill="none" stroke="#141110" stroke-width="6" stroke-linecap="round" filter="url(#{id}-dry)" />

		{#each splatters as dot, index (index)}
			<circle cx={dot.x} cy={dot.y} r={dot.r} fill="#c23a31" opacity="0.8" />
		{/each}

		<g filter="url(#{id}-wash)" opacity="0.38">
			<ellipse cx="62" cy="52" rx="52" ry="34" fill="#e06a5e" />
			<ellipse cx="66" cy="142" rx="30" ry="18" fill="#d0463c" />
			<ellipse cx="420" cy="100" rx="18" ry="40" fill="#e06a5e" />
			<ellipse cx="150" cy="18" rx="16" ry="8" fill="#f08f84" />
		</g>

		<g filter="url(#{id}-watercolor)">
			{#each buds as bud, index (index)}
				<use href="#{id}-bud" transform="translate({bud.x} {bud.y}) rotate({bud.r})" />
			{/each}
			{#each loosePetals as petal, index (index)}
				<use href="#{id}-petal-shape" transform="translate({petal.x} {petal.y}) rotate({petal.r}) scale({petal.s})" fill="url(#{id}-petal)" opacity="0.85" />
			{/each}
		</g>

		<g class="origin-[80px_80px] transition-transform duration-500 group-hover:rotate-[-4deg] group-disabled:group-hover:rotate-0" filter="url(#{id}-watercolor)">
			{#each leftFlowers as flower, index (index)}
				<use href="#{id}-flower" transform="translate({flower.x} {flower.y}) rotate({flower.r}) scale({flower.s})" />
			{/each}
		</g>
		<g class="origin-[400px_100px] transition-transform duration-500 group-hover:rotate-[5deg] group-disabled:group-hover:rotate-0" filter="url(#{id}-watercolor)">
			{#each rightFlowers as flower, index (index)}
				<use href="#{id}-flower" transform="translate({flower.x} {flower.y}) rotate({flower.r}) scale({flower.s})" />
			{/each}
		</g>
	</svg>

	<span class="absolute top-1/2 left-[55.5%] -translate-x-1/2 -translate-y-[55%] font-brush text-[18cqw] [-webkit-text-stroke:0.04em_currentColor] leading-none text-[#141110] transition-colors duration-300 group-hover:text-primary group-disabled:group-hover:text-[#141110]" style="filter: url(#{id}-brush)">
		{@render children?.()}
	</span>
</button>
