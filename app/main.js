import * as THREE from "three";
import { NURBSCurve } from "three/examples/jsm/curves/NURBSCurve.js";
import { GUI } from "lil-gui";
import palettes from "nice-color-palettes";
import {
	WireframeMaterial,
	prepareWireframeGeometry,
} from "../lib/WireframeMaterial.js";

class WireframeRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.palette = palettes[13].slice();
		this.background = this.palette.shift();

		this.initRenderer();
		this.initScene();
		this.initMaterial();
		this.initMesh();
		this.initGUI();

		this.clock = new THREE.Clock();
		this.isAnimating = false;

		this.setupEventListeners();
		this.start();
	}

	initRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this.canvas,
		});

		const gl = this.renderer.getContext();
		gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

		this.renderer.setClearColor(this.background, 1);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.canvas.style.background = this.background;
	}

	initScene() {
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
	}

	initMaterial() {
		this.material = new WireframeMaterial({
			fill: new THREE.Color(this.palette[0]),
			stroke: new THREE.Color(this.palette[1]),
			thickness: 0.01,
			secondThickness: 0.05,
			dashEnabled: true,
			dashRepeats: 2.0,
			dashLength: 0.55,
			squeezeMin: 0.1,
			squeezeMax: 1.0,
		});
	}

	initMesh() {
		this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
		this.scene.add(this.mesh);
	}

	initGUI() {
		this.gui = new GUI();
		this.guiController = new GUIController(this);
	}

	setupEventListeners() {
		window.addEventListener("resize", () => this.resize());
	}

	start() {
		this.createGeometry();
		this.guiController.setup();
		this.resize();
		this.canvas.style.visibility = "";
		this.animate();
	}

	animate = () => {
		if (!this.isAnimating) return;
		requestAnimationFrame(this.animate);
		this.update();
		this.draw();
	};

	startAnimation() {
		this.isAnimating = true;
		this.animate();
	}

	stopAnimation() {
		this.isAnimating = false;
	}

	update() {
		const time = this.clock.getElapsedTime();
		const radius = 4;
		const angle = (time * 2.5 * Math.PI) / 180;

		this.camera.position.set(
			Math.cos(angle) * radius,
			0,
			Math.sin(angle) * radius
		);
		this.camera.lookAt(new THREE.Vector3());
		this.material.updateTime(time);
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
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
		this.draw();
	}

	createGeometry(type = "TorusKnot", edgeRemoval = true) {
		if (this.mesh.geometry) this.mesh.geometry.dispose();

		const geometry = GeometryFactory.create(type);
		const preparedGeometry = prepareWireframeGeometry(geometry, edgeRemoval);
		this.mesh.geometry = preparedGeometry;
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

	updateColors(backgroundHex, fillHex, strokeHex) {
		this.canvas.style.background = backgroundHex;
		this.renderer.setClearColor(backgroundHex, 1.0);
		this.material.uniforms.fill.value.setStyle(fillHex);
		this.material.uniforms.stroke.value.setStyle(strokeHex);
	}

	updateUniforms(updates) {
		Object.entries(updates).forEach(([key, value]) => {
			if (this.material.uniforms[key]) {
				this.material.uniforms[key].value = value;
			}
		});
	}

	dispose() {
		this.stopAnimation();
		this.mesh.geometry?.dispose();
		this.material.dispose();
		this.gui.destroy();
		window.removeEventListener("resize", this.resize);
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

class GUIController {
	constructor(renderer) {
		this.renderer = renderer;
		this.guiData = this.initGuiData();
	}

	initGuiData() {
		const data = {
			name: "TorusKnot",
			edgeRemoval: true,
			backgroundHex: this.renderer.background,
			saveScreenshot: () => this.renderer.saveScreenshot(),
			fillHex: `#${this.renderer.material.uniforms.fill.value.getHexString()}`,
			strokeHex: `#${this.renderer.material.uniforms.stroke.value.getHexString()}`,
			randomColors: () => this.randomColors(),
		};

		// Add uniforms to GUI data
		Object.entries(this.renderer.material.uniforms).forEach(
			([key, uniform]) => {
				if (
					typeof uniform.value === "boolean" ||
					typeof uniform.value === "number"
				) {
					data[key] = uniform.value;
				}
			}
		);

		return data;
	}

	setup() {
		const shader = this.renderer.gui.addFolder("Shader");

		this.setupShaderControls(shader);
		this.setupDashControls(shader);
		this.setupEffectsControls(shader);
		this.setupGeometryControls(shader);

		this.checkMobileAndClose();
		this.updateAll();
	}

	setupShaderControls(shader) {
		shader
			.add(this.guiData, "seeThrough")
			.name("See Through")
			.onChange(() => this.updateUniforms());
		shader
			.add(this.guiData, "thickness", 0.005, 0.2)
			.step(0.001)
			.name("Thickness")
			.onChange(() => this.updateUniforms());
		shader
			.addColor(this.guiData, "backgroundHex")
			.name("Background")
			.onChange(() => this.updateColors());
		shader
			.addColor(this.guiData, "fillHex")
			.name("Fill")
			.onChange(() => this.updateColors());
		shader
			.addColor(this.guiData, "strokeHex")
			.name("Stroke")
			.onChange(() => this.updateColors());
		shader.add(this.guiData, "randomColors").name("Random Palette");
		shader.add(this.guiData, "saveScreenshot").name("Save PNG");
	}

	setupDashControls(shader) {
		const dash = shader.addFolder("Dash");
		dash
			.add(this.guiData, "dashEnabled")
			.name("Enabled")
			.onChange(() => this.updateUniforms());
		dash
			.add(this.guiData, "dashAnimate")
			.name("Animate")
			.onChange(() => this.updateUniforms());
		dash
			.add(this.guiData, "dashRepeats", 1, 10)
			.step(1)
			.name("Repeats")
			.onChange(() => this.updateUniforms());
		dash
			.add(this.guiData, "dashLength", 0, 1)
			.step(0.01)
			.name("Length")
			.onChange(() => this.updateUniforms());
		dash
			.add(this.guiData, "dashOverlap")
			.name("Overlap Join")
			.onChange(() => this.updateUniforms());
	}

	setupEffectsControls(shader) {
		const effects = shader.addFolder("Effects");
		effects
			.add(this.guiData, "noiseA")
			.name("Noise Big")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "noiseB")
			.name("Noise Small")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "insideAltColor")
			.name("Backface Color")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "squeeze")
			.name("Squeeze")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "squeezeMin", 0, 1)
			.step(0.01)
			.name("Squeeze Min")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "squeezeMax", 0, 1)
			.step(0.01)
			.name("Squeeze Max")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "dualStroke")
			.name("Dual Stroke")
			.onChange(() => this.updateUniforms());
		effects
			.add(this.guiData, "secondThickness", 0, 0.2)
			.step(0.001)
			.name("Dual Thick")
			.onChange(() => this.updateUniforms());
	}

	setupGeometryControls(shader) {
		const geom = shader.addFolder("Geometry");
		geom
			.add(this.guiData, "name", [
				"TorusKnot",
				"Icosphere",
				"Tube",
				"Sphere",
				"Torus",
			])
			.name("Geometry")
			.onChange(() => this.updateGeometry());
		geom
			.add(this.guiData, "edgeRemoval")
			.name("Edge Removal")
			.onChange(() => this.updateGeometry());
	}

	randomColors() {
		this.renderer.palette =
			palettes[Math.floor(Math.random() * palettes.length)].slice();
		this.guiData.backgroundHex = this.renderer.palette.shift();
		this.guiData.fillHex = this.renderer.palette[0];
		this.guiData.strokeHex = this.renderer.palette[1];
		this.updateColors();

		this.renderer.gui.controllersRecursive().forEach((controller) => {
			controller.updateDisplay();
		});
	}

	updateColors() {
		this.renderer.updateColors(
			this.guiData.backgroundHex,
			this.guiData.fillHex,
			this.guiData.strokeHex
		);
	}

	updateUniforms() {
		this.renderer.updateUniforms(this.guiData);
	}

	updateGeometry() {
		this.renderer.createGeometry(this.guiData.name, this.guiData.edgeRemoval);
	}

	updateAll() {
		this.updateGeometry();
		this.updateColors();
		this.updateUniforms();
	}

	checkMobileAndClose() {
		const isMobile = /(Android|iPhone|iOS|iPod|iPad)/i.test(
			navigator.userAgent
		);
		if (isMobile) {
			this.renderer.gui.close();
		}
	}
}

// Initialize the application
const canvas = document.querySelector("#canvas");
const app = new WireframeRenderer(canvas);

// Start animation
app.startAnimation();

// Export for potential external use
export default app;
