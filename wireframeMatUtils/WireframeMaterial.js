import * as THREE from "three";
import fragmentShader from "./fragment.glsl?raw";
import vertexShader from "./vertex.glsl?raw";
import {
	addBarycentricCoordinates,
	unindexBufferGeometry,
} from "./wireframeGeomtryUtils.js";

export class WireframeMaterial extends THREE.ShaderMaterial {
	constructor(options = {}) {
		const defaults = {
			fill: new THREE.Color("#ffffff"),
			stroke: new THREE.Color("#000000"),
			thickness: 0.01,
			seeThrough: false,
			dashEnabled: false,
			dashRepeats: 2.0,
			dashLength: 0.55,
			dashAnimate: false,
			noiseA: false,
			noiseB: false,
			noiseAIntensity: 5.15,
			noiseBIntensity: 10.12,
			dualStroke: false,
			dualThickness: 0.05,
			squeeze: false,
			squeezeMin: 0.1,
			squeezeMax: 1.0,
			dashOverlap: false,
			insideAltColor: true,
			depthFade: true,
			depthFadeNear: 1.0,
			depthFadeFar: 20.0,
			depthFadeMin: 0.1,
		};

		const settings = { ...defaults, ...options };

		const uniforms = {
			time: { value: 0 },
			fill: { value: settings.fill },
			stroke: { value: settings.stroke },
			thickness: { value: settings.thickness },
			seeThrough: { value: settings.seeThrough },
			dashEnabled: { value: settings.dashEnabled },
			dashRepeats: { value: settings.dashRepeats },
			dashLength: { value: settings.dashLength },
			dashAnimate: { value: settings.dashAnimate },
			noiseA: { value: settings.noiseA },
			noiseB: { value: settings.noiseB },
			noiseAIntensity: { value: settings.noiseAIntensity },
			noiseBIntensity: { value: settings.noiseBIntensity },
			dualStroke: { value: settings.dualStroke },
			dualThickness: { value: settings.dualThickness },
			squeeze: { value: settings.squeeze },
			squeezeMin: { value: settings.squeezeMin },
			squeezeMax: { value: settings.squeezeMax },
			dashOverlap: { value: settings.dashOverlap },
			insideAltColor: { value: settings.insideAltColor },
			depthFade: { value: settings.depthFade },
			depthFadeNear: { value: settings.depthFadeNear },
			depthFadeFar: { value: settings.depthFadeFar },
			depthFadeMin: { value: settings.depthFadeMin },
			cameraPosition: { value: new THREE.Vector3() },
		};

		super({
			extensions: { derivatives: true },
			transparent: true,
			side: THREE.DoubleSide,
			uniforms,
			fragmentShader,
			vertexShader,
		});
	}

	// Helper method to update time for animations
	updateTime(time) {
		this.uniforms.time.value = time;
	}

	// Update camera position (call this in your render loop)
	updateCameraPosition(camera) {
		this.uniforms.cameraPosition.value.copy(camera.position);
	}

	// Helper methods for common operations
	setColors(fill, stroke) {
		this.uniforms.fill.value.set(fill);
		this.uniforms.stroke.value.set(stroke);
	}

	setThickness(thickness) {
		this.uniforms.thickness.value = thickness;
	}

	enableDash(enabled = true) {
		this.uniforms.dashEnabled.value = enabled;
	}

	animateDash(animate = true) {
		this.uniforms.dashAnimate.value = animate;
	}

	// Enable/disable depth fade effect
	enableDepthFade(enabled = true) {
		this.uniforms.depthFade.value = enabled;
	}

	// Set depth fade range
	setDepthFadeRange(near, far, minScale = 0.1) {
		this.uniforms.depthFadeNear.value = near;
		this.uniforms.depthFadeFar.value = far;
		this.uniforms.depthFadeMin.value = minScale;
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

// Helper function to prepare geometry for wireframe rendering
export function prepareWireframeGeometry(geometry, edgeRemoval = true) {
	const clonedGeometry = geometry.clone();
	unindexBufferGeometry(clonedGeometry);
	addBarycentricCoordinates(clonedGeometry, edgeRemoval);
	return clonedGeometry;
}
