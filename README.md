# WebGL Wireframes

A modern, reusable WebGL wireframe rendering library built with TypeScript and THREE.js.

## Features

- **Modern TypeScript Architecture**: Clean, type-safe code with proper separation of concerns
- **Shader-based Wireframes**: Uses barycentric coordinates for smooth, resolution-independent wireframes
- **Interactive Controls**: Real-time adjustment of wireframe properties
- **Modular Design**: Easy to extend and customize
- **Multiple Geometry Support**: Box, sphere, torus, and more geometric primitives

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── core/
│   └── SceneManager.ts        # Scene and mesh management
├── materials/
│   └── WireframeMaterial.ts   # Custom wireframe shader material
├── geometry/
│   └── GeometryFactory.ts     # Geometry creation utilities
├── utils/
│   └── wireframeGeometryUtils.ts  # Geometry processing utilities
└── ui/
    └── UIControls.ts          # User interface controls
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

The library provides a simple API for creating wireframe visualizations:

```typescript
import { WireframeMaterial } from "./materials/WireframeMaterial";
import {
	addBarycentricCoordinates,
	unindexBufferGeometry,
} from "./utils/wireframeGeometryUtils";

// Prepare geometry for wireframe rendering
const geometry = new THREE.BoxGeometry();
unindexBufferGeometry(geometry);
addBarycentricCoordinates(geometry);

// Create wireframe material
const material = new WireframeMaterial({
	color: new THREE.Color(0x00ff00),
	wireframeWidth: 2.0,
	opacity: 0.8,
});

// Create mesh
const mesh = new THREE.Mesh(geometry, material);
```

## Key Components

### WireframeMaterial

A custom THREE.js shader material that renders wireframes using barycentric coordinates:

- **Smooth wireframes**: No jagged edges regardless of zoom level
- **Configurable width**: Adjustable wireframe thickness
- **Transparency support**: Customizable opacity
- **Color control**: Any color supported

### GeometryFactory

Utility class for creating various 3D geometries:

- Box, Sphere, Cylinder, Torus
- Icosahedron, Octahedron, Tetrahedron, Dodecahedron
- Custom geometry from vertex arrays

### SceneManager

Handles scene lifecycle and mesh management:

- Add/remove meshes
- Animation callbacks
- Scene clearing
- Automatic animations

### UIControls

Interactive controls for real-time parameter adjustment:

- Wireframe width slider
- Opacity control
- Add geometry buttons
- Scene clear functionality

## Development

The project uses modern web development tools:

- **TypeScript**: Type-safe development
- **Vite**: Fast development server and building
- **ESNext modules**: Modern JavaScript modules
- **Path aliases**: Clean import statements

### Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run type-check`: TypeScript type checking

## Using the Wireframe Effect in Your Own Project

To integrate the wireframe rendering capabilities into your own project, follow these steps:

### 1. Copy Required Files

Copy the following files from the `src/` directory to your project:

- `materials/WireframeMaterial.ts` - Custom wireframe shader material
- `utils/wireframeGeometryUtils.ts` - Geometry processing utilities

### 2. Basic Integration

```typescript
import * as THREE from "three";
import { WireframeMaterial } from "./materials/WireframeMaterial";
import {
	addBarycentricCoordinates,
	unindexBufferGeometry,
} from "./utils/wireframeGeometryUtils";

// Create your scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create geometry and prepare it for wireframe rendering
const geometry = new THREE.BoxGeometry(2, 2, 2);
unindexBufferGeometry(geometry);
addBarycentricCoordinates(geometry);

// Create wireframe material with custom properties
const wireframeMaterial = new WireframeMaterial({
	color: new THREE.Color(0x00ff00),
	wireframeWidth: 2.0,
	opacity: 0.8,
	transparent: true,
});

// Create and add mesh to scene
const mesh = new THREE.Mesh(geometry, wireframeMaterial);
scene.add(mesh);

// Position camera
camera.position.z = 5;

// Render loop
function animate() {
	requestAnimationFrame(animate);
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.01;
	renderer.render(scene, camera);
}
animate();
```

### 3. Customization Options

```typescript
// Adjust wireframe appearance
wireframeMaterial.uniforms.wireframeWidth.value = 3.0; // Line thickness
wireframeMaterial.uniforms.opacity.value = 0.5; // Transparency
wireframeMaterial.uniforms.color.value = new THREE.Color(0xff0000); // Red color

// Create different geometries
import { GeometryFactory } from "./geometry/GeometryFactory";

const sphereGeometry = GeometryFactory.createSphere(1, 32, 16);
const torusGeometry = GeometryFactory.createTorus(1, 0.3, 16, 100);
```

### 4. Advanced Usage

```typescript
// Multiple wireframe objects with different properties
const materials = [
	new WireframeMaterial({
		color: new THREE.Color(0xff0000),
		wireframeWidth: 1.0,
	}),
	new WireframeMaterial({
		color: new THREE.Color(0x00ff00),
		wireframeWidth: 2.0,
	}),
	new WireframeMaterial({
		color: new THREE.Color(0x0000ff),
		wireframeWidth: 3.0,
	}),
];

const geometries = [
	GeometryFactory.createBox(1, 1, 1),
	GeometryFactory.createSphere(1, 32, 16),
	GeometryFactory.createTorus(1, 0.3, 16, 100),
];

geometries.forEach((geometry, index) => {
	unindexBufferGeometry(geometry);
	addBarycentricCoordinates(geometry);

	const mesh = new THREE.Mesh(geometry, materials[index]);
	mesh.position.x = (index - 1) * 3;
	scene.add(mesh);
});
```

### 5. Performance Considerations

- Use `unindexBufferGeometry()` only once per geometry
- Reuse `WireframeMaterial` instances when possible
- Consider using object pooling for dynamic wireframe creation
- The barycentric coordinate approach provides smooth wireframes without performance overhead

### Dependencies

- THREE.js (r150 or later)
- TypeScript (for development)

## License

MIT License - see LICENSE file for details.
