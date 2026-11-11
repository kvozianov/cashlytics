import * as THREE from "three"

// Paper strip that breathes: a travelling wave, curled ends and a slight cup,
// done in the vertex shader with matching analytic normals.
export function createReceiptMaterial(map: THREE.Texture | null, back: string) {
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.05 },
    uBack: { value: new THREE.Color(back) },
  }
  const mat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  })
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTime;
uniform float uAmp;`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float py = position.y;
float px = position.x;
float wv = sin(py * 1.25 + uTime * 0.9) * uAmp + sin(py * 2.6 - uTime * 0.7) * uAmp * 0.4;
float dwv = cos(py * 1.25 + uTime * 0.9) * 1.25 * uAmp + cos(py * 2.6 - uTime * 0.7) * 2.6 * uAmp * 0.4;
float cb = max(0.0, -1.2 - py);
float ct = max(0.0, py - 1.5);
float curl = -0.32 * cb * cb + 0.16 * ct * ct;
float dcurl = 0.64 * cb + 0.32 * ct;
float cup = -0.09 * px * px;
float dcup = -0.18 * px;
vec3 objectNormal = normalize(vec3(-dcup, -(dwv + dcurl), 1.0));
#ifdef USE_TANGENT
vec3 objectTangent = vec3(tangent.xyz);
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
transformed.z += wv + curl + cup;
transformed.y -= 0.12 * cb * cb;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform vec3 uBack;`)
      .replace("#include <map_fragment>", `#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = uBack;`)
  }
  mat.customProgramCacheKey = () => "receipt-paper"
  return { material: mat, uniforms, dispose: () => mat.dispose() }
}

// Faked glass: fresnel edges and two painted highlight streaks. Cheaper than
// transmission and, unlike it, reads correctly over a transparent canvas.
export function createGlassMaterial(side: THREE.Side) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side,
    uniforms: {
      uTint: { value: new THREE.Color("#DCEBE4") },
      uEdge: { value: new THREE.Color("#4E5F57") },
      uHi: { value: new THREE.Color("#FFFFFF") },
      uAlpha: { value: 0.07 },
      uEdgeAlpha: { value: 0.55 },
      uHiAlpha: { value: 0.75 },
    },
    vertexShader: `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `
uniform vec3 uTint;
uniform vec3 uEdge;
uniform vec3 uHi;
uniform float uAlpha;
uniform float uEdgeAlpha;
uniform float uHiAlpha;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float f = pow(1.0 - abs(dot(n, normalize(vV))), 2.2);
  float s1 = smoothstep(-0.62, -0.55, n.x) * (1.0 - smoothstep(-0.45, -0.36, n.x));
  float s2 = smoothstep(0.30, 0.34, n.x) * (1.0 - smoothstep(0.38, 0.43, n.x));
  float streak = (s1 + s2 * 0.6) * step(0.0, n.z) * (gl_FrontFacing ? 1.0 : 0.25);
  vec3 col = mix(uTint, uEdge, f);
  float a = uAlpha + f * uEdgeAlpha;
  col = mix(col, uHi, clamp(streak, 0.0, 1.0));
  a = max(a, streak * uHiAlpha);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`,
  })
}
