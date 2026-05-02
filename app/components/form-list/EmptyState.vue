<template>
	<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
		<Icon :name="iconName" class="mx-auto h-12 w-12 text-gray-400" />
		<h3 class="mt-4 text-lg font-medium text-gray-900">{{ title }}</h3>
		<p class="mt-2 text-gray-500">{{ description }}</p>
		<NuxtLink v-if="!sharedWithMeOnly" to="/manage/form/new" class="mt-6 inline-block">
			<BaseButton variant="primary">
				<Icon name="heroicons:plus" class="h-5 w-5" />
				יצירת טופס
			</BaseButton>
		</NuxtLink>
	</div>
</template>

<script setup lang="ts">
	interface Props {
		sharedWithMeOnly?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		sharedWithMeOnly: false,
	});

	const iconName = computed(() =>
		props.sharedWithMeOnly ? "heroicons:users" : "heroicons:document-plus",
	);

	const title = computed(() => (props.sharedWithMeOnly ? "אין טפסים משותפים" : "אין טפסים"));

	const description = computed(() =>
		props.sharedWithMeOnly
			? "עדיין לא שותפו איתך טפסים."
			: "התחל ליצור את הטופס הראשון שלך.",
	);
</script>

<style lang="sass" scoped></style>
