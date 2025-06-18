// Custom outline fragment shader
precision mediump float;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

uniform vec3 color;
uniform float opacity;
uniform float outlineWidth;
uniform vec3 outlineColor;

// Function to create smooth edges for outline detection
float smoothEdge(float value, float width) {
    return smoothstep(0.0, width, value) * smoothstep(0.0, width, 1.0 - value);
}

void main() {
    // Basic lighting calculation using the normal
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(normalize(vNormal), lightDirection), 0.3);
    
    // Calculate distance from UV edges (0 and 1)
    float edgeFactorU = smoothEdge(vUv.x, outlineWidth);
    float edgeFactorV = smoothEdge(vUv.y, outlineWidth);
    
    // Combine both edge factors - closer to edges means smaller value
    float edgeFactor = edgeFactorU * edgeFactorV;
    
    // Create outline effect: when edgeFactor is small (near edges), use outline color
    vec3 finalColor = mix(outlineColor, color, edgeFactor);
    
    // Apply lighting
    finalColor *= lightIntensity;
    
    gl_FragColor = vec4(finalColor, opacity);
}
