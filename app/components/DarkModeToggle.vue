<template>
	<div v-if="!isPrintView" class="dark-mode-toggle">
		<button
			class="toggle-switch"
			:class="{ 'is-dark': isDark }"
			:title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
			@click="toggleDarkMode"
			role="switch"
			:aria-checked="isDark"
			aria-label="Toggle dark mode"
		>
			<!-- Moon icon (left, stationary) -->
			<span class="moon-icon-static">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			</span>

			<!-- Sliding circular button with sun -->
			<span class="slider">
				<svg
					class="sun-icon-slider"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="5" />
					<line x1="12" y1="1" x2="12" y2="3" />
					<line x1="12" y1="21" x2="12" y2="23" />
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
					<line x1="1" y1="12" x2="3" y2="12" />
					<line x1="21" y1="12" x2="23" y2="12" />
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
				</svg>
			</span>
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

// Check current theme from localStorage or system preference
const initTheme = () => {
	// Check localStorage first
	const savedTheme = localStorage.getItem('theme-preference')
	if (savedTheme) {
		isDark.value = savedTheme === 'dark'
		applyTheme(isDark.value)
	} else {
		// Fall back to system preference
		const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		isDark.value = systemDark
		// Don't apply theme here to respect system preference
	}
}

const applyTheme = (dark: boolean) => {
	const html = document.documentElement
	if (dark) {
		html.setAttribute('data-theme', 'dark')
	} else {
		html.setAttribute('data-theme', 'light')
	}
	localStorage.setItem('theme-preference', dark ? 'dark' : 'light')
}

const toggleDarkMode = () => {
	isDark.value = !isDark.value
	applyTheme(isDark.value)
}

onMounted(() => {
	initTheme()
})
</script>

<style scoped>
.dark-mode-toggle {
	position: fixed;
	top: 1rem;
	left: 1rem;
	z-index: 1000;
}

.toggle-switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	width: 5.5rem;
	height: 3rem;
	border-radius: 9999px;
	border: none;
	background-color: rgb(var(--fill-card-bg));
	border: 2px solid rgb(var(--fill-border-default));
	padding: 0.35rem;
	cursor: pointer;
	transition: all var(--transition-base);
	box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

.toggle-switch:hover {
	border-color: rgb(var(--fill-input-border-hover));
	box-shadow: 0 6px 16px rgb(0 0 0 / 0.15);
}

.toggle-switch:focus {
	outline: none;
	box-shadow: 0 0 0 3px rgb(14 165 233 / 0.2), 0 4px 12px rgb(0 0 0 / 0.1);
}

/* Small moon icon on the left */
.moon-icon-static {
	position: absolute;
	left: 0.75rem;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	color: rgb(59 130 246);
	flex-shrink: 0;
}

.moon-icon-static svg {
	width: 1rem;
	height: 1rem;
	stroke: currentColor;
}

/* Large circular slider with sun icon */
.slider {
	position: absolute;
	top: 0.35rem;
	right: 0.35rem;
	width: 2.3rem;
	height: 2.3rem;
	background: linear-gradient(135deg, rgb(234 179 8), rgb(251 146 60));
	border-radius: 9999px;
	transition: all var(--transition-base);
	box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 3;
}

.sun-icon-slider {
	width: 1.25rem;
	height: 1.25rem;
	color: white;
	stroke: currentColor;
}

/* Dark mode: slider moves to left */
.toggle-switch.is-dark .slider {
	right: auto;
	left: 0.35rem;
	background: linear-gradient(135deg, rgb(59 130 246), rgb(99 102 241));
}

/* RTL support */
[dir="rtl"] .dark-mode-toggle {
	left: auto;
	right: 1rem;
}

[dir="rtl"] .moon-icon-static {
	left: auto;
	right: 0.75rem;
}

[dir="rtl"] .slider {
	left: auto;
	right: 0.35rem;
}

[dir="rtl"] .toggle-switch.is-dark .slider {
	left: auto;
	right: 0.35rem;
}

[dir="rtl"] .toggle-switch.is-dark .slider {
	right: auto;
	left: 0.35rem;
}
</style>
