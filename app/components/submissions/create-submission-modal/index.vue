<script setup lang="ts">
	import type { ElementType, ElementConfig } from "~/types/form-builder";

	type FormElement = {
		id: number;
		type: ElementType;
		name: string | null;
		config: ElementConfig;
		parentId: number | null;
	};

	type Props = {
		modelValue: boolean;
		formId: number;
		apiKey: string;
	};

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: boolean];
		created: [];
	}>();

	const toasts = useToasts();

	const isOpen = computed({
		get: () => props.modelValue,
		set: (value) => emit("update:modelValue", value),
	});

	const isLoading = ref(true);
	const isSubmitting = ref(false);
	const error = ref<string | null>(null);
	const createdLink = ref<string | null>(null);

	const submissionName = ref("");
	const externalId = ref("");

	const fields = ref<FormElement[]>([]);
	const prefillData = reactive<Record<string, any>>({});

	const additionalDataRows = reactive<{ key: string; value: string }[]>([]);

	const overridePassword = ref(false);
	const passwordValue = ref("");
	const overrideWebhookUrl = ref(false);
	const webhookUrlValue = ref("");
	const overrideWebhookPdf = ref(false);
	const webhookPdfValue = ref(false);

	const formDefaults = ref<{
		password: string | null;
		webhookUrl: string | null;
		webhookIncludePdf: boolean;
	}>({ password: null, webhookUrl: null, webhookIncludePdf: false });

	const prefillableTypes: ElementType[] = [
		"text",
		"email",
		"number",
		"phone",
		"textarea",
		"date",
		"time",
		"datetime",
		"dropdown",
		"radio",
		"checkbox",
		"checkboxes",
	];

	watch(
		() => props.modelValue,
		async (open) => {
			if (open) {
				await fetchFormData();
			} else {
				resetState();
			}
		},
	);

	function resetState() {
		submissionName.value = "";
		externalId.value = "";
		Object.keys(prefillData).forEach((k) => delete prefillData[k]);
		additionalDataRows.splice(0);
		overridePassword.value = false;
		passwordValue.value = "";
		overrideWebhookUrl.value = false;
		webhookUrlValue.value = "";
		overrideWebhookPdf.value = false;
		webhookPdfValue.value = false;
		createdLink.value = null;
		error.value = null;
	}

	async function fetchFormData() {
		isLoading.value = true;
		error.value = null;

		try {
			const [formResponse, settingsResponse] = await Promise.all([
				$fetch<{ id: number; elements: FormElement[] }>(`/api/forms/${props.formId}`),
				$fetch<{
					password: string | null;
					webhookUrl: string | null;
					webhookIncludePdf: boolean;
				}>(`/api/forms/${props.formId}/settings`),
			]);

			fields.value = formResponse.elements.filter(
				(el) => el.name && !el.parentId && prefillableTypes.includes(el.type),
			);

			for (const field of fields.value) {
				const dv = (field.config as any)?.defaultValue;
				if (field.type === "checkboxes") {
					prefillData[field.name!] = dv
						? (() => {
								try {
									return JSON.parse(dv);
								} catch {
									return [];
								}
							})()
						: [];
				} else if (field.type === "checkbox") {
					if (dv === true) prefillData[field.name!] = true;
				} else if (["date", "datetime", "time"].includes(field.type) && dv) {
					const resolved = resolveDateTimeDefault(
						dv,
						field.type as "date" | "datetime" | "time",
					);
					if (resolved) prefillData[field.name!] = resolved;
				} else if (field.type === "number" && dv) {
					prefillData[field.name!] = Number(dv);
				} else if (dv) {
					prefillData[field.name!] = dv;
				}
			}

			formDefaults.value = {
				password: settingsResponse.password,
				webhookUrl: settingsResponse.webhookUrl,
				webhookIncludePdf: settingsResponse.webhookIncludePdf ?? false,
			};
		} catch (e: any) {
			error.value = e.data?.message || "שגיאה בטעינת נתוני הטופס";
		} finally {
			isLoading.value = false;
		}
	}

	async function submit() {
		isSubmitting.value = true;
		error.value = null;

		try {
			const filteredPrefill: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(prefillData)) {
				if (value !== "" && value !== undefined && value !== null) {
					filteredPrefill[key] = value;
				}
			}

			const body: Record<string, unknown> = {};
			if (submissionName.value.trim()) body.name = submissionName.value.trim();
			if (externalId.value.trim()) body.externalId = externalId.value.trim();
			if (Object.keys(filteredPrefill).length > 0) body.prefill = filteredPrefill;
			if (overridePassword.value) body.password = passwordValue.value;
			if (overrideWebhookUrl.value) body.webhook_url = webhookUrlValue.value;
			if (overrideWebhookPdf.value) body.webhook_include_pdf = webhookPdfValue.value;

			const filledRows = additionalDataRows.filter((r) => r.key.trim());
			if (filledRows.length > 0) {
				body.additionalData = Object.fromEntries(
					filledRows.map((r) => [r.key.trim(), r.value]),
				);
			}

			const response = await $fetch<{ link: string }>(
				`/api/forms/${props.formId}/create-submission-link`,
				{ method: "POST", headers: { "x-api-key": props.apiKey }, body },
			);

			createdLink.value = response.link;
			emit("created");
		} catch (e: any) {
			error.value = e.data?.message || "שגיאה ביצירת ההגשה";
		} finally {
			isSubmitting.value = false;
		}
	}

	function close() {
		isOpen.value = false;
	}
</script>

<template>
	<UiDialog :open="isOpen" @update:open="isOpen = $event">
		<UiDialogContent>
			<UiDialogHeader>
				<div class="px-8 pt-8">
					<UiDialogTitle>יצירת הגשה חדשה</UiDialogTitle>
				</div>
			</UiDialogHeader>

			<!-- Success state -->
			<SubmissionsCreateSubmissionModalSuccessView
				v-if="createdLink"
				:link="createdLink"
				:form-id="formId"
				@close="close"
			/>

			<!-- Loading -->
			<div v-else-if="isLoading" class="flex items-center justify-center py-8">
				<Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-gray-400" />
			</div>

			<!-- Error on load -->
			<div v-else-if="error && !fields.length" class="py-4 text-center text-red-500">
				{{ error }}
			</div>

			<!-- Form -->
			<div v-else class="max-h-[60vh] overflow-y-auto space-y-3 px-8 pb-4">
				<div class="space-y-1">
					<label class="block text-sm font-medium text-gray-700">שם ההגשה</label>
					<UiInput
						v-model="submissionName"
						type="text"
						placeholder="לדוגמה: לקוח א׳ - מרץ 2025"
					/>
					<p class="text-xs text-gray-400">
						לשימוש פנימי בלבד — הממלא הטופס לא יראה את השם הזה
					</p>
				</div>

				<div class="space-y-1">
					<label class="block text-sm font-medium text-gray-700">מזהה חיצוני</label>
					<UiInput
						v-model="externalId"
						type="text"
						dir="ltr"
						placeholder="לדוגמה: CRM-1234"
					/>
					<p class="text-xs text-gray-400">מזהה ממערכת חיצונית — לשימוש פנימי בלבד</p>
				</div>

				<UiSeparator class="my-8" />

				<SubmissionsCreateSubmissionModalPrefillSection
					v-if="fields.length"
					:fields="fields"
					:prefill-data="prefillData"
				/>

				<SubmissionsCreateSubmissionModalAdditionalDataSection :rows="additionalDataRows" />

				<SubmissionsCreateSubmissionModalOverridesSection
					v-model:overridePassword="overridePassword"
					v-model:passwordValue="passwordValue"
					v-model:overrideWebhookUrl="overrideWebhookUrl"
					v-model:webhookUrlValue="webhookUrlValue"
					v-model:overrideWebhookPdf="overrideWebhookPdf"
					v-model:webhookPdfValue="webhookPdfValue"
					:form-defaults="formDefaults"
				/>

				<div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
					{{ error }}
				</div>
			</div>

			<UiDialogFooter>
				<template v-if="createdLink">
					<UiButton @click="close">סגור</UiButton>
				</template>
				<template v-else>
					<UiButton variant="outline" @click="close">ביטול</UiButton>
					<UiButton :disabled="isLoading || isSubmitting" @click="submit">
						<Icon v-if="isSubmitting" name="svg-spinners:ring-resize" class="h-4 w-4" />
						צור הגשה
					</UiButton>
				</template>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>
