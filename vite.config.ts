import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base keeps the build portable: it works at a domain root, a GitHub
// Pages project path, or opened from any static host. Routing uses hash history.
export default defineConfig({
	base: "./",
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { "@": new URL("./src", import.meta.url).pathname }
	},
	build: {
		target: "es2022",
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (/node_modules\/(\.pnpm\/)?(react|react-dom|scheduler)[@/]/.test(id)) return "react";
					if (/node_modules\/.*(motion|framer-motion|motion-dom|motion-utils)[@/]/.test(id)) return "motion";
					if (id.includes("@tanstack")) return "tanstack";
				}
			}
		}
	}
});
