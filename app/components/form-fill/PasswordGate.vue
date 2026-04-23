<script setup lang="ts">
	interface Props {
		formId: number;
		formTitle: string;
		token?: string | null;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		verified: [];
	}>();

	const password = ref("");
	const error = ref<string | null>(null);
	const isVerifying = ref(false);

	async function handleSubmit() {
		if (!password.value.trim()) {
			error.value = "יש להזין סיסמה";
			return;
		}

		isVerifying.value = true;
		error.value = null;

		try {
			await $fetch(`/api/forms/${props.formId}/verify-password`, {
				method: "POST",
				body: {
					password: password.value,
					...(props.token && { token: props.token }),
				},
			});

			emit("verified");
		} catch (e: any) {
			if (e.data?.statusCode === 401) {
				error.value = "סיסמה שגויה";
			} else if (e.data?.statusCode === 410) {
				error.value = "קישור השליחה פג תוקף";
			} else {
				error.value = e.data?.message || "שגיאה באימות הסיסמה";
			}
		} finally {
			isVerifying.value = false;
		}
	}
</script>

<template>
	<div
		class="grid min-h-screen place-items-center form-fill-container min-h-screen bg-background font-sans p-6"
	>
		<div class="form-fill-card max-w-md w-full mx-auto bg-card rounded-lg shadow-md p-8">
			<!-- Lock icon -->
			<div class="mb-6 text-center">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
				>
					<Icon name="heroicons:lock-closed" class="h-8 w-8 text-primary" />
				</div>
			</div>

			<!-- Title -->
			<h1 class="form-fill-title text-xl font-semibold text-foreground mb-2 text-center">
				{{ formTitle }}
			</h1>
			<p class="form-fill-description text-base text-muted-foreground mb-6 text-center">
				טופס זה מוגן בסיסמה
			</p>

			<!-- Password form -->
			<form @submit.prevent="handleSubmit" class="space-y-4">
				<div>
					<label
						for="password"
						class="form-fill-label block text-sm font-medium text-foreground mb-1"
					>
						סיסמה
					</label>
					<input
						id="password"
						v-model="password"
						type="password"
						placeholder="הזן סיסמה"
						class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground/50"
						:class="{ 'border-destructive': error }"
						autocomplete="off"
					/>
					<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">
						{{ error }}
					</p>
				</div>

				<button
					type="submit"
					class="form-fill-submit w-full bg-primary text-primary-foreground text-base font-medium py-2 px-6 rounded-md border-none cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					:disabled="isVerifying"
				>
					<template v-if="isVerifying">
						<Icon name="svg-spinners:ring-resize" class="inline h-4 w-4" />
						מאמת...
					</template>
					<template v-else> המשך </template>
				</button>
			</form>
		</div>
	</div>
</template>
