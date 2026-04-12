<script setup lang="ts">
	type Props = {
		formDefaults: {
			password: string | null;
			webhookUrl: string | null;
			webhookIncludePdf: boolean;
		};
	};

	defineProps<Props>();

	const overridePassword = defineModel<boolean>("overridePassword", { default: false });
	const passwordValue = defineModel<string>("passwordValue", { default: "" });
	const overrideWebhookUrl = defineModel<boolean>("overrideWebhookUrl", { default: false });
	const webhookUrlValue = defineModel<string>("webhookUrlValue", { default: "" });
	const overrideWebhookPdf = defineModel<boolean>("overrideWebhookPdf", { default: false });
	const webhookPdfValue = defineModel<boolean>("webhookPdfValue", { default: false });

	const showOverrides = ref(false);
</script>

<template>
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
						formDefaults.password ? `ברירת מחדל: ${formDefaults.password}` : 'ללא סיסמה'
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
					:placeholder="formDefaults.webhookUrl || 'https://example.com/webhook'"
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
</template>
