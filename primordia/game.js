(() => {
'use strict';

// ─── canvas + dpr ──────────────────────────────────────────────────────────
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
let VW = innerWidth, VH = innerHeight;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  VW = innerWidth; VH = innerHeight;
  canvas.width = VW * dpr;
  canvas.height = VH * dpr;
  canvas.style.width = VW + 'px';
  canvas.style.height = VH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

// ─── math + rng ────────────────────────────────────────────────────────────
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

let _seed = (Date.now() ^ 0x9e3779b9) >>> 0;
function rng() {
  _seed = (_seed + 0x6d2b79f5) >>> 0;
  let t = _seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rand = (a, b) => a + (b - a) * rng();
const randInt = (a, b) => Math.floor(rand(a, b));
const pick = arr => arr[Math.floor(rng() * arr.length)];
const chance = p => rng() < p;

// ─── world ─────────────────────────────────────────────────────────────────
const WORLD = { w: 6000, h: 6000 };

const cam = { x: WORLD.w / 2, y: WORLD.h / 2, zoom: 1.0 };

// ─── input ─────────────────────────────────────────────────────────────────
const mouse = { x: VW/2, y: VH/2, wx: 0, wy: 0, down: false };
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('touchmove', e => {
  if (e.touches[0]) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left;
    mouse.y = e.touches[0].clientY - r.top;
  }
}, { passive: true });
canvas.addEventListener('touchstart', e => {
  mouse.down = true;
  if (e.touches[0]) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - r.left;
    mouse.y = e.touches[0].clientY - r.top;
  }
}, { passive: true });
canvas.addEventListener('touchend', () => { mouse.down = false; });

function screenToWorld() {
  mouse.wx = (mouse.x - VW/2) / cam.zoom + cam.x;
  mouse.wy = (mouse.y - VH/2) / cam.zoom + cam.y;
}

// ─── audio (ambient drone) ─────────────────────────────────────────────────
let audio = null;
function initAudio() {
  if (audio) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctxA = new AC();
  const master = ctxA.createGain();
  master.gain.value = 0.18;
  master.connect(ctxA.destination);

  const drone = ctxA.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 55;
  const droneGain = ctxA.createGain();
  droneGain.gain.value = 0.4;
  drone.connect(droneGain).connect(master);
  drone.start();

  const drone2 = ctxA.createOscillator();
  drone2.type = 'triangle';
  drone2.frequency.value = 82.5;
  const drone2Gain = ctxA.createGain();
  drone2Gain.gain.value = 0.12;
  drone2.connect(drone2Gain).connect(master);
  drone2.start();

  const lfo = ctxA.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctxA.createGain();
  lfoGain.gain.value = 0.18;
  lfo.connect(lfoGain).connect(droneGain.gain);
  lfo.start();

  audio = { ctx: ctxA, master, drone, drone2 };
}
function ping(freq = 600, dur = 0.18, type = 'sine', vol = 0.18) {
  if (!audio) return;
  const t = audio.ctx.currentTime;
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audio.master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// ─── naming ────────────────────────────────────────────────────────────────
const NAME_A = ['vel','tor','quor','myx','aeth','strix','gril','phon','xen','umb','crae','ish','vol','nyr','tha','orix','phae','glym','ker','sil','nax','reth','byn','crov','dax','molt','pry','sav','urn','wex'];
const NAME_B = ['ix','arn','os','en','ith','axe','uun','yr','et','onn','aal','umi','ess','ode','arr','un','el','iss','ome','aar','yth','an','ord','og','een','urr','ix','om','an','ek'];
const NAME_C = ['','-i','-a','-the','-rin','-os','','','-um','-en','','-yr','','-arr','-ex','','-ia','','-on','','-th','','-iv','','-orr','','-en','','','-y'];
function spawnName() {
  return (pick(NAME_A) + pick(NAME_B) + pick(NAME_C)).replace(/^./, c => c.toUpperCase());
}

// ─── mutation pool ─────────────────────────────────────────────────────────
// each entry: id, name, desc, tag, apply(o), requires?(o), weight?
const MUTATIONS = [
  { id:'cilia',  name:'cilia',          tag:'motility',   desc:'fine hairs ripple along the membrane. movement quickens.',
    apply:o => { o.speed *= 1.35; o.appendages.cilia = (o.appendages.cilia||0)+1; } },
  { id:'membrane', name:'thick membrane', tag:'form',      desc:'the wall folds inward, room for more.',
    apply:o => { o.sizeMul *= 1.18; o.capacity *= 1.4; } },
  { id:'photo',  name:'photosynth',     tag:'metabolism', desc:'green flecks bloom inside. light becomes food.',
    apply:o => { o.photo = (o.photo||0) + 1; } },
  { id:'predate',name:'predation',      tag:'instinct',   desc:'a hunger for the soft things. consume smaller cells.',
    apply:o => { o.predator = true; o.predMul = (o.predMul||1) * 1.3; },
    requires: o => o.biomass > 18 },
  { id:'sense',  name:'sense',          tag:'perception', desc:'the dark thins. you see further.',
    apply:o => { o.sense *= 1.5; } },
  { id:'biolum', name:'bioluminescence',tag:'signal',     desc:'a gentle glow. motes drift toward you.',
    apply:o => { o.glow = (o.glow||0) + 1; } },
  { id:'mitosis',name:'mitosis',        tag:'lineage',    desc:'cleave in two. a fragment carries on alongside.',
    apply:o => { o.canSplit = true; },
    requires: o => o.biomass > 30 },
  { id:'spikes', name:'spikes',         tag:'defense',    desc:'sharp needles. predators recoil.',
    apply:o => { o.spikes = (o.spikes||0) + 1; } },
  { id:'toxin',  name:'toxin',          tag:'aggression', desc:'a slow poison seeps into the water near you.',
    apply:o => { o.toxin = (o.toxin||0) + 1; },
    requires: o => o.biomass > 22 },
  { id:'filament', name:'filaments',    tag:'reach',      desc:'thin tendrils sweep nearby motes inward.',
    apply:o => { o.filament = (o.filament||0) + 1; } },
  { id:'crystal',name:'crystal core',   tag:'affinity',   desc:'an inner lattice. shards yield more.',
    apply:o => { o.crystalCore = true; o.shardMul = (o.shardMul||1) * 1.8; } },
  { id:'pseudo', name:'pseudopods',     tag:'control',    desc:'limbs of fluid. sharper turns.',
    apply:o => { o.agility *= 1.45; } },
  { id:'symb',   name:'symbiote',       tag:'companion',  desc:'a smaller form attaches. it eats with you.',
    apply:o => { o.symbiotes = (o.symbiotes||0) + 1; },
    requires: o => o.biomass > 25 },
  { id:'phag',   name:'phagocytosis',   tag:'metabolism', desc:'engulf, digest, become. consumption yields more.',
    apply:o => { o.intakeMul *= 1.45; } },
  { id:'plate',  name:'plating',        tag:'form',       desc:'hex armor crystalises across the membrane.',
    apply:o => { o.armor = (o.armor||0) + 1; o.speed *= 0.92; } },
  { id:'irid',   name:'iridescence',    tag:'signal',     desc:'colour shifts. predators lose your edge.',
    apply:o => { o.iridescent = (o.iridescent||0) + 1; } },
  { id:'sail',   name:'drift sail',     tag:'motility',   desc:'a thin vane catches the current.',
    apply:o => { o.sail = (o.sail||0) + 1; o.speed *= 1.1; } },
  { id:'multi',  name:'multinucleate',  tag:'form',       desc:'many nuclei. growth accelerates.',
    apply:o => { o.growthMul *= 1.35; },
    requires: o => o.biomass > 40 },
];

// ─── particles (drift) ─────────────────────────────────────────────────────
const drift = [];
const DRIFT_N = 220;
for (let i = 0; i < DRIFT_N; i++) {
  drift.push({
    x: rand(0, WORLD.w),
    y: rand(0, WORLD.h),
    r: rand(0.4, 1.6),
    a: rand(0.04, 0.18),
    vx: rand(-3, 3),
    vy: rand(-3, 3),
  });
}

// ─── resources ─────────────────────────────────────────────────────────────
// 'mote' (common, low energy) and 'shard' (rare, high)
const resources = [];
function spawnResource(kind, x, y) {
  resources.push({
    kind, x, y,
    r: kind === 'shard' ? rand(2.6, 3.4) : rand(1.6, 2.4),
    energy: kind === 'shard' ? rand(5, 8) : rand(0.9, 1.4),
    phase: rng() * TAU,
    vx: rand(-2, 2),
    vy: rand(-2, 2),
  });
}
function seedResources() {
  // procedural clusters
  for (let c = 0; c < 36; c++) {
    const cx = rand(0, WORLD.w), cy = rand(0, WORLD.h);
    const n = randInt(8, 24);
    for (let i = 0; i < n; i++) {
      spawnResource('mote', cx + rand(-220, 220), cy + rand(-220, 220));
    }
  }
  for (let i = 0; i < 60; i++) {
    spawnResource('shard', rand(0, WORLD.w), rand(0, WORLD.h));
  }
}
seedResources();

// scarcity cycle
let scarcity = { phase: 0, intensity: 0 };

// ─── organisms ─────────────────────────────────────────────────────────────
const organisms = [];

function freshOrganism({ x, y, ai = true, lineage = null }) {
  const hue = lineage ? (lineage.hue + rand(-18, 18) + 360) % 360 : rand(120, 260);
  const o = {
    id: Math.random().toString(36).slice(2, 9),
    name: lineage ? lineage.name : spawnName(),
    lineageName: lineage ? lineage.name : null,
    x, y,
    vx: 0, vy: 0,
    angle: rng() * TAU,
    ai,
    isPlayer: false,
    hue,
    sat: rand(35, 65),
    light: rand(50, 65),
    biomass: 6,
    capacity: 40,
    sizeMul: 1,
    speed: rand(36, 54),
    agility: 1,
    sense: 180,
    intakeMul: 1,
    growthMul: 1,
    shardMul: 1,
    predMul: 1,
    appendages: { cilia: 0 },
    photo: 0,
    glow: 0,
    spikes: 0,
    toxin: 0,
    filament: 0,
    armor: 0,
    iridescent: 0,
    sail: 0,
    symbiotes: 0,
    predator: false,
    crystalCore: false,
    canSplit: false,
    traits: [],
    generation: lineage ? lineage.generation + 1 : 1,
    age: 0,
    nextMutationAt: 14,
    metamorphCount: 0,
    chrysalis: 0, // seconds left in metamorphosis
    target: { x: rand(0, WORLD.w), y: rand(0, WORLD.h), t: 0 },
    peakBiomass: 6,
    wobble: rng() * TAU,
  };
  // small inheritance: copy lineage traits
  if (lineage && lineage.inherit) {
    for (const t of lineage.inherit) applyMutation(o, t, true);
    o.biomass = 8;
  }
  return o;
}

function applyMutation(o, id, silent = false) {
  const m = MUTATIONS.find(x => x.id === id);
  if (!m) return;
  m.apply(o);
  if (!o.traits.includes(id)) o.traits.push(id);
  if (!silent && o.isPlayer) {
    ambientLog('— ' + m.name + ' takes hold');
    ping(720, 0.32, 'sine', 0.16);
  }
}

function radiusOf(o) {
  return Math.sqrt(o.biomass) * 2.4 * o.sizeMul;
}

// ─── player ────────────────────────────────────────────────────────────────
let player = null;
function spawnPlayer() {
  const o = freshOrganism({ x: WORLD.w/2, y: WORLD.h/2, ai: false });
  o.isPlayer = true;
  o.name = spawnName();
  organisms.push(o);
  player = o;
}

// ─── seed ambient organisms (other lineages drifting in distance) ──────────
function seedAmbient(n = 14) {
  for (let i = 0; i < n; i++) {
    const o = freshOrganism({ x: rand(0, WORLD.w), y: rand(0, WORLD.h), ai: true });
    // give them a few random mutations so they look varied
    const k = randInt(0, 5);
    const pool = [...MUTATIONS];
    for (let j = 0; j < k; j++) {
      const m = pool.splice(Math.floor(rng()*pool.length), 1)[0];
      if (m) applyMutation(o, m.id, true);
    }
    o.biomass = rand(8, 60);
    organisms.push(o);
  }
}
seedAmbient();

// ─── mutation prompt ───────────────────────────────────────────────────────
const mutationEl = document.getElementById('mutation');
const mChoicesEl = mutationEl.querySelector('.m-choices');
let mutationOpen = false;
let pendingMutation = false;

function offerMutation(o) {
  if (mutationOpen) return;
  const available = MUTATIONS.filter(m => !m.requires || m.requires(o));
  // weight unseen mutations higher; allow stacking of stackable ones
  const stackable = new Set(['cilia','membrane','photo','sense','spikes','toxin','filament','glow','plate','irid','sail','phag','pseudo']);
  const pool = available.filter(m => stackable.has(m.id) || !o.traits.includes(m.id));
  if (pool.length < 2) return;
  const choices = [];
  const taken = new Set();
  while (choices.length < 3 && choices.length < pool.length) {
    const m = pool[Math.floor(rng()*pool.length)];
    if (!taken.has(m.id)) { taken.add(m.id); choices.push(m); }
  }
  mChoicesEl.innerHTML = '';
  choices.forEach(m => {
    const card = document.createElement('div');
    card.className = 'm-card';
    if (m.id === 'predate' || m.id === 'toxin') card.classList.add('warn');
    card.innerHTML = `
      <div class="m-name">${m.name}</div>
      <div class="m-desc">${m.desc}</div>
      <div class="m-tag">${m.tag}</div>`;
    card.onclick = () => {
      applyMutation(o, m.id);
      closeMutation();
    };
    mChoicesEl.appendChild(card);
  });
  // "ignore" path
  const skip = document.createElement('div');
  skip.className = 'm-card';
  skip.innerHTML = `
    <div class="m-name">refuse</div>
    <div class="m-desc">drift. let the change pass. you gain a sliver of mass instead.</div>
    <div class="m-tag">resist</div>`;
  skip.onclick = () => {
    o.biomass = Math.min(o.capacity, o.biomass + 8);
    ambientLog('— the change passes');
    closeMutation();
  };
  mChoicesEl.appendChild(skip);

  mutationEl.classList.remove('hidden');
  mutationOpen = true;
  ping(280, 0.6, 'sine', 0.14);
}
function closeMutation() {
  mutationEl.classList.add('hidden');
  mutationOpen = false;
  pendingMutation = false;
}

// ─── ambient log ───────────────────────────────────────────────────────────
const logEl = document.getElementById('ambient-log');
function ambientLog(msg) {
  const d = document.createElement('div');
  d.className = 'line';
  d.textContent = msg;
  logEl.appendChild(d);
  setTimeout(() => d.remove(), 8200);
  while (logEl.children.length > 6) logEl.firstChild.remove();
}

// ─── leaderboard (localStorage) ────────────────────────────────────────────
const LB_KEY = 'primordia.leaderboard';
function loadBoard() {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); }
  catch { return []; }
}
function saveBoard(b) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(b.slice(0, 50))); } catch {}
}
function recordRun(o) {
  const b = loadBoard();
  b.push({
    name: o.name,
    gen: o.generation,
    bio: Math.round(o.peakBiomass),
    traits: o.traits.length,
    age: Math.round(o.age),
    meta: o.metamorphCount,
    t: Date.now(),
  });
  b.sort((a, b) => b.bio - a.bio);
  saveBoard(b);
}
function seedFakeBoard() {
  const b = loadBoard();
  if (b.length > 0) return;
  for (let i = 0; i < 8; i++) {
    b.push({
      name: spawnName(),
      gen: randInt(1, 9),
      bio: randInt(40, 480),
      traits: randInt(2, 10),
      age: randInt(300, 4000),
      meta: randInt(0, 5),
      t: Date.now() - randInt(1, 30) * 86400000,
    });
  }
  b.sort((a, b) => b.bio - a.bio);
  saveBoard(b);
}
seedFakeBoard();

// ─── HUD ───────────────────────────────────────────────────────────────────
const hudName = document.getElementById('hud-name');
const hudBio = document.getElementById('hud-biomass');
const hudGen = document.getElementById('hud-gen');
const hudTraits = document.getElementById('hud-traits');
function refreshHud() {
  if (!player) return;
  hudName.textContent = player.name;
  hudBio.textContent = 'biomass · ' + player.biomass.toFixed(1) + ' / ' + Math.round(player.capacity);
  hudGen.textContent = 'gen ' + player.generation + '  ·  meta ' + player.metamorphCount + '  ·  age ' + Math.round(player.age) + 's';
  const traitNames = player.traits.map(t => MUTATIONS.find(m => m.id === t)?.name).filter(Boolean);
  hudTraits.textContent = traitNames.length ? traitNames.join(' · ') : '— nascent —';
}

// ─── leaderboard UI ────────────────────────────────────────────────────────
const boardEl = document.getElementById('board');
const boardList = boardEl.querySelector('.board-list');
document.getElementById('tab-board').onclick = () => {
  const b = loadBoard();
  boardList.innerHTML = '';
  b.slice(0, 30).forEach(e => {
    const row = document.createElement('div');
    row.className = 'entry';
    row.innerHTML = `
      <div class="e-name">${e.name}</div>
      <div class="e-gen">gen ${e.gen} · ${e.traits} traits</div>
      <div class="e-bio">${e.bio} biomass</div>`;
    boardList.appendChild(row);
  });
  boardEl.classList.remove('hidden');
};
boardEl.querySelector('.board-close').onclick = () => boardEl.classList.add('hidden');

// ─── AI for ambient organisms ──────────────────────────────────────────────
function aiStep(o, dt) {
  o.target.t -= dt;
  if (o.target.t <= 0) {
    // pick new target — prefer nearby resources
    let near = null, nd = Infinity;
    for (const r of resources) {
      const d = (r.x - o.x) ** 2 + (r.y - o.y) ** 2;
      if (d < nd && d < (o.sense * 1.5) ** 2) { nd = d; near = r; }
    }
    if (near) {
      o.target.x = near.x; o.target.y = near.y;
    } else {
      o.target.x = clamp(o.x + rand(-300, 300), 0, WORLD.w);
      o.target.y = clamp(o.y + rand(-300, 300), 0, WORLD.h);
    }
    o.target.t = rand(2, 5);
  }
}

// ─── main update ───────────────────────────────────────────────────────────
function updateOrganism(o, dt) {
  // movement target
  let tx, ty;
  if (o.isPlayer) {
    screenToWorld();
    tx = mouse.wx; ty = mouse.wy;
  } else if (o.ai) {
    tx = o.target.x; ty = o.target.y;
  }

  if (o.chrysalis > 0) {
    o.chrysalis -= dt;
    // gentle drift only
    o.vx *= 0.96; o.vy *= 0.96;
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.chrysalis <= 0) emergeFromMetamorphosis(o);
  } else if (tx !== undefined) {
    const dx = tx - o.x, dy = ty - o.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      const accel = o.speed * o.agility * 4 * dt;
      o.vx += (dx / d) * accel;
      o.vy += (dy / d) * accel;
    }
    // sail drift
    if (o.sail) {
      const c = currentAt(o.x, o.y);
      o.vx += c.x * dt * 12;
      o.vy += c.y * dt * 12;
    }
    // soft cap
    const sp = Math.hypot(o.vx, o.vy);
    const maxSp = o.speed * (1 + 0.06 * (o.appendages.cilia||0));
    if (sp > maxSp) {
      o.vx = o.vx / sp * maxSp;
      o.vy = o.vy / sp * maxSp;
    }
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.vx *= 0.92;
    o.vy *= 0.92;
    if (sp > 1) o.angle = Math.atan2(o.vy, o.vx);
  }
  // bounds
  o.x = clamp(o.x, 8, WORLD.w - 8);
  o.y = clamp(o.y, 8, WORLD.h - 8);

  // metabolism
  o.age += dt;
  o.wobble += dt * (2 + 0.1 * (o.appendages.cilia||0));

  if (o.chrysalis <= 0) {
    // basal cost
    const upkeep = 0.07 * o.biomass ** 0.45 * dt;
    o.biomass -= upkeep;

    // photosynthesis
    if (o.photo) o.biomass += 0.45 * o.photo * dt;

    // filament collection radius
    const r = radiusOf(o);
    const collectR = r + 6 + 18 * o.filament;

    // resource pickup
    for (let i = resources.length - 1; i >= 0; i--) {
      const res = resources[i];
      const d2 = (res.x - o.x) ** 2 + (res.y - o.y) ** 2;
      const pull = collectR + res.r;
      if (d2 < pull * pull) {
        // drift in if within filament range but outside body
        if (o.filament && d2 > (r + res.r) ** 2) {
          const dx = o.x - res.x, dy = o.y - res.y;
          const d = Math.sqrt(d2) || 1;
          res.x += (dx / d) * 60 * dt;
          res.y += (dy / d) * 60 * dt;
          continue;
        }
        let gain = res.energy * o.intakeMul;
        if (res.kind === 'shard') gain *= o.shardMul;
        o.biomass = Math.min(o.capacity, o.biomass + gain);
        resources.splice(i, 1);
        if (o.isPlayer) {
          ping(res.kind === 'shard' ? 980 : 520, 0.09, 'sine', res.kind === 'shard' ? 0.18 : 0.08);
        }
      }
    }

    // bioluminescence attracts motes
    if (o.glow) {
      const pullR = 90 + 40 * o.glow;
      for (const res of resources) {
        if (res.kind !== 'mote') continue;
        const dx = o.x - res.x, dy = o.y - res.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < pullR*pullR && d2 > 1) {
          const d = Math.sqrt(d2);
          res.x += (dx / d) * 14 * dt * o.glow;
          res.y += (dy / d) * 14 * dt * o.glow;
        }
      }
    }

    // predator-prey
    if (o.predator) {
      for (let j = organisms.length - 1; j >= 0; j--) {
        const other = organisms[j];
        if (other === o) continue;
        if (other.chrysalis > 0) continue;
        if (other.biomass > o.biomass * 0.7) continue; // only smaller
        const rOther = radiusOf(other);
        const dd = (other.x - o.x) ** 2 + (other.y - o.y) ** 2;
        if (dd < (r + rOther) ** 2) {
          // damage transferred
          const bite = Math.min(other.biomass, 4 * dt * o.predMul * o.intakeMul);
          other.biomass -= bite;
          if (other.spikes) o.biomass -= 0.4 * other.spikes * dt;
          if (!other.armor) {
            o.biomass = Math.min(o.capacity, o.biomass + bite * 0.9);
          } else {
            o.biomass = Math.min(o.capacity, o.biomass + bite * 0.4);
          }
          if (o.isPlayer && chance(0.4 * dt)) ping(180, 0.08, 'square', 0.06);
        }
      }
    }
    // toxin AoE
    if (o.toxin) {
      const tr = r + 38 + 14 * o.toxin;
      for (const other of organisms) {
        if (other === o || other.chrysalis > 0) continue;
        const dd = (other.x - o.x) ** 2 + (other.y - o.y) ** 2;
        if (dd < tr * tr) {
          other.biomass -= 0.35 * o.toxin * dt;
        }
      }
    }

    // mutation threshold
    if (o.biomass >= o.nextMutationAt && o.isPlayer && !mutationOpen) {
      offerMutation(o);
      o.nextMutationAt = Math.round(o.nextMutationAt * 1.75 + 8);
    } else if (o.biomass >= o.nextMutationAt && !o.isPlayer) {
      // AI auto-picks
      const avail = MUTATIONS.filter(m => !m.requires || m.requires(o));
      if (avail.length) applyMutation(o, pick(avail).id, true);
      o.nextMutationAt = Math.round(o.nextMutationAt * 1.75 + 8);
    }

    // mitosis
    if (o.canSplit && o.biomass > o.capacity * 0.85 && organisms.length < 80) {
      const child = freshOrganism({
        x: o.x + rand(-20, 20),
        y: o.y + rand(-20, 20),
        ai: true,
        lineage: {
          name: o.name,
          hue: o.hue,
          generation: o.generation,
          inherit: o.traits.filter(t => chance(0.55)),
        },
      });
      child.biomass = o.biomass * 0.4;
      o.biomass *= 0.55;
      organisms.push(child);
      if (o.isPlayer) ambientLog('— a fragment carries on');
    }

    o.peakBiomass = Math.max(o.peakBiomass, o.biomass);

    // metamorphosis trigger (no death)
    if (o.biomass <= 1.2) {
      enterMetamorphosis(o);
    }
  }
}

function enterMetamorphosis(o) {
  o.chrysalis = 3.0;
  o.vx = 0; o.vy = 0;
  if (o.isPlayer) {
    ambientLog('— form unravels. wait.');
    ping(140, 1.2, 'triangle', 0.12);
  }
}
function emergeFromMetamorphosis(o) {
  o.metamorphCount++;
  // shed half the traits, gain one fresh
  const keep = o.traits.filter(() => chance(0.6));
  const lost = o.traits.filter(t => !keep.includes(t));
  // reset baseline
  Object.assign(o, {
    speed: rand(36, 58),
    agility: 1,
    sense: 180,
    intakeMul: 1,
    growthMul: 1,
    shardMul: 1,
    predMul: 1,
    capacity: 40,
    sizeMul: 1,
    appendages: { cilia: 0 },
    photo: 0, glow: 0, spikes: 0, toxin: 0, filament: 0,
    armor: 0, iridescent: 0, sail: 0, symbiotes: 0,
    predator: false, crystalCore: false, canSplit: false,
    traits: [],
    biomass: 10,
    hue: (o.hue + rand(40, 140)) % 360,
  });
  for (const t of keep) applyMutation(o, t, true);
  const avail = MUTATIONS.filter(m => !m.requires || m.requires(o));
  if (avail.length) applyMutation(o, pick(avail).id, true);
  if (o.isPlayer) {
    ambientLog('— you are someone else now');
    ping(420, 0.6, 'sine', 0.16);
    o.nextMutationAt = Math.max(14, Math.round(o.biomass + 8));
    recordRun({ ...o, name: o.name + '·' + (o.metamorphCount), peakBiomass: o.peakBiomass });
  }
}

function currentAt(x, y) {
  // procedural drift field
  const t = totalTime * 0.04;
  const fx = Math.sin(x * 0.0019 + t) + Math.cos(y * 0.0024 - t * 0.7);
  const fy = Math.cos(x * 0.0022 - t * 0.6) - Math.sin(y * 0.0017 + t * 0.5);
  return { x: fx * 4, y: fy * 4 };
}

// ─── resource respawn + scarcity ───────────────────────────────────────────
let resourceTimer = 0;
function updateResources(dt) {
  scarcity.phase += dt * 0.04;
  scarcity.intensity = (Math.sin(scarcity.phase) + 1) / 2; // 0..1
  // drift
  for (const r of resources) {
    const c = currentAt(r.x, r.y);
    r.x += (r.vx + c.x) * dt;
    r.y += (r.vy + c.y) * dt;
    r.vx *= 0.98; r.vy *= 0.98;
    r.x = clamp(r.x, 4, WORLD.w - 4);
    r.y = clamp(r.y, 4, WORLD.h - 4);
    r.phase += dt * 2;
  }
  // respawn — slows as scarcity rises
  resourceTimer -= dt;
  if (resourceTimer <= 0) {
    const target = lerp(720, 380, scarcity.intensity);
    if (resources.length < target) {
      // spawn a cluster
      const cx = rand(0, WORLD.w), cy = rand(0, WORLD.h);
      const n = randInt(4, 14);
      for (let i = 0; i < n; i++) {
        spawnResource('mote', cx + rand(-180, 180), cy + rand(-180, 180));
      }
      if (chance(0.4)) {
        spawnResource('shard', rand(0, WORLD.w), rand(0, WORLD.h));
      }
    }
    resourceTimer = lerp(1.2, 3.6, scarcity.intensity);
  }
}

// ─── rendering ─────────────────────────────────────────────────────────────
function worldToScreen(wx, wy) {
  return { x: (wx - cam.x) * cam.zoom + VW/2, y: (wy - cam.y) * cam.zoom + VH/2 };
}

function drawBackground() {
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, VW, VH);

  // faint grid-ish layer (very subtle, low alpha)
  ctx.save();
  const t = totalTime * 0.02;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.04 - i * 0.01;
    ctx.fillStyle = `hsl(${160 + i * 10}, 30%, 30%)`;
    const off = (t * (i + 1) * 40) % 240;
    for (let y = -240 + off; y < VH + 240; y += 240) {
      for (let x = -240 + off; x < VW + 240; x += 240) {
        const sz = 80 - i * 12;
        ctx.fillRect(x, y, sz, sz);
      }
    }
  }
  ctx.restore();
}

function drawDrift() {
  ctx.save();
  for (const p of drift) {
    const c = currentAt(p.x, p.y);
    p.x += (p.vx + c.x) * lastDt;
    p.y += (p.vy + c.y) * lastDt;
    p.vx *= 0.99; p.vy *= 0.99;
    if (p.x < 0) p.x = WORLD.w;
    if (p.x > WORLD.w) p.x = 0;
    if (p.y < 0) p.y = WORLD.h;
    if (p.y > WORLD.h) p.y = 0;
    const s = worldToScreen(p.x, p.y);
    if (s.x < -10 || s.x > VW + 10 || s.y < -10 || s.y > VH + 10) continue;
    ctx.globalAlpha = p.a;
    ctx.fillStyle = '#9bd5bf';
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawResources() {
  ctx.save();
  for (const r of resources) {
    const s = worldToScreen(r.x, r.y);
    if (s.x < -20 || s.x > VW + 20 || s.y < -20 || s.y > VH + 20) continue;
    const pulse = 1 + Math.sin(r.phase) * 0.15;
    if (r.kind === 'shard') {
      ctx.fillStyle = 'rgba(182, 154, 255, 0.85)';
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#b69aff';
    } else {
      ctx.fillStyle = 'rgba(155, 213, 191, 0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#6affb8';
    }
    ctx.beginPath();
    ctx.arc(s.x, s.y, r.r * cam.zoom * pulse, 0, TAU);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawOrganism(o) {
  const s = worldToScreen(o.x, o.y);
  const r = radiusOf(o) * cam.zoom;
  if (s.x < -r - 60 || s.x > VW + r + 60 || s.y < -r - 60 || s.y > VH + r + 60) return;

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(o.angle);

  const meta = o.chrysalis > 0;
  const alpha = o.isPlayer ? 1 : 0.62;

  // glow
  if (o.glow || o.isPlayer) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * (3 + o.glow * 0.8));
    const hue = o.iridescent ? (o.hue + totalTime * 30) % 360 : o.hue;
    g.addColorStop(0, `hsla(${hue}, 80%, 60%, ${0.18 + o.glow * 0.05})`);
    g.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * (3 + o.glow * 0.8), 0, TAU);
    ctx.fill();
  }

  // filaments
  if (o.filament) {
    ctx.strokeStyle = `hsla(${o.hue}, 50%, 60%, 0.32)`;
    ctx.lineWidth = 1;
    const reach = r + 14 + 18 * o.filament * cam.zoom;
    for (let i = 0; i < 6 + o.filament * 2; i++) {
      const a = (i / (6 + o.filament * 2)) * TAU + o.wobble * 0.3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      const ex = Math.cos(a) * reach + Math.sin(o.wobble + i) * 3;
      const ey = Math.sin(a) * reach + Math.cos(o.wobble + i) * 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // cilia
  if (o.appendages.cilia) {
    ctx.strokeStyle = `hsla(${o.hue}, 60%, 75%, ${0.5 * alpha})`;
    ctx.lineWidth = 1;
    const n = 18 + o.appendages.cilia * 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const wob = Math.sin(o.wobble * 2 + i * 0.4) * 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * (r + 5 + wob), Math.sin(a) * (r + 5 + wob));
      ctx.stroke();
    }
  }

  // body — wobbly blob
  const hueShift = o.iridescent ? Math.sin(totalTime * 1.4) * 40 * o.iridescent : 0;
  const hue = (o.hue + hueShift + 360) % 360;
  ctx.beginPath();
  const lobes = 12 + (meta ? 6 : 0);
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * TAU;
    const wob = Math.sin(o.wobble + i * 1.6) * (meta ? r * 0.4 : r * 0.07);
    const rr = r + wob;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
  grad.addColorStop(0, `hsla(${hue}, ${o.sat}%, ${Math.min(80, o.light + 15)}%, ${alpha})`);
  grad.addColorStop(0.7, `hsla(${hue}, ${o.sat}%, ${o.light}%, ${alpha * 0.85})`);
  grad.addColorStop(1, `hsla(${hue}, ${o.sat}%, ${Math.max(20, o.light - 25)}%, ${alpha * 0.6})`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = `hsla(${hue}, 60%, ${Math.min(80, o.light + 10)}%, ${alpha * 0.75})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // plating
  if (o.armor) {
    ctx.strokeStyle = `hsla(${hue}, 20%, 70%, ${0.5 * alpha})`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 8 * o.armor; i++) {
      const a = (i / (8 * o.armor)) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.15, 0, TAU);
      ctx.stroke();
    }
  }

  // spikes
  if (o.spikes) {
    ctx.fillStyle = `hsla(${hue}, 30%, 80%, ${0.8 * alpha})`;
    const n = 6 + 3 * o.spikes;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + o.angle * 0.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * (r + 8 + 2 * o.spikes) + Math.cos(a + 0.2) * 2,
                Math.sin(a) * (r + 8 + 2 * o.spikes) + Math.sin(a + 0.2) * 2);
      ctx.lineTo(Math.cos(a + 0.2) * r, Math.sin(a + 0.2) * r);
      ctx.closePath();
      ctx.fill();
    }
  }

  // toxin haze
  if (o.toxin) {
    ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 50%, 50%, ${0.15 * o.toxin})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const rr = r + 18 + 12 * o.toxin + Math.sin(o.wobble + i) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, TAU);
      ctx.stroke();
    }
  }

  // crystal core
  if (o.crystalCore) {
    ctx.fillStyle = `hsla(265, 80%, 70%, ${0.85 * alpha})`;
    ctx.shadowBlur = 8 * cam.zoom;
    ctx.shadowColor = '#b69aff';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const x = Math.cos(a) * r * 0.32;
      const y = Math.sin(a) * r * 0.32;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // nucleus
    ctx.fillStyle = `hsla(${hue}, ${o.sat}%, ${Math.max(20, o.light - 30)}%, ${0.8 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, TAU);
    ctx.fill();
  }

  // symbiotes (small orbiting cells)
  if (o.symbiotes) {
    for (let i = 0; i < o.symbiotes * 2; i++) {
      const a = totalTime * 0.8 + (i / (o.symbiotes * 2)) * TAU;
      const orbit = r + 16;
      const sx = Math.cos(a) * orbit;
      const sy = Math.sin(a) * orbit;
      ctx.fillStyle = `hsla(${(hue + 30) % 360}, 50%, 65%, ${0.8 * alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.18, 0, TAU);
      ctx.fill();
    }
  }

  // sail
  if (o.sail) {
    ctx.fillStyle = `hsla(${hue}, 30%, 80%, ${0.3 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 1.2, -r * 1.6, 0, -r * 2.2);
    ctx.quadraticCurveTo(-r * 0.3, -r * 1.5, 0, -r);
    ctx.fill();
  }

  ctx.restore();

  // chrysalis ring
  if (meta) {
    ctx.save();
    ctx.strokeStyle = `hsla(${o.hue}, 40%, 70%, 0.6)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -totalTime * 30;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 8, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  // name label for distant cells (silhouettes feel)
  if (!o.isPlayer) {
    const dCam = Math.hypot(o.x - cam.x, o.y - cam.y);
    if (dCam > 280 && dCam < player.sense * 3) {
      ctx.save();
      ctx.fillStyle = 'rgba(155, 213, 191, 0.25)';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(o.name.toLowerCase(), s.x, s.y - r - 8);
      ctx.restore();
    }
  }
}

// ─── camera follow ────────────────────────────────────────────────────────
function updateCamera(dt) {
  if (!player) return;
  cam.x = lerp(cam.x, player.x, 1 - Math.pow(0.001, dt));
  cam.y = lerp(cam.y, player.y, 1 - Math.pow(0.001, dt));
  // zoom drifts with player size — bigger = zoomed out
  const target = clamp(1.4 - radiusOf(player) * 0.012, 0.55, 1.4);
  cam.zoom = lerp(cam.zoom, target, 1 - Math.pow(0.01, dt));
}

// ─── loop ──────────────────────────────────────────────────────────────────
let last = performance.now();
let totalTime = 0;
let lastDt = 0.016;
let running = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  totalTime += dt;
  lastDt = dt;

  if (running) {
    updateResources(dt);
    for (const o of organisms) {
      if (o.ai) aiStep(o, dt);
      updateOrganism(o, dt);
    }
    updateCamera(dt);
    refreshHud();
  }

  drawBackground();
  drawDrift();
  drawResources();
  // draw distant organisms first, then closer
  organisms.sort((a, b) => (a === player ? 1 : -1));
  for (const o of organisms) drawOrganism(o);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ─── boot ──────────────────────────────────────────────────────────────────
document.getElementById('begin').onclick = () => {
  initAudio();
  spawnPlayer();
  running = true;
  document.getElementById('boot').classList.add('gone');
  setTimeout(() => document.getElementById('boot').remove(), 1300);
  ambientLog('— you wake. drift.');
};

// hide mutation if user clicks vignette outside cards (act as "refuse later")
mutationEl.addEventListener('click', e => {
  if (e.target === mutationEl) {
    // no-op; force them to pick or refuse
  }
});

// save on unload
addEventListener('beforeunload', () => {
  if (player && player.peakBiomass > 12) recordRun(player);
});

})();
