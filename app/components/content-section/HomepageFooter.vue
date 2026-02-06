<template>
	<!-- ==================== FOOTER ==================== -->
	<footer class="border-t border-slate-800 bg-slate-950 py-8">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<div class="flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-700"
					>
						<Icon name="ph:stack-fill" class="h-4 w-4 text-white" />
					</div>
					<span class="text-sm font-semibold text-white">Autodox</span>
				</div>
				<div class="flex gap-6 text-sm text-slate-500">
					<a href="#" class="transition-colors hover:text-slate-300">תנאי שימוש</a>
					<a href="#" class="transition-colors hover:text-slate-300">פרטיות</a>
					<a href="#" class="transition-colors hover:text-slate-300">צור קשר</a>
				</div>
				<p class="text-sm text-slate-500">
					&copy; {{ new Date().getFullYear() }} Autodox. כל הזכויות שמורות.
				</p>
			</div>
		</div>
	</footer>
</template>
