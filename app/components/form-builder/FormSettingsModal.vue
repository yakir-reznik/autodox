<script setup lang="ts">
interface Props {
	modelValue: boolean;
	formId: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

// Form settings state
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref<string | null>(null);

const passwordEnabled = ref(false);
const password = ref("");
const passwordError = ref<string | null>(null);
const allowPublicSubmissions = ref(true);
const webhookUrl = ref("");
const webhookIncludePdf = ref(false);

// Fetch settings when modal opens
watch(
	() => props.modelValue,
	async (open) => {
		if (open) {
			await fetchSettings();
		}
	},
	{ immediate: true }
);

async function fetchSettings() {
	isLoading.value = true;
	error.value = null;

	try {
		const data = await $fetch<{
			id: number;
			title: string;
			password: string | null;
			allowPublicSubmissions: boolean;
			webhookUrl: string | null;
			webhookIncludePdf: boolean;
		}>(`/api/forms/${props.formId}/settings`);

		passwordEnabled.value = !!data.password;
		password.value = data.password ?? "";
		allowPublicSubmissions.value = data.allowPublicSubmissions ?? true;
		webhookUrl.value = data.webhookUrl ?? "";
		webhookIncludePdf.value = data.webhookIncludePdf ?? false;
	} catch (e: any) {
		error.value = e.data?.message || "Failed to load settings";
	} finally {
		isLoading.value = false;
	}
}

// Validate password when toggle is enabled
watch(passwordEnabled, (enabled) => {
	if (!enabled) {
		password.value = "";
		passwordError.value = null;
	} else {
		validatePassword();
	}
});

watch(password, () => {
	if (passwordEnabled.value) {
		validatePassword();
	}
});

function validatePassword(): boolean {
	if (passwordEnabled.value && !password.value.trim()) {
		passwordError.value = "יש להזין סיסמה";
		return false;
	}
	passwordError.value = null;
	return true;
}

async function saveSettings() {
	if (!validatePassword()) {
		return;
	}

	isSaving.value = true;
	error.value = null;

	try {
		await $fetch(`/api/forms/${props.formId}`, {
			method: "PATCH",
			body: {
				password: passwordEnabled.value ? password.value : null,
				allowPublicSubmissions: allowPublicSubmissions.value,
				webhookUrl: webhookUrl.value.trim() || null,
				webhookIncludePdf: webhookIncludePdf.value,
			},
		});

		isOpen.value = false;
	} catch (e: any) {
		error.value = e.data?.message || "Failed to save settings";
	} finally {
		isSaving.value = false;
	}
}

function close() {
	isOpen.value = false;
}
</script>

<template>
	<UiModal v-model="isOpen" title="הגדרות טופס" size="md">
		<!-- Loading state -->
		<div v-if="isLoading" class="flex items-center justify-center py-8">
			<Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin text-gray-400" />
		</div>

		<!-- Error state -->
		<div v-else-if="error && !password" class="py-4 text-center text-red-500">
			{{ error }}
		</div>

		<!-- Settings form -->
		<div v-else class="space-y-6">
			<!-- Form access section -->
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-medium text-gray-900">גישה לטופס</h3>
					<p class="text-sm text-gray-500 mt-1">
						בחר מי יכול למלא ולשלוח את הטופס
					</p>
				</div>

				<div class="space-y-3">
					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="radio"
							:checked="allowPublicSubmissions"
							@change="allowPublicSubmissions = true"
							class="mt-1"
						/>
						<div>
							<span class="text-sm font-medium text-gray-900">פתוח לכולם</span>
							<p class="text-xs text-gray-500">
								כל מי שיש לו את כתובת הטופס יכול למלא ולשלוח
							</p>
						</div>
					</label>

					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="radio"
							:checked="!allowPublicSubmissions"
							@change="allowPublicSubmissions = false"
							class="mt-1"
						/>
						<div>
							<span class="text-sm font-medium text-gray-900">קישור אישי בלבד</span>
							<p class="text-xs text-gray-500">
								רק משתמשים עם קישור ייעודי יוכלו למלא את הטופס
							</p>
						</div>
					</label>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-200"></div>

			<!-- Password protection section -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-medium text-gray-900">הגנה בסיסמה</h3>
						<p class="text-sm text-gray-500">
							דרוש סיסמה כדי למלא את הטופס
						</p>
					</div>
					<UiToggle v-model="passwordEnabled" />
				</div>

				<!-- Password input (shown when toggle is on) -->
				<div v-if="passwordEnabled" class="space-y-2">
					<label for="form-password" class="block text-sm font-medium text-gray-700">
						סיסמה
					</label>
					<UiInput
						id="form-password"
						v-model="password"
						type="text"
						placeholder="הזן סיסמה"
						:error="passwordError ?? undefined"
					/>
					<p class="text-xs text-gray-500">
						הסיסמה מוצגת בטקסט רגיל ותהיה גלויה למי שניגש להגדרות
					</p>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-200"></div>

			<!-- Webhook URL section -->
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-medium text-gray-900">Webhook URL</h3>
					<p class="text-sm text-gray-500 mt-1">
						כתובת URL שתקבל את נתוני הטופס בעת שליחה
					</p>
				</div>

				<UiInput
					v-model="webhookUrl"
					type="url"
					placeholder="https://example.com/webhook"
					dir="ltr"
				/>

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-900">צירוף PDF</p>
						<p class="text-sm text-gray-500">
							צרף קובץ PDF של הטופס לנתוני ה-Webhook
						</p>
					</div>
					<UiToggle v-model="webhookIncludePdf" />
				</div>

				<p class="text-xs text-gray-500">
					ניתן לדרוס הגדרות אלו ברמת קישור השליחה דרך ה-API
				</p>
			</div>

			<!-- Error message -->
			<div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
				{{ error }}
			</div>
		</div>

		<template #footer>
			<UiButton variant="secondary" @click="close">
				ביטול
			</UiButton>
			<UiButton
				variant="primary"
				:loading="isSaving"
				:disabled="isLoading || (passwordEnabled && !!passwordError)"
				@click="saveSettings"
			>
				שמור
			</UiButton>
		</template>
	</UiModal>
</template>
