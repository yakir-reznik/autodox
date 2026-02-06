<template>
	<!-- ==================== CTA ==================== -->
	<section class="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
		<div
			class="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]"
		></div>
		<div class="dot-grid absolute inset-0 opacity-50"></div>

		<div class="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
			<div class="reveal">
				<h2 class="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
					מוכנים ליצור טפסים שעובדים?
				</h2>
				<p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
					הצטרפו לאלפי משתמשים שכבר משתמשים ב-Autodox ליצירת טפסים חכמים
					ומקצועיים
				</p>
				<div class="mt-10">
					<div class="relative inline-block">
						<div
							class="absolute -inset-1.5 rounded-2xl bg-blue-500/20 blur-lg"
						></div>
						<NuxtLink to="/signup">
							<BaseButton
								variant="primary"
								size="lg"
								class="relative !rounded-xl !px-10 !py-4 !text-lg"
							>
								<Icon name="ph:rocket-launch-fill" class="h-5 w-5" />
								צור חשבון בחינם
							</BaseButton>
						</NuxtLink>
					</div>
				</div>
				<p class="mt-4 text-sm text-slate-500">
					ללא כרטיס אשראי. ללא התחייבות.
				</p>
			</div>
		</div>
	</section>
</template>
