<script lang="ts">
	import { onMount } from 'svelte';

	export let enabled = true;
	export let initialDelay = 0;
	export let minInterval = 10;
	export let maxInterval = 35000;
	export let burstDuration = 6000;
	export let petalsPerBurst = 28;
	export let wind = 35;
	export let opacity = 0.75;
	export let zIndex = 30;

	let canvas: HTMLCanvasElement;
	let trigger: (() => void) | undefined;
	export function launchBurst() { trigger?.(); }

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const random = (min: number, max: number) => min + Math.random() * (max - min);
		const bounded = (n: number, min: number, max: number, fallback: number) =>
		Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;

		type Petal = {
		x: number; y: number; size: number; speed: number;
		angle: number; spin: number; phase: number; age: number;
		lifetime: number; alpha: number; color: string;
		};
		let petals: Petal[] = [];
		let width = 0;
		let height = 0;
		let frame = 0;
		let previous = 0;
		let clock = 0;
		let nextBurst = bounded(initialDelay, 0, 3600000, 1000);
		let births: number[] = [];
		let disposed = false;
		const colors = ['#f2c7cf', '#e7a9b7', '#f8dde1', '#d891a3'];

		function resize() {
		width = canvas.clientWidth;
		height = canvas.clientHeight;
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
		}

		function scheduleBurst() {
		if (!enabled || motion.matches || document.hidden) return;
		const count = Math.round(bounded(petalsPerBurst, 0, 120, 28));
		const duration = bounded(burstDuration, 100, 60000, 6000);
		births = Array.from({ length: count }, (_, i) => clock + i * duration / Math.max(1, count));
		const low = bounded(minInterval, 1000, 3600000, 18000);
		const high = bounded(maxInterval, low, 3600000, Math.max(low, 35000));
		nextBurst = clock + duration + random(low, high);
		}
		trigger = scheduleBurst;

		function spawn() {
		if (petals.length >= 120) return;
		const speed = random(45, 85);
		petals.push({
			x: random(-width * 0.15, width * 1.15), y: random(-65, -20),
			size: random(8, 17), speed, angle: random(0, Math.PI * 2),
			spin: random(-1.5, 1.5), phase: random(0, Math.PI * 2), age: 0,
			lifetime: Math.min(40, (height + 160) / speed + 2),
			alpha: random(0.45, 0.9), color: colors[Math.floor(random(0, colors.length))]
		});
		}

		function draw(p: Petal, dt: number) {
		p.age += dt;
		p.phase += dt * 1.8;
		p.x += (bounded(wind, -300, 300, 35) + Math.sin(p.phase) * 28) * dt;
		p.y += (p.speed + Math.cos(p.phase * 0.8) * 12) * dt;
		p.angle += p.spin * dt;
		ctx!.save();
		ctx!.translate(p.x, p.y);
		ctx!.rotate(p.angle);
		ctx!.scale(p.size, p.size * (0.3 + Math.abs(Math.sin(p.phase)) * 0.7));
		ctx!.globalAlpha = p.alpha * bounded(opacity, 0, 1, 0.75)
			* Math.min(1, p.age / 0.7, Math.max(0, p.lifetime - p.age));
		ctx!.fillStyle = p.color;
		ctx!.strokeStyle = 'rgba(130, 65, 82, 0.23)';
		ctx!.lineWidth = 0.045;
		ctx!.beginPath();
		ctx!.moveTo(0, 0.85);
		ctx!.bezierCurveTo(-0.9, 0.18, -0.68, -0.9, -0.12, -0.65);
		ctx!.lineTo(0, -0.45);
		ctx!.lineTo(0.16, -0.7);
		ctx!.bezierCurveTo(0.85, -0.8, 0.8, 0.15, 0, 0.85);
		ctx!.fill();
		ctx!.stroke();
		ctx!.restore();
		}

		function tick(now: number) {
		if (disposed) return;
		const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
		previous = now;
		ctx!.clearRect(0, 0, width, height);
		if (enabled) {
			clock += dt * 1000;
			if (clock >= nextBurst) scheduleBurst();
			while (births.length && births[0] <= clock) { births.shift(); spawn(); }
			for (const p of petals) draw(p, dt);
			petals = petals.filter(p => p.y < height + 40 && p.age < p.lifetime);
		} else {
			petals = [];
			births = [];
			nextBurst = clock + bounded(initialDelay, 0, 3600000, 1000);
		}
		frame = requestAnimationFrame(tick);
		}

		function syncPlayback() {
		cancelAnimationFrame(frame);
		previous = 0;
		if (motion.matches) {
			petals = [];
			births = [];
			ctx!.clearRect(0, 0, width, height);
		}
		if (!document.hidden && !motion.matches && !disposed) {
			frame = requestAnimationFrame(tick);
		}
		}

		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		resize();
		document.addEventListener('visibilitychange', syncPlayback);
		motion.addEventListener('change', syncPlayback);
		syncPlayback();

		return () => {
		disposed = true;
		trigger = undefined;
		cancelAnimationFrame(frame);
		observer.disconnect();
		document.removeEventListener('visibilitychange', syncPlayback);
		motion.removeEventListener('change', syncPlayback);
		};
	});
	</script>

	<canvas bind:this={canvas} class="sakura-petals" style:z-index={zIndex} aria-hidden="true"></canvas>

	<style>
	.sakura-petals {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		user-select: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.sakura-petals { display: none; }
	}
</style>
