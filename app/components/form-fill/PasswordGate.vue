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
	<div class="grid min-h-screen place-items-center form-fill-container">
		<div class="form-fill-card w-full max-w-md p-8">
			<!-- Lock icon -->
			<div class="mb-6 text-center">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
					<Icon name="heroicons:lock-closed" class="h-8 w-8 text-blue-600" />
				</div>
			</div>

			<!-- Title -->
			<h1 class="form-fill-title mb-2 text-center text-xl">
				{{ formTitle }}
			</h1>
			<p class="form-fill-description mb-6 text-center">
				טופס זה מוגן בסיסמה
			</p>

			<!-- Password form -->
			<form @submit.prevent="handleSubmit" class="space-y-4">
				<div>
					<label for="password" class="mb-1 block text-sm font-medium" style="color: rgb(var(--fill-text-primary))">
						סיסמה
					</label>
					<input
						id="password"
						v-model="password"
						type="password"
						placeholder="הזן סיסמה"
						class="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
						:class="error ? 'border-red-500' : 'border-gray-300'"
						autocomplete="off"
					/>
					<p v-if="error" class="mt-1 text-sm text-red-500">
						{{ error }}
					</p>
				</div>

				<button
					type="submit"
					class="form-fill-submit w-full"
					:disabled="isVerifying"
				>
					<template v-if="isVerifying">
						<Icon name="svg-spinners:ring-resize" class="inline h-4 w-4" />
						מאמת...
					</template>
					<template v-else>
						המשך
					</template>
				</button>
			</form>
		</div>
	</div>
</template>
