/* ============================================================
   SPK Hero MLBB – app.js
   Mobile Legends Bang Bang Theme — AHP-TOPSIS Engine
   ============================================================ */

"use strict";

/* ── DATA ──────────────────────────────────────────────────── */

const CRITERIA = [
  { code: "C1", name: "Crowd Control (CC)",          weight: 0.41, type: "Benefit", desc: "Kemampuan menghentikan gerak musuh — Stun, Slow, Knockback" },
  { code: "C2", name: "Serangan Area (AoE)",         weight: 0.25, type: "Benefit", desc: "Kemampuan memberi damage/efek pada area luas secara bersamaan" },
  { code: "C3", name: "Damage Besar & Escaping",     weight: 0.17, type: "Benefit", desc: "Kemampuan burst damage tinggi dan lolos dari kondisi berbahaya" },
  { code: "C4", name: "Daya Tahan (Durability)",     weight: 0.11, type: "Benefit", desc: "Ketebalan HP dan ketahanan hero dalam pertempuran panjang" },
  { code: "C5", name: "Kekuatan Late Game",          weight: 0.07, type: "Benefit", desc: "Kekuatan maksimal hero di fase akhir permainan" },
];

const HEROES = [
  { id: 1, type: "Tank/Roamer",      role: "Roaming / Support", examples: "Tigreal, Khufra, Gatot Kaca",  color: "#6496ff", c1: 3.70000, c2: 3.06667, c3: 2.46667, c4: 4.03333, c5: 2.83333 },
  { id: 2, type: "Assassin/Jungler", role: "Jungler",            examples: "Yi-Sun-Shin, Lancelot, Ling", color: "#ff5050", c1: 2.20000, c2: 3.36667, c3: 3.80000, c4: 2.26667, c5: 3.83333 },
  { id: 3, type: "Marksman",         role: "Gold Lane",          examples: "Granger, Bruno, Brody",       color: "#50e080", c1: 2.26667, c2: 3.06667, c3: 3.46667, c4: 1.96667, c5: 3.90000 },
  { id: 4, type: "Mage",             role: "Mid Lane",           examples: "Pharsa, Kadita, Odette",      color: "#b464ff", c1: 3.16667, c2: 3.63333, c3: 3.23333, c4: 2.06667, c5: 3.60000 },
  { id: 5, type: "Fighter",          role: "EXP Lane",           examples: "Chou, Yu Zhong, Lapu-Lapu",  color: "#ff8c00", c1: 3.96667, c2: 3.53333, c3: 3.16667, c4: 3.60000, c5: 2.96667 },
];

const NORMALIZATION_DIVISORS = [7.030652, 7.471874, 7.281791, 6.519544, 7.726144];

const TOPSIS_RESULTS = [
  { id: 1, dPlus: 0.04078783, dMinus: 0.09416791, vi: 0.697769, rank: 2 },
  { id: 2, dPlus: 0.10762282, dMinus: 0.03431328, vi: 0.241752, rank: 4 },
  { id: 3, dPlus: 0.10707061, dMinus: 0.02556450, vi: 0.192743, rank: 5 },
  { id: 4, dPlus: 0.05882135, dMinus: 0.06252014, vi: 0.515241, rank: 3 },
  { id: 5, dPlus: 0.01883538, dMinus: 0.10902280, vi: 0.852685, rank: 1 },
];

const A_PLUS  = [0.23132062, 0.12156689, 0.08871444, 0.06805173, 0.03533457];
const A_MINUS = [0.12829536, 0.10260712, 0.05758664, 0.03318233, 0.02567038];

const cKeys = ["c1","c2","c3","c4","c5"];

/* ── SVG ROLE ICONS ────────────────────────────────────────── */

function getRoleIcon(type, size = 44) {
  const s = size;
  const icons = {
    "Tank/Roamer": `<svg viewBox="0 0 60 60" width="${s}" height="${s}">
      <circle cx="30" cy="30" r="28" fill="rgba(100,150,255,0.08)" stroke="#6496ff" stroke-width="1"/>
      <path d="M30 10L46 18V30C46 39 38 47 30 50C22 47 14 39 14 30V18L30 10Z"
            fill="rgba(100,150,255,0.12)" stroke="#6496ff" stroke-width="2"/>
      <path d="M30 17L40 23V30C40 36.5 35.5 41.5 30 43.5C24.5 41.5 20 36.5 20 30V23L30 17Z"
            fill="rgba(100,150,255,0.15)" stroke="#6496ff" stroke-width="1"/>
      <line x1="30" y1="22" x2="30" y2="39" stroke="#6496ff" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="22.5" y1="30" x2="37.5" y2="30" stroke="#6496ff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    "Assassin/Jungler": `<svg viewBox="0 0 60 60" width="${s}" height="${s}">
      <circle cx="30" cy="30" r="28" fill="rgba(255,80,80,0.08)" stroke="#ff5050" stroke-width="1"/>
      <path d="M22 44L30 12L38 44" fill="none" stroke="#ff5050" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M18 36L42 36" stroke="#ff5050" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="30" cy="12" rx="3.5" ry="4" fill="#ff5050" opacity="0.9"/>
      <line x1="15" y1="44" x2="22" y2="44" stroke="#ff5050" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="38" y1="44" x2="45" y2="44" stroke="#ff5050" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="48" x2="45" y2="48" stroke="#ff5050" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
    </svg>`,

    "Marksman": `<svg viewBox="0 0 60 60" width="${s}" height="${s}">
      <circle cx="30" cy="30" r="28" fill="rgba(80,224,128,0.08)" stroke="#50e080" stroke-width="1"/>
      <path d="M14 30C14 30 22 14 30 14C38 14 46 30 46 30" fill="none" stroke="#50e080" stroke-width="2"/>
      <line x1="30" y1="12" x2="30" y2="48" stroke="#50e080" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="14" y1="30" x2="24" y2="30" stroke="#50e080" stroke-width="2" stroke-linecap="round"/>
      <circle cx="30" cy="30" r="3" fill="#50e080"/>
      <line x1="30" y1="30" x2="46" y2="14" stroke="#50e080" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <polygon points="44,10 48,14 46,14 46,12" fill="#50e080"/>
    </svg>`,

    "Mage": `<svg viewBox="0 0 60 60" width="${s}" height="${s}">
      <circle cx="30" cy="30" r="28" fill="rgba(180,100,255,0.08)" stroke="#b464ff" stroke-width="1"/>
      <line x1="30" y1="10" x2="30" y2="48" stroke="#b464ff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="30" cy="13" r="6" fill="rgba(180,100,255,0.2)" stroke="#b464ff" stroke-width="1.5"/>
      <circle cx="30" cy="13" r="3" fill="#b464ff"/>
      <ellipse cx="30" cy="13" rx="10" ry="3.5" fill="none" stroke="#b464ff" stroke-width="1" opacity="0.5" transform="rotate(-30 30 13)"/>
      <circle cx="20" cy="25" r="2" fill="#b464ff" opacity="0.6"/>
      <circle cx="40" cy="22" r="1.5" fill="#b464ff" opacity="0.5"/>
      <circle cx="17" cy="37" r="2" fill="#b464ff" opacity="0.4"/>
      <circle cx="43" cy="35" r="2" fill="#b464ff" opacity="0.6"/>
      <circle cx="38" cy="42" r="1.5" fill="#b464ff" opacity="0.4"/>
    </svg>`,

    "Fighter": `<svg viewBox="0 0 60 60" width="${s}" height="${s}">
      <circle cx="30" cy="30" r="28" fill="rgba(255,140,0,0.08)" stroke="#ff8c00" stroke-width="1"/>
      <line x1="16" y1="44" x2="44" y2="16" stroke="#ff8c00" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="16" x2="44" y2="44" stroke="#ff8c00" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="13" y="13" width="7" height="7" rx="1" fill="#ff8c00" opacity="0.8" transform="rotate(45 16.5 16.5)"/>
      <rect x="40" y="40" width="7" height="7" rx="1" fill="#ff8c00" opacity="0.8" transform="rotate(45 43.5 43.5)"/>
      <circle cx="30" cy="30" r="5" fill="rgba(255,140,0,0.2)" stroke="#ff8c00" stroke-width="1.5"/>
      <circle cx="30" cy="30" r="2.5" fill="#ff8c00"/>
    </svg>`,
  };
  return icons[type] || icons["Fighter"];
}

/* ── TOPSIS COMPUTATION ENGINE ─────────────────────────────── */

function computeNormMatrix(heroes) {
  const divisors = cKeys.map(k => Math.sqrt(heroes.reduce((s, h) => s + h[k] ** 2, 0)));
  return heroes.map(h => {
    const r = {};
    cKeys.forEach((k, j) => { r[k] = h[k] / divisors[j]; });
    return { ...h, ...r };
  });
}

function computeWeightedMatrix(normHeroes, weights) {
  return normHeroes.map(h => {
    const v = {};
    cKeys.forEach((k, j) => { v[k] = h[k] * weights[j]; });
    return { ...h, ...v };
  });
}

function computeTOPSIS(heroes, weights) {
  const norm = computeNormMatrix(heroes);
  const weighted = computeWeightedMatrix(norm, weights);
  const aPlus  = cKeys.map(k => Math.max(...weighted.map(h => h[k])));
  const aMinus = cKeys.map(k => Math.min(...weighted.map(h => h[k])));

  return weighted.map(h => {
    const dPlus  = Math.sqrt(cKeys.reduce((s, k, j) => s + (h[k] - aPlus[j]) ** 2, 0));
    const dMinus = Math.sqrt(cKeys.reduce((s, k, j) => s + (h[k] - aMinus[j]) ** 2, 0));
    const vi = dMinus / (dPlus + dMinus);
    return { ...h, dPlus, dMinus, vi };
  }).sort((a, b) => b.vi - a.vi).map((h, i) => ({ ...h, rank: i + 1 }));
}

/* ── UTILITIES ─────────────────────────────────────────────── */

const fmt  = (n, d = 4) => Number(n).toFixed(d);
const fmtP = n => (Number(n) * 100).toFixed(0) + "%";

function rankInfo(rank) {
  const info = [
    { label: "TERBAIK", cls: "best",   scoreClass: "gold",   fill: "gold"   },
    { label: "BAIK",    cls: "good",   scoreClass: "silver", fill: "blue"   },
    { label: "CUKUP",   cls: "ok",     scoreClass: "bronze", fill: "green"  },
    { label: "#4",      cls: "normal", scoreClass: "normal", fill: "dim"    },
    { label: "#5",      cls: "normal", scoreClass: "normal", fill: "dim"    },
  ];
  return info[rank - 1] || info[4];
}

function rankMedalSVG(rank) {
  const colors = {
    1: ["#f0c832","#b08020","#fde68a"],
    2: ["#8ca8d8","#4a6a9a","#c8dcf0"],
    3: ["#c87040","#906030","#f0b870"],
    4: ["#6a6a7a","#3a3a4a","#aaaabc"],
    5: ["#6a6a7a","#3a3a4a","#aaaabc"],
  };
  const [main, dark, light] = colors[rank] || colors[5];
  const nums = ["I","II","III","IV","V"];
  return `<svg viewBox="0 0 48 48" width="44" height="44">
    <circle cx="24" cy="24" r="20" fill="${dark}" stroke="${main}" stroke-width="2"/>
    <circle cx="24" cy="24" r="16" fill="${main}" opacity="0.3"/>
    <polygon points="24,10 27,18 36,18 29,23 31,32 24,27 17,32 19,23 12,18 21,18"
             fill="${light}" opacity="0.9"/>
    <text x="24" y="38" text-anchor="middle" fill="${main}" font-size="7"
          font-family="Cinzel,serif" font-weight="800" letter-spacing="1">${nums[rank-1]}</text>
  </svg>`;
}

function heatColor(val, min, max) {
  const t = (val - min) / (max - min);
  // From deep navy (cold) to gold (hot)
  const r = Math.round(20  + t * (200 - 20));
  const g = Math.round(30  + t * (150 - 30));
  const b = Math.round(80  + t * (40  - 80));
  const alpha = 0.25 + t * 0.5;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── PARTICLES ─────────────────────────────────────────────── */

function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles = [];

  const resize = () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };

  const make = () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25 - 0.1,
    alpha: Math.random() * 0.5 + 0.1,
    color: Math.random() < 0.6 ? "200,168,75" : Math.random() < 0.5 ? "100,150,255" : "180,100,255",
  });

  resize();
  window.addEventListener("resize", resize);
  for (let i = 0; i < 90; i++) particles.push(make());

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < 0)  { p.y = H; p.x = Math.random() * W; }
      if (p.y > H)  { p.y = 0; }
      if (p.x < 0)  { p.x = W; }
      if (p.x > W)  { p.x = 0; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

/* ── NAVBAR ────────────────────────────────────────────────── */

function initNavbar() {
  const navbar   = document.getElementById("navbar");
  const sections = document.querySelectorAll("section[id]");
  const links    = document.querySelectorAll(".nav-link");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
    let cur = "";
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 110) cur = s.id; });
    links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + cur));
  });

  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
  });

  document.querySelectorAll(".mob-link").forEach(l => {
    l.addEventListener("click", () => mobileMenu.classList.remove("open"));
  });
}

/* ── CRITERIA GRID ─────────────────────────────────────────── */

function renderCriteriaGrid() {
  document.getElementById("criteria-grid").innerHTML = CRITERIA.map((c, i) => `
    <div class="criteria-card" style="animation:fadeSlideIn 0.5s ease ${i*0.1}s both">
      <div class="crit-code">${c.code}</div>
      <div class="crit-name">${c.name}</div>
      <div class="crit-weight-label">Bobot AHP</div>
      <div class="crit-weight-val">${fmtP(c.weight)}</div>
      <span class="crit-type-badge">${c.type}</span>
      <div class="crit-desc">${c.desc}</div>
    </div>`).join("");
}

function renderAHPBarChart() {
  const max = Math.max(...CRITERIA.map(c => c.weight));
  document.getElementById("ahp-bar-chart").innerHTML = CRITERIA.map(c => `
    <div class="bar-row">
      <div class="bar-label">${c.code} — ${c.name.split(" ")[0]} ${c.name.split(" ")[1] || ""}</div>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(c.weight / max) * 100}"></div>
      </div>
      <div class="bar-value">${fmtP(c.weight)}</div>
    </div>`).join("");

  observeAndAnimate(".bar-fill", el => { el.style.width = el.dataset.width + "%"; });
}

/* ── MATRIX TABLES ─────────────────────────────────────────── */

function buildRawMatrix() {
  const rows = HEROES.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name">
        <span class="hero-role-svg">${getRoleIcon(h.type, 22)}</span>${h.type}
      </td>
      <td style="font-size:0.75rem;color:var(--text-muted);font-style:italic">${h.examples}</td>
      ${cKeys.map(k => `<td class="mono">${h[k].toFixed(5)}</td>`).join("")}
    </tr>`).join("");

  const extra = `
    <tr style="border-top:1px solid rgba(200,168,75,0.15)">
      <td colspan="3" style="color:var(--text-muted);font-size:0.75rem;font-style:italic;font-family:'Rajdhani',sans-serif">√(ΣXij²) — Pembagi normalisasi</td>
      ${NORMALIZATION_DIVISORS.map(d => `<td class="mono">${d.toFixed(6)}</td>`).join("")}
    </tr>
    <tr>
      <td colspan="3" style="color:var(--mlbb-gold);font-size:0.75rem;font-family:'Cinzel',serif;font-weight:700">Bobot AHP (wj)</td>
      ${CRITERIA.map(c => `<td class="mono" style="color:var(--mlbb-gold-lt);font-weight:700">${c.weight}</td>`).join("")}
    </tr>`;

  document.getElementById("table-container").innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>No</th><th>Tipe Hero</th><th>Contoh Hero</th>
        ${CRITERIA.map(c => `<th>${c.code} — ${c.name.split(" ")[0]}</th>`).join("")}
      </tr></thead>
      <tbody>${rows}${extra}</tbody>
    </table>`;
}

function buildNormMatrix() {
  const norm = computeNormMatrix(HEROES);
  const rows = norm.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-role-svg">${getRoleIcon(h.type, 22)}</span>${h.type}</td>
      ${cKeys.map(k => `<td class="mono">${fmt(h[k], 7)}</td>`).join("")}
    </tr>`).join("");

  document.getElementById("table-container").innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>No</th><th>Tipe Hero</th>
        ${CRITERIA.map(c => `<th>r${c.code.slice(1)} (${c.code})</th>`).join("")}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildWeightedMatrix() {
  const norm     = computeNormMatrix(HEROES);
  const weighted = computeWeightedMatrix(norm, CRITERIA.map(c => c.weight));
  const aP       = cKeys.map(k => Math.max(...weighted.map(h => h[k])));
  const aN       = cKeys.map(k => Math.min(...weighted.map(h => h[k])));

  const rows = weighted.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-role-svg">${getRoleIcon(h.type, 22)}</span>${h.type}</td>
      ${cKeys.map(k => `<td class="mono">${fmt(h[k], 8)}</td>`).join("")}
    </tr>`).join("");

  document.getElementById("table-container").innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>No</th><th>Tipe Hero</th>
        ${CRITERIA.map(c => `<th>v${c.code.slice(1)} (${c.code})</th>`).join("")}
      </tr></thead>
      <tbody>
        ${rows}
        <tr style="border-top:1px solid rgba(200,168,75,0.2)">
          <td colspan="2" style="color:var(--mlbb-gold);font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem">A⁺ — Ideal Positif</td>
          ${aP.map(v => `<td class="mono" style="color:var(--mlbb-gold)">${fmt(v,8)}</td>`).join("")}
        </tr>
        <tr>
          <td colspan="2" style="color:#ff7070;font-family:'Cinzel',serif;font-weight:700;font-size:0.75rem">A⁻ — Ideal Negatif</td>
          ${aN.map(v => `<td class="mono" style="color:#ff7070">${fmt(v,8)}</td>`).join("")}
        </tr>
      </tbody>
    </table>`;
}

function initTabBar() {
  const tabs = document.querySelectorAll(".mlbb-tab");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      if (tab === "raw")      buildRawMatrix();
      if (tab === "norm")     buildNormMatrix();
      if (tab === "weighted") buildWeightedMatrix();
    });
  });
  buildRawMatrix();
}

/* ── HEATMAP ─────────────────────────────────────────────────  */

function renderHeatmap() {
  const allVals = HEROES.flatMap(h => cKeys.map(k => h[k]));
  const min = Math.min(...allVals), max = Math.max(...allVals);

  const header = `<div class="heatmap-header">
    ${CRITERIA.map(c => `<div class="heatmap-col-label">${c.code}</div>`).join("")}
  </div>`;

  const rows = HEROES.map(h => `
    <div class="heatmap-row">
      <div class="heatmap-hero-label">
        ${getRoleIcon(h.type, 22)} ${h.type}
      </div>
      ${cKeys.map((k, j) => {
        const v = h[k];
        const bg = heatColor(v, min, max);
        return `<div class="heatmap-cell" style="background:${bg}"
                     title="${CRITERIA[j].name}: ${v.toFixed(2)}">
                  <span class="cell-val">${v.toFixed(2)}</span>
                  <span class="cell-label">${CRITERIA[j].code}</span>
                </div>`;
      }).join("")}
    </div>`).join("");

  document.getElementById("heatmap-container").innerHTML =
    header + `<div class="heatmap-grid">${rows}</div>`;
}

/* ── TOPSIS SECTION ─────────────────────────────────────────── */

function renderTOPSISSection() {
  document.getElementById("ideal-positive").innerHTML = CRITERIA.map((c, j) =>
    `<div class="ideal-item">
      <span class="i-label">${c.code}</span>
      <span class="i-val">${fmt(A_PLUS[j], 8)}</span>
    </div>`).join("");

  document.getElementById("ideal-negative").innerHTML = CRITERIA.map((c, j) =>
    `<div class="ideal-item">
      <span class="i-label">${c.code}</span>
      <span class="i-val" style="color:#ff7070">${fmt(A_MINUS[j], 8)}</span>
    </div>`).join("");

  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  document.getElementById("pref-scores").innerHTML = sorted.map(r => {
    const h = HEROES.find(x => x.id === r.id);
    return `<div class="ideal-item">
      <span class="i-label">${h.type.split("/")[0]}</span>
      <span class="i-val" style="color:var(--mlbb-gold-lt)">${fmt(r.vi, 6)}</span>
    </div>`;
  }).join("");

  // Distance table
  const rows = TOPSIS_RESULTS.map(r => {
    const h = HEROES.find(x => x.id === r.id);
    const { label, cls } = rankInfo(r.rank);
    return `<tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-role-svg">${getRoleIcon(h.type, 22)}</span>${h.type}</td>
      <td class="mono">${fmt(r.dPlus, 8)}</td>
      <td class="mono">${fmt(r.dMinus, 8)}</td>
      <td class="mono" style="color:var(--mlbb-gold);font-weight:700">${fmt(r.vi, 6)}</td>
      <td style="font-family:'Cinzel',serif;font-weight:800;font-size:0.8rem">#${r.rank}</td>
      <td><span class="rank-status ${cls}">${label}</span></td>
    </tr>`;
  }).join("");

  document.getElementById("distance-table-container").innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>No</th><th>Tipe Hero</th><th>D⁺ (ke A⁺)</th>
        <th>D⁻ (ke A⁻)</th><th>Skor Vi</th><th>Ranking</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── RANKING CARDS ─────────────────────────────────────────── */

function renderRankingCards() {
  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  const maxC   = Math.max(...HEROES.flatMap(h => cKeys.map(k => h[k])));

  document.getElementById("ranking-cards").innerHTML = sorted.map((r, i) => {
    const h = HEROES.find(x => x.id === r.id);
    const { label, cls, scoreClass } = rankInfo(r.rank);

    const critBars = CRITERIA.map((c, j) => {
      const val = h[cKeys[j]];
      return `<div class="rank-crit-row">
        <span class="rank-crit-label">${c.code}</span>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${(val/maxC)*100}%;background:${h.color}40;border:1px solid ${h.color}60"></div>
        </div>
        <span class="mini-bar-val">${val.toFixed(2)}</span>
      </div>`;
    }).join("");

    return `
      <div class="rank-card rank-${r.rank}" style="animation:fadeSlideIn 0.6s ease ${i*0.12}s both">
        <div class="rank-card-corner-mark"></div>
        <div class="rank-badge-pos">${rankMedalSVG(r.rank)}</div>
        <div class="rank-number">RANKING #${r.rank}</div>
        <div class="rank-hero-icon">${getRoleIcon(h.type, 52)}</div>
        <div class="rank-type">${h.type}</div>
        <div class="rank-heroes">${h.examples}</div>
        <div class="rank-score-label">SKOR TOPSIS (Vi)</div>
        <div class="rank-score ${scoreClass}">${fmt(r.vi, 6)}</div>
        <span class="rank-status ${cls}">${label}</span>
        <div class="rank-criteria-bars">${critBars}</div>
      </div>`;
  }).join("");
}

/* ── SCORE COMPARISON BARS ──────────────────────────────────── */

function renderScoreBars() {
  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  const maxV = Math.max(...sorted.map(r => r.vi));
  const fillClasses = ["gold","blue","green","dim","dim"];

  document.getElementById("score-bars").innerHTML = sorted.map((r, i) => {
    const h = HEROES.find(x => x.id === r.id);
    const pct = (r.vi / maxV) * 100;
    return `
      <div class="score-row">
        <div class="score-label">
          ${getRoleIcon(h.type, 20)} ${h.type}
        </div>
        <div class="score-track">
          <div class="score-fill ${fillClasses[i]}" data-width="${pct}"></div>
        </div>
        <div class="score-val">${fmt(r.vi, 4)}</div>
      </div>`;
  }).join("");

  observeAndAnimate(".score-fill", el => { el.style.width = el.dataset.width + "%"; });
}

/* ── RADAR CHART ─────────────────────────────────────────────  */

function drawRadarChart() {
  const canvas = document.getElementById("radar-canvas");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R  = Math.min(W, H) * 0.33;
  const N  = 5;
  const maxVal = 5.0;

  const angles = Array.from({length: N}, (_, i) => (i / N) * Math.PI * 2 - Math.PI / 2);
  const toXY = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  ctx.clearRect(0, 0, W, H);

  // Grid rings
  for (let lv = 1; lv <= 5; lv++) {
    const r = (lv / 5) * R;
    ctx.beginPath();
    angles.forEach((a, i) => {
      const p = toXY(a, r);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = lv === 5
      ? "rgba(200,168,75,0.25)"
      : "rgba(200,168,75,0.08)";
    ctx.lineWidth = lv === 5 ? 1.5 : 1;
    ctx.stroke();
    // Ring label
    ctx.fillStyle = "rgba(200,168,75,0.4)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText((lv).toFixed(0), cx + r + 4, cy);
  }

  // Axes
  angles.forEach((a, i) => {
    const outer = toXY(a, R);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(outer.x, outer.y);
    ctx.strokeStyle = "rgba(200,168,75,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Axis label
    const lp = toXY(a, R + 32);
    ctx.fillStyle = "#c8a84b";
    ctx.font = "bold 12px Cinzel, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(CRITERIA[i].code, lp.x, lp.y);

    const sp = toXY(a, R + 50);
    ctx.fillStyle = "rgba(160,144,112,0.7)";
    ctx.font = "10px Rajdhani, sans-serif";
    const short = CRITERIA[i].name.split(" ")[0];
    ctx.fillText(short, sp.x, sp.y);
  });

  // Hero polygons
  const heroColors = {
    "Tank/Roamer":      "#6496ff",
    "Assassin/Jungler": "#ff5050",
    "Marksman":         "#50e080",
    "Mage":             "#b464ff",
    "Fighter":          "#ff8c00",
  };

  HEROES.forEach(h => {
    const vals = cKeys.map(k => h[k]);
    ctx.beginPath();
    vals.forEach((v, i) => {
      const r = (v / maxVal) * R;
      const p = toXY(angles[i], r);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();

    const col = heroColors[h.type] || "#c8a84b";
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = col + "22";
    ctx.fill();

    vals.forEach((v, i) => {
      const r = (v / maxVal) * R;
      const p = toXY(angles[i], r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
  });

  // Build legend
  const legendEl = document.getElementById("radar-legend");
  if (legendEl) {
    legendEl.innerHTML = HEROES.map(h => {
      const col = heroColors[h.type] || "#c8a84b";
      return `<div class="radar-legend-item">
        <div class="radar-legend-dot" style="background:${col}30;border-color:${col}"></div>
        ${h.type}
      </div>`;
    }).join("");
  }
}

/* ── SIMULATOR ───────────────────────────────────────────────  */

const DEFAULT_WEIGHTS = CRITERIA.map(c => c.weight);
let simWeights = [...DEFAULT_WEIGHTS];

function renderSliders() {
  document.getElementById("weight-sliders").innerHTML = CRITERIA.map((c, i) => `
    <div class="slider-row">
      <div class="slider-header">
        <span class="slider-name">${c.code} — ${c.name.split("(")[0].trim()}</span>
        <span class="slider-val" id="sw-val-${i}">${fmtP(simWeights[i])}</span>
      </div>
      <input type="range" id="sw-${i}" min="0" max="100" step="1"
             value="${Math.round(simWeights[i] * 100)}"
             oninput="onSliderChange(${i}, this.value)" />
    </div>`).join("");
}

function onSliderChange(index, rawVal) {
  simWeights[index] = rawVal / 100;
  document.getElementById(`sw-val-${index}`).textContent = fmtP(simWeights[index]);
  updateTotal();
  runSimulator();
}

function updateTotal() {
  const total = simWeights.reduce((s, w) => s + w, 0);
  const el = document.getElementById("total-weight");
  el.textContent = total.toFixed(2);
  el.classList.toggle("error", Math.abs(total - 1) > 0.015);

  const note = document.getElementById("sim-note");
  if (Math.abs(total - 1) > 0.015) {
    note.textContent = `⚠ Total bobot ${total.toFixed(2)} — Bobot akan dinormalisasi otomatis ke 1.00`;
    note.classList.add("show");
  } else {
    note.classList.remove("show");
  }
}

const simPosClasses = ["sim-pos-1","sim-pos-2","sim-pos-3","sim-pos-4","sim-pos-5"];
const simMedals = ["I","II","III","IV","V"];

function runSimulator() {
  const total = simWeights.reduce((s, w) => s + w, 0);
  const normalized = total > 0 ? simWeights.map(w => w / total) : simWeights;
  const results = computeTOPSIS(HEROES, normalized);

  document.getElementById("sim-ranking-list").innerHTML = results.map((r, i) => {
    const orig = HEROES.find(h => h.type === r.type) || HEROES[0];
    return `
      <div class="sim-rank-item" style="animation:fadeSlideIn 0.3s ease ${i*0.07}s both">
        <div class="sim-rank-pos ${simPosClasses[i]}">${simMedals[i]}</div>
        <div class="sim-rank-icon">${getRoleIcon(orig.type, 34)}</div>
        <div class="sim-rank-info">
          <div class="sim-rank-name">${orig.type}</div>
          <div class="sim-rank-heroes">${orig.examples}</div>
        </div>
        <div class="sim-rank-score">${fmt(r.vi, 4)}</div>
      </div>`;
  }).join("");
}

function initSimulator() {
  renderSliders();
  runSimulator();

  document.getElementById("btn-reset-weights").addEventListener("click", () => {
    simWeights = [...DEFAULT_WEIGHTS];
    renderSliders();
    updateTotal();
    runSimulator();
  });

  document.getElementById("btn-recalculate").addEventListener("click", () => {
    runSimulator();
  });
}

/* ── INTERSECTION OBSERVER ───────────────────────────────────  */

function observeAndAnimate(selector, callback) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { callback(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(selector).forEach(el => obs.observe(el));
}

/* ── INIT ────────────────────────────────────────────────────  */

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initNavbar();
  renderCriteriaGrid();
  renderAHPBarChart();
  initTabBar();
  renderHeatmap();
  renderTOPSISSection();
  renderRankingCards();
  renderScoreBars();

  // Radar on scroll
  observeAndAnimate("#radar-canvas", () => drawRadarChart());

  initSimulator();
});
