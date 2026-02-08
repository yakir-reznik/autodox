<script setup lang="ts">
	import type { SaveStatus, FormStatus, FormTheme } from "~/types/form-builder";

	interface Props {
		title: string;
		description: string;
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

	// Settings modal state
	const showSettingsModal = ref(false);

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
		if (typeof navigator === "undefined") return false;
		return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	});

	const undoShortcut = computed(() => (isMac.value ? "⌘Z" : "Ctrl+Z"));
	const redoShortcut = computed(() => (isMac.value ? "⌘⇧Z" : "Ctrl+Shift+Z"));

	const localTitle = computed({
		get: () => props.title,
		set: (value) => emit("update:title", value),
	});

	const localDescription = computed({
		get: () => props.description,
		set: (value) => emit("update:description", value),
	});

	function goBack() {
		router.push("/forms");
	}

	function handleSettingsSaved(payload: { status: FormStatus; theme: FormTheme }) {
		emit("update:status", payload.status);
		emit("update:theme", payload.theme);
	}
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

			<!-- Save status, undo/redo, and actions -->
			<div class="flex items-center gap-4">
				<FormBuilderSaveIndicator :status="saveStatus" :last-saved-at="lastSavedAt" />

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

				<UiButton variant="secondary" title="הגדרות טופס" @click="showSettingsModal = true">
					<span>הגדרות טופס</span>
					<Icon name="heroicons:cog-6-tooth" class="h-4 w-4" />
				</UiButton>

				<NuxtLink
					:to="`/forms/upload?formId=${formId}`"
					title="Upload JSON to replace form structure"
				>
					<UiButton variant="secondary" size="sm">
						<span>ייבוא JSON</span>
						<Icon name="heroicons:arrow-up-tray" class="h-4 w-4" />
					</UiButton>
				</NuxtLink>

				<BaseButton
					variant="primary"
					:disabled="!isDirty && saveStatus !== 'error'"
					:loading="saveStatus === 'saving'"
					@click="$emit('save')"
				>
					שמור
				</BaseButton>
			</div>
		</div>
	</header>

	<!-- Settings Modal -->
	<FormBuilderFormSettingsModal
		v-if="formId"
		v-model="showSettingsModal"
		:form-id="formId"
		@saved="handleSettingsSaved"
	/>
</template>
