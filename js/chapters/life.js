// Chapter 5: how long a star lasts and how it ends. A life-cycle player with a mass slider.
// Rough rules (all approximate, the boundaries are uncertain): below ~8 Suns a star ends as a white dwarf after a
// red-giant stage and a planetary nebula; ~8 to ~20 Suns leave a neutron star after a supernova; heavier stars may
// leave a black hole. Main-sequence life from star.js (10 Gyr x M^-2.5, levelling off near a few million years).
// The Sun: about 4.6 billion years old, roughly halfway through its ~10-billion-year main-sequence life.
import { THREE, M, V, COL, starBall, cloud, halo, rng, spaceScene, bbColor, bbCss, clamp, lerp, smooth, show, msR, msT, msLife, fmtYears } from '../star.js';

const LOW = [0.55, 0.72, 0.84], HIGH = [0.6, 0.78, 0.84];
const fate = (m) => (m < 8 ? 'wd' : m < 20 ? 'ns' : 'bh');
const visR = (R) => clamp(0.85 * Math.pow(R, 0.5), 0.25, 2.2);
const ONION = {
  low: [['Hydrogen envelope', 0xff8a4a], ['Helium-burning shell', 0xffc35a], ['Carbon and oxygen core', COL.carbon]],
  high: [['Hydrogen', 0xff8a4a], ['Helium', 0xffc35a], ['Carbon', COL.carbon], ['Oxygen and neon', 0x6ec8ff], ['Silicon', 0xb68bff], ['Iron core', 0xd0d4dc]],
};
function stageOf(m, a) {
  const hi = m >= 8, B = hi ? HIGH : LOW;
  if (a < B[0]) return { id: 'ms', f: a / B[0] };
  if (a < B[1]) return { id: hi ? 'rsg' : 'rg', f: (a - B[0]) / (B[1] - B[0]) };
  if (a < B[2]) return { id: hi ? 'sn' : 'pn', f: (a - B[1]) / (B[2] - B[1]) };
  return { id: fate(m), f: (a - B[2]) / (1 - B[2]) };
}
const TEXT = {
  ms: ['Main sequence', 'Fusing hydrogen into helium in its core, held steady by the balance of gravity and pressure.'],
  rg: ['Red giant', 'The core runs out of hydrogen and shrinks and heats. The outer layers swell more than a hundred times wider and cool to red. Later the core fuses helium into carbon and oxygen.'],
  rsg: ['Red supergiant', 'Shell after shell of heavier elements burns around the core: helium, carbon, oxygen, silicon. Fusion stops at iron, which gives no energy.'],
  pn: ['Planetary nebula', 'The outer layers drift away as a glowing shell, lit up by the exposed hot core. (The name is old: it has nothing to do with planets.)'],
  sn: ['Supernova', 'The iron core cannot hold itself up. It collapses in under a second, and the rebound blasts the star apart, briefly outshining a whole galaxy.'],
  wd: ['White dwarf', 'A hot, dense leftover core about the size of Earth, with no fusion. It slowly cools over billions of years.'],
  ns: ['Neutron star', 'A collapsed core about 20 km across, heavier than the Sun. Spinning ones that sweep beams past us are pulsars.'],
  bh: ['Black hole', 'For the heaviest stars, the core may collapse so far that not even light can escape.'],
};

export default {
  id: 'life',
  short: 'How long it lasts and how it ends',
  title: 'How a star lives and dies',
  subtitle: 'Mass decides everything: how long a star shines, and whether it fades or explodes.',
  view: { pos: [0, 1.2, 15], target: [0, 0.2, 0] },
  learn: `<p>A star shines steadily for as long as there is hydrogen to fuse in its core. The Sun is about <b>4.6 billion years</b> old, roughly halfway through a main-sequence life of about <b>10 billion years</b>.</p>
    <p>When the core runs out of hydrogen, gravity squeezes it, it heats up, and hydrogen starts burning in a shell around it. The outer layers swell and cool: the star becomes a <b>red giant</b>. The Sun will grow more than a hundred times wider and later fuse helium into <b>carbon</b> and <b>oxygen</b>. It will then gently shed its outer layers as a glowing <b>planetary nebula</b>, leaving a <b>white dwarf</b>: a hot core about the size of Earth that slowly cools.</p>
    <p>Stars more than about <b>8 times</b> the Sun’s mass go further. Their cores fuse ever heavier elements, in layers like an onion, until they reach <b>iron</b>. Fusing iron gives no energy, so the core suddenly collapses. The rebound blows the star apart in a <b>supernova</b>. What is left is a <b>neutron star</b>, about 20 km across, or for the heaviest stars, perhaps a <b>black hole</b>.</p>
    <p><b>We are made of star stuff.</b> The hydrogen in your body dates from the Big Bang, but almost all the carbon, oxygen, calcium and iron in you was made inside stars and scattered by dying ones. Some of the heaviest elements, like much of the gold, come from explosive events such as neutron stars colliding.</p>
    <p class="tip"><b>Try it:</b> press <b>The Sun today</b>, then drag <b>Life so far</b> to the end. Then try a star of 15 or 30 Suns, and turn on <b>See inside</b> during its giant stage.</p>
    <p class="note">The mass limits (8 and about 20 Suns) are approximate and depend on details such as how much mass a star loses. The life-stage slider is not to scale in time: the main sequence is by far the longest stage.</p>`,
  terms: [
    { t: 'Red giant', d: 'A star near the end of its life whose outer layers have swollen and cooled.' },
    { t: 'Planetary nebula', d: 'The glowing shell of gas a Sun-like star sheds at the end of its life.' },
    { t: 'White dwarf', d: 'The hot, Earth-sized leftover core of a Sun-like star. It can be at most about 1.4 Suns (the Chandrasekhar limit).' },
    { t: 'Supernova', d: 'The explosion of a star, for example when the core of a massive star collapses.' },
    { t: 'Neutron star', d: 'An extremely dense collapsed core, about 20 km across, made mostly of neutrons.' },
    { t: 'Nucleosynthesis', d: 'The making of new elements by nuclear reactions, mostly inside stars and their explosions.' },
  ],
  defaults: { m: 1, age: 0.253, play: false, inside: false },
  controls: [
    { key: 'm', type: 'log', label: 'Star mass', min: 0.5, max: 40, fmt: (v) => `${v < 10 ? v.toFixed(1) : Math.round(v)} Suns`, ends: ['Small', 'Huge'] },
    { key: 'age', type: 'range', label: 'Life so far', min: 0, max: 1, step: 0.001, fmt: (v, s) => (TEXT[stageOf(s.m, v).id][0]) },
    { key: 'pre', type: 'buttons', label: 'Jump to', items: [{ label: 'The Sun today', act: (s) => { s.m = 1; s.age = 0.253; s.play = false; } }, { label: '15 Suns', act: (s) => { s.m = 15; s.age = 0.3; } }, { label: '30 Suns', act: (s) => { s.m = 30; s.age = 0.3; } }] },
    { key: 'play', type: 'toggle', label: 'Play the whole life' },
    { key: 'inside', type: 'toggle', label: 'See inside (giant stage)' },
  ],
  quiz: [
    { q: 'About how far through its main-sequence life is the Sun?', options: ['Just starting', 'About halfway', 'Almost finished', 'Already a red giant'], answer: 1, why: 'It is about 4.6 billion years old, of roughly 10 billion on the main sequence.' },
    { q: 'What will the Sun leave behind at the very end?', options: ['A black hole', 'A neutron star', 'A white dwarf', 'Nothing at all'], answer: 2, why: 'Sun-like stars shed their outer layers as a planetary nebula and leave an Earth-sized white dwarf.' },
    { q: 'Why does fusion in a massive star stop at iron?', options: ['Iron is too rare', 'Fusing iron gives no energy', 'Iron is too cold', 'Iron is a gas'], answer: 1, why: 'Making elements heavier than iron by fusion takes in energy, so the core loses its support and collapses.' },
    { q: 'Where did most of the carbon and oxygen in your body come from?', options: ['The Big Bang', 'Earth’s core', 'Inside stars', 'Lightning'], answer: 2, why: 'They were made by fusion in stars and spread through space when those stars died.' },
  ],
  reel: [
    { ms: 5600, caption: 'The Sun is 4.6 billion years into a life of about 10 billion. Then it will swell into a red giant.', set: { m: 1, age: 0.25, play: false, inside: false }, anim: { age: [0.25, 0.7] }, view: { pos: [0, 1.0, 14], target: [0, 0.2, 0] }, spin: 0.2 },
    { ms: 5600, caption: 'Heavy stars explode as supernovas. Their ashes, carbon, oxygen, iron, become new stars, planets and you.', set: { m: 15, age: 0.74, play: false, inside: false }, anim: { age: [0.74, 0.99] }, view: { pos: [0, 1.4, 17], target: [0, 0.2, 0] }, spin: 0.2 },
  ],
  build({ stage, s, label }) {
    spaceScene(stage);
    const root = stage.root, r = rng(29);
    const star = starBall(1, { glow: 3.2 }); root.add(star);
    // nebula / debris shell
    const NS = 1800, shell = cloud(NS, { size: 0.22, opacity: 0.9 }), dirs = [], jit = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { const u = r() * 2 - 1, a = r() * 6.283, sq = Math.sqrt(1 - u * u); dirs.push(V(sq * Math.cos(a), u * 0.85, sq * Math.sin(a)).normalize()); jit[i] = r(); }
    root.add(shell);
    const flash = halo(0xffffff, 1, 1); root.add(flash);
    // remnants
    const ns = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), M.glow(0xdfe9ff)); root.add(ns);
    const beams = new THREE.Group(); ns.add(beams);
    [1, -1].forEach((sg) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.35, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fc8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); c.position.y = sg * 2.6; c.rotation.x = sg > 0 ? Math.PI : 0; beams.add(c); });
    beams.rotation.z = 0.5;
    const bh = new THREE.Group(); root.add(bh);
    bh.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 12, 120), M.glow(0xffb070)); bh.add(ringM);
    const disk = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.6, 96), new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); disk.rotation.x = -Math.PI / 2 + 0.25; bh.add(disk);
    const bhGlow = halo(0xff9a50, 2.4, 0.35); bh.add(bhGlow);
    // onion layers (cut open)
    const onion = new THREE.Group(); onion.rotation.y = Math.PI * 0.75; root.add(onion);
    const layerMeshes = ONION.high.map(([, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, toneMapped: false })); onion.add(m); return m; });
    const onionL = ONION.high.map(() => label('', [0, 0, 0], root));
    const elemL = label('', [0, 0, 0], root, 'hot');
    // Earth for size during the white dwarf stage
    const earthRef = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), M.matte(COL.earth, { emissive: 0x0a1830 })); earthRef.position.set(1.1, 0, 0); root.add(earthRef);
    const earthL = label('Earth, same scale', [1.1, 0.35, 0], root);

    let t = 0;
    return {
      update(dt, st) {
        t += dt;
        if (st.play) st.age = Math.min(1, st.age + dt / 26);
        const m = st.m, hi = m >= 8, S = stageOf(m, st.age), T0 = msT(m), R0 = visR(msR(m));
        star.tick(dt);
        let R = R0, T = T0, starOn = true, shellK = 0, shellR = 0, fl = 0, rem = null;
        if (S.id === 'ms') { R = R0 * (1 + 0.15 * S.f); T = T0 * (1 - 0.03 * S.f); }
        else if (S.id === 'rg' || S.id === 'rsg') { const k = smooth(S.f); R = lerp(R0 * 1.15, hi ? 4.6 : 3.6, k); T = lerp(T0, hi ? 3500 : 3600, smooth(Math.min(1, S.f * 1.6))); }
        else if (S.id === 'pn') { starOn = true; R = lerp(0.6, 0.16, smooth(S.f * 2)); T = lerp(9000, 60000, smooth(S.f)); shellK = 1; shellR = lerp(3.6, 7.5, S.f); }
        else if (S.id === 'sn') { starOn = S.f < 0.08; R = 4.6 * (1 - S.f * 8); fl = S.f < 0.5 ? Math.sin((S.f / 0.5) * Math.PI / 2) : 1 - (S.f - 0.5) / 0.5; shellK = 1; shellR = lerp(1, 7, Math.sqrt(S.f)); }
        else { rem = S.id; starOn = rem === 'wd'; if (rem === 'wd') { R = 0.16; T = lerp(40000, 8000, S.f); } shellK = 1 - S.f * 0.85; shellR = (hi ? 7 : 7.5) + S.f * 3; }
        star.visible = starOn && R > 0.02; star.scale.setScalar(Math.max(0.02, R)); star.setT(T);
        star.glow[0].scale.setScalar(S.id === 'wd' || S.id === 'pn' ? 3.0 : 3.2); star.glow[1].scale.setScalar(S.id === 'wd' || S.id === 'pn' ? 2.5 : 7);
        // inside view
        const inside = st.inside && (S.id === 'rg' || S.id === 'rsg');
        star.ball.visible = !inside;
        onion.visible = inside;
        const layers = hi ? ONION.high : ONION.low;
        layerMeshes.forEach((lm, i) => {
          const on = inside && i < layers.length; lm.visible = on; if (!on) { show(onionL[i], false); return; }
          const rr = R * (i === 0 ? 1 : Math.pow(0.55, i) * (hi ? 0.9 : 0.6)); lm.scale.setScalar(rr); lm.material.color.setHex(layers[i][1]);
          onionL[i].element.textContent = layers[i][0]; onionL[i].position.set(rr * 0.75 + 0.2, -0.35 * i + 0.9, rr * 0.4 + 0.3); show(onionL[i], true);
        });
        // shell
        shell.visible = shellK > 0.01;
        if (shell.visible) {
          for (let i = 0; i < NS; i++) {
            const d = dirs[i], rr = shellR * (0.86 + 0.24 * jit[i]) * (S.id === 'pn' || rem === 'wd' ? 1 + 0.25 * Math.abs(d.y) : 1);
            shell.pos[i * 3] = d.x * rr; shell.pos[i * 3 + 1] = d.y * rr; shell.pos[i * 3 + 2] = d.z * rr;
            const pal = hi ? [0xffd27a, 0x6ec8ff, 0xff6b8a, 0xb68bff, 0xffffff] : [0x5ce1c9, 0x5ce1c9, 0xff6b8a, 0x6ec8ff];
            shell.setCol(i, pal[i % pal.length], shellK * (0.35 + 0.65 * jit[i]));
          }
          shell.upd();
        }
        flash.visible = fl > 0.01; flash.scale.setScalar(2 + 26 * fl); flash.material.opacity = Math.min(1, fl * 1.2);
        ns.visible = rem === 'ns'; beams.rotation.y = t * 5;
        bh.visible = rem === 'bh'; disk.rotation.z = t * 0.6; ringM.lookAt(stage.camera.position);
        earthRef.visible = rem === 'wd'; show(earthL, rem === 'wd');
        const el = S.id === 'pn' || rem === 'wd' ? 'carbon · nitrogen · oxygen · helium' : S.id === 'sn' || rem === 'ns' || rem === 'bh' ? 'oxygen · silicon · calcium · iron · and more' : '';
        elemL.element.textContent = el ? `Spread into space: ${el}` : ''; elemL.position.set(0, -Math.max(2.5, shellR * 0.75), 0); show(elemL, !!el);
      },
      readout(st) {
        const m = st.m, S = stageOf(m, st.age), life = msLife(m), [name, say] = TEXT[S.id];
        const ageTxt = S.id === 'ms' ? `~${fmtYears(S.f * life)} of ~${fmtYears(life)}` : 'after its main-sequence life';
        const end = { wd: 'White dwarf', ns: 'Neutron star (roughly 8–20 Suns)', bh: 'Black hole (above roughly 20 Suns)' }[fate(m)];
        return `<div class="big">${name}</div><p class="r-say">${say}</p>
          <div class="row"><span>Mass</span><b>${m < 10 ? m.toFixed(1) : Math.round(m)} Suns</b></div>
          <div class="row"><span>Age</span><b>${ageTxt}</b></div>
          <div class="row"><span>Main-sequence life (rough)</span><b>~${fmtYears(life)}</b></div>
          <div class="row"><span>How it ends</span><b>${end}</b></div>`;
      },
    };
  },
};
