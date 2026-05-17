import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "@angel-engine/client-napi",
        "better-sqlite3",
        "@anthropic-ai/claude-agent-sdk",
        "@anthropic-ai/claude-agent-sdk/sdk-tools",
      ],
      output: {
        entryFileNames: "main.js",
      },
    },
  },
});
