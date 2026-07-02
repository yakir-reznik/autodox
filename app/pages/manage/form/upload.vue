<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center gap-4">
					<NuxtLink :to="isUpdatingMode ? `/manage/form/${formId}/edit` : '/forms'">
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</BaseButton>
					</NuxtLink>
					<h1 class="text-2xl font-bold text-gray-900">
						{{
							isUpdatingMode
								? "Import JSON - Replace Form Structure"
								: "Upload JSON Form"
						}}
					</h1>
				</div>
			</div>
		</header>

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Left: Documentation -->
				<div class="space-y-6">
					<!-- ChatGPT Prompt Card -->
					<div class="rounded-lg bg-white p-6 shadow">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">ChatGPT Prompt</h2>
							<BaseCopyButton :text="chatgptPrompt">
								Copy
								<template #copied>Copied!</template>
							</BaseCopyButton>
						</div>
						<p class="mb-3 text-sm text-gray-600">
							Copy this prompt and paste it to ChatGPT along with your PDF file:
						</p>
						<div class="max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-4">
							<pre dir="ltr" class="whitespace-pre-wrap text-xs text-gray-700">{{
								chatgptPrompt
							}}</pre>
						</div>
					</div>

					<!-- Example JSON Card -->
					<div class="rounded-lg bg-white p-6 shadow">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Example JSON</h2>
							<BaseCopyButton :text="exampleJson">
								Copy
								<template #copied>Copied!</template>
							</BaseCopyButton>
						</div>
						<p class="mb-3 text-sm text-gray-600">
							Here's an example of a valid JSON structure:
						</p>
						<div
							dir="ltr"
							class="max-h-80 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="exampleJson" />
						</div>
					</div>
				</div>

				<!-- Right: JSON Input -->
				<div class="rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Paste Your JSON</h2>
					<p class="mb-4 text-sm text-gray-600">
						{{
							isUpdatingMode
								? "Paste the JSON to replace your form's structure. All existing elements will be replaced."
								: "Paste the JSON output from ChatGPT here. The form will be created automatically."
						}}
					</p>
					<div
						v-if="prefilling"
						class="flex h-96 items-center justify-center rounded-lg border border-gray-300 bg-gray-50"
					>
						<Icon name="svg-spinners:ring-resize" class="h-6 w-6 text-gray-400" />
					</div>
					<textarea
						v-else
						v-model="jsonInput"
						dir="ltr"
						class="h-96 w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
						placeholder='{
  "title": "Your Form Title",
  "elements": [
    { "type": "text", "label": "Name", "required": true }
  ]
}'
					></textarea>

					<!-- Error display -->
					<div v-if="error" class="mt-4 rounded-lg bg-red-50 p-4">
						<div class="flex items-start gap-3">
							<Icon
								name="heroicons:exclamation-circle"
								class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
							/>
							<p class="text-sm text-red-700">{{ error }}</p>
						</div>
					</div>

					<!-- Submit button -->
					<BaseButton
						variant="primary"
						class="mt-6 w-full"
						:loading="loading"
						:disabled="!jsonInput.trim() || loading"
						@click="handleUpload"
					>
						<Icon
							:name="isUpdatingMode ? 'heroicons:arrow-up-tray' : 'heroicons:plus'"
							class="h-5 w-5"
						/>
						{{ isUpdatingMode ? "Replace Form" : "Create Form" }}
					</BaseButton>
				</div>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
	import chatgptPrompt from "~~/shared/prompts/ai-form-json-generation-prompt.txt?raw";

	const router = useRouter();
	const route = useRoute();

	definePageMeta({
		layout: "management-panel",
		heading: "העלאת JSON",
		breadcrumbs: [
			{
				label: "ניהול טפסים",
				to: "/manage",
			},
			{
				label: "העלאת JSON",
			},
		],
	});

	useHead({ title: "Upload JSON - Autodox" });

	const jsonInput = ref("");
	const error = ref("");
	const loading = ref(false);
	const prefilling = ref(false);
	const formId = computed(() => {
		const id = route.query.formId;
		return id ? Number(id) : null;
	});

	const isUpdatingMode = computed(() => formId.value !== null);

	onMounted(async () => {
		if (!isUpdatingMode.value || !formId.value) return;
		prefilling.value = true;
		try {
			const data = await $fetch(`/api/forms/${formId.value}/export-json`);
			jsonInput.value = JSON.stringify(data, null, 2);

			// @ts-ignore
			const formTitle = data.title as string;

			route.meta.breadcrumbs = [
				{
					label: "ניהול טפסים",
					to: "/manage",
				},
				{
					label: `עריכת טופס (${formTitle})`,
					to: `/manage/form/${formId.value}/edit`,
				},
				{
					label: "העלאת JSON",
				},
			];
		} catch {
			error.value = "Failed to load form JSON";
		} finally {
			prefilling.value = false;
		}
	});

	// Example JSON for users to copy
	const exampleJson = `{
  "title": "Registration Form",
  "description": "User registration form",
  "elements": [
    { "type": "heading_h1", "text": "Registration" },
    { "type": "text", "label": "Full Name", "required": true, "placeholder": "Enter your name", "autocomplete": "name" },
    { "type": "email", "label": "Email Address", "required": true, "autocomplete": "email" },
    { "type": "phone", "label": "Phone Number", "placeholder": "050-0000000",
      "requiredConditions": [{ "fieldId": "contact_pref", "operator": "==", "value": "Phone" }] },
    { "type": "radio", "id": "contact_pref", "label": "Preferred Contact Method", "options": ["Email", "Phone"], "required": true },
    { "type": "number", "label": "Age", "required": true, "step": 1 },
    { "type": "dropdown", "label": "Country", "options": ["Israel", "USA", "UK", "Other"], "defaultValue": "Israel" },
    { "type": "radio", "id": "has_referral", "label": "Were you referred by someone?", "options": ["Yes", "No"], "required": true },
    { "type": "text", "label": "Referrer Name",
      "conditions": [{ "fieldId": "has_referral", "operator": "==", "value": "Yes" }],
      "requiredConditions": [{ "fieldId": "has_referral", "operator": "==", "value": "Yes" }] },
    { "type": "radio", "label": "Gender", "options": ["Male", "Female", "Other"] },
    { "type": "textarea", "label": "Comments", "helpText": "Any additional information", "rows": 4 },
    { "type": "checkboxes", "id": "interests", "label": "Interests", "options": ["Sports", "Music", "Tech"], "allowOther": true },
    { "type": "section", "label": "Tech Preferences",
      "conditions": [{ "fieldId": "interests", "operator": "contains", "value": "Tech" }],
      "children": [
        { "type": "checkboxes", "label": "Topics", "options": ["AI", "Web Development", "Cybersecurity", "Mobile"], "required": true },
        { "type": "textarea", "label": "What are you hoping to learn?", "rows": 3 }
      ]},
    { "type": "checkbox", "label": "I agree to the terms and conditions", "required": true },
    { "type": "signature", "label": "Signature", "required": true }
  ]
}`;

	async function handleUpload() {
		error.value = "";
		loading.value = true;

		try {
			// Parse JSON
			let parsed;
			try {
				parsed = JSON.parse(jsonInput.value);
			} catch {
				throw new Error("Invalid JSON format. Please check your JSON syntax.");
			}

			if (isUpdatingMode.value && formId.value) {
				// Update existing form
				const response = await $fetch<{ formId: number; success: boolean }>(
					`/api/forms/${formId.value}/upload-json`,
					{
						method: "POST",
						body: parsed,
					},
				);
				// Redirect back to form editor
				await router.push(`/manage/form/${response.formId}/edit`);
			} else {
				// Create new form
				const response = await $fetch<{ formId: number; success: boolean }>(
					"/api/forms/upload-json",
					{
						method: "POST",
						body: parsed,
					},
				);
				// Redirect to form editor
				await router.push(`/manage/form/${response.formId}/edit`);
			}
		} catch (e: any) {
			error.value =
				e.data?.message ||
				e.message ||
				(isUpdatingMode.value ? "Failed to update form" : "Failed to create form");
		} finally {
			loading.value = false;
		}
	}
</script>
