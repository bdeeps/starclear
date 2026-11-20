// Chapter 3: the long walk out. A slice through the Sun (radius 3 units). A photon random-walks out of the
// radiative zone, is carried up by convection, leaves the photosphere and flies to Earth. Neutrinos fly straight out.
// Escape-time estimate (rough diffusion): t ~ R^2 / (l c), with R = 0.7 solar radii (~4.9e8 m) and mean free path l.
// Published estimates for the real Sun span roughly 10,000 to 170,000 years. Light takes ~499 s (8 min 19 s) to reach
// Earth; neutrinos cross the Sun's radius in ~2.3 s (6.96e8 m / c). The picture is not to scale in size or time.
import { THREE, M, V, COL, cloud, halo, Lines, rng, spaceScene, surfaceMaterial, bbColor, clamp, lerp, smooth, show, fmtYears } from '../star.js';
import { canvasTexture } from '../kit.js';

const R = 3, RZ = 0.7 * R, EARTH = 10.5, RSUN = 6.957e8, C = 2.998e8, YEAR = 3.156e7;
const escapeYears = (mm) => (0.7 * RSUN) ** 2 / ((mm / 1000) * C) / YEAR;
const P1 = 0.62, P2 = 0.78; // walk ends, convection ends

export default {
  id: 'walk',
  short: 'The long walk out',
  title: 'The long walk out',
  subtitle: 'Light made in the core takes many thousands of years to escape, then 8 minutes to reach us.',
  view: { pos: [3.6, 1.2, 14], target: [3.6, 0, 0] },
  learn: `<p>Energy made in the core leaves as light, as <b>gamma rays</b>. But the Sun’s inside is so dense that light cannot travel far. It is absorbed by the gas, given out again in a random direction, absorbed again, and so on, countless times. Its path is a drunken stagger, a <b>random walk</b>.</p>
    <p>A random walk is slow: to get N steps away from where you started, you need about N² steps. So energy takes a very long time to cross the <b>radiative zone</b>. Published estimates range from about <b>10,000 to 170,000 years</b>, depending on how the model treats the Sun’s inside. On the way the light is re-emitted at lower and lower energies, ending as mostly visible light.</p>
    <p>In the outer third, the gas is cooler and more opaque, and it starts to <b>boil</b>. Hot blobs rise, cool at the top and sink again: this is <b>convection</b>, and it carries the energy up much faster. The tops of the cells are the <b>granules</b> you can see on the surface, each roughly 1,000 km across and lasting only minutes.</p>
    <p>At the <b>photosphere</b> the gas finally becomes thin enough for light to fly free. From there it reaches Earth in about <b>8 minutes 20 seconds</b>.</p>
    <p><b>Neutrinos</b> from fusion barely touch anything. They fly straight out of the core and leave the Sun in about two seconds. Trillions pass through your body every second, day and night.</p>
    <p class="tip"><b>Try it:</b> drag the <b>Journey</b> slider, or press Play. Then change the <b>step length</b> and see how strongly the escape time depends on it.</p>
    <p class="note">The escape time here is a rough random-walk estimate, not a solar model. The real step length changes a lot with depth. The drawing is not to scale.</p>`,
  terms: [
    { t: 'Random walk', d: 'A path made of steps in random directions. Getting N steps away takes about N² steps.' },
    { t: 'Mean free path', d: 'The average distance a photon travels before it is absorbed or scattered.' },
    { t: 'Convection', d: 'Heat carried by moving gas: hot blobs rise, cool and sink again.' },
    { t: 'Granulation', d: 'The grainy pattern on the Sun’s surface made by the tops of convection cells.' },
    { t: 'Photon', d: 'A single particle (packet) of light.' },
  ],
  defaults: { prog: 0, play: true, mfp: 1, nu: true },
  controls: [
    { key: 'prog', type: 'range', label: 'Journey', min: 0, max: 1, step: 0.001, fmt: (v) => (v < P1 ? 'Random walk' : v < P2 ? 'Convection' : 'Flying to Earth') },
    { key: 'play', type: 'toggle', label: 'Play' },
    { key: 'mfp', type: 'log', label: 'Photon step length (mean free path)', min: 0.05, max: 20, fmt: (v) => (v < 1 ? `${(v * 1000).toFixed(0)} µm` : `${v.toFixed(1)} mm`), ends: ['Shorter', 'Longer'], hint: 'In the real Sun it is very short, around a millimetre or less, and changes with depth.' },
    { key: 'nu', type: 'toggle', label: 'Show neutrinos' },
  ],
  quiz: [
    { q: 'Roughly how long does energy take to get out of the Sun’s radiative zone?', options: ['8 minutes', 'About a day', 'Tens of thousands of years or more', 'A billion years'], answer: 2, why: 'Published estimates run from about 10,000 to 170,000 years, because light random-walks through dense gas.' },
    { q: 'How long does sunlight take to reach Earth after leaving the surface?', options: ['About 8 seconds', 'About 8 minutes 20 seconds', 'About 8 hours', 'About 8 days'], answer: 1, why: 'The Sun is about 150 million km away; light covers that in roughly 500 seconds.' },
    { q: 'If the photon’s step length were halved, the escape time would…', options: ['Halve', 'Stay the same', 'Double', 'Become 4 times shorter'], answer: 2, why: 'Time ~ R² / (step × speed of light). Half the step needs twice as long (four times the steps, each half as long).' },
    { q: 'Why do neutrinos escape in seconds?', options: ['They are faster than light', 'They barely interact with matter, so they fly straight out', 'Convection carries them', 'They are made at the surface'], answer: 1, why: 'Neutrinos almost never hit anything, so they cross the Sun at nearly light speed.' },
  ],
  reel: [
    { ms: 5600, caption: 'Light staggers out of the core for roughly 10,000 to 170,000 years. Then it boils up, breaks free and reaches Earth in about 8 minutes.', set: { prog: 0.05, play: false, mfp: 1, nu: true }, anim: { prog: [0.05, 1] }, view: { pos: [3.6, 1.2, 14], target: [3.6, 0, 0] }, spin: 0 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage);
    const root = stage.root, r = rng(17);
    // back hemisphere with a living surface
    const surf = surfaceMaterial({ color: 0xffa850, scale: 6, contrast: 0.7, limb: 0.55, side: THREE.BackSide });
    const back = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48, Math.PI, Math.PI), surf); root.add(back);
    const glow = halo(0xffc070, R * 3.2, 0.35); glow.position.z = -1; root.add(glow);
    // the slice
    const disc = canvasTexture(1024, 1024, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, '#fff6dc'); gr.addColorStop(0.2, '#ffd27a'); gr.addColorStop(0.25, '#ffb04a'); gr.addColorStop(0.69, '#d06a24'); gr.addColorStop(0.71, '#b84a18'); gr.addColorStop(0.99, '#7a2a0c'); gr.addColorStop(1, '#ffcf70');
      g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,240,210,0.35)'; g.setLineDash([10, 10]); g.lineWidth = 2;
      [0.25, 0.7].forEach((f) => { g.beginPath(); g.arc(w / 2, h / 2, (f * w) / 2, 0, 7); g.stroke(); });
    });
    const slice = new THREE.Mesh(new THREE.CircleGeometry(R, 128), new THREE.MeshBasicMaterial({ map: disc.tex, toneMapped: false })); root.add(slice);
    label('<b>Core</b>', [0, -0.45, 0.05], root); const lRad = label('<b>Radiative zone</b>', [-1.2, -1.55, 0.05], root), lConv = label('<b>Convective zone</b>', [-1.7, 2.15, 0.05], root);
    void lRad; void lConv;

    // convection cells: particles looping in the outer ring, rising hot and sinking cool
    const NC = 22, PER = 26, conv = cloud(NC * PER, { size: 0.16, opacity: 0.9 }), cph = new Float32Array(NC * PER);
    for (let i = 0; i < NC * PER; i++) cph[i] = r();
    root.add(conv);
    const cellPos = (c, f) => { // c: cell index, f: 0..1 around the loop
      const a0 = (c / NC) * Math.PI * 2, dir = c % 2 ? 1 : -1, ang = f * Math.PI * 2 * dir;
      const rr = (RZ + R) / 2 + Math.sin(ang) * (R - RZ) * 0.4, a = a0 + Math.cos(ang) * (Math.PI / NC) * 0.8;
      return [rr * Math.cos(a), rr * Math.sin(a), 0.03, Math.cos(ang) * dir]; // last: radial velocity sign proxy
    };
    // Earth (not to scale)
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 20), M.matte(COL.earth, { emissive: 0x0a1830 })); earth.position.set(EARTH, 0, 0); root.add(earth);
    const eL = new THREE.DirectionalLight(0xfff0d0, 2.5); eL.position.set(-1, 0.2, 0.3); eL.target = earth; root.add(eL);
    label('<b>Earth</b><br><small>not to scale</small>', [EARTH, 0.6, 0], root);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(EARTH - R - 0.3, 0.008, 0.008), M.ghost(0xffffff, 0.2)); sight.position.set((EARTH + R) / 2 - 0.15, 0, 0); root.add(sight);

    // photon path
    const path = new Lines(stage, 6000, { color: COL.photon, width: 1.6, opacity: 0.85 }); root.add(path.obj);
    const tail = new Lines(stage, 200, { color: 0xffffff, width: 2.6, opacity: 1 }); root.add(tail.obj);
    const ph = halo(0xfff2b0, 0.55, 1); root.add(ph);
    const clock = label('', [0, 0, 0], root, 'hot');
    let walk = [], lastMfp = -1, rise = [];
    const makeWalk = (mfp) => {
      const rr = rng(41), step = clamp(0.085 * Math.pow(mfp, 0.18), 0.04, 0.16);
      walk = [V(0, 0, 0.04)];
      let p = V(0, 0, 0.04);
      for (let i = 0; i < 5900 && p.length() < RZ; i++) { const a = rr() * Math.PI * 2; p = p.clone().add(V(Math.cos(a) * step, Math.sin(a) * step, 0)); walk.push(p); }
      // rise through the convective zone along a curving updraft, to the surface on the Earth side
      const e = walk[walk.length - 1], a0 = Math.atan2(e.y, e.x); rise = [];
      for (let k = 0; k <= 60; k++) { const f = k / 60, rr2 = lerp(e.length(), R, smooth(f)), a = lerp(a0, 0, smooth(f)); rise.push(V(rr2 * Math.cos(a) + Math.sin(f * 9) * 0.06, rr2 * Math.sin(a), 0.05)); }
    };
    // neutrinos: straight out from the core in all directions
    const NN = 90, nus = cloud(NN, { size: 0.14, opacity: 0.9 }), nd = [], nph = new Float32Array(NN);
    for (let i = 0; i < NN; i++) { const a = r() * Math.PI * 2; nd.push([Math.cos(a), Math.sin(a)]); nph[i] = r(); nus.setCol(i, COL.neutrino, 0.8); }
    root.add(nus);
    const nuL = label('neutrinos: out in ~2 s', [0, 0, 0], root);

    let t = 0;
    return {
      update(dt, st) {
        t += dt;
        surf.uniforms.uTime.value += dt;
        if (st.mfp !== lastMfp) { makeWalk(st.mfp); lastMfp = st.mfp; }
        if (st.play) st.prog = (st.prog + dt / 22) % 1;
        const p = st.prog;
        let pos, shown = [];
        if (p < P1) {
          const k = Math.max(1, Math.floor((p / P1) * (walk.length - 1)));
          shown = walk.slice(0, k + 1); pos = walk[k];
        } else {
          shown = walk;
          if (p < P2) { const f = (p - P1) / (P2 - P1), k = Math.floor(f * (rise.length - 1)); pos = rise[k]; shown = walk.concat(rise.slice(0, k + 1)); }
          else { const f = smooth((p - P2) / (1 - P2)); pos = V(lerp(R, EARTH - 0.3, f), 0, 0.05); shown = walk.concat(rise); }
        }
        path.set([shown]);
        const tl = p >= P2 ? [[V(Math.max(R, pos.x - 1.2), 0, 0.05), pos]] : [];
        tail.set(tl);
        ph.position.copy(pos); ph.scale.setScalar(0.5 + 0.08 * Math.sin(t * 9));
        ph.material.color.copy(bbColor(lerp(30000, 5800, clamp(pos.length() / R, 0, 1))));
        clock.position.copy(pos).add(V(0, 0.45, 0));
        const est = escapeYears(st.mfp);
        clock.element.textContent = p < P1 ? `~${fmtYears(est * Math.pow(p / P1, 1))}` : p < P2 ? 'carried up by convection' : `${Math.round(lerp(0, 499, smooth((p - P2) / (1 - P2))))} s of 499`;
        // convection
        for (let c = 0; c < NC; c++) for (let j = 0; j < PER; j++) {
          const i = c * PER + j, f = (cph[i] + t * 0.07) % 1, [x, y, z, vr] = cellPos(c, f);
          conv.pos[i * 3] = x; conv.pos[i * 3 + 1] = y; conv.pos[i * 3 + 2] = z;
          const hot = 0.5 + 0.5 * vr; conv.col[i * 3] = 1; conv.col[i * 3 + 1] = 0.45 + 0.45 * hot; conv.col[i * 3 + 2] = 0.15 + 0.35 * hot;
        }
        conv.upd();
        // neutrinos
        nus.visible = !!st.nu; show(nuL, !!st.nu);
        for (let i = 0; i < NN; i++) { const f = (nph[i] + t * 0.45) % 1, d = f * (EARTH + 2); nus.pos[i * 3] = nd[i][0] * d; nus.pos[i * 3 + 1] = nd[i][1] * d; nus.pos[i * 3 + 2] = 0.06; const k = f < 0.03 ? f / 0.03 : 1 - f; nus.col[i * 3] = 0.85 * k; nus.col[i * 3 + 1] = 0.96 * k; nus.col[i * 3 + 2] = k; }
        nus.upd(); nuL.position.set(R + 1.4, -1.2, 0);
      },
      readout(st) {
        const est = escapeYears(st.mfp), steps = ((0.7 * RSUN) / (st.mfp / 1000)) ** 2, p = st.prog;
        const stage_ = p < P1 ? ['Random walk', 'Absorbed and re-emitted over and over, the energy staggers outward.'] : p < P2 ? ['Convection', 'Hot gas rises, carrying the energy up to the surface much faster.'] : ['Flying free', 'From the photosphere, light crosses 150 million km to Earth.'];
        return `<div class="big">${stage_[0]}</div><p class="r-say">${stage_[1]}</p>
          <div class="row"><span>Escape estimate for this step length</span><b>~${fmtYears(est)}</b></div>
          <div class="row"><span>Steps needed (≈ (distance ÷ step)²)</span><b>~10<sup>${Math.round(Math.log10(steps))}</sup></b></div>
          <div class="row"><span>Published range for the Sun</span><b>~10,000 – 170,000 years</b></div>
          <div class="row"><span>Surface to Earth</span><b>~8 min 20 s</b></div>
          <div class="row"><span>Neutrinos: core to surface</span><b>~2 s</b></div>`;
      },
    };
  },
};
