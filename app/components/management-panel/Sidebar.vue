<template>
	<UiSidebar side="right" collapsible="icon">
		<UiSidebarHeader>
			<div
				class="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden"
			>
				<div class="flex items-center gap-2">
					<div
						class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600"
					>
						<Icon name="ph:stack-fill" class="size-4 text-white" />
					</div>
					<span class="text-xl font-bold">Autodox</span>
				</div>
				<UiSidebarTrigger class="-me-1 shrink-0" />
			</div>
			<div class="hidden group-data-[collapsible=icon]:flex justify-center py-1">
				<UiSidebarTrigger />
			</div>
		</UiSidebarHeader>

		<UiSidebarContent>
			<UiSidebarGroup>
				<UiSidebarGroupLabel>ניווט</UiSidebarGroupLabel>
				<UiSidebarGroupContent>
					<UiSidebarMenu>
						<UiSidebarMenuItem v-for="item in mainNavItems" :key="item.to">
							<UiSidebarMenuButton
								as-child
								:is-active="isActive(item.to)"
								size="lg"
								:tooltip="item.label"
							>
								<NuxtLink :to="item.to">
									<Icon :name="item.icon" class="text-lg shrink-0" />
									<span class="text-base group-data-[collapsible=icon]:hidden">
										{{ item.label }}
									</span>
								</NuxtLink>
							</UiSidebarMenuButton>
						</UiSidebarMenuItem>
					</UiSidebarMenu>
				</UiSidebarGroupContent>
			</UiSidebarGroup>

			<UiSidebarGroup>
				<UiSidebarGroupLabel>פעולות</UiSidebarGroupLabel>
				<UiSidebarGroupContent>
					<UiSidebarMenu>
						<UiSidebarMenuItem v-for="item in actionItems" :key="item.label">
							<UiSidebarMenuButton
								v-if="!item.disabled"
								as-child
								:is-active="isActive(item.to!)"
								size="lg"
								:tooltip="item.label"
							>
								<NuxtLink :to="item.to!">
									<Icon :name="item.icon" class="text-lg shrink-0" />
									<span class="text-base group-data-[collapsible=icon]:hidden">
										{{ item.label }}
									</span>
								</NuxtLink>
							</UiSidebarMenuButton>
							<UiSidebarMenuButton
								v-else
								disabled
								size="lg"
								:tooltip="item.label"
								class="opacity-50 cursor-not-allowed"
							>
								<Icon :name="item.icon" class="text-lg shrink-0" />
								<span class="text-base group-data-[collapsible=icon]:hidden">
									{{ item.label }}
								</span>
							</UiSidebarMenuButton>
						</UiSidebarMenuItem>
					</UiSidebarMenu>
				</UiSidebarGroupContent>
			</UiSidebarGroup>
		</UiSidebarContent>

		<UiSidebarFooter>
			<div
				class="rounded-lg bg-muted p-3 flex flex-col gap-2 group-data-[collapsible=icon]:hidden"
			>
				<NuxtLink to="/user">
					<div class="flex items-center gap-2">
						<div
							class="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-white text-sm font-semibold"
						>
							{{ user?.name?.charAt(0) ?? "?" }}
						</div>
						<div class="flex flex-col min-w-0">
							<span class="text-base font-medium truncate">{{ user?.name }}</span>
							<span class="text-sm text-muted-foreground truncate">{{
								user?.email
							}}</span>
						</div>
					</div>
				</NuxtLink>
				<div class="flex items-center justify-start">
					<UiButton
						variant="default"
						size="sm"
						@click="handleLogout"
						class="mr-10 bg-foreground"
					>
						<span>התנתקות מהמערכת</span>
						<Icon name="heroicons:arrow-left-start-on-rectangle" class="text-lg" />
					</UiButton>
				</div>
			</div>
			<div class="hidden group-data-[collapsible=icon]:flex justify-center pb-2">
				<NuxtLink to="/user">
					<div
						class="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-violet-600 text-white text-sm font-semibold"
					>
						{{ user?.name?.charAt(0) ?? "?" }}
					</div>
				</NuxtLink>
			</div>
		</UiSidebarFooter>
	</UiSidebar>
</template>

<script setup lang="ts">
	const { user, clear } = useUserSession();
	const route = useRoute();

	const mainNavItems = [
		{ label: "ניהול טפסים", to: "/forms", icon: "heroicons:document-text" },
		{ label: "טפסים משותפים", to: "/forms/shared", icon: "heroicons:users" },
		{ label: "הגשות", to: "/manage/submissions/20", icon: "heroicons:inbox-stack" },
		{ label: "דוחות", to: "/admin/reports", icon: "heroicons:chart-bar" },
		{ label: "ניהול משתמש", to: "/user", icon: "heroicons:user-circle" },
	];

	const actionItems = [
		{
			label: "יצירת טופס חדש",
			to: "/forms/new",
			icon: "heroicons:document-plus",
			disabled: false,
		},
		{ label: "יצירת הגשה חדשה", to: null, icon: "heroicons:plus-circle", disabled: true },
	];

	const isActive = (to: string) =>
		route.path === to || (to !== "/manage" && route.path.startsWith(to));

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		navigateTo("/login");
	}
</script>
