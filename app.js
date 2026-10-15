const tg=window.Telegram&&Telegram.WebApp;if(tg){tg.ready();tg.expand();}
const TZ='Europe/London';const ST=['all','new','shortlisted','enquired','rejected'];const FL=['all','saved',...ST.slice(1)];let data=[],filt='all',cur=null,V=[],R=[],S=[],rFilt='all';
const svK='flatsaved';const saved=new Set(JSON.parse(localStorage.getItem(svK)||'[]'));
const sentOf=id=>S.find(x=>String(x.listing_id)==String(id));
const msgOf=e=>{const t=(e&&(e.text||e.message)||'').trim();return t};
const msgBox=(e,pre)=>{const t=msgOf(e);return t?`<details class="sent"><summary>${pre||''}<span class="more">show message</span></summary><pre>${esc(t)}</pre></details>`:`<div class="sent">${pre||''}<span class="more" style="opacity:.7">text not available</span></div>`};
const enqBadge=e=>e.source==='assistant'?'Enquired by assistant':'Masha already enquired '+(e.sent_at?fmtD(e.sent_at):'');
const SSTAT={sent:['Awaiting reply','st-await'],'awaiting reply':['Awaiting reply','st-await'],'Let agreed':['Let agreed','st-let'],'Off the market':['Off the market','st-off'],replied:['Replied','st-replied'],viewing:['Viewing booked','st-confirmed'],no_reply:['Awaiting reply','st-await']};
const rtK='flatrating',rqK='flatrateq';const RT=JSON.parse(localStorage.getItem(rtK)||'{}');let RQ=JSON.parse(localStorage.getItem(rqK)||'{}');let showHid=false;
const rating=l=>RT[l.id]!==undefined?RT[l.id]:(l.rating||null);
const scoreOf=l=>Math.min(100,(l.score||0)+(RT[l.id]==='like'&&l.rating!=='like'?8:0));
const scCol=s=>s>=70?'#2e7d32':s>=55?'#7cb342':s>=45?'#f9a825':'#e53935';
function rate(id,v){const l=data.find(x=>x.id==id);const k=String(id);const nv=rating(l)===v?null:v;RT[k]=nv;localStorage.setItem(rtK,JSON.stringify(RT));
 RQ[k]={id:k,rating:nv||'unrate',title:l.title,ts:new Date().toISOString()};localStorage.setItem(rqK,JSON.stringify(RQ));
 tg&&tg.HapticFeedback&&tg.HapticFeedback.selectionChanged&&tg.HapticFeedback.selectionChanged();render();toast(nv=='like'?'👍 Liked':nv=='dislike'?'👎 Hidden (tap “show hidden” to see)':'Rating cleared')}
function syncR(){const items=Object.values(RQ);if(!items.length)return;
 if(!canSend()){const cs={like:'u',dislike:'d',unrate:'x'};const toks=items.map(x=>x.id+(cs[x.rating]||'x'));const ch=[];let c='r';
  for(const t of toks){if((c+t).length>64){ch.push(c);c='r'}c+=(c=='r'?'_':'')+t}if(c!='r')ch.push(c);
  if(ch.length>1){toast('Sending in '+ch.length+' parts — reopen app and tap sync again');ch.length=1;const sent=new Set(ch[0].slice(2).split(/(?<=[udx])/).map(t=>t.slice(0,-1)));items.forEach(x=>{if(sent.has(String(x.id)))delete RQ[x.id]});localStorage.setItem(rqK,JSON.stringify(RQ))}
  else{localStorage.setItem(rqK,'{}');RQ={}}deep(ch[0]);return}
 const p={action:'ratings',items:items.map(x=>({id:x.id,rating:x.rating,title:(x.title||'').slice(0,40),ts:x.ts})),ts:new Date().toISOString()};
 while(new TextEncoder().encode(JSON.stringify(p)).length>4000)p.items.forEach(x=>delete x.title)||p.items.pop();
 localStorage.setItem(rqK,'{}');RQ={};tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');tg.sendData(JSON.stringify(p))}
function bdHtml(l){const b=l.score_breakdown||{};return `<details class="bd"><summary>why this score?</summary><table>${Object.entries(b).map(([k,v])=>`<tr><td>${esc(k)}</td><td><b>${v.points}</b>/${v.max}</td><td>${esc(v.reason)}</td></tr>`).join('')}</table></details>`}
const lsK='flatstatus';const loc=JSON.parse(localStorage.getItem(lsK)||'{}');
const st=l=>loc[l.id]||l.status;
const sz=l=>{const m=(l.size||'').match(/[\d.]+/);return m?parseFloat(m[0]):0};
const fmtD=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FL2=[['all','Все'],['notsent','Не писали'],['sent','Написали'],['new','🆕 New'],['saved','❤️ saved']];
const seenK='flatseen',lvK='flatlastvisit';const SEEN0=new Set(JSON.parse(localStorage.getItem(seenK)||'null')||[]);const FIRST=!localStorage.getItem(seenK);
const isNew=l=>!FIRST&&!SEEN0.has(String(l.id));
function markSeen(){if(!data.length)return;localStorage.setItem(seenK,JSON.stringify(data.map(l=>String(l.id))));localStorage.setItem(lvK,new Date().toISOString())}
const hoodName=l=>{const h=l.hood||'';const m=h.match(/\(([^)]+)\)/);return m?m[1]:((l.area||'').split(',')[0]||'')};
const sqm=l=>{const m=(l.size||'').match(/([\d.]+)\s*m²/);return m?Math.round(+m[1])+' m²':'m² ?'};
const furnS=l=>{const f=(l.furnished||'').toLowerCase();return !f?'мебель ?':f.includes('flex')||f.includes('or unfurn')?'с мебелью / без':f.includes('part')?'частично':f.includes('unfurn')?'без мебели':'с мебелью'};
const availS=l=>!l.available?'с ? (ask)':(l.available<=new Date().toISOString().slice(0,10)?'сейчас':'с '+fmtD(l.available));
const commS=l=>l.commute_min?`${l.commute_min} мин · ${esc(l.commute_mode||'')}`:(l.commute?esc(l.commute):'');
const sentD=e=>e&&e.sent_at?fmtD(e.sent_at):'';
function render(){
 const cnt=k=>k=='all'?data.length:k=='saved'?data.filter(l=>saved.has(String(l.id))).length:k=='sent'?data.filter(l=>sentOf(l.id)).length:k=='notsent'?data.filter(l=>!sentOf(l.id)).length:data.filter(isNew).length;
 document.getElementById('filters').innerHTML=FL2.map(([k,lab])=>`<button class="chip ${k==filt?'on':''}" onclick="filt='${k}';render()">${lab} (${cnt(k)})</button>`).join('');
 const nh=data.filter(l=>rating(l)==='dislike').length;
 let L=data.filter(l=>showHid||rating(l)!=='dislike').filter(l=>filt=='all'||(filt=='saved'?saved.has(String(l.id)):filt=='sent'?!!sentOf(l.id):filt=='notsent'?!sentOf(l.id):filt=='new'?isNew(l):st(l)==filt));
 const so=document.getElementById('sort').value;
 const base=so=='score'?(a,b)=>scoreOf(b)-scoreOf(a):so=='price'?(a,b)=>a.price-b.price:so=='size'?(a,b)=>sz(b)-sz(a):so=='commute'?(a,b)=>(a.commute_min||999)-(b.commute_min||999):(a,b)=>(b.date_found||'').localeCompare(a.date_found||'');
 L.sort((a,b)=>(!!sentOf(a.id))-(!!sentOf(b.id))||base(a,b));
 document.getElementById('cnt').textContent=L.length;
 const nq=Object.keys(RQ).length;const sb=document.getElementById('sync');sb.style.display=nq?'':'none';sb.textContent=`🔄 Sync ${nq} rating${nq>1?'s':''}`;
 document.getElementById('hidt').innerHTML=nh?`<button class="chip ${showHid?'on':''}" onclick="showHid=!showHid;render()">👎 ${showHid?'hide':'show'} hidden (${nh})</button>`:'';
 let firstSent=true;
 document.getElementById('list').innerHTML=L.map(l=>{const e=sentOf(l.id);let sep='';if(e&&firstSent&&L.some(x=>!sentOf(x.id))){firstSent=false;sep='<div class="day">✉️ Уже написали</div>'}
 return sep+`<div class="card${e?' done':''}" id="c-${esc(l.id)}"><div class="car">${l.photos.map(p=>`<img loading="lazy" src="${esc(p)}">`).join('')}</div>
 <div class="bar"><button class="score" style="background:${scCol(scoreOf(l))}" onclick="this.closest('.card').querySelector('details.more').toggleAttribute('open')" aria-label="Score ${scoreOf(l)} of 100, show details">${l.score!=null?scoreOf(l):'–'}</button>
 <button class="b s rmb" onclick="link('${esc(l.url)}')">Rightmove ↗</button>
 <button class="b s rt${rating(l)=='like'?' up':''}" aria-pressed="${rating(l)=='like'}" onclick="rate('${l.id}','like')">👍</button><button class="b s rt${rating(l)=='dislike'?' dn':''}" aria-pressed="${rating(l)=='dislike'}" onclick="rate('${l.id}','dislike')">👎</button>
 <span class="p">£${Number(l.price).toLocaleString()}</span></div>
 <div class="body"><div class="t">${esc(l.title)}${isNew(l)?' <span class="newb">🆕 New</span>':''}</div>
 ${e?`<div><span class="sbadge enq">✉️ Написали ${sentD(e)}${e.source==='masha'?' (Маша)':e.source==='assistant'?' (ассистент)':''}</span></div>`:''}
 ${commS(l)?`<div class="comm">🕘 ${commS(l)}</div>`:''}
 <div class="tags"><span>📍 ${esc(hoodName(l))}</span><span>📅 ${esc(availS(l))}</span><span>📐 ${esc(sqm(l))}</span><span>🛋 ${esc(furnS(l))}</span></div>
 <details class="more"><summary>подробнее</summary>
 <div class="facts">${[l.area,l.floor,l.pets&&'🐾 '+l.pets,l.furnished].filter(Boolean).map(esc).join(' · ')}</div>
 ${l.hood?`<div class="hood" style="font-size:12px;opacity:.75;margin-top:4px">📍 ${esc(l.hood)}</div>`:''}
 ${l.notes?`<div class="notes">${esc(l.notes)}</div>`:''}
 ${l.score_breakdown?bdHtml(l):''}
 <div style="font-size:12px;color:var(--hint)">found ${fmtD(l.date_found)} · ${l.photos.length} photos · status ${esc(st(l))}</div>
 <select onchange="setS('${l.id}',this.value)">${ST.slice(1).map(s=>`<option ${s==st(l)?'selected':''}>${s}</option>`).join('')}</select></details>
 ${sentBox(l)}
 ${e?'':`<div class="acts"><button class="b big" onclick="draft('${l.id}')">✉️ Send enquiry</button><button class="b s sv${saved.has(String(l.id))?' on':''}" onclick="save('${l.id}')">${saved.has(String(l.id))?'❤️ Saved':'🤍 Save'}</button></div>`}
 </div></div>`}).join('')||'<p style="text-align:center;color:var(--hint)">No listings</p>';
}
function sentBox(l){const e=sentOf(l.id);if(!e)return '';const [lab,cls]=SSTAT[e.status]||SSTAT.sent;
 return msgBox(e,`<span class="sbadge">${esc(enqBadge(e))}</span><span class="badge ${cls}">${lab}</span>`)}
function save(id){const l=data.find(x=>x.id==id);const k=String(id);
 if(saved.has(k)){saved.delete(k);localStorage.setItem(svK,JSON.stringify([...saved]));render();toast('Removed from saved');return}
 saved.add(k);localStorage.setItem(svK,JSON.stringify([...saved]));render();
 if(sentOf(id)){toast('Saved ❤️ (enquiry already sent)');return}
 if(canSend()){tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');try{tg.sendData(JSON.stringify({action:'save',id:k,title:l.title,url:l.url}))}catch(e){deep('s_'+k)}}
 else deep('s_'+k)}
function setS(id,v){loc[id]=v;localStorage.setItem(lsK,JSON.stringify(loc));render();toast('Status saved on this device')}
function link(u){tg&&tg.openLink?tg.openLink(u):window.open(u,'_blank')}
function draft(id){if(sentOf(id)){toast(enqBadge(sentOf(id)));return}cur=data.find(l=>l.id==id);const early=cur.available&&cur.available<'2026-11-15';
 const name=cur.title.split(',')[0];
 let t=`Hello,\n\nWe're very interested in ${name} and would love to arrange a viewing. My partner Grisha and I are moving to London in mid-November 2026 for a long-term let. I work at Synthesia in Regent's Place.\n\nWe have a well-behaved dog and a cat, and we're happy to discuss a pet deposit or any references you need.\n\nCould you confirm the floor area and the earliest move-in date? Video viewings would also work for us.`;
 if(early)t+=`\n\nI see it's available from ${fmtD(cur.available)}. Would it be possible to hold it until mid-November?`;
 t+=`\n\nThank you,\nMaria Surkova\n+34 605 227 263`;
 document.getElementById('dt').textContent='Enquiry: '+cur.title;document.getElementById('txt').value=t;cur._orig=t;document.getElementById('dlg').style.display='flex';
 document.getElementById('cmt').value='';document.getElementById('regen').style.display='none';document.getElementById('sdhint').style.display='none';
 if(tg&&tg.BackButton){tg.BackButton.show();tg.BackButton.onClick(closeD)}}
function closeD(){document.getElementById('dlg').style.display='none';tg&&tg.BackButton&&tg.BackButton.hide()}
async function copyT(open){const ta=document.getElementById('txt');let ok=false;
 try{await navigator.clipboard.writeText(ta.value);ok=true}catch(e){ta.select();ok=document.execCommand('copy')}
 toast(ok?'Copied':'Select & copy manually');tg&&tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');if(open)setTimeout(openL,400)}
function canSend(){if(!tg||!tg.sendData||!tg.initDataUnsafe)return false;if(tg.initDataUnsafe.query_id)return false;return !!(tg.initData!==undefined&&tg.platform&&tg.platform!=='unknown')}
function toggleRegen(){const r=document.getElementById('regen');r.style.display=r.style.display=='none'?'block':'none';if(r.style.display=='block')document.getElementById('cmt').focus()}
async function sendAct(a){if(!cur)return;if(sentOf(cur.id)){toast(enqBadge(sentOf(cur.id)));return}const comment=document.getElementById('cmt').value.trim();
 if(a=='regenerate'&&!comment){toast('Say what to change');document.getElementById('regen').style.display='block';return}
 if(!canSend()){const id=String(cur.id);const edited=document.getElementById('txt').value!==cur._orig;
  if(a=='regenerate'){await clip('regen '+id+': '+comment);hint('Opening bot chat. Your comment was copied — paste it there.');deep('g_'+id);return}
  if(edited){await clip('draft '+id+': '+document.getElementById('txt').value);hint('Opening bot chat. Your edited draft was copied — paste it there.')}
  deep('c_'+id);return}
 let draft=document.getElementById('txt').value;const p={action:a,id:String(cur.id),title:cur.title,url:cur.url,draft,comment,ts:new Date().toISOString()};
 const enc=o=>new TextEncoder().encode(JSON.stringify(o)).length;
 if(enc(p)>4000){p.truncated=true;while(enc(p)>4000&&p.draft.length){p.draft=p.draft.slice(0,Math.max(0,p.draft.length-Math.max(20,Math.ceil((enc(p)-4000)/2))))}p.draft+=' […TRUNCATED]';p.comment=(p.comment?p.comment+' ':'')+'[draft truncated to fit 4096 bytes]'}
 tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');try{tg.sendData(JSON.stringify(p))}catch(e){deep((a=='regenerate'?'g_':'c_')+p.id)}}
function openL(){cur&&link(cur.url)}
function toast(m){const e=document.getElementById('toast');e.textContent=m;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',1600)}
const dayK=d=>new Date(d).toLocaleDateString('en-GB',{timeZone:TZ,weekday:'short',day:'numeric',month:'short'});
const tm=d=>new Date(d).toLocaleTimeString('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'});
function vcard(v,past){const L=v.listing_id&&data.find(l=>l.id==v.listing_id);return `<div class="card${past?' past':''}"><div class="body"><span class="p">${v.datetime?tm(v.datetime)+' 🇬🇧':'TBC'}</span><div class="t">${esc(v.title||v.address)}</div><div>${esc(v.address||'')}</div>
 <div class="facts">${[v.type=='video'?'📹 video':'🚶 in-person',v.agent,v.agent_phone].filter(Boolean).map(esc).join(' · ')}</div>
 <div><span class="badge st-${esc(v.status)}">${esc(v.status)}</span>${v.agent_email?`<a style="font-size:12px" href="mailto:${esc(v.agent_email)}">${esc(v.agent_email)}</a>`:''}</div>
 ${v.notes?`<div class="notes">${esc(v.notes)}</div>`:''}${L?`<div class="acts"><button class="b s" onclick="link('${esc(L.url)}')">Rightmove ↗</button></div>`:''}</div></div>`}
function renderV(){const now=Date.now();const up=[],pa=[],tbc=[];
 V.forEach(v=>{if(!v.datetime)tbc.push(v);else if(new Date(v.datetime)>=now-3600e3&&v.status!='done')up.push(v);else pa.push(v)});
 up.sort((a,b)=>a.datetime.localeCompare(b.datetime));pa.sort((a,b)=>b.datetime.localeCompare(a.datetime));
 let h='<h1 style="margin:4px 2px">📅 Viewings <span class="cnt">London time</span></h1>';let last='';
 if(!V.length){document.getElementById('vlist').innerHTML=h+EMPTY('📅','No viewings yet','They\'ll appear here once agents reply and a viewing is booked.');return}
 up.forEach(v=>{const k=dayK(v.datetime);if(k!=last){h+=`<div class="day">${k}</div>`;last=k}h+=vcard(v)});
 if(!up.length)h+='<p style="color:var(--hint);margin:0 4px">No upcoming viewings</p>';
 if(tbc.length)h+='<div class="day">Time TBC</div>'+tbc.map(v=>vcard(v)).join('');
 if(pa.length){h+='<div class="day">Past</div>';last='';pa.forEach(v=>{h+=vcard(v,1)})}
 document.getElementById('vlist').innerHTML=h}
const rcard=r=>`<div class="reply"><span style="font-size:12px;color:var(--hint)">↳ Reply ${r.date?dayK(r.date)+' '+tm(r.date):''}</span><div class="t" style="font-size:14px">${esc(r.agent)}</div>
 <div style="margin:4px 0">${esc(r.summary)}</div>${r.needs_reply?'<span class="badge nr">needs reply</span>':'<span class="badge">no reply needed</span>'}
 ${r.suggested_next_step?`<div class="notes">➡️ ${esc(r.suggested_next_step)}</div>`:''}</div>`;
function renderR(){let SS=[...S].sort((a,b)=>(b.sent_at||'').localeCompare(a.sent_at||''));
 const nAll=SS.length,nLet=SS.filter(e=>e.status==='Let agreed').length,nAct=SS.filter(e=>e.status!=='Let agreed'&&e.status!=='Off the market').length;
 if(rFilt==='active')SS=SS.filter(e=>e.status!=='Let agreed'&&e.status!=='Off the market');
 else if(rFilt==='let')SS=SS.filter(e=>e.status==='Let agreed');
 const used=new Set();
 let h=`<h1 style="margin:4px 2px">✉️ Enquiries <span class="cnt">${nAll} sent</span></h1>`;
 h+=`<div class="ctl"><span class="lbl">Filter:</span><div class="row">${[['all','All',nAll],['active','Active',nAct],['let','Let agreed',nLet]].map(([k,lab,n])=>`<button class="chip ${rFilt==k?'on':''}" onclick="rFilt='${k}';renderR()">${lab} (${n})</button>`).join('')}</div></div>`;
 h+=SS.map(e=>{const L=data.find(l=>String(l.id)==String(e.listing_id));const rs=R.filter(r=>String(r.listing_id)==String(e.listing_id));rs.forEach(r=>used.add(r));const [lab,cls]=SSTAT[e.status]||SSTAT['awaiting reply'];
  const src=e.source==='masha'?'by Masha':e.source==='assistant'?'by assistant':'';
  const when=e.sent_at?(e.sent_at.length<=10?fmtD(e.sent_at):fmtD(e.sent_at)+' '+new Date(e.sent_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})):'';
  const linkUrl=(L&&L.url)||e.url||'';
  return `<div class="card"><div class="body"><span class="p" style="font-weight:400;font-size:12px;color:var(--hint)">${when}</span><div class="t">${L?`<a href="#flat-${esc(L.id)}" class="clink" onclick="openCard('${esc(L.id)}');return false">${esc(e.title||L.title)} ›</a>`:esc(e.title)}</div>
  ${e.agent||e.price?`<div class="facts">${[e.price,e.agent].filter(Boolean).map(esc).join(' · ')}</div>`:''}
  <div><span class="sbadge">Sent ✓</span>${src?`<span class="srcbadge ${e.source==='masha'?'src-masha':'src-asst'}">${src}</span>`:''}<span class="badge ${cls}">${lab}</span></div>
  ${msgBox(e)}
  ${rs.length?rs.map(rcard).join(''):(e.status==='awaiting reply'||e.status==='sent'||!e.status?'<div class="notes" style="margin-top:6px">No reply yet</div>':'')}
  <div class="acts">${L?`<button class="b s opencard" data-id="${esc(L.id)}" onclick="openCard('${esc(L.id)}')">🏠 Open card</button>`:''}${linkUrl?`<button class="b s" onclick="link('${esc(linkUrl)}')">Rightmove ↗</button>`:''}</div></div></div>`}).join('')||EMPTY('✉️',rFilt==='all'?'No enquiries sent yet':'No enquiries in this filter',rFilt==='all'?'Tap “Send enquiry” on a flat — it will appear here with its status.':'Try All to see everything.');
 const other=R.filter(r=>!used.has(r));
 if(other.length&&rFilt==='all')h+='<div class="day">Other replies</div>'+other.map(r=>`<div class="card"><div class="body"><span class="p" style="font-weight:400;font-size:12px;color:var(--hint)">${r.date?dayK(r.date)+' '+tm(r.date):''}</span><div class="t">${esc(r.agent)}</div><div>${esc(r.title||'')}</div>
 <div style="margin:4px 0">${esc(r.summary)}</div>${r.needs_reply?'<span class="badge nr">needs reply</span>':'<span class="badge">no reply needed</span>'}
 ${r.suggested_next_step?`<div class="notes">➡️ ${esc(r.suggested_next_step)}</div>`:''}</div></div>`).join('');
 document.getElementById('rlist').innerHTML=h}


const EMPTY=(i,t,d)=>`<div class="empty"><div class="e">${i}</div><b>${t}</b><div style="font-size:13px;margin-top:4px">${d}</div></div>`;
const TABS={flats:['list','fhead'],viewings:['vlist'],replies:['rlist']};let curTab='flats';
function tab(t){if(!TABS[t])t='flats';curTab=t;
 document.querySelectorAll('nav#tabs button').forEach(b=>{const on=b.dataset.tab==t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
 ['list','fhead','vlist','rlist'].forEach(id=>document.getElementById(id).style.display=TABS[t].includes(id)?'':'none');
 document.getElementById('hdr').style.display=t=='flats'?'':'none';
 if(t=='viewings')renderV();if(t=='replies')renderR();window.scrollTo(0,0);
 try{history.replaceState(null,'',t=='flats'?location.pathname+location.search:'#'+t)}catch(e){}
 tg&&tg.HapticFeedback&&tg.HapticFeedback.selectionChanged&&tg.HapticFeedback.selectionChanged()}
document.querySelectorAll('nav#tabs button').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
document.getElementById('sort').addEventListener('change',render);
const getJ=f=>fetch(f+'?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
getJ('listings.json').then(d=>{data=Array.isArray(d)?d:[];render();setTimeout(markSeen,1500);const m=(location.hash||'').match(/^#flat-(\d+)/);if(m)openCard(m[1])});
Promise.all([getJ('viewings.json'),getJ('replies.json'),getJ('sent.json')]).then(([a,b,c])=>{V=Array.isArray(a)?a:[];R=Array.isArray(b)?b:[];S=Array.isArray(c)?c:[];render();if(curTab=='viewings')renderV();if(curTab=='replies')renderR()});
const h0=(location.hash||'').slice(1);if(!/^flat-/.test(h0))tab(h0=='viewings'||h0=='replies'?h0:'flats');

const BOT='Gogi_grot_bot';
function deep(p){const u='https://t.me/'+BOT+'?start='+p;tg&&tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');if(tg&&tg.openTelegramLink)tg.openTelegramLink(u);else window.open(u,'_blank')}
async function clip(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}}
function hint(m){const e=document.getElementById('sdhint');e.textContent=m;e.style.display='block';toast(m)}

function openCard(id){const l=data.find(x=>String(x.id)==String(id));if(!l){toast('Flat not in list');return}
 filt='all';if(rating(l)==='dislike')showHid=true;tab('flats');render();
 const el=document.getElementById('c-'+id);if(!el)return;el.scrollIntoView({block:'start'});window.scrollBy(0,-(document.getElementById('hdr').offsetHeight||0)-6);
 el.classList.add('hl');setTimeout(()=>el.classList.remove('hl'),2500);
 try{history.replaceState(null,'','#flat-'+id)}catch(e){}}
