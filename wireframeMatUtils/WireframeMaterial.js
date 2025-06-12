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
			dashOverlap: false,
			noiseA: false,
			noiseB: false,
			noiseAIntensity: 5.15,
			noiseBIntensity: 10.12,
			dualStroke: false,
			dualThickness: 0.05,
			squeeze: false,
			squeezeMin: 0.1,
			squeezeMax: 1.0,
			insideAltColor: true,
			depthFade: true,
			depthFadeNear: 1.0,
			depthFadeFar: 20.0,
			depthFadeMin: 0.1,
		};

		const settings = { ...defaults, ...options };

		// Generate defines based on enabled features
		const defines = {};
		if (settings.noiseA) defines["NOISE_A_ENABLED"] = "";
		if (settings.noiseB) defines["NOISE_B_ENABLED"] = "";
		if (settings.depthFade) defines["DEPTH_FADE_ENABLED"] = "";
		if (settings.squeeze) defines["SQUEEZE_ENABLED"] = "";
		if (settings.dashEnabled) {
			defines["DASH_ENABLED"] = "";
			if (settings.dashAnimate) defines["DASH_ANIMATE"] = "";
			if (settings.dashOverlap) defines["DASH_OVERLAP"] = "";
		}
		if (settings.dualStroke) defines["DUAL_STROKE_ENABLED"] = "";
		if (settings.seeThrough) {
			defines["SEE_THROUGH"] = "";
			if (settings.insideAltColor) defines["INSIDE_ALT_COLOR"] = "";
		}

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
		};

		super({
			extensions: { derivatives: true },
			transparent: true,
			side: THREE.DoubleSide,
			uniforms,
			fragmentShader,
			vertexShader,
			defines,
		});

		// Store feature flags for potential runtime changes
		this.features = {
			noiseA: settings.noiseA,
			noiseB: settings.noiseB,
			depthFade: settings.depthFade,
			squeeze: settings.squeeze,
			dashEnabled: settings.dashEnabled,
			dashAnimate: settings.dashAnimate,
			dashOverlap: settings.dashOverlap,
			dualStroke: settings.dualStroke,
			seeThrough: settings.seeThrough,
			insideAltColor: settings.insideAltColor,
		};
	}

	// Helper method to update time for animations
	updateTime(time) {
		this.uniforms.time.value = time;
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

	// Update feature flags and regenerate shader if needed
	updateFeature(featureName, enabled) {
		if (this.features[featureName] !== enabled) {
			this.features[featureName] = enabled;
			this._updateDefines();
			this.needsUpdate = true;
		}
	}

	// Batch update multiple features
	updateFeatures(features) {
		let needsUpdate = false;
		Object.entries(features).forEach(([key, value]) => {
			if (this.features[key] !== value) {
				this.features[key] = value;
				needsUpdate = true;
			}
		});

		if (needsUpdate) {
			this._updateDefines();
			this.needsUpdate = true;
		}
	}

	// Internal method to update defines based on current features
	_updateDefines() {
		// Clear existing defines
		Object.keys(this.defines).forEach((key) => {
			delete this.defines[key];
		});

		// Regenerate defines based on current features
		if (this.features.noiseA) this.defines["NOISE_A_ENABLED"] = "";
		if (this.features.noiseB) this.defines["NOISE_B_ENABLED"] = "";
		if (this.features.depthFade) this.defines["DEPTH_FADE_ENABLED"] = "";
		if (this.features.squeeze) this.defines["SQUEEZE_ENABLED"] = "";
		if (this.features.dashEnabled) {
			this.defines["DASH_ENABLED"] = "";
			if (this.features.dashAnimate) this.defines["DASH_ANIMATE"] = "";
			if (this.features.dashOverlap) this.defines["DASH_OVERLAP"] = "";
		}
		if (this.features.dualStroke) this.defines["DUAL_STROKE_ENABLED"] = "";
		if (this.features.seeThrough) {
			this.defines["SEE_THROUGH"] = "";
			if (this.features.insideAltColor) this.defines["INSIDE_ALT_COLOR"] = "";
		}
	}
}

// Helper function to prepare geometry for wireframe rendering
export function prepareWireframeGeometry(geometry, edgeRemoval = true) {
	const clonedGeometry = geometry.clone();
	unindexBufferGeometry(clonedGeometry);
	addBarycentricCoordinates(clonedGeometry, edgeRemoval);
	return clonedGeometry;
}

// Material manager for efficient shader variant caching
export class WireframeMaterialManager {
	constructor() {
		this.materialCache = new Map();
	}

	// Get a material with specific features, using cache when possible
	getMaterial(options = {}) {
		const cacheKey = this._createCacheKey(options);

		if (!this.materialCache.has(cacheKey)) {
			this.materialCache.set(cacheKey, new WireframeMaterial(options));
		}

		return this.materialCache.get(cacheKey);
	}

	// Create a basic wireframe material (most optimized)
	getBasicMaterial(options = {}) {
		return this.getMaterial({
			...options,
			noiseA: false,
			noiseB: false,
			dashEnabled: false,
			squeeze: false,
			dualStroke: false,
			depthFade: false,
		});
	}

	// Create a noise-enabled material
	getNoisyMaterial(options = {}) {
		return this.getMaterial({
			...options,
			noiseA: true,
			noiseB: true,
		});
	}

	// Create a dash-enabled material
	getDashMaterial(options = {}) {
		return this.getMaterial({
			...options,
			dashEnabled: true,
			dashAnimate: true,
		});
	}

	// Clear cache (useful for memory management)
	clearCache() {
		this.materialCache.forEach((material) => {
			material.dispose();
		});
		this.materialCache.clear();
	}

	// Get cache statistics
	getCacheStats() {
		return {
			cachedVariants: this.materialCache.size,
			memoryEstimate: this.materialCache.size * 0.1 + " MB (approximate)",
		};
	}

	// Private method to create cache key from options
	_createCacheKey(options) {
		const features = {
			noiseA: options.noiseA || false,
			noiseB: options.noiseB || false,
			depthFade: options.depthFade || false,
			squeeze: options.squeeze || false,
			dashEnabled: options.dashEnabled || false,
			dashAnimate: options.dashAnimate || false,
			dashOverlap: options.dashOverlap || false,
			dualStroke: options.dualStroke || false,
			seeThrough: options.seeThrough || false,
			insideAltColor: options.insideAltColor || false,
		};

		return Object.keys(features)
			.sort()
			.map((key) => `${key}:${features[key]}`)
			.join("|");
	}
}
