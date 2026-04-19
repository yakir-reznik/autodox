<script setup lang="ts">
useHead({ title: "דוחות - Autodox" });
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<header class="bg-white shadow relative z-10">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center gap-4">
					<NuxtLink to="/">
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</BaseButton>
					</NuxtLink>
					<h1 class="text-2xl font-bold text-gray-900">דוחות</h1>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<NuxtLink to="/admin/reports/submissions-by-externalId">
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
	</div>
</template>
