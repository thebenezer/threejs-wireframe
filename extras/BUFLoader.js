import * as THREE from "three";

/**
 * BUFLoader - Buffer Geometry Loader
 * Loads .buf (Buffer Geometry) files that preserve quad topology
 */
export class BUFLoader {
	constructor() {
		this.path = "";
	}

	setPath(path) {
		this.path = path;
		return this;
	}

	load(url, onLoad, onProgress, onError) {
		const fullUrl = this.path + url;

		fetch(fullUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				return response.json();
			})
			.then((data) => {
				try {
					const geometry = this.parse(data);
					if (onLoad) onLoad(geometry);
				} catch (error) {
					if (onError) onError(error);
				}
			})
			.catch((error) => {
				if (onError) onError(error);
			});
	}

	loadAsync(url) {
		return new Promise((resolve, reject) => {
			this.load(url, resolve, undefined, reject);
		});
	}

	parse(data) {
		if (data.format !== "buf") {
			throw new Error("Invalid file format. Expected .buf format.");
		}

		console.log("Loading BUF file:", data.metadata);

		// Create Three.js BufferGeometry
		const geometry = new THREE.BufferGeometry();

		// Add vertex attributes
		for (const [name, attribute] of Object.entries(data.attributes)) {
			const { array, itemSize } = attribute;
			geometry.setAttribute(
				name,
				new THREE.Float32BufferAttribute(array, itemSize)
			);
		}

		// Process faces - convert quads and triangles to Three.js indices
		const indices = [];

		for (const face of data.faces) {
			const vertices = face.vertices;

			if (face.type === "triangle") {
				// Add triangle as-is
				indices.push(...vertices);
			} else if (face.type === "quad") {
				// Convert quad to two triangles
				// Quad: [v0, v1, v2, v3] -> Triangles: [v0, v1, v2] + [v0, v2, v3]
				const [v0, v1, v2, v3] = vertices;
				indices.push(v0, v1, v2); // First triangle
				indices.push(v0, v2, v3); // Second triangle
			}
		}

		// Set indices
		geometry.setIndex(indices);

		// Compute bounding sphere
		geometry.computeBoundingSphere();

		// Add metadata for wireframe processing
		geometry.userData = {
			originalFormat: "buf",
			quadCount: data.metadata.quad_count,
			triangleCount: data.metadata.triangle_count,
			faces: data.faces, // Preserve original face structure for wireframe processing
		};

		console.log(
			`Loaded BUF geometry: ${data.metadata.vertex_count} vertices, ${data.metadata.quad_count} quads, ${data.metadata.triangle_count} triangles`
		);

		return geometry;
	}
}

/**
 * Prepare wireframe geometry from BUF format
 * This function uses the original quad topology preserved in userData
 */
export function prepareBUFWireframeGeometry(geometry) {
	if (!geometry.userData || geometry.userData.originalFormat !== "buf") {
		console.warn(
			"Geometry is not from BUF format, falling back to standard wireframe preparation"
		);
		return geometry;
	}

	const originalFaces = geometry.userData.faces;
	const wireframeIndices = [];

	// Extract edges from original quad/triangle faces
	const edges = new Set();

	for (const face of originalFaces) {
		const vertices = face.vertices;

		// Add edges of the face (not the triangulated edges)
		for (let i = 0; i < vertices.length; i++) {
			const v1 = vertices[i];
			const v2 = vertices[(i + 1) % vertices.length];

			// Create edge key (sorted to avoid duplicates)
			const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
			edges.add(edgeKey);
		}
	}

	// Convert edges to wireframe indices
	for (const edgeKey of edges) {
		const [v1, v2] = edgeKey.split("-").map(Number);
		wireframeIndices.push(v1, v2);
	}

	// Create new geometry for wireframe
	const wireframeGeometry = new THREE.BufferGeometry();

	// Copy attributes
	for (const [name, attribute] of Object.entries(geometry.attributes)) {
		wireframeGeometry.setAttribute(name, attribute.clone());
	}

	// Set wireframe indices
	wireframeGeometry.setIndex(wireframeIndices);

	console.log(
		`Created wireframe with ${wireframeIndices.length / 2} edges from ${
			originalFaces.length
		} faces`
	);

	return wireframeGeometry;
}
