import * as THREE from "three";
import { NURBSCurve } from "three/examples/jsm/curves/NURBSCurve.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "lil-gui";
import palettes from "nice-color-palettes";
import {
	WireframeMaterial,
	prepareWireframeGeometry,
} from "../wireframeMatUtils/WireframeMaterial.js";

class WireframeDemo {
	constructor(canvas) {
		this.meshes = [];
		this.canvas = canvas;
		this.palette = palettes[13].slice();
		this.background = this.palette.shift();

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this.canvas,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(this.background, 1);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.canvas.style.background = this.background;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.01,
			100
		);
		this.camera.position.set(5, 3, 5);
		this.initControls();
		this.init();
		this.setupGUI();

		this.clock = new THREE.Clock();
		this.autoRotate = true;

		this.resize();
		this.setupEventListeners();

		// Make canvas visible once everything is initialized
		this.canvas.style.visibility = "visible";
	}

	init() {
		this.initMaterial();
		// Create instanced cube
		const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
		const preparedCubeGeometry = prepareWireframeGeometry(cubeGeometry, true);
		const instancedCubeMesh = new THREE.InstancedMesh(
			preparedCubeGeometry,
			this.material,
			2
		);

		// Set up instance transforms
		const matrix = new THREE.Matrix4();
		// First instance at position (-3, 0, 0)
		matrix.setPosition(-3, 0, 0);
		instancedCubeMesh.setMatrixAt(0, matrix);
		// Second instance at position (-1, 0, 0)
		matrix.setPosition(-1, 0, 0);
		instancedCubeMesh.setMatrixAt(1, matrix);
		instancedCubeMesh.instanceMatrix.needsUpdate = true;

		// Create torus
		const torusGeometry = GeometryFactory.create("Torus");
		const preparedTorusGeometry = prepareWireframeGeometry(torusGeometry, true);
		const torusMesh = new THREE.Mesh(preparedTorusGeometry, this.material);
		torusMesh.position.set(2, 0, 0);

		// Add to scene and store references
		this.scene.add(instancedCubeMesh);
		this.scene.add(torusMesh);
		this.meshes.push(instancedCubeMesh, torusMesh);
	}

	initMaterial() {
		this.material = new WireframeMaterial({
			fill: new THREE.Color(this.palette[0]),
			stroke: new THREE.Color(this.palette[1]),
			thickness: 15.0,
			dualThickness: 0.05,
			dashEnabled: true,
			dashRepeats: 2.0,
			dashLength: 0.55,
			squeeze: true,
			squeezeMin: 0.1,
			squeezeMax: 1.0,
			noiseAIntensity: 10,
			noiseBIntensity: 7.0,
			depthFade: true,
			depthFadeNear: 1.0,
			depthFadeFar: 20.0,
			depthFadeMin: 0.1,
		});
	}

	animate = () => {
		this.renderer.render(this.scene, this.camera);
		const time = this.clock.getElapsedTime();

		// Update orbit controls
		this.controls.update();
		this.material.updateTime(time);

		// Update camera position for depth fade effect
		this.material.updateCameraPosition(this.camera);

		// Update all meshes in demo scene
		this.meshes.forEach((mesh) => {
			if (mesh.material && mesh.material.updateTime) {
				mesh.material.updateTime(time);
			}
		});
		requestAnimationFrame(this.animate);
	};

	updateColors(backgroundHex, fillHex, strokeHex) {
		this.canvas.style.background = backgroundHex;
		this.renderer.setClearColor(backgroundHex, 1.0);
		this.material.uniforms.fill.value.set(fillHex);
		this.material.uniforms.stroke.value.set(strokeHex);
	}

	updateUniforms(updates) {
		Object.entries(updates).forEach(([key, value]) => {
			if (this.material.uniforms[key]) {
				this.material.uniforms[key].value = value;
			}
		});
	}
	setupEventListeners() {
		window.addEventListener("resize", () => this.resize());
	}
	resize(
		width = window.innerWidth,
		height = window.innerHeight,
		pixelRatio = window.devicePixelRatio
	) {
		this.renderer.setPixelRatio(pixelRatio);
		this.renderer.setSize(width, height);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}
	saveScreenshot() {
		const width = 2048;
		const height = 2048;
		this.resize(width, height, 1);

		const dataURI = this.canvas.toDataURL("image/png");
		this.resize();

		const link = document.createElement("a");
		link.download = "Screenshot.png";
		link.href = dataURI;
		link.click();
	}
	initControls() {
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.autoRotate = false;
		this.controls.autoRotateSpeed = 2.0;
	}
	setupGUI() {
		this.gui = new GUI();

		// Setup GUI data
		const guiData = {
			backgroundHex: this.background,
			fillHex: `#${this.material.uniforms.fill.value.getHexString()}`,
			strokeHex: `#${this.material.uniforms.stroke.value.getHexString()}`,
			randomColors: () => this.randomColors(),
			saveScreenshot: () => this.saveScreenshot(),
		};

		// Add uniforms to GUI data
		Object.entries(this.material.uniforms).forEach(([key, uniform]) => {
			if (
				typeof uniform.value === "boolean" ||
				typeof uniform.value === "number"
			) {
				guiData[key] = uniform.value;
			}
		});

		const shader = this.gui.addFolder("Shader");

		// Shader controls
		shader
			.add(guiData, "seeThrough")
			.name("See Through")
			.onChange(() => this.updateUniforms(guiData));
		shader
			.add(guiData, "thickness", 0.1, 100)
			.step(0.01)
			.name("Thickness")
			.onChange(() => this.updateUniforms(guiData));
		shader
			.addColor(guiData, "backgroundHex")
			.name("Background")
			.onChange(() =>
				this.updateColors(
					guiData.backgroundHex,
					guiData.fillHex,
					guiData.strokeHex
				)
			);
		shader
			.addColor(guiData, "fillHex")
			.name("Fill")
			.onChange(() =>
				this.updateColors(
					guiData.backgroundHex,
					guiData.fillHex,
					guiData.strokeHex
				)
			);
		shader
			.addColor(guiData, "strokeHex")
			.name("Stroke")
			.onChange(() =>
				this.updateColors(
					guiData.backgroundHex,
					guiData.fillHex,
					guiData.strokeHex
				)
			);
		shader.add(guiData, "randomColors").name("Random Palette");
		shader.add(guiData, "saveScreenshot").name("Save PNG");

		// Dash controls
		const dash = shader.addFolder("Dash");
		dash
			.add(guiData, "dashEnabled")
			.name("dashEnabled")
			.onChange(() => this.updateUniforms(guiData));
		dash
			.add(guiData, "dashAnimate")
			.name("Animate")
			.onChange(() => this.updateUniforms(guiData));
		dash
			.add(guiData, "dashRepeats", 1, 10)
			.step(1)
			.name("Repeats")
			.onChange(() => this.updateUniforms(guiData));
		dash
			.add(guiData, "dashLength", 0, 1)
			.step(0.01)
			.name("Length")
			.onChange(() => this.updateUniforms(guiData));
		dash
			.add(guiData, "dashOverlap")
			.name("Overlap Join")
			.onChange(() => this.updateUniforms(guiData));

		// Effects controls
		const effects = shader.addFolder("Effects");
		effects
			.add(guiData, "noiseA")
			.name("Noise Big")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "noiseAIntensity", 0, 20)
			.step(0.01)
			.name("Big Noise Intensity")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "noiseB")
			.name("Noise Small")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "noiseBIntensity", 0, 20)
			.step(0.01)
			.name("Small Noise Intensity")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "insideAltColor")
			.name("Backface Color")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "squeeze")
			.name("Squeeze")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "squeezeMin", 0, 1)
			.step(0.01)
			.name("Squeeze Min")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "squeezeMax", 0, 1)
			.step(0.01)
			.name("Squeeze Max")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "dualStroke")
			.name("Dual Stroke")
			.onChange(() => this.updateUniforms(guiData));
		effects
			.add(guiData, "dualThickness", 0, 50)
			.step(0.001)
			.name("Dual Thick")
			.onChange(() => this.updateUniforms(guiData));

		// Depth fade controls
		const depthFade = shader.addFolder("Depth Fade");
		depthFade
			.add(guiData, "depthFade")
			.name("Enable Depth Fade")
			.onChange(() => this.updateUniforms(guiData));
		depthFade
			.add(guiData, "depthFadeNear", 1, 50)
			.step(0.1)
			.name("Fade Near Distance")
			.onChange(() => this.updateUniforms(guiData));
		depthFade
			.add(guiData, "depthFadeFar", 1, 100)
			.step(0.1)
			.name("Fade Far Distance")
			.onChange(() => this.updateUniforms(guiData));
		depthFade
			.add(guiData, "depthFadeMin", 0.01, 1)
			.step(0.01)
			.name("Min Thickness Scale")
			.onChange(() => this.updateUniforms(guiData));

		// Check if mobile and close GUI
		const isMobile = /(Android|iPhone|iOS|iPod|iPad)/i.test(
			navigator.userAgent
		);
		if (isMobile) {
			this.gui.close();
		}

		// Store guiData for randomColors method
		this.guiData = guiData;
	}

	randomColors() {
		this.palette =
			palettes[Math.floor(Math.random() * palettes.length)].slice();
		this.background = this.palette.shift();
		this.guiData.backgroundHex = this.background;
		this.guiData.fillHex = this.palette[0];
		this.guiData.strokeHex = this.palette[1];
		this.updateColors(
			this.guiData.backgroundHex,
			this.guiData.fillHex,
			this.guiData.strokeHex
		);

		this.gui.controllersRecursive().forEach((controller) => {
			controller.updateDisplay();
		});
	}
}

class GeometryFactory {
	static create(type) {
		switch (type) {
			case "TorusKnot":
				const torusKnot = new THREE.TorusKnotGeometry(0.7, 0.3, 30, 4);
				torusKnot.rotateY(-Math.PI * 0.5);
				return torusKnot;

			case "Icosphere":
				return new THREE.IcosahedronGeometry(1, 1);

			case "Tube":
				return this.createTubeGeometry();

			case "Sphere":
				return new THREE.SphereGeometry(1, 20, 10);

			case "Torus":
				return new THREE.TorusGeometry(1, 0.3, 8, 30);

			case "Cube":
				return new THREE.BoxGeometry(1.5, 1.5, 1.5);

			default:
				return new THREE.TorusKnotGeometry(0.7, 0.3, 30, 4);
		}
	}

	static createTubeGeometry() {
		const baseGeom = new THREE.IcosahedronGeometry(1, 0);
		const points = [];
		const positionAttribute = baseGeom.getAttribute("position");

		for (let i = 0; i < positionAttribute.count; i++) {
			points.push(
				new THREE.Vector3().fromBufferAttribute(positionAttribute, i)
			);
		}

		baseGeom.dispose();
		const curve = this.createSpline(points);
		return new THREE.TubeGeometry(curve, 30, 0.3, 4, false);
	}

	static createSpline(points) {
		const nurbsDegree = 3;
		const nurbsKnots = [];

		for (let i = 0; i <= nurbsDegree; i++) {
			nurbsKnots.push(0);
		}

		const nurbsControlPoints = points.map((p, i, list) => {
			const knot = (i + 1) / (list.length - nurbsDegree);
			nurbsKnots.push(Math.max(Math.min(1, knot), 0));
			return new THREE.Vector4(p.x, p.y, p.z, 1);
		});

		return new NURBSCurve(nurbsDegree, nurbsKnots, nurbsControlPoints);
	}
}

// Initialize the application
const canvas = document.querySelector("#canvas");
const app = new WireframeDemo(canvas);

// Start animation
app.animate();

// Export for potential external use
export default app;
