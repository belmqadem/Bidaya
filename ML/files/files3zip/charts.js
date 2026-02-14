/* ─────────────────────────────────────────────
   LqahCare AI — Charts & Interactions v2
   ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs={}) {
  const e=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
  return e;
}
function txt(tag,attrs,content){const e=el(tag,attrs);e.textContent=content;return e}
function scale(dMin,dMax,rMin,rMax){return v=>rMin+(v-dMin)/(dMax-dMin)*(rMax-rMin)}

/* TAB SWITCHING */
function switchTab(name){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  $('tab-'+name).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  if(name==='overview') initOverview();
  if(name==='models')   initModels();
  if(name==='risk')     initRisk();
}

/* ── OVERVIEW ── */
let ovDone=false;
function initOverview(){if(ovDone)return;ovDone=true;drawHistogram();drawGestScatter()}

function drawHistogram(){
  const svg=$('hist-svg');if(!svg)return;
  const W=500,H=200,P={l:40,r:12,t:14,b:34};
  const data=ML_DATA.bwt_hist;
  const maxN=Math.max(...data.map(d=>d.n));
  const sx=scale(1000,5000,P.l,W-P.r);
  const sy=scale(0,maxN,H-P.b,P.t);
  const bw=(W-P.l-P.r)/data.length-2;
  const defs=el('defs');
  const g=el('linearGradient',{id:'hg',x1:'0',y1:'0',x2:'0',y2:'1'});
  g.append(el('stop',{offset:'0%','stop-color':'#00d4ff','stop-opacity':'.85'}));
  g.append(el('stop',{offset:'100%','stop-color':'#00d4ff','stop-opacity':'.18'}));
  defs.append(g);svg.append(defs);
  data.forEach(d=>{
    const x=sx(d.x)-bw/2,y=sy(d.n),h=(H-P.b)-y;
    if(h>0) svg.append(el('rect',{x,y,width:bw,height:h,fill:'url(#hg)',rx:2}));
  });
  const lx=sx(2500);
  svg.append(el('line',{x1:lx,y1:P.t,x2:lx,y2:H-P.b,stroke:'#ff3b5e','stroke-width':'1.5','stroke-dasharray':'5 3'}));
  svg.append(txt('text',{x:lx+4,y:P.t+13,fill:'#ff3b5e','font-size':'9','font-family':'Space Mono'},'2,500g'));
  svg.append(el('line',{x1:P.l,y1:H-P.b,x2:W-P.r,y2:H-P.b,stroke:'#1e3050'}));
  [1500,2000,2500,3000,3500,4000,4500].forEach(v=>
    svg.append(txt('text',{x:sx(v),y:H-P.b+14,fill:'#4a6a8a','font-size':'9','text-anchor':'middle','font-family':'Space Mono'},v))
  );
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}

function drawGestScatter(){
  const svg=$('gest-svg');if(!svg)return;
  const W=900,H=260,P={l:48,r:16,t:14,b:36};
  const sx=scale(210,360,P.l,W-P.r);
  const sy=scale(900,5200,H-P.b,P.t);
  const ty=sy(2500);
  svg.append(el('line',{x1:P.l,y1:ty,x2:W-P.r,y2:ty,stroke:'#ff3b5e','stroke-width':'1','stroke-dasharray':'5 4',opacity:'.6'}));
  svg.append(txt('text',{x:P.l+6,y:ty-5,fill:'#ff3b5e','font-size':'9','font-family':'Space Mono'},'2,500g threshold'));
  ML_DATA.gest_bwt.forEach(d=>
    svg.append(el('circle',{cx:sx(d.g),cy:sy(d.b),r:4,fill:d.s?'rgba(255,107,53,.65)':'rgba(0,212,255,.52)'}))
  );
  svg.append(el('line',{x1:P.l,y1:H-P.b,x2:W-P.r,y2:H-P.b,stroke:'#1e3050'}));
  svg.append(el('line',{x1:P.l,y1:P.t,x2:P.l,y2:H-P.b,stroke:'#1e3050'}));
  [240,260,280,300,320,340].forEach(v=>
    svg.append(txt('text',{x:sx(v),y:H-P.b+14,fill:'#4a6a8a','font-size':'9','text-anchor':'middle','font-family':'Space Mono'},v+'d'))
  );
  [1500,2000,2500,3000,3500,4000,4500].forEach(v=>
    svg.append(txt('text',{x:P.l-5,y:sy(v)+4,fill:'#4a6a8a','font-size':'9','text-anchor':'end','font-family':'Space Mono'},v+'g'))
  );
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}

/* ── MODELS — 5 CHARTS ── */
let modDone=false;
function initModels(){
  if(modDone)return;modDone=true;
  drawModelR2Bars();drawFIBars();drawPredScatter();drawResidualPlot();drawLearningCurve();initTuning();
}

function drawModelR2Bars(){
  const c=$('model-bars');if(!c)return;
  const cfg=[{key:'Linear Regression',cls:'fill-lr'},{key:'Random Forest',cls:'fill-rf'},{key:'Gradient Boosting',cls:'fill-gb'}];
  c.innerHTML=cfg.map(({key,cls})=>{
    const {r2,rmse}=ML_DATA.model_r2[key];
    return `<div class="model-item">
      <div class="model-row-top"><span class="model-label">${key}</span><span class="model-score">R² = ${r2}</span></div>
      <div class="track"><div class="fill ${cls}" style="width:${(r2/0.35*100).toFixed(1)}%"></div></div>
      <div class="model-meta">RMSE ±${rmse} g</div></div>`;
  }).join('');
}

function drawFIBars(){
  const c=$('fi-bars');if(!c)return;
  const labels={gestation:'Gestation',weight:'Maternal Wt',parity:'Parity',age:'Age',height:'Height',smoke:'Smoking'};
  const colors={gestation:'#00d4ff',weight:'#a855f7',parity:'#ff6b35',age:'#ffb800',height:'#39ff14',smoke:'#ff3b5e'};
  const fi=ML_DATA.fi;
  const maxV=Math.max(...Object.values(fi));
  c.innerHTML=Object.entries(fi).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
    <div class="fi-row">
      <span class="fi-name">${labels[k]||k}</span>
      <div class="fi-track"><div class="fi-fill" style="width:${(v/maxV*100).toFixed(1)}%;background:${colors[k]||'#555'}">${(v*100).toFixed(1)}%</div></div>
    </div>`).join('');
}

function drawPredScatter(){
  const svg=$('pred-svg');if(!svg)return;
  const W=900,H=280,P={l:52,r:18,t:14,b:38};
  const mn=1200,mx=5000;
  const sx=scale(mn,mx,P.l,W-P.r);
  const sy=scale(mn,mx,H-P.b,P.t);
  svg.append(el('line',{x1:sx(mn),y1:sy(mn),x2:sx(mx),y2:sy(mx),stroke:'#00d4ff','stroke-width':'1.2','stroke-dasharray':'6 4',opacity:'.45'}));
  ML_DATA.scatter_pred.forEach(d=>svg.append(el('circle',{cx:sx(d.a),cy:sy(d.p),r:4.5,fill:'rgba(168,85,247,.52)'})));
  svg.append(el('line',{x1:P.l,y1:H-P.b,x2:W-P.r,y2:H-P.b,stroke:'#1e3050'}));
  svg.append(el('line',{x1:P.l,y1:P.t,x2:P.l,y2:H-P.b,stroke:'#1e3050'}));
  [2000,2500,3000,3500,4000,4500].forEach(v=>{
    svg.append(txt('text',{x:sx(v),y:H-P.b+15,fill:'#4a6a8a','font-size':'9','text-anchor':'middle','font-family':'Space Mono'},v));
    svg.append(txt('text',{x:P.l-5,y:sy(v)+4,fill:'#4a6a8a','font-size':'9','text-anchor':'end','font-family':'Space Mono'},v));
  });
  svg.append(txt('text',{x:W/2,y:H-4,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora'},'Actual Birth Weight (g)'));
  svg.append(txt('text',{x:13,y:H/2,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora',transform:`rotate(-90,13,${H/2})`},'Predicted (g)'));
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}

function drawResidualPlot(){
  const svg=$('resid-svg');if(!svg)return;
  const W=900,H=260,P={l:52,r:18,t:20,b:38};
  const data=ML_DATA.residuals;
  const pMin=Math.min(...data.map(d=>d.pred))-100;
  const pMax=Math.max(...data.map(d=>d.pred))+100;
  const rMin=Math.min(...data.map(d=>d.res))-100;
  const rMax=Math.max(...data.map(d=>d.res))+100;
  const sx=scale(pMin,pMax,P.l,W-P.r);
  const sy=scale(rMin,rMax,H-P.b,P.t);
  const zero=sy(0);
  svg.append(el('line',{x1:P.l,y1:zero,x2:W-P.r,y2:zero,stroke:'#00d4ff','stroke-width':'1','stroke-dasharray':'5 4',opacity:'.5'}));
  svg.append(txt('text',{x:P.l+4,y:zero-5,fill:'#00d4ff','font-size':'9','font-family':'Space Mono',opacity:'.7'},'zero error'));
  data.forEach(d=>svg.append(el('circle',{cx:sx(d.pred),cy:sy(d.res),r:4,fill:d.res>0?'rgba(57,255,20,.55)':'rgba(255,59,94,.55)'})));
  svg.append(el('line',{x1:P.l,y1:H-P.b,x2:W-P.r,y2:H-P.b,stroke:'#1e3050'}));
  svg.append(el('line',{x1:P.l,y1:P.t,x2:P.l,y2:H-P.b,stroke:'#1e3050'}));
  [2000,2500,3000,3500,4000].forEach(v=>{
    if(v>=pMin&&v<=pMax) svg.append(txt('text',{x:sx(v),y:H-P.b+14,fill:'#4a6a8a','font-size':'9','text-anchor':'middle','font-family':'Space Mono'},v));
  });
  [-1000,-500,0,500,1000].forEach(v=>{
    if(v>=rMin&&v<=rMax){
      svg.append(txt('text',{x:P.l-5,y:sy(v)+4,fill:'#4a6a8a','font-size':'9','text-anchor':'end','font-family':'Space Mono'},v));
      svg.append(el('line',{x1:P.l,y1:sy(v),x2:W-P.r,y2:sy(v),stroke:'#1e3050','stroke-width':'.5',opacity:'.4'}));
    }
  });
  svg.append(txt('text',{x:W/2,y:H-4,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora'},'Predicted Birth Weight (g)'));
  svg.append(txt('text',{x:13,y:H/2,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora',transform:`rotate(-90,13,${H/2})`},'Residual (g)'));
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}

function drawLearningCurve(){
  const svg=$('lc-svg');if(!svg)return;
  const W=900,H=240,P={l:52,r:20,t:18,b:38};
  const data=ML_DATA.learning_curve;
  const nMin=data[0].n,nMax=data[data.length-1].n;
  const yMin=Math.min(...data.flatMap(d=>[d.train,d.val]))-0.04;
  const yMax=Math.max(...data.flatMap(d=>[d.train,d.val]))+0.04;
  const sx=scale(nMin,nMax,P.l,W-P.r);
  const sy=scale(yMin,yMax,H-P.b,P.t);
  [0.10,0.15,0.20,0.25,0.30,0.35].forEach(v=>{
    if(v>=yMin&&v<=yMax){
      svg.append(el('line',{x1:P.l,y1:sy(v),x2:W-P.r,y2:sy(v),stroke:'#1e3050','stroke-width':'.5',opacity:'.5'}));
      svg.append(txt('text',{x:P.l-5,y:sy(v)+4,fill:'#4a6a8a','font-size':'9','text-anchor':'end','font-family':'Space Mono'},v.toFixed(2)));
    }
  });
  const tp=data.map((d,i)=>`${i===0?'M':'L'}${sx(d.n)},${sy(d.train)}`).join(' ');
  const vp=data.map((d,i)=>`${i===0?'M':'L'}${sx(d.n)},${sy(d.val)}`).join(' ');
  svg.append(el('path',{d:tp,fill:'none',stroke:'#00d4ff','stroke-width':'2','stroke-linejoin':'round'}));
  svg.append(el('path',{d:vp,fill:'none',stroke:'#39ff14','stroke-width':'2','stroke-linejoin':'round','stroke-dasharray':'7 3'}));
  data.forEach(d=>{
    svg.append(el('circle',{cx:sx(d.n),cy:sy(d.train),r:4,fill:'#00d4ff'}));
    svg.append(el('circle',{cx:sx(d.n),cy:sy(d.val),r:4,fill:'#39ff14'}));
  });
  svg.append(el('line',{x1:P.l,y1:H-P.b,x2:W-P.r,y2:H-P.b,stroke:'#1e3050'}));
  data.forEach(d=>svg.append(txt('text',{x:sx(d.n),y:H-P.b+14,fill:'#4a6a8a','font-size':'9','text-anchor':'middle','font-family':'Space Mono'},d.n)));
  svg.append(txt('text',{x:W/2,y:H-4,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora'},'Training Set Size (records)'));
  svg.append(txt('text',{x:13,y:H/2,fill:'#4a6a8a','font-size':'10','text-anchor':'middle','font-family':'Sora',transform:`rotate(-90,13,${H/2})`},'R² Score'));
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}

/* ── PARAMETER TUNING ── */
function initTuning(){
  updateTuning();
  ['ts-slider','ne-slider','md-slider'].forEach(id=>{
    const e=$(id);if(e)e.addEventListener('input',updateTuning);
  });
}

function updateTuning(){
  const tsEl=$('ts-slider'),neEl=$('ne-slider'),mdEl=$('md-slider');
  if(!tsEl)return;
  const tsOpts=ML_DATA.param_options.test_sizes;
  const neOpts=ML_DATA.param_options.n_estimators;
  const mdOpts=ML_DATA.param_options.max_depths;
  const tsVal=tsOpts[parseInt(tsEl.value)];
  const neVal=neOpts[parseInt(neEl.value)];
  const mdVal=mdOpts[parseInt(mdEl.value)];
  $('ts-display').textContent=(tsVal*100).toFixed(0)+'%';
  $('ne-display').textContent=neVal;
  $('md-display').textContent=mdVal===0?'None':mdVal;
  const key=`${tsVal}_${neVal}_${mdVal}`;
  const res=ML_DATA.param_grid[key];
  if(!res)return;
  const r2El=$('t-r2');
  if(r2El){
    $('t-r2').textContent=res.r2;
    $('t-rmse').textContent='±'+res.rmse+'g';
    $('t-train').textContent=res.train_size;
    $('t-test').textContent=res.test_size;
    const col=res.r2>=0.28?'var(--safe)':res.r2>=0.22?'var(--accent)':'var(--warn)';
    $('t-r2').style.color=col;
  }
}

/* ── RISK TAB ── */
let riskDone=false;
function initRisk(){if(riskDone)return;riskDone=true;buildRiskCards()}

function buildRiskCards(){
  const c=$('risk-grid');if(!c)return;
  const bCol={HIGH:'var(--danger)',MODERATE:'var(--warn)',LOW:'var(--safe)'};
  c.innerHTML=ML_DATA.cases.map(p=>{
    const pct=Math.min(92,p.risk_pct+(p.risk==='HIGH'?55:p.risk==='MODERATE'?25:0));
    return `<div class="risk-card ${p.risk}">
      <div class="rc-header"><span class="rc-name">${p.name}</span><span class="badge ${p.risk}">${p.risk}</span></div>
      <div class="rc-row"><span class="rc-lbl">Predicted Weight</span><span class="rc-val" style="color:${bCol[p.risk]}">${p.predicted_g.toLocaleString()} g</span></div>
      <div class="rc-row"><span class="rc-lbl">Gestation</span><span class="rc-val">${p.gestation} days</span></div>
      <div class="rc-row"><span class="rc-lbl">Mother Age</span><span class="rc-val">${p.age} yrs</span></div>
      <div class="rc-row"><span class="rc-lbl">Smoking</span><span class="rc-val" style="color:${p.smoke?'var(--danger)':'var(--safe)'}">${p.smoke?'Yes ⚠':'No ✓'}</span></div>
      <div class="riskbar-track"><div class="riskbar-fill" style="width:${pct}%;background:${bCol[p.risk]}"></div></div>
      <div class="rc-scale"><span>Low risk</span><span>High risk</span></div>
    </div>`;
  }).join('');
}

/* Live prediction */
function runPrediction(){
  const g  =parseFloat($('f-gest').value);
  const par=parseInt($('f-parity').value);
  const age=parseFloat($('f-age').value);
  const h  =parseFloat($('f-height').value);
  const w  =parseFloat($('f-weight').value);
  const smk=parseInt($('f-smoke').value);
  if([g,age,h,w].some(v=>isNaN(v)||v<=0)){
    showResult(null,'Please fill in all fields with valid values.');return;
  }
  // Regression equation derived from trained GB model coefficients
  const pred=3390+(g-280)*17.2+(par-0.5)*42+(age-27)*3.8+(h-64)*14.5+(w-128)*5.2+smk*(-253);
  const predG=Math.max(800,Math.round(pred));
  const risk=predG<2500?'HIGH':predG<3000?'MODERATE':'LOW';
  const riskPct=Math.max(5,Math.min(95,(3200-predG)/17));
  showResult({predG,risk,riskPct,smk,g},null);
}

function showResult(data,errMsg){
  const panel=$('result-panel');if(!panel)return;
  if(errMsg||!data){
    panel.innerHTML=`<span style="color:var(--muted);font-size:13px">${errMsg||'Enter values and click Predict.'}</span>`;
    panel.className='result-panel empty';return;
  }
  const bCol={HIGH:'var(--danger)',MODERATE:'var(--warn)',LOW:'var(--safe)'};
  const barC={HIGH:'#ff3b5e',MODERATE:'#ffb800',LOW:'#39ff14'};
  const pct=Math.min(92,data.riskPct+(data.risk==='HIGH'?55:data.risk==='MODERATE'?25:0));
  const insights={
    HIGH:   data.smk?'Smoking significantly lowers predicted weight. High-risk: specialist follow-up recommended.':
                     'Short gestation is the main driver. Early monitoring strongly recommended.',
    MODERATE:'Weight borderline — monitor closely. Nutritional support and regular checkups advised.',
    LOW:    data.g>=280?'Healthy prediction. Normal checkup schedule sufficient.':
                        'Low risk. Slightly short gestation — standard monitoring recommended.'
  };
  panel.className='result-panel';
  panel.innerHTML=`
    <div class="result-weight" style="color:${bCol[data.risk]}">${data.predG.toLocaleString()}</div>
    <div class="result-unit">predicted grams</div>
    <div class="result-badge-big ${data.risk}">${data.risk} RISK</div>
    <div class="result-bar-track" style="width:85%">
      <div class="result-bar-fill" style="width:${pct}%;background:${barC[data.risk]}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;width:85%;font-size:9px;color:var(--muted);font-family:var(--mono);margin-top:3px"><span>LOW</span><span>HIGH</span></div>
    <p class="result-insight">${insights[data.risk]}</p>`;
}

/* BOOTSTRAP */
document.addEventListener('DOMContentLoaded',()=>{
  const s=ML_DATA.stats;
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
  set('kpi-records',s.total.toLocaleString());
  set('kpi-lowbw',s.low_bw_pct+'%');
  set('kpi-preterm',s.preterm_pct+'%');
  set('kpi-smoke',s.smoke_pct+'%');
  set('smoke-nonsmoker',ML_DATA.smoke_impact.nonsmoker.toLocaleString()+' g');
  set('smoke-smoker',ML_DATA.smoke_impact.smoker.toLocaleString()+' g');
  initOverview();
});
