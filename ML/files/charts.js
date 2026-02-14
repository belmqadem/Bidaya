/* ─────────────────────────────────────────────
   LqahCare AI — Charts & Interactions
   Reads from ML_DATA (data.js)
   ───────────────────────────────────────────── */

/* ── UTILS ── */
const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const el = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function linearScale(domainMin, domainMax, rangeMin, rangeMax) {
  return v => rangeMin + (v - domainMin) / (domainMax - domainMin) * (rangeMax - rangeMin);
}

/* ── TAB SWITCHING ── */
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $('tab-' + name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');

  if (name === 'overview')  initOverview();
  if (name === 'models')    initModels();
  if (name === 'risk')      initRisk();
}

/* ════════════════════════════════════════════
   OVERVIEW TAB
════════════════════════════════════════════ */
let overviewDone = false;
function initOverview() {
  if (overviewDone) return;
  overviewDone = true;
  drawHistogram();
  drawGestScatter();
}

/* Histogram — birth weight distribution */
function drawHistogram() {
  const svg = $('hist-svg');
  if (!svg) return;
  const W = 480, H = 200;
  const pad = { l: 40, r: 12, t: 14, b: 34 };
  const data = ML_DATA.bwt_hist;
  const maxN = Math.max(...data.map(d => d.n));
  const xMin = 1000, xMax = 5000;
  const sx = linearScale(xMin, xMax, pad.l, W - pad.r);
  const sy = linearScale(0, maxN, H - pad.b, pad.t);
  const barW = (W - pad.l - pad.r) / data.length - 2;

  // defs
  const defs = svgEl('defs', {});
  const grad = svgEl('linearGradient', { id: 'hg', x1: '0', y1: '0', x2: '0', y2: '1' });
  const s1 = svgEl('stop', { offset: '0%', 'stop-color': '#00d4ff', 'stop-opacity': '0.88' });
  const s2 = svgEl('stop', { offset: '100%', 'stop-color': '#00d4ff', 'stop-opacity': '0.2' });
  grad.append(s1, s2); defs.append(grad); svg.append(defs);

  // bars
  data.forEach(d => {
    const x = sx(d.x) - barW / 2;
    const y = sy(d.n);
    const h = (H - pad.b) - y;
    if (h <= 0) return;
    const rect = svgEl('rect', { x, y, width: barW, height: h, fill: 'url(#hg)', rx: '2' });
    svg.append(rect);
  });

  // 2500 g threshold line
  const lx = sx(2500);
  svg.append(svgEl('line', { x1: lx, y1: pad.t, x2: lx, y2: H - pad.b, stroke: '#ff3b5e', 'stroke-width': '1.5', 'stroke-dasharray': '5 3' }));
  const lt = svgEl('text', { x: lx + 4, y: pad.t + 13, fill: '#ff3b5e', 'font-size': '9', 'font-family': 'Space Mono' });
  lt.textContent = '2,500g'; svg.append(lt);

  // axis
  svg.append(svgEl('line', { x1: pad.l, y1: H - pad.b, x2: W - pad.r, y2: H - pad.b, stroke: '#1e3050' }));
  [1500, 2000, 2500, 3000, 3500, 4000, 4500].forEach(v => {
    const t = svgEl('text', { x: sx(v), y: H - pad.b + 14, fill: '#4a6a8a', 'font-size': '9', 'text-anchor': 'middle', 'font-family': 'Space Mono' });
    t.textContent = v; svg.append(t);
  });

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
}

/* Gestation vs birth weight scatter */
function drawGestScatter() {
  const svg = $('gest-svg');
  if (!svg) return;
  const W = 900, H = 260;
  const pad = { l: 48, r: 16, t: 14, b: 36 };
  const data = ML_DATA.gest_bwt;
  const sx = linearScale(210, 360, pad.l, W - pad.r);
  const sy = linearScale(1000, 5200, H - pad.b, pad.t);

  // threshold
  const ty = sy(2500);
  svg.append(svgEl('line', { x1: pad.l, y1: ty, x2: W - pad.r, y2: ty, stroke: '#ff3b5e', 'stroke-width': '1', 'stroke-dasharray': '5 4', opacity: '.65' }));
  const tl = svgEl('text', { x: pad.l + 6, y: ty - 5, fill: '#ff3b5e', 'font-size': '9', 'font-family': 'Space Mono' });
  tl.textContent = '2,500g threshold'; svg.append(tl);

  // dots
  data.forEach(d => {
    const c = d.s === 1 ? 'rgba(255,107,53,.68)' : 'rgba(0,212,255,.55)';
    svg.append(svgEl('circle', { cx: sx(d.g), cy: sy(d.b), r: '4', fill: c }));
  });

  // axes
  svg.append(svgEl('line', { x1: pad.l, y1: H - pad.b, x2: W - pad.r, y2: H - pad.b, stroke: '#1e3050' }));
  svg.append(svgEl('line', { x1: pad.l, y1: pad.t, x2: pad.l, y2: H - pad.b, stroke: '#1e3050' }));
  [240, 260, 280, 300, 320, 340].forEach(v => {
    const t = svgEl('text', { x: sx(v), y: H - pad.b + 14, fill: '#4a6a8a', 'font-size': '9', 'text-anchor': 'middle', 'font-family': 'Space Mono' });
    t.textContent = v + 'd'; svg.append(t);
  });
  [1500, 2000, 2500, 3000, 3500, 4000, 4500].forEach(v => {
    const t = svgEl('text', { x: pad.l - 5, y: sy(v) + 4, fill: '#4a6a8a', 'font-size': '9', 'text-anchor': 'end', 'font-family': 'Space Mono' });
    t.textContent = v + 'g'; svg.append(t);
  });

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
}

/* ════════════════════════════════════════════
   MODELS TAB
════════════════════════════════════════════ */
let modelsDone = false;
function initModels() {
  if (modelsDone) return;
  modelsDone = true;
  buildModelBars();
  buildFIBars();
  drawPredScatter();
}

function buildModelBars() {
  const el = $('model-bars');
  if (!el) return;
  const cfg = [
    { key: 'Linear Regression', cls: 'fill-lr' },
    { key: 'Random Forest',     cls: 'fill-rf' },
    { key: 'Gradient Boosting', cls: 'fill-gb' },
  ];
  const maxR2 = 0.35;
  el.innerHTML = cfg.map(({ key, cls }) => {
    const { r2, rmse } = ML_DATA.model_results[key];
    const pct = (r2 / maxR2 * 100).toFixed(1);
    return `
      <div class="model-item">
        <div class="model-row-top">
          <span class="model-label">${key}</span>
          <span class="model-score">R² = ${r2}</span>
        </div>
        <div class="track"><div class="fill ${cls}" style="width:${pct}%"></div></div>
        <div class="model-meta">RMSE: ±${rmse} g</div>
      </div>`;
  }).join('');
}

function buildFIBars() {
  const el = $('fi-bars');
  if (!el) return;
  const fi = ML_DATA.fi;
  const labels = { gestation: 'Gestation', weight: 'Maternal Wt', parity: 'Parity', age: 'Age', height: 'Height', smoke: 'Smoking' };
  const colors = { gestation: '#00d4ff', weight: '#a855f7', parity: '#ff6b35', age: '#ffb800', height: '#39ff14', smoke: '#ff3b5e' };
  const maxV = Math.max(...Object.values(fi));

  const sorted = Object.entries(fi).sort((a, b) => b[1] - a[1]);
  el.innerHTML = sorted.map(([k, v]) => `
    <div class="fi-row">
      <span class="fi-name">${labels[k] || k}</span>
      <div class="fi-track">
        <div class="fi-fill" style="width:${(v / maxV * 100).toFixed(1)}%;background:${colors[k] || '#555'}">${(v * 100).toFixed(1)}%</div>
      </div>
    </div>`).join('');
}

function drawPredScatter() {
  const svg = $('pred-svg');
  if (!svg) return;
  const W = 900, H = 280;
  const pad = { l: 52, r: 20, t: 14, b: 38 };
  const data = ML_DATA.scatter;
  const mn = 1200, mx = 5000;
  const sx = linearScale(mn, mx, pad.l, W - pad.r);
  const sy = linearScale(mn, mx, H - pad.b, pad.t);

  // defs gradient fill for perfect-line area
  const defs = svgEl('defs', {});
  const lg = svgEl('linearGradient', { id: 'plg', x1: '0', y1: '0', x2: '1', y2: '0' });
  [['0%','#00d4ff','0.12'], ['100%','#a855f7','0.12']].forEach(([offset, color, op]) => {
    lg.append(svgEl('stop', { offset, 'stop-color': color, 'stop-opacity': op }));
  });
  defs.append(lg); svg.append(defs);

  // perfect prediction diagonal
  svg.append(svgEl('line', { x1: sx(mn), y1: sy(mn), x2: sx(mx), y2: sy(mx), stroke: '#00d4ff', 'stroke-width': '1.2', 'stroke-dasharray': '6 4', opacity: '.5' }));

  // dots
  data.forEach(d => {
    svg.append(svgEl('circle', { cx: sx(d.a), cy: sy(d.p), r: '4.5', fill: 'rgba(168,85,247,.55)' }));
  });

  // axes
  svg.append(svgEl('line', { x1: pad.l, y1: H - pad.b, x2: W - pad.r, y2: H - pad.b, stroke: '#1e3050' }));
  svg.append(svgEl('line', { x1: pad.l, y1: pad.t, x2: pad.l, y2: H - pad.b, stroke: '#1e3050' }));

  [2000, 2500, 3000, 3500, 4000, 4500].forEach(v => {
    const tx = svgEl('text', { x: sx(v), y: H - pad.b + 15, fill: '#4a6a8a', 'font-size': '9', 'text-anchor': 'middle', 'font-family': 'Space Mono' });
    tx.textContent = v; svg.append(tx);
    const ty = svgEl('text', { x: pad.l - 5, y: sy(v) + 4, fill: '#4a6a8a', 'font-size': '9', 'text-anchor': 'end', 'font-family': 'Space Mono' });
    ty.textContent = v; svg.append(ty);
  });

  // axis labels
  const xl = svgEl('text', { x: W / 2, y: H - 4, fill: '#4a6a8a', 'font-size': '10', 'text-anchor': 'middle', 'font-family': 'Sora' });
  xl.textContent = 'Actual Birth Weight (g)'; svg.append(xl);
  const yl = svgEl('text', { x: 14, y: H / 2, fill: '#4a6a8a', 'font-size': '10', 'text-anchor': 'middle', 'font-family': 'Sora', transform: `rotate(-90,14,${H / 2})` });
  yl.textContent = 'Predicted (g)'; svg.append(yl);

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
}

/* ════════════════════════════════════════════
   RISK TAB
════════════════════════════════════════════ */
let riskDone = false;
function initRisk() {
  if (riskDone) return;
  riskDone = true;
  buildRiskCards();
}

function buildRiskCards() {
  const el = $('risk-grid');
  if (!el) return;
  const barColor = { HIGH: 'var(--danger)', MODERATE: 'var(--warn)', LOW: 'var(--safe)' };
  const valColor = { HIGH: 'var(--danger)', MODERATE: 'var(--warn)', LOW: 'var(--safe)' };

  el.innerHTML = ML_DATA.cases.map(c => {
    const pct = Math.min(95, c.risk_pct + (c.risk === 'HIGH' ? 55 : c.risk === 'MODERATE' ? 25 : 0));
    return `
      <div class="risk-card ${c.risk}">
        <div class="rc-header">
          <span class="rc-name">${c.name}</span>
          <span class="badge ${c.risk}">${c.risk}</span>
        </div>
        <div class="rc-row">
          <span class="rc-lbl">Predicted Weight</span>
          <span class="rc-val" style="color:${valColor[c.risk]}">${c.predicted_g.toLocaleString()} g</span>
        </div>
        <div class="rc-row">
          <span class="rc-lbl">Gestation</span>
          <span class="rc-val">${c.gestation} days</span>
        </div>
        <div class="rc-row">
          <span class="rc-lbl">Mother Age</span>
          <span class="rc-val">${c.age} yrs</span>
        </div>
        <div class="rc-row">
          <span class="rc-lbl">Smoking</span>
          <span class="rc-val" style="color:${c.smoke ? 'var(--danger)' : 'var(--safe)'}">${c.smoke ? 'Yes ⚠' : 'No ✓'}</span>
        </div>
        <div class="riskbar-track">
          <div class="riskbar-fill" style="width:${pct}%;background:${barColor[c.risk]}"></div>
        </div>
        <div class="rc-scale"><span>Low risk</span><span>High risk</span></div>
      </div>`;
  }).join('');
}

/* ── BOOTSTRAP ── */
document.addEventListener('DOMContentLoaded', () => {
  // Populate KPIs from data
  const s = ML_DATA.stats;
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set('kpi-records',  s.total.toLocaleString());
  set('kpi-lowbw',    s.low_bw_pct + '%');
  set('kpi-preterm',  s.preterm_pct + '%');
  set('kpi-smoke',    s.smoke_pct + '%');

  // Smoke impact numbers
  set('smoke-nonsmoker', ML_DATA.smoke_impact.nonsmoker.toLocaleString() + 'g');
  set('smoke-smoker',    ML_DATA.smoke_impact.smoker.toLocaleString() + 'g');

  // First tab
  initOverview();
});
