<script setup lang="ts">
const router = useRouter();
const route = useRoute();

useHead({ title: "Upload JSON - Autodox" });

const { user } = useUserSession();

const jsonInput = ref("");
const error = ref("");
const loading = ref(false);
const formId = computed(() => {
	const id = route.query.formId;
	return id ? Number(id) : null;
});

const isUpdatingMode = computed(() => formId.value !== null);

// Example JSON for users to copy
const exampleJson = `{
  "title": "Registration Form",
  "description": "User registration form",
  "elements": [
    { "type": "heading_h1", "text": "Registration" },
    { "type": "text", "label": "Full Name", "required": true, "placeholder": "Enter your name" },
    { "type": "email", "label": "Email Address", "required": true },
    { "type": "dropdown", "label": "Country", "options": ["Israel", "USA", "UK", "Other"] },
    { "type": "radio", "label": "Gender", "options": ["Male", "Female", "Other"] },
    { "type": "textarea", "label": "Comments", "helpText": "Any additional information" },
    { "type": "checkbox", "label": "I agree to the terms and conditions", "required": true },
    { "type": "signature", "label": "Signature", "required": true }
  ]
}`;

const chatgptPrompt = `I have a PDF form that I need to convert to JSON format for a form builder system.

Please analyze the attached PDF and generate a JSON structure following this exact schema:

{
  "title": "Form title here",
  "description": "Optional form description",
  "elements": [
    // Each form field/element as an object
  ]
}

=== ALL SUPPORTED ELEMENT TYPES ===

INPUT FIELDS (use "label", "placeholder", "helpText", "required"):
- "text" - Single line text input (names, addresses, etc.)
- "email" - Email address input
- "number" - Numeric input (age, quantity, etc.)
- "textarea" - Multi-line text input (comments, descriptions)
- "date" - Date picker (YYYY-MM-DD)
- "time" - Time picker (HH:MM)
- "datetime" - Date and time combined picker

SELECTION FIELDS (use "label", "options", "required"):
- "dropdown" - Dropdown/select list (single choice from list)
- "radio" - Radio buttons (single choice, all options visible)
- "checkbox" - Single checkbox (yes/no, agree/disagree)
- "checkboxes" - Multiple checkboxes (select multiple options)

SPECIAL FIELDS:
- "signature" - Digital signature pad (use "label", "required")

LAYOUT ELEMENTS:
- "heading_h1" - Large heading (use "text" property)
- "heading_h2" - Medium heading (use "text" property)
- "heading_h3" - Small heading (use "text" property)
- "paragraph" - Text paragraph (use "text" property)
- "image" - Image display (use "url", "caption")
- "video" - Video embed (use "url", "caption")
- "divider" - Horizontal line separator (no properties needed)
- "spacer" - Vertical space (use "height" in pixels, default 24)
- "section" - Group container (use "label" for title, "children" array for nested elements)

=== ELEMENT PROPERTIES BY TYPE ===

For text, email, number, date, time, datetime:
{ "type": "text", "label": "Field Label", "placeholder": "Hint text", "helpText": "Additional info", "required": true }

For textarea:
{ "type": "textarea", "label": "Comments", "placeholder": "Enter details...", "required": false }

For dropdown:
{ "type": "dropdown", "label": "Select Country", "options": ["Israel", "USA", "UK", "Other"], "required": true }

For radio:
{ "type": "radio", "label": "Gender", "options": ["Male", "Female", "Other"], "required": true }

For checkbox (single yes/no):
{ "type": "checkbox", "label": "I agree to the terms and conditions", "required": true }

For checkboxes (multiple selection):
{ "type": "checkboxes", "label": "Select Services", "options": ["Service A", "Service B", "Service C"], "required": false }

For signature:
{ "type": "signature", "label": "Your Signature", "required": true }

For headings:
{ "type": "heading_h1", "text": "Form Title" }
{ "type": "heading_h2", "text": "Section Title" }
{ "type": "heading_h3", "text": "Subsection Title" }

For paragraph:
{ "type": "paragraph", "text": "Please fill out all required fields below." }

For divider:
{ "type": "divider" }

For spacer:
{ "type": "spacer", "height": 24 }

For section (grouping):
{ "type": "section", "label": "Personal Information", "children": [
  { "type": "text", "label": "First Name", "required": true },
  { "type": "text", "label": "Last Name", "required": true }
]}

=== IMPORTANT RULES ===

1. Output ONLY valid JSON - no explanations, no markdown code blocks
2. Use EXACT type names as shown above (e.g., "checkboxes" not "checkbox_group")
3. For dropdown/radio/checkboxes: "options" must be a simple string array
4. Mark fields as "required": true if they appear mandatory in the PDF (asterisk, "required" text, etc.)
5. Maintain the exact order of fields as they appear in the PDF
6. Use descriptive labels that match the PDF text
7. Use headings to separate form sections
8. Use dividers or spacers for visual separation where appropriate
9. Group related fields in sections when the PDF has clear groupings`;

const copied = ref<string | null>(null);

async function copyToClipboard(text: string, key: string) {
	await navigator.clipboard.writeText(text);
	copied.value = key;
	setTimeout(() => {
		copied.value = null;
	}, 2000);
}

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
			const response = await $fetch<{ formId: number; success: boolean }>(`/api/forms/${formId.value}/upload-json`, {
				method: "POST",
				body: parsed,
			});
			// Redirect back to form editor
			await router.push(`/edit/${response.formId}`);
		} else {
			// Create new form
			const response = await $fetch<{ formId: number; success: boolean }>("/api/forms/upload-json", {
				method: "POST",
				body: parsed,
			});
			// Redirect to form editor
			await router.push(`/edit/${response.formId}`);
		}
	} catch (e: any) {
		error.value = e.data?.message || e.message || (isUpdatingMode.value ? "Failed to update form" : "Failed to create form");
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center gap-4">
					<NuxtLink :to="isUpdatingMode ? `/edit/${formId}` : '/forms'">
						<UiButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</UiButton>
					</NuxtLink>
					<h1 class="text-2xl font-bold text-gray-900">
						{{ isUpdatingMode ? "Import JSON - Replace Form Structure" : "Upload JSON Form" }}
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
							<UiButton
								variant="secondary"
								size="sm"
								@click="copyToClipboard(chatgptPrompt, 'prompt')"
							>
								<Icon
									:name="copied === 'prompt' ? 'heroicons:check' : 'heroicons:clipboard'"
									class="h-4 w-4"
								/>
								{{ copied === "prompt" ? "Copied!" : "Copy" }}
							</UiButton>
						</div>
						<p class="mb-3 text-sm text-gray-600">
							Copy this prompt and paste it to ChatGPT along with your PDF file:
						</p>
						<div class="max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-4">
							<pre
								dir="ltr"
								class="whitespace-pre-wrap text-xs text-gray-700"
							>{{ chatgptPrompt }}</pre>
						</div>
					</div>

					<!-- Example JSON Card -->
					<div class="rounded-lg bg-white p-6 shadow">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Example JSON</h2>
							<UiButton
								variant="secondary"
								size="sm"
								@click="copyToClipboard(exampleJson, 'example')"
							>
								<Icon
									:name="copied === 'example' ? 'heroicons:check' : 'heroicons:clipboard'"
									class="h-4 w-4"
								/>
								{{ copied === "example" ? "Copied!" : "Copy" }}
							</UiButton>
						</div>
						<p class="mb-3 text-sm text-gray-600">Here's an example of a valid JSON structure:</p>
						<div class="max-h-80 overflow-y-auto rounded-lg bg-gray-50 p-4">
							<pre
								dir="ltr"
								class="whitespace-pre-wrap text-xs text-gray-700"
							>{{ exampleJson }}</pre>
						</div>
					</div>

					<!-- Supported Types Card -->
					<div class="rounded-lg bg-white p-6 shadow">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Supported Element Types</h2>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<h3 class="mb-2 font-medium text-gray-700">Input Fields</h3>
								<ul class="list-inside list-disc space-y-1 text-gray-600">
									<li><code class="rounded bg-gray-100 px-1">text</code></li>
									<li><code class="rounded bg-gray-100 px-1">email</code></li>
									<li><code class="rounded bg-gray-100 px-1">number</code></li>
									<li><code class="rounded bg-gray-100 px-1">textarea</code></li>
									<li><code class="rounded bg-gray-100 px-1">date</code></li>
									<li><code class="rounded bg-gray-100 px-1">time</code></li>
									<li><code class="rounded bg-gray-100 px-1">datetime</code></li>
								</ul>
							</div>
							<div>
								<h3 class="mb-2 font-medium text-gray-700">Selection Fields</h3>
								<ul class="list-inside list-disc space-y-1 text-gray-600">
									<li><code class="rounded bg-gray-100 px-1">dropdown</code></li>
									<li><code class="rounded bg-gray-100 px-1">radio</code></li>
									<li><code class="rounded bg-gray-100 px-1">checkbox</code></li>
									<li><code class="rounded bg-gray-100 px-1">checkboxes</code></li>
								</ul>
							</div>
							<div>
								<h3 class="mb-2 font-medium text-gray-700">Special</h3>
								<ul class="list-inside list-disc space-y-1 text-gray-600">
									<li><code class="rounded bg-gray-100 px-1">signature</code></li>
								</ul>
							</div>
							<div>
								<h3 class="mb-2 font-medium text-gray-700">Layout</h3>
								<ul class="list-inside list-disc space-y-1 text-gray-600">
									<li><code class="rounded bg-gray-100 px-1">heading_h1</code></li>
									<li><code class="rounded bg-gray-100 px-1">heading_h2</code></li>
									<li><code class="rounded bg-gray-100 px-1">heading_h3</code></li>
									<li><code class="rounded bg-gray-100 px-1">paragraph</code></li>
									<li><code class="rounded bg-gray-100 px-1">divider</code></li>
									<li><code class="rounded bg-gray-100 px-1">spacer</code></li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<!-- Right: JSON Input -->
				<div class="rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Paste Your JSON</h2>
					<p class="mb-4 text-sm text-gray-600">
						{{ isUpdatingMode
							? "Paste the JSON to replace your form's structure. All existing elements will be replaced."
							: "Paste the JSON output from ChatGPT here. The form will be created automatically." }}
					</p>
					<textarea
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
					<div
						v-if="error"
						class="mt-4 rounded-lg bg-red-50 p-4"
					>
						<div class="flex items-start gap-3">
							<Icon
								name="heroicons:exclamation-circle"
								class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
							/>
							<p class="text-sm text-red-700">{{ error }}</p>
						</div>
					</div>

					<!-- Submit button -->
					<UiButton
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
					</UiButton>
				</div>
			</div>
		</main>
	</div>
</template>
