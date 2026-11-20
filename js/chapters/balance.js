// Chapter 1: a ball of gas in balance (hydrostatic equilibrium).
// A cutaway Sun with its layers, gas parcels with a gravity arrow (in) and a pressure arrow (out), and a toy
// "stellar thermostat": radius x (1 = today's Sun) obeys  x'' = k (p / x^3 - 1 / x^2) - damping x'.
// Pressure falls off faster with size than gravity does, so the star settles where they match (x = p).
// Core temperature follows the virial rule of thumb T ~ 1 / x: squeeze a star and it heats up.
// The layer boundaries are rounded published values (core to ~0.25 R, radiative zone to ~0.7 R).
import { THREE, M, V, COL, starBall, halo, cloud, Lines, rng, spaceScene, clamp, lerp, smooth, show } from '../star.js';
import { arrow, canvasTexture } from '../kit.js';

const LAYERS = [
  { id: 'core', name: 'Core', r0: 0, r1: 0.25, col: '#fff4d0', at: 0.1, note: 'about 15 million K' },
  { id: 'rad', name: 'Radiative zone', r0: 0.25, r1: 0.7, col: '#ffb04a', at: 0.48, note: 'light creeps outward' },
  { id: 'conv', name: 'Convective zone', r0: 0.7, r1: 1, col: '#ff6a2b', at: 0.85, note: 'gas boils up and sinks' },
];

export default {
  id: 'balance',
  short: 'A ball of gas in balance',
  title: 'A ball of gas, held in balance',
  subtitle: 'Gravity pulls in. Hot gas pushes out. A star lives where they match.',
  view: { pos: [3.2, 1.6, 4.3], target: [0, 0, 0] },
  learn: `<p>A star like the Sun is a huge ball of hot gas, mostly <b>hydrogen</b> and <b>helium</b>. It has no solid surface. What holds it together is its own <b>gravity</b>: every bit of gas is pulled toward the centre.</p>
    <p>So why doesn’t it collapse? Because the gas inside is hot and squeezed, and hot, squeezed gas <b>pushes back</b>. At every depth the outward push of <b>pressure</b> matches the weight of all the gas above it. Astronomers call this <b>hydrostatic equilibrium</b>.</p>
    <p>The balance looks after itself. If the core loses some heat, gravity wins for a while and the star <b>shrinks</b>. Squeezing heats the gas, the pressure climbs and the shrinking stops. If the core makes too much heat, the star <b>swells</b>, cools a little and settles again.</p>
    <p>Inside the Sun there are layers. The <b>core</b> (the inner quarter of the radius, about 15 million K) is where energy is made. Above it, in the <b>radiative zone</b>, light slowly works its way outward. In the outer 30% or so, the <b>convective zone</b>, hot gas rises and cooler gas sinks like boiling soup. The visible surface, the <b>photosphere</b>, is about 5,800 K. Above it lie the thin, reddish <b>chromosphere</b> and the faint <b>corona</b>, which is strangely hotter: over a million kelvin.</p>
    <p class="tip"><b>Try it:</b> slide the pressure push down and watch the star shrink and its core heat up, until the arrows match again. Then press <b>Kick</b> and watch it ring and settle.</p>
    <p class="note">The shrinking and swelling are a toy model with rounded numbers. Layers are drawn to scale by radius; the chromosphere and corona are thickened so you can see them.</p>`,
  terms: [
    { t: 'Hydrostatic equilibrium', d: 'The balance in which the outward push of gas pressure matches the inward pull of gravity at every depth.' },
    { t: 'Core', d: 'The hot, dense centre of a star, where nuclear fusion makes its energy.' },
    { t: 'Radiative zone', d: 'The layer where energy moves outward as light, absorbed and re-emitted again and again.' },
    { t: 'Convective zone', d: 'The outer layer where energy is carried by hot gas rising and cooler gas sinking.' },
    { t: 'Photosphere', d: 'The visible surface of the Sun, where light finally escapes into space; about 5,800 K.' },
    { t: 'Corona', d: 'The Sun’s thin outer atmosphere, over a million kelvin, seen during a total solar eclipse.' },
  ],
  defaults: { push: 1, cut: true, labels: true, speed: 1 },
  controls: [
    { key: 'push', type: 'range', label: 'Pressure push', min: 0.6, max: 1.4, step: 0.01, fmt: (v) => `${Math.round(v * 100)}% of normal`, ends: ['Weaker: gravity wins', 'Stronger: pressure wins'] },
    { key: 'kick', type: 'buttons', label: 'Disturb it', items: [{ label: 'Kick inward', act: (s, inst) => inst.kick?.(-0.9) }, { label: 'Kick outward', act: (s, inst) => inst.kick?.(0.9) }, { label: 'Back to normal', act: (s) => { s.push = 1; } }] },
    { key: 'cut', type: 'toggle', label: 'Cut away a slice' },
    { key: 'labels', type: 'toggle', label: 'Name the layers' },
  ],
  quiz: [
    { q: 'What stops a star from collapsing under its own gravity?', options: ['Its solid rocky surface', 'The outward push of hot, squeezed gas', 'The Sun’s magnetic field alone', 'Nothing: stars are always collapsing'], answer: 1, why: 'Gas pressure pushes outward and matches gravity at every depth: hydrostatic equilibrium.' },
    { q: 'If a star’s core loses heat, what happens next?', options: ['It explodes at once', 'It shrinks, which heats the gas until pressure balances again', 'It swells and cools', 'Nothing changes'], answer: 1, why: 'Gravity wins for a while. Squeezing heats the gas, pressure rises and the shrinking stops.' },
    { q: 'Where in the Sun is energy made?', options: ['In the corona', 'In the photosphere', 'In the core', 'In the convective zone'], answer: 2, why: 'Fusion only happens in the core, where it is hot and dense enough: about 15 million K.' },
  ],
  reel: [
    { ms: 5200, caption: 'A star is a giant ball of hot gas. Inside: a blazing core, a zone where light creeps outward, and a boiling outer layer.', set: { push: 1, cut: true, labels: false }, view: { pos: [3.0, 1.5, 4.0], target: [0, 0, 0] }, spin: 0.4 },
    { ms: 5400, caption: 'Hot gas pushes out as hard as gravity pulls in. Weaken the push and the star shrinks and heats until they match again.', set: { push: 1, cut: true, labels: false }, anim: { push: [1, 0.72] }, view: { pos: [2.6, 1.3, 3.6], target: [0, 0, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage);
    const root = stage.root, r = rng(3);
    const sun = new THREE.Group(); root.add(sun);
    const inner = new THREE.Group(); inner.rotation.y = Math.PI; sun.add(inner); // open wedge faces +x,+z

    // the surface, with a quarter wedge cut out (or whole)
    const star = starBall(1, { glow: 0, seg: 128 });
    star.glow.forEach((h) => (h.visible = false));
    star.mat.uniforms.uCol.value.setHex(0xffa850); // the Sun's surface, tinted warm so it reads as the Sun
    const shell = (cut) => new THREE.SphereGeometry(1, 128, 64, 0, cut ? Math.PI * 1.5 : Math.PI * 2);
    star.ball.geometry = shell(true);
    star.mat.side = THREE.DoubleSide;
    inner.add(star);

    // cut faces: half discs painted with the layers (and the core brightening when hot)
    const face = canvasTexture(512, 512, (g, w, h, heat = 1) => {
      g.clearRect(0, 0, w, h);
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      const hot = clamp(heat, 0.5, 2);
      gr.addColorStop(0, hot > 1.05 ? '#ffffff' : '#fff8e2'); gr.addColorStop(0.2, '#ffe6a0'); gr.addColorStop(0.25, '#ffc65a');
      gr.addColorStop(0.27, '#ffb04a'); gr.addColorStop(0.68, '#ff8a2e'); gr.addColorStop(0.7, '#e2541c'); gr.addColorStop(0.985, '#a8300f'); gr.addColorStop(1, '#ffcf70');
      g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 7); g.fill();
      // convection cells in the outer ring
      g.globalAlpha = 0.28; g.strokeStyle = '#ffd08a'; g.lineWidth = 3;
      for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283, rr = 0.85 * w / 2; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, 0.07 * w, 0.034 * w, a, 0, 7); g.stroke(); }
      // the core glows brighter / dimmer with its temperature
      g.globalAlpha = clamp(0.25 + 0.5 * (hot - 1), 0, 0.85); const cg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 0.27 * w);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = cg; g.fillRect(0, 0, w, h);
      g.globalAlpha = 1;
    });
    const faceMat = new THREE.MeshBasicMaterial({ map: face.tex, side: THREE.DoubleSide, toneMapped: false, transparent: true });
    const faces = [0, Math.PI * 1.5].map((phi) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 96, -Math.PI / 2, Math.PI), faceMat);
      m.rotation.y = phi + Math.PI; inner.add(m); return m;
    });

    // chromosphere (thin red rim) and corona (soft glow and faint streamers), thickened for visibility
    const chromo = new THREE.Mesh(new THREE.SphereGeometry(1.025, 96, 48), new THREE.MeshBasicMaterial({ color: COL.chromo, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
    sun.add(chromo);
    const corona = halo(COL.corona, 5.6, 0.3), corona2 = halo(0xffe0a8, 3.0, 0.55); sun.add(corona, corona2);
    const streams = new Lines(stage, 900, { color: COL.corona, width: 1, opacity: 0.09 });
    const polys = [];
    for (let i = 0; i < 70; i++) {
      const u = r() * 2 - 1, a = r() * 6.283, d = V(Math.sqrt(1 - u * u) * Math.cos(a), u * 0.8, Math.sqrt(1 - u * u) * Math.sin(a)).normalize(), L = 0.5 + r() * 0.9, P = [];
      const bend = V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.25);
      for (let k = 0; k <= 12; k++) { const t = k / 12, rr = lerp(1.02, 1.02 + L, t); P.push(d.clone().multiplyScalar(rr).add(bend.clone().multiplyScalar(t * t))); }
      polys.push(P);
    }
    streams.set(polys); sun.add(streams.obj);

    // gas parcels with gravity (in) and pressure (out) arrows, on the two cut faces
    const parcels = [];
    for (const phi of [0, Math.PI * 1.5]) for (const el of [-0.9, 0, 0.9]) {
      // face plane: direction (cos(rot), 0, -sin(rot)) for rotation.y = rot
      const rot = phi + Math.PI, hor = V(Math.cos(rot), 0, -Math.sin(rot)), d = hor.multiplyScalar(Math.cos(el)).add(V(0, Math.sin(el), 0)).normalize();
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), M.glow(0xffffff));
      const ga = arrow(COL.gravity, 0.3, 0.07, 0.014), pa = arrow(COL.pressure, 0.3, 0.07, 0.014);
      const grp = new THREE.Group(); grp.add(p, ga, pa); inner.add(grp);
      parcels.push({ grp, d, ga, pa, p });
    }
    const lab = LAYERS.map((L) => label(`<b>${L.name}</b><br><small>${L.note}</small>`, [0, 0, 0], sun));
    const labPh = label('<b>Photosphere</b><br><small>the surface we see, ~5,800 K</small>', [0, 0, 0], sun);
    const labCh = label('<b>Chromosphere</b>', [0, 0, 0], sun), labCo = label('<b>Corona</b><br><small>over a million K</small>', [0, 0, 0], sun);
    const tagG = label('Gravity pulls in', [0, 0, 0], root, 'hot'), tagP = label('Pressure pushes out', [0, 0, 0], root);
    tagG.element.style.color = '#ffb547'; tagP.element.style.color = '#6ec8ff';

    let x = 1, v = 0, lastHeat = -1, lastCut = null;
    const inst = {
      kick(dv) { v += dv; },
      update(dt, st) {
        st.cut ??= true;
        // toy dynamics, sub-stepped for stability
        const n = 4, h = dt / n;
        for (let i = 0; i < n; i++) { const a = 9 * (st.push / x ** 3 - 1 / x ** 2) - 2.2 * v; v += a * h; x = clamp(x + v * h, 0.4, 1.9); }
        sun.scale.setScalar(x);
        star.tick(dt * (st.speed ?? 1));
        const heat = 1 / x;
        if (Math.abs(heat - lastHeat) > 0.01) { face.redraw(heat); lastHeat = heat; }
        star.mat.uniforms.uBright.value = 1.1 + 0.35 * (heat - 1);
        if (st.cut !== lastCut) { lastCut = st.cut; star.ball.geometry.dispose(); star.ball.geometry = shell(st.cut); faces.forEach((f) => (f.visible = st.cut)); }
        const Fg = 1 / x ** 2, Fp = st.push / x ** 3;
        parcels.forEach((q) => {
          const pos = q.d.clone().multiplyScalar(0.58);
          q.grp.position.copy(pos);
          q.ga.quaternion.setFromUnitVectors(V(0, 1, 0), q.d.clone().negate()); q.ga.set(0.24 * Fg);
          q.pa.quaternion.setFromUnitVectors(V(0, 1, 0), q.d); q.pa.set(0.24 * Fp);
          q.grp.visible = st.cut;
        });
        // labels on the open faces (in sun space, wedge opens toward +x,+z)
        const LP = [[0.12, -0.02, 0.12], [0.3, -0.42, 0.3], [0.5, 0.62, 0.5]];
        lab.forEach((o, i) => { o.position.set(...LP[i]); show(o, st.labels && st.cut); });
        labPh.position.set(-0.45, 0.93, 0.45); labCh.position.set(-0.75, -0.75, 0.2); labCo.position.set(-1.25, 1.25, -0.3);
        [labPh, labCh, labCo].forEach((o) => show(o, st.labels));
        const pq = parcels[1].d.clone().multiplyScalar(0.58 * x);
        const inv = V(-pq.x, pq.y, -pq.z); // inner group is rotated by pi
        tagG.position.copy(inv).add(V(0, -0.22 * x, 0)); tagP.position.copy(inv).add(V(0, 0.22 * x, 0));
        show(tagG, false); show(tagP, false);
        corona.material.opacity = 0.3; chromo.scale.setScalar(1);
      },
      readout(st) {
        const Fg = 1 / x ** 2, Fp = st.push / x ** 3, d = Fp - Fg;
        const state = Math.abs(v) < 0.02 && Math.abs(d) < 0.02 ? ['In balance', 'Pressure and gravity match, so the size holds steady.'] : v < 0 ? ['Shrinking and heating', 'Gravity is winning, so the gas is squeezed and its temperature climbs.'] : ['Swelling and cooling', 'Pressure is winning, so the gas spreads out and cools.'];
        const bar = (val, col) => `<span style="display:inline-block;height:8px;border-radius:4px;background:${col};width:${clamp(val * 90, 2, 160)}px"></span>`;
        return `<div class="big">${state[0]}</div><p class="r-say">${state[1]}</p>
          <div class="row"><span style="color:#ffb547">Gravity, inward (orange arrows)</span><b>${bar(Fg, '#ffb547')}</b></div>
          <div class="row"><span style="color:#6ec8ff">Pressure, outward (blue arrows)</span><b>${bar(Fp, '#6ec8ff')}</b></div>
          <div class="row"><span>Size (today’s Sun = 1)</span><b>${x.toFixed(2)}×</b></div>
          <div class="row"><span>Core temperature (toy model)</span><b>${(15 / x).toFixed(1)} million K</b></div>`;
      },
    };
    return inst;
  },
};
