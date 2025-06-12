attribute vec3 barycentric;
attribute float even;

varying vec3 vBarycentric;
varying vec3 vPosition;
varying vec4 vWorldPosition;
varying float vEven;
varying vec2 vUv;

void main () {
  vec4 mPosition = vec4( position, 1.0 );

  #ifdef USE_INSTANCING
    mPosition = instanceMatrix * vec4(position, 1.0);
  #endif
  mPosition = modelMatrix * mPosition;

  gl_Position = projectionMatrix * viewMatrix * mPosition;
  
  vBarycentric = barycentric;
  vPosition = position.xyz;
  vWorldPosition = mPosition;
  vEven = even;
  vUv = uv;
}
