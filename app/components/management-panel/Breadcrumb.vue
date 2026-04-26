<template>
	<div class="flex items-center gap-2">
		<NuxtLink v-if="items.at(-2)?.to" :to="items.at(-2)?.to">
			<UiButton variant="secondary" class="pr-2.5 ml-3">
				<Icon name="heroicons:chevron-right" />
				<span class="text-base">חזרה</span>
			</UiButton>
		</NuxtLink>

		<UiBreadcrumb>
			<UiBreadcrumbList>
				<template v-for="(item, index) in items" :key="index">
					<UiBreadcrumbItem>
						<UiBreadcrumbLink v-if="item.to" :href="item.to">
							{{ item.label }}
						</UiBreadcrumbLink>
						<UiBreadcrumbPage v-else>
							{{ item.label }}
						</UiBreadcrumbPage>
					</UiBreadcrumbItem>
					<UiBreadcrumbSeparator v-if="index < items.length - 1" />
				</template>
			</UiBreadcrumbList>
		</UiBreadcrumb>
	</div>
</template>

<script setup lang="ts">
	const route = useRoute();
	const items = computed(() => route.meta.breadcrumbs ?? []);
</script>
