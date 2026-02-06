<script setup lang="ts">
interface Feature {
	icon: string;
	title: string;
	desc: string;
	color: string;
	bg: string;
}

defineProps<{
	features: Feature[];
}>();
</script>

<template>
	<!-- ==================== FEATURES ==================== -->
	<section id="features" class="relative bg-gray-50 py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
					הכלים שלך ליצירת טפסים מושלמים
				</h2>
				<p class="mt-4 text-lg leading-relaxed text-gray-500">
					כל מה שצריך כדי לבנות, לשתף ולנתח טפסים מקצועיים
				</p>
			</div>

			<div
				class="reveal stagger mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
			>
				<div
					v-for="(feature, i) in features"
					:key="i"
					class="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
				>
					<div
						:class="[feature.bg, feature.color]"
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
					>
						<Icon :name="feature.icon" class="h-6 w-6" />
					</div>
					<h3 class="text-lg font-bold text-gray-900">{{ feature.title }}</h3>
					<p class="mt-2 text-sm leading-relaxed text-gray-500">
						{{ feature.desc }}
					</p>
				</div>
			</div>
		</div>
	</section>
</template>
