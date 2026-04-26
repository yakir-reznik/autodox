<template>
	<div class="relative">
		<input
			v-model="query"
			type="text"
			placeholder="חפש משתמש לשיתוף לפי שם או אימייל"
			class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			@blur="onBlur"
			@focus="open = results.length > 0"
		/>
		<div
			v-if="open"
			class="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto"
		>
			<button
				v-for="user in results"
				:key="user.id"
				type="button"
				class="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
				@mousedown.prevent="select(user)"
			>
				<span class="font-medium">{{ user.name ?? user.email }}</span>
				<span v-if="user.name" class="text-gray-500 text-xs">{{ user.email }}</span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { UserSearchResult } from "~~/app/types/form-builder";
	import { useDebounceFn } from "@vueuse/core";

	const props = defineProps<{
		excludeIds?: number[];
	}>();

	const emit = defineEmits<{
		select: [UserSearchResult];
	}>();

	const query = ref("");
	const results = ref<UserSearchResult[]>([]);
	const searching = ref(false);
	const open = ref(false);

	const search = useDebounceFn(async (q: string) => {
		if (!q.trim()) {
			results.value = [];
			open.value = false;
			return;
		}
		searching.value = true;
		try {
			const data = await $fetch<UserSearchResult[]>("/api/users/search", { query: { q } });
			results.value = data.filter((u) => !props.excludeIds?.includes(u.id));
			open.value = results.value.length > 0;
		} finally {
			searching.value = false;
		}
	}, 250);

	watch(query, search);

	function select(user: UserSearchResult) {
		emit("select", user);
		query.value = "";
		results.value = [];
		open.value = false;
	}

	function onBlur() {
		setTimeout(() => {
			open.value = false;
		}, 150);
	}
</script>
