<template>
	<div class="relative min-h-screen grid place-items-center overflow-hidden">
		<!-- Gradient atmosphere -->
		<div
			class="absolute inset-0 bg-linear-to-br from-emerald-50 via-background to-teal-50/70 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20"
		/>

		<!-- Blur orbs -->
		<div
			class="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-300/25 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
		/>
		<div
			class="absolute bottom-1/4 right-1/4 w-56 h-56 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none"
		/>

		<!-- Confetti -->
		<div aria-hidden="true" class="absolute inset-0 overflow-hidden pointer-events-none">
			<div
				v-for="piece in confetti"
				:key="piece.id"
				class="confetti-piece absolute"
				:style="piece.style"
			/>
		</div>

		<!-- Card -->
		<div
			class="success-card relative z-10 bg-card/80 backdrop-blur-md border border-border/40 rounded-2xl shadow-2xl px-10 py-12 text-center max-w-sm mx-4 w-full"
		>
			<!-- Checkmark -->
			<div class="check-wrapper relative w-24 h-24 mx-auto mb-8">
				<div class="ripple absolute inset-0 rounded-full" />
				<div class="check-glow absolute inset-0 rounded-full" />
				<svg viewBox="0 0 52 52" class="relative z-10 w-full h-full" aria-hidden="true">
					<circle
						class="check-circle"
						cx="26"
						cy="26"
						r="23"
						fill="none"
						stroke="#10b981"
						stroke-width="1.5"
					/>
					<path
						class="check-path"
						d="M14 27l8 8 16-17"
						fill="none"
						stroke="#10b981"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>

			<h2 class="title-text text-3xl font-bold tracking-tight text-foreground mb-3">
				תודה רבה!
			</h2>
			<p class="message-text text-base text-muted-foreground leading-relaxed">
				הטופס שלך התקבל בהצלחה.
			</p>
			<p class="close-text text-sm text-muted-foreground/50 mt-6">ניתן לסגור את החלון</p>
		</div>
	</div>
</template>

<script setup lang="ts">
	const confetti = ref<Array<{ id: number; style: Record<string, string> }>>([]);

	onMounted(() => {
		const colors = [
			"#10b981",
			"#34d399",
			"#6ee7b7",
			"#f59e0b",
			"#fbbf24",
			"#fde68a",
			"#a78bfa",
			"#c4b5fd",
			"#60a5fa",
			"#93c5fd",
			"#f472b6",
			"#f9a8d4",
		];

		confetti.value = Array.from({ length: 38 }, (_, i) => ({
			id: i,
			style: {
				left: `${4 + Math.random() * 92}%`,
				top: `-${8 + Math.random() * 12}%`,
				width: `${5 + Math.random() * 7}px`,
				height: `${9 + Math.random() * 12}px`,
				backgroundColor: colors[Math.floor(Math.random() * colors.length)]!,
				borderRadius: Math.random() > 0.45 ? "50%" : `${Math.floor(Math.random() * 3)}px`,
				animationName: "confetti-fall",
				animationTimingFunction: "linear",
				animationFillMode: "both",
				animationDelay: `${(Math.random() * 3.5).toFixed(2)}s`,
				animationDuration: `${(3 + Math.random() * 4).toFixed(2)}s`,
			},
		}));
	});
</script>

<style lang="css" scoped>
	/* Card */
	.success-card {
		animation: card-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: scale(0.82) translateY(28px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Checkmark circle draws itself */
	.check-circle {
		stroke-dasharray: 166;
		stroke-dashoffset: 166;
		animation: draw 0.55s cubic-bezier(0.65, 0, 0.45, 1) 0.25s forwards;
	}

	/* Checkmark tick draws itself */
	.check-path {
		stroke-dasharray: 58;
		stroke-dashoffset: 58;
		animation: draw 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* Wrapper micro-bounce when check completes */
	.check-wrapper {
		animation: bounce-in 0.35s cubic-bezier(0.34, 1.7, 0.64, 1) 1.1s both;
	}

	@keyframes bounce-in {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.14);
		}
	}

	/* Glow pulse behind checkmark */
	.check-glow {
		background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%);
		animation: glow-pulse 2.2s ease-in-out 1.15s infinite;
	}

	@keyframes glow-pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.35);
			opacity: 0.4;
		}
	}

	/* Ripple ring from checkmark center */
	.ripple {
		border: 1.5px solid rgba(16, 185, 129, 0.6);
		animation: ripple-out 0.75s cubic-bezier(0.2, 0.6, 0.4, 1) 1.1s both;
	}

	@keyframes ripple-out {
		from {
			transform: scale(1);
			opacity: 0.7;
		}
		to {
			transform: scale(2.4);
			opacity: 0;
		}
	}

	/* Text reveals */
	.title-text {
		animation: fade-up 0.4s ease-out 0.9s both;
	}

	.message-text {
		animation: fade-up 0.4s ease-out 1.05s both;
	}

	.close-text {
		animation: fade-up 0.4s ease-out 1.25s both;
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Confetti fall */
	@keyframes confetti-fall {
		0% {
			opacity: 1;
			transform: translateY(0) rotate(0deg) scale(1);
		}
		75% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(105vh) rotate(560deg) scale(0.85);
		}
	}
</style>
