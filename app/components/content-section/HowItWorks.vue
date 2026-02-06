<script setup lang="ts">
defineProps<{
	scrollTo: (id: string) => void;
}>();
</script>

<template>
	<!-- ==================== HOW IT WORKS ==================== -->
	<section id="how-it-works" class="relative bg-white py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
					פשוט. מהיר. יעיל.
				</h2>
				<p class="mt-4 text-lg text-gray-500">שלושה צעדים זה כל מה שצריך</p>
			</div>

			<div class="relative mt-20">
				<div
					class="absolute top-16 right-[16.67%] left-[16.67%] hidden h-0.5 bg-linear-to-l from-blue-200 via-blue-400 to-blue-200 lg:block"
				></div>

				<div class="reveal stagger grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
					<div class="text-center">
						<div
							class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-blue-50"
						>
							<div
								class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25"
							>
								<Icon
									name="ph:plus-circle-fill"
									class="h-9 w-9 text-white"
								/>
							</div>
						</div>
						<span class="text-5xl font-black text-blue-300">01</span>
						<h3 class="mt-2 text-xl font-bold text-gray-900">צור טופס</h3>
						<p class="mt-2 text-gray-500">
							בחר רכיבים, גרור ושחרר, והתאם אישית בקלות
						</p>
					</div>

					<div class="text-center">
						<div
							class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-violet-50"
						>
							<div
								class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/25"
							>
								<Icon name="ph:share-fill" class="h-9 w-9 text-white" />
							</div>
						</div>
						<span class="text-5xl font-black text-violet-300">02</span>
						<h3 class="mt-2 text-xl font-bold text-gray-900">שתף</h3>
						<p class="mt-2 text-gray-500">
							שלח קישור, הטמע באתר, או שתף QR קוד
						</p>
					</div>

					<div class="text-center">
						<div
							class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50"
						>
							<div
								class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25"
							>
								<Icon
									name="ph:chart-line-up-fill"
									class="h-9 w-9 text-white"
								/>
							</div>
						</div>
						<span class="text-5xl font-black text-emerald-300">03</span>
						<h3 class="mt-2 text-xl font-bold text-gray-900">אסוף ונתח</h3>
						<p class="mt-2 text-gray-500">
							צפה בתשובות בזמן אמת וייצא דוחות
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
