<template>
	<main class="">
		<div class="grid gap-6 grid-cols-3">
			<NuxtLink to="/manage/reports/submissions-by-externalId">
				<UiCard class="cursor-pointer hover:shadow-md transition-shadow">
					<UiCardHeader>
						<UiCardTitle class="flex items-center gap-2">
							<Icon name="heroicons:table-cells" class="h-5 w-5 text-blue-500" />
							הגשות לפי מזהה חיצוני
						</UiCardTitle>
						<UiCardDescription>
							סיכום הגשות לפי טופס ומזהה חיצוני, מפולח לפי סטטוס ותאריך
						</UiCardDescription>
					</UiCardHeader>
				</UiCard>
			</NuxtLink>
		</div>
	</main>
</template>

<script setup lang="ts">
	useHead({ title: "דוחות - Autodox" });
	definePageMeta({
		layout: "management-panel",
		heading: "דו״חות",
		breadcrumbs: [
			{
				label: "ניהול טפסים",
				to: "/manage",
			},
			{
				label: "דוח״ות",
			},
		],
	});
</script>
