import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
	plugins: [
		glsl({
			include: /\.(glsl|vs|fs|vert|frag)$/,
			compress: false,
			defaultExtension: "glsl",
		}),
	],
	root: "app",
	publicDir: "../public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
	server: {
		port: 9966,
	},
});
