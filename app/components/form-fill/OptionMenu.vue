<template>
	<UiPopover>
		<UiPopoverTrigger as-child>
			<UiButton variant="outline" size="sm" class="gap-1.5">
				<MoreVertical class="w-4 h-4" />
				אפשרויות
			</UiButton>
		</UiPopoverTrigger>
		<UiPopoverContent align="start" :side-offset="8" class="w-52 p-3">
			<div class="space-y-3">
				<!-- Design section -->
				<div class="space-y-1.5">
					<p class="text-xs font-medium text-muted-foreground">עיצוב</p>
					<div class="grid grid-cols-3 gap-1">
						<UiButton
							v-for="option in themeOptions"
							:key="option.value"
							:variant="mode === option.value ? 'default' : 'ghost'"
							size="sm"
							class="flex flex-col items-center gap-1 h-auto py-2"
							@click="mode = option.value"
						>
							<component :is="option.icon" class="w-4 h-4" />
							<span class="text-xs">{{ option.label }}</span>
						</UiButton>
					</div>
				</div>
			</div>
		</UiPopoverContent>
	</UiPopover>
</template>

<script setup lang="ts">
	import { useColorMode, type BasicColorSchema } from "@vueuse/core";
	import { MoreVertical, Sun, Moon, Monitor } from "lucide-vue-next";

	const mode = useColorMode({ emitAuto: true });

	const themeOptions: { value: BasicColorSchema; label: string; icon: unknown }[] = [
		{ value: "light", label: "בהיר", icon: Sun },
		{ value: "auto", label: "אוטו", icon: Monitor },
		{ value: "dark", label: "כהה", icon: Moon },
	];
</script>
