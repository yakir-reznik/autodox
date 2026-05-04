<template>
	<BaseModal v-model="isOpen" title="הגדרות טופס" size="md">
		<!-- Tab navigation -->
		<div class="flex border-b border-gray-200 mb-6 -mt-2">
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
				:class="
					activeTab === 'settings'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700'
				"
				@click="activeTab = 'settings'"
			>
				<span>הגדרות</span>
				<Icon name="heroicons:wrench" class="text-base" />
			</button>
			<button
				v-if="isOwner"
				type="button"
				class="px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
				:class="
					activeTab === 'sharing'
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:text-gray-700'
				"
				@click="activeTab = 'sharing'"
			>
				<span>שיתוף עם משתמשים אחרים</span>
				<Icon name="heroicons:share" class="text-base" />
			</button>
		</div>

		<!-- Sharing tab -->
		<div v-if="activeTab === 'sharing'">
			<FormBuilderFormSharingTab ref="sharingTabRef" :form-id="formId" />
		</div>

		<!-- Settings tab -->
		<template v-else>
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
				<!-- Status & Theme section -->
				<div class="space-y-4">
					<div>
						<h3 class="text-sm font-medium text-gray-900">סטטוס וערכת נושא</h3>
						<p class="text-sm text-gray-500 mt-1">הגדר את סטטוס הטופס ואת המראה שלו</p>
					</div>

					<div class="flex items-center gap-4">
						<div class="flex flex-col gap-1 w-36">
							<label for="settings-status" class="text-xs font-medium text-gray-600">
								סטטוס טופס
							</label>
							<UiSelect v-model="status" dir="rtl" id="settings-status">
								<UiSelectTrigger class="w-full">
									{{ statusLabels[status] }}
								</UiSelectTrigger>
								<UiSelectContent>
									<UiSelectItem
										v-for="[val, label] in Object.entries(statusLabels)"
										:key="val"
										:value="val"
									>
										{{ label }}
									</UiSelectItem>
								</UiSelectContent>
							</UiSelect>
						</div>

						<div class="flex flex-col gap-1 grow">
							<label class="text-xs font-medium text-gray-600"> ערכת נושא </label>
							<UiSelect v-model="theme" dir="rtl">
								<UiSelectTrigger class="w-full">
									<div class="flex items-center gap-2">
										<span>{{ selectedTheme?.title }}</span>
										<div class="flex gap-0.5">
											<div
												v-for="color in selectedTheme?.colors"
												:key="color"
												:style="{ background: color }"
												class="h-3.5 w-3.5 rounded-sm border border-black/10"
											/>
										</div>
									</div>
								</UiSelectTrigger>
								<UiSelectContent>
									<SelectItem
										v-for="t in THEMES"
										:key="t.id"
										:value="t.id"
										class="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-start rounded-sm py-2 pr-8 pl-2 outline-none data-disabled:pointer-events-none data-disabled:opacity-50"
									>
										<span
											class="absolute right-2 mt-0.5 flex size-3.5 items-center justify-center"
										>
											<SelectItemIndicator>
												<Check class="size-4" />
											</SelectItemIndicator>
										</span>
										<div class="flex flex-col gap-1">
											<div class="flex items-center gap-2">
												<SelectItemText class="text-sm font-medium">{{
													t.title
												}}</SelectItemText>
												<div class="flex gap-0.5">
													<div
														v-for="color in t.colors"
														:key="color"
														:style="{ background: color }"
														class="h-3.5 w-3.5 rounded-sm border border-black/10"
													/>
												</div>
											</div>
											<p class="text-muted-foreground line-clamp-2 text-xs">
												{{ t.description }}
											</p>
										</div>
									</SelectItem>
								</UiSelectContent>
							</UiSelect>
						</div>
					</div>
				</div>

				<!-- Divider -->
				<div class="border-t border-gray-200"></div>

				<!-- Form access section -->
				<div class="space-y-4">
					<div>
						<h3 class="text-sm font-medium text-gray-900">גישה לטופס</h3>
						<p class="text-sm text-gray-500 mt-1">בחר מי יכול למלא ולשלוח את הטופס</p>
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
								<span class="text-sm font-medium text-gray-900"
									>קישור אישי בלבד</span
								>
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
							<p class="text-sm text-gray-500">דרוש סיסמה כדי למלא את הטופס</p>
						</div>
						<BaseToggle v-model="passwordEnabled" />
					</div>

					<!-- Password input (shown when toggle is on) -->
					<div v-if="passwordEnabled" class="space-y-2">
						<label for="form-password" class="block text-sm font-medium text-gray-700">
							סיסמה
						</label>
						<BaseInput
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

					<BaseInput
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
						<BaseToggle v-model="webhookIncludePdf" />
					</div>

					<p class="text-xs text-gray-500">
						ניתן לדרוס הגדרות אלו ברמת קישור השליחה דרך ה-API
					</p>
				</div>

				<!-- Error message -->
				<div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
					{{ error }}
				</div>
			</div> </template
		><!-- end settings tab -->

		<template #footer>
			<template v-if="activeTab === 'settings'">
				<BaseButton variant="secondary" @click="close"> ביטול </BaseButton>
				<BaseButton
					variant="primary"
					:loading="isSaving"
					:disabled="isLoading || (passwordEnabled && !!passwordError)"
					@click="saveSettings"
				>
					שמור
				</BaseButton>
			</template>
			<template v-else>
				<BaseButton variant="secondary" @click="close"> ביטול </BaseButton>
				<BaseButton variant="primary" :loading="sharingTabRef?.saving" @click="saveSharing">
					שמור
				</BaseButton>
			</template>
		</template>
	</BaseModal>
</template>

<script setup lang="ts">
	import { SelectItem, SelectItemText, SelectItemIndicator } from "reka-ui";
	import { Check } from "lucide-vue-next";
	import type { FormStatus, FormTheme } from "~/types/form-builder";
	import { THEMES } from "~/composables/useThemes";

	interface Props {
		modelValue: boolean;
		formId: number;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: boolean];
		saved: [payload: { status: FormStatus; theme: FormTheme }];
	}>();

	const { user } = useUserSession();
	const formCreatedBy = ref<number | null>(null);
	const isOwner = computed(() => user.value?.id != null && formCreatedBy.value === user.value.id);

	const activeTab = ref<"settings" | "sharing">("settings");
	const sharingTabRef = ref<{ save: () => Promise<boolean>; saving: boolean } | null>(null);

	async function saveSharing() {
		const success = await sharingTabRef.value?.save();
		if (success) close();
	}

	const isOpen = computed({
		get: () => props.modelValue,
		set: (value) => emit("update:modelValue", value),
	});

	// Form settings state
	const isLoading = ref(true);
	const isSaving = ref(false);
	const error = ref<string | null>(null);

	const status = ref<FormStatus>("draft");
	const statusLabels = {
		draft: "טיוטא",
		published: "פורסם",
		archived: "בארכיון",
	};
	const theme = ref<FormTheme>("ocean");
	const passwordEnabled = ref(false);
	const password = ref("");
	const passwordError = ref<string | null>(null);
	const allowPublicSubmissions = ref(true);
	const webhookUrl = ref("");
	const webhookIncludePdf = ref(false);

	const selectedTheme = computed(() => THEMES.find((t) => t.id === theme.value));

	// Fetch settings when modal opens
	watch(
		() => props.modelValue,
		async (open) => {
			if (open) {
				activeTab.value = "settings";
				await fetchSettings();
			}
		},
		{ immediate: true },
	);

	async function fetchSettings() {
		isLoading.value = true;
		error.value = null;

		try {
			const data = await $fetch<{
				id: number;
				title: string;
				status: FormStatus;
				theme: FormTheme;
				password: string | null;
				allowPublicSubmissions: boolean;
				webhookUrl: string | null;
				webhookIncludePdf: boolean;
				createdBy: number;
			}>(`/api/forms/${props.formId}/settings`);

			status.value = data.status ?? "draft";
			theme.value = data.theme ?? "default";
			passwordEnabled.value = !!data.password;
			password.value = data.password ?? "";
			allowPublicSubmissions.value = data.allowPublicSubmissions ?? true;
			webhookUrl.value = data.webhookUrl ?? "";
			webhookIncludePdf.value = data.webhookIncludePdf ?? false;
			formCreatedBy.value = data.createdBy;
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
					status: status.value,
					theme: theme.value,
					password: passwordEnabled.value ? password.value : null,
					allowPublicSubmissions: allowPublicSubmissions.value,
					webhookUrl: webhookUrl.value.trim() || null,
					webhookIncludePdf: webhookIncludePdf.value,
				},
			});

			emit("saved", { status: status.value, theme: theme.value });
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
