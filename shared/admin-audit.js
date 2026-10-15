import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,collection,getDocs,addDoc,serverTimestamp,query,orderBy,limit,startAfter,doc,getDoc,writeBatch} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
const gid=window.CAT_HERO_V4_TENANT?.gid?.()||'',config=window.GUILD_OPS_CONFIG.firebase;
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dialog,rows=[],cursor=null,activeType='전체',pageSize=60;
const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-';
function secretKey(n=36){const a=new Uint32Array(n);crypto.getRandomValues(a);return Array.from(a,x=>chars[x%chars.length]).join('');}
async function sha256(text){const b=new TextEncoder().encode(String(text));const h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');}
function close(){dialog?.remove();dialog=null;}
function prettyDate(v){try{const d=v?.toDate?.()||new Date(v);if(isNaN(d.getTime()))return '—';return new Intl.DateTimeFormat('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(/\. /g,'.').replace('일','');}catch(_){return '—';}}
function recordHtml(r){const kind=esc(r.kind||'관리자 변경'),target=esc(r.name||r.target||'길드');return `<div class="auditRow"><time>${esc(prettyDate(r.at)||r.date)}</time><span>${kind}</span><b title="${target}">${target}</b></div>`;}
function currentShareUrl(){try{return parent.CAT_HERO_V4_ACCESS?.shareUrl?.()||'';}catch(_e){return '';}}
function extractSecret(input){const raw=String(input||'').trim();if(!raw)return '';try{const u=new URL(raw);const hp=new URLSearchParams(u.hash.replace(/^#/,''));return (hp.get('k')||u.searchParams.get('k')||'').trim();}catch(_e){}return raw;}
async function copyValue(text,label){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);alert(label+' 복사 완료');return true;}}catch(_e){}prompt(label+' 복사',text);return false;}
async function setPrivateAddress(secret){
  if(!window.CAT_HERO_V4_TENANT?.isAdmin?.()){alert(window.CAT_HERO_V4_TENANT?.permissionMessage||'관리 권한이 없습니다.');return false;}
  secret=extractSecret(secret);
  if(!/^[A-Za-z0-9_-]{24,96}$/.test(secret)){alert('전용 주소 키는 영문·숫자·_·- 조합 24~96자로 입력해 주세요.');return false;}
  const newHash=await sha256(secret),accessRef=doc(db,'guildAccess',newHash),guildRef=doc(db,'guilds',gid);
  const [existing,guildSnap]=await Promise.all([getDoc(accessRef),getDoc(guildRef)]);
  if(existing.exists()&&existing.data().guildId!==gid){alert('이미 사용 중인 주소 키입니다. 다른 키를 사용해 주세요.');return false;}
  const oldHash=String(guildSnap.data()?.accessHash||'');
  if(oldHash===newHash&&existing.exists()&&existing.data().guildId===gid){
    let sameUrl='';try{sameUrl=parent.CAT_HERO_V4_APPLY_ACCESS_SECRET?.(secret)||'';}catch(_e){}
    if(sameUrl)await copyValue(sameUrl,'길드 전용 주소');
    return true;
  }
  const batch=writeBatch(db);
  if(!existing.exists())batch.set(accessRef,{guildId:gid,active:true,createdAt:serverTimestamp()},{merge:false});
  batch.update(guildRef,{accessHash:newHash,accessUpdatedAt:serverTimestamp(),updatedAt:serverTimestamp()});
  if(oldHash&&oldHash!==newHash)batch.delete(doc(db,'guildAccess',oldHash));
  batch.set(doc(collection(db,'guilds',gid,'audit')),{kind:'길드 전용 주소 변경',name:'길드 주소',text:'길드관리자가 전용 주소를 새로 설정했습니다. 원문 주소는 중앙 데이터에 저장하지 않습니다.',uid:auth.currentUser?.uid||'',at:serverTimestamp()});
  await batch.commit();
  let url='';try{url=parent.CAT_HERO_V4_APPLY_ACCESS_SECRET?.(secret)||'';}catch(_e){}
  if(dialog){const st=dialog.querySelector('#auditAccessState');if(st)st.textContent='전용 주소 설정됨 · 이 브라우저에서 원문 보관 중';}
  alert('길드 전용 주소가 변경되었습니다.\n기존 전용 주소는 더 이상 사용할 수 없습니다.');
  if(url)await copyValue(url,'새 길드 전용 주소');
  return true;
}
function frame(){
  close();dialog=document.createElement('div');dialog.id='dosaljaAuditOverlay';dialog.innerHTML=`<section id="dosaljaAuditPanel" role="dialog" aria-modal="true" aria-label="관리자 관리"><header class="auditHead"><strong>관리자 관리</strong><button id="auditClose" type="button" aria-label="닫기">×</button></header><div class="auditSummary"><div class="auditCount">현재 등록된 관리자 <strong id="auditAdminCount">확인 중</strong></div><div class="auditStatus">● 관리자 로그인 중</div><button type="button" id="auditInvite">추가 관리자 초대코드 발급</button></div><div class="auditAccess"><div class="auditAccessHead"><strong>길드 전용 주소</strong><span id="auditAccessState">${currentShareUrl()?'전용 주소 설정됨 · 원문은 이 브라우저 주소에만 존재':'전용 주소 원문 없음'}</span></div><p>길드관리자가 직접 생성하거나 안전한 키를 붙여넣어 변경합니다. Firebase에는 원문 주소 대신 검증용 해시만 저장됩니다.</p><div class="auditAccessButtons"><button type="button" id="auditAccessCopy" ${currentShareUrl()?'':'disabled'}>현재 주소 복사</button><button type="button" id="auditAccessNew">새 주소 생성</button><button type="button" id="auditAccessPaste">주소/키 붙여넣기</button></div></div><div class="auditFilter"><strong>관리자 활동 기록</strong><select id="auditType" aria-label="활동 유형"><option value="전체">전체 활동</option></select></div><div class="auditColumns"><b>날짜·시간</b><b>활동</b><b>대상</b></div><div id="auditContent" class="auditScroll" aria-live="polite"></div><button type="button" id="auditMore" hidden>이전 기록 더 보기</button><footer class="auditFooter"><span class="auditSigned">관리자 로그인 중</span><button type="button" id="auditLogout">로그아웃</button></footer></section>`;
  document.body.append(dialog);
  dialog.querySelector('#auditClose').onclick=close;
  dialog.querySelector('#auditLogout').onclick=async()=>{if(await window.CAT_HERO_V4_TENANT?.logout?.())close();};
  dialog.querySelector('#auditInvite').onclick=async()=>{try{await window.DOSALJA_ADMIN?.createAdminInvite?.();}catch(e){alert('발급 실패: '+(e.message||e));}};
  dialog.querySelector('#auditType').onchange=e=>{activeType=e.target.value;render();};dialog.querySelector('#auditMore').onclick=loadMore;
  dialog.querySelector('#auditAccessCopy').onclick=async()=>{const url=currentShareUrl();if(!url)return alert('현재 브라우저가 길드 전용 주소 원문을 보유하고 있지 않습니다. 새 주소를 생성하거나 주소/키를 붙여넣어 주세요.');await copyValue(url,'길드 전용 주소');};
  dialog.querySelector('#auditAccessNew').onclick=async()=>{if(!confirm('새 길드 전용 주소를 생성하시겠습니까?\n기존 주소는 즉시 사용할 수 없게 됩니다.'))return;try{await setPrivateAddress(secretKey());}catch(e){alert('주소 변경 실패: '+(e.code||e.message));}};
  dialog.querySelector('#auditAccessPaste').onclick=async()=>{const v=prompt('새로 사용할 전체 길드 주소 또는 비밀 키를 붙여넣으세요.\n24자 이상의 영문·숫자·_·- 조합을 사용합니다.');if(!v)return;try{await setPrivateAddress(v);}catch(e){alert('주소 변경 실패: '+(e.code||e.message));}};
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});return dialog.querySelector('#auditContent');
}
function render(){if(!dialog)return;const sel=dialog.querySelector('#auditType'),types=[...new Set(rows.map(r=>r.kind||'관리자 변경'))].sort();sel.innerHTML='<option value="전체">전체 활동</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');if(activeType!=='전체'&&!types.includes(activeType))activeType='전체';sel.value=activeType;const list=activeType==='전체'?rows:rows.filter(r=>(r.kind||'관리자 변경')===activeType);dialog.querySelector('#auditContent').innerHTML=list.length?list.map(recordHtml).join(''):'<div class="auditEmpty">해당 활동 기록이 없습니다.</div>';dialog.querySelector('#auditMore').hidden=!cursor;}
async function loadMore(){if(!cursor)return;const more=dialog?.querySelector('#auditMore');if(more)more.disabled=true;try{const snap=await getDocs(query(collection(db,'guilds',gid,'audit'),orderBy('at','desc'),startAfter(cursor),limit(pageSize)));rows.push(...snap.docs.map(d=>d.data()));cursor=snap.docs.length===pageSize?snap.docs.at(-1):null;render();}catch(e){alert('기록 조회 실패: '+(e.code||e.message));}finally{if(more)more.disabled=false;}}
async function showRecords(host){
  host.innerHTML='<div class="auditLoading">활동 기록을 불러오는 중…</div>';
  const adminsP=getDocs(collection(db,'guilds',gid,'admins')).then(s=>s.docs.filter(d=>d.data().active===true).length).catch(e=>{console.warn('관리자 수 조회 실패',e);return null;});
  const auditP=getDocs(query(collection(db,'guilds',gid,'audit'),orderBy('at','desc'),limit(pageSize))).catch(e=>{console.warn('활동 기록 조회 실패',e);return e;});
  const [count,snap]=await Promise.all([adminsP,auditP]);
  if(dialog)dialog.querySelector('#auditAdminCount').textContent=count===null?'확인 실패':count+'명';
  if(snap instanceof Error||!snap?.docs){host.innerHTML=`<div class="auditError">활동 기록 조회 실패: ${esc(snap?.code||snap?.message||'unknown')}</div>`;return;}
  rows=snap.docs.map(d=>d.data());cursor=snap.docs.length===pageSize?snap.docs.at(-1):null;render();
}
async function open(){if(!await window.CAT_HERO_V4_TENANT?.requestAdmin?.())return;const host=frame();await showRecords(host);}
async function recordReward(record){if(!await window.CAT_HERO_V4_TENANT?.ensureAdmin?.())throw Error('관리 권한이 없습니다.');await addDoc(collection(db,'guilds',gid,'audit'),{kind:'보상 분배 기록 추가',name:record.type||'보상',text:[record.rank,record.period,...(record.items||[]).map(i=>`${i.name} ${i.qty}개 · ${(i.recipients||[]).join(', ')}`)].join(' / '),uid:auth.currentUser?.uid||null,at:serverTimestamp()});}
const css=document.createElement('style');css.textContent=`#dosaljaAuditOverlay{position:fixed;inset:0;z-index:2147483645;background:rgba(6,3,15,.82);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box;font-family:inherit}#dosaljaAuditPanel{box-sizing:border-box;width:min(470px,calc(100vw - 24px));max-height:min(88dvh,760px);display:flex;flex-direction:column;border:3px solid #8841df;border-radius:20px;background:#fff;color:#2e2140;padding:15px;box-shadow:0 20px 55px #0007}.auditHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid #eadff7}.auditHead strong{font-size:clamp(19px,4.8vw,23px);color:#502388;font-weight:900}.auditHead button{flex:none;width:46px;height:46px;padding:0;border:1.5px solid #d6c3ee;border-radius:13px;background:#f8f3ff;color:#6530a7;font-size:28px;font-weight:950;line-height:1;display:grid;place-items:center;box-shadow:0 2px 8px rgba(91,48,145,.05)}.auditSummary{margin:12px 0 8px;padding:12px;border-radius:12px;background:#f7f3fd}.auditCount{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:800}.auditCount strong{font-size:19px;color:#51218c}.auditStatus{font-size:11px;color:#198653;margin:6px 0}.auditSummary button{width:100%;padding:10px;border:1px solid #c8a9ee;border-radius:10px;background:#fff;color:#63339d;font-weight:800}.auditAccess{padding:11px;border:1px solid #e5d8f5;border-radius:12px;margin-bottom:10px;background:#fff}.auditAccessHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.auditAccessHead strong{font-size:13px;color:#4e2582}.auditAccessHead span{font-size:10px;color:#6c6077;text-align:right}.auditAccess p{font-size:10px;line-height:1.45;color:#7a6d86;margin:7px 0}.auditAccessButtons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.auditAccessButtons button{min-width:0;padding:8px 4px;border:1px solid #ccb0ec;border-radius:9px;background:#faf7ff;color:#603398;font-size:10px;font-weight:900}.auditAccessButtons button:disabled{opacity:.4}.auditFilter{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 10px}.auditFilter strong{font-size:14px}.auditFilter select{width:min(52%,190px);padding:9px;border:1px solid #d4bdea;border-radius:9px;background:#fff;color:#4d2883;font-size:12px;font-weight:800}.auditColumns,.auditRow{display:grid;grid-template-columns:31% 37% 32%;align-items:center;gap:0}.auditColumns{padding:8px 4px;background:#f2eafb;color:#502388;font-size:11px}.auditScroll{min-height:70px;max-height:29dvh;overflow-y:auto;overscroll-behavior:contain}.auditRow{padding:9px 4px;border-bottom:1px solid #eee6f4;font-size:11px;line-height:1.35}.auditRow time{color:#74677e;white-space:nowrap;font-size:10px}.auditRow span{padding-right:3px}.auditRow b{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.auditEmpty,.auditError,.auditLoading{text-align:center;padding:20px 8px;font-size:12px;color:#766983}#auditMore{margin-top:8px;padding:8px;border:1px solid #d8c3ef;border-radius:9px;background:#faf6ff;color:#62369b;font-weight:800}.auditFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #eadff7}.auditSigned{font-size:11px;font-weight:800;color:#238659}.auditFooter button{border:1px solid #d8c3ef;background:#f7f2ff;color:#62369b;border-radius:10px;padding:9px 14px;font-weight:800}@media(max-width:360px){#dosaljaAuditPanel{padding:12px}.auditAccessButtons{grid-template-columns:1fr}.auditScroll{max-height:24dvh}.auditColumns,.auditRow{grid-template-columns:32% 36% 32%}}`;
document.head.append(css);window.DOSALJA_ADMIN_AUDIT={open,recordReward,setPrivateAddress};
