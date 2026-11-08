<template>
	<div class="max-w-2xl space-y-6">
		<UiCard class="bg-white border-gray-300">
			<UiCardHeader>
				<UiCardTitle>הגדרות יצירת טפסים ב-AI</UiCardTitle>
				<UiCardDescription>
					הגדרות כלליות שמשפיעות על יצירת טפסים מקבצים בעזרת AI.
				</UiCardDescription>
			</UiCardHeader>
			<UiCardContent>
				<form class="space-y-6" @submit.prevent="saveSettings">
					<div class="space-y-2">
						<UiLabel for="ai-model">מודל AI</UiLabel>
						<UiSelect
							v-model="form.aiFormImportModel"
							:disabled="pending || saving"
						>
							<UiSelectTrigger id="ai-model" class="w-full bg-white">
								<UiSelectValue placeholder="בחרו מודל" />
							</UiSelectTrigger>
							<UiSelectContent>
								<UiSelectItem
									v-for="model in aiFormImportModelOptions"
									:key="model.value"
									:value="model.value"
								>
									<span dir="ltr">{{ model.label }}</span>
								</UiSelectItem>
							</UiSelectContent>
						</UiSelect>
					</div>

					<div class="space-y-2">
						<UiLabel for="ai-max-file-size">גודל קובץ מקסימלי (MB)</UiLabel>
						<UiInput
							id="ai-max-file-size"
							v-model="form.aiFormImportMaxFileSizeMb"
							type="number"
							min="1"
							max="100"
							step="1"
							:disabled="pending || saving"
						/>
					</div>

					<div
						v-if="errorMessage"
						class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
					>
						{{ errorMessage }}
					</div>

					<div class="flex items-center justify-end gap-3">
						<UiButton
							type="button"
							variant="outline"
							:disabled="pending || saving"
							@click="resetForm"
						>
							ביטול
						</UiButton>
						<UiButton type="submit" :disabled="pending || saving">
							<Icon v-if="saving" name="svg-spinners:ring-resize" class="size-4" />
							<span>שמירה</span>
						</UiButton>
					</div>
				</form>
			</UiCardContent>
		</UiCard>
		<p class="text-sm text-muted-foreground">
			תאריך ושעת בניית האפליקציה:
			<time :datetime="buildDate" dir="ltr" class="inline-block">{{ formattedBuildDate }}</time>
		</p>
	</div>
</template>

<script setup lang="ts">
	import {
		aiFormImportModelOptions,
		type AppSettings,
	} from "~~/shared/types/app-settings";

	definePageMeta({
		layout: "management-panel",
		heading: "הגדרות מערכת",
		breadcrumbs: [
			{
				label: "הגדרות מערכת",
			},
		],
		middleware: () => {
			const { user } = useUserSession();
			if (!user.value?.roles?.includes("admin")) return navigateTo("/manage/unauthorized");
		},
	});

	useHead({ title: "הגדרות מערכת - Autodox" });

	const buildDate = useRuntimeConfig().public.buildDate;
	const buildDateParts = new Intl.DateTimeFormat("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		timeZone: "Asia/Jerusalem",
	}).formatToParts(new Date(buildDate));
	const datePart = (type: Intl.DateTimeFormatPartTypes) => buildDateParts.find((part) => part.type === type)?.value;
	const formattedBuildDate = `${datePart("day")}/${datePart("month")}/${datePart("year")} ${datePart("hour")}:${datePart("minute")}:${datePart("second")}`;

	const toasts = useToasts();
	const saving = ref(false);
	const errorMessage = ref("");
	const form = reactive<AppSettings>({
		aiFormImportModel: "",
		aiFormImportMaxFileSizeMb: 10,
	});

	const { data: settings, pending } = await useFetch<AppSettings>("/api/admin/settings");

	watch(
		settings,
		(value) => {
			if (!value) return;
			form.aiFormImportModel = value.aiFormImportModel;
			form.aiFormImportMaxFileSizeMb = value.aiFormImportMaxFileSizeMb;
		},
		{ immediate: true },
	);

	function resetForm() {
		if (!settings.value) return;
		form.aiFormImportModel = settings.value.aiFormImportModel;
		form.aiFormImportMaxFileSizeMb = settings.value.aiFormImportMaxFileSizeMb;
		errorMessage.value = "";
	}

	async function saveSettings() {
		errorMessage.value = "";
		saving.value = true;

		try {
			const response = await $fetch<AppSettings>("/api/admin/settings", {
				method: "PATCH",
				body: {
					aiFormImportModel: form.aiFormImportModel,
					aiFormImportMaxFileSizeMb: Number(form.aiFormImportMaxFileSizeMb),
				},
			});

			settings.value = response;
			toasts.add({
				theme: "success",
				title: "ההגדרות נשמרו",
			});
		} catch (e: any) {
			errorMessage.value = e.data?.message || e.message || "שמירת ההגדרות נכשלה";
		} finally {
			saving.value = false;
		}
	}
</script>
