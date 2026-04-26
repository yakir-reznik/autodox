<template>
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
</template>

<script setup lang="ts">
	const route = useRoute();
	const items = computed(() => route.meta.breadcrumbs ?? []);
</script>
