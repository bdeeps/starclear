// Chapter 2: fusion in the core. Step through the proton-proton chain (the Sun's main route) or the CNO cycle
// (the main route in stars heavier than about 1.3 Suns), and see why tunnelling is needed.
// Numbers: atomic masses H-1 = 1.007825 u, He-4 = 4.002602 u, so 4 H -> He loses ~0.7% of the mass (26.7 MeV).
// Sun: luminosity 3.828e26 W / c^2 = ~4.3e9 kg/s, i.e. roughly 4 million tonnes of mass turned into energy each second.
// Rates vs temperature are illustrative: pp ~ T^4; the CNO share is a smooth step that is ~1% at the Sun's centre
// and takes over above roughly 17 million K. Coulomb barrier for two protons ~0.5 MeV vs kT ~1.3 keV at 15 MK.
import { THREE, M, V, COL, cloud, halo, Lines, rng, spaceScene, clamp, lerp, smooth, show } from '../star.js';
import { canvasTexture } from '../kit.js';

const H = 1.007825, HE = 4.002602;
const ELEM = { 6: ['C', COL.carbon], 7: ['N', 0x6ec8ff], 8: ['O', 0xff6b8a] };
// pp chain: reactants (left, right) -> products. Each nucleus is [protons, neutrons]. Extras fly out.
const PP = [
  { a: [1, 0], b: [1, 0], out: [1, 1], fly: ['e+', 'nu'], eq: 'p + p → d + e⁺ + ν', say: 'Two protons collide. One turns into a neutron, giving off a positron and a neutrino. They are now deuterium (heavy hydrogen).' },
  { a: [1, 1], b: [1, 0], out: [2, 1], fly: ['gamma'], eq: 'd + p → ³He + γ', say: 'Deuterium grabs another proton and becomes helium-3, giving off a gamma ray.' },
  { a: [2, 1], b: [2, 1], out: [2, 2], fly: ['p', 'p'], eq: '³He + ³He → ⁴He + 2p', say: 'Two helium-3 nuclei meet and make helium-4. Two protons are set free to start again.' },
];
const CNO = [
  { from: [6, 6], to: [7, 6], inP: true, fly: ['gamma'], eq: '¹²C + p → ¹³N + γ', say: 'Carbon-12 captures a proton and becomes nitrogen-13.' },
  { from: [7, 6], to: [6, 7], inP: false, fly: ['e+', 'nu'], eq: '¹³N → ¹³C + e⁺ + ν', say: 'Nitrogen-13 is unstable. A proton turns into a neutron: it is now carbon-13.' },
  { from: [6, 7], to: [7, 7], inP: true, fly: ['gamma'], eq: '¹³C + p → ¹⁴N + γ', say: 'Carbon-13 captures a proton and becomes nitrogen-14.' },
  { from: [7, 7], to: [8, 7], inP: true, fly: ['gamma'], eq: '¹⁴N + p → ¹⁵O + γ', say: 'Nitrogen-14 captures a proton and becomes oxygen-15. This is the slowest step.' },
  { from: [8, 7], to: [7, 8], inP: false, fly: ['e+', 'nu'], eq: '¹⁵O → ¹⁵N + e⁺ + ν', say: 'Oxygen-15 decays: a proton becomes a neutron, making nitrogen-15.' },
  { from: [7, 8], to: [6, 6], inP: true, fly: ['he4'], eq: '¹⁵N + p → ¹²C + ⁴He', say: 'Nitrogen-15 takes one more proton and splits into carbon-12 and helium-4. The carbon is back, ready to go again.' },
];
const nucName = ([p, n]) => (p === 1 && n === 0 ? 'proton' : p === 1 && n === 1 ? 'deuterium' : p === 2 && n === 1 ? 'helium-3' : p === 2 && n === 2 ? 'helium-4' : `${ELEM[p]?.[0] ?? '?'}-${p + n}`);
const cnoShare = (T) => 1 / (1 + Math.exp(-(T - 17.3) / 0.36));

// Positions of n nucleons packed in a little ball (deterministic).
const PACK = (() => {
  const out = [[]];
  for (let n = 1; n <= 16; n++) {
    if (n === 1) { out.push([[0, 0, 0]]); continue; }
    if (n === 2) { out.push([[-0.12, 0, 0], [0.12, 0, 0]]); continue; }
    if (n === 3) { out.push([[0, 0.13, 0], [-0.12, -0.07, 0], [0.12, -0.07, 0]]); continue; }
    if (n === 4) { const a = 0.13; out.push([[a, a, a], [-a, -a, a], [-a, a, -a], [a, -a, -a]].map((p) => p.map((c) => c * 0.85))); continue; }
    const R = 0.13 * Math.cbrt(n) * 1.05, pts = [];
    for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(1 - y * y), a = i * 2.39996; const k = i % 3 === 0 ? 0.45 : 1; pts.push([Math.cos(a) * rr * R * k, y * R * k, Math.sin(a) * rr * R * k]); }
    out.push(pts);
  }
  return out;
})();

export default {
  id: 'fusion',
  short: 'Fusion in the core',
  title: 'Fusion: four hydrogens make one helium',
  subtitle: 'At about 15 million K, protons fuse. A little mass vanishes and becomes the Sun’s light.',
  view: { pos: [0.9, 0.9, 6.2], target: [1.1, 0.1, 0] },
  learn: `<p>The Sun’s core is about <b>15 million K</b> and packed tighter than lead. Hydrogen there is stripped to bare nuclei: <b>protons</b>. They race around and slam into each other.</p>
    <p>In the Sun, most energy comes from the <b>proton-proton chain</b>. Step by step, <b>four hydrogen nuclei become one helium nucleus</b>. But the helium weighs about <b>0.7% less</b> than the four hydrogens did. That missing mass has become energy, as Einstein’s <b>E = mc²</b> says. Because c² is enormous, a tiny mass gives a huge amount of energy.</p>
    <p>The Sun turns roughly <b>4 million tonnes</b> of mass into energy every second (that is its power output divided by c²). To do that it fuses roughly 600 million tonnes of hydrogen a second, and it is so big that it can keep going for billions of years.</p>
    <p>There is a puzzle. Protons are all positive, so they push each other away. At 15 million K a typical proton has hundreds of times too little energy to get over this wall, the <b>Coulomb barrier</b>. They fuse anyway thanks to <b>quantum tunnelling</b>: a proton is a bit like a wave, and a small part of the wave leaks through the wall. Now and then, a proton simply turns up on the other side.</p>
    <p>Stars heavier than about 1.3 Suns have hotter cores and mostly use the <b>CNO cycle</b>. Carbon, nitrogen and oxygen act like a helping hand: they capture protons one at a time and give back helium, while the carbon comes back unchanged.</p>
    <p class="tip"><b>Try it:</b> press <b>Next step</b> to walk through the chain, or turn on <b>Play</b>. Then switch to the CNO cycle, and slide the temperature to see which route wins.</p>
    <p class="note">How the two routes share the work at each temperature is a smooth illustrative curve, not a stellar model. Nuclei are not drawn to scale.</p>`,
  terms: [
    { t: 'Nuclear fusion', d: 'Light atomic nuclei joining into a heavier one, releasing energy.' },
    { t: 'Proton-proton chain', d: 'The chain of reactions that turns four hydrogen nuclei into one helium nucleus in the Sun.' },
    { t: 'CNO cycle', d: 'A fusion route in which carbon, nitrogen and oxygen nuclei help turn hydrogen into helium; dominant in stars heavier than about 1.3 Suns.' },
    { t: 'E = mc²', d: 'Einstein’s formula: mass and energy are interchangeable, and a small mass equals a lot of energy.' },
    { t: 'Coulomb barrier', d: 'The electric push between two positive nuclei that keeps them apart.' },
    { t: 'Quantum tunnelling', d: 'A particle getting through a barrier it does not have the energy to climb over, because it behaves partly like a wave.' },
    { t: 'Neutrino', d: 'A tiny, nearly massless particle that barely interacts with anything. Fusion makes enormous numbers of them.' },
  ],
  defaults: { mode: 'pp', ph: 0.2, play: true, T: 15, tunnel: true },
  onChange(s, key) { if (key === 'mode') s.ph = 0.2; },
  controls: [
    { key: 'mode', type: 'seg', label: 'Route', options: [{ v: 'pp', label: 'Proton-proton chain' }, { v: 'cno', label: 'CNO cycle' }] },
    { key: 'step', type: 'buttons', label: 'Step through', items: [
      { label: '◀ Back', act: (s) => { const n = s.mode === 'pp' ? 3 : 6; s.play = false; s.ph = ((Math.floor(s.ph) - 1 + n) % n) + 0.02; } },
      { label: 'Next step ▶', act: (s) => { const n = s.mode === 'pp' ? 3 : 6; s.play = false; s.ph = ((Math.floor(s.ph) + 1) % n) + 0.02; } },
    ] },
    { key: 'play', type: 'toggle', label: 'Play' },
    { key: 'T', type: 'range', label: 'Core temperature', min: 5, max: 30, step: 0.1, fmt: (v) => `${v.toFixed(1)} million K`, ends: ['Red dwarf', 'Heavy star'], hint: 'The Sun’s core is about 15 million K.' },
    { key: 'tunnel', type: 'toggle', label: 'Show the barrier and tunnelling' },
  ],
  quiz: [
    { q: 'In the proton-proton chain, what do four hydrogen nuclei become?', options: ['One carbon nucleus', 'One helium nucleus', 'Two deuterium nuclei', 'Pure light'], answer: 1, why: 'Four protons end up as one helium-4 nucleus, plus positrons, neutrinos and energy.' },
    { q: 'About how much of the mass disappears, turning into energy?', options: ['About 70%', 'About 7%', 'About 0.7%', 'None'], answer: 2, why: 'Helium-4 is about 0.7% lighter than four hydrogen atoms. E = mc² turns that into energy.' },
    { q: 'Why can protons fuse even though they repel each other?', options: ['Gravity pulls them together', 'Quantum tunnelling lets some slip through the barrier', 'They lose their charge in the core', 'Magnetic fields push them'], answer: 1, why: 'Few protons have the energy to climb the Coulomb barrier, but their wave nature lets a small fraction tunnel through.' },
    { q: 'What does the carbon do in the CNO cycle?', options: ['It is used up as fuel', 'It acts as a catalyst and comes back unchanged', 'It turns into iron', 'It cools the core'], answer: 1, why: 'Carbon captures protons step by step, but at the end carbon-12 is back and a helium nucleus has been made.' },
  ],
  reel: [
    { ms: 5600, caption: 'In the core, at about 15 million degrees, bare hydrogen nuclei crash together and fuse.', set: { mode: 'pp', ph: 0.05, play: false, T: 15, tunnel: false }, anim: { ph: [0.05, 1.0] }, view: { pos: [0.2, 0.6, 4.0], target: [0, 0.1, 0] }, spin: 0 },
    { ms: 5600, caption: 'Step by step, four hydrogens become one helium. It weighs 0.7% less. That lost mass becomes energy: about 4 million tonnes every second.', set: { mode: 'pp', ph: 1.0, play: false, T: 15, tunnel: false }, anim: { ph: [1.0, 2.95] }, view: { pos: [0.2, 0.7, 4.2], target: [0, 0.1, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage, { stars: false, amb: 0.7 });
    stage.scene.background = new THREE.Color(0x14080a);
    const root = stage.root, r = rng(5);
    const key = new THREE.PointLight(0xfff0d0, 30, 0, 1.6); key.position.set(2, 3, 4); root.add(key);
    // the hot soup of protons around the action
    const NS = 700, soup = cloud(NS, { size: 0.12, opacity: 0.7 }), home = new Float32Array(NS * 3), ph = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { let p; do { p = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]; } while (p[0] ** 2 + p[1] ** 2 + p[2] ** 2 > 1); const R = 4 + r() * 6; home.set([p[0] * R * 1.6, p[1] * R, p[2] * R - 3], i * 3); ph[i] = r() * 100; soup.setCol(i, COL.proton, 0.5 + 0.4 * r()); }
    root.add(soup);
    const glowBg = halo(0xff7a3d, 26, 0.12); glowBg.position.set(0, 0, -6); root.add(glowBg);

    // nucleon pool
    const geo = new THREE.SphereGeometry(0.12, 24, 16);
    const matP = M.plastic(COL.proton, { emissive: 0x551a12, roughness: 0.35 }), matN = M.plastic(COL.neutron, { emissive: 0x1a1d26, roughness: 0.35 });
    const pool = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(geo, matP); m.visible = false; root.add(m); return m; });
    let used = 0;
    const nucleus = (pn, at, spin = 0, mix = -1) => {
      const [p, n] = pn, pts = PACK[p + n], q = new THREE.Quaternion().setFromEuler(new THREE.Euler(spin * 0.7, spin, 0));
      pts.forEach((o, i) => {
        const m = pool[used++]; if (!m) return; m.visible = true;
        m.material = interleave(p, n)[i] && mix !== i ? matP : matN;
        m.position.copy(V(...o).applyQuaternion(q)).add(at);
      });
    };
    const ilCache = {};
    function interleave(p, n) { const k = p + '|' + n; if (ilCache[k]) return ilCache[k]; const out = []; let a = p, b = n; while (a + b) { if (a && (a >= b || !b)) { out.push(true); a--; } if (b && (b > a || !a)) { out.push(false); b--; } } return (ilCache[k] = out); }

    // little particles that fly out
    const mk = (col, size, op = 1) => { const h = halo(col, size, op); h.visible = false; root.add(h); return h; };
    const fx = { 'e+': [mk(COL.positron, 0.42), mk(COL.positron, 0.42)], nu: [mk(COL.neutrino, 0.32, 0.7), mk(COL.neutrino, 0.32, 0.7)], gamma: [mk(COL.gamma, 0.7), mk(COL.gamma, 0.7)] };
    const trails = new Lines(stage, 400, { color: 0xfff3a0, width: 2, opacity: 0.85 }); root.add(trails.obj);
    const flash = halo(0xfff1c2, 1, 0.9); root.add(flash);
    const eqL = label('', [0, -1.1, 0], root, 'hot'), sayL = label('', [0, -1.55, 0], root); show(sayL, false);
    sayL.element.style.maxWidth = '340px'; sayL.element.style.whiteSpace = 'normal'; sayL.element.style.textAlign = 'center';
    const flyL = { 'e+': label('positron', [0, 0, 0], root), nu: label('neutrino', [0, 0, 0], root), gamma: label('gamma ray', [0, 0, 0], root) };

    // CNO ring markers
    const ring = new THREE.Group(); root.add(ring);
    const RR = 2.3, ringDots = CNO.map((c, i) => { const a = Math.PI / 2 - (i / 6) * Math.PI * 2, m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 12), M.glow(ELEM[c.from[0]][1])); m.position.set(Math.cos(a) * RR, Math.sin(a) * RR, -0.4); ring.add(m); return m; });
    const ringLine = new THREE.Mesh(new THREE.TorusGeometry(RR, 0.012, 6, 120), M.ghost(0xffffff, 0.25)); ringLine.position.z = -0.4; ring.add(ringLine);
    const ringL = CNO.map((c, i) => { const a = Math.PI / 2 - (i / 6) * Math.PI * 2; return label(nucName(c.from), [Math.cos(a) * (RR + 0.45), Math.sin(a) * (RR + 0.3), -0.4], ring); });

    // the tunnelling panel
    const PW = 2.9, PH = 2.0;
    const pan = canvasTexture(580, 400, (g, w, h, T = 15, t = 0) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgba(12,10,18,0.88)'; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 18); g.fill(); g.stroke();
      const x0 = 46, y0 = h - 54, xw = w - 70, yh = h - 120, rn = 0.16; // rn: nuclear radius as a fraction of the axis
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(x0, 60); g.lineTo(x0, y0); g.lineTo(x0 + xw, y0); g.stroke();
      g.fillStyle = '#cfd6e6'; g.font = '600 17px Geist, system-ui, sans-serif'; g.fillText('The wall between two protons', 22, 34);
      g.font = '14px Geist, system-ui, sans-serif'; g.fillStyle = 'rgba(220,226,240,0.7)'; g.fillText('distance apart →', x0 + xw - 120, y0 + 22); g.save(); g.translate(22, y0 - 10); g.rotate(-Math.PI / 2); g.fillText('energy →', 0, 0); g.restore();
      const X = (f) => x0 + f * xw, Yv = (v) => y0 - v * yh;
      // potential: deep well inside rn, Coulomb ~ 1/r outside
      g.strokeStyle = '#ffb547'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0.02), Yv(-0.05)); g.lineTo(X(rn), Yv(-0.05)); g.lineTo(X(rn), Yv(1));
      for (let f = rn; f <= 1; f += 0.01) g.lineTo(X(f), Yv(rn / f)); g.stroke();
      g.fillStyle = '#ffb547'; g.font = '13px Geist, system-ui, sans-serif'; g.fillText('electric push (Coulomb barrier, ~0.5 MeV)', X(rn) + 10, Yv(0.93));
      // the proton's energy (drawn far larger than to scale; really ~1/400 of the barrier at 15 MK)
      const e = 0.05 + 0.006 * T, xt = rn / e; // classical turning point
      g.strokeStyle = '#6ec8ff'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(rn), Yv(e)); g.lineTo(X(1), Yv(e)); g.stroke(); g.setLineDash([]);
      // wave: oscillates outside, decays through the barrier, a tiny bit gets inside
      g.strokeStyle = '#d9f6ff'; g.lineWidth = 2; g.beginPath();
      const kap = 9 / Math.sqrt(T / 15);
      for (let f = 0.03; f <= 1; f += 0.003) {
        let a;
        if (f >= xt) a = 0.06 * Math.sin((f - xt) * 70 - t * 6);
        else if (f >= rn) a = 0.06 * Math.exp(-(xt - f) * kap) * Math.sin(-t * 6);
        else a = 0.06 * Math.exp(-(xt - rn) * kap) * Math.sin(f * 90 - t * 6);
        const y = Yv(e) - a * yh; if (f === 0.03) g.moveTo(X(f), y); else g.lineTo(X(f), y);
      }
      g.stroke();
      g.fillStyle = '#6ec8ff'; g.fillText(`typical proton energy at ${T.toFixed(0)} million K (~${(0.0862 * T).toFixed(1)} keV)`, X(0.33), Yv(e) - 12);
      g.fillStyle = 'rgba(220,226,240,0.75)'; g.fillText('a little of the wave leaks through:', X(rn) + 6, y0 + 22); g.fillStyle = '#d9f6ff'; g.fillText('tunnelling', X(rn) + 228, y0 + 22);
      g.fillStyle = 'rgba(220,226,240,0.55)'; g.fillText('not to scale', w - 104, 34);
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: pan.tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
    panel.position.set(3.45, 0.4, -0.2); panel.rotation.y = -0.32; root.add(panel);

    let t = 0;
    const flyPath = (kind, u, dir, at) => { // position of a flying product
      const k = smooth((u - 0.5) / 0.5), far = kind === 'nu' ? 6 : kind === 'gamma' ? 3.2 : 2.2;
      return at.clone().add(dir.clone().multiplyScalar(0.25 + far * (kind === 'nu' ? (u - 0.5) / 0.5 : k)));
    };
    return {
      update(dt, st) {
        t += dt;
        const n = st.mode === 'pp' ? 3 : 6;
        if (st.play) st.ph = (st.ph + dt * 0.28) % n;
        const step = Math.min(n - 1, Math.floor(st.ph)), u = st.ph - step;
        used = 0; pool.forEach((m) => (m.visible = false));
        Object.values(fx).flat().forEach((h) => (h.visible = false));
        Object.values(flyL).forEach((l) => show(l, false));
        const tr = [];
        const near = smooth(u / 0.45), sep = lerp(2.4, 0.16, near), spin = t * 0.8;
        const merged = u > 0.48;
        flash.visible = u > 0.42 && u < 0.62; flash.scale.setScalar(0.4 + 2.2 * Math.sin(clamp((u - 0.42) / 0.2, 0, 1) * Math.PI));
        const dirs = [V(-0.8, 0.8, 0.3).normalize(), V(0.9, 0.55, -0.2).normalize(), V(0.2, -1, 0.3).normalize()];
        const placeFly = (kinds) => kinds.forEach((kd, i) => {
          if (kd === 'p') { nucleus([1, 0], flyPath('p', u, i ? V(0.9, -0.5, 0.2).normalize() : V(-0.9, 0.5, 0.2).normalize(), V(0, 0, 0)), spin); return; }
          if (kd === 'he4') { nucleus([2, 2], flyPath('p', u, V(0.95, -0.4, 0.3).normalize(), V(0, 0, 0)), spin); return; }
          const h = fx[kd][0], d = kd === 'gamma' ? dirs[1] : dirs[i % 2 === 0 ? 0 : 1], p = flyPath(kd, u, d, V(0, 0, 0));
          h.visible = true; h.position.copy(p);
          if (kd === 'gamma') { const P = []; for (let k = 0; k <= 30; k++) { const f = k / 30, q = p.clone().sub(d.clone().multiplyScalar(f * 1.1)); const side = V(-d.y, d.x, 0).normalize().multiplyScalar(0.08 * Math.sin(f * 30 - t * 20)); P.push(q.add(side)); } tr.push(P); }
          if (kd === 'nu') { tr.push([p.clone(), p.clone().sub(d.clone().multiplyScalar(0.7))]); }
          flyL[kd].position.copy(p).add(V(0, 0.22, 0)); show(flyL[kd], st.labels !== false && u > 0.6);
        });
        if (st.mode === 'pp') {
          const R = PP[step];
          if (!merged) { nucleus(R.a, V(-sep, 0, 0), spin); nucleus(R.b, V(sep, 0, 0), -spin); }
          else { nucleus(R.out, V(0, 0, 0), spin); placeFly(R.fly); }
          eqL.element.textContent = `Step ${step + 1} of 3:  ${R.eq}`; 
        } else {
          const R = CNO[step];
          if (!merged) { nucleus(R.from, V(0, 0, 0), spin); if (R.inP) nucleus([1, 0], V(sep + 0.25, 0.2 * (1 - near), 0), -spin); }
          else { nucleus(R.to, V(0, 0, 0), spin); placeFly(R.fly); }
          eqL.element.textContent = `Step ${step + 1} of 6:  ${R.eq}`; 
          ringDots.forEach((d, i) => { d.scale.setScalar(i === step ? 1.9 : 1); d.material.color.setHex(i === step ? 0xffffff : ELEM[CNO[i].from[0]][1]); });
        }
        ring.visible = st.mode === 'cno'; ringL.forEach((l) => show(l, st.mode === 'cno'));
        trails.set(tr);
        // soup jitters faster when hotter
        const sp = Math.sqrt(st.T / 15);
        for (let i = 0; i < NS; i++) { const o = i * 3, a = ph[i] + t * 3 * sp; soup.pos[o] = home[o] + Math.sin(a * 1.3) * 0.25 * sp; soup.pos[o + 1] = home[o + 1] + Math.cos(a * 1.7) * 0.25 * sp; soup.pos[o + 2] = home[o + 2] + Math.sin(a * 0.9 + 1) * 0.25 * sp; }
        soup.upd();
        glowBg.material.color.setHSL(0.05 + 0.04 * clamp((st.T - 5) / 25, 0, 1), 1, 0.55);
        panel.visible = !!st.tunnel;
        if (st.tunnel) pan.redraw(st.T, t);
      },
      readout(st) {
        const lost = 4 * H - HE, pct = (lost / (4 * H)) * 100, pp = Math.pow(st.T / 15, 4), cno = cnoShare(st.T);
        const step = Math.floor(st.ph), list = st.mode === 'pp' ? PP : CNO;
        return `<div class="big">${list[Math.min(list.length - 1, step)].eq}</div><p class="r-say">${list[Math.min(list.length - 1, step)].say}</p>
          <div class="row"><span>4 hydrogen atoms</span><b>${(4 * H).toFixed(4)} u</b></div>
          <div class="row"><span>1 helium-4 atom</span><b>${HE.toFixed(4)} u</b></div>
          <div class="row"><span>Mass turned into energy</span><b>${pct.toFixed(2)}% (≈ 26.7 MeV)</b></div>
          <div class="row"><span>The Sun, per second (approx.)</span><b>~4 million tonnes</b></div>
          <div class="row"><span>pp-chain rate vs the Sun’s core</span><b>${pp < 10 ? pp.toFixed(2) : Math.round(pp)}×</b></div>
          <div class="row"><span>Share of energy from CNO (illustrative)</span><b>${cno < 0.01 ? '<1' : Math.round(cno * 100)}%</b></div>`;
      },
    };
  },
};
