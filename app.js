/* ============================================================
   SPK Hero MLBB – app.js
   AHP-TOPSIS Decision Support System
   ============================================================ */

"use strict";

/* ── DATA ──────────────────────────────────────────────── */

const CRITERIA = [
  { code: "C1", name: "Crowd Control (CC)",             weight: 0.41, type: "Benefit", desc: "Kemampuan menghentikan gerak musuh (Stun, Slow, Knockback) – Bobot tertinggi" },
  { code: "C2", name: "Serangan Area (AoE)",            weight: 0.25, type: "Benefit", desc: "Kemampuan memberi damage/efek pada area luas" },
  { code: "C3", name: "Damage Besar & Escaping",        weight: 0.17, type: "Benefit", desc: "Kemampuan burst damage dan melarikan diri dari bahaya" },
  { code: "C4", name: "Daya Tahan (Durability)",        weight: 0.11, type: "Benefit", desc: "Ketebalan HP dan pertahanan hero dalam pertempuran" },
  { code: "C5", name: "Hero Late Game",                 weight: 0.07, type: "Benefit", desc: "Kekuatan maksimal hero di fase akhir permainan" },
];

const HEROES = [
  { id: 1, type: "Tank/Roamer",      role: "Roaming / Support", examples: "Tigreal, Khufra, Gatot Kaca",    icon: "🛡️", c1: 3.70000, c2: 3.06667, c3: 2.46667, c4: 4.03333, c5: 2.83333 },
  { id: 2, type: "Assassin/Jungler", role: "Jungler",            examples: "Yi-Sun-Shin, Lancelot, Ling",   icon: "🗡️", c1: 2.20000, c2: 3.36667, c3: 3.80000, c4: 2.26667, c5: 3.83333 },
  { id: 3, type: "Marksman",         role: "Gold Lane",          examples: "Granger, Bruno, Brody",         icon: "🏹", c1: 2.26667, c2: 3.06667, c3: 3.46667, c4: 1.96667, c5: 3.90000 },
  { id: 4, type: "Mage",             role: "Mid Lane",           examples: "Pharsa, Kadita, Odette",        icon: "🔮", c1: 3.16667, c2: 3.63333, c3: 3.23333, c4: 2.06667, c5: 3.60000 },
  { id: 5, type: "Fighter",          role: "EXP Lane",           examples: "Chou, Yu Zhong, Lapu-Lapu",    icon: "⚔️", c1: 3.96667, c2: 3.53333, c3: 3.16667, c4: 3.60000, c5: 2.96667 },
];

// Pre-computed TOPSIS results (from the Excel file)
const NORMALIZATION_DIVISORS = [7.030652, 7.471874, 7.281791, 6.519544, 7.726144];

const TOPSIS_RESULTS = [
  { id: 1, dPlus: 0.04078783, dMinus: 0.09416791, vi: 0.697769, rank: 2, status: "BAIK ✓"       },
  { id: 2, dPlus: 0.10762282, dMinus: 0.03431328, vi: 0.241752, rank: 4, status: ""              },
  { id: 3, dPlus: 0.10707061, dMinus: 0.02556450, vi: 0.192743, rank: 5, status: ""              },
  { id: 4, dPlus: 0.05882135, dMinus: 0.06252014, vi: 0.515241, rank: 3, status: ""              },
  { id: 5, dPlus: 0.01883538, dMinus: 0.10902280, vi: 0.852685, rank: 1, status: "TERBAIK ★"    },
];

const A_PLUS  = [0.23132062, 0.12156689, 0.08871444, 0.06805173, 0.03533457];
const A_MINUS = [0.12829536, 0.10260712, 0.05758664, 0.03318233, 0.02567038];

/* ── TOPSIS CALCULATION ENGINE ─────────────────────────── */

function computeNormMatrix(heroes) {
  const keys = ["c1","c2","c3","c4","c5"];
  const divisors = keys.map(k => {
    const sum = heroes.reduce((s, h) => s + h[k] ** 2, 0);
    return Math.sqrt(sum);
  });
  return heroes.map(h => {
    const norm = {};
    keys.forEach((k, j) => { norm[k] = h[k] / divisors[j]; });
    return { ...h, ...norm };
  });
}

function computeWeightedMatrix(normHeroes, weights) {
  const keys = ["c1","c2","c3","c4","c5"];
  return normHeroes.map(h => {
    const weighted = {};
    keys.forEach((k, j) => { weighted[k] = h[k] * weights[j]; });
    return { ...h, ...weighted };
  });
}

function computeTOPSIS(heroes, weights) {
  const keys = ["c1","c2","c3","c4","c5"];
  const norm = computeNormMatrix(heroes);
  const weighted = computeWeightedMatrix(norm, weights);

  // Ideal positive & negative (all benefit)
  const aPlus  = keys.map(k => Math.max(...weighted.map(h => h[k])));
  const aMinus = keys.map(k => Math.min(...weighted.map(h => h[k])));

  return weighted.map(h => {
    const dPlus  = Math.sqrt(keys.reduce((s, k, j) => s + (h[k] - aPlus[j])  ** 2, 0));
    const dMinus = Math.sqrt(keys.reduce((s, k, j) => s + (h[k] - aMinus[j]) ** 2, 0));
    const vi = dMinus / (dPlus + dMinus);
    return { ...h, dPlus, dMinus, vi };
  }).sort((a, b) => b.vi - a.vi).map((h, i) => ({ ...h, rank: i + 1 }));
}

/* ── UTILITIES ──────────────────────────────────────────── */

const fmt  = (n, d = 4) => Number(n).toFixed(d);
const fmtP = (n)        => (Number(n) * 100).toFixed(0) + "%";

function rankStatusLabel(rank) {
  if (rank === 1) return { label: "🥇 TERBAIK", cls: "best" };
  if (rank === 2) return { label: "🥈 BAIK",     cls: "good" };
  if (rank === 3) return { label: "🥉 CUKUP",    cls: "ok"   };
  return { label: `#${rank}`, cls: "normal" };
}

function heroColor(heroType) {
  const map = {
    "Fighter":          "#f7ba2c",
    "Tank/Roamer":      "#6c63ff",
    "Mage":             "#00d4ff",
    "Assassin/Jungler": "#ff4f6a",
    "Marksman":         "#00e676",
  };
  return map[heroType] || "#888";
}

function heatColor(val, min, max) {
  const t = (val - min) / (max - min);
  const r = Math.round(108 + t * (247 - 108));
  const g = Math.round(99  + t * (186 - 99));
  const b = Math.round(255 + t * (44  - 255));
  return `rgba(${r},${g},${b}, ${0.3 + t * 0.5})`;
}

/* ── PARTICLES BACKGROUND ───────────────────────────────── */

function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
    };
  }

  resize();
  window.addEventListener("resize", resize);
  for (let i = 0; i < 120; i++) particles.push(makeParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,99,255,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── NAVBAR SCROLL EFFECT ───────────────────────────────── */

function initNavbar() {
  const navbar = document.getElementById("navbar");
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);

    // Active link highlight
    let current = "";
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    navLinks.forEach(l => {
      l.classList.toggle("active", l.getAttribute("href") === "#" + current);
    });
  });
}

/* ── SECTION A: CRITERIA GRID ───────────────────────────── */

function renderCriteriaGrid() {
  const grid = document.getElementById("criteria-grid");
  grid.innerHTML = CRITERIA.map((c, i) => `
    <div class="criteria-card" style="animation-delay:${i * 0.1}s; animation: fadeSlideIn 0.5s ease ${i * 0.1}s both;">
      <div class="crit-code">${c.code}</div>
      <div class="crit-name">${c.name}</div>
      <div class="crit-weight-label">Bobot AHP</div>
      <div class="crit-weight-val">${fmtP(c.weight)}</div>
      <div class="crit-type-badge">${c.type}</div>
      <div class="crit-desc">${c.desc}</div>
    </div>
  `).join("");
}

function renderAHPBarChart() {
  const chart = document.getElementById("ahp-bar-chart");
  const max = Math.max(...CRITERIA.map(c => c.weight));
  chart.innerHTML = CRITERIA.map(c => `
    <div class="bar-row">
      <div class="bar-label">${c.code} – ${c.name.split(" ")[0]}</div>
      <div class="bar-track">
        <div class="bar-fill" data-width="${(c.weight / max) * 100}"></div>
      </div>
      <div class="bar-value">${fmtP(c.weight)}</div>
    </div>
  `).join("");

  // Animate bars when visible
  observeAndAnimate(".bar-fill", el => {
    el.style.width = el.dataset.width + "%";
  });
}

/* ── SECTION B: MATRIX TABLES ───────────────────────────── */

const cKeys = ["c1","c2","c3","c4","c5"];

function buildRawMatrix() {
  const rows = HEROES.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-icon">${h.icon}</span>${h.type}</td>
      <td><small style="color:var(--clr-muted)">${h.examples}</small></td>
      ${cKeys.map(k => `<td class="mono">${h[k].toFixed(5)}</td>`).join("")}
    </tr>
  `).join("");

  const div = document.getElementById("table-container");
  const extra = `
    <tr style="border-top:2px solid rgba(108,99,255,0.2)">
      <td colspan="3" style="color:var(--clr-muted); font-size:0.8rem; font-style:italic">√(ΣXij²)</td>
      ${NORMALIZATION_DIVISORS.map(d => `<td class="mono">${d.toFixed(6)}</td>`).join("")}
    </tr>
    <tr>
      <td colspan="3" style="color:var(--clr-muted); font-size:0.8rem; font-style:italic">Bobot AHP (wj)</td>
      ${CRITERIA.map(c => `<td class="mono" style="color:var(--clr-secondary)">${c.weight}</td>`).join("")}
    </tr>
  `;
  div.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Tipe Hero</th>
          <th>Contoh Hero</th>
          ${CRITERIA.map(c => `<th>${c.code} – ${c.name.split(" ")[0]}</th>`).join("")}
        </tr>
      </thead>
      <tbody>${rows}${extra}</tbody>
    </table>`;
}

function buildNormMatrix() {
  const norm = computeNormMatrix(HEROES);
  const rows = norm.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-icon">${h.icon}</span>${h.type}</td>
      ${cKeys.map(k => `<td class="mono">${fmt(h[k], 7)}</td>`).join("")}
    </tr>
  `).join("");
  document.getElementById("table-container").innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Tipe Hero</th>
          ${CRITERIA.map(c => `<th>r${c.code.slice(1)} (${c.code})</th>`).join("")}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildWeightedMatrix() {
  const norm     = computeNormMatrix(HEROES);
  const weighted = computeWeightedMatrix(norm, CRITERIA.map(c => c.weight));
  const aPlus    = cKeys.map(k => Math.max(...weighted.map(h => h[k])));
  const aMinus   = cKeys.map(k => Math.min(...weighted.map(h => h[k])));

  const rows = weighted.map(h => `
    <tr>
      <td>${h.id}</td>
      <td class="hero-name"><span class="hero-icon">${h.icon}</span>${h.type}</td>
      ${cKeys.map(k => `<td class="mono">${fmt(h[k], 8)}</td>`).join("")}
    </tr>
  `).join("");

  document.getElementById("table-container").innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Tipe Hero</th>
          ${CRITERIA.map(c => `<th>v${c.code.slice(1)} (${c.code})</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="border-top:2px solid rgba(247,186,44,0.25)">
          <td colspan="2" style="color:var(--clr-secondary);font-weight:700">A⁺ (Ideal Positif)</td>
          ${aPlus.map(v => `<td class="mono" style="color:var(--clr-secondary)">${fmt(v,8)}</td>`).join("")}
        </tr>
        <tr>
          <td colspan="2" style="color:var(--clr-red);font-weight:700">A⁻ (Ideal Negatif)</td>
          ${aMinus.map(v => `<td class="mono" style="color:var(--clr-red)">${fmt(v,8)}</td>`).join("")}
        </tr>
      </tbody>
    </table>`;
}

function initTabBar() {
  const tabs = document.querySelectorAll(".tab-btn");
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
  buildRawMatrix(); // default
}

/* ── HEATMAP ────────────────────────────────────────────── */

function renderHeatmap() {
  const container = document.getElementById("heatmap-container");
  const keys = cKeys;
  const allVals = HEROES.flatMap(h => keys.map(k => h[k]));
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);

  const header = `<div class="heatmap-header">
    ${CRITERIA.map(c => `<div class="heatmap-col-label">${c.code}</div>`).join("")}
  </div>`;

  const rows = HEROES.map(h => `
    <div class="heatmap-row">
      <div class="heatmap-hero-label">${h.icon} ${h.type}</div>
      ${keys.map(k => {
        const v = h[k];
        const bg = heatColor(v, min, max);
        return `<div class="heatmap-cell" style="background:${bg}; color:#fff;"
                  title="${CRITERIA[keys.indexOf(k)].name}: ${v.toFixed(2)}">
                  <span>${v.toFixed(2)}</span>
                  <span class="cell-label">${CRITERIA[keys.indexOf(k)].code}</span>
                </div>`;
      }).join("")}
    </div>
  `).join("");

  container.innerHTML = header + `<div class="heatmap-grid">${rows}</div>`;
}

/* ── SECTION C: TOPSIS ──────────────────────────────────── */

function renderTOPSISSection() {
  // Ideal positive
  document.getElementById("ideal-positive").innerHTML = CRITERIA.map((c, j) =>
    `<div class="ideal-item">
      <span class="i-label">${c.code}</span>
      <span class="i-val">${fmt(A_PLUS[j], 8)}</span>
    </div>`
  ).join("");

  // Ideal negative
  document.getElementById("ideal-negative").innerHTML = CRITERIA.map((c, j) =>
    `<div class="ideal-item">
      <span class="i-label">${c.code}</span>
      <span class="i-val">${fmt(A_MINUS[j], 8)}</span>
    </div>`
  ).join("");

  // Preference scores
  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  document.getElementById("pref-scores").innerHTML = sorted.map(r => {
    const h = HEROES.find(h => h.id === r.id);
    return `<div class="ideal-item">
      <span class="i-label">${h.icon} ${h.type}</span>
      <span class="i-val">${fmt(r.vi, 6)}</span>
    </div>`;
  }).join("");

  // Distance table
  const rows = TOPSIS_RESULTS.map(r => {
    const h = HEROES.find(x => x.id === r.id);
    const { label, cls } = rankStatusLabel(r.rank);
    return `<tr>
      <td>${h.id}</td>
      <td class="hero-name">${h.icon} ${h.type}</td>
      <td class="mono">${fmt(r.dPlus, 8)}</td>
      <td class="mono">${fmt(r.dMinus, 8)}</td>
      <td class="mono" style="color:var(--clr-green);font-weight:700">${fmt(r.vi, 6)}</td>
      <td><strong>#${r.rank}</strong></td>
      <td><span class="rank-status ${cls}">${label}</span></td>
    </tr>`;
  }).join("");

  document.getElementById("distance-table-container").innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Tipe Hero</th>
          <th>D⁺ (ke A⁺)</th>
          <th>D⁻ (ke A⁻)</th>
          <th>Skor Vi</th>
          <th>Ranking</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── SECTION D: RANKING CARDS ───────────────────────────── */

function renderRankingCards() {
  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  const container = document.getElementById("ranking-cards");
  const maxC = Math.max(...HEROES.flatMap(h => cKeys.map(k => h[k])));

  const scoreColorClass = (rank) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "purple";
    if (rank === 3) return "green";
    return "normal";
  };

  container.innerHTML = sorted.map((r, i) => {
    const h = HEROES.find(x => x.id === r.id);
    const { label, cls } = rankStatusLabel(r.rank);
    const medal = ["🥇","🥈","🥉","4️⃣","5️⃣"][i];

    const critBars = CRITERIA.map((c, j) => {
      const val = h[cKeys[j]];
      return `<div class="rank-crit-row">
        <span class="rank-crit-label">${c.code}</span>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${(val / maxC) * 100}%"></div>
        </div>
        <span class="mini-bar-val">${val.toFixed(2)}</span>
      </div>`;
    }).join("");

    return `
      <div class="rank-card rank-${r.rank}" style="animation-delay:${i * 0.12}s">
        <div class="rank-badge">${medal}</div>
        <div class="rank-number">Ranking #${r.rank}</div>
        <div class="rank-icon">${h.icon}</div>
        <div class="rank-type">${h.type}</div>
        <div class="rank-heroes">${h.examples}</div>
        <div class="rank-score-label">Skor TOPSIS (Vi)</div>
        <div class="rank-score ${scoreColorClass(r.rank)}">${fmt(r.vi, 6)}</div>
        <span class="rank-status ${cls}">${label}</span>
        <div class="rank-criteria-bars">${critBars}</div>
      </div>`;
  }).join("");
}

function renderScoreBars() {
  const sorted = [...TOPSIS_RESULTS].sort((a, b) => a.rank - b.rank);
  const container = document.getElementById("score-bars");
  const max = Math.max(...sorted.map(r => r.vi));

  container.innerHTML = sorted.map(r => {
    const h = HEROES.find(x => x.id === r.id);
    const pct = (r.vi / max) * 100;
    return `
      <div class="score-row">
        <div class="score-label">${h.icon} ${h.type}</div>
        <div class="score-track">
          <div class="score-fill ${r.rank === 1 ? "gold" : ""}" data-width="${pct}"></div>
        </div>
        <div class="score-val">${fmt(r.vi, 4)}</div>
      </div>`;
  }).join("");

  observeAndAnimate(".score-fill", el => {
    el.style.width = el.dataset.width + "%";
  });
}

/* ── RADAR CHART ────────────────────────────────────────── */

function drawRadarChart() {
  const canvas = document.getElementById("radar-canvas");
  const ctx    = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R  = Math.min(W, H) * 0.35;
  const N  = 5; // number of criteria

  const labels = CRITERIA.map(c => c.code);
  const colors = ["#f7ba2c","#6c63ff","#00d4ff","#ff4f6a","#00e676"];
  const maxVal = 5.0;

  // Angles for each axis (start from top)
  const angles = labels.map((_, i) => (i / N) * Math.PI * 2 - Math.PI / 2);

  function polarToXY(angle, r) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  ctx.clearRect(0, 0, W, H);

  // Draw grid
  const gridLevels = 5;
  for (let lv = 1; lv <= gridLevels; lv++) {
    const r = (lv / gridLevels) * R;
    ctx.beginPath();
    angles.forEach((a, i) => {
      const p = polarToXY(a, r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw axes
  angles.forEach((a, i) => {
    const outer = polarToXY(a, R);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(outer.x, outer.y);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Labels
    const lp = polarToXY(a, R + 28);
    ctx.fillStyle = "#7a8ba0";
    ctx.font = "bold 12px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[i], lp.x, lp.y);

    // Criteria name
    const np = polarToXY(a, R + 48);
    ctx.fillStyle = "rgba(122,139,160,0.7)";
    ctx.font = "10px Outfit, sans-serif";
    const shortName = CRITERIA[i].name.split(" ")[0];
    ctx.fillText(shortName, np.x, np.y);
  });

  // Draw hero polygons
  HEROES.forEach((h, hi) => {
    const vals = cKeys.map(k => h[k]);
    ctx.beginPath();
    vals.forEach((v, i) => {
      const r = (v / maxVal) * R;
      const p = polarToXY(angles[i], r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();

    const col = heroColor(h.type);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = col.replace(")", ", 0.1)").replace("rgb(", "rgba(") || col + "20";
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Dots at vertices
    vals.forEach((v, i) => {
      const r = (v / maxVal) * R;
      const p = polarToXY(angles[i], r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
  });

  // Legend
  const legendX = W - 160;
  let legendY = 20;
  HEROES.forEach(h => {
    const col = heroColor(h.type);
    ctx.fillStyle = col;
    ctx.fillRect(legendX, legendY, 14, 14);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px Outfit, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(h.icon + " " + h.type, legendX + 20, legendY + 7);
    legendY += 22;
  });
}

/* ── SIMULATOR ──────────────────────────────────────────── */

const DEFAULT_WEIGHTS = CRITERIA.map(c => c.weight);
let simWeights = [...DEFAULT_WEIGHTS];

function renderSliders() {
  const container = document.getElementById("weight-sliders");
  container.innerHTML = CRITERIA.map((c, i) => `
    <div class="slider-row">
      <div class="slider-header">
        <span class="slider-name">${c.code} – ${c.name.split("(")[0].trim()}</span>
        <span class="slider-val" id="sw-val-${i}">${fmtP(simWeights[i])}</span>
      </div>
      <input type="range" id="sw-${i}" min="0" max="100" step="1"
             value="${Math.round(simWeights[i] * 100)}"
             oninput="onSliderChange(${i}, this.value)" />
    </div>
  `).join("");
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
  el.classList.toggle("error", Math.abs(total - 1) > 0.01);

  const note = document.getElementById("sim-note");
  if (Math.abs(total - 1) > 0.01) {
    note.textContent = `⚠️ Total bobot = ${total.toFixed(2)} — Normalkan ke 1.00 untuk hasil akurat.`;
    note.classList.add("show");
  } else {
    note.classList.remove("show");
  }
}

function runSimulator() {
  const total = simWeights.reduce((s, w) => s + w, 0);
  const normalized = total > 0 ? simWeights.map(w => w / total) : simWeights;
  const results = computeTOPSIS(HEROES, normalized);

  const container = document.getElementById("sim-ranking-list");
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  container.innerHTML = results.map((r, i) => {
    const original = HEROES.find(h => h.type === r.type);
    return `
      <div class="sim-rank-item" style="animation: fadeSlideIn 0.3s ease ${i * 0.06}s both;">
        <div class="sim-rank-pos">${medals[i]}</div>
        <div class="sim-rank-info">
          <div class="sim-rank-name">${original ? original.icon : ""} ${r.type}</div>
          <div class="sim-rank-heroes">${original ? original.examples : ""}</div>
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

/* ── INTERSECTION OBSERVER ANIMATION ────────────────────── */

function observeAndAnimate(selector, callback) {
  const elements = document.querySelectorAll(selector);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}

/* ── INIT ───────────────────────────────────────────────── */

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

  // Radar chart on scroll into view
  observeAndAnimate("#radar-canvas", () => drawRadarChart());

  initSimulator();

  // Fade-in animation for sections
  observeAndAnimate(".section-header", el => {
    el.style.animation = "fadeSlideIn 0.7s ease both";
  });
});
