import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,doc,getDoc,writeBatch,serverTimestamp,collection} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const app=getApps().length?getApp():initializeApp(window.GUILD_OPS_CONFIG.firebase),auth=getAuth(app),db=getFirestore(app);
const gid=window.CAT_HERO_V4_TENANT?.gid?.()||new URLSearchParams(location.search).get('g')||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statGroups=[
  {
    title:'기본 설정',
    className:'v4admin-basic-grid',
    fields:[
      ['base','기본격추 (탈것 포함)','%',0.1],
      ['minScore','최소점수','',1]
    ]
  },
  {
    title:'지역 격추',
    className:'v4admin-region-grid',
    fields:[
      ['wolf','늑대','%',0.1],
      ['pirate','해적','%',0.1],
      ['cat','고양이','%',0.1],
      ['food','음식','%',0.1],
      ['galaxy','은하','%',0.1]
    ]
  },
  {
    title:'상층 격추',
    className:'v4admin-upper-grid',
    fields:[
      ['z1r','1구역','%',0.1],
      ['z2r','2구역','%',0.1],
      ['z3r','3구역','%',0.1]
    ]
  }
];
let overlay=null;

function close(){overlay?.remove();overlay=null;}

function shell(title){
  close();
  overlay=document.createElement('div');
  overlay.id='v4AdminEditorOverlay';
  overlay.innerHTML=`<section class="v4admin-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="v4admin-header">
      <b>${esc(title)}</b>
      <button id="v4adminClose" type="button" aria-label="닫기">×</button>
    </header>
    <div id="v4adminContent" class="v4admin-content"></div>
  </section>`;
  document.body.append(overlay);
  overlay.querySelector('#v4adminClose').onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  return overlay.querySelector('#v4adminContent');
}

async function authorize(){
  if(!gid){alert('길드 전용 주소에서 접속하세요.');return false;}
  return !!await window.CAT_HERO_V4_TENANT?.ensureAdmin?.();
}

function statFieldHtml([key,label,unit,step]){
  const id=`v4stat_${key}`;
  return `<div class="v4stat-field" data-field="${key}">
    <label for="${id}">${esc(label)}</label>
    <div class="v4stat-input-wrap${unit?' has-unit':''}">
      <input id="${id}" type="number" inputmode="decimal" step="${step}" min="0" data-stat="${key}" value="0" aria-label="${esc(label)}">
      ${unit?`<span class="v4stat-unit" aria-hidden="true">${unit}</span>`:''}
    </div>
  </div>`;
}

function statSectionsHtml(){
  return statGroups.map(group=>`<section class="v4stat-section">
    <div class="v4stat-section-title">${esc(group.title)}</div>
    <div class="v4stat-grid ${group.className}">${group.fields.map(statFieldHtml).join('')}</div>
  </section>`).join('');
}

async function rosterEditor(){
  if(!await authorize())return;
  const host=shell('길드원 추가 · 수정 · 삭제');
  host.innerHTML='<div class="v4admin-loading">길드원 정보를 불러오는 중…</div>';
  try{
    const snap=await getDoc(doc(db,'guilds',gid,'data','roster'));
    const data=snap.exists()?snap.data():{},members=data.members||{};
    const names=Object.keys(members).sort((a,b)=>Number(members[b]?.base||0)-Number(members[a]?.base||0));
    host.innerHTML=`
      <section class="v4admin-identity-card">
        <label class="v4admin-control-label" for="v4memberPick">길드원 선택</label>
        <div class="v4admin-select-wrap">
          <select id="v4memberPick">
            <option value="">+ 새 길드원 등록</option>
            ${names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}
          </select>
        </div>
        <label class="v4admin-control-label v4admin-name-label" for="v4memberName">닉네임</label>
        <input id="v4memberName" class="v4admin-name-input" maxlength="30" autocomplete="off" placeholder="닉네임을 입력하세요">
      </section>

      <div class="v4admin-section-stack">${statSectionsHtml()}</div>

      <p class="v4admin-note">변경사항은 해당 길드에 저장되며 관리자 활동 기록에도 남습니다.</p>
      <div class="v4admin-actions v4admin-actionbar">
        <button id="v4memberSave" class="primary" type="button">저장</button>
        <button id="v4memberDelete" class="danger" type="button" disabled>길드원 삭제</button>
      </div>`;

    const picker=host.querySelector('#v4memberPick'),nameInput=host.querySelector('#v4memberName'),del=host.querySelector('#v4memberDelete');
    function fill(){
      const n=picker.value,m=members[n]||{};
      nameInput.value=n;
      host.querySelectorAll('[data-stat]').forEach(el=>{
        const k=el.dataset.stat;
        el.value=k in m?m[k]:(m.field?.[k]??0);
      });
      del.disabled=!n;
    }
    picker.onchange=fill;
    fill();

    host.querySelector('#v4memberSave').onclick=async()=>{
      const old=picker.value,name=nameInput.value.trim();
      if(!name||name.length>30)return alert('닉네임을 1~30자로 입력하세요.');
      if((!old||old!==name)&&Object.hasOwn(members,name))return alert('이미 등록된 닉네임입니다.');
      const previous=members[old]||{},entry={...previous,field:{...(previous.field||{})}};
      for(const el of host.querySelectorAll('[data-stat]')){
        const k=el.dataset.stat,v=Number(el.value);
        if(!Number.isFinite(v)||v<0)return alert('격추 및 점수는 0 이상의 숫자로 입력하세요.');
        if(['wolf','pirate','cat','food','galaxy'].includes(k))entry.field[k]=v;else entry[k]=v;
      }
      const updated={...members};
      if(old&&old!==name)delete updated[old];
      updated[name]=entry;
      const aliases={...(data.aliases||{})};
      if(old&&old!==name)aliases[old]=name;
      const batch=writeBatch(db);
      // Replace the entire members/aliases maps. Using set(...,{merge:true}) here would
      // preserve nested keys that disappeared from the new map, which breaks rename/delete.
      batch.update(doc(db,'guilds',gid,'data','roster'),{members:updated,aliases,updatedAt:serverTimestamp()});
      batch.update(doc(db,'guilds',gid),{memberCount:Object.keys(updated).length,updatedAt:serverTimestamp()});
      batch.set(doc(collection(db,'guilds',gid,'audit')),{kind:!old?'길드원 추가':old!==name?'닉네임 변경':'길드원 격추 변경',name,text:!old?'길드원 등록':old!==name?`${old} → ${name}`:`${name} 기본격추 ${entry.base}% · 최소점수 ${entry.minScore}`,uid:auth.currentUser?.uid||'',at:serverTimestamp()});
      try{
        await batch.commit();
        alert('저장 완료. 길드원 화면을 새로 불러옵니다.');
        close();
        parent.postMessage({type:'cat-hero-v4-data-changed',guildId:gid},location.origin);
      }catch(e){alert('저장 실패: '+(e.code||e.message));}
    };

    del.onclick=async()=>{
      const old=picker.value;
      if(!old||!confirm(`${old} 길드원을 삭제하시겠습니까?`))return;
      const updated={...members};delete updated[old];
      const aliases={...(data.aliases||{})};
      for(const a of Object.keys(aliases)){
        if(a===old||aliases[a]===old)delete aliases[a];
      }
      const batch=writeBatch(db);
      // Replace the full maps so the removed nickname cannot survive a Firestore merge.
      batch.update(doc(db,'guilds',gid,'data','roster'),{members:updated,aliases,updatedAt:serverTimestamp()});
      batch.update(doc(db,'guilds',gid),{memberCount:Object.keys(updated).length,updatedAt:serverTimestamp()});
      batch.set(doc(collection(db,'guilds',gid,'audit')),{kind:'길드원 삭제',name:old,text:'길드원 삭제',uid:auth.currentUser?.uid||'',at:serverTimestamp()});
      try{
        await batch.commit();
        alert('삭제 완료');
        close();
        parent.postMessage({type:'cat-hero-v4-data-changed',guildId:gid},location.origin);
      }catch(e){alert('삭제 실패: '+(e.code||e.message));}
    };
  }catch(e){host.innerHTML=`<div class="v4admin-error">길드원 불러오기 실패: ${esc(e.code||e.message)}</div>`;}
}

async function guildEditor(){
  if(!await authorize())return;
  const host=shell('서버번호 · 길드명 수정');
  try{
    const snap=await getDoc(doc(db,'guilds',gid)),g=snap.data()||{};
    host.innerHTML=`<div class="v4admin-guild-row">
      <label>서버번호<input id="v4server" maxlength="12" value="${esc(g.server||'')}"></label>
      <label>길드명<input id="v4guildname" maxlength="40" value="${esc(g.name||'')}"></label>
    </div><div class="v4admin-actions"><button class="primary" id="v4guildSave">변경 저장</button></div>`;
    host.querySelector('#v4guildSave').onclick=async()=>{
      const server=host.querySelector('#v4server').value.trim(),name=host.querySelector('#v4guildname').value.trim();
      if(!server||!name)return alert('서버번호와 길드명을 모두 입력하세요.');
      const batch=writeBatch(db);
      batch.update(doc(db,'guilds',gid),{server,name,updatedAt:serverTimestamp()});
      batch.set(doc(collection(db,'guilds',gid,'audit')),{kind:'길드 정보 변경',name,text:`서버 ${g.server||'-'} → ${server} / 길드명 ${g.name||'-'} → ${name}`,uid:auth.currentUser?.uid||'',at:serverTimestamp()});
      try{
        await batch.commit();
        alert('길드 정보 변경 완료');
        close();
        parent.postMessage({type:'cat-hero-v4-data-changed',guildId:gid},location.origin);
      }catch(e){alert('변경 실패: '+(e.code||e.message));}
    };
  }catch(e){host.innerHTML=`<div class="v4admin-error">${esc(e.code||e.message)}</div>`;}
}

const style=document.createElement('style');
style.textContent=`
#v4AdminEditorOverlay{position:fixed;inset:0;z-index:2147483646;background:rgba(8,2,18,.82);display:grid;place-items:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));box-sizing:border-box;overscroll-behavior:contain}
#v4AdminEditorOverlay *{box-sizing:border-box}
#v4AdminEditorOverlay .v4admin-panel{width:min(540px,100%);max-height:88vh;max-height:min(91dvh,820px);display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden;background:#fff;border:3px solid #8742e7;border-radius:26px;color:#34204e;font-family:inherit;box-shadow:0 24px 70px rgba(0,0,0,.42)}
#v4AdminEditorOverlay .v4admin-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid #eee6f8;background:#fff;z-index:2}
#v4AdminEditorOverlay .v4admin-header b{min-width:0;font-size:clamp(20px,5.2vw,25px);font-weight:950;letter-spacing:-.035em;color:#35165d}
#v4AdminEditorOverlay .v4admin-header button{flex:0 0 auto;display:grid;place-items:center;width:46px;height:46px;padding:0;border:1.5px solid #ddcff0;border-radius:15px;background:#faf7ff;color:#6531a9;font:900 28px/1 inherit;box-shadow:none}
#v4AdminEditorOverlay .v4admin-header button:active{transform:scale(.97);background:#f2eaff}
#v4AdminEditorOverlay .v4admin-content{min-height:0;overflow:auto;padding:15px 16px 14px;scrollbar-gutter:stable;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
#v4AdminEditorOverlay .v4admin-loading,#v4AdminEditorOverlay .v4admin-error{padding:28px 12px;text-align:center;color:#776789;font-weight:800;line-height:1.5}
#v4AdminEditorOverlay .v4admin-identity-card{padding:14px;border:1.5px solid #e1d5f1;border-radius:20px;background:linear-gradient(180deg,#fbf9ff 0%,#f7f2fd 100%)}
#v4AdminEditorOverlay .v4admin-control-label{display:block;margin:0 0 7px;font-size:13px;font-weight:900;color:#5d337f;letter-spacing:-.02em}
#v4AdminEditorOverlay .v4admin-name-label{margin-top:13px}
#v4AdminEditorOverlay .v4admin-select-wrap{position:relative}
#v4AdminEditorOverlay .v4admin-select-wrap:after{content:'⌄';position:absolute;right:15px;top:50%;transform:translateY(-56%);pointer-events:none;color:#5b2b96;font-size:20px;font-weight:950}
#v4AdminEditorOverlay select,#v4AdminEditorOverlay .v4admin-name-input,#v4AdminEditorOverlay .v4admin-guild-row input{display:block;width:100%;min-width:0;height:48px;margin:0;padding:0 42px 0 14px;border:1.5px solid #d9c9eb;border-radius:15px;background:#fff;color:#312046;font:800 16px/1 inherit;outline:none;box-shadow:0 2px 8px rgba(74,36,111,.04);transition:border-color .15s,box-shadow .15s,background .15s}
#v4AdminEditorOverlay select{-webkit-appearance:none;appearance:none}
#v4AdminEditorOverlay .v4admin-name-input{padding-right:14px}
#v4AdminEditorOverlay select:focus,#v4AdminEditorOverlay input:focus{border-color:#8145d9;box-shadow:0 0 0 3px rgba(129,69,217,.12);background:#fff}
#v4AdminEditorOverlay .v4admin-section-stack{display:grid;gap:12px;margin-top:13px}
#v4AdminEditorOverlay .v4stat-section{padding:13px;border:1.5px solid #e1d5f1;border-radius:20px;background:#fcfbfe}
#v4AdminEditorOverlay .v4stat-section-title{margin:0 0 10px;font-size:15px;font-weight:950;letter-spacing:-.025em;color:#45206d}
#v4AdminEditorOverlay .v4stat-grid{display:grid;gap:9px}
#v4AdminEditorOverlay .v4admin-basic-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
#v4AdminEditorOverlay .v4admin-region-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
#v4AdminEditorOverlay .v4admin-region-grid .v4stat-field:last-child{grid-column:1/-1;width:calc(50% - 4.5px)}
#v4AdminEditorOverlay .v4admin-upper-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
#v4AdminEditorOverlay .v4stat-field{min-width:0;padding:10px 10px 9px;border:1px solid #e8def3;border-radius:15px;background:#fff;box-shadow:0 1px 3px rgba(63,29,99,.03)}
#v4AdminEditorOverlay .v4stat-field>label{display:block;min-height:18px;margin:0 0 5px;text-align:center;font-size:clamp(11px,3vw,13px);font-weight:900;line-height:1.25;color:#57307d;letter-spacing:-.02em;white-space:normal}
#v4AdminEditorOverlay .v4stat-input-wrap{position:relative;height:40px;display:flex;align-items:center;border-radius:11px;background:#f8f5fc;border:1.5px solid transparent;transition:border-color .15s,background .15s,box-shadow .15s}
#v4AdminEditorOverlay .v4stat-input-wrap:focus-within{border-color:#8145d9;background:#fff;box-shadow:0 0 0 3px rgba(129,69,217,.10)}
#v4AdminEditorOverlay .v4stat-input-wrap input{width:100%;height:100%;min-width:0;border:0!important;outline:0!important;background:transparent!important;box-shadow:none!important;padding:0 11px;color:#26153f;text-align:right;font:900 18px/1 inherit;font-variant-numeric:tabular-nums}
#v4AdminEditorOverlay .v4stat-input-wrap.has-unit input{padding-right:29px}
#v4AdminEditorOverlay .v4stat-unit{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#876fa2;font-size:12px;font-weight:900;pointer-events:none}
#v4AdminEditorOverlay input[type=number]::-webkit-inner-spin-button,#v4AdminEditorOverlay input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
#v4AdminEditorOverlay input[type=number]{-moz-appearance:textfield}
#v4AdminEditorOverlay .v4admin-note{margin:11px 4px 0;color:#83728f;font-size:11.5px;font-weight:700;line-height:1.45;text-align:center}
#v4AdminEditorOverlay .v4admin-actions{display:flex;gap:9px;margin-top:14px}
#v4AdminEditorOverlay .v4admin-actionbar{position:sticky;bottom:-14px;z-index:3;margin-left:-16px;margin-right:-16px;padding:12px 16px max(12px,env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(255,255,255,.72),#fff 24%);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
#v4AdminEditorOverlay .v4admin-actions button{flex:1;min-height:48px;border:1.5px solid #8a4cda;border-radius:15px;padding:10px 8px;font:950 16px/1.15 inherit;letter-spacing:-.02em}
#v4AdminEditorOverlay .primary{background:linear-gradient(180deg,#8249db,#6730bb);color:#fff;box-shadow:0 8px 18px rgba(103,48,187,.18)}
#v4AdminEditorOverlay .danger{background:#fff8fa;color:#b8435a;border-color:#e6b5c0!important}
#v4AdminEditorOverlay .danger:disabled{opacity:.38;box-shadow:none}
#v4AdminEditorOverlay .v4admin-guild-row{display:grid;grid-template-columns:minmax(0,.36fr) minmax(0,.64fr);gap:10px;padding:14px;border:1.5px solid #e1d5f1;border-radius:20px;background:#fbf9ff}
#v4AdminEditorOverlay .v4admin-guild-row label{min-width:0;margin:0;font-size:13px;font-weight:900;color:#5d337f}
#v4AdminEditorOverlay .v4admin-guild-row input{height:47px;margin-top:7px;padding:0 12px}
@media (max-width:380px){
  #v4AdminEditorOverlay{padding-left:7px;padding-right:7px}
  #v4AdminEditorOverlay .v4admin-panel{border-radius:22px}
  #v4AdminEditorOverlay .v4admin-header{padding:15px 14px 12px}
  #v4AdminEditorOverlay .v4admin-header button{width:42px;height:42px;border-radius:13px}
  #v4AdminEditorOverlay .v4admin-content{padding:12px 12px 12px}
  #v4AdminEditorOverlay .v4admin-identity-card,#v4AdminEditorOverlay .v4stat-section{padding:11px}
  #v4AdminEditorOverlay .v4stat-field{padding:8px 7px}
  #v4AdminEditorOverlay .v4stat-grid{gap:7px}
  #v4AdminEditorOverlay .v4admin-region-grid .v4stat-field:last-child{width:calc(50% - 3.5px)}
  #v4AdminEditorOverlay .v4stat-input-wrap input{font-size:17px;padding-left:8px;padding-right:8px}
  #v4AdminEditorOverlay .v4stat-input-wrap.has-unit input{padding-right:25px}
  #v4AdminEditorOverlay .v4stat-unit{right:8px}
  #v4AdminEditorOverlay .v4admin-actionbar{margin-left:-12px;margin-right:-12px;padding-left:12px;padding-right:12px}
}
@media (min-width:700px){
  #v4AdminEditorOverlay .v4admin-panel{width:min(600px,92vw)}
  #v4AdminEditorOverlay .v4admin-content{padding:18px 20px 16px}
  #v4AdminEditorOverlay .v4admin-actionbar{margin-left:-20px;margin-right:-20px;padding-left:20px;padding-right:20px}
}
`;
document.head.append(style);
window.DOSALJA_ADMIN={...(window.DOSALJA_ADMIN||{}),rosterEditor,guildEditor};
