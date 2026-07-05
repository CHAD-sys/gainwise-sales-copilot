import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ragApiPlugin } from "./server/api.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env (all keys, no VITE_ prefix required) for the server-side RAG API.
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

  return {
    plugins: [react(), tailwindcss(), ragApiPlugin(apiKey)],
  };
});
