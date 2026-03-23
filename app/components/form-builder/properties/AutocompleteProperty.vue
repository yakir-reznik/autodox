<script setup lang="ts">
	import { ConfigProvider } from "reka-ui";
	import { Check, ChevronsUpDown } from "lucide-vue-next";

	const props = defineProps<{
		modelValue?: string;
	}>();

	const emit = defineEmits<{
		"update:modelValue": [value: string | undefined];
	}>();

	const open = ref(false);

	const groups = [
		{
			heading: "שם",
			options: [
				{ value: "name", label: "שם מלא" },
				{ value: "given-name", label: "שם פרטי" },
				{ value: "family-name", label: "שם משפחה" },
				{ value: "additional-name", label: "שם אמצעי" },
				{ value: "honorific-prefix", label: "תואר קידומת" },
				{ value: "honorific-suffix", label: "תואר סיומת" },
				{ value: "nickname", label: "כינוי" },
			],
		},
		{
			heading: "חשבון",
			options: [
				{ value: "username", label: "שם משתמש" },
				{ value: "email", label: "אימייל" },
				{ value: "new-password", label: "סיסמה חדשה" },
				{ value: "current-password", label: "סיסמה נוכחית" },
				{ value: "one-time-code", label: "קוד חד פעמי" },
			],
		},
		{
			heading: "ארגון",
			options: [
				{ value: "organization", label: "ארגון" },
				{ value: "organization-title", label: "תפקיד בארגון" },
			],
		},
		{
			heading: "כתובת",
			options: [
				{ value: "street-address", label: "רחוב" },
				{ value: "address-line1", label: "שורת כתובת 1" },
				{ value: "address-line2", label: "שורת כתובת 2" },
				{ value: "address-line3", label: "שורת כתובת 3" },
				{ value: "address-level1", label: "מחוז/אזור" },
				{ value: "address-level2", label: "עיר" },
				{ value: "address-level3", label: "שכונה" },
				{ value: "address-level4", label: "רובע" },
				{ value: "country", label: "קוד מדינה" },
				{ value: "country-name", label: "שם מדינה" },
				{ value: "postal-code", label: "מיקוד" },
			],
		},
		{
			heading: "טלפון",
			options: [
				{ value: "tel", label: "טלפון" },
				{ value: "tel-country-code", label: "קידומת מדינה" },
				{ value: "tel-national", label: "מספר ארצי" },
				{ value: "tel-area-code", label: "קידומת אזור" },
				{ value: "tel-local", label: "מספר מקומי" },
				{ value: "tel-extension", label: "שלוחה" },
			],
		},
		{
			heading: "כרטיס אשראי",
			options: [
				{ value: "cc-name", label: "שם בעל הכרטיס" },
				{ value: "cc-number", label: "מספר כרטיס" },
				{ value: "cc-exp", label: "תוקף כרטיס" },
				{ value: "cc-exp-month", label: "חודש תוקף" },
				{ value: "cc-exp-year", label: "שנת תוקף" },
				{ value: "cc-csc", label: "קוד אבטחה (CVV)" },
				{ value: "cc-type", label: "סוג כרטיס" },
			],
		},
		{
			heading: "תאריך לידה",
			options: [
				{ value: "bday", label: "תאריך לידה" },
				{ value: "bday-day", label: "יום לידה" },
				{ value: "bday-month", label: "חודש לידה" },
				{ value: "bday-year", label: "שנת לידה" },
			],
		},
		{
			heading: "אחר",
			options: [
				{ value: "sex", label: "מין" },
				{ value: "language", label: "שפה" },
				{ value: "url", label: "כתובת URL" },
				{ value: "photo", label: "תמונה" },
				{ value: "impp", label: "כתובת מסרים" },
				{ value: "transaction-currency", label: "מטבע עסקה" },
				{ value: "transaction-amount", label: "סכום עסקה" },
			],
		},
	];

	const selectedLabel = computed(() => {
		if (!props.modelValue) return "ללא";
		for (const group of groups) {
			const found = group.options.find((o) => o.value === props.modelValue);
			if (found) return found.label;
		}
		return props.modelValue;
	});

	function select(value: string) {
		emit("update:modelValue", value || undefined);
		open.value = false;
	}
</script>

<template>
	<ConfigProvider dir="rtl">
		<UiPopover v-model:open="open" class="">
			<UiPopoverTrigger as-child>
				<button
					type="button"
					role="combobox"
					:aria-expanded="open"
					class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
				>
					{{ selectedLabel }}
					<ChevronsUpDown class="mr-auto h-4 w-4 shrink-0 opacity-50" />
				</button>
			</UiPopoverTrigger>
			<UiPopoverContent class="w-[--reka-popover-trigger-width]! p-0 shadow-lg">
				<UiCommand>
					<UiCommandInput placeholder="חיפוש..." />
					<UiCommandList>
						<UiCommandEmpty>לא נמצאו תוצאות</UiCommandEmpty>
						<UiCommandGroup>
							<UiCommandItem
								value="ללא"
								:class="!modelValue ? 'bg-primary/10' : ''"
								@select="select('')"
							>
								<Check
									class="h-4 w-4 text-primary"
									:class="!modelValue ? 'opacity-100' : 'opacity-0'"
								/>
								ללא
							</UiCommandItem>
						</UiCommandGroup>
						<UiCommandGroup
							v-for="group in groups"
							:key="group.heading"
							:heading="group.heading"
						>
							<UiCommandItem
								v-for="opt in group.options"
								:key="opt.value"
								:value="opt.label"
								:class="modelValue === opt.value ? 'bg-primary/10' : ''"
								@select="select(opt.value)"
							>
								<Check
									class="h-4 w-4 text-primary"
									:class="modelValue === opt.value ? 'opacity-100' : 'opacity-0'"
								/>
								{{ opt.label }}
								<span class="mr-auto text-xs text-gray-400">{{ opt.value }}</span>
							</UiCommandItem>
						</UiCommandGroup>
					</UiCommandList>
				</UiCommand>
			</UiPopoverContent>
		</UiPopover>
	</ConfigProvider>
</template>
