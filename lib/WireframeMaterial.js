import * as THREE from "three";
import fragmentShader from "./fragment.glsl?raw";
import vertexShader from "./vertex.glsl?raw";
import { addBarycentricCoordinates, unindexBufferGeometry } from "./wireframeGeomtryUtils.js";

export class WireframeMaterial extends THREE.ShaderMaterial {
  constructor(options = {}) {
    const defaults = {
      fill: new THREE.Color('#ffffff'),
      stroke: new THREE.Color('#000000'),
      thickness: 0.01,
      seeThrough: false,
      dashEnabled: false,
      dashRepeats: 2.0,
      dashLength: 0.55,
      dashAnimate: false,
      noiseA: false,
      noiseB: false,
      dualStroke: false,
      secondThickness: 0.05,
      squeeze: false,
      squeezeMin: 0.1,
      squeezeMax: 1.0,
      dashOverlap: false,
      insideAltColor: true,
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
      dualStroke: { value: settings.dualStroke },
      secondThickness: { value: settings.secondThickness },
      squeeze: { value: settings.squeeze },
      squeezeMin: { value: settings.squeezeMin },
      squeezeMax: { value: settings.squeezeMax },
      dashOverlap: { value: settings.dashOverlap },
      insideAltColor: { value: settings.insideAltColor },
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