import type { FormShare, FormSharePermissions, UserSearchResult } from "~~/app/types/form-builder"

export function useFormShares(formId: number) {
	const shares = ref<FormShare[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchShares() {
		loading.value = true
		error.value = null
		try {
			const data = await $fetch<FormShare[]>(`/api/forms/${formId}/shares`)
			shares.value = data
		} catch (e: any) {
			error.value = e.message ?? "שגיאה בטעינת השיתופים"
		} finally {
			loading.value = false
		}
	}

	async function addShare(granteeUserId: number, permissions: FormSharePermissions) {
		const data = await $fetch<FormShare>(`/api/forms/${formId}/shares`, {
			method: "POST",
			body: { granteeUserId, permissions },
		})
		shares.value.push(data)
		return data
	}

	async function updateShare(shareId: number, permissions: FormSharePermissions) {
		const share = shares.value.find((s) => s.id === shareId)
		if (!share) return

		const prev = { ...share.permissions }
		share.permissions = { ...permissions }

		try {
			await $fetch(`/api/forms/${formId}/shares/${shareId}`, {
				method: "PATCH",
				body: { permissions },
			})
		} catch (e) {
			share.permissions = prev
			throw e
		}
	}

	async function removeShare(shareId: number) {
		const idx = shares.value.findIndex((s) => s.id === shareId)
		if (idx === -1) return

		const removed = shares.value.splice(idx, 1)[0]!

		try {
			await $fetch(`/api/forms/${formId}/shares/${shareId}`, { method: "DELETE" })
		} catch (e) {
			shares.value.splice(idx, 0, removed)
			throw e
		}
	}

	async function searchUsers(q: string): Promise<UserSearchResult[]> {
		if (!q.trim()) return []
		return $fetch<UserSearchResult[]>("/api/users/search", { query: { q } })
	}

	fetchShares()

	return { shares, loading, error, addShare, updateShare, removeShare, searchUsers }
}
