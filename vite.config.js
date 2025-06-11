import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
	plugins: [glsl()],
	root: "app",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
	server: {
		port: 9966,
	},
});
