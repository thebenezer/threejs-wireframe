// Custom outline vertex shader
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    // Transform the normal to world space
    vNormal = normalize(normalMatrix * normal);
    
    // Store local position
    vPosition = position;
    
    // Pass UV coordinates to fragment shader
    vUv = uv;
    
    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Standard vertex transformation
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
