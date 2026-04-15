<template>
	<div v-if="entrances.length > 0" class="mb-8 overflow-hidden rounded-lg bg-white shadow">
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-3">
			<h2 class="text-lg font-medium text-gray-900">
				Form Entrances ({{ entrances.length }})
			</h2>
		</div>
		<div class="relative">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b border-gray-200 bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-700">
								Entrance #
							</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-700">
								Date & Time
							</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-700">
								Device Type
							</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-700">
								Browser
							</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-700">
								OS
							</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-700">
								IP Address
							</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-700">
								Country
							</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-700">
								New Session
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						<tr
							v-for="(entrance, index) in visibleEntrances"
							:key="entrance.id"
							class="hover:bg-gray-50"
						>
							<td class="px-4 py-3 text-sm text-gray-900">#{{ index + 1 }}</td>
							<td class="px-4 py-3 text-sm text-gray-600">
								{{ formatDate(entrance.timestamp) }}
							</td>
							<td class="px-4 py-3 text-center text-sm text-gray-600">
								<span
									class="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
								>
									{{ deviceTypeLabels[entrance.deviceType] }}
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-gray-600">
								{{ entrance.browserName ?? "-" }}
							</td>
							<td class="px-4 py-3 text-sm text-gray-600">
								{{ entrance.osName ?? "-" }}
							</td>
							<td class="px-4 py-3 text-center text-sm">
								<code
									v-if="entrance.ipAddress"
									class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700"
								>
									{{ entrance.ipAddress }}
								</code>
								<span v-else class="text-gray-400">-</span>
							</td>
							<td class="px-4 py-3 text-center text-sm text-gray-600">
								{{ entrance.country ?? "-" }}
							</td>
							<td class="px-4 py-3 text-center text-sm">
								<Icon
									v-if="entrance.isNewSession"
									name="heroicons:check-circle"
									class="mx-auto h-5 w-5 text-green-600"
								/>
								<Icon
									v-else
									name="heroicons:x-circle"
									class="mx-auto h-5 w-5 text-gray-400"
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div
				v-if="entrances.length > ENTRANCES_LIMIT && !isEntrancesExpanded"
				class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
			/>
		</div>
		<button
			v-if="entrances.length > ENTRANCES_LIMIT"
			class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
			@click="isEntrancesExpanded = !isEntrancesExpanded"
		>
			{{
				isEntrancesExpanded
					? "הצג פחות"
					: `הצג עוד (${entrances.length - ENTRANCES_LIMIT} כניסות נוספות)`
			}}
		</button>
	</div>
</template>

<script setup lang="ts">
	type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

	type FormEntrance = {
		id: number;
		sessionToken: string | null;
		formId: number;
		ipAddress: string | null;
		userAgent: string | null;
		referrer: string | null;
		isFormLocked: boolean;
		isNewSession: boolean;
		country: string | null;
		deviceType: DeviceType;
		browserName: string | null;
		osName: string | null;
		metadata: Record<string, unknown>;
		timestamp: string;
		createdAt: string;
	};

	const props = defineProps<{
		entrances: FormEntrance[];
	}>();

	const ENTRANCES_LIMIT = 5;
	const isEntrancesExpanded = ref(false);

	const visibleEntrances = computed(() =>
		isEntrancesExpanded.value ? props.entrances : props.entrances.slice(0, ENTRANCES_LIMIT),
	);

	const deviceTypeLabels: Record<DeviceType, string> = {
		mobile: "Mobile",
		tablet: "Tablet",
		desktop: "Desktop",
		unknown: "Unknown",
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			timeZone: "UTC",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}
</script>
