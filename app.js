const tg=window.Telegram&&Telegram.WebApp;if(tg){tg.ready();tg.expand();}
const TZ='Europe/London';const ST=['all','new','shortlisted','enquired','rejected'];const FL=['all','saved',...ST.slice(1)];let data=[],filt='all',cur=null,V=[],R=[],S=[];
const svK='flatsaved';const saved=new Set(JSON.parse(localStorage.getItem(svK)||'[]'));
const sentOf=id=>S.find(x=>String(x.listing_id)==String(id));
const SSTAT={sent:['Sent','st-sent'],replied:['Replied','st-replied'],viewing:['Viewing booked','st-confirmed'],no_reply:['No reply yet','st-noreply']};
const lsK='flatstatus';const loc=JSON.parse(localStorage.getItem(lsK)||'{}');
const st=l=>loc[l.id]||l.status;
const sz=l=>{const m=(l.size||'').match(/[\d.]+/);return m?parseFloat(m[0]):0};
const fmtD=d=>d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(){
 document.getElementById('filters').innerHTML=FL.map(s=>`<button class="chip ${s==filt?'on':''}" onclick="filt='${s}';render()">${s=='saved'?'❤️ saved':s} (${s=='all'?data.length:s=='saved'?data.filter(l=>saved.has(String(l.id))).length:data.filter(l=>st(l)==s).length})</button>`).join('');
 let L=data.filter(l=>filt=='all'||(filt=='saved'?saved.has(String(l.id)):st(l)==filt));const so=document.getElementById('sort').value;
 L.sort(so=='price'?(a,b)=>a.price-b.price:so=='size'?(a,b)=>sz(b)-sz(a):(a,b)=>(b.date_found||'').localeCompare(a.date_found||''));
 document.getElementById('cnt').textContent=L.length;
 document.getElementById('list').innerHTML=L.map(l=>`<div class="card"><div class="car">${l.photos.map(p=>`<img loading="lazy" src="${esc(p)}">`).join('')}</div>
 <div class="body"><span class="p">£${Number(l.price).toLocaleString()}</span><div class="t">${esc(l.title)}</div><div>${esc(l.area)}</div>
 <div class="facts">${[l.size,l.floor,l.furnished,l.available&&'Avail '+fmtD(l.available),l.commute&&'🚇 '+l.commute,l.pets&&'🐾 '+l.pets].filter(Boolean).map(esc).join(' · ')}</div>
 <div><span class="badge">${st(l)}</span><span style="font-size:12px;color:var(--hint)">found ${fmtD(l.date_found)} · ${l.photos.length} photos</span></div>
 ${l.notes?`<div class="notes">${esc(l.notes)}</div>`:''}
 ${sentBox(l)}
 <div class="acts">${sentOf(l.id)?'':`<button class="b big" onclick="draft('${l.id}')">✉️ Send enquiry</button>`}<button class="b s sv${saved.has(String(l.id))?' on':''}" onclick="save('${l.id}')">${saved.has(String(l.id))?'❤️ Saved':'🤍 Save'}</button><button class="b s" onclick="link('${esc(l.url)}')">Rightmove ↗</button>
 <select onchange="setS('${l.id}',this.value)">${ST.slice(1).map(s=>`<option ${s==st(l)?'selected':''}>${s}</option>`).join('')}</select></div></div></div>`).join('')||'<p style="text-align:center;color:var(--hint)">No listings</p>';
}
function sentBox(l){const e=sentOf(l.id);if(!e)return '';const [lab,cls]=SSTAT[e.status]||SSTAT.sent;
 return `<details class="sent"><summary><span class="sbadge">Sent ✓ ${fmtD(e.sent_at)}</span><span class="badge ${cls}">${lab}</span><span class="more">show message</span></summary><pre>${esc(e.text)}</pre></details>`}
function save(id){const l=data.find(x=>x.id==id);const k=String(id);
 if(saved.has(k)){saved.delete(k);localStorage.setItem(svK,JSON.stringify([...saved]));render();toast('Removed from saved');return}
 saved.add(k);localStorage.setItem(svK,JSON.stringify([...saved]));render();
 if(sentOf(id)){toast('Saved ❤️ (enquiry already sent)');return}
 if(canSend()){tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');tg.sendData(JSON.stringify({action:'save',id:k,title:l.title,url:l.url}))}
 else toast('Saved on this device. Open via 🏠 Flats button to tell the assistant')}
function setS(id,v){loc[id]=v;localStorage.setItem(lsK,JSON.stringify(loc));render();toast('Status saved on this device')}
function link(u){tg&&tg.openLink?tg.openLink(u):window.open(u,'_blank')}
function draft(id){cur=data.find(l=>l.id==id);const early=cur.available&&cur.available<'2026-11-15';
 const name=cur.title.split(',')[0];
 let t=`Hello,\n\nWe're very interested in ${name} and would love to arrange a viewing. My partner Grisha and I are moving to London in mid-November 2026 for a long-term let. I work at Synthesia in Regent's Place.\n\nWe have a well-behaved dog and a cat, and we're happy to discuss a pet deposit or any references you need.\n\nCould you confirm the floor area and the earliest move-in date? Video viewings would also work for us.`;
 if(early)t+=`\n\nI see it's available from ${fmtD(cur.available)}. Would it be possible to hold it until mid-November?`;
 t+=`\n\nThank you,\nMaria Surkova\n+34 605 227 263`;
 document.getElementById('dt').textContent='Enquiry: '+cur.title;document.getElementById('txt').value=t;document.getElementById('dlg').style.display='flex';
 document.getElementById('cmt').value='';document.getElementById('regen').style.display='none';document.getElementById('sdhint').style.display=canSend()?'none':'block';
 if(tg&&tg.BackButton){tg.BackButton.show();tg.BackButton.onClick(closeD)}}
function closeD(){document.getElementById('dlg').style.display='none';tg&&tg.BackButton&&tg.BackButton.hide()}
async function copyT(open){const ta=document.getElementById('txt');let ok=false;
 try{await navigator.clipboard.writeText(ta.value);ok=true}catch(e){ta.select();ok=document.execCommand('copy')}
 toast(ok?'Copied':'Select & copy manually');tg&&tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');if(open)setTimeout(openL,400)}
function canSend(){if(!tg||!tg.sendData||!tg.initDataUnsafe)return false;if(tg.initDataUnsafe.query_id)return false;return !!(tg.initData!==undefined&&tg.platform&&tg.platform!=='unknown')}
function toggleRegen(){const r=document.getElementById('regen');r.style.display=r.style.display=='none'?'block':'none';if(r.style.display=='block')document.getElementById('cmt').focus()}
function sendAct(a){if(!cur)return;const comment=document.getElementById('cmt').value.trim();
 if(a=='regenerate'&&!comment){toast('Say what to change');document.getElementById('regen').style.display='block';return}
 if(!canSend()){document.getElementById('sdhint').style.display='block';toast('Open via 🏠 Flats keyboard button');return}
 let draft=document.getElementById('txt').value;const p={action:a,id:String(cur.id),title:cur.title,url:cur.url,draft,comment,ts:new Date().toISOString()};
 const enc=o=>new TextEncoder().encode(JSON.stringify(o)).length;
 if(enc(p)>4000){p.truncated=true;while(enc(p)>4000&&p.draft.length){p.draft=p.draft.slice(0,Math.max(0,p.draft.length-Math.max(20,Math.ceil((enc(p)-4000)/2))))}p.draft+=' […TRUNCATED]';p.comment=(p.comment?p.comment+' ':'')+'[draft truncated to fit 4096 bytes]'}
 tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');tg.sendData(JSON.stringify(p))}
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
function renderR(){const SS=[...S].sort((a,b)=>(b.sent_at||'').localeCompare(a.sent_at||''));const used=new Set();
 let h=`<h1 style="margin:4px 2px">✉️ Enquiries <span class="cnt">${SS.length} sent</span></h1>`;
 h+=SS.map(e=>{const L=data.find(l=>l.id==e.listing_id);const rs=R.filter(r=>String(r.listing_id)==String(e.listing_id));rs.forEach(r=>used.add(r));const [lab,cls]=SSTAT[e.status]||SSTAT.sent;
  return `<div class="card"><div class="body"><span class="p" style="font-weight:400;font-size:12px;color:var(--hint)">${fmtD(e.sent_at)} ${new Date(e.sent_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span><div class="t">${esc(e.title||L&&L.title)}</div>
  <div><span class="sbadge">Sent ✓ via ${esc(e.channel||'rightmove')}</span><span class="badge ${cls}">${lab}</span></div>
  <details class="sent"><summary><span class="more">show message</span></summary><pre>${esc(e.text)}</pre></details>
  ${rs.length?rs.map(rcard).join(''):'<div class="notes" style="margin-top:6px">No reply yet</div>'}
  ${L?`<div class="acts"><button class="b s" onclick="link('${esc(L.url)}')">Rightmove ↗</button></div>`:''}</div></div>`}).join('')||EMPTY('✉️','No enquiries sent yet','Tap “Send enquiry” on a flat — it will appear here with its status.');
 const other=R.filter(r=>!used.has(r));
 if(other.length)h+='<div class="day">Other replies</div>'+other.map(r=>`<div class="card"><div class="body"><span class="p" style="font-weight:400;font-size:12px;color:var(--hint)">${r.date?dayK(r.date)+' '+tm(r.date):''}</span><div class="t">${esc(r.agent)}</div><div>${esc(r.title||'')}</div>
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
getJ('listings.json').then(d=>{data=Array.isArray(d)?d:[];render()});
Promise.all([getJ('viewings.json'),getJ('replies.json'),getJ('sent.json')]).then(([a,b,c])=>{V=Array.isArray(a)?a:[];R=Array.isArray(b)?b:[];S=Array.isArray(c)?c:[];render();if(curTab=='viewings')renderV();if(curTab=='replies')renderR()});
const h0=(location.hash||'').slice(1);tab(h0=='viewings'||h0=='replies'?h0:'flats');
