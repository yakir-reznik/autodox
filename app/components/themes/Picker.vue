<script setup lang="ts">
import { SelectItem, SelectItemText, SelectItemIndicator } from "reka-ui";
import { Check } from "lucide-vue-next";

type ThemeOption = { id: string; title: string; description: string; colors: readonly string[] };
const props = withDefaults(defineProps<{ modelValue: string; themes: readonly ThemeOption[]; placeholder?: string; disabled?: boolean; id?: string }>(), { placeholder: "בחרו ערכת עיצוב", disabled: false });
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const selectedTheme = computed(() => props.themes.find((theme) => theme.id === props.modelValue));
</script>

<template>
	<UiSelect :disabled="disabled" :model-value="modelValue" dir="rtl" @update:model-value="emit('update:modelValue', String($event))">
		<UiSelectTrigger :id="id" aria-label="ערכת נושא" class="w-full">
			<div class="flex items-center gap-2">
				<span>{{ selectedTheme?.title || placeholder }}</span>
				<div class="flex gap-0.5">
					<div v-for="(color, index) in selectedTheme?.colors" :key="index" :style="{ background: color }" class="h-3.5 w-3.5 rounded-sm border border-black/10" />
				</div>
			</div>
		</UiSelectTrigger>
		<UiSelectContent>
			<SelectItem v-for="theme in themes" :key="theme.id" :value="theme.id" class="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-start rounded-sm py-2 pr-8 pl-2 outline-none data-disabled:pointer-events-none data-disabled:opacity-50">
				<span class="absolute right-2 mt-0.5 flex size-3.5 items-center justify-center">
					<SelectItemIndicator><Check class="size-4" /></SelectItemIndicator>
				</span>
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2">
						<SelectItemText class="text-sm font-medium">{{ theme.title }}</SelectItemText>
						<div class="flex gap-0.5">
							<div v-for="(color, index) in theme.colors" :key="index" :style="{ background: color }" class="h-3.5 w-3.5 rounded-sm border border-black/10" />
						</div>
					</div>
					<p class="text-muted-foreground line-clamp-2 text-xs">{{ theme.description }}</p>
				</div>
			</SelectItem>
		</UiSelectContent>
	</UiSelect>
</template>
