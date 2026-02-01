<script setup lang="ts">
	const { clear } = useUserSession();
	const router = useRouter();
	const toasts = useToasts();

	const { data: profile, refresh } = await useFetch("/api/user/profile");

	// Name editing
	const editingName = ref(false);
	const editName = ref("");
	const savingName = ref(false);

	// Password modal
	const showPasswordModal = ref(false);
	const currentPassword = ref("");
	const newPassword = ref("");
	const passwordError = ref("");
	const savingPassword = ref(false);

	// API key
	const showApiKey = ref(false);
	const showRerollModal = ref(false);
	const rerolling = ref(false);

	// Google disconnect
	const disconnecting = ref(false);

	const formattedCreatedAt = computed(() => {
		if (!profile.value?.createdAt) return "";
		return formatDate(profile.value.createdAt);
	});

	const formattedLastLogin = computed(() => {
		if (!profile.value?.lastLoginAt) return "—";
		return formatDate(profile.value.lastLoginAt);
	});

	const maskedApiKey = computed(() => {
		if (!profile.value?.apiKey) return "";
		if (showApiKey.value) return profile.value.apiKey;
		return "•".repeat(32);
	});

	function startEditName() {
		editName.value = profile.value?.name || "";
		editingName.value = true;
	}

	async function saveName() {
		if (!editName.value.trim()) return;
		savingName.value = true;
		try {
			await $fetch("/api/user/profile", {
				method: "PATCH",
				body: { name: editName.value.trim() },
			});
			editingName.value = false;
			await refresh();
			toasts.add({ title: "השם עודכן בהצלחה", theme: "success" });
		} catch {
			toasts.add({ title: "שגיאה בעדכון השם", theme: "error" });
		} finally {
			savingName.value = false;
		}
	}

	function openPasswordModal() {
		currentPassword.value = "";
		newPassword.value = "";
		passwordError.value = "";
		showPasswordModal.value = true;
	}

	async function changePassword() {
		passwordError.value = "";
		if (newPassword.value.length < 6) {
			passwordError.value = "הסיסמה חייבת להכיל לפחות 6 תווים";
			return;
		}
		savingPassword.value = true;
		try {
			await $fetch("/api/user/change-password", {
				method: "POST",
				body: {
					currentPassword: profile.value?.hasPassword ? currentPassword.value : undefined,
					newPassword: newPassword.value,
				},
			});
			showPasswordModal.value = false;
			await refresh();
			toasts.add({ title: "הסיסמה שונתה בהצלחה", theme: "success" });
		} catch (error: any) {
			passwordError.value = error?.data?.message || "שגיאה בשינוי הסיסמה";
		} finally {
			savingPassword.value = false;
		}
	}

	async function copyApiKey() {
		if (!profile.value?.apiKey) return;
		await navigator.clipboard.writeText(profile.value.apiKey);
		toasts.add({ title: "מפתח API הועתק", theme: "success" });
	}

	async function rerollApiKey() {
		rerolling.value = true;
		try {
			await $fetch("/api/user/reroll-api-key", { method: "POST" });
			showRerollModal.value = false;
			await refresh();
			toasts.add({ title: "מפתח API חודש בהצלחה", theme: "success" });
		} catch {
			toasts.add({ title: "שגיאה בחידוש מפתח API", theme: "error" });
		} finally {
			rerolling.value = false;
		}
	}

	async function disconnectGoogle() {
		disconnecting.value = true;
		try {
			await $fetch("/api/user/disconnect-google", { method: "POST" });
			await refresh();
			toasts.add({ title: "חשבון Google נותק בהצלחה", theme: "success" });
		} catch (error: any) {
			toasts.add({
				title: error?.data?.message || "שגיאה בניתוק חשבון Google",
				theme: "error",
			});
		} finally {
			disconnecting.value = false;
		}
	}

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		router.push("/login");
	}

	useHead({ title: "פרופיל משתמש - Autodox" });
</script>

<template>
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/forms">
							<UiButton variant="outline" size="icon-sm">
								<Icon name="heroicons:arrow-left" class="size-5" />
							</UiButton>
						</NuxtLink>
						<h1 class="text-2xl font-bold text-gray-900">פרופיל משתמש</h1>
					</div>
					<UiButton variant="outline" @click="handleLogout">
						<Icon name="heroicons:arrow-right-on-rectangle" class="size-5" />
						התנתקות
					</UiButton>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="px-4 py-8 sm:px-6 lg:px-8">
			<div v-if="profile" class="mx-auto max-w-3xl space-y-6">
				<!-- Account Info Card -->
				<UiCard class="bg-white border-gray-300">
					<UiCardHeader>
						<UiCardTitle>פרטי חשבון</UiCardTitle>
					</UiCardHeader>
					<UiCardContent class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground"> אימייל </span>
							<span class="text-sm">{{ profile.email }}</span>
						</div>

						<UiSeparator />

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground"> שם תצוגה </span>
							<div v-if="!editingName" class="flex items-center gap-2">
								<span class="text-sm">
									{{ profile.name }}
								</span>
								<UiButton variant="ghost" size="icon-sm" @click="startEditName">
									<Icon name="heroicons:pencil" class="size-4" />
								</UiButton>
							</div>
							<div v-else class="flex items-center gap-2">
								<UiInput
									v-model="editName"
									class="h-8 w-48"
									@keyup.enter="saveName"
									@keyup.escape="editingName = false"
								/>
								<UiButton
									variant="ghost"
									size="icon-sm"
									:disabled="savingName"
									@click="saveName"
								>
									<Icon name="heroicons:check" class="size-4 text-green-600" />
								</UiButton>
								<UiButton
									variant="ghost"
									size="icon-sm"
									@click="editingName = false"
								>
									<Icon name="heroicons:x-mark" class="size-4 text-red-600" />
								</UiButton>
							</div>
						</div>

						<UiSeparator />

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground"> תאריך הרשמה </span>
							<span class="text-sm">
								{{ formattedCreatedAt }}
							</span>
						</div>

						<UiSeparator />

						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground"> התחברות אחרונה </span>
							<span class="text-sm">
								{{ formattedLastLogin }}
							</span>
						</div>
					</UiCardContent>
				</UiCard>

				<!-- Statistics Card -->
				<UiCard class="bg-white border-gray-300">
					<UiCardHeader>
						<UiCardTitle>סטטיסטיקות</UiCardTitle>
					</UiCardHeader>
					<UiCardContent>
						<div class="grid grid-cols-2 gap-4">
							<NuxtLink
								to="/forms"
								class="rounded-md border p-4 text-center transition-colors hover:bg-muted"
							>
								<div class="text-3xl font-bold">
									{{ profile.formCount }}
								</div>
								<div class="mt-1 text-sm text-muted-foreground">טפסים</div>
							</NuxtLink>
							<NuxtLink
								:to="`/submissions/user/${profile.id}`"
								class="rounded-md border p-4 text-center transition-colors hover:bg-muted"
							>
								<div class="text-3xl font-bold">
									{{ profile.submissionCount }}
								</div>
								<div class="mt-1 text-sm text-muted-foreground">הגשות</div>
							</NuxtLink>
						</div>
					</UiCardContent>
				</UiCard>

				<!-- Security Card -->
				<UiCard class="bg-white border-gray-300">
					<UiCardHeader>
						<UiCardTitle>אבטחה</UiCardTitle>
					</UiCardHeader>
					<UiCardContent class="space-y-6">
						<!-- Password -->
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm font-medium">סיסמה</div>
								<div class="text-sm text-muted-foreground">
									{{
										profile.hasPassword
											? "שנה את הסיסמה שלך"
											: "הגדר סיסמה לחשבון"
									}}
								</div>
							</div>
							<UiButton variant="outline" @click="openPasswordModal">
								{{ profile.hasPassword ? "שינוי סיסמה" : "הגדרת סיסמה" }}
							</UiButton>
						</div>

						<UiSeparator />

						<!-- API Key -->
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<div>
									<div class="text-sm font-medium">מפתח API</div>
									<div class="text-sm text-muted-foreground">
										משמש לגישה ל-API של המערכת
									</div>
								</div>
								<UiButton
									variant="destructive"
									size="sm"
									@click="showRerollModal = true"
								>
									<Icon name="heroicons:arrow-path" class="size-4" />
									חידוש מפתח
								</UiButton>
							</div>
							<div class="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
								<code class="flex-1 truncate text-sm" dir="ltr">
									{{ maskedApiKey }}
								</code>
								<UiButton
									variant="ghost"
									size="icon-sm"
									@click="showApiKey = !showApiKey"
								>
									<Icon
										:name="showApiKey ? 'heroicons:eye-slash' : 'heroicons:eye'"
										class="size-4"
									/>
								</UiButton>
								<UiButton variant="ghost" size="icon-sm" @click="copyApiKey">
									<Icon name="heroicons:clipboard-document" class="size-4" />
								</UiButton>
							</div>
						</div>
					</UiCardContent>
				</UiCard>

				<!-- Connected Accounts Card -->
				<UiCard class="bg-white border-gray-300">
					<UiCardHeader>
						<UiCardTitle>חשבונות מקושרים</UiCardTitle>
					</UiCardHeader>
					<UiCardContent>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Icon name="mdi:google" class="size-5" />
								<div>
									<div class="text-sm font-medium">Google</div>
									<div class="text-sm text-muted-foreground">
										{{
											profile.googleId
												? "חשבון Google מקושר"
												: "חשבון Google לא מקושר"
										}}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<UiBadge v-if="profile.googleId"> מחובר </UiBadge>
								<UiButton
									v-if="profile.googleId"
									variant="outline"
									size="sm"
									:disabled="!profile.hasPassword || disconnecting"
									@click="disconnectGoogle"
								>
									ניתוק
								</UiButton>
								<NuxtLink v-else to="/auth/google">
									<UiButton variant="outline" size="sm"> חיבור </UiButton>
								</NuxtLink>
							</div>
						</div>
						<p
							v-if="profile.googleId && !profile.hasPassword"
							class="mt-2 text-xs text-muted-foreground"
						>
							יש להגדיר סיסמה לפני ניתוק חשבון Google
						</p>
					</UiCardContent>
				</UiCard>
			</div>
		</main>

		<!-- Change Password Dialog -->
		<UiDialog v-model:open="showPasswordModal">
			<UiDialogContent class="sm:max-w-md" dir="rtl">
				<UiDialogHeader class="sm:text-right">
					<UiDialogTitle>
						{{ profile?.hasPassword ? "שינוי סיסמה" : "הגדרת סיסמה" }}
					</UiDialogTitle>
					<UiDialogDescription>
						{{
							profile?.hasPassword
								? "הזן את הסיסמה הנוכחית והסיסמה החדשה"
								: "הזן סיסמה חדשה לחשבון"
						}}
					</UiDialogDescription>
				</UiDialogHeader>
				<div class="space-y-4">
					<div v-if="profile?.hasPassword" class="space-y-2">
						<UiLabel>סיסמה נוכחית</UiLabel>
						<UiInput
							v-model="currentPassword"
							type="password"
							placeholder="הזן סיסמה נוכחית"
						/>
					</div>
					<div class="space-y-2">
						<UiLabel>סיסמה חדשה</UiLabel>
						<UiInput
							v-model="newPassword"
							type="password"
							placeholder="מינימום 6 תווים"
							@keyup.enter="changePassword"
						/>
					</div>
					<p v-if="passwordError" class="text-sm text-destructive">
						{{ passwordError }}
					</p>
				</div>
				<UiDialogFooter>
					<UiButton variant="outline" @click="showPasswordModal = false">
						ביטול
					</UiButton>
					<UiButton :disabled="savingPassword" @click="changePassword">
						{{ savingPassword ? "שומר..." : "שמירה" }}
					</UiButton>
				</UiDialogFooter>
			</UiDialogContent>
		</UiDialog>

		<!-- Reroll API Key Confirmation Dialog -->
		<UiDialog v-model:open="showRerollModal">
			<UiDialogContent class="sm:max-w-md" dir="rtl">
				<UiDialogHeader class="sm:text-right">
					<UiDialogTitle>חידוש מפתח API</UiDialogTitle>
					<UiDialogDescription>
						פעולה זו תיצור מפתח API חדש. המפתח הנוכחי יפסיק לעבוד מיד.
					</UiDialogDescription>
				</UiDialogHeader>
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					שים לב: כל השירותים והאינטגרציות המשתמשים במפתח הנוכחי יפסיקו לעבוד.
				</div>
				<UiDialogFooter>
					<UiButton variant="outline" @click="showRerollModal = false"> ביטול </UiButton>
					<UiButton variant="destructive" :disabled="rerolling" @click="rerollApiKey">
						{{ rerolling ? "מחדש..." : "חידוש מפתח" }}
					</UiButton>
				</UiDialogFooter>
			</UiDialogContent>
		</UiDialog>
	</div>
</template>
