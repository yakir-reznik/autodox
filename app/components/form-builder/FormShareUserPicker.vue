<template>
	<form class="flex flex-col gap-2" @submit.prevent="addEmail">
		<label for="share-email" class="text-sm font-medium text-gray-700">כתובת אימייל</label>
		<div class="flex gap-2">
			<input
				id="share-email"
				v-model="email"
				type="email"
				dir="ltr"
				placeholder="user@example.com"
				class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<BaseButton type="submit" size="sm" :loading="props.loading">
				<Icon name="heroicons:plus" class="h-4 w-4" />
				<span>הוסף</span>
			</BaseButton>
		</div>
		<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
	</form>
</template>

<script setup lang="ts">
	const props = defineProps<{
		loading?: boolean;
	}>();

	const emit = defineEmits<{
		add: [email: string];
	}>();

	const email = ref("");
	const error = ref<string | null>(null);
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function addEmail() {
		const normalizedEmail = email.value.trim().toLowerCase();
		if (!emailPattern.test(normalizedEmail)) {
			error.value = "יש להזין כתובת אימייל תקינה";
			return;
		}

		error.value = null;
		emit("add", normalizedEmail);
		email.value = "";
	}
</script>
