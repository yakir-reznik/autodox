<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<header class="bg-white shadow">
			<div class="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center gap-4">
					<NuxtLink to="/manage">
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</BaseButton>
					</NuxtLink>
					<h1 class="text-2xl font-bold text-gray-900">טופס חדש ב-AI</h1>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="rounded-lg bg-white p-6 shadow">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">יצירת טופס עם AI</h2>
				<p class="mb-4 text-sm text-gray-600">
					בחרו קובץ PDF, Word או תמונה. הטופס יווצר אוטומטית לאחר בדיקה.
				</p>

				<input
					type="file"
					accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
					class="block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-700 file:ml-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
					:disabled="aiLoading"
					@change="handleAiFileChange"
				/>

				<div v-if="aiStatus !== 'idle'" class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
					<div class="space-y-4">
						<div
							v-if="aiStatus === 'success'"
							class="flex items-start gap-3 rounded-lg bg-green-50 p-4 text-green-800"
						>
							<Icon name="heroicons:check-circle" class="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<div class="min-w-0 flex-1 space-y-3">
								<div>
									<p class="font-medium">הטופס נוצר בהצלחה</p>
									<p class="mt-1 text-sm text-green-700">
										מעבירים אותך לטופס בעוד {{ redirectSeconds }} שניות.
									</p>
								</div>
								<BaseButton size="sm" variant="primary" @click="goToCreatedForm">
									<Icon name="heroicons:eye" class="h-4 w-4" />
									צפייה בטופס
								</BaseButton>
							</div>
						</div>

						<div
							v-else-if="aiStatus === 'failed' || aiStatus === 'expired'"
							class="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800"
						>
							<Icon name="heroicons:x-circle" class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
							<div class="min-w-0 flex-1">
								<p class="font-medium">
									{{ aiStatus === "expired" ? "יצירת הטופס הופסקה" : "יצירת הטופס נכשלה" }}
								</p>
								<p class="mt-1 text-sm text-red-700">{{ aiError }}</p>
								<ul v-if="aiValidationErrors.length" class="mt-3 list-inside list-disc text-sm text-red-700">
									<li v-for="item in aiValidationErrors" :key="`${item.path}-${item.message}`">
										{{ item.path }}: {{ item.message }}
									</li>
								</ul>
							</div>
						</div>

						<div v-else>
							<p class="text-sm font-medium text-gray-900">{{ currentAiStep?.title }}</p>
							<p class="mt-1 text-sm text-gray-600">{{ currentAiStepDescription }}</p>
						</div>

						<ol class="space-y-3">
							<li
								v-for="(step, index) in aiSteps"
								:key="step.status"
								class="flex items-start gap-3"
							>
								<div
									class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
									:class="getAiStepIconClasses(index)"
								>
									<Icon
										v-if="getAiStepState(index) === 'done'"
										name="heroicons:check"
										class="h-4 w-4"
									/>
									<Icon
										v-else-if="getAiStepState(index) === 'failed'"
										name="heroicons:x-mark"
										class="h-4 w-4"
									/>
									<Icon
										v-else-if="getAiStepState(index) === 'active'"
										name="heroicons:arrow-path"
										class="h-4 w-4 animate-spin"
									/>
									<span v-else class="text-xs font-medium">{{ index + 1 }}</span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium" :class="getAiStepTextClasses(index)">
										{{ step.title }}
									</p>
									<p class="text-xs text-gray-500">{{ step.description }}</p>
								</div>
							</li>
						</ol>
					</div>
				</div>

				<div v-if="aiError && aiStatus !== 'failed'" class="mt-4 rounded-lg bg-red-50 p-4">
					<div class="flex items-start gap-3">
						<Icon
							name="heroicons:exclamation-circle"
							class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
						/>
						<div class="space-y-3 text-sm text-red-700">
							<p>{{ aiError }}</p>
							<ul v-if="aiValidationErrors.length" class="list-inside list-disc">
								<li v-for="item in aiValidationErrors" :key="`${item.path}-${item.message}`">
									{{ item.path }}: {{ item.message }}
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div
					v-if="aiInvalidJson"
					dir="ltr"
					class="mt-4 max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm"
				>
					<Shiki lang="json" :code="aiInvalidJson" />
				</div>

				<BaseButton
					variant="primary"
					class="mt-6 w-full"
					:loading="aiLoading"
					:disabled="!aiFile || aiLoading || aiStatus === 'success'"
					@click="handleAiImport"
				>
					<Icon name="heroicons:sparkles" class="h-5 w-5" />
					{{ aiLoading ? currentAiStep?.buttonLabel || "מעבד..." : "צור טופס עם AI" }}
				</BaseButton>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
	import type {
		AiFormImportTaskCreateResponse,
		AiFormImportTaskStatus,
		AiFormImportTaskStatusResponse,
		AiFormImportValidationError,
	} from "~~/shared/types/ai-form-import";

	const router = useRouter();

	type AiImportStatus = "idle" | "uploading" | AiFormImportTaskStatus;
	type AiStepStatus = "uploading" | AiFormImportTaskStatus;
	type AiStepState = "done" | "active" | "failed" | "idle";

	definePageMeta({
		layout: "management-panel",
		heading: "טופס חדש ב-AI",
		breadcrumbs: [
			{
				label: "ניהול טפסים",
				to: "/manage",
			},
			{
				label: "טופס חדש ב-AI",
			},
		],
		middleware: () => {
			const { user } = useUserSession();
			if (!user.value?.roles?.includes("admin")) return navigateTo("/manage/unauthorized");
		},
	});

	useHead({ title: "טופס חדש ב-AI - Autodox" });

	const aiFile = ref<File | null>(null);
	const aiLoading = ref(false);
	const aiError = ref("");
	const aiInvalidJson = ref("");
	const aiValidationErrors = ref<AiFormImportValidationError[]>([]);
	const aiStatus = ref<AiImportStatus>("idle");
	const activeAiStepIndex = ref(0);
	const aiTaskId = ref("");
	const aiCreatedFormId = ref<number | null>(null);
	const redirectSeconds = ref(5);
	const aiGeneratingMessageIndex = ref(0);
	const aiPollIntervalMs = 2000;
	const aiGeneratingMessageIntervalMs = 8000;
	let aiPollTimer: ReturnType<typeof setTimeout> | null = null;
	let aiRedirectTimer: ReturnType<typeof setInterval> | null = null;
	let aiGeneratingMessageTimer: ReturnType<typeof setInterval> | null = null;

	const aiSteps: Array<{
		status: AiStepStatus;
		title: string;
		description: string;
		buttonLabel: string;
	}> = [
		{
			status: "uploading",
			title: "מעלים את הקובץ",
			description: "שולחים את הקובץ לעיבוד ומוודאים שסוג הקובץ תקין.",
			buttonLabel: "מעלה קובץ...",
		},
		{
			status: "queued",
			title: "ממתינים לתור",
			description: "המשימה נכנסה לתור ותתחיל ברגע שיש מקום פנוי לעיבוד.",
			buttonLabel: "ממתין לתור...",
		},
		{
			status: "generating",
			title: "מחלצים את מבנה הטופס",
			description: "ה-AI מזהה שדות, כותרות, אפשרויות וחוקי מילוי מתוך הקובץ.",
			buttonLabel: "מחלץ מבנה...",
		},
		{
			status: "repairing",
			title: "מתקנים את מבנה הטופס",
			description: "בודקים את הפלט ומבקשים מה-AI לתקן אותו אם צריך.",
			buttonLabel: "מתקן מבנה...",
		},
		{
			status: "creating",
			title: "יוצרים את הטופס",
			description: "בודקים את המבנה שנוצר ושומרים את הטופס במערכת.",
			buttonLabel: "יוצר טופס...",
		},
	];

	const aiGeneratingMessages = [
		"ממתינים שה-AI יסיים לבנות את הטופס.",
		"המודל עדיין עובד על זה.",
		"עוד רגע זה מוכן...",
		"ה-AI קורא את המסמך לעומק.",
		"מסדרים שדות, כותרות ואפשרויות.",
	];

	const currentAiStep = computed(() => aiSteps.find((step) => step.status === aiStatus.value));
	const currentAiStepDescription = computed(() => {
		if (aiStatus.value === "generating") {
			return aiGeneratingMessages[aiGeneratingMessageIndex.value];
		}

		return currentAiStep.value?.description || "";
	});

	function handleAiFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		aiFile.value = input.files?.[0] ?? null;
		resetAiFeedback();
	}

	async function handleAiImport() {
		if (!aiFile.value) return;

		resetAiFeedback();
		aiLoading.value = true;
		aiStatus.value = "uploading";
		activeAiStepIndex.value = 0;

		try {
			const body = new FormData();
			body.append("file", aiFile.value);

			const response = await $fetch<AiFormImportTaskCreateResponse>("/api/forms/ai-import", {
				method: "POST",
				body,
			});
			aiTaskId.value = response.taskId;
			applyAiTaskStatus({
				taskId: response.taskId,
				status: response.status,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			startAiTaskPolling(response.taskId);
		} catch (e: any) {
			const data = e.data?.data;
			aiError.value = getAiImportErrorMessage(e);
			aiValidationErrors.value = data?.errors || [];
			aiInvalidJson.value = data?.json ? JSON.stringify(data.json, null, 2) : "";
			aiStatus.value = "failed";
			aiLoading.value = false;
		}
	}

	function resetAiFeedback() {
		clearAiPollTimer();
		clearRedirectTimer();
		clearGeneratingMessageTimer();
		aiError.value = "";
		aiInvalidJson.value = "";
		aiValidationErrors.value = [];
		aiStatus.value = "idle";
		aiTaskId.value = "";
		aiCreatedFormId.value = null;
		redirectSeconds.value = 5;
		aiGeneratingMessageIndex.value = 0;
	}

	function startAiTaskPolling(taskId: string) {
		clearAiPollTimer();
		void pollAiTask(taskId);
	}

	async function pollAiTask(taskId: string) {
		if (taskId !== aiTaskId.value) return;

		try {
			const task = await $fetch<AiFormImportTaskStatusResponse>(`/api/forms/ai-import/${taskId}`);
			applyAiTaskStatus(task);

			if (isTerminalAiStatus(task.status)) return;

			aiPollTimer = setTimeout(() => {
				void pollAiTask(taskId);
			}, aiPollIntervalMs);
		} catch (e: any) {
			aiError.value = getAiImportErrorMessage(e);
			aiStatus.value = "failed";
			aiLoading.value = false;
			clearAiPollTimer();
			clearGeneratingMessageTimer();
		}
	}

	function applyAiTaskStatus(task: AiFormImportTaskStatusResponse) {
		if (task.taskId !== aiTaskId.value) return;

		aiStatus.value = task.status;
		const stepIndex = aiSteps.findIndex((step) => step.status === task.status);
		if (stepIndex !== -1) activeAiStepIndex.value = stepIndex;

		if (task.status === "generating") {
			startGeneratingMessageTimer();
		} else {
			clearGeneratingMessageTimer();
		}

		if (task.status === "success") {
			if (!task.formId) {
				aiStatus.value = "failed";
				aiError.value = "הטופס נוצר אבל מזהה הטופס לא התקבל מהשרת.";
				aiLoading.value = false;
				clearAiPollTimer();
				return;
			}

			aiCreatedFormId.value = task.formId;
			aiLoading.value = false;
			clearAiPollTimer();
			startRedirectCountdown();
			return;
		}

		if (task.status === "failed" || task.status === "expired") {
			aiError.value = getAiTaskErrorMessage(task);
			aiValidationErrors.value = task.validationErrors || [];
			aiInvalidJson.value = stringifyInvalidJson(task.invalidJson);
			aiLoading.value = false;
			clearAiPollTimer();
		}
	}

	function clearAiPollTimer() {
		if (!aiPollTimer) return;
		clearTimeout(aiPollTimer);
		aiPollTimer = null;
	}

	function startGeneratingMessageTimer() {
		if (aiGeneratingMessageTimer) return;
		aiGeneratingMessageIndex.value = 0;
		aiGeneratingMessageTimer = setInterval(() => {
			aiGeneratingMessageIndex.value = (aiGeneratingMessageIndex.value + 1) % aiGeneratingMessages.length;
		}, aiGeneratingMessageIntervalMs);
	}

	function clearGeneratingMessageTimer() {
		if (!aiGeneratingMessageTimer) return;
		clearInterval(aiGeneratingMessageTimer);
		aiGeneratingMessageTimer = null;
		aiGeneratingMessageIndex.value = 0;
	}

	function startRedirectCountdown() {
		clearRedirectTimer();
		redirectSeconds.value = 5;
		aiRedirectTimer = setInterval(() => {
			redirectSeconds.value -= 1;
			if (redirectSeconds.value <= 0) {
				goToCreatedForm();
			}
		}, 1000);
	}

	function clearRedirectTimer() {
		if (!aiRedirectTimer) return;
		clearInterval(aiRedirectTimer);
		aiRedirectTimer = null;
	}

	function getAiImportErrorMessage(e: any) {
		return formatAiImportErrorMessage(e.data?.message || e.message || "", e.data?.data);
	}

	function getAiTaskErrorMessage(task: AiFormImportTaskStatusResponse) {
		return formatAiImportErrorMessage(task.error || "", task);
	}

	function formatAiImportErrorMessage(message: string, data?: { provider?: string }) {
		const provider = data?.provider ? ` (${data.provider})` : "";

		if (/timed out|timeout/i.test(message)) {
			return "יצירת הטופס ארכה יותר מ-10 דקות ולכן הופסקה. נסו שוב עם קובץ קצר יותר או מודל אחר.";
		}

		if (/overloaded|capacity|rate.?limit|too many requests|529|429/i.test(message)) {
			return `ספק ה-AI עמוס כרגע${provider}. נסו שוב בעוד כמה דקות או בחרו מודל אחר בהגדרות.`;
		}

		if (/response[_ ]format|json[_ ]schema|structured|schema/i.test(message)) {
			return `המודל שנבחר לא הצליח להחזיר JSON מובנה${provider}. נסו שוב או בחרו מודל אחר בהגדרות.`;
		}

		if (/provider returned error|provider request failed/i.test(message)) {
			return `ספק ה-AI החזיר שגיאה כללית${provider}. נסו שוב או בחרו מודל אחר בהגדרות.`;
		}

		if (/OPEN_ROUTER_API_KEY/i.test(message)) {
			return "מפתח OpenRouter לא מוגדר בשרת.";
		}

		return message || "יצירת הטופס נכשלה";
	}

	function stringifyInvalidJson(value: unknown) {
		if (!value) return "";
		if (typeof value === "string") return value;
		return JSON.stringify(value, null, 2);
	}

	function goToCreatedForm() {
		if (!aiCreatedFormId.value) return;
		clearRedirectTimer();
		router.push(`/manage/form/${aiCreatedFormId.value}/edit`);
	}

	function getAiStepState(index: number): AiStepState {
		if (aiStatus.value === "success") return "done";
		if (aiStatus.value === "failed" || aiStatus.value === "expired") {
			if (index < activeAiStepIndex.value) return "done";
			if (index === activeAiStepIndex.value) return "failed";
			return "idle";
		}
		const currentIndex = currentAiStepIndex();
		if (index < currentIndex) return "done";
		if (index === currentIndex) return "active";
		return "idle";
	}

	function getAiStepIconClasses(index: number) {
		const state = getAiStepState(index);
		if (state === "done") return "bg-green-100 text-green-700";
		if (state === "failed") return "bg-red-100 text-red-700";
		if (state === "active") return "bg-blue-100 text-blue-700";
		return "bg-gray-200 text-gray-500";
	}

	function getAiStepTextClasses(index: number) {
		const state = getAiStepState(index);
		if (state === "done") return "text-green-800";
		if (state === "failed") return "text-red-800";
		if (state === "active") return "text-blue-800";
		return "text-gray-600";
	}

	function currentAiStepIndex() {
		const index = aiSteps.findIndex((step) => step.status === aiStatus.value);
		return index === -1 ? aiSteps.length : index;
	}

	function isTerminalAiStatus(status: AiFormImportTaskStatus) {
		return status === "success" || status === "failed" || status === "expired";
	}

	onBeforeUnmount(() => {
		clearAiPollTimer();
		clearRedirectTimer();
		clearGeneratingMessageTimer();
	});
</script>
