import * as THREE from "three";
import fragmentShader from "./fragment.glsl?raw";
import vertexShader from "./vertex.glsl?raw";

export class OutlineMaterial extends THREE.ShaderMaterial {
	constructor(options = {}) {
		const defaults = {
			color: new THREE.Color("#ff0000"), // Red color
			opacity: 1.0,
			outlineWidth: 0.1, // Width of the outline effect
			outlineColor: new THREE.Color("#000000"), // Black outline
		};

		const settings = { ...defaults, ...options };

		const uniforms = {
			color: { value: settings.color },
			opacity: { value: settings.opacity },
			outlineWidth: { value: settings.outlineWidth },
			outlineColor: { value: settings.outlineColor },
		};

		super({
			uniforms,
			vertexShader,
			fragmentShader,
			transparent: settings.opacity < 1.0,
			side: THREE.FrontSide,
		});

		// Store settings for easy access
		this.settings = settings;
	}

	// Helper methods for common operations
	setColor(color) {
		this.uniforms.color.value.set(color);
	}

	setOpacity(opacity) {
		this.uniforms.opacity.value = opacity;
		this.transparent = opacity < 1.0;
	}

	setOutlineWidth(width) {
		this.uniforms.outlineWidth.value = width;
	}

	setOutlineColor(color) {
		this.uniforms.outlineColor.value.set(color);
	}

	// Update multiple properties at once
	updateProperties(properties) {
		Object.entries(properties).forEach(([key, value]) => {
			if (this.uniforms[key]) {
				this.uniforms[key].value = value;
			}
		});
	}
}
