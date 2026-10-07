let SOURCE = [];
let KEY='spark2027_exec_db';
const EVENT='2027-01-15';
const STATUSES=['Completed','On Plan','Not Started','Due Soon','Slightly Delayed','Delayed','No Due Date'];
const COLOR={'Completed':'#4472C4','On Plan':'#2563EB','Not Started':'#94A3B8','Due Soon':'#F59E0B','Slightly Delayed':'#ED7D31','Delayed':'#C00000','No Due Date':'#6B7280'};
const WEIGHT={'Completed':100,'On Plan':100,'Not Started':80,'Due Soon':75,'No Due Date':60,'Slightly Delayed':50,'Delayed':20};
const WS=[
 {code:'99',key:'99PMO Tasks',name:'PMO'},
 {code:'01',key:'01Seminar',name:'Seminar'},
 {code:'02',key:'02Exhibition',name:'Exhibition'},
 {code:'06',key:'06Spark Sense',name:'Spark Sense'},
 {code:'07',key:'07Activity',name:'Activity'},
 {code:'08',key:'08Spark Hack',name:'Spark Hack'},
 {code:'09',key:'09On_event',name:'On Event'},
 {code:'03',key:'03Media and PR',name:'PR'},
 {code:'04',key:'04Website',name:'Website / Platform'},
 {code:'05',key:'05Regis. & Guest',name:'Registration & Guest'}
];
const IMP_KEY='spark2027_import_src_v1';
let EMBED_META={file:'',exported:'',tasks:0};
function importedSrc(){try{const s=localStorage.getItem(IMP_KEY);return s?JSON.parse(s):null}catch(e){return null}}
function clone(){const im=importedSrc();return JSON.parse(JSON.stringify(im?im.tasks:SOURCE))}
let db=[];
function initDb(){try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):clone()}catch(e){return clone()}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}

function today(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function pd(v){if(!v)return null;const a=String(v).split('-').map(Number);return a.length===3&&a[0]?new Date(a[0],a[1]-1,a[2]):null}
function fmt(v){const d=pd(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function compute(){
  const T=today();
  db.forEach(t=>{
    const d=pd(t.due);
    t.days = d ? Math.round((d-T)/86400000) : '';
    t.dueGroup = t.days===''?'No Due Date':t.days<0?'Overdue':t.days<=14?'0–14 days':t.days<=45?'15–45 days':'Later';
    const p=String(t.planner||'').toLowerCase();
    if(t.manual){t.status=t.manual}
    else if(p==='completed'){t.status='Completed'}
    else if(!d){t.status='No Due Date'}
    else if(t.days<-7){t.status='Delayed'}
    else if(t.days<0){t.status='Slightly Delayed'}
    else if(t.days<=14){t.status='Due Soon'}
    else if(p.indexOf('progress')>=0){t.status='On Plan'}
    else {t.status='Not Started'}
    t.color=COLOR[t.status]||'#64748b';
  });
}
function sortByCode(a){
  return a.slice().sort((x,y)=>{
    const nx=String(x.name||'').trim(), ny=String(y.name||'').trim();
    const cx=(nx.match(/^\d+/)||[''])[0], cy=(ny.match(/^\d+/)||[''])[0];
    if(cx&&cy){
      if(cx.length!==cy.length)return cx.length-cy.length;
      if(cx!==cy)return cx<cy?-1:1;
      return nx.localeCompare(ny,'th');
    }
    if(cx&&!cy)return -1;
    if(!cx&&cy)return 1;
    return nx.localeCompare(ny,'th');
  });
}
const of=k=>sortByCode(db.filter(t=>t.ws===k));
const cnt=(a,s)=>a.filter(t=>t.status===s).length;
function agg(a){return{total:a.length,completed:cnt(a,'Completed'),delayed:cnt(a,'Delayed'),due:cnt(a,'Due Soon'),slip:cnt(a,'Slightly Delayed'),noDue:cnt(a,'No Due Date')}}
function score(a){return a.length?Math.round(a.reduce((s,t)=>s+(WEIGHT[t.status]||60),0)/a.length):0}
function cls(a){const s=score(a);
  if(a.some(t=>t.status==='Delayed')||s<60)return['At Risk | มีงานล่าช้า ต้องเร่งรัด','#ED7D31'];
  if(a.some(t=>t.status==='Due Soon'||t.status==='Slightly Delayed')||s<80)return['Watch | ควรติดตาม','#EAB308'];
  return['Healthy | เป็นไปตามแผน','#70AD47'];}

function arcPath(cx,cy,r,a0,a1){
  const rad=a=>(a+180)*Math.PI/180;
  const x0=cx+r*Math.cos(rad(a0)),y0=cy+r*Math.sin(rad(a0));
  const x1=cx+r*Math.cos(rad(a1)),y1=cy+r*Math.sin(rad(a1));
  const large=(a1-a0)>180?1:0;
  return 'M '+x0.toFixed(2)+' '+y0.toFixed(2)+' A '+r+' '+r+' 0 '+large+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2);
}
function gaugeSVG(s){
  const v=Math.max(0,Math.min(100,Number(s)||0));
  const deg=-90+v*1.8;
  const col=v<60?'#C00000':v<80?'#D97706':'#70AD47';
  const zones=[[0,60,'#F3C0C0'],[60,80,'#FCE3B4'],[80,100,'#C7E3B4']];
  let svg='<svg viewBox="0 0 100 62" class="gsvg">';
  svg+='<path d="'+arcPath(50,50,34,0,180)+'" fill="none" stroke="#eef2f7" stroke-width="13" stroke-linecap="round"/>';
  zones.forEach(z=>{svg+='<path d="'+arcPath(50,50,34,z[0]*1.8,z[1]*1.8)+'" fill="none" stroke="'+z[2]+'" stroke-width="13"/>'});
  svg+='<path d="'+arcPath(50,50,34,0,Math.max(0.6,v*1.8))+'" fill="none" stroke="'+col+'" stroke-width="5" stroke-linecap="round"/>';
  for(let m=0;m<=100;m+=20){
    const a=(m*1.8+180)*Math.PI/180;
    svg+='<line x1="'+(50+27*Math.cos(a)).toFixed(2)+'" y1="'+(50+27*Math.sin(a)).toFixed(2)+'" x2="'+(50+23*Math.cos(a)).toFixed(2)+'" y2="'+(50+23*Math.sin(a)).toFixed(2)+'" stroke="#94a3b8" stroke-width="1"/>';
  }
  svg+='<text x="8" y="60" font-size="6.5" fill="#64748b">0</text><text x="46" y="9" font-size="6.5" fill="#94a3b8">50</text><text x="82" y="60" font-size="6.5" fill="#64748b">100</text>';
  svg+='<g class="needle" data-target="'+deg.toFixed(2)+'" style="transform:rotate(-90deg);transform-origin:50px 50px;transition:transform 1.1s cubic-bezier(.22,1.2,.36,1)">'
     +'<line x1="50" y1="50" x2="50" y2="20" stroke="#334155" stroke-width="2.4" stroke-linecap="round"/>'
     +'<circle cx="50" cy="50" r="4.4" fill="#334155"/><circle cx="50" cy="50" r="1.8" fill="#fff"/></g>';
  svg+='</svg>';
  return svg;
}
function animateNeedles(){
  requestAnimationFrame(()=>{
    document.querySelectorAll('.needle').forEach(n=>{
      const d=n.getAttribute('data-target');
      n.style.transform='rotate('+d+'deg)';
    });
  });
}

function cardHTML(w,extra){
  const a=of(w.key),z=agg(a),s=score(a),c=cls(a);
  const m=[['Total',z.total,'','#1F4E79'],['Completed',z.completed,'Completed','#4472C4'],['Due Soon',z.due,'Due Soon','#F59E0B'],['Slight Delay',z.slip,'Slightly Delayed','#ED7D31'],['Delayed',z.delayed,'Delayed','#C00000']];
  return '<article class="card '+(extra||'')+'">'
   +'<div class="chead"><span class="code">'+w.code+'</span><span class="cname" title="'+esc(w.name)+'">'+esc(w.name)+'</span>'
   +'<button class="cdet" onclick="openDetail(\''+esc(w.key)+'\',\'\')">Task detail</button></div>'
   +'<div class="gaugerow"><div class="gauge">'+gaugeSVG(s)+'</div><div class="score"><b style="color:'+(s<60?'#C00000':s<80?'#D97706':'#1F4E79')+'">'+s+'</b><small>HEALTH SCORE</small></div></div>'
   +'<div class="state" style="background:'+c[1]+'">'+c[0]+'</div>'
   +'<div class="metrics">'+m.map(x=>'<button class="metric" style="--c:'+x[3]+'" onclick="openDetail(\''+esc(w.key)+'\',\''+x[2]+'\')"><b>'+x[1]+'</b>'+x[0]+'</button>').join('')+'</div>'
   +'</article>';
}
const byKey=k=>WS.find(w=>w.key===k);

function renderKPI(){
  const z=agg(db),s=score(db);
  const k=[['TOTAL TASKS',z.total,'#1F4E79',''],['PORTFOLIO HEALTH',s,'#2563EB',''],['COMPLETED',z.completed,'#4472C4','Completed'],['DUE SOON',z.due,'#F59E0B','Due Soon'],['SLIGHTLY DELAYED',z.slip,'#ED7D31','Slightly Delayed'],['DELAYED',z.delayed,'#C00000','Delayed']];
  document.getElementById('kpis').innerHTML=k.map(x=>'<button class="kpi" style="--c:'+x[2]+'" onclick="openDetail(\'\',\''+x[3]+'\')"><p>'+x[0]+'</p><b>'+x[1]+'</b></button>').join('');
}
function renderDash(){
  document.getElementById('snapDate').textContent=today().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  renderKPI();
  document.getElementById('groups').innerHTML=
  '<section class="panel pmo"><div class="ptitle">PMO</div><div class="band">PROJECT MANAGEMENT OFFICE</div><div class="cards">'+cardHTML(byKey('99PMO Tasks'))+'</div>'
  +'<div class="legend"><b>STATUS LEGEND</b><br>'
  +'<span style="color:#70AD47">●</span> Healthy · เป็นไปตามแผน<br>'
  +'<span style="color:#EAB308">●</span> Watch · ควรติดตาม<br>'
  +'<span style="color:#ED7D31">●</span> At Risk · มีงานล่าช้า ต้องเร่งรัด<hr>'
  +'<b>Health Score formula</b><br>คะแนน Workstream = ค่าเฉลี่ยคะแนนสถานะของทุก Task<br>'
  +'Completed / On Plan = 100 · Not Started = 80 · Due Soon = 75<br>No Due Date = 60 · Slightly Delayed = 50 · Delayed = 20<hr>'
  +'<b>Classification</b><br><span style="color:#ED7D31">●</span> <b>At Risk</b> — มี Delayed อย่างน้อย 1 งาน <i>หรือ</i> Score &lt; 60<br><span style="color:#EAB308">●</span> <b>Watch</b> — มี Due Soon / Slightly Delayed <i>หรือ</i> Score 60–79<br><span style="color:#70AD47">●</span> <b>Healthy</b> — ไม่มี Delayed, ไม่มี Due Soon และ Score ≥ 80<hr><b>หมายเหตุ</b><br>Score 80 = ระดับเดียวกับงาน Not Started ที่ยังไม่ถึงกำหนด จึงถือว่ายังเป็นไปตามแผน</div></section>'
  +'<section class="panel core"><div class="ptitle">CORE WORKSTREAM</div><div class="band">EVENT DELIVERY &amp; CONTENT</div><div class="cards">'
   +cardHTML(byKey('01Seminar'),'s')+cardHTML(byKey('02Exhibition'),'e')
   +'<div class="sub"><h4>SPECIAL ACTIVITIES</h4><div class="subcards">'+cardHTML(byKey('06Spark Sense'))+cardHTML(byKey('07Activity'))+cardHTML(byKey('08Spark Hack'))+'</div></div>'
   +'<div class="sub ev"><h4>VENUE, LOGISTICS &amp; CATERING</h4><div class="subcards">'+cardHTML(byKey('09On_event'))+'</div></div>'
  +'</div></section>'
  +'<section class="panel enab"><div class="ptitle">ENABLER</div><div class="band">PR &amp; HOST ENABLEMENT</div><div class="cards">'
   +cardHTML(byKey('03Media and PR'))
   +'<div class="sub ev" style="grid-area:auto"><h4>HOST</h4><div class="subcards" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+cardHTML(byKey('04Website'))+cardHTML(byKey('05Regis. & Guest'))+'</div></div>'
  +'</div></section>';
  renderCritical(); renderDQ(); animateNeedles();
  if(document.getElementById("bgauge").classList.contains("on"))renderBG();
}
function renderCritical(){
  const rows=db.filter(t=>['Delayed','Slightly Delayed','Due Soon'].indexOf(t.status)>=0||t.exec)
   .sort((a,b)=>{const ia=WS.findIndex(w=>w.key===a.ws),ib=WS.findIndex(w=>w.key===b.ws);return ia!==ib?ia-ib:(a.due||'9999').localeCompare(b.due||'9999')});
  document.getElementById('critRows').innerHTML = rows.length? rows.map(t=>
   '<tr onclick="openDetail(\''+esc(t.ws)+'\',\''+t.status+'\')" style="cursor:pointer"><td>'+esc(wsLabel(t.ws))+'</td><td>'+esc(t.name)+'</td>'
   +'<td><span class="badge" style="background:'+t.color+'">'+t.status+'</span></td><td>'+esc(t.owner||'ต้องตรวจสอบ')+'</td><td>'+fmt(t.due)+'</td><td>'+(t.days===''?'—':t.days)+'</td>'
   +'<td>'+esc(t.next||t.delay||t.exec||'ต้องตรวจสอบ')+'</td></tr>').join('') : '<tr><td colspan="7">ไม่มีงานวิกฤตในขณะนี้</td></tr>';
}
function renderDQ(){
  const map=new Map();
  const add=(t,msg)=>{const k=t.name+'||'+msg;if(!map.has(k))map.set(k,{name:t.name,ws:t.ws,owner:t.owner,msg:msg})};
  db.forEach(t=>{
    if(!t.owner)add(t,'ไม่มี Owner');
    if(!t.due)add(t,'ไม่มี Due Date');
    if(t.start&&t.due&&t.due<t.start)add(t,'Due Date ก่อน Start Date');
    if(t.status==='Completed'&&!t.done)add(t,'Completed แต่ไม่มี Completed Date');
    if(t.status==='Delayed'&&!t.delay)add(t,'Delayed แต่ไม่มี Delay Detail');
    if(t.status==='Delayed'&&!t.next&&!t.recovery)add(t,'Delayed แต่ไม่มี Next Step / Recovery Action');
  });
  const issues=[...map.values()];
  const btn=document.getElementById('dqBtn');
  if(btn)btn.textContent=(document.getElementById('dq').style.display==='none'?'แสดง':'ซ่อน')+' Data Quality Warning ('+issues.length+')';
  document.getElementById('dq').innerHTML='<h2>Data Quality Warning</h2>'
   +(issues.length?'<div class="tblwrap" style="max-height:38vh"><table><thead><tr><th>Task</th><th>Workstream</th><th>Owner</th><th>สิ่งที่ต้องแก้ไข</th></tr></thead><tbody>'
     +issues.map(x=>'<tr style="cursor:pointer" onclick="openDetail(\''+esc(x.ws)+'\',\'\')"><td>'+esc(x.name)+'</td><td>'+esc(x.ws)+'</td><td>'+esc(x.owner||'ต้องตรวจสอบ')+'</td><td class="warn">'+esc(x.msg)+'</td></tr>').join('')
     +'</tbody></table></div>'
    :'<p style="font-size:12px;color:#15803d;margin:0">ข้อมูลครบถ้วน ไม่มีรายการที่ต้องแก้ไข</p>');
}

function toggleDQ(){const d=document.getElementById("dq");d.style.display=(d.style.display==="none")?"block":"none";renderDQ()}
function go(id){
  ['dash','ana','gantt','detail','bgauge','timeline'].forEach(x=>{const el=document.getElementById(x);el.classList.toggle('on',x===id);const n=document.getElementById('nav-'+x);if(n)n.classList.toggle('on',x===id)});
  if(id==='ana')renderAna(); if(id==='gantt')renderGantt(); if(id==='detail')renderDetail(); if(id==='bgauge')renderBG(); if(id==='timeline')renderTimeline();
  window.scrollTo(0,0);
}
function openDetail(ws,st,bk){
  buildFilters();
  ['fq','fp','fo','fd','fb'].forEach(function(i){var e=document.getElementById(i);if(e)e.value=''});
  document.getElementById('fw').value=ws||'';
  document.getElementById('fs').value=st||'';
  var fb=document.getElementById('fb'); if(fb&&bk)fb.value=bk;
  dqClosed={};dqInit=true;dqExpand=true;
  go('detail');
}
function clearFilters(){['fq','fs','fw','fp','fo','fd','fb'].forEach(i=>{const e=document.getElementById(i);if(e)e.value=''});dqClosed={};dqInit=false;renderDetail()}
function buildFilters(){
  const set=(id,opts,first)=>{const el=document.getElementById(id);const v=el.value;el.innerHTML='<option value="">'+first+'</option>'+opts.map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('');el.value=v};
  set('fs',STATUSES.map(s=>[s,s]).concat([['DueSlip','Due / Slip']]),'All Business Status');
  set('fw',WS.map(w=>[w.key,w.code+' '+w.name]),'All Workstreams');
  set('fp',[...new Set(db.map(t=>t.priority).filter(Boolean))].map(p=>[p,p]),'All Priority');
  set('fo',[...new Set(db.flatMap(t=>String(t.owner||'').split(';')).map(x=>x.trim()).filter(Boolean))].sort().map(o=>[o,o]),'All Owners');
  set('fd',['Overdue','0–14 days','15–45 days','Later','No Due Date'].map(d=>[d,d]),'All Due Groups');
  set('fb',[...new Set(db.map(t=>bucketLabel(t.srcBucket)))].sort((x,y)=>x.localeCompare(y,'th')).map(b=>[b,b]),'All Buckets');
}
function filtered(){
  const q=document.getElementById('fq').value.toLowerCase(),s=document.getElementById('fs').value,w=document.getElementById('fw').value,
        p=document.getElementById('fp').value,o=document.getElementById('fo').value,d=document.getElementById('fd').value,
        bk=(document.getElementById('fb')||{}).value||'';
  return db.filter(t=>{
    if(q&&JSON.stringify(t).toLowerCase().indexOf(q)<0)return false;
    if(w&&t.ws!==w)return false;
    if(bk&&bucketLabel(t.srcBucket)!==bk)return false;
    if(s){ if(s==='DueSlip'){if(t.status!=='Due Soon'&&t.status!=='Slightly Delayed')return false}else if(t.status!==s)return false }
    if(p&&t.priority!==p)return false;
    if(o&&String(t.owner||'').split(';').map(x=>x.trim()).indexOf(o)<0)return false;
    if(d&&t.dueGroup!==d)return false;
    return true;
  });
}
let dqClosed={},dqInit=false,dqExpand=false;
function toggleBGroup(k,row){
  dqClosed[k]=!dqClosed[k];
  row.classList.toggle('closed',dqClosed[k]);
  document.querySelectorAll('tr.trow.g_'+k).forEach(r=>r.classList.toggle('hide',dqClosed[k]));
}
function allGroups(open){
  document.querySelectorAll('#detail tr.bgroup').forEach(r=>{
    const k=r.dataset.k; dqClosed[k]=!open;
    r.classList.toggle('closed',!open);
    document.querySelectorAll('tr.trow.g_'+k).forEach(x=>x.classList.toggle('hide',!open));
  });
}
function renderDetail(){
  const rows=filtered(), z=agg(rows);
  document.getElementById('detailSums').innerHTML=[['Selected',z.total,'#1F4E79'],['Completed',z.completed,'#4472C4'],['No Due Date',z.noDue,'#6B7280'],['Due Soon',z.due,'#F59E0B'],['Slightly Delayed',z.slip,'#ED7D31'],['Delayed',z.delayed,'#C00000']]
    .map(x=>'<div class="sum" style="--c:'+x[2]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  const groups={};
  rows.forEach(t=>{const k=(t.ws||'')+'||'+bucketLabel(t.srcBucket);(groups[k]=groups[k]||[]).push(t)});
  const keys=Object.keys(groups).sort((a,b)=>a.localeCompare(b,'th'));
  if(dqExpand){keys.forEach((k,idx)=>{dqClosed['k'+idx]=false});dqExpand=false;dqInit=true}
  else if(!dqInit){keys.forEach((k,idx)=>{dqClosed['k'+idx]=true});dqInit=true}
  let html='';
  keys.forEach((k,idx)=>{
    const list=sortByCode(groups[k]), zb=agg(list), w=WS.find(x=>x.key===list[0].ws);
    const gid='k'+idx, closed=dqClosed[gid]!==false;
    html+='<tr class="bgroup'+(closed?' closed':'')+'" data-k="'+gid+'" onclick="toggleBGroup(\''+gid+'\',this)"><td colspan="12">'
      +'<div class="bgrow"><span class="bcar">▾</span>'
      +'<span class="bws">'+esc(w?w.code+' '+w.name:list[0].ws)+'</span>'
      +'<span class="bname">'+esc(bucketLabel(list[0].srcBucket))+'</span>'
      +'<span class="bstat">'
      +'<span class="bchip">Total '+zb.total+'</span>'
      +'<span class="bchip done">Completed '+zb.completed+'</span>'
      +(zb.due?'<span class="bchip soon">Due Soon '+zb.due+'</span>':'')
      +(zb.delayed?'<span class="bchip late">Delayed '+zb.delayed+'</span>':'')
      +'<span class="bchip">Health '+score(list)+'</span>'
      +'</span></div></td></tr>';
    html+=list.map(t=>
      '<tr class="trow g_'+gid+(closed?' hide':'')+'"><td>'+esc((t.id||'').slice(0,6))+'</td>'
     +'<td><b>'+esc(t.name)+'</b><br><small style="color:#64748b">'+esc(t.srcBucket)+'</small></td>'
     +'<td>'+esc(t.owner||'ต้องตรวจสอบ')+'</td><td>'+esc(t.priority)+'</td><td>'+fmt(t.start)+'<br>'+fmt(t.due)+'</td><td>'+(t.days===''?'—':t.days)+'</td>'
     +'<td>'+esc(t.planner)+'</td><td><span class="badge" style="background:'+t.color+'">'+t.status+'</span>'+(t.manual?'<br><small>Manual Override</small>':'')+'</td>'
     +'<td>'+(t.progress===''?'—':t.progress+'%')+'</td>'
     +'<td>'+esc(t.cur||'ต้องตรวจสอบ')+'<br><b>Next:</b> '+esc(t.next||'ต้องตรวจสอบ')+'</td>'
     +'<td>'+esc(t.delay||'—')+' '+esc(t.root)+' '+esc(t.impact)+'<br>'+esc(t.recovery)+' '+esc(t.recDate)+'<br>'+esc(t.exec)+'</td>'
     +'<td>'+esc(t.src)+'</td></tr>').join('');
  });
  document.getElementById('detailRows').innerHTML = html || '<tr><td colspan="12">ไม่พบงานตามเงื่อนไขที่เลือก</td></tr>';
  const gt=document.getElementById('grpCount');
  if(gt)gt.textContent=keys.length+' bucket · '+rows.length+' task';
}
function groupBy(fn){const o={};db.forEach(t=>{const k=fn(t)||'Unassigned';(o[k]=o[k]||{})[t.status]=(o[k][t.status]||0)+1});return o}
function bars(host,obj,filterKey){
  document.getElementById(host).innerHTML=Object.entries(obj)
   .sort((a,b)=>Object.values(b[1]).reduce((x,y)=>x+y,0)-Object.values(a[1]).reduce((x,y)=>x+y,0)).slice(0,18)
   .map(([n,c])=>{const tt=Object.values(c).reduce((x,y)=>x+y,0);
     return '<div class="barrow"><div class="blabel" title="'+esc(n)+'">'+esc(n)+'</div><div class="bar">'
      +STATUSES.filter(s=>c[s]).map(s=>'<div class="seg" style="width:'+(c[s]/tt*100)+'%;background:'+COLOR[s]+'" title="'+s+': '+c[s]+'" onclick="openDetail(\''+(filterKey?esc(n):'')+'\',\''+s+'\')">'+c[s]+'</div>').join('')
      +'</div></div>'}).join('');
}
function renderAna(){
  const counts=STATUSES.map(s=>[s,cnt(db,s)]),tot=db.length||1;let deg=0,parts=[];
  counts.forEach(([s,n])=>{if(!n)return;const d=n/tot*360;parts.push(COLOR[s]+' '+deg+'deg '+(deg+d)+'deg');deg+=d});
  document.getElementById('donut').style.background='conic-gradient('+parts.join(',')+')';
  document.getElementById('donutLg').innerHTML=counts.filter(x=>x[1]).map(([s,n])=>'<button class="badge" style="background:'+COLOR[s]+'" onclick="openDetail(\'\',\''+s+'\')">'+s+' '+n+'</button>').join('');
  bars('wsBars',groupBy(t=>t.ws),true);
  bars('ownBars',groupBy(t=>String(t.owner||'Unassigned').split(';')[0].trim()),false);
  bars('dueBars',groupBy(t=>t.dueGroup),false);
  const del={};db.filter(t=>t.status==='Delayed').forEach(t=>{(del[t.ws]=del[t.ws]||{})['Delayed']=(del[t.ws]['Delayed']||0)+1});
  bars('delBars',del,true);
  const up=db.filter(t=>t.due&&t.days>=0).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,40);
  document.getElementById('anaRows').innerHTML=up.map(t=>'<tr style="cursor:pointer" onclick="openDetail(\''+esc(t.ws)+'\',\''+t.status+'\')"><td>'+fmt(t.due)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.ws)+'</td><td><span class="badge" style="background:'+t.color+'">'+t.status+'</span></td><td>'+esc(t.owner||'ต้องตรวจสอบ')+'</td></tr>').join('')||'<tr><td colspan="5">ไม่มีข้อมูล</td></tr>';
}

function bucketLabel(b){return String(b||'ไม่ระบุ Bucket').trim()}
function renderGantt(){
  const z=agg(db);
  document.getElementById('ganttSums').innerHTML=[['Total',z.total,'#1F4E79'],['Completed',z.completed,'#4472C4'],['Delayed',z.delayed,'#C00000']].map(x=>'<div class="sum" style="--c:'+x[2]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  const all=db.flatMap(t=>[t.start,t.due]).filter(Boolean).concat([EVENT]).sort();
  let s0=pd(all[0])||new Date(2026,0,1), e0=pd(all[all.length-1])||pd(EVENT);
  s0=new Date(s0.getFullYear(),s0.getMonth(),1); e0=new Date(e0.getFullYear(),e0.getMonth()+1,0);
  const span=e0-s0||1, pos=v=>{const d=pd(v);return d?Math.max(0,Math.min(100,(d-s0)/span*100)):null};
  const months=[];for(let d=new Date(s0);d<=e0;d=new Date(d.getFullYear(),d.getMonth()+1,1))months.push(d.toLocaleDateString('en-GB',{month:'short',year:'2-digit'}));
  const tp=pos(today().toISOString().slice(0,10)),ep=pos(EVENT);
  const grid='<div class="months" style="grid-template-columns:repeat('+months.length+',1fr)">'+months.map(m=>'<div>'+m+'</div>').join('')+'</div>';
  const lines=months.map((_,i)=>'<i class="gline" style="left:'+(i/months.length*100)+'%"></i>').join('')
    +'<i class="today" style="left:'+tp+'%"></i><i class="evt" style="left:'+ep+'%"></i>';
  const span2=(a)=>{const ds=a.flatMap(t=>[t.start,t.due]).filter(Boolean).sort();return[ds[0],ds[ds.length-1]]};
  const owners=(a)=>[...new Set(a.flatMap(t=>String(t.owner||'').split(';')).map(x=>x.trim()).filter(Boolean))];
  let html='<div class="ghead"><div>WORKSTREAM / BUCKET / TASK</div><div>OWNER</div><div>'+grid+'</div><div>STATUS</div></div>';
  WS.forEach((w,i)=>{
    const a=of(w.key); if(!a.length)return;
    const [b0,b1]=span2(a), za=agg(a), c=cls(a);
    const buckets=[...new Set(a.map(t=>bucketLabel(t.srcBucket)))].sort((x,y)=>x.localeCompare(y,'th'));
    const ow=owners(a).slice(0,2).join('; ')||'Unassigned';
    html+='<div class="grow parent" onclick="togWs('+i+',this)"><div><span class="ar">▸</span> '+w.code+' '+esc(w.name)
      +'<br><small>'+buckets.length+' buckets · '+za.total+' tasks · '+za.completed+' completed · '+za.delayed+' delayed</small></div>'
      +'<div>'+esc(ow)+'</div><div class="track">'+lines+(b0?'<i class="gbar" style="left:'+pos(b0)+'%;width:'+Math.max(1,pos(b1)-pos(b0))+'%;background:'+c[1]+'"></i>':'')+'</div>'
      +'<div><b>'+score(a)+'</b> health</div></div>';
    buckets.forEach((bk,j)=>{
      const bt=sortByCode(a.filter(t=>bucketLabel(t.srcBucket)===bk));
      const [c0,c1]=span2(bt), zb=agg(bt), cb=cls(bt);
      const bow=owners(bt).slice(0,2).join('; ')||'Unassigned';
      html+='<div class="grow bucket w'+i+' hide" onclick="togBk(\''+i+'_'+j+'\',this,event)">'
        +'<div><span class="ar2">▸</span> '+esc(bk)+'<br><span class="bmeta">'
        +'<span class="gbadge">Total '+zb.total+'</span> <span class="gbadge">Done '+zb.completed+'</span> '
        +'<span class="gbadge'+(zb.delayed?' red':'')+'">Delayed '+zb.delayed+'</span></span></div>'
        +'<div>'+esc(bow)+'</div><div class="track">'+lines+(c0?'<i class="gbar" style="left:'+pos(c0)+'%;width:'+Math.max(1,pos(c1)-pos(c0))+'%;background:'+cb[1]+'"></i>':'')+'</div>'
        +'<div><b>'+score(bt)+'</b> health</div></div>';
      bt.forEach(t=>{
        const st=t.start||t.due, en=t.due||t.start;
        html+='<div class="grow child w'+i+' b'+i+'_'+j+' hide" onclick="openDetail(\''+esc(t.ws)+'\',\''+t.status+'\',\''+esc(bk)+'\')">'
          +'<div>'+esc(t.name)+'</div><div>'+esc(t.owner||'Unassigned')+'</div>'
          +'<div class="track">'+lines+(st?'<i class="gbar" style="left:'+pos(st)+'%;width:'+Math.max(1,pos(en)-pos(st))+'%;background:'+t.color+'"></i>':'')+'</div>'
          +'<div><span class="badge" style="background:'+t.color+'">'+t.status+'</span></div></div>';
      });
    });
  });
  document.getElementById('ganttBoard').innerHTML=html;
}
function togWs(i,row){
  const open=row.querySelector('.ar').textContent==='▾';
  document.querySelectorAll('.w'+i).forEach(x=>{
    if(x.classList.contains('bucket'))x.classList.toggle('hide',open);
    else x.classList.add('hide');
  });
  if(open)document.querySelectorAll('.grow.bucket.w'+i+' .ar2').forEach(a=>a.textContent='▸');
  row.querySelector('.ar').textContent=open?'▸':'▾';
}
function togBk(key,row,e){
  if(e)e.stopPropagation();
  const open=row.querySelector('.ar2').textContent==='▾';
  document.querySelectorAll('.b'+key).forEach(x=>x.classList.toggle('hide',open));
  row.querySelector('.ar2').textContent=open?'▸':'▾';
}
function openEd(){document.getElementById('modal').classList.add('on');edOpen=null;compute();renderEd()}
function closeEd(){document.getElementById('modal').classList.remove('on')}
function buildEdFilters(){
  const set=(id,opts,first)=>{const el=document.getElementById(id);if(!el)return;const v=el.value;el.innerHTML='<option value="">'+first+'</option>'+opts.map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('');el.value=v};
  set('efw',WS.map(w=>[w.key,w.code+' '+w.name]),'ทุก Workstream');
  set('efs',STATUSES.map(x=>[x,x]).concat([['DueSlip','Due / Slip'],['Manual','Manual Override']]),'ทุก Business Status');
  set('efp',['Urgent','Important','Medium','Low'].map(x=>[x,x]),'ทุก Priority');
  set('efo',[...new Set(db.flatMap(t=>String(t.owner||'').split(';')).map(x=>x.trim()).filter(Boolean))].sort().map(x=>[x,x]).concat([['__none__','ไม่มี Owner']]),'ทุก Owner');
  set('efpl',['Not started','In progress','Completed'].map(x=>[x,x]).concat([['__nodue__','ไม่มี Due Date'],['__incomplete__','ข้อมูลไม่ครบ']]),'ทุก Planner Status');
}
function edFiltered(){
  const g=id=>{const el=document.getElementById(id);return el?el.value:''};
  const q=g('efq').toLowerCase(),w=g('efw'),st=g('efs'),pr=g('efp'),ow=g('efo'),pl=g('efpl');
  return db.filter(t=>{
    if(q&&JSON.stringify(t).toLowerCase().indexOf(q)<0)return false;
    if(w&&t.ws!==w)return false;
    if(st){
      if(st==='DueSlip'){if(t.status!=='Due Soon'&&t.status!=='Slightly Delayed')return false}
      else if(st==='Manual'){if(!t.manual)return false}
      else if(t.status!==st)return false;
    }
    if(pr&&t.priority!==pr)return false;
    if(ow){
      const list=String(t.owner||'').split(';').map(x=>x.trim()).filter(Boolean);
      if(ow==='__none__'){if(list.length)return false}
      else if(list.indexOf(ow)<0)return false;
    }
    if(pl){
      if(pl==='__nodue__'){if(t.due)return false}
      else if(pl==='__incomplete__'){if(t.owner&&t.due)return false}
      else if(t.planner!==pl)return false;
    }
    return true;
  });
}
function clearEdFilters(){['efq','efw','efs','efp','efo','efpl'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});renderEd()}
const ICON={
 edit:'<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
 trash:'<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
 chev:'<svg viewBox="0 0 24 24" class="chev"><polyline points="6 9 12 15 18 9"/></svg>'};
let edOpen=null;
function wsLabel(k){const w=WS.find(x=>x.key===k);return w?w.code+' '+w.name:k}
function fldSel(i,key,opts,label,cur){
  return '<div class="fld"><label>'+label+'</label><select onchange="sv('+i+',\''+key+'\',this.value)">'
   +opts.map(o=>'<option value="'+esc(o[0])+'"'+(String(cur)===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></div>';
}
function fldTxt(i,key,label,val,type,ph){
  return '<div class="fld"><label>'+label+'</label><input type="'+(type||'text')+'" value="'+esc(val)+'" placeholder="'+esc(ph||'')+'" onchange="sv('+i+',\''+key+'\',this.value)"></div>';
}
function fldArea(i,key,label,val,ph){
  return '<div class="fld"><label>'+label+'</label><textarea placeholder="'+esc(ph||'')+'" onchange="sv('+i+',\''+key+'\',this.value)">'+esc(val)+'</textarea></div>';
}
function edCard(t,i){
  const open=(edOpen===t.id);
  const head='<div class="thead" onclick="edToggle(\''+esc(t.id)+'\')">'
   +'<div class="tmain"><p class="tname" title="'+esc(t.name)+'">'+esc(t.name)+'</p><div class="tmeta">'
   +'<span class="chip ws">'+esc(wsLabel(t.ws))+'</span>'
   +'<span class="chip own">'+esc(t.owner?t.owner.split(';')[0].trim():'ยังไม่ระบุ Owner')+'</span>'
   +'<span class="chip st" style="background:'+t.color+'">'+t.status+'</span>'
   +'<span class="chip due">Due '+fmt(t.due)+'</span>'
   +'</div></div>'
   +'<div class="tacts">'
   +'<span class="pill">'+(t.progress===''?'0':t.progress)+'%</span>'
   +'<button class="iconbtn" title="Edit" onclick="event.stopPropagation();edToggle(\''+esc(t.id)+'\')">'+ICON.edit+'</button>'
   +'<button class="iconbtn del" title="Delete" onclick="event.stopPropagation();delTask('+i+')">'+ICON.trash+'</button>'
   +'<button class="iconbtn" title="Expand" onclick="event.stopPropagation();edToggle(\''+esc(t.id)+'\')">'+ICON.chev+'</button>'
   +'</div></div>';
  if(!open)return '<article class="tcard" data-id="'+esc(t.id)+'">'+head+'</article>';
  const body='<div class="tbody">'
   +'<div class="basics">'
    +'<div class="fld"><label>Task Name</label><input value="'+esc(t.name)+'" onchange="sv('+i+',\'name\',this.value)"></div>'
    +fldSel(i,'ws',WS.map(w=>[w.key,w.code+' '+w.name]),'Workstream',t.ws)
    +fldTxt(i,'owner','Owner',t.owner,'text','ชื่อผู้รับผิดชอบ')
    +fldSel(i,'priority',[['Urgent','Urgent'],['Important','Important'],['Medium','Medium'],['Low','Low']],'Priority',t.priority)
    +fldSel(i,'planner',[['Not started','Not started'],['In progress','In progress'],['Completed','Completed']],'Planner Status',t.planner)
    +fldTxt(i,'start','Start Date',t.start,'date')
    +fldTxt(i,'due','Due Date',t.due,'date')
    +fldSel(i,'manual',[['','Auto (คำนวณจากวันที่)']].concat(STATUSES.map(x=>[x,x])),'Business Status',t.manual)
   +'</div>'
   +'<div class="grid3">'
    +'<div>'+fldArea(i,'cur','Current progress',t.cur,'ความคืบหน้าปัจจุบัน')
      +fldTxt(i,'next','Next step',t.next,'text','ขั้นตอนถัดไป')
      +fldTxt(i,'delay','Delay detail',t.delay,'text','รายละเอียดความล่าช้า')+'</div>'
    +'<div>'+fldArea(i,'notes','Notes',t.notes,'บันทึกเพิ่มเติม')
      +fldTxt(i,'recovery','Recovery action',t.recovery,'text','แผนแก้ไขและเร่งรัด')
      +fldTxt(i,'recDate','Recovery Date',t.recDate,'date')+'</div>'
    +'<div>'+fldTxt(i,'exec','Executive support / Decision required',t.exec,'text','ประเด็นที่ต้องการการตัดสินใจ')
      +fldTxt(i,'progress','Checklist Progress (%)',t.progress,'number')
      +'<div class="btnstack"><button class="bsave" onclick="saveOne('+i+')">Save Changes</button>'
      +'<button class="bdone" onclick="markDone('+i+')">Mark as Complete</button></div></div>'
   +'</div></div>';
  return '<article class="tcard open" data-id="'+esc(t.id)+'">'+head+body+'</article>';
}
function edToggle(id){edOpen=(edOpen===id)?null:id;renderEd();
  setTimeout(()=>{const el=document.querySelector('.tcard.open');if(el)el.scrollIntoView({block:'nearest',behavior:'smooth'})},30)}
function saveOne(i){persist();compute();renderEd();renderDash();toast('บันทึกงาน "'+db[i].name+'" แล้ว')}
function markDone(i){db[i].planner='Completed';db[i].manual='';if(!db[i].done)db[i].done=new Date().toISOString().slice(0,10);
  db[i].progress=100;persist();compute();renderEd();renderDash();toast('ทำเครื่องหมายเสร็จสิ้นแล้ว')}
function renderEd(){
  buildEdFilters();
  const list=sortByCode(edFiltered()).sort((x,y)=>x.ws===y.ws?0:(x.ws<y.ws?-1:1));
  document.getElementById('edCount').textContent='แสดง '+list.length+' จาก '+db.length+' งาน';
  document.getElementById('edCards').innerHTML = list.length
    ? list.map(t=>edCard(t,db.indexOf(t))).join('')
    : '<p class="edempty">ไม่พบงานตามเงื่อนไขที่เลือก</p>';
}
function sv(i,k,v){db[i][k]=v; if(k==='manual'&&v)db[i].src=(db[i].src||'Excel')+' · Manual Override'}
function addTask(){db.unshift({id:'NEW-'+Date.now(),name:'New Task',ws:'99PMO Tasks',srcBucket:'99PMO Tasks',planner:'Not started',priority:'Medium',owner:'',start:'',due:'',done:'',progress:'',notes:'',cur:'',next:'',delay:'',root:'',impact:'',recovery:'',recDate:'',exec:'',manual:'',src:'User entry'});edOpen=db[0].id;renderEd()}
function delTask(i){if(confirm('ลบงานนี้?')){db.splice(i,1);renderEd()}}
function saveEd(){persist();refresh();renderEd();toast('บันทึกข้อมูลแล้ว')}
function resetData(){if(confirm('คืนค่าข้อมูลกลับเป็นข้อมูลต้นทาง?')){localStorage.removeItem(KEY);db=clone();refresh();renderEd();toast('คืนค่าข้อมูลต้นทางแล้ว')}}
function exportCSV(){
  const cols=['id','name','ws','srcBucket','owner','priority','planner','status','manual','start','due','done','days','progress','cur','next','delay','root','impact','recovery','recDate','exec','notes','src'];
  const csv='\ufeff'+[cols.join(',')].concat(db.map(t=>cols.map(c=>'"'+String(t[c]==null?'':t[c]).replace(/"/g,'""')+'"').join(','))).join('\n');
  dl(new Blob([csv],{type:'text/csv;charset=utf-8'}),'SPARK2027_Task_Database.csv');
}
function dl(b,n){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),800)}
function exportPNG(){
  const el=document.querySelector('.screen.on');
  const w=Math.max(el.scrollWidth,1400),h=Math.max(el.scrollHeight,800);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>body{margin:0;background:#eef2f7;font-family:Segoe UI,Tahoma}</style>'+new XMLSerializer().serializeToString(el)+'</div></foreignObject></svg>';
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),img=new Image();
  img.onload=function(){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#eef2f7';x.fillRect(0,0,w,h);x.drawImage(img,0,0);c.toBlob(b=>dl(b,'SPARK2027_'+el.id+'.png'));URL.revokeObjectURL(url)};
  img.onerror=function(){toast('เบราว์เซอร์บล็อกการ export กรุณาใช้ Print to PDF')};
  img.src=url;
}
const TIMELINE_HTML="<!doctype html><html lang=\"th\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}<\/style><title>Excel-linked \u00b7 Spark2027 Timeline<\/title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap\">\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js\"><\/script>\n<style>\n:root{\n  --bg:#F4F6F9; --surface:#FFFFFF; --surface2:#EEF2F7; --ink:#0B2545; --text:#1E293B; --muted:#64748B; --line:#DCE3EC;\n  --ceo:#D62828; --event:#F5C542; --eventbg:rgba(245,197,66,.28);\n  --ok:#15803D; --warn:#C2410C; --bad:#DC2626; --done:#64748B;\n  --g01:#2563EB; --g02:#15803D; --g03:#7E22CE; --g04:#0E7490; --g05:#B45309; --g06:#BE185D; --g07:#475569; --g99:#334155;\n  --shadow:0 1px 2px rgba(11,37,69,.06),0 4px 16px rgba(11,37,69,.05);\n  --font:\"IBM Plex Sans Thai\",Tahoma,\"Leelawadee UI\",sans-serif; --mono:\"IBM Plex Mono\",ui-monospace,Menlo,monospace;\n}\n@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){\n  color-scheme:dark; --bg:#0C1422; --surface:#131E30; --surface2:#1A2740; --ink:#E6EDF7; --text:#D5DEEA; --muted:#8FA0B8; --line:#26354D;\n  --ceo:#F05252; --eventbg:rgba(245,197,66,.16); --ok:#4ADE80; --warn:#FB923C; --bad:#F87171; --done:#8FA0B8;\n  --g01:#60A5FA; --g02:#4ADE80; --g03:#C084FC; --g04:#22D3EE; --g05:#FBBF24; --g06:#F472B6; --g07:#94A3B8; --g99:#A5B4C8;\n  --shadow:none;\n}}\n:root[data-theme=\"dark\"]{\n  color-scheme:dark; --bg:#0C1422; --surface:#131E30; --surface2:#1A2740; --ink:#E6EDF7; --text:#D5DEEA; --muted:#8FA0B8; --line:#26354D;\n  --ceo:#F05252; --eventbg:rgba(245,197,66,.16); --ok:#4ADE80; --warn:#FB923C; --bad:#F87171; --done:#8FA0B8;\n  --g01:#60A5FA; --g02:#4ADE80; --g03:#C084FC; --g04:#22D3EE; --g05:#FBBF24; --g06:#F472B6; --g07:#94A3B8; --g99:#A5B4C8;\n  --shadow:none;\n}\n*{box-sizing:border-box}\nbody{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;line-height:1.5;padding:0 16px;padding-block:20px 48px}\n.wrap{max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:20px}\nh1,h2,h3{color:var(--ink);margin:0;text-wrap:balance;line-height:1.25}\nh1{font-size:26px;font-weight:700}\nh2{font-size:17px;font-weight:700}\n.muted{color:var(--muted)}\n.num{font-variant-numeric:tabular-nums}\n.eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}\nheader.top{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;justify-content:space-between}\n.countdown{display:flex;align-items:baseline;gap:8px}\n.countdown b{font-family:var(--mono);font-size:40px;line-height:1;color:var(--ink)}\n.source{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 10px}\n.seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}\n.seg button{font:inherit;font-size:13px;border:0;background:transparent;color:var(--text);padding:6px 12px;cursor:pointer}\n.seg button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface)}\n.seg button:focus-visible,.btn:focus-visible,.tab:focus-visible{outline:2px solid var(--g01);outline-offset:2px}\n.btn{font:inherit;font-size:13px;border:1px dashed var(--muted);background:transparent;color:var(--text);padding:6px 12px;border-radius:8px;cursor:pointer}\n.btn:hover{border-style:solid}\n.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}\n.kpi{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 14px}\n.kpi .v{font-family:var(--mono);font-size:26px;color:var(--ink);line-height:1.2}\n.kpi .l{font-size:12px;color:var(--muted)}\n.kpi.bad .v{color:var(--bad)} .kpi.warn .v{color:var(--warn)}\n.panel{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--shadow)}\n.panel-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}\n.ceo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}\n.ceo{border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--surface)}\n.ceo .tag{display:inline-flex;gap:8px;align-items:center;font-weight:700;color:var(--ceo)}\n.ceo .flag{background:var(--ceo);color:#fff;border-radius:6px;padding:2px 8px;font-size:12px}\n.ceo h3{font-size:16px}\n.ceo ul{margin:0;padding-left:18px;font-size:13px}\n.ceo li{margin:2px 0}\n.ceo .ready{font-size:12px;color:var(--muted)}\n.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}\nsvg text{font-family:var(--font)}\n.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--muted);align-items:center}\n.legend i{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px}\n.tabs{display:flex;flex-wrap:wrap;gap:6px}\n.tab{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--surface);color:var(--text);padding:6px 12px;border-radius:999px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}\n.tab .dot{width:8px;height:8px;border-radius:50%}\n.tab[aria-selected=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.chips{display:flex;flex-wrap:wrap;gap:6px}\ntable{border-collapse:collapse;width:100%;font-size:13px}\nth{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600;padding:8px;border-bottom:1px solid var(--line);white-space:nowrap}\ntd{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}\ntr.key td:first-child{box-shadow:inset 3px 0 0 var(--kc)}\n.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap;border:1px solid currentColor}\n.p-done{color:var(--done)} .p-late{color:var(--bad)} .p-soon{color:var(--warn)} .p-prog{color:var(--g01)} .p-plan{color:var(--ok)} .p-nodate{color:var(--muted);border-style:dashed}\n.lab{display:inline-block;font-size:11px;padding:1px 6px;border-radius:4px;background:var(--surface2);color:var(--text);margin:1px 2px 1px 0;white-space:nowrap}\n.lab.kd{background:var(--ink);color:var(--surface)}\n.lab.cf{background:var(--bad);color:#fff}\n.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px}\n.list{display:flex;flex-direction:column}\n.list .row{display:grid;grid-template-columns:72px 1fr auto;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);align-items:start}\n.list .d{font-family:var(--mono);font-size:12.5px;color:var(--ink)}\n.bar{height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;min-width:60px}\n.bar span{display:block;height:100%}\n#tip{position:fixed;z-index:10;pointer-events:none;background:var(--ink);color:var(--surface);font-size:12.5px;padding:8px 10px;border-radius:8px;max-width:300px;box-shadow:0 6px 20px rgba(0,0,0,.2)}\n.empty{padding:14px;border:1px dashed var(--line);border-radius:8px;color:var(--muted);font-size:13px}\n.note{font-size:12px;color:var(--muted)}\n@media (max-width:640px){h1{font-size:21px}.countdown b{font-size:30px}}\n@media (prefers-reduced-motion:no-preference){.tab,.seg button{transition:background .15s,color .15s}}\n<\/style><\/head><body><style>\n.vline{list-style:none;margin:0;padding:0;position:relative;max-width:760px}\n.vline::before{content:\"\";position:absolute;left:83px;top:6px;bottom:6px;width:3px;background:var(--line);border-radius:2px}\n.vline > li{display:grid;grid-template-columns:70px 30px 1fr;gap:0 8px;align-items:start;padding:7px 0;position:relative}\n.vline .dd{font-family:var(--mono);font-size:12.5px;color:var(--muted);text-align:right;padding-top:2px}\n.vline .dot{width:18px;height:18px;border-radius:50%;background:var(--surface);border:3px solid var(--ink);justify-self:center;margin-top:1px;z-index:1;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff}\n.vline .dot.done{background:var(--ok);border-color:var(--ok)} .vline .dot.late{background:var(--bad);border-color:var(--bad)}\n.vline .tx{font-size:14.5px;color:var(--text)} .vline .tx s{color:var(--muted)}\n.vline > li.month{padding:14px 0 4px} .vline > li.month .tx{font-weight:700;color:var(--ink);font-size:13px;letter-spacing:.04em}\n.vline > li.month .dot{width:10px;height:10px;border:0;background:var(--muted);margin-top:5px}\n.vline > li.today .dd,.vline > li.today .tx{color:var(--g01);font-weight:700} .vline > li.today .dot{border-color:var(--g01);background:var(--g01);width:12px;height:12px;margin-top:4px}\n.vline > li.event .dot{background:var(--event);border-color:var(--event);width:22px;height:22px}\n.vline > li.event .tx{font-weight:700;color:var(--ink);font-size:15.5px}\n.vline > li.ceo-row .dot{background:var(--ceo);border-color:var(--ceo);border-radius:5px;width:20px;height:20px}\n.ceo-box{background:color-mix(in srgb,var(--ceo) 9%,var(--surface));border:1px solid color-mix(in srgb,var(--ceo) 40%,var(--line));border-radius:10px;padding:10px 14px}\n.ceo-box b{color:var(--ceo)} .ceo-box ol{margin:6px 0 0;padding-left:20px;font-size:13.5px;display:block}.ceo-box ol li{display:list-item;padding:1px 0} .ceo-box .note{margin-top:6px}\n.stations{display:grid;grid-template-columns:repeat(4,minmax(228px,1fr)) minmax(140px,.6fr) minmax(228px,1fr);gap:0;min-width:1290px;position:relative;padding-top:6px}\n.stations::before{content:\"\";position:absolute;left:40px;right:40px;top:26px;height:4px;background:var(--line);border-radius:2px}\n.st{position:relative;padding:0 10px;display:flex;flex-direction:column;gap:6px}\n.st .num{width:42px;height:42px;border-radius:50%;background:var(--ceo);color:#fff;font-weight:700;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:1;border:3px solid var(--surface)}\n.st.past .num{background:var(--muted)} .st.event .num{background:var(--event);color:var(--ink)}\n.st .when{font-weight:800;color:var(--ceo);font-size:16px}\n.mtg{border:1px solid var(--line);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:12.5px;background:var(--bg);min-height:128px}\n.mtg .h{font-size:11px;letter-spacing:.06em;color:var(--muted);font-weight:700;margin-bottom:2px}\n.mtg .r{display:flex;justify-content:space-between;gap:8px;align-items:baseline}\n.mtg .r span{text-align:right}\n.mtg .r b{color:var(--ink);font-weight:700;white-space:nowrap}\n.mtg .ed{outline:none;border-bottom:1px dashed var(--line);cursor:text;min-width:36px;border-radius:3px;padding:0 2px}.mtg .ed:hover{background:var(--surface2)}.mtg .ed:focus{background:#FFF6D6;border-bottom-color:var(--g01)}\n.mtg .tbd{color:var(--warn)} .mtg .ok{color:var(--ok)}\n .st.event .when{color:var(--ink)}\n.st .ttl{font-weight:700;color:var(--ink);font-size:15px;line-height:1.35;min-height:2.7em;margin-top:4px}\n.st .rdy{font-size:12px;color:var(--muted)}\n.st ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:13px;line-height:1.35}\n.st ol li{display:grid;grid-template-columns:18px 1fr;gap:6px;align-items:start}\n.st ol li.done span:last-child{color:var(--muted);text-decoration:line-through}\n.st ol{font-size:14px}\n.st ol li.late span:last-child{color:var(--bad)}\n.sc-strip{margin-top:16px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;font-size:13px}\n.sc-strip b{color:var(--g01);margin-right:4px}\n.sc-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-variant-numeric:tabular-nums}\n.sc-chip.done{border-color:var(--ok);color:var(--ok)} .sc-chip.next{border-color:var(--g01);color:var(--g01);font-weight:700}\n.rp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}\n.rp{border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}\n.rp h4{margin:0;font-size:13.5px;color:var(--ink);display:flex;justify-content:space-between;gap:8px}\n.rp h4 .c{font-family:var(--mono);font-size:12.5px;color:var(--muted)}\n.rp.good h4{color:var(--ok)} .rp.bad h4{color:var(--bad)} .rp.next h4{color:var(--g01)} .rp.ask h4{color:var(--warn)}\n.rp ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font-size:13px}\n.rp li{display:grid;grid-template-columns:58px 1fr;gap:6px}\n.rp li .d{font-family:var(--mono);font-size:12px;color:var(--muted)}\n.rp li .b{display:block;font-size:11.5px;color:var(--muted)}\n.hdr-stats{display:flex;flex-wrap:wrap;gap:8px}\n.hs{border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:12.5px;color:var(--muted)}\n.hs b{display:block;font-family:var(--mono);font-size:20px;color:var(--ink)}\n.hs.bad b{color:var(--bad)} .hs.ok b{color:var(--ok)}\n.subt td{vertical-align:middle}\n.rag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700;color:#fff;white-space:nowrap}\n.rag.r{background:var(--bad)} .rag.a{background:var(--warn)} .rag.g{background:var(--ok)} .rag.d{background:var(--muted)}\ndetails.alltasks summary{cursor:pointer;font-weight:600;color:var(--ink);font-size:13.5px;padding:6px 0}\n.subws{border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}\n.subws .top{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}\n.subws .top h4{margin:0;font-size:15px;color:var(--ink)}\n.kdl{display:flex;flex-direction:column;gap:4px;font-size:13px}\n.kdl .k{display:grid;grid-template-columns:18px 70px 1fr auto;gap:8px;align-items:start;padding:3px 0;border-top:1px dashed var(--line)}\n.kdl .k:first-child{border-top:0}\n.kdl .s{font-size:12px;font-weight:700;white-space:nowrap}\n.kdl .s.done{color:var(--ok)} .kdl .s.late{color:var(--bad)} .kdl .s.soon{color:var(--warn)} .kdl .s.plan{color:var(--muted);font-weight:500}\n@media (max-width:640px){.kdl .k{grid-template-columns:18px 60px 1fr}.kdl .s{grid-column:3}}\n.cov{border-collapse:separate;border-spacing:0;width:100%;min-width:760px;font-size:12.5px;margin-top:6px}\n.cov th{font-size:11.5px;text-transform:none;letter-spacing:0;color:var(--ink);text-align:left;padding:6px 8px;border-bottom:2px solid var(--line)}\n.cov td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:middle}\n.cov td.ws{font-weight:700;white-space:nowrap}\n.dots{display:flex;flex-wrap:wrap;gap:3px;align-items:center}\n.dt{width:10px;height:10px;border-radius:50%;background:var(--surface);border:2px solid var(--muted)}\n.dt.done{background:var(--ok);border-color:var(--ok)} .dt.late{background:var(--bad);border-color:var(--bad)} .dt.soon{border-color:var(--warn)}\n.cov .cnt{font-family:var(--mono);font-size:11px;color:var(--muted);margin-left:4px}\n.cov tfoot td{font-weight:700;color:var(--ink);border-bottom:0}\n.exec-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px;margin-top:14px}\n.upd{border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px}\n.upd .tag{display:flex;gap:8px;align-items:center;font-weight:700;color:var(--ceo);flex-wrap:wrap}\n.upd .flag{background:var(--ceo);color:#fff;border-radius:6px;padding:2px 8px;font-size:12px}\n.upd h3{font-size:15.5px}\n.upd ol{margin:0;padding-left:20px;font-size:13px}\n.upd ol li{margin:3px 0}\n.kd-list{display:flex;flex-direction:column;gap:4px;font-size:12.5px}\n.kd-list .k{display:grid;grid-template-columns:18px 64px 1fr;gap:6px;align-items:start}\n.ic{display:inline-flex;width:16px;height:16px;border-radius:50%;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;margin-top:2px}\n.ic.done{background:var(--ok)} .ic.late{background:var(--bad)} .ic.soon{background:var(--warn)} .ic.open{background:transparent;border:1.5px solid var(--muted)} .ic.prog{background:var(--g01)}\n.kd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}\n.kd-card{border:1px solid var(--line);border-radius:10px;padding:12px}\n.kd-card h4{margin:0 0 8px;font-size:13.5px;color:var(--ink);display:flex;justify-content:space-between;gap:8px}\n.progress{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}\n.progress .bar{flex:1}\ns.done-t{color:var(--muted)}\n<\/style>\n\n<div class=\"wrap\">\n  <header class=\"top\">\n    <div>\n      <div class=\"eyebrow\">Sustainability Spark by PTT Group 2027 \u2022 Paragon Hall<\/div>\n      <h1>Spark2027 Timeline<\/h1>\n      <div class=\"muted\" id=\"asof\"><\/div>\n    <\/div>\n    <div class=\"countdown\"><b id=\"days\" class=\"num\">\u2013<\/b><span class=\"muted\">\u0e27\u0e31\u0e19\u0e16\u0e36\u0e07\u0e27\u0e31\u0e19\u0e07\u0e32\u0e19<br>15\u201316 \u0e21.\u0e04. 2570<\/span><\/div>\n  <\/header>\n\n\n\n  \n\n  <section class=\"panel\" aria-labelledby=\"ovH\">\n    <div class=\"panel-head\">\n      <h2 id=\"ovH\">\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21\u0e15\u0e32\u0e21 Bucket<\/h2>\n      <div class=\"seg\" id=\"modeSeg\">\n        <button type=\"button\" id=\"mode-key\" data-mode=\"key\" aria-pressed=\"true\">\u0e40\u0e09\u0e1e\u0e32\u0e30 Key Deliverable<\/button>\n        <button type=\"button\" id=\"mode-all\" data-mode=\"all\" aria-pressed=\"false\">\u0e17\u0e38\u0e01 task<\/button>\n      <\/div>\n      <div style=\"display:flex;gap:8px;flex-wrap:wrap\">\n        <div class=\"seg\"><button type=\"button\" id=\"splitBtn\" aria-pressed=\"false\">\u0e21\u0e38\u0e21\u0e21\u0e2d\u0e07 PowerPoint 2 \u0e41\u0e1c\u0e48\u0e19<\/button><\/div>\n        <button type=\"button\" class=\"btn\" id=\"pptBtn\" style=\"border-style:solid;background:var(--ink);color:var(--surface)\">Export PowerPoint 2 \u0e41\u0e1c\u0e48\u0e19<\/button>\n      <\/div>\n    <\/div>\n    <div id=\"splitWrap\" hidden>\n      <div class=\"eyebrow\" style=\"margin:4px 0 6px\">\u0e41\u0e1c\u0e48\u0e19\u0e17\u0e35\u0e48 1 \u00b7 Core Workstream<\/div><div class=\"scroll\"><svg id=\"ov1\" role=\"img\" aria-label=\"Timeline \u0e41\u0e1c\u0e48\u0e19\u0e17\u0e35\u0e48 1\"><\/svg><\/div>\n      <div class=\"eyebrow\" style=\"margin:18px 0 6px;border-top:2px dashed var(--line);padding-top:12px\">\u0e41\u0e1c\u0e48\u0e19\u0e17\u0e35\u0e48 2 \u00b7 Enabler, On Event &amp; PMO<\/div><div class=\"scroll\"><svg id=\"ov2\" role=\"img\" aria-label=\"Timeline \u0e41\u0e1c\u0e48\u0e19\u0e17\u0e35\u0e48 2\"><\/svg><\/div>\n    <\/div>\n    <div class=\"scroll\"><svg id=\"overview\" role=\"img\" aria-label=\"Timeline \u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21\"><\/svg><\/div>\n    <div class=\"legend\" style=\"margin-top:10px\" id=\"legend\"><\/div>\n  <\/section>\n\n  <section class=\"panel\" aria-labelledby=\"wsH\">\n    <div class=\"panel-head\"><h2 id=\"wsH\">Progress \u0e23\u0e32\u0e22 Workstream<\/h2><span class=\"note\">\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14\u0e08\u0e32\u0e01 Planner \u2022 \u2713 \u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27 \u2022 \u0e41\u0e14\u0e07 = \u0e14\u0e35\u0e40\u0e25\u0e22\u0e4c<\/span><\/div>\n    <div class=\"tabs\" role=\"tablist\" id=\"tabs\"><\/div>\n    <div id=\"wsBody\" style=\"margin-top:14px;display:flex;flex-direction:column;gap:16px\"><\/div>\n  <\/section>\n\n  <section class=\"panel admin\" aria-labelledby=\"adH\">\n    <div class=\"panel-head\" style=\"margin:0\"><h2 id=\"adH\" style=\"font-size:14px\">\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 Planner (\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e1c\u0e39\u0e49\u0e14\u0e39\u0e41\u0e25)<\/h2>\n      <button type=\"button\" class=\"btn\" id=\"adOpen\">\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25<\/button><\/div>\n    <div id=\"adLock\" hidden style=\"margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center\">\n      <label for=\"adCode\" class=\"note\">\u0e23\u0e2b\u0e31\u0e2a\u0e1c\u0e39\u0e49\u0e14\u0e39\u0e41\u0e25<\/label>\n      <input id=\"adCode\" type=\"password\" inputmode=\"numeric\" autocomplete=\"off\" style=\"font:inherit;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);width:120px\">\n      <button type=\"button\" class=\"btn\" id=\"adGo\">\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19<\/button><span class=\"note\" id=\"adMsg\"><\/span>\n    <\/div>\n    <div id=\"adTools\" hidden style=\"margin-top:12px;display:flex;flex-direction:column;gap:10px\">\n      <div class=\"note\">1) Planner \u2192 \u22ef \u2192 Export plan to Excel &nbsp; 2) \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e14\u0e49\u0e32\u0e19\u0e25\u0e48\u0e32\u0e07 \u2192 \u0e14\u0e39\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07 &nbsp; 3) \u0e01\u0e14 \"\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\" \u0e17\u0e38\u0e01\u0e04\u0e19\u0e17\u0e35\u0e48\u0e40\u0e1b\u0e34\u0e14\u0e2b\u0e19\u0e49\u0e32\u0e19\u0e35\u0e49\u0e08\u0e30\u0e40\u0e2b\u0e47\u0e19\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e43\u0e2b\u0e21\u0e48<\/div>\n      <div style=\"display:flex;gap:8px;flex-wrap:wrap;align-items:center\">\n        <label class=\"btn\" for=\"file\">\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c Planner export (.xlsx)<\/label>\n        <input type=\"file\" id=\"file\" accept=\".xlsx,.xls\" hidden>\n        <button type=\"button\" class=\"btn\" id=\"adPub\" hidden style=\"border-style:solid;background:var(--ink);color:var(--surface)\">\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e43\u0e2b\u0e49\u0e17\u0e38\u0e01\u0e04\u0e19\u0e40\u0e2b\u0e47\u0e19<\/button>\n        <button type=\"button\" class=\"btn\" id=\"adCancel\" hidden>\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01<\/button>\n      <\/div>\n      <span class=\"note\" id=\"srcNote\"><\/span>\n    <\/div>\n  <\/section>\n<\/div>\n<div id=\"tip\" hidden><\/div>\n\n<script>\nconst DATA = {\"plan\": [], \"meta\": {\"source\": \"\", \"updated\": \"\"}};\nconst SHELL = '';\nconst EVENT = ['2027-01-15', '2027-01-16'];\nconst GROUPS = [\n  { id: '01', n: 'Seminar', re: /^010[0-6]/, c: 'var(--g01)' },\n  { id: '018', n: 'Business Matching', re: /^0108/, c: 'var(--g01)' },\n  { id: '017', n: 'Edutainment', re: /^0107/, c: 'var(--g01)' },\n  { id: '02', n: 'Exhibition', re: /^02/, c: 'var(--g02)' },\n  { id: '03', n: 'Media & PR', re: /^03/, c: 'var(--g03)' },\n  { id: '04', n: 'Platform / Website', re: /^04/, c: 'var(--g04)' },\n  { id: '05', n: 'Invitation & Guest', re: /^05/, c: 'var(--g05)' },\n  { id: '061', n: 'Spark Hack', re: /^06_01/, c: 'var(--g06)' },\n  { id: '062', n: 'Spark Sense', re: /^06_02/, c: 'var(--g06)' },\n  { id: '063', n: 'Spark Lab', re: /^06_03/, c: 'var(--g06)' },\n  { id: '064', n: 'Globe Stage', re: /^06_04/, c: 'var(--g06)' },\n  { id: '071', n: 'Logistic & Catering', re: /^07_01/, c: 'var(--g07)' },\n  { id: '072', n: 'Venue & Security', re: /^07_02/, c: 'var(--g07)' },\n  { id: '991', n: '\u0e04\u0e33\u0e2a\u0e31\u0e48\u0e07\u0e04\u0e13\u0e30\u0e17\u0e33\u0e07\u0e32\u0e19', re: /^9904/, c: 'var(--g99)' },\n  { id: '992', n: '\u0e1b\u0e23\u0e30\u0e0a\u0e38\u0e21\u0e1c\u0e39\u0e49\u0e1a\u0e23\u0e34\u0e2b\u0e32\u0e23', re: /^9901/, c: 'var(--g99)' },\n  { id: '993', n: '\u0e02\u0e2d\u0e07\u0e17\u0e35\u0e48\u0e23\u0e30\u0e25\u0e36\u0e01', re: /^9902/, c: 'var(--g99)' },\n  { id: '994', n: '\u0e15\u0e23\u0e27\u0e08\u0e23\u0e31\u0e1a\u0e07\u0e32\u0e19', re: /^9903/, c: 'var(--g99)' },\n  { id: '995', n: 'Carbon Neutral Event', re: /^9905/, c: 'var(--g99)' },\n];\nconst CEO = [\n  { no: 'CEO 1', from: '2026-10-05', to: '2026-10-09', when: '\u0e15\u0e49\u0e19\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21', th: '\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e17\u0e34\u0e28\u0e17\u0e32\u0e07\u0e07\u0e32\u0e19',\n    items: [['\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e01\u0e32\u0e23\u0e1a\u0e19\u0e40\u0e27\u0e17\u0e35', /^\u0e2a\u0e23\u0e38\u0e1b\u0e1a\u0e23\u0e35\u0e1f\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e2b\u0e31\u0e27\u0e02\u0e49\u0e2d/], ['\u0e27\u0e34\u0e17\u0e22\u0e32\u0e01\u0e23', /^\u0e40\u0e15\u0e23\u0e35\u0e22\u0e21\u0e01\u0e32\u0e23\u0e08\u0e31\u0e14\u0e2b\u0e32\u0e27\u0e34\u0e17\u0e22\u0e32\u0e01\u0e23/], ['\u0e1e\u0e34\u0e18\u0e35\u0e01\u0e23', /^\u0e04\u0e31\u0e14\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e1e\u0e34\u0e18\u0e35\u0e01\u0e23/], ['Key Visual \u0e02\u0e2d\u0e07\u0e07\u0e32\u0e19', /^Key Visual/]] },\n  { no: 'CEO 2', from: '2026-11-02', to: '2026-11-06', when: '\u0e15\u0e49\u0e19\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19', th: '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e1c\u0e39\u0e49\u0e23\u0e48\u0e27\u0e21\u0e07\u0e32\u0e19 \u0e41\u0e25\u0e30\u0e40\u0e15\u0e23\u0e35\u0e22\u0e21\u0e40\u0e1b\u0e34\u0e14\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19',\n    items: [['\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e02\u0e01\u0e41\u0e25\u0e30\u0e1c\u0e39\u0e49\u0e40\u0e0a\u0e34\u0e0d\u0e41\u0e15\u0e48\u0e25\u0e30\u0e01\u0e25\u0e38\u0e48\u0e21', /^\u0e23\u0e27\u0e1a\u0e23\u0e27\u0e21\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e02\u0e01/], ['\u0e04\u0e27\u0e32\u0e21\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c\u0e41\u0e25\u0e30\u0e23\u0e30\u0e1a\u0e1a\u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19', /^Website \u2013 Development/], ['\u0e41\u0e1a\u0e1a\u0e19\u0e34\u0e17\u0e23\u0e23\u0e28\u0e01\u0e32\u0e23\u0e23\u0e48\u0e32\u0e07\u0e41\u0e23\u0e01 (Draft 1)', /^\u0e1b\u0e23\u0e31\u0e1a\u0e41\u0e01\u0e49\u0e41\u0e1a\u0e1a\u0e19\u0e34\u0e17\u0e23\u0e23\u0e28\u0e01\u0e32\u0e23 Draft 1/], ['\u0e23\u0e39\u0e1b\u0e41\u0e1a\u0e1a\u0e02\u0e2d\u0e07\u0e17\u0e35\u0e48\u0e23\u0e30\u0e25\u0e36\u0e01', /^\u0e1b\u0e15\u0e17\\. \u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e23\u0e39\u0e1b\u0e41\u0e1a\u0e1a\u0e02\u0e2d\u0e07\u0e17\u0e35\u0e48\u0e23\u0e30\u0e25\u0e36\u0e01/]] },\n  { no: 'CEO 3', from: '2026-12-14', to: '2026-12-18', when: '\u0e01\u0e25\u0e32\u0e07\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21', th: '\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e07\u0e32\u0e19\u0e2d\u0e2d\u0e01\u0e41\u0e1a\u0e1a \u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e01\u0e32\u0e23\u0e1c\u0e25\u0e34\u0e15',\n    items: [['\u0e1c\u0e25\u0e15\u0e2d\u0e1a\u0e23\u0e31\u0e1a\u0e1a\u0e31\u0e15\u0e23\u0e40\u0e0a\u0e34\u0e0d \u0e41\u0e25\u0e30\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e02\u0e01\u0e04\u0e19\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e17\u0e35\u0e48\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e41\u0e25\u0e49\u0e27', /^\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21\u0e23\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e02\u0e01/], ['Artwork, Video & Immersive \u0e01\u0e48\u0e2d\u0e19\u0e1c\u0e25\u0e34\u0e15', /^\u0e1b\u0e34\u0e14 Artwork/]] },\n  { no: 'CEO 4', from: '2027-01-04', to: '2027-01-08', when: '\u0e15\u0e49\u0e19\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21', th: '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e04\u0e27\u0e32\u0e21\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e01\u0e48\u0e2d\u0e19\u0e27\u0e31\u0e19\u0e07\u0e32\u0e19',\n    items: [['\u0e1c\u0e31\u0e07\u0e17\u0e35\u0e48\u0e19\u0e31\u0e48\u0e07\u0e41\u0e25\u0e30\u0e01\u0e32\u0e23\u0e08\u0e31\u0e14\u0e27\u0e32\u0e07 Seating', /^\u0e23\u0e30\u0e1a\u0e38\u0e42\u0e0b\u0e19\u0e17\u0e35\u0e48\u0e19\u0e31\u0e48\u0e07/], ['\u0e01\u0e32\u0e23\u0e08\u0e2d\u0e07\u0e23\u0e49\u0e32\u0e19\u0e2d\u0e32\u0e2b\u0e32\u0e23\u0e41\u0e25\u0e30\u0e08\u0e38\u0e14\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23', /^Final \u0e2d\u0e32\u0e2b\u0e32\u0e23\u0e41\u0e25\u0e30\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e14\u0e37\u0e48\u0e21/], ['\u0e17\u0e35\u0e48\u0e08\u0e2d\u0e14\u0e23\u0e16', /^\u0e17\u0e35\u0e48\u0e08\u0e2d\u0e14\u0e23\u0e16/]] },\n  { no: 'CEO 5', from: '2027-02-22', to: '2027-02-26', when: '\u0e1b\u0e25\u0e32\u0e22\u0e40\u0e14\u0e37\u0e2d\u0e19\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c', th: '\u0e2a\u0e23\u0e38\u0e1b\u0e1c\u0e25\u0e41\u0e25\u0e30\u0e1b\u0e34\u0e14\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23',\n    items: [['\u0e1c\u0e25\u0e01\u0e32\u0e23\u0e08\u0e31\u0e14\u0e07\u0e32\u0e19', /^\u0e2a\u0e48\u0e07\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19\u0e2a\u0e23\u0e38\u0e1b/], ['\u0e1c\u0e25\u0e01\u0e32\u0e23\u0e1b\u0e23\u0e30\u0e0a\u0e32\u0e2a\u0e31\u0e21\u0e1e\u0e31\u0e19\u0e18\u0e4c', /^PR Phase 5/], ['\u0e1a\u0e17\u0e40\u0e23\u0e35\u0e22\u0e19\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e07\u0e32\u0e19\u0e04\u0e23\u0e31\u0e49\u0e07\u0e15\u0e48\u0e2d\u0e44\u0e1b', /^\u0e2a\u0e23\u0e38\u0e1b\u0e1a\u0e17\u0e40\u0e23\u0e35\u0e22\u0e19/], ['\u0e01\u0e32\u0e23\u0e15\u0e23\u0e27\u0e08\u0e23\u0e31\u0e1a\u0e07\u0e32\u0e19', /^\u0e15\u0e23\u0e27\u0e08\u0e23\u0e31\u0e1a\u0e07\u0e32\u0e19 BDB \u0e07\u0e27\u0e14\u0e2a\u0e38\u0e14\u0e17\u0e49\u0e32\u0e22/]] },\n];\nconst MATRIX = [\n  { n: 'Seminar', re: /^01/, c: 'var(--g01)' }, { n: 'Exhibition', re: /^02/, c: 'var(--g02)' }, { n: 'Media & PR', re: /^03/, c: 'var(--g03)' },\n  { n: 'Website / \u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19', re: /^04/, c: 'var(--g04)' }, { n: 'Invitation & Guest', re: /^05/, c: 'var(--g05)' },\n  { n: 'Activities', re: /^06/, c: 'var(--g06)' }, { n: 'Logistic & Venue', re: /^07/, c: 'var(--g07)' }, { n: 'PMO', re: /^99/, c: 'var(--g99)' },\n];\nconst SC = ['2026-10-01', '2026-10-15', '2026-10-29', '2026-11-12', '2026-11-26', '2026-12-09', '2026-12-24', '2027-01-07'];\nconst TH_MF = ['\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21','\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c','\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21','\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19','\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21','\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19','\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21','\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21','\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19','\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21','\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19','\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21'];\nconst TH_M = ['\u0e21.\u0e04.','\u0e01.\u0e1e.','\u0e21\u0e35.\u0e04.','\u0e40\u0e21.\u0e22.','\u0e1e.\u0e04.','\u0e21\u0e34.\u0e22.','\u0e01.\u0e04.','\u0e2a.\u0e04.','\u0e01.\u0e22.','\u0e15.\u0e04.','\u0e1e.\u0e22.','\u0e18.\u0e04.'];\nconst DAY = 864e5;\nconst today = (() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); })();\nconst parseD = (v) => {\n  if (v == null || v === '') return null;\n  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());\n  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * DAY)); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }\n  const s = String(v).trim(); let m = s.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);\n  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);\n  m = s.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/); if (m) return new Date(+m[3], +m[1] - 1, +m[2]);\n  const d = new Date(s); return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());\n};\nconst fmt = (d) => d ? `${d.getDate()} ${TH_M[d.getMonth()]}` : '\u2013';\nconst fmtY = (d) => d ? `${d.getDate()} ${TH_M[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}` : '\u2013';\nconst esc = (s) => String(s ?? '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\nconst MTG_KEY = 'spark2027-mtg-v1'; let MTG = {}; try { MTG = JSON.parse(localStorage.getItem(MTG_KEY) || '{}'); } catch (e) {}\nconst ovr = (t, i, html) => { const k = t + '|' + i; return MTG[k] != null ? '<span class=\"ok\" style=\"color:var(--g01)\">' + esc(MTG[k]) + '<\/span>' : html; };\nconst OTHER = { id: '999', n: '\u0e2d\u0e37\u0e48\u0e19 \u0e46', re: /^$/, c: 'var(--muted)' };\nconst groupOf = (b) => GROUPS.find(g => g.re.test(b)) || OTHER;\nconst ST = { done: ['\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27', 'p-done'], late: ['\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14', 'p-late'], soon: ['\u0e04\u0e23\u0e1a\u0e43\u0e19 7 \u0e27\u0e31\u0e19', 'p-soon'], prog: ['\u0e01\u0e33\u0e25\u0e31\u0e07\u0e17\u0e33', 'p-prog'], plan: ['\u0e15\u0e32\u0e21\u0e41\u0e1c\u0e19', 'p-plan'], nodate: ['\u0e44\u0e21\u0e48\u0e21\u0e35\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48', 'p-nodate'] };\nconst stColor = { done: 'var(--ok)', late: 'var(--bad)', soon: 'var(--warn)', prog: 'var(--g01)' };\nconst icon = (st) => st === 'done' ? '<span class=\"ic done\">\u2713<\/span>' : st === 'late' ? '<span class=\"ic late\">!<\/span>' : st === 'soon' ? '<span class=\"ic soon\">\u2022<\/span>' : st === 'prog' ? '<span class=\"ic prog\">\u00bd<\/span>' : '<span class=\"ic open\"><\/span>';\n\nfunction normalize(rows) {\n  return rows.filter(r => r['Task Name']).map(r => {\n    const labels = String(r['Labels'] || '').split(';').map(s => s.trim()).filter(Boolean);\n    let due = parseD(r['Due date']); const start = parseD(r['Start date']);\n    if (!due && /complete/i.test(String(r['Status'] || ''))) due = parseD(r['Completed Date']);\n    const status = String(r['Status'] || r['Progress'] || '');\n    const done = /complete/i.test(status), prog = /progress/i.test(status);\n    let st;\n    if (done) st = 'done'; else if (!due) st = 'nodate'; else if (due < today) st = 'late';\n    else if ((due - today) / DAY <= 7) st = 'soon'; else if (prog) st = 'prog'; else st = 'plan';\n    const bucket = String(r['Bucket'] || r['Bucket Name'] || '').trim();\n    return { id: r['Task ID'], name: String(r['Task Name']).trim(), bucket, g: groupOf(bucket), start, due, st, done, prog, labels,\n      key: labels.some(l => /key deliverable/i.test(l)), side: /^02/.test(bucket) ? (/booth/i.test(String(r['Task Name'])) ? 'up' : /vdo|video/i.test(String(r['Task Name'])) ? 'dn' : null) : null, who: String(r['Assigned To'] || '').split(';').filter(Boolean), doneAt: parseD(r['Completed Date']) };\n  });\n}\n\nlet preview = null, previewName = '', mode = 'key', tab = '01', wsFilter = 'all', TASKS = [], uploaded = null, uploadedName = '';\ntry { const t = localStorage.getItem('spark2027-tab-v2'); if (t && GROUPS.some(g => g.id === t)) tab = t; } catch (e) {}\n\nconst tip = document.getElementById('tip');\nfunction showTip(e, t) {\n  tip.innerHTML = `<b>${esc(t.name)}<\/b><br>${esc(t.bucket)}<br>${t.start && +t.start !== +t.due ? fmt(t.start) + ' \u2013 ' : ''}${fmtY(t.due)}<br>${ST[t.st][0]}${t.doneAt ? ' ' + fmt(t.doneAt) : ''}${t.who.length ? ' \u2022 ' + esc(t.who.join(', ')) : ''}`;\n  tip.hidden = false;\n  const x = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8), y = Math.min(e.clientY + 12, window.innerHeight - tip.offsetHeight - 8);\n  tip.style.left = x + 'px'; tip.style.top = y + 'px';\n}\ndocument.addEventListener('scroll', () => tip.hidden = true, true);\n\nconst NS = 'http://www.w3.org/2000/svg';\nfunction el(tag, attrs, parent, text) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }\nfunction range() { let mn = Math.min(new Date(2026, 8, 14), today - 10 * DAY); TASKS.forEach(t => { const d = t.start || t.due; if (d && +d < mn) mn = +d; }); const s = new Date(mn); return [new Date(s.getFullYear(), s.getMonth(), 1), new Date(2027, 1, 22)]; }\nfunction axis(svg, x0, x1, T0, T1, yTop, yBot) {\n  const X = (d) => x0 + (Math.max(T0, Math.min(T1, d)) - T0) / (T1 - T0) * (x1 - x0);\n  let m = new Date(T0.getFullYear(), T0.getMonth(), 1), i = 0;\n  while (m < T1) {\n    const n = new Date(m.getFullYear(), m.getMonth() + 1, 1), a = X(m), b = X(n);\n    el('rect', { x: a, y: yTop, width: Math.max(0, b - a), height: 24, fill: i % 2 ? 'var(--surface2)' : 'var(--bg)' }, svg);\n    if (b - a > 34) el('text', { x: (a + b) / 2, y: yTop + 16, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: 'var(--ink)' }, svg, `${TH_M[m.getMonth()]} ${String(m.getFullYear() + 543).slice(2)}`);\n    el('line', { x1: a, x2: a, y1: yTop + 24, y2: yBot, stroke: 'var(--line)' }, svg);\n    m = n; i++;\n  }\n  const ea = X(parseD(EVENT[0])), eb = X(new Date(+parseD(EVENT[1]) + DAY));\n  el('rect', { x: ea, y: yTop + 24, width: eb - ea, height: yBot - yTop - 24, fill: 'var(--eventbg)' }, svg);\n  const tx = X(today);\n  el('line', { x1: tx, x2: tx, y1: yTop + 24, y2: yBot, stroke: 'var(--muted)', 'stroke-dasharray': '2 3' }, svg);\n  el('text', { x: tx + 4, y: yBot - 4, 'font-size': 10.5, fill: 'var(--muted)' }, svg, '\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49');\n  return X;\n}\nfunction ceoBands(svg, X, y0, y1, labelY) {\n  CEO.forEach(c => {\n    const a = X(parseD(c.from)), b = X(new Date(+parseD(c.to) + DAY)), cx = (a + b) / 2;\n    el('rect', { x: a, y: y0, width: Math.max(3, b - a), height: y1 - y0, fill: 'var(--ceo)', opacity: .12 }, svg);\n    el('rect', { x: cx - 24, y: labelY, width: 48, height: 18, rx: 4, fill: 'var(--ceo)' }, svg);\n    el('text', { x: cx, y: labelY + 13, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#fff' }, svg, c.no);\n  });\n}\nfunction hover(g, t) {\n  g.setAttribute('tabindex', 0); g.style.cursor = 'pointer';\n  g.addEventListener('pointerenter', (e) => showTip(e, t)); g.addEventListener('pointermove', (e) => showTip(e, t));\n  g.addEventListener('pointerleave', () => tip.hidden = true);\n  g.addEventListener('focus', () => { const b = g.getBoundingClientRect(); showTip({ clientX: b.right, clientY: b.bottom }, t); });\n  g.addEventListener('blur', () => tip.hidden = true);\n}\nfunction mark(svg, x, y, r, color, t, filled) {\n  const g = el('g', {}, svg);\n  if (t.done) {\n    el('circle', { cx: x, cy: y, r: r + 1, fill: 'var(--ok)' }, g);\n    el('path', { d: `M${x - r * .5} ${y}L${x - r * .1} ${y + r * .45}L${x + r * .55} ${y - r * .45}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);\n  } else {\n    el('path', { d: `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`, fill: filled ? color : 'var(--surface)', stroke: color, 'stroke-width': filled ? 1 : 1.6 }, g);\n    if (t.prog) el('path', { d: `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}Z`, fill: 'var(--g01)' }, g);\n    const sc = stColor[t.st];\n    if (sc && (t.st === 'late' || t.st === 'soon')) el('circle', { cx: x + r * .8, cy: y - r * .8, r: 3.6, fill: sc, stroke: 'var(--surface)', 'stroke-width': 1.2 }, g);\n  }\n  hover(g, t); return g;\n}\nconst plain = (n) => n.replace(/^\\d{4}-\\d{2}\\s*/, '').replace(/^\\d{4,6}\\s*/, '');\nconst shortName = (n) => plain(n).replace(/\\s*\\(.*?\\)\\s*$/, '');\n// \u0e27\u0e32\u0e07\u0e1b\u0e49\u0e32\u0e22\u0e0a\u0e37\u0e48\u0e2d\u0e41\u0e1a\u0e1a\u0e44\u0e21\u0e48\u0e15\u0e31\u0e14\u0e04\u0e33 \u0e44\u0e21\u0e48\u0e17\u0e34\u0e49\u0e07\u0e1b\u0e49\u0e32\u0e22: \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e0a\u0e31\u0e49\u0e19\u0e1a\u0e19/\u0e25\u0e48\u0e32\u0e07\u0e44\u0e14\u0e49\u0e44\u0e21\u0e48\u0e08\u0e33\u0e01\u0e31\u0e14 \u0e41\u0e25\u0e49\u0e27\u0e02\u0e22\u0e32\u0e22\u0e04\u0e27\u0e32\u0e21\u0e2a\u0e39\u0e07\u0e41\u0e16\u0e27\u0e43\u0e2b\u0e49\u0e1e\u0e2d\u0e14\u0e35\nconst LH = 15, FS = 11;\nfunction layoutLabels(items, X, xmin, xmax) {\n  const up = [], dn = [], pl = [];\n  items.forEach((t, i) => {\n    const x = X(t.due), d = (t.done ? '\u2713 ' : '') + fmt(t.due) + ' ', nm = shortName(t.name);\n    const w = tw(d, FS, true) + tw(nm, FS, t.key) + 4;\n    const left = Math.max(xmin, Math.min(xmax - w, x - w / 2));\n    const fits = (arr) => arr.every(r => left > r.r + 6 || left + w < r.l - 6);\n    // \u0e2a\u0e25\u0e31\u0e1a\u0e1a\u0e19/\u0e25\u0e48\u0e32\u0e07\u0e40\u0e1b\u0e47\u0e19\u0e04\u0e48\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19 \u0e41\u0e25\u0e49\u0e27\u0e2b\u0e32\u0e0a\u0e31\u0e49\u0e19\u0e17\u0e35\u0e48\u0e27\u0e48\u0e32\u0e07\u0e0a\u0e31\u0e49\u0e19\u0e41\u0e23\u0e01\n    let lvl = 0, isUp;\n    for (;; lvl++) {\n      const pref = t.side === 'up' ? [up] : t.side === 'dn' ? [dn] : (i % 2 === 0) ? [up, dn] : [dn, up];\n      const hit = pref.find(side => { side[lvl] = side[lvl] || []; return fits(side[lvl]); });\n      if (hit) { hit[lvl].push({ l: left, r: left + w }); isUp = hit === up; break; }\n    }\n    pl.push({ t, x, d, nm, left, w, lvl, up: isUp });\n  });\n  return { pl, ups: up.filter(r => r.length).length, dns: dn.filter(r => r.length).length };\n}\nfunction drawLabels(svg, L, cy, color) {\n  L.pl.forEach(p => {\n    const t = p.t, y = p.up ? cy - 13 - p.lvl * LH : cy + 13 + p.lvl * LH;\n    if (p.lvl > 0 || Math.abs(p.left + p.w / 2 - p.x) > p.w / 2 - 4)\n      el('line', { x1: p.x, x2: p.x, y1: cy + (p.up ? -8 : 8), y2: p.up ? y + 2 : y - 2, stroke: color, 'stroke-width': .8, opacity: .45 }, svg);\n    const tx = el('text', { x: p.left, y, 'font-size': FS, fill: t.done ? 'var(--muted)' : 'var(--text)', 'dominant-baseline': p.up ? 'auto' : 'hanging' }, svg);\n    el('tspan', { 'font-weight': 700, fill: t.done ? 'var(--ok)' : t.st === 'late' ? 'var(--bad)' : color }, tx, p.d);\n    el('tspan', { 'text-decoration': t.done ? 'line-through' : 'none', 'font-weight': t.key ? 600 : 400 }, tx, p.nm);\n  });\n}\n\n// ---------- Executive Gantt ----------\n// Timeline \u0e41\u0e19\u0e27\u0e19\u0e2d\u0e19: \u0e07\u0e32\u0e19\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e19\u0e33\u0e40\u0e2a\u0e19\u0e2d\u0e1c\u0e39\u0e49\u0e1a\u0e23\u0e34\u0e2b\u0e32\u0e23 (\u0e14\u0e36\u0e07\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e08\u0e32\u0e01 task \u0e43\u0e19 Planner)\nconst _cv = document.createElement('canvas').getContext('2d');\nconst tw = (txt, px, bold) => { _cv.font = `${bold ? 700 : 400} ${px}px \"IBM Plex Sans Thai\", Tahoma, sans-serif`; return _cv.measureText(txt).width; };\nfunction execItems() {\n  const out = [];\n  CEO.forEach((c, i) => c.items.forEach(([label, re]) => {\n    const t = TASKS.find(x => re.test(plain(x.name)));\n    if (t && t.due) out.push({ label, t, due: t.due, done: t.done, st: t.st, n: i + 1 });\n  }));\n  return out;\n}\nfunction mtgText(ts) {\n  if (!ts.length) return '<span class=\"tbd\">\u0e23\u0e2d\u0e01\u0e33\u0e2b\u0e19\u0e14<\/span>';\n  return ts.map(t => {\n    if (!t.due) return '<span class=\"tbd\">\u0e23\u0e2d\u0e01\u0e33\u0e2b\u0e19\u0e14<\/span>';\n    const d = t.start && +t.start !== +t.due ? `${t.start.getDate()}\u2013${fmt(t.due)}` : fmt(t.due);\n    return t.done ? `<span class=\"ok\">\u2713 ${d}<\/span>` : d;\n  }).join(' \u2022 ');\n}\nfunction renderExec() {\n  if (!document.getElementById('stations')) return;\n  const items = execItems();\n  const find = (re) => TASKS.filter(t => re.test(plain(t.name)));\n  const evp = TASKS.filter(t => /^EVP Update/.test(plain(t.name)) && t.due).sort((a, b) => a.due - b.due);\n  const ends = CEO.map((c, i) => { const t = find(new RegExp('^CEO Update \u0e04\u0e23\u0e31\u0e49\u0e07\u0e17\u0e35\u0e48 ' + (i + 1) + '\\\\b'))[0]; return (t && t.due) || parseD(c.to); });\n  const station = (c, i) => {\n    const mine = items.filter(it => it.n === i + 1), d = mine.filter(it => it.done).length, end = ends[i], prevEnd = i ? ends[i - 1] : new Date(2000, 0, 1);\n    const ceoT = find(new RegExp('^CEO Update \u0e04\u0e23\u0e31\u0e49\u0e07\u0e17\u0e35\u0e48 ' + (i + 1) + '\\\\b')), evpT = evp.filter(t => t.due > prevEnd && t.due <= end);\n    const past = end < today, left = Math.round((((ceoT[0] && (ceoT[0].start || ceoT[0].due)) || parseD(c.from)) - today) / DAY);\n    return `<div class=\"st ${past ? 'past' : ''}\">\n      <div class=\"num\">${i + 1}<\/div>\n      <div class=\"when\">${esc(c.when)}<\/div>\n      <div class=\"ttl\" style=\"min-height:2.7em;margin-top:0\">${esc(c.th)}<\/div>\n      <div class=\"mtg\"><div class=\"h\">\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e01\u0e32\u0e23\u0e1b\u0e23\u0e30\u0e0a\u0e38\u0e21<\/div>\n        <div class=\"r\"><b>CEO Update<\/b><span class=\"ed\" contenteditable=\"true\" spellcheck=\"false\" data-k=\"CEO Update|${i}\">${ovr('CEO Update', i, mtgText(ceoT))}<\/span><\/div>\n        <div class=\"r\"><b>Steering Committee<\/b><span class=\"ed\" contenteditable=\"true\" spellcheck=\"false\" data-k=\"Steering Committee|${i}\">${ovr('Steering Committee', i, mtgText(find(new RegExp('^Steering Committee \u0e04\u0e23\u0e31\u0e49\u0e07\u0e17\u0e35\u0e48 ' + (i + 1) + '\\\\b'))))}<\/span><\/div>\n        <div class=\"r\"><b>SEVP Update<\/b><span class=\"ed\" contenteditable=\"true\" spellcheck=\"false\" data-k=\"SEVP Update|${i}\">${ovr('SEVP Update', i, mtgText(find(new RegExp('^SEVP Update \u0e04\u0e23\u0e31\u0e49\u0e07\u0e17\u0e35\u0e48 ' + (i + 1) + '\\\\b'))))}<\/span><\/div>\n        <div class=\"r\"><b>EVP Update<\/b><span class=\"ed\" contenteditable=\"true\" spellcheck=\"false\" data-k=\"EVP Update|${i}\">${ovr('EVP Update', i, evpT.length ? mtgText(evpT) : '<span class=\"muted\">\u2013<\/span>')}<\/span><\/div>\n      <\/div>\n      <div class=\"rdy\" style=\"margin-top:4px\">\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e17\u0e35\u0e48\u0e19\u0e33\u0e40\u0e2a\u0e19\u0e2d \u2022 \u0e1e\u0e23\u0e49\u0e2d\u0e21 ${d}/${mine.length}${!past ? ` \u2022 \u0e2d\u0e35\u0e01 ${left} \u0e27\u0e31\u0e19` : ''}<\/div>\n      <ol>${mine.map((it, k) => `<li class=\"${it.done ? 'done' : it.st === 'late' ? 'late' : ''}\">${icon(it.st)}<span>${k + 1}. ${esc(it.label)}<\/span><\/li>`).join('')}<\/ol>\n    <\/div>`;\n  };\n  const ev = `<div class=\"st event\"><div class=\"num\">\u2605<\/div><div class=\"when\">15\u201316 \u0e21.\u0e04. 2570<\/div><div class=\"ttl\">\u0e27\u0e31\u0e19\u0e07\u0e32\u0e19 \u0e17\u0e35\u0e48 Paragon Hall<\/div>\n      <div class=\"rdy\">\u0e2d\u0e35\u0e01 ${Math.max(0, Math.round((parseD(EVENT[0]) - today) / DAY))} \u0e27\u0e31\u0e19<\/div><\/div>`;\n  document.getElementById('stations').innerHTML = CEO.slice(0, 4).map(station).join('') + ev + station(CEO[4], 4);\n}\n\n// ---------- Overview ----------\nfunction drawOverview(opt) {\n  opt = opt || {}; const md = opt.mode || mode;\n  const svg = opt.svg || document.getElementById('overview'); svg.innerHTML = '';\n  const W = opt.W || Math.max(svg.parentElement.clientWidth, 760), x0 = 170, x1 = W - 12, lanesTop = 50;\n  const [T0, T1] = range();\n  const Xp = (d) => x0 + (Math.max(T0, Math.min(T1, d)) - T0) / (T1 - T0) * (x1 - x0);\n  const lanes = GROUPS.filter(g => !opt.ids || opt.ids.includes(g.id)).map(g => {\n    const ts = TASKS.filter(t => t.g.id === g.id), shown = ts.filter(t => t.due && (md === 'all' || ((t.key || t.done) && !/^010[1-6]|^020[1-9]/.test(t.bucket)))).sort((a, b) => a.due - b.due);\n    const L = md === 'key' ? layoutLabels(shown, Xp, x0 + 2, W - 4) : { pl: [], ups: 0, dns: 0 };\n    const top = 12 + L.ups * LH, h = Math.max(md === 'key' ? 64 : 56, top + 12 + L.dns * LH + 12);\n    return { g, ts, shown, L, top: Math.max(top, 28), h: Math.max(h, 28 + 12 + L.dns * LH + 12) };\n  });\n  const H = lanesTop + lanes.reduce((s, l) => s + l.h, 0) + 6;\n  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);\n  const X = axis(svg, x0, x1, T0, T1, 0, H);\n  let y = lanesTop;\n  lanes.forEach(({ g, ts, shown, L, top, h }, i) => {\n    const cy = y + top;\n    if (i % 2 === 0) el('rect', { x: 0, y, width: W, height: h, fill: 'var(--surface2)', opacity: .45 }, svg);\n    const done = ts.filter(t => t.done).length, late = ts.filter(t => t.st === 'late').length;\n    el('rect', { x: 6, y: cy - 14, width: 4, height: 28, rx: 2, fill: g.c }, svg);\n    el('text', { x: 16, y: cy - 2, 'font-size': 13, 'font-weight': 700, fill: 'var(--ink)' }, svg, g.n);\n    el('text', { x: 16, y: cy + 14, 'font-size': 11, fill: late ? 'var(--bad)' : 'var(--muted)' }, svg, `${ts.length} task \u2022 \u0e40\u0e2a\u0e23\u0e47\u0e08 ${done}${late ? ' \u2022 \u0e40\u0e25\u0e22 ' + late : ''}`);\n    const dated = ts.filter(t => t.due);\n    if (dated.length) {\n      const a = X(new Date(Math.min(...dated.map(t => +(t.start || t.due))))), b = X(new Date(Math.max(...dated.map(t => +t.due))));\n      el('rect', { x: a, y: cy - 2.5, width: Math.max(2, b - a), height: 5, rx: 2.5, fill: g.c, opacity: .3 }, svg);\n    }\n    y += h;\n    if (!shown.length) { el('text', { x: x0 + 8, y: cy + 4, 'font-size': 11.5, fill: 'var(--muted)', 'font-style': 'italic' }, svg, '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35 task \u0e17\u0e35\u0e48\u0e15\u0e34\u0e14 label Key Deliverable'); return; }\n    drawLabels(svg, L, cy, g.c);\n    shown.forEach(t => mark(svg, X(t.due), cy, t.key ? 7 : 5, g.c, t, t.key));\n  });\n  if (!opt.noLegend) document.getElementById('legend').innerHTML = `\n    <span><svg width=\"12\" height=\"12\" aria-hidden=\"true\"><path d=\"M6 0L12 6L6 12L0 6Z\" fill=\"var(--ink)\"/><\/svg> Key Deliverable<\/span>\n    <span><svg width=\"12\" height=\"12\" aria-hidden=\"true\"><path d=\"M6 1L11 6L6 11L1 6Z\" fill=\"var(--surface)\" stroke=\"var(--ink)\" stroke-width=\"1.5\"/><\/svg> task \u0e2d\u0e37\u0e48\u0e19<\/span>\n    <span><svg width=\"12\" height=\"12\" aria-hidden=\"true\"><path d=\"M6 1L11 6L6 11Z\" fill=\"var(--g01)\"/><path d=\"M6 1L11 6L6 11L1 6Z\" fill=\"none\" stroke=\"var(--ink)\"/><\/svg> \u0e01\u0e33\u0e25\u0e31\u0e07\u0e17\u0e33<\/span>\n    <span><span class=\"ic done\" style=\"width:13px;height:13px;font-size:9px\">\u2713<\/span> Complete<\/span>\n    <span><i style=\"border-radius:50%;background:var(--bad)\"><\/i>\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14<\/span>\n    <span><i style=\"border-radius:50%;background:var(--warn)\"><\/i>\u0e04\u0e23\u0e1a\u0e43\u0e19 7 \u0e27\u0e31\u0e19<\/span>\n    <span><i style=\"background:var(--eventbg);border:1px solid var(--event)\"><\/i>\u0e27\u0e31\u0e19\u0e07\u0e32\u0e19<\/span>`;\n}\n\n\nlet split = false;\nconst SPLIT_A = ['01', '018', '017', '02', '061', '062', '063', '064'];\nconst SPLIT_B = () => GROUPS.map(g => g.id).filter(i => !SPLIT_A.includes(i));\nfunction renderOverview() {\n  const one = document.getElementById('overview'), sw = document.getElementById('splitWrap');\n  if (!split) { one.parentElement.hidden = false; sw.hidden = true; drawOverview(); return; }\n  one.parentElement.hidden = true; sw.hidden = false;\n  const W = Math.max(sw.clientWidth - 4, 760);\n  drawOverview({ svg: document.getElementById('ov1'), ids: SPLIT_A, W });\n  drawOverview({ svg: document.getElementById('ov2'), ids: SPLIT_B(), W, noLegend: true });\n}\nwindow.pptImages = async function () {\n  const root = document.documentElement, prevTheme = root.getAttribute('data-theme');\n  root.setAttribute('data-theme', 'light');\n  const cs = getComputedStyle(root), out = [];\n  try {\n    for (const ids of [SPLIT_A, SPLIT_B()]) {\n      const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1600px';\n      const svg = document.createElementNS(NS, 'svg'); host.appendChild(svg); document.body.appendChild(host);\n      drawOverview({ svg, ids, W: 1600, mode: 'key', noLegend: true });\n      const w = +svg.getAttribute('width'), h = +svg.getAttribute('height');\n      let xml = new XMLSerializer().serializeToString(svg);\n      xml = xml.replace(/var\\((--[\\w-]+)\\)/g, (m0, v) => cs.getPropertyValue(v).trim() || '#888888');\n      xml = xml.replace('<svg', '<svg font-family=\"Tahoma, \\'Leelawadee UI\\', sans-serif\"');\n      host.remove();\n      const img = new Image();\n      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); });\n      const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;\n      const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.scale(2, 2); x.drawImage(img, 0, 0, w, h);\n      out.push({ data: c.toDataURL('image/png'), w, h });\n    }\n  } finally { if (prevTheme) root.setAttribute('data-theme', prevTheme); else root.removeAttribute('data-theme'); }\n  return out;\n};\n// ---------- KPIs ----------\nfunction renderKPI() {\n  const n = TASKS.length, done = TASKS.filter(t => t.done).length, late = TASKS.filter(t => t.st === 'late').length;\n  const key = TASKS.filter(t => t.key), keyDone = key.filter(t => t.done).length, keyNext = key.filter(t => t.due && !t.done && (t.due - today) / DAY <= 14).length;\n  const nod = TASKS.filter(t => !t.due && !t.done).length;\n  const k = [['Complete', `${n ? Math.round(done / n * 100) : 0}%`, '', `${done} \u0e08\u0e32\u0e01 ${n} task`], ['\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14', late, late ? 'bad' : '', '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48 Complete \u0e41\u0e25\u0e30\u0e40\u0e25\u0e22 Due'],\n    ['Key Deliverable', `${keyDone}/${key.length}`, '', `\u0e04\u0e23\u0e1a\u0e43\u0e19 14 \u0e27\u0e31\u0e19: ${keyNext}`], ['\u0e44\u0e21\u0e48\u0e21\u0e35 Due date', nod, nod ? 'warn' : '', '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48 Complete']];\n  document.getElementById('kpis').innerHTML = k.map(([l, v, c, s]) => `<div class=\"kpi ${c}\"><div class=\"l\">${l}<\/div><div class=\"v num\">${v}<\/div><div class=\"l\">${s}<\/div><\/div>`).join('');\n}\n\n// ---------- Workstream ----------\nfunction renderTabs() {\n  document.getElementById('tabs').innerHTML = GROUPS.map(g => {\n    const ts = TASKS.filter(t => t.g.id === g.id), d = ts.filter(t => t.done).length;\n    return `<button type=\"button\" class=\"tab\" role=\"tab\" id=\"tab-${g.id}\" data-g=\"${g.id}\" aria-selected=\"${g.id === tab}\"><span class=\"dot\" style=\"background:${g.c}\"><\/span>${g.n} <span class=\"num\" style=\"opacity:.7\">${d}/${ts.length}<\/span><\/button>`;\n  }).join('');\n}\n// ---------- Progress \u0e23\u0e32\u0e22 Workstream: timeline \u0e22\u0e48\u0e2d\u0e22 + Key Deliverable \u0e15\u0e48\u0e2d workstream \u0e22\u0e48\u0e2d\u0e22 ----------\nfunction kdStatus(t) {\n  const n = t.due ? Math.round((t.due - today) / DAY) : null;\n  if (t.done) return ['done', '\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27' + (t.doneAt ? ' ' + fmt(t.doneAt) : '')];\n  if (t.st === 'late') return ['late', `\u0e14\u0e35\u0e40\u0e25\u0e22\u0e4c ${-n} \u0e27\u0e31\u0e19`];\n  if (t.st === 'soon') return ['soon', n === 0 ? '\u0e04\u0e23\u0e1a\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49' : `\u0e2d\u0e35\u0e01 ${n} \u0e27\u0e31\u0e19`];\n  if (n == null) return ['plan', '\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48'];\n  return ['plan', `\u0e15\u0e32\u0e21\u0e41\u0e1c\u0e19 \u2022 \u0e2d\u0e35\u0e01 ${n} \u0e27\u0e31\u0e19`];\n}\nconst bName = (b) => b.replace(/^\\d{4}\\s*/, '').replace(/^(Seminar|Exhibition|Activity|Logistic|PMO|Platform) \u2013 /, '');\nfunction renderWS() {\n  const g = GROUPS.find(x => x.id === tab), body = document.getElementById('wsBody');\n  const ts = TASKS.filter(t => t.g.id === g.id);\n  const buckets = [...new Set(ts.map(t => t.bucket))].sort();\n  const done = ts.filter(t => t.done).length, late = ts.filter(t => t.st === 'late').length, pct = ts.length ? Math.round(done / ts.length * 100) : 0;\n  body.innerHTML = `\n    <div class=\"panel-head\" style=\"margin:0\">\n      <div><h3 style=\"font-size:18px;color:${g.c}\">${esc(g.n)}<\/h3><div class=\"note\">${buckets.length > 1 ? buckets.length + ' workstream \u0e22\u0e48\u0e2d\u0e22 \u2022 ' : ''}${ts.length} task${late ? ` \u2022 <span style=\"color:var(--bad);font-weight:700\">\u0e14\u0e35\u0e40\u0e25\u0e22\u0e4c ${late}<\/span>` : ''}<\/div><\/div>\n      <div class=\"progress\" style=\"min-width:240px\"><span class=\"num\" style=\"font-weight:700;color:var(--ink)\">${pct}%<\/span><div class=\"bar\"><span style=\"width:${pct}%;background:${g.c}\"><\/span><\/div><span class=\"num\">${done}/${ts.length}<\/span><\/div>\n    <\/div>\n    ${buckets.map((b, i) => {\n      const bt = ts.filter(t => t.bucket === b), bd = bt.filter(t => t.done).length, bl = bt.filter(t => t.st === 'late').length, p = Math.round(bd / bt.length * 100);\n      const kd = bt.filter(t => t.key || t.done).sort((a, c) => (a.due || 1e15) - (c.due || 1e15));\n      const list = kd.length ? kd : bt.filter(t => !t.done && t.due).sort((a, c) => a.due - c.due).slice(0, 3);\n      const pill = bl ? '<span class=\"rag r\">\u0e14\u0e35\u0e40\u0e25\u0e22\u0e4c<\/span>' : p === 100 ? '<span class=\"rag g\">\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27<\/span>' : '<span class=\"rag g\" style=\"background:var(--g01)\">\u0e15\u0e32\u0e21\u0e41\u0e1c\u0e19<\/span>';\n      return `<div class=\"subws\">\n        <div class=\"top\"><h4>${esc(bName(b))} ${pill}<\/h4>\n          <div class=\"progress\" style=\"min-width:200px\"><span class=\"num\">${p}%<\/span><div class=\"bar\"><span style=\"width:${p}%;background:${g.c}\"><\/span><\/div><span class=\"num\">${bd}/${bt.length}${bl ? ` \u2022 <span style=\"color:var(--bad)\">\u0e14\u0e35\u0e40\u0e25\u0e22\u0e4c ${bl}<\/span>` : ''}<\/span><\/div><\/div>\n        <div class=\"scroll\"><svg id=\"sw${i}\" role=\"img\" aria-label=\"Timeline ${esc(bName(b))}\"><\/svg><\/div>\n        <div class=\"eyebrow\">${kd.length ? 'Key Deliverable' : '\u0e44\u0e21\u0e48\u0e21\u0e35 Key Deliverable \u2022 \u0e07\u0e32\u0e19\u0e16\u0e31\u0e14\u0e44\u0e1b'}<\/div>\n        <div class=\"kdl\">${list.map(t => { const [c, txt] = kdStatus(t); return `<div class=\"k\">${icon(t.st)}<span class=\"num muted\">${fmt(t.due)}<\/span><span>${t.done ? `<s class=\"done-t\">${esc(t.name)}<\/s>` : esc(t.name)}<\/span><span class=\"s ${c}\">${txt}<\/span><\/div>`; }).join('') || '<div class=\"note\">\u0e17\u0e38\u0e01\u0e07\u0e32\u0e19\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e41\u0e25\u0e49\u0e27<\/div>'}<\/div>\n      <\/div>`;\n    }).join('')}`;\n  const [T0, T1] = range();\n  buckets.forEach((b, i) => {\n    const svg = document.getElementById('sw' + i);\n    const W = Math.max(svg.parentElement.clientWidth, 760), x0 = 10, x1 = W - 10;\n    const bt = ts.filter(t => t.bucket === b && t.due).sort((p, q) => p.due - q.due);\n    const hasKey = bt.some(t => t.key);\n    const Xp = (d) => x0 + (Math.max(T0, Math.min(T1, d)) - T0) / (T1 - T0) * (x1 - x0);\n    const L = layoutLabels(bt.filter(t => hasKey ? (t.key || t.done) : true), Xp, 4, W - 4);\n    const cy = 24 + 14 + Math.max(1, L.ups) * LH, H = cy + 14 + Math.max(1, L.dns) * LH + 8;\n    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);\n    const X = axis(svg, x0, x1, T0, T1, 0, H);\n    el('line', { x1: x0, x2: x1, y1: cy, y2: cy, stroke: 'var(--line)', 'stroke-width': 2 }, svg);\n    bt.forEach(t => { if (t.start && t.start < t.due) el('rect', { x: X(t.start), y: cy - 2, width: Math.max(1, X(t.due) - X(t.start)), height: 4, rx: 2, fill: t.done ? 'var(--ok)' : t.st === 'late' ? 'var(--bad)' : g.c, opacity: t.done ? .5 : .25 }, svg); });\n    drawLabels(svg, L, cy, g.c);\n    bt.forEach(t => mark(svg, X(t.due), cy, t.key ? 7 : 4.5, t.st === 'late' ? 'var(--bad)' : g.c, t, t.key));\n  });\n}\n\nfunction renderNext() {\n  const rows = TASKS.filter(t => t.due && !t.done && (t.due - today) / DAY <= 14).sort((a, b) => a.due - b.due);\n  document.getElementById('next').innerHTML = rows.slice(0, 12).map(t => `<div class=\"row\"><span class=\"d\">${fmt(t.due)}<\/span>\n    <span>${t.key ? '<span class=\"lab kd\">KEY<\/span> ' : ''}${esc(t.name)}<br><span class=\"note\">${esc(t.bucket)}<\/span><\/span>\n    <span class=\"pill ${ST[t.st][1]}\">${ST[t.st][0]}<\/span><\/div>`).join('') + (rows.length > 12 ? `<div class=\"note\" style=\"padding-top:8px\">\u0e41\u0e25\u0e30\u0e2d\u0e35\u0e01 ${rows.length - 12} task<\/div>` : '')\n    || '<div class=\"empty\">\u0e44\u0e21\u0e48\u0e21\u0e35 task \u0e17\u0e35\u0e48\u0e04\u0e23\u0e1a\u0e01\u0e33\u0e2b\u0e19\u0e14\u0e43\u0e19 14 \u0e27\u0e31\u0e19<\/div>';\n}\nfunction renderDQ() {\n  const bs = [...new Set(TASKS.map(t => t.bucket))].sort();\n  document.getElementById('dq').innerHTML = `<thead><tr><th>Bucket<\/th><th>\u0e40\u0e2a\u0e23\u0e47\u0e08<\/th><th>\u0e40\u0e25\u0e22<\/th><th style=\"width:30%\">\u0e04\u0e27\u0e32\u0e21\u0e04\u0e37\u0e1a\u0e2b\u0e19\u0e49\u0e32<\/th><\/tr><\/thead><tbody>` +\n    bs.map(b => { const ts = TASKS.filter(t => t.bucket === b), d = ts.filter(t => t.done).length, l = ts.filter(t => t.st === 'late').length, p = Math.round(d / ts.length * 100);\n      return `<tr><td><span style=\"display:inline-block;width:8px;height:8px;border-radius:50%;background:${ts[0].g.c};margin-right:6px\"><\/span>${esc(b)}<\/td>\n      <td class=\"num\">${d}/${ts.length}<\/td><td class=\"num\" style=\"color:${l ? 'var(--bad)' : 'var(--muted)'}\">${l}<\/td>\n      <td><div class=\"bar\"><span style=\"width:${p}%;background:var(--ok)\"><\/span><\/div><\/td><\/tr>`; }).join('') + '<\/tbody>';\n}\n\nfunction renderAll() {\n  TASKS = normalize((preview || DATA.plan) || []);\n  document.getElementById('days').textContent = Math.max(0, Math.round((parseD(EVENT[0]) - today) / DAY));\n  document.getElementById('asof').textContent = preview ? `\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e08\u0e32\u0e01\u0e44\u0e1f\u0e25\u0e4c ${previewName} (\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48)` : `\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49 ${fmtY(today)} \u2022 \u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25: ${DATA.meta.source} \u2022 \u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15 ${fmtY(parseD(DATA.meta.updated))}`;\n  renderExec(); renderOverview(); renderTabs(); renderWS();\n}\ndocument.getElementById('modeSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.mode;\n  document.querySelectorAll('#modeSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderOverview(); });\ndocument.getElementById('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.g; wsFilter = 'all';\n  try { localStorage.setItem('spark2027-tab-v2', tab); } catch (er) {} renderTabs(); renderWS(); });\n// ---------- \u0e1c\u0e39\u0e49\u0e14\u0e39\u0e41\u0e25: \u0e43\u0e2a\u0e48\u0e23\u0e2b\u0e31\u0e2a \u2192 \u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14 export \u2192 \u0e14\u0e39\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07 \u2192 \u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48 (artifact.publish) ----------\nconst $ = (id) => document.getElementById(id);\n$('adOpen').addEventListener('click', () => { $('adLock').hidden = false; $('adCode').focus(); });\nfunction unlock() {\n  if ($('adCode').value.trim() === '12345') { $('adLock').hidden = true; $('adOpen').hidden = true; $('adTools').hidden = false; $('adMsg').textContent = ''; }\n  else { $('adMsg').textContent = '\u0e23\u0e2b\u0e31\u0e2a\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07'; $('adCode').select(); }\n}\n$('adGo').addEventListener('click', unlock);\n$('adCode').addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });\n$('file').addEventListener('change', async (e) => {\n  const f = e.target.files[0]; if (!f) return; const note = $('srcNote');\n  try {\n    if (typeof XLSX === 'undefined') throw new Error('\u0e42\u0e2b\u0e25\u0e14\u0e15\u0e31\u0e27\u0e2d\u0e48\u0e32\u0e19 Excel \u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e25\u0e2d\u0e07\u0e23\u0e35\u0e40\u0e1f\u0e23\u0e0a\u0e2b\u0e19\u0e49\u0e32');\n    const wb = XLSX.read(await f.arrayBuffer(), { cellDates: true });\n    const name = wb.SheetNames.find(n => { const r = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 })[0] || []; return r.includes('Task Name'); });\n    if (!name) throw new Error('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e0a\u0e35\u0e15\u0e17\u0e35\u0e48\u0e21\u0e35\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c \"Task Name\" \u2014 \u0e43\u0e0a\u0e49\u0e44\u0e1f\u0e25\u0e4c\u0e08\u0e32\u0e01 Planner > Export plan to Excel');\n    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: true });\n    const keep = ['Task ID', 'Task Name', 'Bucket', 'Status', 'Priority', 'Assigned To', 'Start date', 'Due date', 'Labels', 'Completed Date'];\n    preview = rows.map(r => { const o = {}; keep.forEach(k => { let v = r[k]; if (v instanceof Date) v = `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`; o[k] = v ?? null; }); return o; });\n    previewName = f.name; renderAll();\n    $('adPub').hidden = false; $('adCancel').hidden = false;\n    note.textContent = `\u0e2d\u0e48\u0e32\u0e19\u0e44\u0e14\u0e49 ${preview.length} task \u2014 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e41\u0e2a\u0e14\u0e07\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e40\u0e09\u0e1e\u0e32\u0e30\u0e43\u0e19\u0e2b\u0e19\u0e49\u0e32\u0e08\u0e2d\u0e19\u0e35\u0e49 \u0e15\u0e23\u0e27\u0e08\u0e41\u0e25\u0e49\u0e27\u0e01\u0e14 \"\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e43\u0e2b\u0e49\u0e17\u0e38\u0e01\u0e04\u0e19\u0e40\u0e2b\u0e47\u0e19\"`;\n  } catch (err) { note.textContent = '\u0e2d\u0e48\u0e32\u0e19\u0e44\u0e1f\u0e25\u0e4c\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49: ' + err.message; }\n  e.target.value = '';\n});\n$('adCancel').addEventListener('click', () => { preview = null; $('adPub').hidden = true; $('adCancel').hidden = true; $('srcNote').textContent = ''; renderAll(); });\n$('adPub').addEventListener('click', async () => {\n  const note = $('srcNote'); if (!preview) return;\n  const art = (typeof claude !== 'undefined' && claude.use) ? await claude.use('artifact') : null;\n  if (!art) { note.textContent = '\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e08\u0e32\u0e01\u0e2b\u0e19\u0e49\u0e32\u0e08\u0e2d\u0e19\u0e35\u0e49\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49 (\u0e40\u0e1b\u0e34\u0e14\u0e1c\u0e48\u0e32\u0e19 claude.ai \u0e14\u0e49\u0e27\u0e22\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e17\u0e35\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e41\u0e01\u0e49\u0e44\u0e02)'; return; }\n  const bytes = Uint8Array.from(atob(SHELL), c => c.charCodeAt(0));\n  const shell = new TextDecoder().decode(bytes);\n  const t = new Date(), iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;\n  const data = JSON.stringify({ plan: preview, meta: { source: 'Planner export (' + previewName + ')', updated: iso } }).replace(/<\/g, '\\\\u003c');\n  const html = shell.split('__DA' + 'TA__').join(data).split('__SH' + 'ELL__').join(SHELL);\n  $('adPub').disabled = true; note.textContent = '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u2026';\n  try { await art.publish(html); note.textContent = '\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e41\u0e25\u0e49\u0e27 \u2014 \u0e2b\u0e19\u0e49\u0e32\u0e08\u0e30\u0e42\u0e2b\u0e25\u0e14\u0e43\u0e2b\u0e21\u0e48'; }\n  catch (err) {\n    const c = err && err.code;\n    note.textContent = c === 'not_writer' || c === 'not_granted' || c === 'consent_required' ? '\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e19\u0e35\u0e49\u0e14\u0e39\u0e44\u0e14\u0e49\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27 \u0e44\u0e21\u0e48\u0e21\u0e35\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48' :\n      c === 'conflict' ? '\u0e21\u0e35\u0e04\u0e19\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32 \u0e2b\u0e19\u0e49\u0e32\u0e08\u0e30\u0e42\u0e2b\u0e25\u0e14\u0e40\u0e1b\u0e47\u0e19\u0e40\u0e27\u0e2d\u0e23\u0e4c\u0e0a\u0e31\u0e19\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14' : c === 'too_large' ? '\u0e44\u0e1f\u0e25\u0e4c\u0e43\u0e2b\u0e0d\u0e48\u0e40\u0e01\u0e34\u0e19\u0e44\u0e1b' : '\u0e40\u0e1c\u0e22\u0e41\u0e1e\u0e23\u0e48\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07';\n    $('adPub').disabled = false;\n  }\n});\nlet rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { renderExec(); renderOverview(); renderWS(); }, 150); });\n(document.getElementById('stations')||document.createElement('div')).addEventListener('keydown', e => { if (e.target.classList.contains('ed') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });\n(document.getElementById('stations')||document.createElement('div')).addEventListener('focusout', e => { const s = e.target; if (!s.classList || !s.classList.contains('ed')) return;\n  const v = s.innerText.trim(), k = s.dataset.k; if (v && v !== s.dataset.orig) MTG[k] = v; if (!v) delete MTG[k];\n  try { localStorage.setItem(MTG_KEY, JSON.stringify(MTG)); } catch (er) {} renderExec(); });\n(document.getElementById('stations')||document.createElement('div')).addEventListener('focusin', e => { const s = e.target; if (s.classList && s.classList.contains('ed')) s.dataset.orig = s.innerText.trim(); });\ndocument.getElementById('splitBtn').addEventListener('click', e => { split = !split; e.currentTarget.setAttribute('aria-pressed', split);\n  if (split && mode !== 'key') { mode = 'key'; document.querySelectorAll('#modeSeg button').forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === 'key')); }\n  renderOverview(); });\ndocument.getElementById('pptBtn').addEventListener('click', () => {\n  try { if (parent && parent.exportTimelinePPTX) { parent.exportTimelinePPTX(); return; } } catch (er) {}\n  alert('\u0e40\u0e1b\u0e34\u0e14\u0e44\u0e1f\u0e25\u0e4c Dashboard \u0e2b\u0e25\u0e31\u0e01\u0e41\u0e25\u0e49\u0e27\u0e01\u0e14\u0e1b\u0e38\u0e48\u0e21 Export Timeline PPT \u0e17\u0e35\u0e48\u0e40\u0e21\u0e19\u0e39\u0e14\u0e49\u0e32\u0e19\u0e1a\u0e19');\n});\nrenderAll();\n<\/script>\n<\/body><\/html>";
function tlHTML(){const im=importedSrc()||{file:EMBED_META.file,exported:EMBED_META.exported,at:new Date().toISOString()};
  const a=TIMELINE_HTML.indexOf('const DATA = '),b=TIMELINE_HTML.indexOf('\nconst SHELL',a);if(a<0||b<0)return TIMELINE_HTML;
  const rows=db.map(t=>({'Task ID':t.id,'Task Name':t.name,'Bucket':t.srcBucket,'Status':t.planner,'Priority':t.priority,'Assigned To':t.owner||null,
    'Start date':t.start||null,'Due date':t.due||null,'Late':'false','Labels':t.labels||'','Completed Checklist Items':null,'Completed Date':t.done||null}));
  const data=JSON.stringify({plan:rows,meta:{source:'Planner export ('+im.file+')',updated:im.exported||im.at.slice(0,10)}}).replace(/</g,'\\u003c');
  return TIMELINE_HTML.slice(0,a)+'const DATA = '+data+';'+TIMELINE_HTML.slice(b);}
function renderTimeline(){var f=document.getElementById("tlFrame");if(!f||f.dataset.loaded)return;f.srcdoc=tlHTML();f.dataset.loaded="1"}
const BG_SUB = {
 '01Seminar': [
   {n:'ภาพรวม Seminar', re:/^0100/},
   {n:'Main Stage Sessions', re:/^010[1-2]/},
   {n:'Content Sessions', re:/^010[3-6]/},
   {n:'Special Programs', re:/^010[7-8]/}
 ],
 '02Exhibition': [
   {n:'ภาพรวม Exhibition', re:/^0200/},
   {n:'Theme Zones', re:/^020[1-5]|^02Exhibition/},
   {n:'Experience Zones', re:/^020[6-8]/}
 ],
 '99PMO Tasks': [
   {n:'Governance & Meetings', re:/^9901/},
   {n:'Procurement & Documents', re:/^990[3-4]/},
   {n:'Souvenir & Awards', re:/^9902/},
   {n:'Carbon Neutral Event', re:/^9905/}
 ],
 '07Activity': [
   {n:'Stakeholder Workshop', re:/^06_03/},
   {n:'Globe Stage', re:/^06_04/}
 ],
 '09On_event': [
   {n:'Logistic & Catering', re:/^07_01/},
   {n:'Venue & Security', re:/^07_02/}
 ]
};
function subOf(wsKey, bucket){
  const list = BG_SUB[wsKey];
  if(!list) return null;
  const hit = list.find(s=>s.re.test(bucket));
  return hit ? hit.n : 'อื่น ๆ';
}
function bgGroups(){
  const o={};
  db.forEach(t=>{const w=t.ws,b=bucketLabel(t.srcBucket);(o[w]=o[w]||{});(o[w][b]=o[w][b]||[]).push(t)});
  return o;
}
function clearBG(){['bgq','bgw'].forEach(i=>{const e=document.getElementById(i);if(e)e.value=''});
  const s=document.getElementById('bgs');if(s)s.value='code';renderBG()}
function bgCard(wsKey,b,list){
  const z=agg(list), sc=score(list), c=cls(list);
  const m=[['Total',z.total,'','#1F4E79'],['Done',z.completed,'Completed','#4472C4'],
           ['Due Soon',z.due,'Due Soon','#F59E0B'],['Slight',z.slip,'Slightly Delayed','#ED7D31'],['Delayed',z.delayed,'Delayed','#C00000']];
  return '<article class="bcard">'
    +'<div class="btitle" title="'+esc(b)+'" onclick="bgOpen(\''+esc(wsKey)+'\',\''+esc(b)+'\',\'\')">'+esc(b)+'</div>'
    +'<div class="bgrow"><div class="bgauge-a">'+gaugeSVG(sc)+'</div>'
    +'<div class="bscore"><b style="color:'+(sc<60?'#C00000':sc<80?'#D97706':'#1F4E79')+'">'+sc+'</b><small>HEALTH</small></div></div>'
    +'<div class="bstate" style="background:'+c[1]+'">'+c[0]+'</div>'
    +'<div class="bmetrics">'+m.map(x=>'<button class="bmetric" style="--c:'+x[3]+'" onclick="bgOpen(\''+esc(wsKey)+'\',\''+esc(b)+'\',\''+x[2]+'\')"><b>'+x[1]+'</b>'+x[0]+'</button>').join('')+'</div>'
    +'</article>';
}
// Bands: workstreams listed together are rendered as ONE section with all gauges on a single row.
const BG_BAND_SUB = {
  'SPECIAL ACTIVITIES': [
    {n:'SPARK SENSE', re:/^06_02/},
    {n:'ACTIVITY (SPARK LAB, THE GLOBE STAGE)', re:/^06_0[34]/},
    {n:'SPARK HACK', re:/^06_01/}
  ]
};
function bandSubOf(bandTitle, bucket){
  const list = BG_BAND_SUB[bandTitle];
  if(!list) return null;
  const hit = list.find(x=>x.re.test(bucket));
  return hit ? hit.n : 'อื่น ๆ';
}
const BG_ROWS = [
  {keys:['99PMO Tasks'], title:'PMO', code:'99', tone:'pmo'},
  {keys:['01Seminar'], tone:'core'},
  {keys:['02Exhibition'], tone:'core'},
  {keys:['06Spark Sense','07Activity','08Spark Hack'], title:'SPECIAL ACTIVITIES', code:'06', tone:'core'},
  {keys:['09On_event'], title:'ON EVENT', code:'09', tone:'core'},
  {keys:['03Media and PR','04Website','05Regis. & Guest'], title:'ENABLER · PR / PLATFORM / GUEST', code:'03', tone:'enab'}
];
const TONE={
  pmo:'linear-gradient(135deg,#4b3d88,#6c4aa2 46%,#372e63)',
  core:'linear-gradient(135deg,#1272b6,#2f6fdc 48%,#15487f)',
  enab:'linear-gradient(135deg,#c06a33,#e28f4f 46%,#99501f)'
};
function renderBG(){
  const q=(document.getElementById('bgq')||{}).value||'', w=(document.getElementById('bgw')||{}).value||'',
        sort=(document.getElementById('bgs')||{}).value||'code';
  const sel=document.getElementById('bgw');
  if(sel&&!sel.options.length){
    sel.innerHTML='<option value="">ทุก Workstream</option>'+WS.map(x=>'<option value="'+esc(x.key)+'">'+esc(x.code+' '+x.name)+'</option>').join('');
  }
  const groups=bgGroups(); let html='', nB=0, nT=0;
  const rank=(g)=>(a,b)=>{
    if(sort==='low')return score(g[a].list)-score(g[b].list);
    if(sort==='high')return score(g[b].list)-score(g[a].list);
    if(sort==='late')return cnt(g[b].list,'Delayed')-cnt(g[a].list,'Delayed');
    return a.localeCompare(b,'th');
  };
  BG_ROWS.forEach(band=>{
    const keys=band.keys.filter(k=>!w||k===w);
    if(!keys.length)return;
    // collect every bucket across the workstreams in this band
    const map={}, all=[];
    keys.forEach(k=>{
      const g=groups[k]; if(!g)return;
      Object.keys(g).forEach(b=>{
        if(q&&b.toLowerCase().indexOf(q.toLowerCase())<0)return;
        map[b]={ws:k,list:g[b]}; all.push.apply(all,g[b]);
      });
    });
    let names=Object.keys(map);
    if(!names.length)return;
    names.sort(rank(map));
    nB+=names.length; nT+=all.length;
    const za=agg(all);
    const single=keys.length===1, wsDef=WS.find(x=>x.key===keys[0]);
    const title=single?(wsDef?wsDef.name:keys[0]):(band.title||keys.join(' · '));
    const code=single?(wsDef?wsDef.code:''):(band.code||'');
    const sub=single?(names.length+' buckets · '+all.length+' tasks')
      :(keys.map(k=>{const d=WS.find(x=>x.key===k);return d?d.code+' '+d.name:k}).join('  ·  ')
        +'  —  '+names.length+' buckets · '+all.length+' tasks');
    html+='<section class="bg-grp"><div class="bg-head" style="background:'+TONE[band.tone]+'">'
      +'<span class="bg-code">'+code+'</span>'
      +'<span><span class="bg-name">'+esc(title)+'</span><br><span class="bg-sub">'+esc(sub)+'</span></span>'
      +'<span class="bg-stat">'
      +'<span class="bg-chip">Health '+score(all)+'</span>'
      +'<span class="bg-chip">Completed '+za.completed+'</span>'
      +(za.due?'<span class="bg-chip">Due Soon '+za.due+'</span>':'')
      +(za.delayed?'<span class="bg-chip late">Delayed '+za.delayed+'</span>':'')
      +'</span></div>';
    // Seminar and Exhibition keep their labelled sub-clusters; every other band is one flat row.
    const useSub=single&&BG_SUB[keys[0]]&&(keys[0]==='01Seminar'||keys[0]==='02Exhibition');
    if(useSub){
      const subs={},order=[];
      names.forEach(b=>{const sn=subOf(keys[0],b)||'อื่น ๆ';if(!subs[sn]){subs[sn]=[];order.push(sn)}subs[sn].push(b)});
      const defOrder=(BG_SUB[keys[0]]||[]).map(x=>x.n);
      order.sort((a,b)=>{const ia=defOrder.indexOf(a),ib=defOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)});
      order.forEach(sn=>{
        const bl=subs[sn], sl=bl.reduce((a,k)=>a.concat(map[k].list),[]), zs=agg(sl);
        html+='<div class="bg-sub-grp"><div class="bg-sub-head">'
          +'<span class="bg-sub-name">'+esc(sn)+'</span>'
          +'<span class="bg-sub-meta">'+bl.length+' bucket · '+sl.length+' task · Health '+score(sl)
          +(zs.delayed?' · <b style="color:#C00000">Delayed '+zs.delayed+'</b>':'')+'</span>'
          +'</div><div class="bg-cards bg-row" style="--n:'+bl.length+'">'
          +bl.map(b=>bgCard(map[b].ws,b,map[b].list)).join('')+'</div></div>';
      });
    } else if(!single && BG_BAND_SUB[band.title]){
      // multi-workstream band that defines labelled sub-clusters
      const subs={}, order=[];
      names.forEach(b=>{const sn=bandSubOf(band.title,b)||'อื่น ๆ';if(!subs[sn]){subs[sn]=[];order.push(sn)}subs[sn].push(b)});
      const defOrder=(BG_BAND_SUB[band.title]||[]).map(x=>x.n);
      order.sort((a,b)=>{const ia=defOrder.indexOf(a),ib=defOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)});
      html+='<div class="bg-sub-row" style="--k:'+order.length+'">';
      order.forEach(sn=>{
        const bl=subs[sn], sl=bl.reduce((a,k)=>a.concat(map[k].list),[]), zs=agg(sl);
        html+='<div class="bg-sub-grp" style="--w:'+bl.length+'"><div class="bg-sub-head">'
          +'<span class="bg-sub-name">'+esc(sn)+'</span>'
          +'<span class="bg-sub-meta">'+bl.length+' bucket · '+sl.length+' task · Health '+score(sl)
          +(zs.delayed?' · <b style="color:#C00000">Delayed '+zs.delayed+'</b>':'')+'</span>'
          +'</div><div class="bg-cards bg-row" style="--n:'+bl.length+'">'
          +bl.map(b=>bgCard(map[b].ws,b,map[b].list)).join('')+'</div></div>';
      });
      html+='</div>';
    } else {
      html+='<div class="bg-cards bg-row" style="--n:'+names.length+'">'
        +names.map(b=>bgCard(map[b].ws,b,map[b].list)).join('')+'</div>';
    }
    html+='</section>';
  });
  const shown=db.filter(t=>(!w||t.ws===w)&&(!q||bucketLabel(t.srcBucket).toLowerCase().indexOf(q.toLowerCase())>=0));
  const z=agg(shown);
  document.getElementById('bgSums').innerHTML=[['Buckets',nB,'#1F4E79'],['Tasks',nT,'#2563EB'],
    ['Portfolio Health',score(shown),'#7E22CE'],['Completed',z.completed,'#4472C4'],
    ['Due Soon',z.due,'#F59E0B'],['Delayed',z.delayed,'#C00000']]
    .map(x=>'<div class="sum" style="--c:'+x[2]+'"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('');
  document.getElementById('bgCount').textContent=nB+' bucket · '+nT+' task';
  document.getElementById('bgBody').innerHTML=html||'<p class="edempty">ไม่พบ Bucket ตามเงื่อนไขที่เลือก</p>';
  animateNeedles();
}
function bgOpen(ws,bucket,st){openDetail(ws,st,bucket)}
function loadPptx(cb){if(window.PptxGenJS)return cb();const x=document.createElement('script');
 x.src='https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';x.onload=cb;
 x.onerror=function(){toast('โหลดไลบรารี PowerPoint ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต')};document.head.appendChild(x);}
function exportPPTX(){toast('กำลังสร้างไฟล์ PowerPoint');loadPptx(buildPPTX);}
function buildPPTX(){
 compute();const p=new PptxGenJS();p.layout='LAYOUT_WIDE';const F='Tahoma',N='123E69';
 const snap=today().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
 const head=function(s,t){s.background={color:'F1F4F9'};s.addShape(p.ShapeType.rect,{x:0,y:0,w:13.33,h:0.85,fill:{color:N}});
  s.addText(t,{x:0.4,y:0.1,w:9.5,h:0.65,fontFace:F,fontSize:20,bold:true,color:'FFFFFF'});
  s.addText('Snapshot '+snap,{x:9.6,y:0.18,w:3.4,h:0.5,fontFace:F,fontSize:11,color:'D6E4F5',align:'right'});};
 const hc=function(t){return {text:t,options:{bold:true,color:'FFFFFF',fill:{color:N},align:'center'}}};
 const clr=function(c){return c.replace('#','')};
 let s=p.addSlide();head(s,'SPARK 2027 Executive Project Tracking');const z=agg(db);
 [['Total Tasks',z.total,'1F4E79'],['Portfolio Health',score(db),'2563EB'],['Completed',z.completed,'4472C4'],['Due Soon',z.due,'F59E0B'],['Slightly Delayed',z.slip,'ED7D31'],['Delayed',z.delayed,'C00000']]
 .forEach(function(k,i){const X=0.4+i*2.1;s.addShape(p.ShapeType.roundRect,{x:X,y:1.25,w:1.95,h:1.45,fill:{color:'FFFFFF'},line:{color:k[2],width:2},rectRadius:0.12});
  s.addText(String(k[1]),{x:X,y:1.32,w:1.95,h:0.85,fontFace:F,fontSize:34,bold:true,color:k[2],align:'center'});
  s.addText(k[0],{x:X,y:2.12,w:1.95,h:0.45,fontFace:F,fontSize:12,color:'475569',align:'center'});});
 s.addText([{text:'Status definition',options:{bold:true,color:N,breakLine:true}},
  {text:'Completed = สถานะ Planner Completed   •   Due Soon = ครบกำหนดภายใน 0–14 วัน   •   Slightly Delayed = เลยกำหนด 1–7 วัน   •   Delayed = เลยกำหนดเกิน 7 วัน',options:{breakLine:true}},
  {text:'Health Score = ค่าเฉลี่ยคะแนนสถานะ: Completed/On Plan 100 · Not Started 80 · Due Soon 75 · No Due Date 60 · Slightly Delayed 50 · Delayed 20'},
  ],{x:0.4,y:3.0,w:12.5,h:1.3,fontFace:F,fontSize:12,color:'334155',fill:{color:'FFFFFF'},line:{color:'DBE3EC'},margin:10});
 const wr=[[hc('Workstream'),hc('Tasks'),hc('Completed'),hc('Due Soon'),hc('Slightly Delayed'),hc('Delayed'),hc('Health'),hc('Status')]];
 WS.forEach(function(w){const a=of(w.key);if(!a.length)return;const q=agg(a),c=cls(a);
  wr.push([w.code+' '+w.name,q.total,q.completed,q.due,q.slip,q.delayed,score(a),{text:c[0],options:{color:'FFFFFF',fill:{color:clr(c[1])},bold:true}}].map(function(v,i){return typeof v==='object'?v:{text:String(v),options:{align:i?'center':'left'}}}));});
 s=p.addSlide();head(s,'Workstream Health');
 s.addTable(wr,{x:0.4,y:1.1,w:12.5,colW:[2.9,0.9,1.1,1.1,1.4,1,1,3.1],fontFace:F,fontSize:12,border:{type:'solid',color:'DBE3EC',pt:0.75},fill:{color:'FFFFFF'},rowH:0.42});
 const bk={};db.forEach(function(t){const b=bucketLabel(t.srcBucket);(bk[b]=bk[b]||[]).push(t)});
 const bn=Object.keys(bk).sort(function(a,b){return a.localeCompare(b,'th')});
 for(let i=0;i<bn.length;i+=16){s=p.addSlide();head(s,'Bucket Health ('+(i+1)+'–'+Math.min(i+16,bn.length)+' / '+bn.length+')');
  const r=[[hc('Bucket'),hc('Tasks'),hc('Done'),hc('Due Soon'),hc('Slight'),hc('Delayed'),hc('Health'),hc('Status')]];
  bn.slice(i,i+16).forEach(function(b){const a=bk[b],q=agg(a),c=cls(a);
   r.push([b,q.total,q.completed,q.due,q.slip,q.delayed,score(a),{text:c[0].split(' | ')[0],options:{color:'FFFFFF',fill:{color:clr(c[1])},bold:true,align:'center'}}].map(function(v,k){return typeof v==='object'?v:{text:String(v),options:{align:k?'center':'left'}}}));});
  s.addTable(r,{x:0.4,y:1.05,w:12.5,colW:[4.6,0.9,0.9,1.1,1,1,1,2],fontFace:F,fontSize:10.5,border:{type:'solid',color:'DBE3EC',pt:0.75},fill:{color:'FFFFFF'},rowH:0.36});}
 const cr=db.filter(function(t){return ['Delayed','Slightly Delayed','Due Soon'].indexOf(t.status)>=0})
  .sort(function(a,b){const ia=WS.findIndex(function(w){return w.key===a.ws}),ib=WS.findIndex(function(w){return w.key===b.ws});return ia!==ib?ia-ib:(a.due||'').localeCompare(b.due||'')});
 for(let i=0;i<cr.length;i+=14){s=p.addSlide();head(s,'Critical Task List ('+(i+1)+'–'+Math.min(i+14,cr.length)+' / '+cr.length+')');
  const r=[[hc('Workstream'),hc('Task'),hc('Status'),hc('Owner'),hc('Due'),hc('Days')]];
  cr.slice(i,i+14).forEach(function(t){r.push([{text:wsLabel(t.ws)},{text:t.name},{text:t.status,options:{color:'FFFFFF',fill:{color:clr(t.color)},bold:true,align:'center'}},
   {text:String(t.owner||'ต้องตรวจสอบ').split(';')[0]},{text:fmt(t.due),options:{align:'center'}},{text:String(t.days),options:{align:'center'}}]);});
  s.addTable(r,{x:0.4,y:1.05,w:12.5,colW:[2.2,4.6,1.6,2.3,1.1,0.7],fontFace:F,fontSize:10.5,border:{type:'solid',color:'DBE3EC',pt:0.75},fill:{color:'FFFFFF'},rowH:0.4});}
 p.writeFile({fileName:'SPARK2027_Executive_'+new Date().toISOString().slice(0,10)+'.pptx'}).then(function(){toast('บันทึกไฟล์ PowerPoint แล้ว')});
}
function exportTimelinePPTX(){
 go('timeline'); const f=document.getElementById('tlFrame'); let tries=0;
 const run=function(){let w=null;try{w=f.contentWindow}catch(e){}
  if(!w||!w.pptImages){if(++tries>30){toast('โหลด Timeline ไม่สำเร็จ');return}return setTimeout(run,300)}
  toast('กำลังสร้าง PowerPoint Timeline 2 แผ่น');
  loadPptx(function(){w.pptImages().then(buildTimelinePPT).catch(function(e){console.error(e);toast('สร้างภาพ Timeline ไม่สำเร็จ')})});};
 setTimeout(run,400);
}
function buildTimelinePPT(imgs){
 const p=new PptxGenJS();p.layout='LAYOUT_WIDE';const F='Tahoma';
 const snap=today().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
 const T=['Timeline ภาพรวมตาม Bucket (1/2) · Core Workstream','Timeline ภาพรวมตาม Bucket (2/2) · Enabler, On Event & PMO'];
 const LEG='◆ Key Deliverable    ✓ Complete    ● แดง = เลยกำหนด    ● ส้ม = ครบใน 7 วัน    แถบเหลือง = วันงาน 15–16 ม.ค. 70    เส้นประ = วันนี้';
 imgs.forEach(function(im,i){
  const s=p.addSlide();s.background={color:'FFFFFF'};
  s.addShape(p.ShapeType.rect,{x:0,y:0,w:13.33,h:0.7,fill:{color:'123E69'}});
  s.addText(T[i]||'Timeline',{x:0.35,y:0.08,w:9.6,h:0.55,fontFace:F,fontSize:18,bold:true,color:'FFFFFF'});
  s.addText('Snapshot '+snap+' · Key Deliverable',{x:9.6,y:0.12,w:3.4,h:0.45,fontFace:F,fontSize:10,color:'D6E4F5',align:'right'});
  const bw=12.73,bh=6.1;let w=bw,hh=bw*im.h/im.w;if(hh>bh){hh=bh;w=bh*im.w/im.h}
  s.addImage({data:im.data,x:(13.33-w)/2,y:0.82,w:w,h:hh});
  s.addText(LEG,{x:0.3,y:7.05,w:12.7,h:0.35,fontFace:F,fontSize:10,color:'475569'});
 });
 p.writeFile({fileName:'SPARK2027_Timeline_2slides_'+new Date().toISOString().slice(0,10)+'.pptx'}).then(function(){toast('บันทึก PowerPoint Timeline แล้ว')});
}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2400)}

function refresh(){compute();buildFilters();renderDash();
  if(document.getElementById('detail').classList.contains('on'))renderDetail();
  if(document.getElementById('ana').classList.contains('on'))renderAna();
  if(document.getElementById('gantt').classList.contains('on'))renderGantt();}

// ===== Import Planner Excel =====
let impPending=null;
function fmtLocalDT(isoStr){const d=new Date(isoStr);if(isNaN(d))return'-';
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function showDataSrc(){const im=importedSrc(),el=document.getElementById('dataSrc');if(!el)return;
  const row=(k,v)=>'<div class="r"><span>'+k+'</span><em title="'+esc(v)+'">'+esc(v)+'</em></div>';
  if(im){el.innerHTML='<span class="tag imp">ข้อมูลจากไฟล์ที่ Import</span>'
    +row('ไฟล์',im.file)+row('Planner export',im.exported?fmt(im.exported):'-')+row('Import เมื่อ',fmtLocalDT(im.at))+row('จำนวนงาน',(im.tasks||[]).length+' tasks');}
  else{el.innerHTML='<span class="tag emb">ข้อมูลจาก data.json</span>'
    +row('ไฟล์',EMBED_META.file)+row('Planner export',fmt(EMBED_META.exported))+row('จำนวนงาน',db.length+' tasks');}
}
function openImport(){document.getElementById('impModal').classList.add('on');document.getElementById('impMsg').innerHTML='';document.getElementById('impPrev').innerHTML='';
  document.getElementById('impApply').style.display='none';document.getElementById('impRevert').style.display=importedSrc()?'':'none';impPending=null}
function closeImport(){document.getElementById('impModal').classList.remove('on')}
function loadXLSX(cb){if(window.XLSX)return cb();const x=document.createElement('script');x.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  x.onload=cb;x.onerror=function(){impMsg('<span style="color:#b91c1c">โหลดตัวอ่าน Excel ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต</span>')};document.head.appendChild(x)}
function impMsg(h){document.getElementById('impMsg').innerHTML=h}
function xIso(v){if(v==null||v==='')return'';if(v instanceof Date){const d=new Date(v.getTime()+12*36e5);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
  if(typeof v==='number'){const d=new Date(Math.round((v-25569)*864e5));return d.toISOString().slice(0,10)}
  const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');return''}
function xBucket(b){return String(b||'').trim().replace(/\\_/g,'_').replace(/^\d+\.\s*/,'')}
function xWs(b){const map=[['99','99PMO Tasks'],['01','01Seminar'],['02','02Exhibition'],['03','03Media and PR'],['04','04Website'],['05','05Regis. & Guest'],['06_01','08Spark Hack'],['06_02','06Spark Sense'],['06_0','07Activity'],['07','09On_event']];
  for(const [p,k] of map)if(b.indexOf(p)===0)return k;return'99PMO Tasks'}
function xPct(v){const m=String(v||'').match(/(\d+)\s*\/\s*(\d+)/);return m&&+m[2]?Math.round(+m[1]*100/+m[2]):''}
function parsePlanner(wb,fname){
  const looksId=v=>/^[A-Za-z0-9_\-]{26,30}$/.test(String(v||''));
  let name=wb.SheetNames.find(n=>/consolidated/i.test(n));
  if(!name)name=wb.SheetNames.find(n=>{const r=XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:null});return r.length&&'Task Name' in r[0]&&'Bucket' in r[0]&&!looksId(r[0]['Bucket'])});
  if(!name){const t=wb.SheetNames.find(n=>/^tasks$/i.test(n)),bs=wb.SheetNames.find(n=>/^buckets$/i.test(n));if(t&&bs)name=t}
  if(!name)throw new Error('ไม่พบชีตที่มีคอลัมน์ Task Name และ Bucket — ใช้ไฟล์จาก Planner → Export plan to Excel');
  let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:null});
  const bsn=wb.SheetNames.find(n=>/^buckets$/i.test(n));
  if(bsn&&rows.length&&looksId(rows[0]['Bucket'])){const bm={};XLSX.utils.sheet_to_json(wb.Sheets[bsn],{defval:null}).forEach(r=>bm[r['Bucket ID']]=r['Bucket Name']);
    const un=wb.SheetNames.find(n=>/^users$/i.test(n)),um={};if(un)XLSX.utils.sheet_to_json(wb.Sheets[un],{defval:null}).forEach(r=>um[r['User ID']]=r['User Name']);
    rows=rows.map(r=>Object.assign({},r,{Bucket:bm[r.Bucket]||r.Bucket,'Assigned To':String(r['Assigned To']||'').split(';').map(x=>um[x]||x).join(';')}))}
  let exported='';const pn=wb.SheetNames.find(n=>/^plan$/i.test(n));
  if(pn){const p=XLSX.utils.sheet_to_json(wb.Sheets[pn],{defval:null})[0];if(p)exported=xIso(p['Date of export'])}
  const prev={};db.forEach(t=>prev[t.id]=t);const seen={},out=[];
  rows.forEach(r=>{const n=String(r['Task Name']||'').trim();if(!n)return;const id=String(r['Task ID']||('X-'+out.length));if(seen[id])return;seen[id]=1;
    const b=xBucket(r['Bucket']),lab=String(r['Labels']||'').trim(),p=prev[id]||{};
    out.push({id:id,name:n,ws:xWs(b),srcBucket:b,goal:String(r['Goal']||''),planner:String(r['Status']||''),priority:String(r['Priority']||'Medium'),
      owner:String(r['Assigned To']||''),start:xIso(r['Start date']),due:xIso(r['Due date']),finish:xIso(r['Finish date']),done:xIso(r['Completed Date']),
      checklist:String(r['Checklist Items']||''),progress:xPct(r['Completed Checklist Items']),labels:lab,key:/key deliverable/i.test(lab),notes:String(r['Notes']||''),
      cur:p.cur||'',next:p.next||'',delay:p.delay||'',root:p.root||'',impact:p.impact||'',recovery:p.recovery||'',recDate:p.recDate||'',exec:p.exec||'',manual:p.manual||'',
      src:'Excel export '+(exported||fname)})});
  return {tasks:out,file:fname,exported:exported,sheet:name};
}
function diffTasks(a,b){const A={},B={};a.forEach(t=>A[t.id]=t);b.forEach(t=>B[t.id]=t);
  const add=b.filter(t=>!A[t.id]),rem=a.filter(t=>!B[t.id]),chg=[];const F={name:'ชื่องาน',srcBucket:'Bucket',planner:'สถานะ',owner:'ผู้รับผิดชอบ',start:'Start',due:'Due',done:'Completed',labels:'Labels',progress:'Checklist'};
  b.forEach(t=>{const o=A[t.id];if(!o)return;const f=Object.keys(F).filter(k=>String(o[k]==null?'':o[k])!==String(t[k]==null?'':t[k]));if(f.length)chg.push({t:t,o:o,f:f.map(k=>F[k])})});
  return {add:add,rem:rem,chg:chg}}
function handleImportFile(f){if(!f)return;if(!/\.xlsx?$/i.test(f.name)){impMsg('<span style="color:#b91c1c">กรุณาเลือกไฟล์ .xlsx</span>');return}
  impMsg('กำลังอ่านไฟล์ '+esc(f.name)+' …');
  loadXLSX(function(){const r=new FileReader();r.onload=function(){try{
      const wb=XLSX.read(new Uint8Array(r.result),{type:'array',cellDates:true});const res=parsePlanner(wb,f.name);
      if(!res.tasks.length)throw new Error('ไม่พบรายการงานในไฟล์');
      impPending=res;const d=diffTasks(db,res.tasks);
      const st={};res.tasks.forEach(t=>st[t.planner]=(st[t.planner]||0)+1);const nb=new Set(res.tasks.map(t=>t.srcBucket)).size;
      impMsg('<b style="color:#15803d">อ่านไฟล์สำเร็จ</b> · ชีต '+esc(res.sheet)+(res.exported?' · Date of export '+esc(res.exported):'')+'<br>'
        +'<b>'+res.tasks.length+'</b> tasks · <b>'+nb+'</b> buckets · '+Object.keys(st).map(k=>esc(k)+' '+st[k]).join(' · '));
      const li=(arr,fn)=>arr.slice(0,40).map(fn).join('')+(arr.length>40?'<li>… อีก '+(arr.length-40)+' รายการ</li>':'');
      document.getElementById('impPrev').innerHTML='<div class="sums" style="grid-template-columns:repeat(3,1fr)">'
        +'<div class="sum" style="--c:#15803d"><small>งานใหม่</small><b>'+d.add.length+'</b></div>'
        +'<div class="sum" style="--c:#2563eb"><small>งานที่ข้อมูลเปลี่ยน</small><b>'+d.chg.length+'</b></div>'
        +'<div class="sum" style="--c:#c00000"><small>งานที่ถูกลบ</small><b>'+d.rem.length+'</b></div></div>'
        +'<div style="max-height:34vh;overflow:auto;font-size:12px;line-height:1.7">'
        +(d.add.length?'<b>งานใหม่</b><ul>'+li(d.add,t=>'<li>'+esc(t.name)+' <small style="color:#64748b">('+esc(t.srcBucket)+')</small></li>')+'</ul>':'')
        +(d.chg.length?'<b>งานที่ข้อมูลเปลี่ยน</b><ul>'+li(d.chg,c=>'<li>'+esc(c.t.name)+' <small style="color:#64748b">('+esc(c.t.srcBucket)+')</small> — '+c.f.join(', ')+'</li>')+'</ul>':'')
        +(d.rem.length?'<b>งานที่ถูกลบ</b><ul>'+li(d.rem,t=>'<li>'+esc(t.name)+'</li>')+'</ul>':'')
        +(!d.add.length&&!d.chg.length&&!d.rem.length?'<p style="color:#64748b">ข้อมูลตรงกับที่แสดงอยู่แล้วทุกงาน</p>':'')+'</div>'
        +'<p style="font-size:11.5px;color:#64748b">ช่องที่กรอกเองใน Edit Data (Progress, Next step, Delay, Recovery, Executive support, Business status manual) จะถูกเก็บไว้ตาม Task ID</p>';
      document.getElementById('impApply').style.display='';
    }catch(e){console.error(e);impMsg('<span style="color:#b91c1c">อ่านไฟล์ไม่ได้: '+esc(e.message)+'</span>')}};r.readAsArrayBuffer(f)})}
function applyImport(){if(!impPending)return;const im={tasks:impPending.tasks,file:impPending.file,exported:impPending.exported,at:new Date().toISOString()};
  try{localStorage.setItem(IMP_KEY,JSON.stringify(im))}catch(e){toast('บันทึกในเบราว์เซอร์ไม่สำเร็จ');return}
  db=JSON.parse(JSON.stringify(im.tasks));persist();reloadAll();closeImport();toast('อัปเดตข้อมูล '+im.tasks.length+' tasks แล้ว')}
function revertImport(){if(!confirm('ลบข้อมูลที่ import และกลับไปใช้ข้อมูลจาก data.json?'))return;
  localStorage.removeItem(IMP_KEY);localStorage.removeItem(KEY);db=clone();reloadAll();closeImport();toast('กลับไปใช้ข้อมูลที่ฝังในไฟล์แล้ว')}
function reloadAll(){const f=document.getElementById('tlFrame');if(f){delete f.dataset.loaded;f.removeAttribute('srcdoc')}
  dqInit=false;refresh();showDataSrc();if(document.getElementById('bgauge').classList.contains('on'))renderBG();if(document.getElementById('timeline').classList.contains('on'))renderTimeline()}
(function(){const dz=document.getElementById('impDrop'),fi=document.getElementById('impFile');
  fi.addEventListener('change',e=>{handleImportFile(e.target.files[0]);e.target.value=''});
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.background='#e6f0fb'}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.background='#f6faff'}));
  dz.addEventListener('drop',e=>handleImportFile(e.dataTransfer.files[0]));})();
// ===== Boot: load data/data.json then render =====
async function boot(){
  try{
    const v='?v='+Date.now();
    const d=await fetch('data/data.json'+v).then(r=>{if(!r.ok)throw new Error('data.json HTTP '+r.status);return r.json()});
    SOURCE=d.tasks||[];
    EMBED_META={file:d.meta.file||'data.json',exported:d.meta.exported||'',tasks:SOURCE.length};
    KEY='spark2027_exec_db_'+(d.meta.exported||'')+'_'+SOURCE.length; // ข้อมูลใหม่ = ล้าง cache เก่าอัตโนมัติ
    db=initDb();
    refresh();showDataSrc();
    document.getElementById('nav-dash').classList.add('on');
  }catch(e){
    console.error(e);
    document.querySelector('.wrap').insertAdjacentHTML('afterbegin','<div class="sec" style="color:#b91c1c;font-weight:700">โหลดข้อมูลไม่สำเร็จ: '+esc(e.message)+' — ต้องเปิดผ่าน web server (เช่น python -m http.server) ไม่ใช่ดับเบิลคลิกไฟล์</div>');
  }
}
boot();

/* ===== Export PNG / SVG ===== */
(function () {
  var PROPS = ['display','position','top','right','bottom','left','z-index','float','clear',
  'width','height','min-width','min-height','max-width','max-height',
  'margin-top','margin-right','margin-bottom','margin-left',
  'padding-top','padding-right','padding-bottom','padding-left',
  'border-top-width','border-right-width','border-bottom-width','border-left-width',
  'border-top-style','border-right-style','border-bottom-style','border-left-style',
  'border-top-color','border-right-color','border-bottom-color','border-left-color',
  'border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius',
  'background-color','background-image','background-size','background-position','background-repeat',
  'box-shadow','color','font-family','font-size','font-weight','font-style','line-height',
  'letter-spacing','text-align','text-transform','text-decoration','text-overflow','text-shadow',
  'white-space','overflow','overflow-x','overflow-y','vertical-align','opacity','visibility',
  'flex-direction','flex-wrap','justify-content','align-items','align-content','gap','row-gap','column-gap',
  'grid-template-columns','grid-template-rows','grid-template-areas','grid-area','grid-column','grid-row',
  'list-style','border-collapse','table-layout','transform','transform-origin','fill','stroke','stroke-width'];

  function bgFallback() {
    var c = getComputedStyle(document.body).backgroundColor;
    return (c && c !== 'rgba(0, 0, 0, 0)') ? c : '#eef2f7';
  }

  function inline(src, dst) {
    var cs = getComputedStyle(src), txt = '';
    for (var i = 0; i < PROPS.length; i++) {
      var p = PROPS[i], v = cs.getPropertyValue(p);
      if (!v) continue;
      if (p === 'background-image' && v.indexOf('data:image/svg') >= 0) continue;
      if (p === 'position' && v === 'fixed') v = 'absolute';
      txt += p + ':' + v + ';';
    }
    if (src.querySelector && src.querySelector(':scope > svg')) txt += 'overflow:hidden;';
    dst.setAttribute('style', txt);
    dst.removeAttribute('class');
  }

  function walk(src, dst) {
    if (src.nodeType !== 1) return;
    var tag = (src.tagName || '').toLowerCase();
    if (tag === 'svg') {
      // lock the rendered box so the vector gauge cannot balloon once classes are dropped
      var r = src.getBoundingClientRect();
      dst.setAttribute('width', Math.round(r.width));
      dst.setAttribute('height', Math.round(r.height));
      dst.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      dst.setAttribute('style', 'width:' + Math.round(r.width) + 'px;height:' + Math.round(r.height) +
        'px;display:block;overflow:visible');
      dst.removeAttribute('class');
      return;
    }
    inline(src, dst);
    var a = src.children, b = dst.children;
    for (var i = 0; i < a.length && i < b.length; i++) walk(a[i], b[i]);
  }

  function normalizeForms(src, dst) {
    var a = src.querySelectorAll('input,select,textarea'),
        b = dst.querySelectorAll('input,select,textarea');
    for (var i = 0; i < a.length && i < b.length; i++) {
      var o = a[i], c = b[i], t = c.tagName.toLowerCase();
      if (t === 'textarea') { c.textContent = o.value; }
      else if (t === 'select') {
        var span = document.createElement('span');
        span.setAttribute('style', c.getAttribute('style') || '');
        span.textContent = o.options[o.selectedIndex] ? o.options[o.selectedIndex].text : '';
        c.parentNode.replaceChild(span, c);
      } else { c.setAttribute('value', o.value); }
    }
  }

  function notify(m) {
    var t = document.getElementById('toast');
    if (!t) { console.log(m); return; }
    t.textContent = m; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 3200);
  }

  function save(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  function buildSVG(node) {
    var w = Math.max(node.scrollWidth, node.offsetWidth, 1200);
    var h = Math.max(node.scrollHeight, node.offsetHeight, 700);
    var clone = node.cloneNode(true);
    walk(node, clone);
    normalizeForms(node, clone);
    clone.style.width = w + 'px';
    clone.style.margin = '0';
    clone.style.display = 'block';
    clone.style.position = 'static';

    var holder = document.createElement('div');
    holder.appendChild(clone);

    var xml = new XMLSerializer().serializeToString(clone);
    xml = xml.replace(/&nbsp;/g, '\u00a0');
    if (xml.indexOf('xmlns=') < 0) {
      xml = xml.replace(/^<(\w+)/, '<$1 xmlns="http://www.w3.org/1999/xhtml"');
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<rect width="100%" height="100%" fill="' + bgFallback() + '"/>' +
      '<foreignObject x="0" y="0" width="' + w + '" height="' + h + '">' + xml + '</foreignObject></svg>';
    return { svg: svg, w: w, h: h };
  }

  function sanitize(xml) {
    return xml
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&nbsp;/g, '\u00a0')
      .replace(/<(br|img|input|hr|col)([^>]*?)(?<!\/)>/g, '<$1$2/>')
      .replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  }

  function toDataURI(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function toPNG(node, cb) {
    var built;
    try { built = buildSVG(node); }
    catch (e) { console.error('[ExportPNG] build failed:', e); cb(null, null, 'build'); return; }

    built.svg = sanitize(built.svg);

    // validate XML before handing it to the browser
    try {
      var doc = new DOMParser().parseFromString(built.svg, 'image/svg+xml');
      var err = doc.getElementsByTagName('parsererror')[0];
      if (err) {
        console.error('[ExportPNG] XML invalid:', err.textContent.slice(0, 400));
        cb(null, built, 'xml');
        return;
      }
    } catch (e) { console.warn('[ExportPNG] parser check skipped', e); }

    var img = new Image(), fin = false, scale = 2;
    img.crossOrigin = 'anonymous';
    var timer = setTimeout(function () {
      if (fin) return; fin = true;
      console.warn('[ExportPNG] rasterise timeout'); cb(null, built, 'timeout');
    }, 12000);

    img.onload = function () {
      if (fin) return; fin = true; clearTimeout(timer);
      try {
        var c = document.createElement('canvas');
        c.width = Math.round(built.w * scale);
        c.height = Math.round(built.h * scale);
        var x = c.getContext('2d');
        x.scale(scale, scale);
        x.fillStyle = bgFallback(); x.fillRect(0, 0, built.w, built.h);
        x.drawImage(img, 0, 0, built.w, built.h);
        c.toBlob(function (b) {
          if (b && b.size > 2000) { cb(b, built, null); }
          else { console.warn('[ExportPNG] blank canvas, size=', b && b.size); cb(null, built, 'blank'); }
        }, 'image/png');
      } catch (e) {
        console.error('[ExportPNG] canvas failed:', e); cb(null, built, 'canvas');
      }
    };
    img.onerror = function () {
      if (fin) return; fin = true; clearTimeout(timer);
      console.error('[ExportPNG] SVG image could not be decoded');
      cb(null, built, 'decode');
    };

    try { img.src = toDataURI(built.svg); }
    catch (e) {
      clearTimeout(timer); fin = true;
      console.error('[ExportPNG] data URI failed:', e); cb(null, built, 'uri');
    }
  }

  window.exportPNG = function () {
    var node = document.querySelector('.screen.on') || document.getElementById('dash');
    if (!node) { notify('ไม่พบหน้าจอที่จะบันทึก'); return; }
    var stamp = new Date().toISOString().slice(0, 10);
    notify('กำลังสร้างไฟล์ PNG');

    toPNG(node, function (png, built, reason) {
      if (png) {
        save(png, 'SPARK2027_' + node.id + '_' + stamp + '.png');
        notify('บันทึกไฟล์ PNG แล้ว');
        return;
      }
      var why = {
        build: 'สร้างโครงภาพไม่สำเร็จ',
        xml: 'โครงสร้าง XML ไม่ถูกต้อง',
        decode: 'เบราว์เซอร์ถอดรหัสภาพไม่สำเร็จ',
        timeout: 'ใช้เวลานานเกินกำหนด',
        canvas: 'วาดภาพลง Canvas ไม่สำเร็จ',
        blank: 'ได้ภาพเปล่า',
        uri: 'แปลงข้อมูลภาพไม่สำเร็จ'
      }[reason] || 'ไม่ทราบสาเหตุ';
      console.warn('[ExportPNG] fallback to SVG because:', reason);
      if (built) {
        save(new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' }),
             'SPARK2027_' + node.id + '_' + stamp + '.svg');
        notify('PNG ไม่สำเร็จ (' + why + ') จึงบันทึกเป็น SVG แทน');
      } else {
        notify('สร้างไฟล์ภาพไม่สำเร็จ: ' + why);
      }
    });
  };

  window.exportSVG = function () {
    var node = document.querySelector('.screen.on') || document.getElementById('dash');
    if (!node) return;
    try {
      var built = buildSVG(node);
      save(new Blob([built.svg], { type: 'image/svg+xml;charset=utf-8' }),
           'SPARK2027_' + node.id + '_' + new Date().toISOString().slice(0, 10) + '.svg');
      notify('บันทึกไฟล์ SVG แล้ว');
    } catch (e) { notify('บันทึก SVG ไม่สำเร็จ'); }
  };

  document.addEventListener('DOMContentLoaded', addSvgBtn);
  addSvgBtn();
  function addSvgBtn() {
    var nav = document.querySelector('.nav');
    if (!nav || document.getElementById('btnSvg')) return;
    var b = document.createElement('button');
    b.id = 'btnSvg'; b.textContent = 'Export SVG';
    b.onclick = window.exportSVG;
    nav.appendChild(b);
  }
})();
