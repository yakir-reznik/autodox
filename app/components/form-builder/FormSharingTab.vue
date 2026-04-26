<template>
	<div class="flex flex-col gap-4 min-h-60">
		<h4 class="text-sm text-foreground -mb-2">מתן גישה למשתמש:</h4>
		<FormBuilderFormShareUserPicker :exclude-ids="existingUserIds" @select="onUserSelect" />

		<UiSeparator class="mt-2 mb-1" />

		<div v-if="loading" class="text-sm text-gray-500">טוען...</div>
		<div v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</div>
		<div v-else-if="draftShares.length === 0" class="text-sm text-gray-400">
			הטופס לא משותף עם אף משתמש.
		</div>
		<div v-else class="flex flex-col gap-2">
			<h4 class="text-sm text-foreground">משתמשים שקיבלו גישה לטופס:</h4>
			<TransitionGroup name="fade">
				<FormBuilderFormShareRow
					v-for="share in draftShares"
					:key="share.draftId"
					:share="share"
					@update:permissions="(p) => onUpdatePermissions(share.draftId, p)"
					@remove="onRemove(share.draftId)"
				/>
			</TransitionGroup>
		</div>

		<p v-if="saveError" class="text-sm text-red-600">{{ saveError }}</p>
	</div>
</template>

<script setup lang="ts">
	import type {
		FormShare,
		DraftShare,
		FormSharePermissions,
		UserSearchResult,
	} from "~~/app/types/form-builder";

	const props = defineProps<{ formId: number }>();

	const loading = ref(false);
	const loadError = ref<string | null>(null);
	const saveError = ref<string | null>(null);
	const saving = ref(false);

	const originalShares = ref<FormShare[]>([]);
	const draftShares = ref<DraftShare[]>([]);

	const existingUserIds = computed(() => draftShares.value.map((s) => s.granteeUserId));

	async function fetchShares() {
		loading.value = true;
		loadError.value = null;
		try {
			const data = await $fetch<FormShare[]>(`/api/forms/${props.formId}/shares`);
			originalShares.value = data;
			draftShares.value = data.map((s) => ({
				draftId: String(s.id),
				shareId: s.id,
				granteeUserId: s.granteeUserId,
				granteeEmail: s.granteeEmail,
				granteeName: s.granteeName,
				permissions: { ...s.permissions },
			}));
		} catch (e: any) {
			loadError.value = e.data?.message ?? "שגיאה בטעינת השיתופים";
		} finally {
			loading.value = false;
		}
	}

	function onUserSelect(user: UserSearchResult) {
		draftShares.value.push({
			draftId: `new-${Date.now()}`,
			shareId: null,
			granteeUserId: user.id,
			granteeEmail: user.email,
			granteeName: user.name,
			permissions: {
				canViewSubmissions: true,
				canCreateSubmissions: false,
				canManageSubmissions: false,
				canEditForm: false,
			},
		});
	}

	function onUpdatePermissions(draftId: string, permissions: FormSharePermissions) {
		const share = draftShares.value.find((s) => s.draftId === draftId);
		if (share) share.permissions = permissions;
	}

	function onRemove(draftId: string) {
		draftShares.value = draftShares.value.filter((s) => s.draftId !== draftId);
	}

	async function save(): Promise<boolean> {
		saving.value = true;
		saveError.value = null;
		try {
			const draftShareIds = new Set(
				draftShares.value.filter((s) => s.shareId != null).map((s) => s.shareId!),
			);

			const deletions = originalShares.value.filter((s) => !draftShareIds.has(s.id));
			const additions = draftShares.value.filter((s) => s.shareId == null);
			const updates = draftShares.value.filter((s) => {
				if (s.shareId == null) return false;
				const orig = originalShares.value.find((o) => o.id === s.shareId);
				return orig && JSON.stringify(orig.permissions) !== JSON.stringify(s.permissions);
			});

			await Promise.all([
				...deletions.map((s) =>
					$fetch(`/api/forms/${props.formId}/shares/${s.id}`, { method: "DELETE" }),
				),
				...additions.map((s) =>
					$fetch(`/api/forms/${props.formId}/shares`, {
						method: "POST",
						body: { granteeUserId: s.granteeUserId, permissions: s.permissions },
					}),
				),
				...updates.map((s) =>
					$fetch(`/api/forms/${props.formId}/shares/${s.shareId}`, {
						method: "PATCH",
						body: { permissions: s.permissions },
					}),
				),
			]);

			await fetchShares();
			return true;
		} catch (e: any) {
			saveError.value = e.data?.message ?? "שגיאה בשמירה";
			return false;
		} finally {
			saving.value = false;
		}
	}

	fetchShares();

	defineExpose({ save, saving });
</script>
