// Chapter 4: colour, size and the Hertzsprung-Russell diagram.
// A main-sequence star of chosen mass, coloured by its blackbody temperature, next to an HR diagram drawn from the
// same rough scalings (see star.js: msL, msR, msT, msLife). The regions for giants, supergiants and white dwarfs are
// schematic outlines, not plotted catalogue data. Peak wavelength from Wien's law, 2.898e6 nm K / T.
import { THREE, M, V, starBall, spaceScene, clamp, lerp, show, bbCss, bbRGB, planck, wien, msL, msR, msT, msLife, spectralClass, colourName, fmtYears, fmtSig, SUN_T } from '../star.js';
import { canvasTexture } from '../kit.js';

const TMAX = 45000, TMIN = 2300, LMIN = 1e-4, LMAX = 1e6;
const hx = (T, w) => ((Math.log10(TMAX) - Math.log10(T)) / (Math.log10(TMAX) - Math.log10(TMIN))) * w;
const hy = (L, h) => (1 - (Math.log10(L) - Math.log10(LMIN)) / (Math.log10(LMAX) - Math.log10(LMIN))) * h;
const visR = (R) => clamp(0.85 * Math.pow(R, 0.5), 0.22, 2.4);

export default {
  id: 'colour',
  short: 'Colour, size and the HR diagram',
  title: 'Colour tells temperature',
  subtitle: 'Heavier stars burn hotter, bluer and far brighter, and live much shorter lives.',
  view: { pos: [0.6, 0.3, 11.5], target: [0.6, 0.1, 0] },
  learn: `<p>Heat anything enough and it glows: first dull red, then orange, yellow, white and blue-white. Stars work the same way. Their colour tells you the temperature of their surface. A cool <b>red</b> star is about <b>3,000 K</b>; the Sun is about <b>5,800 K</b> and looks white from space; a <b>blue</b> star is above about <b>20,000 K</b>. The hotter the star, the shorter the wavelength where its light peaks.</p>
    <p>In 1911 to 1913, Ejnar Hertzsprung and Henry Norris Russell each plotted stars by temperature and brightness. Most stars fall on one band, the <b>main sequence</b>: stars quietly fusing hydrogen in their cores. Where a star sits on that band is set mainly by its <b>mass</b>.</p>
    <p>A heavier star has stronger gravity, so its core must be hotter and denser to hold it up. Fusion speeds up enormously. Roughly, brightness rises like <b>mass<sup>3.5</sup></b>, so a star of 10 Suns shines thousands of times brighter. It has more fuel, but burns it far faster, so its life is shorter: roughly <b>10 billion years × mass<sup>−2.5</sup></b>.</p>
    <p>Above the main sequence sit <b>giants</b> and <b>supergiants</b>, swollen stars near the end of their lives. Below it are <b>white dwarfs</b>, the hot leftover cores of dead stars.</p>
    <p class="tip"><b>Try it:</b> drag the mass slider and watch the star move along the main sequence. Look at the spectrum under it: where does its light peak?</p>
    <p class="note">The scalings are rough rules of thumb; real stars scatter around them. Lifetimes for very massive stars level off at a few million years. Star colours are slightly saturated so you can see them.</p>`,
  terms: [
    { t: 'Hertzsprung-Russell diagram', d: 'A chart of stars by surface temperature (or colour) and brightness. Most stars lie on the main sequence.' },
    { t: 'Main sequence', d: 'The long stage of a star’s life when it fuses hydrogen into helium in its core.' },
    { t: 'Luminosity', d: 'The total power a star gives out, often measured in Suns.' },
    { t: 'Spectral class', d: 'A letter for a star’s temperature: O, B, A, F, G, K, M from hottest to coolest. The Sun is a G star.' },
    { t: 'Blackbody', d: 'An ideal glowing object whose colour depends only on its temperature. Stars are close to blackbodies.' },
    { t: 'Wien’s law', d: 'The hotter a body, the shorter the wavelength where its glow is strongest.' },
  ],
  defaults: { m: 1, radii: true },
  controls: [
    { key: 'm', type: 'log', label: 'Star mass', min: 0.1, max: 40, fmt: (v) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)} Suns`, ends: ['Red dwarf', 'Blue giant'] },
    { key: 'pre', type: 'buttons', label: 'Jump to', items: [{ label: 'Red dwarf', act: (s) => (s.m = 0.15) }, { label: 'The Sun', act: (s) => (s.m = 1) }, { label: '2 Suns', act: (s) => (s.m = 2) }, { label: '20 Suns', act: (s) => (s.m = 20) }] },
    { key: 'radii', type: 'toggle', label: 'Show lines of equal size' },
  ],
  quiz: [
    { q: 'Which star is hottest?', options: ['A red star', 'An orange star', 'A yellow-white star', 'A blue star'], answer: 3, why: 'Blue stars are the hottest, above about 20,000 K. Red ones are the coolest, about 3,000 K.' },
    { q: 'What mostly sets where a star sits on the main sequence?', options: ['Its age', 'Its mass', 'Its distance from us', 'Its colour filter'], answer: 1, why: 'Mass sets the core’s temperature and so the fusion rate, the brightness and the surface temperature.' },
    { q: 'A star of 10 Suns has about 10 times the fuel. Does it live longer than the Sun?', options: ['Yes, 10 times longer', 'Yes, a bit longer', 'No: it burns thousands of times faster and lives far shorter', 'Same lifetime'], answer: 2, why: 'Brightness rises roughly as mass to the power 3.5, so lifetime falls roughly as mass to the power −2.5: tens of millions of years.' },
  ],
  reel: [
    { ms: 5600, caption: 'Colour is temperature. Red stars are about 3,000 degrees. Blue ones top 20,000. Heavier stars burn hotter.', set: { m: 0.15, radii: false }, anim: { m: [0.15, 20, true] }, view: { pos: [0.6, 0.3, 11.5], target: [0.6, 0.1, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage);
    const root = stage.root;
    const star = starBall(1, { glow: 3.4 }); star.position.set(-3.6, 0.9, 0); root.add(star);
    const sunRef = new THREE.Mesh(new THREE.RingGeometry(0.84, 0.865, 96), M.ghost(0xffffff, 0.45)); sunRef.position.copy(star.position).add(V(0, 0, 1.6)); root.add(sunRef);
    const sunTag = label('Sun’s size', [-3.6, 0.9 + 0.98, 1.6], root);

    // spectrum panel under the star
    const spec = canvasTexture(560, 260, (g, w, h, T = SUN_T) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(12,12,18,0.85)'; g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 2; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 16); g.fill(); g.stroke();
      const x0 = 30, x1 = w - 20, y0 = h - 50, top = 44, L0 = 100, L1 = 2000, X = (l) => x0 + ((Math.log10(l) - Math.log10(L0)) / (Math.log10(L1) - Math.log10(L0))) * (x1 - x0);
      // visible band
      for (let l = 380; l <= 750; l += 2) { const hue = 270 - ((l - 380) / 370) * 270; g.fillStyle = `hsla(${hue},90%,55%,0.35)`; g.fillRect(X(l), top, X(l + 2) - X(l) + 0.5, y0 - top); }
      let mx = 0; const pts = []; for (let i = 0; i <= 200; i++) { const l = L0 * Math.pow(L1 / L0, i / 200), b = planck(l, T); pts.push([l, b]); mx = Math.max(mx, b); }
      g.strokeStyle = bbCss(T); g.lineWidth = 3; g.beginPath(); pts.forEach(([l, b], i) => { const y = y0 - (b / mx) * (y0 - top - 6); i ? g.lineTo(X(l), y) : g.moveTo(X(l), y); }); g.stroke();
      const pk = wien(T); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(X(pk), top); g.lineTo(X(pk), y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#e7ecf6'; g.font = '600 16px Geist, system-ui, sans-serif'; g.fillText('Its light, by wavelength', 16, 28);
      g.font = '13px Geist, system-ui, sans-serif'; g.fillStyle = 'rgba(230,236,246,0.75)';
      g.fillText(`peak ${Math.round(pk)} nm`, clamp(X(pk) + 6, 20, w - 110), top + 16);
      [[200, 'UV'], [550, 'visible'], [1500, 'infrared']].forEach(([l, t]) => g.fillText(t, X(l) - 18, y0 + 20));
      g.fillText('100 nm', x0 - 6, y0 + 38); g.fillText('2,000 nm', x1 - 60, y0 + 38);
    });
    const specM = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.58), new THREE.MeshBasicMaterial({ map: spec.tex, transparent: true, toneMapped: false, depthWrite: false }));
    specM.position.set(-3.6, -2.55, 0.3); root.add(specM);

    // HR diagram
    const W = 900, Hh = 760, PAD = { l: 92, r: 30, t: 54, b: 92 };
    const hr = canvasTexture(W, Hh, (g, w, h, m = 1, radii = true) => {
      const pw = w - PAD.l - PAD.r, ph = h - PAD.t - PAD.b, X = (T) => PAD.l + hx(T, pw), Y = (L) => PAD.t + hy(L, ph);
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(10,11,18,0.88)'; g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 2; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 20); g.fill(); g.stroke();
      g.save(); g.beginPath(); g.rect(PAD.l, PAD.t, pw, ph); g.clip();
      // colour strip by temperature
      for (let i = 0; i < pw; i += 3) { const T = Math.pow(10, Math.log10(TMAX) - (i / pw) * (Math.log10(TMAX) - Math.log10(TMIN))); g.fillStyle = bbCss(T); g.globalAlpha = 0.09; g.fillRect(PAD.l + i, PAD.t, 3, ph); }
      g.globalAlpha = 1;
      // grid
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
      for (let e = -4; e <= 6; e++) { g.beginPath(); g.moveTo(PAD.l, Y(10 ** e)); g.lineTo(PAD.l + pw, Y(10 ** e)); g.stroke(); }
      // equal-radius lines: L = R^2 (T/5772)^4
      if (radii) {
        g.strokeStyle = 'rgba(180,200,255,0.28)'; g.setLineDash([6, 8]); g.font = '13px Geist, system-ui, sans-serif'; g.fillStyle = 'rgba(180,200,255,0.6)';
        [[0.01, '0.01 R☉'], [0.1, '0.1 R☉'], [1, '1 R☉'], [10, '10 R☉'], [100, '100 R☉'], [1000, '1,000 R☉']].forEach(([R, t]) => {
          g.beginPath(); for (let i = 0; i <= 40; i++) { const T = TMIN * Math.pow(TMAX / TMIN, i / 40), L = R * R * (T / SUN_T) ** 4; i ? g.lineTo(X(T), Y(L)) : g.moveTo(X(T), Y(L)); } g.stroke();
          const T = R >= 100 ? 3300 : R >= 10 ? 5200 : R >= 1 ? 30000 : 30000, L = R * R * (T / SUN_T) ** 4; if (L > LMIN && L < LMAX) g.fillText(t, X(T) + 4, Y(L) - 6);
        });
        g.setLineDash([]);
      }
      // schematic regions
      const blob = (Ta, Tb, La, Lb, col, txt, tx, ty) => { const cx = (X(Ta) + X(Tb)) / 2, cy = (Y(La) + Y(Lb)) / 2, rx = Math.abs(X(Tb) - X(Ta)) / 2, ry = Math.abs(Y(Lb) - Y(La)) / 2; g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(235,240,250,0.8)'; g.font = '600 17px Geist, system-ui, sans-serif'; g.fillText(txt, tx ?? cx - rx * 0.6, ty ?? cy + 6); };
      blob(3300, 5300, 15, 1500, 'rgba(255,140,80,0.16)', 'Giants');
      blob(3300, 30000, 2e4, 9e5, 'rgba(160,140,255,0.13)', 'Supergiants');
      blob(6000, 35000, 1.2e-4, 8e-3, 'rgba(200,220,255,0.14)', 'White dwarfs');
      // main sequence from the model
      g.strokeStyle = 'rgba(255,230,180,0.22)'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= 80; i++) { const mm = 0.1 * Math.pow(400, i / 80); i ? g.lineTo(X(msT(mm)), Y(msL(mm))) : g.moveTo(X(msT(mm)), Y(msL(mm))); } g.stroke();
      g.fillStyle = 'rgba(255,236,200,0.85)'; g.font = '600 17px Geist, system-ui, sans-serif'; g.save(); g.translate(X(9000), Y(30) + 46); g.rotate(0.62); g.fillText('Main sequence', 0, 0); g.restore();
      // mass ticks
      g.font = '12px Geist, system-ui, sans-serif'; g.fillStyle = 'rgba(255,236,200,0.6)';
      [0.2, 0.5, 1, 2, 5, 10, 20].forEach((mm) => { const x = X(msT(mm)), y = Y(msL(mm)); g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); g.fillText(`${mm} M☉`, x + 8, y + 20); });
      // the Sun
      g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(X(SUN_T), Y(1), 9, 0, 7); g.stroke(); g.beginPath(); g.arc(X(SUN_T), Y(1), 2, 0, 7); g.fillStyle = '#fff'; g.fill(); g.fillText('Sun', X(SUN_T) + 12, Y(1) - 10);
      // this star
      const T = msT(m), L = msL(m), x = X(T), y = Y(L);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(x, PAD.t + ph); g.lineTo(x, y); g.lineTo(PAD.l, y); g.stroke(); g.setLineDash([]);
      const rg = g.createRadialGradient(x, y, 0, x, y, 30); rg.addColorStop(0, bbCss(T)); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill();
      g.fillStyle = bbCss(T); g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
      g.restore();
      // axes
      g.fillStyle = 'rgba(230,236,246,0.85)'; g.font = '600 19px Geist, system-ui, sans-serif'; g.fillText('Hertzsprung–Russell diagram', PAD.l, 34);
      g.font = '14px Geist, system-ui, sans-serif'; g.fillStyle = 'rgba(230,236,246,0.7)';
      [40000, 20000, 10000, 6000, 4000, 3000].forEach((T) => g.fillText(T.toLocaleString('en'), PAD.l + hx(T, pw) - 18, h - PAD.b + 24));
      ['O', 'B', 'A', 'F', 'G', 'K', 'M'].forEach((c, i) => { const T = [38000, 18000, 8600, 6700, 5600, 4400, 3000][i]; g.fillStyle = bbCss(T); g.fillText(c, PAD.l + hx(T, pw) - 4, h - PAD.b + 46); });
      g.fillStyle = 'rgba(230,236,246,0.7)'; g.fillText('surface temperature (K) and spectral class  ← hotter', PAD.l + pw / 2 - 170, h - 18);
      const sup = (e) => String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
      for (let e = -4; e <= 6; e += 2) g.fillText(e === 0 ? '1' : `10${sup(e)}`, 40, PAD.t + hy(10 ** e, ph) + 5);
      g.save(); g.translate(24, PAD.t + ph / 2 + 80); g.rotate(-Math.PI / 2); g.fillText('brightness (Suns) →', 0, 0); g.restore();
    });
    const hrM = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2 * (Hh / W)), new THREE.MeshBasicMaterial({ map: hr.tex, transparent: true, toneMapped: false, depthWrite: false }));
    hrM.position.set(2.6, 0, 0); hrM.rotation.y = -0.12; root.add(hrM);

    let lastM = -1, lastRad = null;
    return {
      update(dt, st) {
        star.tick(dt);
        const m = st.m, T = msT(m), R = msR(m);
        if (Math.abs(m - lastM) > 1e-4 || st.radii !== lastRad) { hr.redraw(m, st.radii); spec.redraw(T); lastM = m; lastRad = st.radii; }
        star.setT(T); star.scale.setScalar(visR(R)); star.glow[0].scale.setScalar(3.4 * clamp(Math.pow(msL(m), 0.08), 0.6, 2.2)); star.glow[1].scale.setScalar(7.5 * clamp(Math.pow(msL(m), 0.08), 0.6, 2.2));
        sunRef.scale.setScalar(visR(1) / 0.85); sunTag.position.y = 0.9 + visR(1) + 0.12;
      },
      readout(st) {
        const m = st.m, T = msT(m), L = msL(m), R = msR(m), life = msLife(m);
        return `<div class="big" style="color:${bbCss(T)}">${colourName(T)} · class ${spectralClass(T)}</div>
          <p class="r-say">A main-sequence star of ${m < 1 ? m.toFixed(2) : m.toFixed(1)} Suns, using rough rules of thumb.</p>
          <div class="row"><span>Surface temperature</span><b>~${(Math.round(T / 100) * 100).toLocaleString('en')} K</b></div>
          <div class="row"><span>Brightness</span><b>~${fmtSig(L)} Suns</b></div>
          <div class="row"><span>Size</span><b>~${R.toFixed(R < 1 ? 2 : 1)} × the Sun</b></div>
          <div class="row"><span>Light peaks at</span><b>${Math.round(wien(T))} nm</b></div>
          <div class="row"><span>Main-sequence life</span><b>~${fmtYears(life)}</b></div>`;
      },
    };
  },
};
