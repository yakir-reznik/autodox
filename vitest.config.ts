import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 15_000,
		hookTimeout: 15_000,
		// Run test files sequentially to avoid race conditions on shared DB data
		pool: "forks",
		poolOptions: { forks: { singleFork: true } },
	},
})
