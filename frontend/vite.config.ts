import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom", // imitates browser environment
    globals: true, // describe/it/expect without import 
    setupFiles: "./src/tests/setupTests.ts",
  },
});
