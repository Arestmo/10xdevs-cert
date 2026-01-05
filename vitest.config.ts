import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	test: {
		// Use jsdom environment for DOM testing
		environment: 'jsdom',

		// Enable global test APIs (describe, it, expect, etc.)
		globals: true,

		// Setup files to run before tests
		setupFiles: ['./src/tests/setup.ts'],

		// Coverage configuration with v8 provider
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'node_modules/',
				'src/tests/',
				'**/*.config.{js,ts,mjs}',
				'**/types.ts',
				'**/*.d.ts',
				'dist/',
				'.astro/',
			],
			// Uncomment to enforce coverage thresholds
			// thresholds: {
			//   lines: 80,
			//   functions: 80,
			//   branches: 80,
			//   statements: 80,
			// },
		},

		// Include test files
		include: ['src/**/*.{test,spec}.{ts,tsx}'],

		// Exclude patterns
		exclude: ['node_modules', 'dist', '.astro', 'e2e'],
	},

	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
