<template>
	<UiSidebar side="right" collapsible="icon" id="management-panel-sidebar">
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

		<UiSidebarContent class="group-data-[collapsible=icon]:mt-7">
			<UiSidebarGroup>
				<UiSidebarGroupLabel class="sidebar-group-label">ניווט</UiSidebarGroupLabel>
				<UiSidebarGroupContent>
					<UiSidebarMenu>
						<UiSidebarMenuItem v-for="item in mainNavItems" :key="item.to">
							<UiSidebarMenuButton
								as-child
								:is-active="isActive(item.to)"
								size="lg"
								:tooltip="item.label"
							>
								<NuxtLink
									:to="item.to"
									:class="sidebarItemClasses"
									exact-active-class="text-primary! bg-primary/5!"
								>
									<Icon :name="item.icon" class="text-lg shrink-0" />
									<span class="text-base sidebar-item-label">
										{{ item.label }}
									</span>
								</NuxtLink>
							</UiSidebarMenuButton>
						</UiSidebarMenuItem>
					</UiSidebarMenu>
				</UiSidebarGroupContent>
			</UiSidebarGroup>

			<UiSidebarGroup>
				<UiSidebarGroupLabel class="sidebar-group-label">פעולות</UiSidebarGroupLabel>
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
								<NuxtLink :to="item.to!" :class="sidebarItemClasses">
									<Icon :name="item.icon" class="text-lg shrink-0" />
									<span class="text-base sidebar-item-label">
										{{ item.label }}
									</span>
								</NuxtLink>
							</UiSidebarMenuButton>
							<UiSidebarMenuButton
								v-else
								disabled
								size="lg"
								:tooltip="item.label"
								:class="sidebarItemClasses"
								class="opacity-50 cursor-not-allowed"
							>
								<Icon :name="item.icon" class="text-lg shrink-0" />
								<span class="text-base sidebar-item-label">
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
				<NuxtLink to="/manage/user" :class="sidebarItemClasses">
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
				<NuxtLink to="/manage/user">
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

	const sidebarItemClasses =
		"sidebar-item group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:my-1 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!";

	const mainNavItems = [
		{ label: "ניהול טפסים", to: "/manage/", icon: "heroicons:document-text" },
		{
			label: "טפסים ששותפו איתי",
			to: "/manage/forms/shared",
			icon: "heroicons:users",
		},
		{
			label: "הגשות",
			to: `/manage/submissions/user/${user.value?.id}`,
			icon: "heroicons:inbox-stack",
		},
		{ label: "דוחות", to: "/manage/reports", icon: "heroicons:chart-bar" },
		{ label: "ניהול משתמש", to: "/manage/user", icon: "heroicons:user-circle" },
	];

	const actionItems = [
		{
			label: "יצירת טופס חדש",
			to: "/manage/form/new",
			icon: "heroicons:document-plus",
			disabled: false,
		},
		{
			label: "טופס חדש מ-JSON",
			to: "/manage/form/upload",
			icon: "heroicons:code-bracket",
			disabled: false,
		},
	];

	const isActive = (to: string) =>
		route.path === to || (to !== "/manage" && route.path.startsWith(to));

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		navigateTo("/login");
	}
</script>

<style>
	/** Sidebar collapsed width */
	[data-slot="sidebar-wrapper"] {
		--sidebar-width-icon: 3.5rem !important;
	}
</style>

<style scoped lang="css">
	.sidebar-group-label {
		transition: opacity 200ms linear;
	}

	.sidebar-item {
		transition: width 200ms linear;
	}
	[data-collapsible="icon"] .sidebar-item .iconify {
		transform: translateX(-3px);
	}

	.sidebar-item-label {
		transition: opacity 200ms linear;
	}

	[data-collapsible="icon"] .sidebar-item-label {
		display: flex;
		opacity: 0;
		width: 0;
	}
</style>
