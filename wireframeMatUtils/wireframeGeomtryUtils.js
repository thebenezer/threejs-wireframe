import * as THREE from "three";

export function addBarycentricCoordinates(bufferGeometry, removeEdge = false) {
	const attrib =
		bufferGeometry.getIndex() || bufferGeometry.getAttribute("position");
	const count = attrib.count / 3;
	const barycentric = [];
	const evenValues = [];

	// for each triangle in the geometry, add the barycentric coordinates
	for (let i = 0; i < count; i++) {
		const even = i % 2 === 0;
		const Q = removeEdge ? 1 : 0;
		if (even) {
			barycentric.push(0, 0, 1, 0, 1, 0, 1, 0, Q);
			evenValues.push(1, 1, 1); // 3 vertices per triangle
		} else {
			barycentric.push(0, 1, 0, 0, 0, 1, 1, 0, Q);
			evenValues.push(0, 0, 0); // 3 vertices per triangle
		}
	}

	// add the barycentric attribute to the geometry
	const baryArray = new Float32Array(barycentric);
	const baryAttribute = new THREE.BufferAttribute(baryArray, 3);
	bufferGeometry.setAttribute("barycentric", baryAttribute);

	// add the even attribute to the geometry
	const evenArray = new Float32Array(evenValues);
	const evenAttribute = new THREE.BufferAttribute(evenArray, 1);
	bufferGeometry.setAttribute("even", evenAttribute);
}

export function unindexBufferGeometry(bufferGeometry) {
	// un-indices the geometry, copying all attributes like position and uv
	const index = bufferGeometry.getIndex();
	if (!index) return; // already un-indexed

	const indexArray = index.array;
	const triangleCount = indexArray.length / 3;

	const attributes = bufferGeometry.attributes;
	const newAttribData = Object.keys(attributes).map((key) => {
		return {
			name: key,
			array: [],
			attribute: bufferGeometry.getAttribute(key),
		};
	});

	for (let i = 0; i < triangleCount; i++) {
		// indices into attributes
		const a = indexArray[i * 3 + 0];
		const b = indexArray[i * 3 + 1];
		const c = indexArray[i * 3 + 2];
		const indices = [a, b, c];

		// for each attribute, put vertex into unindexed list
		newAttribData.forEach((data) => {
			const attrib = data.attribute;
			const dim = attrib.itemSize;
			// add [a, b, c] vertices
			for (let i = 0; i < indices.length; i++) {
				const index = indices[i];
				for (let d = 0; d < dim; d++) {
					const v = attrib.array[index * dim + d];
					data.array.push(v);
				}
			}
		});
	}
	index.array = null;
	bufferGeometry.setIndex(null);

	// now copy over new data
	newAttribData.forEach((data) => {
		const newArray = new data.attribute.array.constructor(data.array);
		const newAttribute = new THREE.BufferAttribute(
			newArray,
			data.attribute.itemSize
		);
		bufferGeometry.setAttribute(data.name, newAttribute);
	});
}
