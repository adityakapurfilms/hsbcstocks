/* ===================================================================
   HSBC Stocks
   -------------------------------------------------------------------
   Two screens: the holdings list, and a stats page per stock.
   Data comes from the published HSBC tab of the Google Sheet.

   TO CHANGE THE SHEET      → edit CSV_URL below
   TO ADD A HOLDING'S LINK  → add one line to TICKERTAPE below
   Nothing else needs editing.
=================================================================== */

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRvXY68p0EaoruUm5W6BkMMZTwuCNcVCxHcd2lBw7tvW1DNGMPuynD_4VD2KQCMeRLT7DWIwh6N7Ob2/pub?gid=1201324330&single=true&output=csv";

const TICKERTAPE = {
  NATIONALUM: "https://www.tickertape.in/stocks/national-aluminium-co-NALU",
  COALINDIA:  "https://www.tickertape.in/stocks/coal-india-COAL",
  LT:         "https://www.tickertape.in/stocks/larsen-and-toubro-LART",
  IRCTC:      "https://www.tickertape.in/stocks/indian-railway-catering-and-tourism-corporation-INIR",
  GOLDCASE:   "https://www.tickertape.in/etfs/zerodha-gold-etf-GOLDA",
};

/* Shown only on a first-ever launch with no connection. Replaced the
   moment a real fetch or upload succeeds. */
const SEED = `#,Stock,Company Name,Quantity,LTP,Value,Daily Change,Monthly Change ,Yearly Change ,Difference,Tickertape,Notes
34,NSE:NATIONALUM,National Aluminium Co Ltd,"5,302.00",343.7,"₹1,822,297.40",1.27%,-8.59%,76.27%,#REF!,NALCO,
11,NSE:COALINDIA,Coal India Ltd,"3,450.00",429.4,"₹1,481,430.00",0.41%,-4.85%,11.01%,#REF!,COAL INDIA,
10,NSE:IRCTC,Indian Railway Ctrng nd Trsm Corp Ltd,750.00,505,"₹378,750.00",-0.39%,-2.81%,-34.45%,#REF!,IRCTC,
9,NSE:LT,Larsen and Toubro Ltd,200.00,3842.3,"₹768,460.00",0.73%,-8.72%,9.69%,#REF!,L&T,
26,NSE:Goldcase,Zerodha Gold ETF,"12,285.00",22.22,"₹272,972.70",0.91%,-2.42%,42.34%,#REF!,GOLDCASE,`;

/* --------------------------- CSV parsing --------------------------- */
function splitLine(line){
  const out=[]; let cur="", q=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){ if(q&&line[i+1]==='"'){cur+='"';i++;} else q=!q; }
    else if(c===","&&!q){ out.push(cur); cur=""; }
    else cur+=c;
  }
  out.push(cur); return out;
}

const num = s => {
  const n = parseFloat(String(s??"").replace(/[^0-9.\-]/g,""));
  return Number.isFinite(n) ? n : 0;
};

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
  if(!lines.length) throw new Error("empty");
  const head = splitLine(lines[0]).map(h=>h.trim().toLowerCase());
  const col = n => head.findIndex(h=>h.startsWith(n));
  const I = {
    stock:col("stock"), name:col("company"), qty:col("quantity"),
    ltp:col("ltp"), value:col("value"), day:col("daily"),
    month:col("monthly"), year:col("yearly"), label:col("tickertape"),
  };
  if(I.stock<0 || I.value<0) throw new Error("columns");

  const rows=[];
  for(let i=1;i<lines.length;i++){
    const c = splitLine(lines[i]);
    const raw = (c[I.stock]||"").trim();
    if(!raw) continue;                        // blank spacer + TOTAL row
    const ticker = raw.replace(/^NSE:/i,"").toUpperCase();
    rows.push({
      ticker,
      name : (c[I.name] ||"").trim(),
      label: (c[I.label]||"").trim() || ticker,
      qty  : num(c[I.qty]),
      ltp  : num(c[I.ltp]),
      value: num(c[I.value]),
      day  : num(c[I.day]),
      month: num(c[I.month]),
      year : num(c[I.year]),
      url  : TICKERTAPE[ticker] || null,
    });
  }
  if(!rows.length) throw new Error("no rows");
  return rows.sort((a,b)=>b.value-a.value);   // highest value first
}

/* ---------------------------- formatting --------------------------- */
const inr = (n,dp=0) => n.toLocaleString("en-IN",{minimumFractionDigits:dp,maximumFractionDigits:dp});
const compact = n => {
  const a=Math.abs(n);
  if(a>=1e7) return (n/1e7).toFixed(2)+" Cr";
  if(a>=1e5) return (n/1e5).toFixed(2)+" L";
  return inr(n);
};
const pct  = n => (n>0?"+":"")+n.toFixed(2)+"%";
const bare = n => (n>0?"+":"")+n.toFixed(1);
const cls  = n => n>=0 ? "up" : "down";

/* ------------------------------ state ------------------------------ */
const S = { rows: parseCSV(SEED), stamp:null, live:false, open:null };
const $ = s => document.querySelector(s);

/* ----------------------------- storage ----------------------------- */
function save(){
  try{
    localStorage.setItem("portfolio", JSON.stringify({rows:S.rows, at:Date.now()}));
  }catch(e){}
}
function restore(){
  try{
    const d = JSON.parse(localStorage.getItem("portfolio")||"null");
    if(d && d.rows && d.rows.length){ S.rows = d.rows; S.stamp = new Date(d.at); }
  }catch(e){}
}

/* ----------------------------- loading ----------------------------- */
let busy = false;

async function refresh(){
  if(busy) return;
  busy = true;
  document.body.classList.add("refreshing");
  const started = Date.now();
  let ok = false, msg = "";

  try{
    const res = await fetch(CSV_URL + "&_=" + Date.now(), {cache:"no-store"});
    if(!res.ok) throw new Error(res.status);
    S.rows  = parseCSV(await res.text());
    S.stamp = new Date();
    S.live  = true;
    save();
    ok = true;
    msg = "Updated.";
  }catch(e){
    S.live = false;
    msg = "Couldn't reach the Sheet. Showing your last saved figures.";
  }

  // let the spinner turn long enough to register as a refresh
  const wait = Math.max(0, 550 - (Date.now() - started));
  setTimeout(()=>{
    document.body.classList.remove("refreshing");
    render();
    say(msg, ok ? "good" : "bad");
    busy = false;
  }, wait);
}

async function loadFile(file){
  try{
    S.rows  = parseCSV(await file.text());
    S.stamp = new Date();
    S.live  = true;
    save(); render();
    say("Loaded "+S.rows.length+" holdings from "+file.name+".", "good");
  }catch(e){
    say("That file didn't have the expected columns. Export the HSBC tab as CSV and try again.", "bad");
  }
}

function say(msg, kind){
  const el = $("#status");
  if(!el) return;
  el.textContent = msg || "";
  el.className = "status" + (kind ? " "+kind : "");
}

/* ------------------------------ render ----------------------------- */
function totals(){
  const total = S.rows.reduce((s,r)=>s+r.value,0);
  const abs   = S.rows.reduce((s,r)=>s+r.value*r.day/100,0);
  return {total, abs, pc: total ? abs/(total-abs)*100 : 0};
}

function render(){
  const t = totals();

  $("#total").textContent = "₹"+inr(t.total,2);

  const chip = $("#daychip");
  chip.className = "chip "+cls(t.abs);
  chip.style.background = t.abs>=0 ? "var(--up-bg)" : "var(--down-bg)";
  chip.innerHTML = `<span>${t.abs>=0?"▲":"▼"}</span><span>₹${inr(Math.abs(t.abs),0)}</span>
                    <span style="opacity:.45">·</span><span>${pct(t.pc)}</span>
                    <span class="lbl">today</span>`;

  $("#count").textContent = "Holdings · "+S.rows.length;

  // only surfaces when a refresh actually failed, so stale numbers
  // are never mistaken for live ones
  const stale = $("#stale");
  if(S.live || !S.stamp){
    stale.hidden = true;
  }else{
    stale.hidden = false;
    stale.textContent = "Offline — last updated " +
      S.stamp.toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
  }

  $("#rows").innerHTML = S.rows.map((r,i)=>`
    <div class="row" data-i="${i}">
      <div class="badge">${r.label.replace(/[^A-Za-z]/g,"").slice(0,2).toUpperCase()}</div>
      <div class="rmain">
        <div class="rname">${r.label}</div>
        <div class="rsub">₹${compact(r.value)} · ${inr(r.qty)} qty</div>
      </div>
      <div class="cols">
        <span class="${cls(r.day)}">${bare(r.day)}</span>
        <span class="${cls(r.month)}">${bare(r.month)}</span>
        <span class="${cls(r.year)}">${bare(r.year)}</span>
      </div>
    </div>`).join("");
}

function renderDetail(r){
  const share = totals().total ? r.value/totals().total*100 : 0;
  const periods = [["1D",r.day],["1M",r.month],["1Y",r.year]];

  $("#detail-body").innerHTML = `
    <div class="dhead">
      <div class="dtick">NSE: ${r.ticker}</div>
      <div class="dname">${r.name || r.label}</div>
      <div class="dltp">₹${inr(r.ltp,2)}</div>
      <div class="chip ${cls(r.day)}" style="background:${r.day>=0?"var(--up-bg)":"var(--down-bg)"}">
        <span>${r.day>=0?"▲":"▼"}</span><span>${pct(r.day)}</span><span class="lbl">today</span>
      </div>
    </div>

    <div class="card">
      <h3>Performance</h3>
      <div class="grid3">
        ${periods.map(([k,v])=>
          `<div><div class="k">${k}</div><div class="v ${cls(v)}">${pct(v)}</div></div>`).join("")}
      </div>
    </div>

    <div class="card">
      <h3>Your position</h3>
      <div class="kv"><span class="k">Quantity</span><span class="v">${inr(r.qty)}</span></div>
      <div class="kv"><span class="k">Last traded price</span><span class="v">₹${inr(r.ltp,2)}</span></div>
      <div class="kv"><span class="k">Current value</span><span class="v">₹${inr(r.value,2)}</span></div>
      <div class="kv"><span class="k">Change today</span><span class="v ${cls(r.day)}">₹${inr(r.value*r.day/100,0)}</span></div>
      <div class="kv"><span class="k">Share of portfolio</span><span class="v">${share.toFixed(1)}%</span></div>
    </div>

    ${r.url ? `<a class="cta" href="${r.url}" target="_blank" rel="noreferrer">Open on Tickertape</a>` : ""}
  `;
}

/* -------------------------- pull to refresh ------------------------- */
(function(){
  const list = $("#list"), ptr = $("#ptr");
  let y0 = null, pull = 0;
  const T = 70;

  list.addEventListener("touchstart", e=>{
    if(list.scrollTop<=0 && !busy) y0 = e.touches[0].clientY;
  }, {passive:true});

  list.addEventListener("touchmove", e=>{
    if(y0===null) return;
    const d = e.touches[0].clientY - y0;
    if(d>0){
      pull = Math.min(d*0.5, 100);
      list.style.transform = `translateY(${pull}px)`;
      ptr.style.opacity = Math.min(pull/T, 1);
      ptr.style.transform = `translateY(${pull*0.5}px) rotate(${pull*3}deg)`;
    }
  }, {passive:true});

  list.addEventListener("touchend", ()=>{
    if(y0===null) return;
    list.style.transition = "transform .32s cubic-bezier(.32,.72,0,1)";
    list.style.transform = "";
    ptr.style.transform = ""; ptr.style.opacity = "";
    setTimeout(()=>list.style.transition = "", 340);
    if(pull >= T) refresh();
    y0 = null; pull = 0;
  });
})();

/* ------------------------------ wiring ------------------------------ */
$("#rows").addEventListener("click", e=>{
  const row = e.target.closest(".row");
  if(!row) return;
  S.open = S.rows[+row.dataset.i];
  renderDetail(S.open);
  $("#detail").scrollTop = 0;
  document.body.classList.add("on-detail");
  history.pushState({detail:1}, "");
});

$("#back").addEventListener("click", ()=>history.back());
window.addEventListener("popstate", ()=>document.body.classList.remove("on-detail"));

const openSheet  = ()=>{ $("#scrim").hidden=false; $("#sheet").hidden=false; say(""); };
const closeSheet = ()=>{ $("#scrim").hidden=true;  $("#sheet").hidden=true;  };
$("#settings-btn").addEventListener("click", openSheet);
$("#close-sheet").addEventListener("click", closeSheet);
$("#scrim").addEventListener("click", closeSheet);

$("#refresh-btn").addEventListener("click", refresh);
$("#upload-btn").addEventListener("click", ()=>$("#file").click());
$("#file").addEventListener("change", e=>{
  const f = e.target.files[0];
  if(f) loadFile(f);
  e.target.value = "";
});

// top up when the app returns to the foreground
document.addEventListener("visibilitychange", ()=>{
  if(!document.hidden && S.stamp && Date.now()-S.stamp.getTime() > 60000) refresh();
});

/* ------------------------------- boot ------------------------------- */
restore();
render();
refresh();

if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
