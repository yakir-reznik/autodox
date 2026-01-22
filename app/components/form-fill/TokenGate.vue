<script setup lang="ts">
interface Props {
	formTitle: string;
	formDescription?: string | null;
}

defineProps<Props>();
</script>

<template>
	<div class="grid min-h-screen place-items-center form-fill-container">
		<div class="form-fill-card w-full max-w-md p-8">
			<!-- Lock icon -->
			<div class="mb-6 text-center">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
					<Icon name="heroicons:link" class="h-8 w-8 text-amber-600" />
				</div>
			</div>

			<!-- Title -->
			<h1 class="form-fill-title mb-2 text-center text-xl">
				{{ formTitle }}
			</h1>
			<p v-if="formDescription" class="form-fill-description mb-4 text-center">
				{{ formDescription }}
			</p>

			<!-- Message -->
			<div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
				<p class="text-amber-800 font-medium mb-1">
					טופס זה דורש קישור אישי
				</p>
				<p class="text-amber-700 text-sm">
					על מנת למלא טופס זה, יש לקבל קישור אישי מבעל הטופס.
				</p>
			</div>
		</div>
	</div>
</template>
