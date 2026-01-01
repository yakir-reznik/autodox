<script setup lang="ts">
import type { SaveStatus, FormStatus } from "~/types/form-builder";

interface Props {
	title: string;
	description: string;
	status: FormStatus;
	saveStatus: SaveStatus;
	lastSavedAt: Date | null;
	isDirty: boolean;
}

const props = defineProps<Props>();
const router = useRouter();

const emit = defineEmits<{
	"update:title": [value: string];
	"update:description": [value: string];
	"update:status": [value: FormStatus];
	save: [];
}>();

const localTitle = computed({
	get: () => props.title,
	set: (value) => emit("update:title", value),
});

const localDescription = computed({
	get: () => props.description,
	set: (value) => emit("update:description", value),
});

const statusOptions: { value: FormStatus; label: string }[] = [
	{ value: "draft", label: "טיוטה" },
	{ value: "published", label: "פורסם" },
	{ value: "archived", label: "בארכיון" },
];

function handleStatusChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	emit("update:status", target.value as FormStatus);
}

function goBack() {
	router.push("/forms");
}

// Debug
watchEffect(() => {
	console.log("FormHeader - isDirty:", props.isDirty, "saveStatus:", props.saveStatus);
});
</script>

<template>
	<header class="border-b border-gray-200 bg-white px-6 py-4">
		<div class="flex items-start justify-between gap-4">
			<!-- Back button and title/description -->
			<div class="flex items-start gap-4">
				<button
					type="button"
					class="mt-1 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					title="חזרה לרשימת הטפסים"
					@click="goBack"
				>
					<Icon name="heroicons:arrow-right" class="h-5 w-5" />
				</button>

				<div class="flex-1 space-y-2">
					<input
						v-model="localTitle"
						type="text"
						placeholder="שם הטופס"
						class="w-full border-0 bg-transparent text-xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
					/>
					<input
						v-model="localDescription"
						type="text"
						placeholder="הוסף תיאור..."
						class="w-full border-0 bg-transparent text-sm text-gray-500 placeholder-gray-400 focus:outline-none focus:ring-0"
					/>
				</div>
			</div>

			<!-- Status selector, save status and button -->
			<div class="flex items-center gap-4">
				<select
					:value="status"
					class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					@change="handleStatusChange"
				>
					<option
						v-for="option in statusOptions"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</select>

				<FormBuilderSaveIndicator
					:status="saveStatus"
					:last-saved-at="lastSavedAt"
				/>

				<UiButton
					variant="primary"
					:disabled="!isDirty && saveStatus !== 'error'"
					:loading="saveStatus === 'saving'"
					@click="$emit('save')"
				>
					שמור
				</UiButton>
			</div>
		</div>
	</header>
</template>
