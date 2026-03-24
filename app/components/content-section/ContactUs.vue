<script setup lang="ts">
	const toasts = useToasts();

	const form = reactive({
		name: "",
		email: "",
		message: "",
	});

	const submitted = ref(false);

	function handleSubmit() {
		if (!form.name || !form.email || !form.message) return;
		submitted.value = true;
		toasts.add({
			title: "ההודעה נשלחה בהצלחה!",
			subtitle: "נחזור אליך בהקדם.",
			theme: "notice",
		});
		form.name = "";
		form.email = "";
		form.message = "";
		setTimeout(() => (submitted.value = false), 3000);
	}
</script>

<template>
	<section id="contact" class="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
		<div class="dot-grid absolute inset-0 opacity-50"></div>
		<div
			class="pointer-events-none absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]"
		></div>

		<div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
				<!-- Right column: info (RTL, so this appears on the right) -->
				<div class="flex flex-col gap-6">
					<h2 class="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
						צור קשר
					</h2>
					<p class="max-w-md text-lg leading-relaxed text-slate-400">
						שאלות? הצעות? נשמח לשמוע ממך.
					</p>
					<div class="flex items-center gap-3 text-slate-400">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
							<Icon name="ph:envelope-fill" class="h-5 w-5 text-blue-500" />
						</div>
						<span class="text-sm">contact@autodox.co.il</span>
					</div>
				</div>

				<!-- Left column: form -->
				<form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
					<div>
						<label class="mb-1.5 block text-sm font-medium text-slate-300">שם</label>
						<input
							v-model="form.name"
							type="text"
							required
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							placeholder="השם שלך"
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-sm font-medium text-slate-300">אימייל</label>
						<input
							v-model="form.email"
							type="email"
							required
							class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							placeholder="your@email.com"
							dir="ltr"
						/>
					</div>
					<div>
						<label class="mb-1.5 block text-sm font-medium text-slate-300">הודעה</label>
						<textarea
							v-model="form.message"
							required
							rows="4"
							class="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
							placeholder="איך נוכל לעזור?"
						></textarea>
					</div>
					<BaseButton
						type="submit"
						variant="primary"
						size="lg"
						class="w-full rounded-xl!"
					>
						<Icon name="ph:paper-plane-tilt-fill" class="h-5 w-5" />
						שלח הודעה
					</BaseButton>
				</form>
			</div>
		</div>
	</section>
</template>
