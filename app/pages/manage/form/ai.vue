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
							v-else-if="aiStatus === 'failed'"
							class="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800"
						>
							<Icon name="heroicons:x-circle" class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
							<div class="min-w-0 flex-1">
								<p class="font-medium">יצירת הטופס נכשלה</p>
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
							<p class="mt-1 text-sm text-gray-600">{{ currentAiStep?.description }}</p>
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
					{{ aiLoading ? currentAiStep?.buttonLabel : "צור טופס עם AI" }}
				</BaseButton>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
	const router = useRouter();

	type AiImportStatus = "idle" | "uploading" | "extracting" | "creating" | "success" | "failed";
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
	const aiValidationErrors = ref<Array<{ path: string; message: string }>>([]);
	const aiStatus = ref<AiImportStatus>("idle");
	const activeAiStepIndex = ref(0);
	const aiCreatedFormId = ref<number | null>(null);
	const redirectSeconds = ref(5);
	const aiStageTimers: ReturnType<typeof setTimeout>[] = [];
	let aiRedirectTimer: ReturnType<typeof setInterval> | null = null;

	const aiSteps: Array<{
		status: AiImportStatus;
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
			status: "extracting",
			title: "מחלצים את מבנה הטופס",
			description: "ה-AI מזהה שדות, כותרות, אפשרויות וחוקי מילוי מתוך הקובץ.",
			buttonLabel: "מחלץ מבנה...",
		},
		{
			status: "creating",
			title: "יוצרים את הטופס",
			description: "בודקים את המבנה שנוצר ושומרים את הטופס במערכת.",
			buttonLabel: "יוצר טופס...",
		},
	];

	const currentAiStep = computed(() => aiSteps.find((step) => step.status === aiStatus.value));

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
		startAiStageTimers();

		try {
			const body = new FormData();
			body.append("file", aiFile.value);

			const response = await $fetch<{ formId: number; success: boolean }>("/api/forms/ai-import", {
				method: "POST",
				body,
			});
			aiCreatedFormId.value = response.formId;
			aiStatus.value = "success";
			startRedirectCountdown();
		} catch (e: any) {
			const data = e.data?.data;
			aiError.value = e.data?.message || e.message || "יצירת הטופס נכשלה";
			aiValidationErrors.value = data?.errors || [];
			aiInvalidJson.value = data?.json ? JSON.stringify(data.json, null, 2) : "";
			aiStatus.value = "failed";
		} finally {
			clearAiStageTimers();
			aiLoading.value = false;
		}
	}

	function resetAiFeedback() {
		clearAiStageTimers();
		clearRedirectTimer();
		aiError.value = "";
		aiInvalidJson.value = "";
		aiValidationErrors.value = [];
		aiStatus.value = "idle";
		aiCreatedFormId.value = null;
		redirectSeconds.value = 5;
	}

	function startAiStageTimers() {
		clearAiStageTimers();
		aiStageTimers.push(
			setTimeout(() => {
				if (!aiLoading.value) return;
				aiStatus.value = "extracting";
				activeAiStepIndex.value = 1;
			}, 1000),
			setTimeout(() => {
				if (!aiLoading.value) return;
				aiStatus.value = "creating";
				activeAiStepIndex.value = 2;
			}, 4500),
		);
	}

	function clearAiStageTimers() {
		while (aiStageTimers.length) {
			const timer = aiStageTimers.pop();
			if (timer) clearTimeout(timer);
		}
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

	function goToCreatedForm() {
		if (!aiCreatedFormId.value) return;
		clearRedirectTimer();
		router.push(`/manage/form/${aiCreatedFormId.value}/edit`);
	}

	function getAiStepState(index: number): AiStepState {
		if (aiStatus.value === "success") return "done";
		if (aiStatus.value === "failed") {
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

	onBeforeUnmount(() => {
		clearAiStageTimers();
		clearRedirectTimer();
	});
</script>
