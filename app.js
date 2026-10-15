const tg=window.Telegram&&Telegram.WebApp;if(tg){tg.ready();tg.expand();try{document.documentElement.dataset.theme=tg.colorScheme;tg.setHeaderColor&&tg.setHeaderColor('secondary_bg_color')}catch(e){}}
const TZ='Europe/London';const ST=['all','new','shortlisted','enquired','rejected'];const FL=['all','saved',...ST.slice(1)];let sFilt='all',data=[],filt='all',cur=null,V=[],R=[],S=[],rFilt='all';
const svK='flatsaved';const saved=new Set(JSON.parse(localStorage.getItem(svK)||'[]'));
const sentOf=id=>S.find(x=>String(x.listing_id)==String(id));
const msgOf=e=>{const t=(e&&(e.text||e.message)||'').trim();return t};
const msgBox=(e,pre)=>{const t=msgOf(e);return t?`<details class="sent"><summary>${pre||''}<span class="more">show message</span></summary><pre>${esc(t)}</pre></details>`:`<div class="sent">${pre||''}<span class="more" style="opacity:.7">text not available</span></div>`};
const enqBadge=e=>(e.source==='assistant'?'Ассистент уже написал ':'Маша уже написала ')+(e.sent_at?fmtD(e.sent_at):'');
const SSTAT0={sent:['Awaiting reply','st-await'],'awaiting reply':['Awaiting reply','st-await'],'Let agreed':['Let agreed','st-let'],'Off the market':['Off the market','st-off'],replied:['Replied','st-replied'],viewing:['Viewing booked','st-confirmed'],viewed:['Viewed ✓','st-confirmed'],'viewing proposed':['Viewing proposed','st-replied'],rejected:['Not for us','st-off'],no_reply:['Awaiting reply','st-await']};

const SSTAT={not_sent:['Не отправлено','pl-red'],sent:['Ждём ответа','pl-grey'],'awaiting reply':['Ждём ответа','pl-grey'],no_reply:['Ждём ответа','pl-grey'],replied:['Агент ответил','pl-blue'],'viewing proposed':['Предложен просмотр','pl-amber'],viewing:['Просмотр назначен','pl-green'],viewed:['Посмотрели','pl-green'],'Let agreed':['Сдана','pl-dark'],'Off the market':['Снята','pl-dark'],rejected:['Не подходит','pl-dark']};
const pill=e=>{const [l,c]=SSTAT[e.status]||SSTAT.sent;return `<span class="pill ${c}">${l}</span>`};
const av=e=>`<span class="av ${e.source==='assistant'?'av-as':'av-ma'}" title="${e.source==='assistant'?'Ассистент':'Маша'}">${e.source==='assistant'?'🤖':'👩'}</span>`;
const isOR=e=>e&&(e.channel==='openrent'||(e.agent||'').toLowerCase().startsWith('openrent'));
const linkOf=(e,L)=>isOR(e)?(e.openrent_url||'https://www.openrent.co.uk/myenquiries'):((L&&L.url)||e.url||'');
const linkLbl=(e,L)=>isOR(e)?'OpenRent':(L?srcName(L):'Rightmove');
const areaOf=(e,L)=>{if(L)return hoodName(L);const t=(e.title||'').split(',');return (t.length>1?t[t.length-1]:'').trim()};
const agShort=e=>isOR(e)?'OpenRent':(e.agent||'').split(',')[0];
function primary(e){const n=e.next||{};
 if(n.who==='us'){if(n.kind==='openrent_confirm'&&n.action_url)return `<button class="b pri" onclick="event.stopPropagation();link('${esc(n.action_url)}')">✅ Подтвердить на OpenRent</button>`;
  if(n.kind==='call'&&n.agent_phone)return `<a class="b pri" onclick="event.stopPropagation()" href="tel:${esc(n.agent_phone.replace(/[^+\d]/g,''))}">📞 Позвонить</a>`;
  if(n.draft)return `<button class="b pri" onclick="event.stopPropagation();openSheet('${esc(e.listing_id)}')">💬 Ответить</button>`}
 return `<button class="b sec" onclick="event.stopPropagation();openSheet('${esc(e.listing_id)}')">Переписка</button>`}
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
const FL2=[['all','Все'],['notsent','Не писали'],['sent','Написали'],['new','🆕 Новые'],['saved','❤️ Избранное']];
const seenK='flatseen',lvK='flatlastvisit';const SEEN0=new Set(JSON.parse(localStorage.getItem(seenK)||'null')||[]);const FIRST=!localStorage.getItem(seenK);
const isNew=l=>!FIRST&&!SEEN0.has(String(l.id));
function markSeen(){if(!data.length)return;localStorage.setItem(seenK,JSON.stringify(data.map(l=>String(l.id))));localStorage.setItem(lvK,new Date().toISOString())}
const hoodName=l=>{if(l.nbhd)return l.nbhd;const h=l.hood||'';const m=h.match(/\(([^)]+)\)/);return m?m[1]:((l.area||'').split(',')[0]||'')};
const sqm=l=>{const m=(l.size||'').match(/([\d.]+)\s*m²/);if(m)return Math.round(+m[1])+' m²';const f=l.agent_facts&&l.agent_facts.size;return f?f:'m² —'};
const furnS=l=>{const f=(l.furnished||'').toLowerCase();return !f?'мебель ?':f.includes('flex')||f.includes('or unfurn')?'с мебелью / без':f.includes('part')?'частично':f.includes('unfurn')?'без мебели':'с мебелью'};
const availS=l=>!l.available?((l.agent_facts&&l.agent_facts.available)?'с '+l.agent_facts.available:'дата —'):(l.available<=new Date().toISOString().slice(0,10)?'сейчас':'с '+fmtD(l.available));
const commS=l=>l.commute_min?`${l.commute_min} мин · ${esc(l.commute_mode||'')}`:(l.commute?esc(l.commute):'');
const SRC={rightmove:['Rightmove','#00deb6','#0b2e2a'],openrent:['OpenRent','#e8f5e9','#1b5e20'],onthemarket:['OTM','#e3f2fd','#0d47a1'],foxtons:['Foxtons','#e8f5e9','#2e7d32'],zoopla:['Zoopla','#f3e5f5','#6a1b9a'],chestertons:['Chestertons','#fff8e1','#8d6e00']};
const srcOf=l=>l.source||(/^or-/.test(l.id)?'openrent':/^otm-/.test(l.id)?'onthemarket':/^fx-/.test(l.id)?'foxtons':/^zp-/.test(l.id)?'zoopla':/^ch-/.test(l.id)?'chestertons':'rightmove');
const srcName=l=>(SRC[srcOf(l)]||SRC.rightmove)[0];
const srcBadge=l=>{const [n,bg,fg]=SRC[srcOf(l)]||SRC.rightmove;return `<span class="srcb" style="background:${bg};color:${fg}">${n}</span>`};
const freshB=l=>l.fresh_days!=null&&!l.stale&&l.fresh_days<=3?` <span class="freshb">≤3d</span>`:'';
const inFeed=l=>!l.stale||saved.has(String(l.id))||!!sentOf(l.id)||rating(l)==='like';
const sentD=e=>e&&e.sent_at?fmtD(e.sent_at):'';
function render(){
 const D2=data.filter(inFeed);const cnt=k=>k=='all'?D2.length:k=='saved'?data.filter(l=>saved.has(String(l.id))).length:k=='sent'?data.filter(l=>sentOf(l.id)).length:k=='notsent'?D2.filter(l=>!sentOf(l.id)).length:D2.filter(isNew).length;
 document.getElementById('filters').innerHTML=FL2.map(([k,lab])=>`<button class="chip ${k==filt?'on':''}" onclick="filt='${k}';render()">${lab} (${cnt(k)})</button>`).join('');
 const nh=data.filter(l=>rating(l)==='dislike').length;
 let L=data.filter(l=>showHid||rating(l)!=='dislike').filter(l=>filt=='saved'||filt=='sent'||inFeed(l)).filter(l=>filt=='all'||(filt=='saved'?saved.has(String(l.id)):filt=='sent'?!!sentOf(l.id):filt=='notsent'?!sentOf(l.id):filt=='new'?isNew(l):st(l)==filt));
 const so=document.getElementById('sort').value;
 const base=so=='score'?(a,b)=>scoreOf(b)-scoreOf(a):so=='price'?(a,b)=>a.price-b.price:so=='size'?(a,b)=>sz(b)-sz(a):so=='commute'?(a,b)=>(a.commute_min||999)-(b.commute_min||999):(a,b)=>(b.date_found||'').localeCompare(a.date_found||'');
 L.sort((a,b)=>(!!sentOf(a.id))-(!!sentOf(b.id))||base(a,b));
 document.getElementById('cnt').textContent=L.length;
 const nq=Object.keys(RQ).length;const sb=document.getElementById('sync');sb.style.display=nq?'':'none';sb.textContent=`🔄 Отправить оценки (${nq})`;
 document.getElementById('hidt').innerHTML=nh?`<button class="chip ${showHid?'on':''}" onclick="showHid=!showHid;render()">👎 ${showHid?'скрыть':'показать'} скрытые (${nh})</button>`:'';
 let firstSent=true;
 document.getElementById('list').innerHTML=L.map(l=>{const e=sentOf(l.id);let sep='';if(e&&firstSent&&L.some(x=>!sentOf(x.id))){firstSent=false;sep='<div class="day">✉️ Уже написали</div>'}
 return sep+`<div class="card${e?' done':''}" id="c-${esc(l.id)}"><div class="ph"><div class="car">${l.photos.map(p=>`<img loading="lazy" src="${esc(p)}" alt="">`).join('')}</div>
 <button class="score" style="background:${scCol(scoreOf(l))}" onclick="openMore('${esc(l.id)}')" aria-label="Оценка ${scoreOf(l)} из 100">${l.score!=null?scoreOf(l):'–'}</button>
 <span class="pp">£${Number(l.price).toLocaleString()}</span>${l.photos.length>1?`<span class="pc">📷 ${l.photos.length}</span>`:''}</div>
 <div class="body"><div class="t">${esc(l.title)}${isNew(l)?' <span class="newb">Новое</span>':''}</div>
 <div class="sub">📍 ${esc(hoodName(l))}${commS(l)?` · 🕘 ${commS(l)}`:''}</div>
 <div class="tags"><span>📅 ${esc(availS(l))}</span><span>📐 ${esc(sqm(l))}</span><span>🛋 ${esc(furnS(l))}</span><span>🐾 ${esc(petS(l))}</span></div>
 ${e?`<div class="enqline" onclick="openSheet('${esc(e.listing_id)}')">${av(e)}${pill(e)}<span class="nx1">${esc(nx1(e))}</span></div>`:''}
 <div class="cta">${e?primary(e):`<button class="b pri" onclick="draft('${l.id}')">✉️ Написать агенту</button>`}
 <button class="b ic rt${rating(l)=='like'?' up':''}" aria-label="Нравится" aria-pressed="${rating(l)=='like'}" onclick="rate('${l.id}','like')">👍</button><button class="b ic rt${rating(l)=='dislike'?' dn':''}" aria-label="Скрыть" aria-pressed="${rating(l)=='dislike'}" onclick="rate('${l.id}','dislike')">👎</button>
 <button class="b ic" aria-label="Ещё" onclick="openMore('${esc(l.id)}')">⋯</button></div>
 </div></div>`}).join('')||EMPTY('🏠','Нет квартир','Попробуйте другой фильтр');
}
function sentBox(l){const e=sentOf(l.id);if(!e)return '';const [lab,cls]=SSTAT[e.status]||SSTAT.sent;
 return `<div><span class="sbadge">${esc(enqBadge(e))}</span><span class="badge ${cls}">${lab}</span></div>`+nextBox(e)+convC(e)}
const AGE=n=>n==null?'':n==0?'today':n==1?'1 day':n+' days';
const nAgo=d=>{if(!d)return null;return Math.max(0,Math.floor((Date.now()-new Date(d))/864e5))};
const DRK='flatdraft';const DR=JSON.parse(localStorage.getItem(DRK)||'{}');
const drOf=e=>DR[e.listing_id]!=null?DR[e.listing_id]:((e.next||{}).draft||'');
function nextBox(e){const n=e.next;if(!n||n.who==='none')return n&&n.text?`<div class="nx nx-none">✔️ ${esc(n.text)}</div>`:'';
 const us=n.who==='us';const a=nAgo(n.since);const id=esc(e.listing_id);
 let h=`<div class="nx ${us?'nx-us':'nx-ag'}"><div class="nxh">${us?'👉 Our move':'⏳ Agent\'s move'}${a!=null?` · ${AGE(a)}${n.since?' (since '+fmtD(n.since)+')':''}`:''}</div><div class="nxt">${esc(n.text)}</div>`;
 const acts=[];if(n.action_url)acts.push(`<button class="b s" onclick="link('${esc(n.action_url)}')">✅ Open OpenRent confirm</button>`);
 if(us&&n.agent_phone&&n.kind==='call')acts.push(`<a class="b s" href="tel:${esc(n.agent_phone.replace(/[^+\d]/g,''))}">📞 Call ${esc(n.agent_phone)}</a>`);
 if(acts.length)h+=`<div class="acts">${acts.join('')}</div>`;
 if(n.draft){const ed=DR[e.listing_id]!=null;h+=`<div class="drf"><div class="drh">Suggested reply${n.reply_to?' → '+esc(n.reply_to):''}${ed?' <i>(edited)</i>':''}</div><pre id="dr-${id}">${esc(drOf(e))}</pre>
  <textarea id="de-${id}" style="display:none" rows="5"></textarea>
  <div class="acts"><button class="b s" onclick="drCopy('${id}')">Copy</button><button class="b s" onclick="drEdit('${id}')">✏️ Edit</button>${n.reply_to?`<button class="b s big" onclick="drSend('${id}')">Send via…</button>`:''}</div>
  <div class="drn">Nothing is sent until you confirm in the bot chat.</div></div>`}
 return h+'</div>'}
function drCopy(id){const e=sentOf(id);const t=drOf(e);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Скопировано'),()=>toast('Select & copy manually'))}
function drEdit(id){const ta=document.getElementById('de-'+id),pre=document.getElementById('dr-'+id);
 if(ta.style.display==='none'){ta.value=drOf(sentOf(id));ta.style.display='';pre.style.display='none';ta.focus()}
 else{const v=ta.value.trim();const e=sentOf(id);if(v&&v!==(e.next||{}).draft)DR[id]=v;else delete DR[id];localStorage.setItem(DRK,JSON.stringify(DR));render();if(curTab=='replies')renderR();if(sheetId)openSheet(sheetId);toast('Черновик сохранён на этом устройстве')}}
function drSend(id){const e=sentOf(id);if(DR[id]!=null){const t=DR[id];const go=()=>{toast('Текст скопирован — вставьте его в чат бота');setTimeout(()=>deep('me_'+id),600)};
  (navigator.clipboard?navigator.clipboard.writeText('reply '+id+': '+t):Promise.reject()).then(go,()=>{prompt('Copy this and paste in the bot chat:','reply '+id+': '+t);deep('me_'+id)})}
 else deep('m_'+id)}
const isAs=e=>e.source==='assistant';
const chanOf=e=>{const a=(e.agent||'').toLowerCase(),c=(e.channel||'').toLowerCase();return a.startsWith('openrent')?'OpenRent':c.includes('whatsapp')?'WhatsApp':c&&c!=='rightmove'?'Email':'Rightmove'};
const senderTag=e=>`<div class="sndr ${isAs(e)?'s-as':'s-ma'}">${isAs(e)?'🤖 Ассистент':'👩 Маша'} <span>· ${chanOf(e)}${e.sent_at?' · '+fmtD(e.sent_at):''}</span></div>`;
const whoM=(m,e)=>m.dir==='agent'?`<b class="w-ag">🏢 Агент${m.from?' ('+esc(agName(m.from,e))+')':''}</b>`:((m.by==='assistant'||(m.enquiry&&isAs(e)))?'<b class="w-as">🤖 Ассистент</b>':'<b class="w-ma">👩 Маша</b>');
const agName=(f,e)=>{const l=(f||'').split('@')[0];if(e.agent_email&&f.toLowerCase()==e.agent_email.toLowerCase()&&e.agent_contact)return e.agent_contact;return /no-?reply|donotreply|^info$|^support$|^leads$/i.test(l)?(f.split('@')[1]||l):l.replace(/[._]/g,' ')};
function convC(e){const T=e.thread||[];const enq=T.find(m=>m.enquiry);const txt=(enq&&enq.text)||msgOf(e);
 const ag=T.filter(m=>m.dir==='agent');const last=ag.slice(-2);
 let h='<div class="cv">'+senderTag(e);
 h+=txt?`<details class="sent"><summary><span class="more">✉️ ${isAs(e)?'Текст ассистента':'Текст Маши'}${e.sent_at?' · '+fmtD(e.sent_at):''}</span></summary><pre>${esc(txt)}</pre></details>`
   :`<div class="sent" style="font-size:12px;opacity:.8">✉️ Текст запроса недоступен — ${esc(e.text_missing_reason||'sent via Rightmove; no copy in Gmail.')}${ag.length?' Agent reply below.':''}</div>`;
 const mine=T.filter(m=>m.dir==='masha'&&!m.enquiry);
 const lastM=T.filter(m=>!m.enquiry).slice(-2);
 h+=lastM.map(m=>`<div class="msg ${m.dir==='masha'?'me':'ag'}"><div class="mh">${whoM(m,e)} · ${m.date?fmtD(m.date)+' '+tmZ(m.date,TZ):''}</div><pre class="clip">${esc(m.text||'')}</pre></div>`).join('');
 if(T.length>lastM.length+(enq?1:0))h+=convBox(e);
 return h+'</div>'}

const petS=l=>{const p=(l.agent_facts&&l.agent_facts.pets)||l.pets||'';return /consider|allowed|friendly|ok/i.test(p)?'можно':/no pets|not allowed/i.test(p)?'нельзя':'питомцы ?'};
const AGE_RU=n=>n==null?'':n==0?'сегодня':n==1?'1 день':(n<5?n+' дня':n+' дней');
const NXK={openrent_confirm:'Подтвердить запрос на OpenRent',call:'Агент просит перезвонить',form:'Заполнить форму и вернуть',qualify:'Ответить на вопросы агента',availability:'Предложить время просмотра',video:'Агент предлагает видео — ответить',question:'Ответить агенту',awaiting:'Ждём ответа агента',viewing_booked:'Просмотр назначен',info:'Агент ответил',closed:'Закрыто'};
const nx1=e=>{const n=e.next||{};const a=nAgo(n.since);return (NXK[n.kind]||n.text||'')+(n.who!=='none'&&a!=null?' · '+AGE_RU(a):'')};
let sheetId=null;
function sheetOpen(h){const sh=document.getElementById('sheet');sh.querySelector('.sbody').innerHTML=h;sh.style.display='flex';document.body.style.overflow='hidden';
 if(tg&&tg.BackButton){tg.BackButton.show();tg.BackButton.onClick(sheetClose)}}
function sheetClose(){const sh=document.getElementById('sheet');sh.style.display='none';document.body.style.overflow='';sheetId=null;tg&&tg.BackButton&&tg.BackButton.hide()}
function bubbles(e){const T=(e.thread||[]);const enq=T.find(m=>m.enquiry);const txt=(enq&&enq.text)||msgOf(e);
 let h=`<div class="sndr ${isAs(e)?'s-as':'s-ma'}">${isAs(e)?'🤖 Ассистент':'👩 Маша'} <span>· ${isOR(e)?'OpenRent':chanOf(e)}${e.sent_at?' · '+fmtD(e.sent_at):''}</span></div>`;
 h+=txt?bub({dir:'masha',enquiry:1,text:txt,date:e.sent_at},e):`<div class="sysl">ℹ️ ${esc(e.text_missing_reason||'Текст запроса недоступен.')}</div>`;
 const rest=T.filter(m=>!m.enquiry);const sys=rest.filter(m=>m.system);
 h+=rest.filter(m=>!m.system).map(m=>bub(m,e)).join('');
 if(sys.length)h+=`<details class="sysd"><summary>🤖 Автоматические письма (${sys.length})</summary>${sys.map(m=>`<div class="sysl">${m.date?fmtD(m.date)+' · ':''}${esc(m.label||'auto')}</div>`).join('')}</details>`;
 return h}
function bub(m,e){const me=m.dir!=='agent';const who=me?((m.by==='assistant'||(m.enquiry&&isAs(e)))?'🤖 Ассистент':'👩 Маша'):'🏢 '+esc(agName(m.from||'',e));
 const t=esc(m.text||'');const long=(m.text||'').length>180||(m.text||'').split('\n').length>3;
 return `<div class="bub ${me?'me':'ag'}"><div class="mh">${who}${m.enquiry?' · запрос':''}${m.date?' · '+fmtD(m.date)+(String(m.date).length>10?' '+tmZ(m.date,TZ):''):''}</div><div class="bt${long?' cl':''}">${t}</div>${long?'<button class="more" onclick="this.previousElementSibling.classList.toggle(\'cl\');this.textContent=this.textContent==\'ещё\'?\'свернуть\':\'ещё\'">ещё</button>':''}</div>`}
function openSheet(id){const e=sentOf(id);if(!e)return;sheetId=id;const L=data.find(l=>String(l.id)==String(id));const n=e.next||{};const a=nAgo(n.since);const lk=linkOf(e,L);
 let h=`<div class="shh"><div><div class="t">${esc(e.title||(L&&L.title)||'')}</div><div class="sub">${esc([areaOf(e,L),e.price||(L&&'£'+L.price),agShort(e)].filter(Boolean).join(' · '))}</div></div><button class="b ic" onclick="sheetClose()" aria-label="Закрыть">✕</button></div>
 <div class="enqline">${av(e)}${pill(e)}</div>`;
 if(n.text)h+=`<div class="nx ${n.who==='us'?'nx-us':n.who==='agent'?'nx-ag':'nx-none'}"><div class="nxh">${n.who==='us'?'👉 Наш ход':n.who==='agent'?'⏳ Ход агента':'✔️ Готово'}${a!=null&&n.who!=='none'?' · '+AGE_RU(a):''}</div><div class="nxt">${esc(n.text)}</div>
  <div class="cta">${primary(e).replace("openSheet('"+esc(id)+"')","document.getElementById('drf').scrollIntoView()")}</div></div>`;
 if(n.draft){const ed=DR[id]!=null;h+=`<div class="drf" id="drf"><div class="drh">Черновик ответа${n.reply_to?' → '+esc(n.reply_to):''}${ed?' · изменён':''}</div><div class="bt" id="dr-${esc(id)}">${esc(drOf(e))}</div>
  <textarea id="de-${esc(id)}" style="display:none" rows="6"></textarea>
  <div class="cta">${n.reply_to?`<button class="b pri" onclick="drSend('${esc(id)}')">📨 Отправить через бота</button>`:''}<button class="b sec" onclick="drEdit('${esc(id)}')">✏️</button><button class="b sec" onclick="drCopy('${esc(id)}')">📋</button></div>
  <div class="drn">Ничего не уйдёт без подтверждения в чате бота.</div></div>`}
 h+=`<div class="conv2">${bubbles(e)}</div>`;
 const c=[e.agent_contact,e.agent_phone,e.agent_email].filter(Boolean);
 if(c.length)h+=`<div class="sub" style="margin:10px 0">👤 ${c.map(esc).join(' · ')}</div>`;
 h+=`<div class="cta">${L?`<button class="b sec" onclick="sheetClose();openCard('${esc(L.id)}')">🏠 Карточка</button>`:''}${lk?`<button class="b sec" onclick="link('${esc(lk)}')">${linkLbl(e,L)} ↗</button>`:''}</div>`;
 sheetOpen(h)}
function openMore(id){const l=data.find(x=>String(x.id)==String(id));if(!l)return;const e=sentOf(id);
 let h=`<div class="shh"><div><div class="t">${esc(l.title)}</div><div class="sub">£${Number(l.price).toLocaleString()} · ${esc(hoodName(l))}</div></div><button class="b ic" onclick="sheetClose()" aria-label="Закрыть">✕</button></div>
 <div class="menu"><button class="b sec" onclick="link('${esc(l.url)}')">${srcName(l)} ↗</button>
 <button class="b sec" onclick="save('${l.id}');sheetClose()">${saved.has(String(l.id))?'❤️ Убрать из избранного':'🤍 В избранное'}</button>
 ${e?`<button class="b sec" onclick="openSheet('${esc(e.listing_id)}')">💬 Переписка</button>`:''}</div>
 <div class="facts">${[l.area,l.floor,l.pets&&'🐾 '+l.pets,l.furnished].filter(Boolean).map(esc).join(' · ')}</div>
 ${l.agent_facts?`<div class="facts">ℹ️ Из писем агента: ${esc(Object.entries(l.agent_facts).filter(([k])=>k!=='src').map(([k,v])=>v).join(' · '))}</div>`:''}
 ${l.notes?`<div class="notes">${esc(l.notes)}</div>`:''}${l.score_breakdown?bdHtml(l):''}
 <div class="sub">найдено ${fmtD(l.date_found)} · статус <select onchange="setS('${l.id}',this.value)">${ST.slice(1).map(x=>`<option ${x==st(l)?'selected':''}>${x}</option>`).join('')}</select></div>`;
 sheetOpen(h)}
function row(e){const L=data.find(l=>String(l.id)==String(e.listing_id));
 return `<div class="row1" onclick="openSheet('${esc(e.listing_id)}')" role="button" tabindex="0">${av(e)}<div class="rm"><div class="rt1"><b>${esc((e.title||(L&&L.title)||'').split(',')[0])}</b><span class="rp">${esc(e.price||(L?'£'+L.price:''))}</span></div>
 <div class="sub">${esc([areaOf(e,L),agShort(e)].filter(Boolean).join(' · '))}</div><div class="rl">${pill(e)}<span class="nx1">${esc(nx1(e))}</span></div></div><span class="chev">›</span></div>`}

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
const tmZ=(d,z)=>new Date(d).toLocaleTimeString('en-GB',{timeZone:z,hour:'2-digit',minute:'2-digit'});
const vWhen=v=>v.datetime?`${tmZ(v.datetime,TZ)} 🇬🇧 · ${tmZ(v.datetime,'Europe/Madrid')} 🇪🇸`:'Время не назначено';
function vcard(v,past){const L=v.listing_id&&data.find(l=>String(l.id)==String(v.listing_id));const e=sentOf(v.listing_id);
 const stl={confirmed:['Подтверждён','pl-green'],proposed:['Ждём время','pl-amber'],done:['Прошёл','pl-dark'],cancelled:['Отменён','pl-dark']}[v.status]||[v.status,'pl-grey'];
 const ph=v.agent_phone?v.agent_phone.replace(/[^+\d]/g,''):'';
 const pri=!past&&ph&&v.status==='proposed'?`<a class="b pri" href="tel:${esc(ph)}">📞 Позвонить</a>`:(e?`<button class="b ${past?'sec':'pri'}" onclick="openSheet('${esc(e.listing_id)}')">💬 Переписка</button>`:'');
 return `<div class="vrow${past?' past':''}"><div class="vt">${v.datetime?`<b>${tmZ(v.datetime,TZ)}</b><span>🇬🇧</span><small>${tmZ(v.datetime,'Europe/Madrid')} 🇪🇸</small>`:'<b>?</b>'}</div>
 <div class="rm"><div class="rt1"><b>${esc((v.title||v.address||'').split(' · ')[0])}</b></div><div class="sub">${esc(v.address&&v.address!==v.title?v.address:'')}</div>
 <div class="sub">${[v.type=='video'?'📹 видео':(v.datetime?'🚶 на месте':''),v.agent].filter(Boolean).map(esc).join(' · ')}${ph?` · <a href="tel:${esc(ph)}">${esc(v.agent_phone)}</a>`:''}</div>
 <div class="rl"><span class="pill ${stl[1]}">${stl[0]}</span>${v.calendar_event_id?'<span class="sub">📅 в календаре</span>':''}</div>
 ${v.notes&&!past?`<div class="nx1 cl2">${esc(v.notes)}</div>`:''}
 <div class="cta">${pri}${L?`<button class="b sec" onclick="openCard('${esc(L.id)}')">🏠</button>`:''}</div></div></div>`}
function renderV(){const now=Date.now();const up=[],pa=[];let tbc=[];
 V.forEach(v=>{if(!v.datetime)tbc.push(v);else if(new Date(v.datetime)>=now-3600e3&&v.status!='done')up.push(v);else pa.push(v)});
 up.sort((a,b)=>a.datetime.localeCompare(b.datetime));pa.sort((a,b)=>b.datetime.localeCompare(a.datetime));
 tbc=tbc.filter(v=>{const e=sentOf(v.listing_id);return !e||!['Let agreed','Off the market','rejected'].includes(e.status)});tbc.sort((a,b)=>(/video call/i.test(b.notes||'')-/video call/i.test(a.notes||''))||(b.asked||'').localeCompare(a.asked||''));
 let h='<div class="sticky"><h1>📅 Просмотры <span class="cnt">время 🇬🇧 Лондон · 🇪🇸 Мадрид</span></h1></div>';let last='';
 if(!V.length){document.getElementById('vlist').innerHTML=h+EMPTY('📅','Просмотров пока нет','Появятся, когда агент подтвердит время.');return}
 h+='<div class="sec-h us">Ближайшие</div>';
 up.forEach(v=>{const k=dayK(v.datetime);if(k!=last){h+=`<div class="day" style="opacity:.8">${k}</div>`;last=k}h+=vcard(v)});
 if(!up.length)h+='<div class="sub" style="padding:0 6px">Нет назначенных просмотров</div>';
 if(tbc.length)h+=`<div class="sec-h">Предложены / ждём время <span>${tbc.length}</span></div>`+tbc.map(v=>vcard(v)).join('');
 if(pa.length)h+=`<details class="clsd"><summary class="sec-h">Прошедшие <span>${pa.length}</span> ▸</summary>${pa.map(v=>`<div class="day" style="opacity:.7">${dayK(v.datetime)}</div>`+vcard(v,1)).join('')}</details>`;
 document.getElementById('vlist').innerHTML=h}
const rcard=r=>`<div class="reply"><span style="font-size:12px;color:var(--hint)">↳ Reply ${r.date?dayK(r.date)+' '+tm(r.date):''}</span><div class="t" style="font-size:14px">${esc(r.agent)}</div>
 <div style="margin:4px 0">${esc(r.summary)}</div>${r.needs_reply?'<span class="badge nr">needs reply</span>':'<span class="badge">no reply needed</span>'}
 ${r.suggested_next_step?`<div class="notes">➡️ ${esc(r.suggested_next_step)}</div>`:''}</div>`;
const convBox=e=>{const T=e.thread,na=T.filter(m=>m.dir==='agent').length;const c=e.agent_email||e.agent_phone?`<div class="facts">${[e.agent_contact,e.agent_phone,e.agent_email].filter(Boolean).map(esc).join(' · ')}</div>`:'';
 return c+`<details class="sent conv"><summary><span class="more">💬 conversation (${T.length} msg${na?', '+na+' from agent':''})</span></summary>${T.map(m=>`<div class="msg ${m.dir==='masha'?'me':'ag'}"><div class="mh">${whoM(m,e)}${m.enquiry?' (enquiry)':''} · ${m.date?fmtD(m.date)+' '+new Date(m.date).toLocaleTimeString('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}):''}</div><pre>${esc(m.text||'')}</pre></div>`).join('')}</details>`};
function renderR(){let SS=[...S].sort((a,b)=>((a.action_rank??2)-(b.action_rank??2))||(b.sent_at||'').localeCompare(a.sent_at||''));
 if(sFilt!=='all')SS=SS.filter(e=>sFilt==='assistant'?isAs(e):!isAs(e));
 const us=SS.filter(e=>(e.next||{}).who==='us'),ag=SS.filter(e=>(e.next||{}).who==='agent'),cl=SS.filter(e=>!['us','agent'].includes((e.next||{}).who));
 let h=`<div class="sticky"><h1>✉️ Запросы <span class="cnt">${S.length}</span></h1><div class="row">${[['all','Все',S.length],['masha','👩 Маша',S.filter(e=>!isAs(e)).length],['assistant','🤖 Ассистент',S.filter(isAs).length]].map(([k,lab,n])=>`<button class="chip ${sFilt==k?'on':''}" onclick="sFilt='${k}';renderR()">${lab} ${n}</button>`).join('')}</div></div>`;
 if(!SS.length){document.getElementById('rlist').innerHTML=h+EMPTY('✉️','Пока нет запросов','Нажмите «Написать агенту» на карточке квартиры.');return}
 h+=`<div class="sec-h us">👉 Наш ход <span>${us.length}</span></div>`+(us.length?`<div class="list">${us.map(row).join('')}</div>`:'<div class="sub" style="padding:0 6px">Всё отвечено 🎉</div>');
 h+=`<div class="sec-h">⏳ Ждём агента <span>${ag.length}</span></div><div class="list">${ag.map(row).join('')}</div>`;
 if(cl.length)h+=`<details class="clsd"><summary class="sec-h">✔️ Закрыто <span>${cl.length}</span> ▸</summary><div class="list">${cl.map(row).join('')}</div></details>`;
 document.getElementById('rlist').innerHTML=h;if(sheetId&&document.getElementById('sheet').style.display==='flex')openSheet(sheetId)}

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
getJ('listings.json').then(d=>{data=Array.isArray(d)?d:[];render();if(curTab=='replies')renderR();if(curTab=='viewings')renderV();setTimeout(markSeen,1500);const m=(location.hash||'').match(/^#flat-(\d+)/);if(m)openCard(m[1])});
Promise.all([getJ('viewings.json'),getJ('replies.json'),getJ('sent.json')]).then(([a,b,c])=>{V=Array.isArray(a)?a:[];R=Array.isArray(b)?b:[];S=Array.isArray(c)?c:[];{const n=S.filter(e=>(e.next||{}).who==='us').length,u=document.getElementById('ubadge');if(u){u.textContent=n;u.style.display=n?'inline-block':'none'}}render();if(curTab=='viewings')renderV();if(curTab=='replies')renderR()});
const h0=(location.hash||'').slice(1);if(!/^flat-/.test(h0))tab(h0=='viewings'||h0=='replies'?h0:'flats');

const BOT='Gogi_grot_bot';
function deep(p){const u='https://t.me/'+BOT+'?start='+p;tg&&tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred('success');if(tg&&tg.openTelegramLink)tg.openTelegramLink(u);else window.open(u,'_blank')}
async function clip(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}}
function hint(m){const e=document.getElementById('sdhint');e.textContent=m;e.style.display='block';toast(m)}

function openCard(id){const l=data.find(x=>String(x.id)==String(id));if(!l){toast('Квартиры нет в списке');return}sheetClose();
 filt='all';if(rating(l)==='dislike')showHid=true;tab('flats');render();
 const el=document.getElementById('c-'+id);if(!el)return;el.scrollIntoView({block:'start'});window.scrollBy(0,-(document.getElementById('hdr').offsetHeight||0)-6);
 el.classList.add('hl');setTimeout(()=>el.classList.remove('hl'),2500);
 try{history.replaceState(null,'','#flat-'+id)}catch(e){}}
