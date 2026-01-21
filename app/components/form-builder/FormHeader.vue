<script setup lang="ts">
import type { SaveStatus, FormStatus, FormTheme } from "~/types/form-builder";
import { getThemeOptionsForSelect } from "~/composables/useThemes";

interface Props {
	title: string;
	description: string;
	status: FormStatus;
	theme: FormTheme;
	saveStatus: SaveStatus;
	lastSavedAt: Date | null;
	isDirty: boolean;
	formId?: number;
	canUndo?: boolean;
	canRedo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	canUndo: false,
	canRedo: false,
});
const router = useRouter();

const emit = defineEmits<{
	"update:title": [value: string];
	"update:description": [value: string];
	"update:status": [value: FormStatus];
	"update:theme": [value: FormTheme];
	save: [];
	undo: [];
	redo: [];
}>();

// Detect Mac for keyboard shortcut tooltips
const isMac = computed(() => {
	if (typeof navigator === 'undefined') return false;
	return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
});

const undoShortcut = computed(() => isMac.value ? '⌘Z' : 'Ctrl+Z');
const redoShortcut = computed(() => isMac.value ? '⌘⇧Z' : 'Ctrl+Shift+Z');

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

const themeOptions = getThemeOptionsForSelect();

function handleStatusChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	emit("update:status", target.value as FormStatus);
}

function handleThemeChange(event: Event) {
	const target = event.target as HTMLSelectElement;
	emit("update:theme", target.value as FormTheme);
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

			<!-- Status selector, theme selector, save status and button -->
			<div class="flex items-center gap-4">
				<div class="flex flex-col gap-1">
					<label for="status-select" class="text-xs font-medium text-gray-600">
						סטטוס
					</label>
					<select
						id="status-select"
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
				</div>

				<div class="flex flex-col gap-1">
					<label for="theme-select" class="text-xs font-medium text-gray-600">
						ערכת נושא
					</label>
					<select
						id="theme-select"
						:value="theme"
						class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						@change="handleThemeChange"
					>
						<option
							v-for="option in themeOptions"
							:key="option.value"
							:value="option.value"
						>
							{{ option.label }}
						</option>
					</select>
				</div>

				<FormBuilderSaveIndicator
					:status="saveStatus"
					:last-saved-at="lastSavedAt"
				/>

				<!-- Undo/Redo buttons -->
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
						:disabled="!canUndo"
						:title="`בטל (${undoShortcut})`"
						@click="$emit('undo')"
					>
						<Icon name="heroicons:arrow-uturn-right" class="h-5 w-5" />
					</button>
					<button
						type="button"
						class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
						:disabled="!canRedo"
						:title="`בצע שוב (${redoShortcut})`"
						@click="$emit('redo')"
					>
						<Icon name="heroicons:arrow-uturn-left" class="h-5 w-5" />
					</button>
				</div>

				<div class="h-6 w-px bg-gray-300" />

				<NuxtLink
					:to="`/forms/upload?formId=${formId}`"
					title="Upload JSON to replace form structure"
				>
					<UiButton variant="secondary" size="sm">
						<Icon name="heroicons:arrow-up-tray" class="h-4 w-4" />
						Import JSON
					</UiButton>
				</NuxtLink>

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
