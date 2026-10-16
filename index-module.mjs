import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {initializeAuth,getAuth,onAuthStateChanged,setPersistence,indexedDBLocalPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,onSnapshot,writeBatch,runTransaction,serverTimestamp,addDoc,query,where} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const CFG=window.GUILD_OPS_CONFIG;
const app=getApps().length?getApp():initializeApp(CFG.firebase);
let auth;
try{
  auth=initializeAuth(app,{persistence:[browserLocalPersistence,indexedDBLocalPersistence]});
}catch(_e){
  auth=getAuth(app);
}
const db=getFirestore(app),root=document.getElementById('root');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rand=(n=10)=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(n);crypto.getRandomValues(a);return Array.from(a,x=>chars[x%chars.length]).join('');};
const randSecret=(n=36)=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-',a=new Uint32Array(n);crypto.getRandomValues(a);return Array.from(a,x=>chars[x%chars.length]).join('');};
const permissionMessage='관리 권한이 없습니다.\n관리자 기능은 메인 화면의 관리자 메뉴에서 인증 후 사용할 수 있습니다.';
async function sha256(text){const bytes=new TextEncoder().encode(String(text));const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
async function copyText(text,label='내용'){let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);ok=true;}}catch(_e){}if(!ok){try{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);ok=document.execCommand('copy');ta.remove();}catch(_e){}}if(ok){alert(label+' 복사 완료');return true;}prompt(label+' 복사',text);return false;}

let gid='';
let accessSecret='';
let accessHash='';
let accessMode='landing'; // landing | bootstrap | private
let frame=null;
let roleCheckSerial=0;
window.CAT_HERO_V4_CONTEXT=null;
window.CAT_HERO_V4_AUTH_STATE={guildId:'',isGuildAdmin:false,isPlatformAdmin:false,user:null,ready:false};

let durablePersistenceMode='pending';
async function ensureDurablePersistence(){
  try{
    await setPersistence(auth,browserLocalPersistence);
    durablePersistenceMode='browserLocal';
    return durablePersistenceMode;
  }catch(localError){
    console.warn('브라우저 로컬 인증 유지 설정 실패, IndexedDB 로컬 유지로 재시도합니다.',localError);
    try{
      await setPersistence(auth,indexedDBLocalPersistence);
      durablePersistenceMode='indexedDBLocal';
      return durablePersistenceMode;
    }catch(indexedError){
      durablePersistenceMode='unavailable';
      console.error('영구 인증 유지 설정 실패',indexedError);
      return durablePersistenceMode;
    }
  }
}
async function requireDurablePersistence(){
  const mode=await ensureDurablePersistence();
  if(mode==='unavailable')throw Error('이 브라우저에서는 관리자 로그인 유지 저장소를 사용할 수 없습니다. 비공개 모드 또는 사이트 데이터 차단 설정을 확인해 주세요.');
  return mode;
}
const authReady=(async()=>{
  if(typeof auth.authStateReady==='function')await auth.authStateReady();
  else await new Promise(resolve=>{let unsub=()=>{};unsub=onAuthStateChanged(auth,()=>{try{unsub();}catch(_e){}resolve();},()=>resolve());});
  await ensureDurablePersistence();
  window.CAT_HERO_V4_AUTH_STATE.ready=true;
  return auth.currentUser;
})();

function adminMarkerKey(id){return `cat-hero-v4:${id}:verified-admin`;}
function rememberVerifiedAdmin(id,u){try{if(id&&u)localStorage.setItem(adminMarkerKey(id),JSON.stringify({uid:u.uid,email:u.email||'',verifiedAt:Date.now()}));}catch(_e){}}
function clearVerifiedAdmin(id){try{localStorage.removeItem(adminMarkerKey(id));}catch(_e){}}
function readVerifiedAdmin(id){try{return JSON.parse(localStorage.getItem(adminMarkerKey(id))||'null');}catch(_e){return null;}}

async function resolveGuildReference(){
  const q=new URLSearchParams(location.search);
  const direct=(q.get('g')||'').trim().toUpperCase();
  if(direct&&/^[A-Z0-9]{8,20}$/.test(direct)){
    gid=direct;accessMode='bootstrap';return true;
  }
  const raw=(location.hash||'').replace(/^#/,'');
  const hp=new URLSearchParams(raw);
  const secret=(hp.get('k')||'').trim();
  if(secret){
    if(!/^[A-Za-z0-9_-]{24,96}$/.test(secret)){landing('길드 전용 주소 형식이 올바르지 않습니다.');return false;}
    const digest=await sha256(secret);
    try{
      const snap=await getDoc(doc(db,'guildAccess',digest));
      if(!snap.exists()||snap.data().active!==true||!snap.data().guildId){landing('만료되었거나 변경된 길드 전용 주소입니다.');return false;}
      gid=String(snap.data().guildId).toUpperCase();accessSecret=secret;accessHash=digest;accessMode='private';return true;
    }catch(e){landing('길드 전용 주소를 확인하지 못했습니다. '+(e.code||e.message));return false;}
  }
  return false;
}

async function roleFor(id){
  const serial=++roleCheckSerial;
  await authReady;
  const u=auth.currentUser;
  const platform=!!u&&u.uid===CFG.platformAdminUid;
  let guildAdmin=false;
  if(u&&id){
    try{
      const snap=await getDoc(doc(db,'guilds',id,'admins',u.uid));
      guildAdmin=snap.exists()&&snap.data().active===true;
      if(guildAdmin)rememberVerifiedAdmin(id,u);else clearVerifiedAdmin(id);
    }catch(e){
      console.warn('관리자 권한 확인 실패 — 저장된 관리자 확인값을 임시 유지합니다.',e);
      const marker=readVerifiedAdmin(id);
      guildAdmin=!!marker&&marker.uid===u.uid;
    }
  }
  if(serial!==roleCheckSerial)return window.CAT_HERO_V4_AUTH_STATE;
  window.CAT_HERO_V4_AUTH_STATE.guildId=id||'';
  window.CAT_HERO_V4_AUTH_STATE.user=u?{uid:u.uid,email:u.email}:null;
  window.CAT_HERO_V4_AUTH_STATE.isPlatformAdmin=platform;
  window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin=guildAdmin;
  window.CAT_HERO_V4_AUTH_STATE.ready=true;
  return window.CAT_HERO_V4_AUTH_STATE;
}

function announceRole(){
  if(frame?.contentWindow)frame.contentWindow.postMessage({type:'cat-hero-v4-role',guildId:gid,isGuildAdmin:!!window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin,authReady:!!window.CAT_HERO_V4_AUTH_STATE.ready},location.origin);
}
async function checkAdminOnly(id,{silent=false}={}){
  await roleFor(id);
  if(window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin){announceRole();return true;}
  if(!silent)alert(permissionMessage);
  return false;
}

function injectAuthUiStyle(){
  if(document.getElementById('v406AuthUiStyle'))return;
  const s=document.createElement('style');s.id='v406AuthUiStyle';s.textContent=`
  .v406-auth-layer{position:fixed;inset:0;z-index:2147483647;background:rgba(4,2,10,.76);display:grid;place-items:center;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));box-sizing:border-box;font-family:"Pretendard Variable",-apple-system,BlinkMacSystemFont,sans-serif}
  .v406-auth-card{box-sizing:border-box;width:min(430px,100%);max-height:min(88dvh,720px);overflow:auto;background:#fff;border:3px solid #8841df;border-radius:22px;color:#2e2140;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
  .v406-auth-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid #eadff7}.v406-auth-head strong{font-size:clamp(19px,5vw,23px);font-weight:900;color:#502388}.v406-auth-x{flex:none;width:40px;height:40px;display:grid;place-items:center;border:1px solid #decdf2;border-radius:11px;background:#f8f4ff;color:#6831a8;font-size:26px;line-height:1;padding:0}
  .v406-auth-copy{font-size:clamp(13px,3.5vw,15px);line-height:1.55;color:#5d5268;margin:15px 0}.v406-auth-actions{display:grid;gap:9px}.v406-auth-btn{width:100%;min-height:48px;border:2px solid #8645d9;border-radius:13px;background:#fff;color:#62319c;font:inherit;font-size:clamp(14px,3.8vw,17px);font-weight:900;padding:10px}.v406-auth-btn.primary{background:linear-gradient(#8450dc,#6733bd);color:#fff}.v406-auth-btn.muted{border-color:#d7c9e7;color:#756a80;background:#faf8fc}.v406-auth-form{display:grid;gap:11px}.v406-auth-form label{font-size:13px;font-weight:900;color:#502388}.v406-auth-form input{box-sizing:border-box;width:100%;height:46px;margin-top:5px;padding:0 12px;border:1.5px solid #cfb7ec;border-radius:12px;background:#fff;color:#251a32;font:inherit;font-size:16px}.v406-auth-note{font-size:11px;line-height:1.5;color:#82758f;margin:2px 0 0}
  @media(max-width:360px){.v406-auth-card{padding:14px;border-radius:18px}.v406-auth-btn{min-height:44px}.v406-auth-head strong{font-size:18px}}
  `;document.head.append(s);
}
function uiDialog({title,copy='',html='',buttons=[]}){
  injectAuthUiStyle();
  return new Promise(resolve=>{
    const layer=document.createElement('div');layer.className='v406-auth-layer';
    layer.innerHTML=`<section class="v406-auth-card" role="dialog" aria-modal="true"><div class="v406-auth-head"><strong>${esc(title)}</strong><button type="button" class="v406-auth-x" aria-label="닫기">×</button></div>${copy?`<div class="v406-auth-copy">${esc(copy).replace(/\n/g,'<br>')}</div>`:''}${html}<div class="v406-auth-actions"></div></section>`;
    const finish=v=>{layer.remove();resolve(v);};
    document.body.append(layer);
    layer.querySelector('.v406-auth-x').onclick=()=>finish(null);
    layer.addEventListener('click',e=>{if(e.target===layer)finish(null);});
    const actions=layer.querySelector('.v406-auth-actions');
    buttons.forEach(b=>{const btn=document.createElement('button');btn.type='button';btn.className='v406-auth-btn '+(b.primary?'primary':b.muted?'muted':'');btn.textContent=b.label;btn.onclick=()=>finish(b.value);actions.append(btn);});
  });
}
async function credentialDialog(title,{registration=false}={}){
  injectAuthUiStyle();
  return new Promise(resolve=>{
    const layer=document.createElement('div');layer.className='v406-auth-layer';
    layer.innerHTML=`<section class="v406-auth-card" role="dialog" aria-modal="true"><div class="v406-auth-head"><strong>${esc(title)}</strong><button type="button" class="v406-auth-x" aria-label="닫기">×</button></div><form class="v406-auth-form" style="margin-top:15px">${registration?'<label>1회성 관리자 등록코드<input name="code" autocomplete="one-time-code" autocapitalize="characters" maxlength="24" required></label>':''}<label>관리자 이메일<input name="email" type="email" autocomplete="username" required></label><label>관리자 비밀번호<input name="password" type="password" autocomplete="current-password" minlength="6" required></label><p class="v406-auth-note">관리자 로그인은 같은 브라우저에 유지되며, 본인이 로그아웃할 때만 해제됩니다.</p><div class="v406-auth-actions"><button type="submit" class="v406-auth-btn primary">${registration?'관리자 등록':'관리자 로그인'}</button><button type="button" class="v406-auth-btn muted" data-cancel>취소</button></div></form></section>`;
    const finish=v=>{layer.remove();resolve(v);};document.body.append(layer);layer.querySelector('.v406-auth-x').onclick=()=>finish(null);layer.querySelector('[data-cancel]').onclick=()=>finish(null);layer.addEventListener('click',e=>{if(e.target===layer)finish(null);});layer.querySelector('form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);finish({code:String(fd.get('code')||'').trim().toUpperCase(),email:String(fd.get('email')||'').trim(),password:String(fd.get('password')||'')});};
  });
}
async function adminLogin(id){
  const data=await credentialDialog('관리자 로그인');if(!data)return false;
  try{
    await requireDurablePersistence();
    await signInWithEmailAndPassword(auth,data.email,data.password);
    await ensureDurablePersistence();
    await auth.currentUser?.getIdToken(true);
    await roleFor(id);
    if(!window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin){alert('이 계정은 해당 길드의 관리자로 등록되어 있지 않습니다.\n관리자 등록코드가 있다면 관리자 메뉴에서 등록을 진행해 주세요.');return false;}
    announceRole();return true;
  }catch(e){alert('관리자 로그인 실패: '+(e.code||e.message));return false;}
}
async function adminRegister(id){
  const data=await credentialDialog('최초 및 추가 관리자 등록',{registration:true});if(!data)return false;
  if(!data.code)return false;
  let u=auth.currentUser;
  try{
    await requireDurablePersistence();
    if(!u||String(u.email||'').toLowerCase()!==data.email.toLowerCase()){
      try{u=(await createUserWithEmailAndPassword(auth,data.email,data.password)).user;}
      catch(e){if(e.code==='auth/email-already-in-use')u=(await signInWithEmailAndPassword(auth,data.email,data.password)).user;else throw e;}
    }
    await ensureDurablePersistence();
    await u.getIdToken(true);
    await runTransaction(db,async tx=>{
      const ir=doc(db,'guildInvites',data.code),ar=doc(db,'guilds',id,'admins',u.uid);
      const is=await tx.get(ir),as=await tx.get(ar);
      if(!is.exists())throw Error('등록코드를 찾을 수 없습니다.');
      const d=is.data();
      if(d.guildId!==id||d.used!==false||Number(d.expiresAtMs)<=Date.now())throw Error('사용할 수 없는 등록코드입니다.');
      if(as.exists())throw Error('이미 관리자 등록이 되어 있습니다.');
      tx.set(ar,{role:'admin',active:true,inviteId:data.code,createdAt:serverTimestamp()});
      tx.update(ir,{used:true,usedAt:serverTimestamp()});
    });
    await roleFor(id);
    if(!window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin)throw Error('관리자 권한 확인에 실패했습니다.');
    try{await addDoc(collection(db,'guilds',id,'audit'),{kind:'관리자 등록',name:data.email,text:'1회성 등록코드로 관리자 등록',uid:u.uid,at:serverTimestamp()});}catch(_e){}
    alert('길드 관리자 등록이 완료되었습니다.');announceRole();return true;
  }catch(e){alert('관리자 등록 실패: '+(e.code||e.message));return false;}
}
async function requestAdminPortal(id){
  await roleFor(id);
  if(window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin){announceRole();return true;}
  const first=await uiDialog({title:'관리자',copy:'관리자 기능을 이용하시겠습니까?\n관리자 등록 또는 로그인이 필요합니다.',buttons:[{label:'취소',value:'cancel',muted:true},{label:'확인',value:'ok',primary:true}]});
  if(first!=='ok')return false;
  const mode=await uiDialog({title:'관리자 인증',copy:'관리자 등록코드를 보유한 경우 등록을, 이미 등록된 관리자는 로그인을 선택하세요.',buttons:[{label:'최초 및 추가 관리자 등록',value:'register',primary:true},{label:'관리자 로그인',value:'login'},{label:'취소',value:'cancel',muted:true}]});
  if(mode==='register')return await adminRegister(id);
  if(mode==='login')return await adminLogin(id);
  return false;
}

window.CAT_HERO_V4_CHECK_ADMIN=(id,opts)=>checkAdminOnly(id,opts);
window.CAT_HERO_V4_ENSURE_ADMIN=checkAdminOnly;
window.CAT_HERO_V4_REQUEST_ADMIN=requestAdminPortal;
window.CAT_HERO_V4_PERMISSION_MESSAGE=permissionMessage;
window.CAT_HERO_V4_AUTH_PERSISTENCE=()=>durablePersistenceMode;
window.CAT_HERO_V4_LOGOUT=async()=>{
  if(!confirm('관리자에서 로그아웃하고 일반 길드원 모드로 전환하시겠습니까?'))return false;
  try{await signOut(auth);clearVerifiedAdmin(gid);await roleFor(gid);announceRole();return true;}catch(e){alert('로그아웃 실패: '+(e.code||e.message));return false;}
};
window.CAT_HERO_V4_ROLE_REFRESH=async()=>{await roleFor(gid);announceRole();return window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin;};
window.CAT_HERO_V4_ACCESS={
  gid:()=>gid,
  mode:()=>accessMode,
  secret:()=>accessSecret,
  shareUrl:()=>accessSecret?buildPrivateUrl(accessSecret,route()):'',
  copy:()=>accessSecret?copyText(buildPrivateUrl(accessSecret,route()),'길드 전용 주소'):false
};
window.CAT_HERO_V4_APPLY_ACCESS_SECRET=secret=>{
  accessSecret=String(secret||'').trim();accessMode='private';
  const r=route();history.replaceState({r},'',buildPrivateUrl(accessSecret,r));
  return buildPrivateUrl(accessSecret,r);
};

function route(){
  const raw=(location.hash||'').replace(/^#/,'');
  if(raw.includes('=')){const hp=new URLSearchParams(raw);const r=hp.get('r')||'main';return ['main','boss','ops','roulette'].includes(r)?r:'main';}
  return ['main','boss','ops','roulette'].includes(raw)?raw:'main';
}
function buildPrivateUrl(secret,r='main'){
  const hp=new URLSearchParams();hp.set('k',secret);if(r&&r!=='main')hp.set('r',r);
  return `${location.origin}${location.pathname}#${hp.toString()}`;
}
function buildBootstrapUrl(id){return `${location.origin}${location.pathname}?g=${encodeURIComponent(id)}`;}
function showRoute(r,push=false){
  if(!frame)return;if(!['main','boss','ops','roulette'].includes(r))r='main';
  roleFor(gid).then(announceRole).catch(e=>console.warn('route role refresh',e));
  frame.src=`${r}.html?g=${encodeURIComponent(gid)}&v=421`;
  if(push){
    const url=accessMode==='private'&&accessSecret?buildPrivateUrl(accessSecret,r):`${location.pathname}?g=${encodeURIComponent(gid)}${r==='main'?'':'#'+r}`;
    history.pushState({r},'',url);
  }
}
window.addEventListener('message',e=>{
  if(e.origin!==location.origin)return;const d=e.data||{};
  if(d.type==='cat-hero-v4-data-changed'&&d.guildId===gid){loadGuild({reuseFrame:true});return;}
  if(d.type==='dosalja-unified-route'&&['main','boss','ops','roulette'].includes(d.route))showRoute(d.route,true);
  if(d.type==='cat-hero-v4-role-request')announceRole();
});
window.addEventListener('popstate',()=>showRoute(route(),false));
window.addEventListener('hashchange',()=>{if(frame)showRoute(route(),false);});

async function loadGuild({reuseFrame=false}={}){
  try{
    const gs=await getDoc(doc(db,'guilds',gid));
    if(!gs.exists())return landing('존재하지 않는 길드입니다.');
    const guild={id:gid,...gs.data()};
    if(guild.active===false)return landing('현재 비활성화된 길드입니다.');
    await roleFor(gid);
    if(accessMode==='bootstrap'&&guild.accessHash&&guild.accessHash!==''&&!window.CAT_HERO_V4_AUTH_STATE.isGuildAdmin){
      return landing('이 길드는 전용 주소가 설정되었습니다. 길드관리자가 배포한 전용 주소로 접속해 주세요.');
    }
    if(accessMode==='private'&&guild.accessHash&&accessHash&&guild.accessHash!==accessHash){return landing('변경되어 더 이상 사용할 수 없는 길드 전용 주소입니다.');}
    const rs=await getDoc(doc(db,'guilds',gid,'data','roster')),rd=rs.exists()?rs.data():{};
    const ctx={guildId:gid,guild,members:rd.members||{},aliases:rd.aliases||{},formerNames:{}};
    window.CAT_HERO_V4_CONTEXT=ctx;window.CAT_HERO_V4_AUTH_STATE.guildId=gid;
    localStorage.setItem(`cat-hero-v4:${gid}:context`,JSON.stringify(ctx));
    if(!reuseFrame||!frame){root.innerHTML='';frame=document.createElement('iframe');frame.className='view';frame.title='Cat Hero Guild';root.append(frame);frame.addEventListener('load',()=>{announceRole();frame?.contentWindow?.postMessage({type:'cat-hero-v4-access',privateAddress:accessMode==='private'},location.origin);});showRoute(route(),false);}else{announceRole();}
    if(!window.__CAT_HERO_ROSTER_UNSUB){window.__CAT_HERO_ROSTER_UNSUB=onSnapshot(doc(db,'guilds',gid,'data','roster'),s=>{const d=s.exists()?s.data():{};ctx.members=d.members||{};ctx.aliases=d.aliases||{};ctx.guild.memberCount=Object.keys(ctx.members).length;localStorage.setItem(`cat-hero-v4:${gid}:context`,JSON.stringify(ctx));frame?.contentWindow?.postMessage({type:'cat-hero-v4-roster-updated',guildId:gid,count:ctx.guild.memberCount},location.origin);},()=>{});}
  }catch(e){landing('길드 정보를 불러오지 못했습니다. '+(e.code||e.message));}
}

function landing(msg=''){
  frame=null;
  root.innerHTML=`<main class="landing"><section class="panel"><h1>Cat Hero Guild Platform</h1><p>길드관리자가 배포한 길드 전용 주소로 접속합니다. 길드 데이터 입력·수정은 인증된 해당 길드 관리자만 가능합니다.</p><button class="btn ghost" id="platform">중앙관리자</button><div class="status">${esc(msg)}</div><div id="platformHost"></div></section></main>`;
  document.getElementById('platform').onclick=openPlatform;
}
async function platformLogin(){
  await authReady;await roleFor('');if(window.CAT_HERO_V4_AUTH_STATE.isPlatformAdmin)return true;
  const data=await credentialDialog('중앙관리자 로그인');if(!data)return false;
  try{await requireDurablePersistence();await signInWithEmailAndPassword(auth,data.email,data.password);await ensureDurablePersistence();await auth.currentUser?.getIdToken(true);await roleFor('');if(!window.CAT_HERO_V4_AUTH_STATE.isPlatformAdmin){alert('중앙관리자 계정이 아닙니다.');return false;}return true;}catch(e){alert('로그인 실패: '+(e.code||e.message));return false;}
}
async function openPlatform(){
  if(!await platformLogin())return;
  const host=document.getElementById('platformHost');
  host.innerHTML=`<hr style="border-color:#352544;margin:18px 0"><h2 style="font-size:17px">새 길드 생성</h2><form id="create"><input class="input" name="server" placeholder="서버번호" required><input class="input" style="margin-top:6px" name="name" placeholder="길드명" required><button class="btn">길드 생성 + 최초 관리자 코드</button></form><div id="createResult" class="status"></div><div id="guildList" class="platform-list"></div>`;
  document.getElementById('create').onsubmit=async e=>{
    e.preventDefault();const id=rand(16),invite=rand(20),b=writeBatch(db);
    b.set(doc(db,'guilds',id),{name:e.currentTarget.name.value.trim(),server:e.currentTarget.server.value.trim(),active:true,memberCount:0,appVersion:CFG.version,accessHash:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    b.set(doc(db,'guildInvites',invite),{guildId:id,used:false,createdAt:serverTimestamp(),expiresAtMs:Date.now()+7*86400000-300000,issuerRole:'platform'});
    b.set(doc(db,'guilds',id,'data','roster'),{members:{},aliases:{},updatedAt:serverTimestamp()});b.set(doc(db,'guilds',id,'data','rewards'),{records:[],updatedAt:serverTimestamp()});await b.commit();
    const setupUrl=buildBootstrapUrl(id),result=document.getElementById('createResult');
    result.innerHTML=`생성 완료<br><b>최초 관리자 설정용 임시 링크</b>: ${esc(setupUrl)}<br>최초 관리자 등록코드: <b>${invite}</b><br><span style="color:#a996bf">실제 길드원 배포 주소는 최초 관리자가 자신의 브라우저에서 생성합니다. 중앙관리 화면에는 원문 주소가 저장되지 않습니다.</span><div class="row" style="margin-top:8px"><button class="btn ghost" type="button" id="copySetupUrl">설정 링크 복사</button><button class="btn ghost" type="button" id="copyCreatedInvite">최초 코드 복사</button></div>`;
    document.getElementById('copySetupUrl').onclick=()=>copyText(setupUrl,'최초 관리자 설정용 링크');document.getElementById('copyCreatedInvite').onclick=()=>copyText(invite,'최초 관리자 등록코드');loadGuildList();
  };
  loadGuildList();
}
const PLATFORM_DELETE_COLLECTIONS=['data','bossTimers','bossHistory','ops','rounds','admins','audit'];
async function deleteSnapshotDocs(snap){
  const docs=[...(snap?.docs||[])];
  for(let i=0;i<docs.length;i+=400){
    const batch=writeBatch(db);
    docs.slice(i,i+400).forEach(d=>batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
}
async function collectGuildDeleteTargets(id,g){
  const targets={collections:{},invites:null,access:null};
  for(const col of PLATFORM_DELETE_COLLECTIONS)targets.collections[col]=await getDocs(collection(db,'guilds',id,col));
  targets.invites=await getDocs(query(collection(db,'guildInvites'),where('guildId','==',id)));
  if(g?.accessHash)targets.access=await getDoc(doc(db,'guildAccess',String(g.accessHash)));
  return targets;
}
async function deleteGuildCompletely(id,g){
  await authReady;await roleFor('');
  if(!window.CAT_HERO_V4_AUTH_STATE.isPlatformAdmin){alert('중앙관리자 권한이 필요합니다.');return false;}
  const name=String(g?.name||'길드').trim(),server=String(g?.server||'-').trim();
  const typed=prompt(`길드를 완전히 삭제합니다.\n\n${server} · ${name}\nID: ${id}\n\n삭제 후 복구할 수 없습니다. 계속하려면 길드명을 정확히 입력하세요.`, '');
  if(typed===null)return false;
  if(typed.trim()!==name){alert('길드명이 일치하지 않아 삭제를 취소했습니다.');return false;}
  if(!confirm(`${server} · ${name} 길드를 정말 완전히 삭제하시겠습니까?\n길드 데이터·관리자·활동기록·초대코드·전용주소 연결이 함께 삭제됩니다.`))return false;
  const counts={};
  let targets;
  try{
    targets=await collectGuildDeleteTargets(id,g);
  }catch(e){
    console.error('길드 삭제 권한 사전확인 실패',e);
    alert('삭제 권한 사전확인에 실패했습니다. 아직 데이터는 삭제하지 않았습니다.\nFirebase에 V4.1.1 Firestore Rules를 먼저 게시한 뒤 다시 시도해 주세요.\n\n'+(e.code||e.message||e));
    return false;
  }
  try{
    for(const col of PLATFORM_DELETE_COLLECTIONS)counts[col]=await deleteSnapshotDocs(targets.collections[col]);
    counts.invites=await deleteSnapshotDocs(targets.invites);
    if(g?.accessHash&&targets.access?.exists()){await deleteDoc(targets.access.ref);counts.access=1;}else counts.access=0;
    await deleteDoc(doc(db,'guilds',id));

    const rootCheck=await getDoc(doc(db,'guilds',id));
    if(rootCheck.exists())throw Error('길드 기본 문서 삭제 검증 실패');
    for(const col of PLATFORM_DELETE_COLLECTIONS){
      const left=await getDocs(collection(db,'guilds',id,col));
      if(!left.empty)throw Error(`${col} 하위 데이터 ${left.size}건이 남아 있습니다.`);
    }
    const inviteLeft=await getDocs(query(collection(db,'guildInvites'),where('guildId','==',id)));
    if(!inviteLeft.empty)throw Error(`관리자 초대코드 ${inviteLeft.size}건이 남아 있습니다.`);
    if(g?.accessHash){const accessLeft=await getDoc(doc(db,'guildAccess',String(g.accessHash)));if(accessLeft.exists())throw Error('길드 전용주소 연결 데이터가 남아 있습니다.');}
    try{await addDoc(collection(db,'platformAudit'),{kind:'길드 완전 삭제',guildId:id,server,name,deletedCounts:counts,uid:auth.currentUser?.uid||'',email:auth.currentUser?.email||'',at:serverTimestamp()});}catch(e){console.warn('플랫폼 삭제 기록 저장 실패',e);}
    try{localStorage.removeItem(`cat-hero-v4:${id}:context`);localStorage.removeItem(adminMarkerKey(id));}catch(_e){}
    alert(`${server} · ${name}\n길드 완전 삭제 및 잔여 데이터 검증이 완료되었습니다.`);
    await loadGuildList();return true;
  }catch(e){
    console.error('길드 완전 삭제 실패',e);
    alert('길드 삭제 중 문제가 발생했습니다.\n길드 기본 문서는 마지막에 삭제하도록 구성되어 있으므로, 오류 메시지를 확인한 뒤 다시 시도해 주세요.\n\n'+(e.code||e.message||e));
    try{await loadGuildList();}catch(_e){}
    return false;
  }
}
async function loadGuildList(){
  const host=document.getElementById('guildList');if(!host)return;const s=await getDocs(collection(db,'guilds')),arr=s.docs.map(d=>({id:d.id,...d.data()}));
  host.innerHTML=arr.map(g=>`<div class="guild-card"><b>${esc(g.server||'-')} · ${esc(g.name||'길드')}</b><div class="meta">${g.id} · ${g.active===false?'비활성':'활성'} · 전용주소 ${g.accessHash?'설정됨':'미설정'}</div><div class="guild-actions"><button class="btn ghost" data-setup="${g.id}">관리자 설정 링크</button><button class="btn ghost" data-invite="${g.id}">코드 발급·복사</button><button class="btn ghost" data-toggle="${g.id}" data-active="${g.active===false?'0':'1'}">${g.active===false?'활성화':'비활성화'}</button><button class="btn ghost danger" data-delete="${g.id}">완전 삭제</button></div></div>`).join('');
  host.querySelectorAll('[data-setup]').forEach(b=>b.onclick=()=>copyText(buildBootstrapUrl(b.dataset.setup),'관리자 설정용 링크'));
  host.querySelectorAll('[data-invite]').forEach(b=>b.onclick=async()=>{const code=rand(20);await setDoc(doc(db,'guildInvites',code),{guildId:b.dataset.invite,used:false,createdAt:serverTimestamp(),expiresAtMs:Date.now()+7*86400000-300000,issuerRole:'platform'});await copyText(code,'1회성 관리자 등록코드');});
  host.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'guilds',b.dataset.toggle),{active:b.dataset.active!=='1',updatedAt:serverTimestamp()});loadGuildList();});
  host.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{const g=arr.find(x=>x.id===b.dataset.delete);if(!g)return;b.disabled=true;const old=b.textContent;b.textContent='삭제 중…';await deleteGuildCompletely(g.id,g);if(document.body.contains(b)){b.disabled=false;b.textContent=old;}});
}

onAuthStateChanged(auth,async()=>{await authReady;if(gid){await roleFor(gid);announceRole();}});
(async()=>{await authReady;const found=await resolveGuildReference();if(found&&gid)await loadGuild();else if(!root.querySelector('.landing'))landing();})();
