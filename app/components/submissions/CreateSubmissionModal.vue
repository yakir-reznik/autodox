<script setup lang="ts">
	import type { ElementType, ElementConfig, SelectionOption } from "~/types/form-builder";

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
	const showPrefill = ref(false);
	const showOverrides = ref(false);
	const createdLink = ref<string | null>(null);

	const submissionName = ref("");
	const externalId = ref("");

	// Form elements for prefill
	const fields = ref<FormElement[]>([]);
	const prefillData = ref<Record<string, any>>({});

	// Additional data (key-value pairs)
	const showAdditionalData = ref(false);
	const additionalDataRows = ref<{ key: string; value: string }[]>([]);

	function addAdditionalDataRow() {
		additionalDataRows.value.push({ key: "", value: "" });
	}

	function removeAdditionalDataRow(index: number) {
		additionalDataRows.value.splice(index, 1);
	}

	// Settings overrides
	const overridePassword = ref(false);
	const passwordValue = ref("");
	const overrideWebhookUrl = ref(false);
	const webhookUrlValue = ref("");
	const overrideWebhookPdf = ref(false);
	const webhookPdfValue = ref(false);

	// Current form defaults (for placeholder display)
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
		prefillData.value = {};
		additionalDataRows.value = [];
		showAdditionalData.value = false;
		overridePassword.value = false;
		passwordValue.value = "";
		overrideWebhookUrl.value = false;
		webhookUrlValue.value = "";
		overrideWebhookPdf.value = false;
		webhookPdfValue.value = false;
		showPrefill.value = false;
		showOverrides.value = false;
		createdLink.value = null;
		error.value = null;
	}

	async function fetchFormData() {
		isLoading.value = true;
		error.value = null;

		try {
			const [formResponse, settingsResponse] = await Promise.all([
				$fetch<{
					id: number;
					elements: FormElement[];
				}>(`/api/forms/${props.formId}`),
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
					if (dv) {
						try {
							prefillData.value[field.name!] = JSON.parse(dv);
						} catch {
							prefillData.value[field.name!] = [];
						}
					} else {
						prefillData.value[field.name!] = [];
					}
				} else if (field.type === "checkbox") {
					if (dv === true) prefillData.value[field.name!] = true;
				} else if (["date", "datetime", "time"].includes(field.type) && dv) {
					const resolved = resolveDateTimeDefault(
						dv,
						field.type as "date" | "datetime" | "time",
					);
					if (resolved) prefillData.value[field.name!] = resolved;
				} else if (field.type === "number" && dv) {
					prefillData.value[field.name!] = Number(dv);
				} else if (dv) {
					prefillData.value[field.name!] = dv;
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

	function getOptions(config: ElementConfig): SelectionOption[] {
		return (config as any).options ?? [];
	}

	function getInputType(
		type: ElementType,
	): "text" | "email" | "number" | "tel" | "date" | "time" | "datetime-local" {
		if (type === "datetime") return "datetime-local";
		if (type === "email") return "email";
		if (type === "number") return "number";
		if (type === "phone") return "tel";
		if (type === "date") return "date";
		if (type === "time") return "time";
		return "text";
	}

	async function submit() {
		isSubmitting.value = true;
		error.value = null;

		try {
			const filteredPrefill: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(prefillData.value)) {
				if (value !== "" && value !== undefined && value !== null) {
					filteredPrefill[key] = value;
				}
			}

			const body: Record<string, unknown> = {};
			if (submissionName.value.trim()) {
				body.name = submissionName.value.trim();
			}
			if (externalId.value.trim()) {
				body.externalId = externalId.value.trim();
			}
			if (Object.keys(filteredPrefill).length > 0) {
				body.prefill = filteredPrefill;
			}
			if (overridePassword.value) {
				body.password = passwordValue.value;
			}
			if (overrideWebhookUrl.value) {
				body.webhook_url = webhookUrlValue.value;
			}
			if (overrideWebhookPdf.value) {
				body.webhook_include_pdf = webhookPdfValue.value;
			}
			const filledRows = additionalDataRows.value.filter((r) => r.key.trim());
			if (filledRows.length > 0) {
				body.additionalData = Object.fromEntries(
					filledRows.map((r) => [r.key.trim(), r.value]),
				);
			}

			const response = await $fetch<{ link: string }>(
				`/api/forms/${props.formId}/create-submission-link`,
				{
					method: "POST",
					headers: { "x-api-key": props.apiKey },
					body,
				},
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
			<div v-if="createdLink" class="px-8 py-6 space-y-6">
				<div class="flex flex-col items-center gap-3 text-center">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
					>
						<Icon name="heroicons:check" class="h-6 w-6 text-green-600" />
					</div>
					<div>
						<p class="text-base font-semibold text-gray-900">ההגשה נוצרה בהצלחה</p>
						<p class="mt-1 text-sm text-gray-500">הקישור תקף ל-14 ימים</p>
					</div>
				</div>

				<div
					class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 font-mono break-all dir-ltr text-left"
				>
					{{ createdLink }}
				</div>

				<div class="flex gap-2">
					<a
						:href="createdLink"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
					>
						<Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
						צפה בהגשה
					</a>
					<BaseCopyButton :text="createdLink" class="flex-1 justify-center">
						העתק קישור
						<Icon name="heroicons:link" class="h-4 w-4" />
					</BaseCopyButton>
				</div>

				<NuxtLink
					:to="`/submissions/form/${formId}`"
					class="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
					@click="close"
				>
					<Icon name="heroicons:list-bullet" class="h-4 w-4" />
					כל ההגשות של הטופס
				</NuxtLink>
			</div>

			<!-- Loading -->
			<div v-else-if="isLoading" class="flex items-center justify-center py-8">
				<Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-gray-400" />
			</div>

			<!-- Error on load -->
			<div v-else-if="error && !fields.length" class="py-4 text-center text-red-500">
				{{ error }}
			</div>

			<!-- Form -->
			<div v-else class="max-h-[60vh] overflow-y-auto space-y-6 px-8">
				<!-- Name field -->
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

				<!-- External ID field -->
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

				<!-- Prefill section -->
				<div v-if="fields.length" class="space-y-3">
					<button
						type="button"
						class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
						@click="showPrefill = !showPrefill"
					>
						<Icon
							name="heroicons:chevron-left"
							class="h-4 w-4 transition-transform"
							:class="{ '-rotate-90': showPrefill }"
						/>
						מילוי מוקדם
					</button>

					<div v-if="showPrefill" class="space-y-4 pr-6">
						<div v-for="field in fields" :key="field.id" class="space-y-1">
							<label class="block text-sm font-medium text-gray-700">
								{{ (field.config as any).label || field.name }}
							</label>
							<p class="text-xs text-gray-400">{{ field.name }}</p>

							<!-- Text-like inputs -->
							<UiInput
								v-if="
									[
										'text',
										'email',
										'number',
										'phone',
										'textarea',
										'date',
										'time',
										'datetime',
									].includes(field.type)
								"
								v-model="prefillData[field.name!]"
								:type="getInputType(field.type)"
								:placeholder="(field.config as any).placeholder || ''"
							/>

							<!-- Dropdown -->
							<select
								v-else-if="field.type === 'dropdown'"
								v-model="prefillData[field.name!]"
								class="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
							>
								<option value="">בחר...</option>
								<option
									v-for="opt in getOptions(field.config)"
									:key="opt.id"
									:value="opt.value"
								>
									{{ opt.label }}
								</option>
							</select>

							<!-- Radio -->
							<div
								v-else-if="field.type === 'radio'"
								class="flex flex-wrap gap-4 pt-1"
							>
								<label
									v-for="opt in getOptions(field.config)"
									:key="opt.id"
									class="flex items-center gap-2 cursor-pointer"
								>
									<input
										type="radio"
										:name="`prefill-${field.name}`"
										:value="opt.value"
										v-model="prefillData[field.name!]"
									/>
									<span class="text-sm text-gray-700">{{ opt.label }}</span>
								</label>
							</div>

							<!-- Checkbox (single boolean) -->
							<BaseToggle
								v-else-if="field.type === 'checkbox'"
								v-model="prefillData[field.name!]"
							/>

							<!-- Checkboxes (multi-select) -->
							<div
								v-else-if="field.type === 'checkboxes'"
								class="flex flex-wrap gap-4 pt-1"
							>
								<label
									v-for="opt in getOptions(field.config)"
									:key="opt.id"
									class="flex items-center gap-2 cursor-pointer"
								>
									<input
										type="checkbox"
										:value="opt.value"
										v-model="prefillData[field.name!]"
									/>
									<span class="text-sm text-gray-700">{{ opt.label }}</span>
								</label>
							</div>
						</div>
					</div>
				</div>

				<!-- Additional data section -->
				<div class="space-y-3">
					<button
						type="button"
						class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
						@click="showAdditionalData = !showAdditionalData"
					>
						<Icon
							name="heroicons:chevron-left"
							class="h-4 w-4 transition-transform"
							:class="{ '-rotate-90': showAdditionalData }"
						/>
						נתונים נוספים
					</button>

					<div v-if="showAdditionalData" class="space-y-2 pr-6">
						<div
							v-for="(row, index) in additionalDataRows"
							:key="index"
							class="flex items-center gap-2"
						>
							<UiInput
								v-model="row.key"
								type="text"
								placeholder="מפתח"
								class="flex-1"
							/>
							<UiInput
								v-model="row.value"
								type="text"
								placeholder="ערך"
								class="flex-1"
							/>
							<button
								type="button"
								class="text-gray-400 hover:text-red-500 transition-colors"
								@click="removeAdditionalDataRow(index)"
							>
								<Icon name="heroicons:x-mark" class="h-4 w-4" />
							</button>
						</div>
						<button
							type="button"
							class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
							@click="addAdditionalDataRow"
						>
							<Icon name="heroicons:plus" class="h-4 w-4" />
							הוסף שדה
						</button>
					</div>
				</div>

				<!-- Divider -->
				<UiSeparator />

				<!-- Settings overrides section -->
				<div class="space-y-3">
					<button
						type="button"
						class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
						@click="showOverrides = !showOverrides"
					>
						<Icon
							name="heroicons:chevron-left"
							class="h-4 w-4 transition-transform"
							:class="{ '-rotate-90': showOverrides }"
						/>
						דריסת הגדרות טופס
					</button>

					<div v-if="showOverrides" class="space-y-4 pr-6">
						<!-- Password override -->
						<div class="space-y-2">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" v-model="overridePassword" />
								<span class="text-sm text-gray-700">דרוס סיסמה</span>
							</label>
							<UiInput
								v-if="overridePassword"
								v-model="passwordValue"
								type="text"
								:placeholder="
									formDefaults.password
										? `ברירת מחדל: ${formDefaults.password}`
										: 'ללא סיסמה'
								"
							/>
						</div>

						<!-- Webhook URL override -->
						<div class="space-y-2">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" v-model="overrideWebhookUrl" />
								<span class="text-sm text-gray-700">דרוס Webhook URL</span>
							</label>
							<UiInput
								v-if="overrideWebhookUrl"
								v-model="webhookUrlValue"
								type="url"
								dir="ltr"
								:placeholder="
									formDefaults.webhookUrl || 'https://example.com/webhook'
								"
							/>
						</div>

						<!-- Webhook Include PDF override -->
						<div class="space-y-2">
							<label class="flex items-center gap-3 cursor-pointer">
								<input type="checkbox" v-model="overrideWebhookPdf" />
								<span class="text-sm text-gray-700">דרוס צירוף PDF</span>
							</label>
							<div v-if="overrideWebhookPdf" class="flex items-center gap-2">
								<BaseToggle v-model="webhookPdfValue" />
								<span class="text-xs text-gray-500">
									(ברירת מחדל: {{ formDefaults.webhookIncludePdf ? "כן" : "לא" }})
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Error message -->
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
