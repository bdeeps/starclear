// Shared parts for StarClear: a starry backdrop, glowing point clouds, fat line sets, a procedural star
// surface (no textures: noise in a shader), a corona glow, blackbody colour and rough main-sequence scalings.
// Everything is drawn from code. One unit = one solar radius unless a chapter says otherwise.
import { THREE, M, clamp, lerp, smooth, approach } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export { THREE, M, clamp, lerp, smooth, approach };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const COL = { gravity: 0xffb547, pressure: 0x6ec8ff, proton: 0xff6b5e, neutron: 0x9aa7c2, positron: 0xffe36b, neutrino: 0xd9f6ff, gamma: 0xfff3a0, helium: 0xb68bff, carbon: 0x5ce1a9, core: 0xfff1c2, rad: 0xffb04a, conv: 0xff7a3d, chromo: 0xff4d6d, corona: 0xbcd8ff, photon: 0xfff6b0, earth: 0x2d6bbf };

let dot = null;
export function dotTex() {
  if (dot) return dot;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  dot = new THREE.CanvasTexture(c); dot.colorSpace = THREE.SRGBColorSpace;
  return dot;
}

// A cloud of glowing dots with per-dot colour. Write p.pos / p.col, then call p.upd().
export function cloud(n, { size = 0.3, opacity = 1, atten = true } = {}) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size, map: dotTex(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: atten });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.pos = pos; p.col = col; p.n = n;
  p.upd = () => { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; };
  const tmp = new THREE.Color();
  p.setCol = (i, hex, k = 1) => { tmp.set(hex); p.col[i * 3] = tmp.r * k; p.col[i * 3 + 1] = tmp.g * k; p.col[i * 3 + 2] = tmp.b * k; };
  return p;
}

// A soft glowing sprite (halo).
export function halo(color, size, opacity = 0.8) {
  const m = new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
}

// Fat lines from polylines (arrays of Vector3), updated in place.
export class Lines {
  constructor(stage, cap, { color = 0xffffff, width = 1.5, opacity = 0.9 } = {}) {
    this.cap = cap; this.arr = new Float32Array(cap * 6);
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(new Float32Array(cap * 6).fill(0.0001));
    this.mat = stage.lineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false, depthWrite: false });
    this.obj = new LineSegments2(this.geo, this.mat);
    this.obj.frustumCulled = false;
  }
  set(polys) {
    const a = this.arr; let n = 0;
    for (const P of polys) {
      for (let i = 0; i < P.length - 1 && n < this.cap; i++, n++) {
        const p = P[i], q = P[i + 1], o = n * 6;
        a[o] = p.x; a[o + 1] = p.y; a[o + 2] = p.z; a[o + 3] = q.x; a[o + 4] = q.y; a[o + 5] = q.z;
      }
    }
    const buf = this.geo.attributes.instanceStart.data;
    buf.array.set(a); buf.needsUpdate = true;
    this.geo.instanceCount = n;
  }
}

// Background stars and a dim fill light. Hides the floor grid.
export function spaceScene(stage, { stars = true, amb = 0.5 } = {}) {
  stage.setWorldMode(true);
  stage.scene.environmentIntensity = 0.25;
  stage.scene.background = new THREE.Color(0x05060b);
  stage.root.add(new THREE.AmbientLight(0x8d96c0, amb));
  if (stars) {
    const r = rng(7), p = new THREE.BufferGeometry(), N = 1100, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u), R = 900;
      pos.set([s * Math.cos(a) * R, u * R, s * Math.sin(a) * R], i * 3);
      const c = bbColor(2800 + Math.pow(r(), 2.2) * 22000), k = 0.35 + 0.65 * r();
      col.set([c.r * k, c.g * k, c.b * k], i * 3);
    }
    p.setAttribute('position', new THREE.BufferAttribute(pos, 3)); p.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const st = new THREE.Points(p, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
    st.frustumCulled = false; stage.root.add(st);
  }
}

// ---------------------------------------------------------------- blackbody colour
// Planck's law weighted by an analytic fit to the CIE 1931 colour-matching functions (Wyman, Sloan and Shirley 2013),
// then converted to linear sRGB and normalised so the brightest channel is 1. `sat` > 1 exaggerates the tint a little.
const lobe = (x, m, s1, s2) => { const t = (x - m) / (x < m ? s1 : s2); return Math.exp(-0.5 * t * t); };
const cmf = (l) => [
  1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2),
  0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1),
  1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8),
];
export const planck = (nm, T) => Math.pow(nm / 1000, -5) / (Math.exp(1.4388e7 / (nm * T)) - 1);
const bbCache = new Map();
export function bbRGB(T, sat = 1.25) {
  const key = Math.round(T / 25) * 25 + '|' + sat;
  if (bbCache.has(key)) return bbCache.get(key);
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) { const p = planck(l, T), c = cmf(l); X += p * c[0]; Y += p * c[1]; Z += p * c[2]; }
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const m0 = Math.max(r, g, b); r = Math.max(0, r / m0); g = Math.max(0, g / m0); b = Math.max(0, b / m0);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  r = clamp(lum + (r - lum) * sat, 0, 1); g = clamp(lum + (g - lum) * sat, 0, 1); b = clamp(lum + (b - lum) * sat, 0, 1);
  const m1 = Math.max(r, g, b), out = [r / m1, g / m1, b / m1];
  bbCache.set(key, out);
  return out;
}
export const bbColor = (T, sat) => { const [r, g, b] = bbRGB(T, sat); return new THREE.Color().setRGB(r, g, b); };
export const bbCss = (T, sat) => '#' + bbColor(T, sat).getHexString();
export const wien = (T) => 2.898e6 / T; // peak wavelength in nm

// ---------------------------------------------------------------- rough main-sequence scalings (teaching approximations)
// Luminosity: a common piecewise mass-luminosity fit. Radius: R ~ M^0.8 below 1 solar mass, ~M^0.7 above.
// Temperature from L = 4 pi R^2 sigma T^4, anchored to the Sun's 5,772 K. Lifetime: 10 billion years x M^-2.5,
// plus about 3 million years, because the most massive stars level off at a few million years.
export const SUN_T = 5772;
export const msL = (m) => (m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : 1.4 * Math.pow(m, 3.5));
export const msR = (m) => (m < 1 ? Math.pow(m, 0.8) : Math.pow(m, 0.7));
export const msT = (m) => SUN_T * Math.pow(msL(m) / (msR(m) ** 2), 0.25);
export const msLife = (m) => 10e9 * Math.pow(m, -2.5) + 3e6;
export function spectralClass(T) { return T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M'; }
export function colourName(T) { return T >= 20000 ? 'Blue' : T >= 10000 ? 'Blue-white' : T >= 7500 ? 'White' : T >= 6000 ? 'Yellow-white' : T >= 5200 ? 'Yellow-white (looks white from space)' : T >= 3700 ? 'Orange' : 'Red-orange'; }

export const fmtYears = (y) => (y >= 1e12 ? `${(y / 1e12).toFixed(y >= 1e13 ? 0 : 1)} trillion years` : y >= 1e9 ? `${(y / 1e9).toFixed(y >= 1e10 ? 0 : 1)} billion years` : y >= 1e6 ? `${(y / 1e6).toFixed(y >= 1e7 ? 0 : 1)} million years` : y >= 1e3 ? `${Math.round(y / 1e3).toLocaleString('en')} thousand years` : `${Math.round(y)} years`);
export const fmtSig = (v, d = 2) => { if (v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))); if (e >= 6 || e <= -3) return `${(v / 10 ** e).toFixed(1)} × 10<sup>${e}</sup>`; return v.toLocaleString('en', { maximumSignificantDigits: d }); };

// ---------------------------------------------------------------- a procedural star surface
// Value-noise granulation, slow drifting spots of brighter and darker gas, and limb darkening.
const NOISE = `
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }`;

export function surfaceMaterial({ color = 0xffd27a, scale = 7, contrast = 0.55, limb = 0.65, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uTime: { value: 0 }, uScale: { value: scale }, uCon: { value: contrast }, uLimb: { value: limb }, uBright: { value: 1.0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uTime, uScale, uCon, uLimb, uBright; varying vec3 vP; varying vec3 vN; varying vec3 vV; ${NOISE}
      void main(){
        vec3 p = normalize(vP) * uScale;
        float cells = vn(p * 2.2 + vec3(0.0, uTime * 0.25, 0.0)) * 0.7 + vn(p * 5.0 - vec3(uTime * 0.2)) * 0.3;
        float edge = smoothstep(0.15, 0.55, cells);
        float big = fbm(p * 0.6 + vec3(uTime * 0.05));
        float n = mix(0.55, 1.0, edge) * (0.75 + 0.5 * big);
        float mu = clamp(abs(dot(vN, vV)), 0.0, 1.0);
        float ld = 1.0 - uLimb * (1.0 - pow(mu, 0.6));
        vec3 c = uCol * mix(1.0, n, uCon) * ld * uBright;
        c += vec3(1.0, 0.9, 0.7) * pow(max(0.0, n - 0.95), 2.0) * 0.6;
        gl_FragColor = vec4(c, 1.0);
      }`,
    side,
  });
}

// A star: surface sphere plus a soft glow. g.setT(kelvin) recolours it; g.tick(dt) animates the gas.
export function starBall(R = 1, { T = SUN_T, glow = 3.2, seg = 96 } = {}) {
  const g = new THREE.Group();
  const mat = surfaceMaterial({ color: bbColor(T, 2.6), scale: 4, contrast: 0.45 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), mat);
  const h = halo(bbColor(T), glow, 0.55), h2 = halo(bbColor(T), glow * 2.2, 0.18);
  g.add(ball, h, h2);
  g.ball = ball; g.mat = mat; g.glow = [h, h2]; g.scale.setScalar(R);
  g.setT = (t) => { const c = bbColor(t); mat.uniforms.uCol.value.copy(bbColor(t, 2.6)); h.material.color.copy(c); h2.material.color.copy(c); };
  g.tick = (dt) => { mat.uniforms.uTime.value += dt; };
  g.setT(T);
  return g;
}

// A label that can be shown and hidden.
export const show = (o, on) => { o.visible = on; if (o.element) o.element.style.display = on ? '' : 'none'; };
