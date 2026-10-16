import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,collection,getDocs,addDoc,serverTimestamp,query,orderBy,limit,startAfter,doc,getDoc,writeBatch} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
const gid=window.CAT_HERO_V4_TENANT?.gid?.()||'',config=window.GUILD_OPS_CONFIG.firebase;
await window.CAT_HERO_V4_TENANT?.waitLocalAuth?.();
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dialog,rows=[],cursor=null,activeType='전체',pageSize=60,bulkMode=false,deleting=false;
const selectedIds=new Set();
const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-';
function secretKey(n=36){const a=new Uint32Array(n);crypto.getRandomValues(a);return Array.from(a,x=>chars[x%chars.length]).join('');}
async function sha256(text){const b=new TextEncoder().encode(String(text));const h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');}
function close(){dialog?.remove();dialog=null;}
function prettyDate(v){try{const d=v?.toDate?.()||new Date(v);if(isNaN(d.getTime()))return '—';return new Intl.DateTimeFormat('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(/\. /g,'.').replace('일','');}catch(_){return '—';}}
function filteredRows(){return activeType==='전체'?rows:rows.filter(r=>(r.kind||'관리자 변경')===activeType);}
function recordHtml(r){
  const kind=esc(r.kind||'관리자 변경'),target=esc(r.name||r.target||'길드'),id=esc(r._docId||'');
  const body=`<time>${esc(prettyDate(r.at)||r.date)}</time><span title="${kind}">${kind}</span><b title="${target}">${target}</b>`;
  if(bulkMode)return `<div class="auditRow auditRowBulk" data-audit-id="${id}"><label class="auditPick"><input type="checkbox" aria-label="${kind} ${target} 선택" data-audit-pick="${id}" ${selectedIds.has(r._docId)?'checked':''}></label>${body}</div>`;
  return `<div class="auditRow" data-audit-id="${id}">${body}<button type="button" class="auditDeleteOne" data-audit-delete="${id}" aria-label="${kind} ${target} 삭제">삭제</button></div>`;
}
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
  if(dialog){const st=dialog.querySelector('#auditAccessState');if(st)st.textContent='전용주소 설정됨';}
  alert('길드 전용 주소가 변경되었습니다.\n기존 전용 주소는 더 이상 사용할 수 없습니다.');
  if(url)await copyValue(url,'새 길드 전용 주소');
  return true;
}
function frame(){
  close();rows=[];cursor=null;activeType='전체';bulkMode=false;deleting=false;selectedIds.clear();
  dialog=document.createElement('div');dialog.id='dosaljaAuditOverlay';
  dialog.innerHTML=`<section id="dosaljaAuditPanel" role="dialog" aria-modal="true" aria-label="관리자"><header class="auditHead"><strong>관리자</strong><button id="auditClose" type="button" aria-label="닫기">×</button></header>
  <div class="auditTools"><div class="auditMeta"><div class="auditCount">현재 관리자 <strong id="auditAdminCount">확인 중</strong></div><span id="auditAccessState" class="auditAddressState">${currentShareUrl()?'전용주소 설정됨':'전용주소 원문 없음'}</span></div><div class="auditQuickActions"><button type="button" id="auditInvite" class="auditInvite">추가 관리자 초대</button><button type="button" id="auditAccessCopy" ${currentShareUrl()?'':'disabled'}>주소 복사</button><button type="button" id="auditAccessNew">새 주소</button><button type="button" id="auditAccessPaste">주소/키</button></div></div>
  <div class="auditBulkToolbar"><button type="button" id="auditBulkToggle">관리자 기록 일괄삭제</button><span id="auditBulkActions" hidden><button type="button" id="auditBulkDelete" disabled>선택 0건 삭제</button><button type="button" id="auditBulkCancel">취소</button></span></div>
  <div class="auditFilter"><strong>관리자 활동 기록</strong><select id="auditType" aria-label="활동 유형"><option value="전체">전체 활동</option></select></div>
  <label class="auditSelectTools" id="auditSelectTools" hidden><input type="checkbox" id="auditSelectAll"><span id="auditSelectAllLabel">현재 목록 전체 선택</span></label>
  <div class="auditColumns" id="auditColumns"><b>날짜·시간</b><b>활동</b><b>대상</b><b></b></div><div id="auditContent" class="auditScroll" aria-live="polite"></div>
  <button type="button" id="auditMore" hidden>이전 기록 더 보기</button><footer class="auditFooter"><button type="button" id="auditLogout">로그아웃</button></footer></section>`;
  document.body.append(dialog);
  dialog.querySelector('#auditClose').onclick=close;
  dialog.querySelector('#auditLogout').onclick=async()=>{if(await window.CAT_HERO_V4_TENANT?.logout?.())close();};
  dialog.querySelector('#auditInvite').onclick=async()=>{try{await window.DOSALJA_ADMIN?.createAdminInvite?.();}catch(e){alert('발급 실패: '+(e.message||e));}};
  dialog.querySelector('#auditType').onchange=e=>{activeType=e.target.value;selectedIds.clear();render();};
  dialog.querySelector('#auditMore').onclick=loadMore;
  dialog.querySelector('#auditBulkToggle').onclick=()=>{bulkMode=true;selectedIds.clear();render();};
  dialog.querySelector('#auditBulkCancel').onclick=()=>{bulkMode=false;selectedIds.clear();render();};
  dialog.querySelector('#auditBulkDelete').onclick=()=>deleteSelected();
  dialog.querySelector('#auditSelectAll').onchange=e=>{const visible=filteredRows();for(const r of visible){if(e.target.checked)selectedIds.add(r._docId);else selectedIds.delete(r._docId);}render();};
  dialog.querySelector('#auditContent').addEventListener('change',e=>{const id=e.target?.dataset?.auditPick;if(!id||deleting)return;if(e.target.checked)selectedIds.add(id);else selectedIds.delete(id);updateBulkControls();});
  dialog.querySelector('#auditContent').addEventListener('click',e=>{const b=e.target.closest('[data-audit-delete]');if(!b||deleting)return;deleteSelected([b.dataset.auditDelete]);});
  dialog.querySelector('#auditAccessCopy').onclick=async()=>{const url=currentShareUrl();if(!url)return alert('현재 브라우저가 길드 전용 주소 원문을 보유하고 있지 않습니다. 새 주소를 생성하거나 주소/키를 붙여넣어 주세요.');await copyValue(url,'길드 전용 주소');};
  dialog.querySelector('#auditAccessNew').onclick=async()=>{if(!confirm('새 길드 전용 주소를 생성하시겠습니까?\n기존 주소는 즉시 사용할 수 없게 됩니다.'))return;try{await setPrivateAddress(secretKey());}catch(e){alert('주소 변경 실패: '+(e.code||e.message));}};
  dialog.querySelector('#auditAccessPaste').onclick=async()=>{const v=prompt('새로 사용할 전체 길드 주소 또는 비밀 키를 붙여넣으세요.\n24자 이상의 영문·숫자·_·- 조합을 사용합니다.');if(!v)return;try{await setPrivateAddress(v);}catch(e){alert('주소 변경 실패: '+(e.code||e.message));}};
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});return dialog.querySelector('#auditContent');
}
function updateBulkControls(){
  if(!dialog)return;
  const visible=filteredRows(),picked=visible.filter(r=>selectedIds.has(r._docId));
  dialog.querySelector('#auditBulkToggle').hidden=bulkMode;
  dialog.querySelector('#auditBulkActions').hidden=!bulkMode;
  dialog.querySelector('#auditSelectTools').hidden=!bulkMode;
  const d=dialog.querySelector('#auditBulkDelete');d.textContent=`선택 ${picked.length}건 삭제`;d.disabled=deleting||!picked.length;
  dialog.querySelector('#auditBulkCancel').disabled=deleting;
  const all=dialog.querySelector('#auditSelectAll');all.disabled=deleting||!visible.length;all.checked=visible.length>0&&picked.length===visible.length;all.indeterminate=picked.length>0&&picked.length<visible.length;
  dialog.querySelector('#auditSelectAllLabel').textContent=`현재 목록 전체 선택 (${visible.length}건)`;
}
function render(){
  if(!dialog)return;
  const sel=dialog.querySelector('#auditType'),types=[...new Set(rows.map(r=>r.kind||'관리자 변경'))].sort();
  sel.innerHTML='<option value="전체">전체 활동</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if(activeType!=='전체'&&!types.includes(activeType))activeType='전체';sel.value=activeType;
  const list=filteredRows(),cols=dialog.querySelector('#auditColumns');
  cols.classList.toggle('auditColumnsBulk',bulkMode);
  cols.innerHTML=bulkMode?'<b>선택</b><b>날짜·시간</b><b>활동</b><b>대상</b>':'<b>날짜·시간</b><b>활동</b><b>대상</b><b></b>';
  dialog.querySelector('#auditContent').innerHTML=list.length?list.map(recordHtml).join(''):'<div class="auditEmpty">해당 활동 기록이 없습니다.</div>';
  dialog.querySelector('#auditMore').hidden=!cursor;updateBulkControls();
}
async function deleteSelected(ids=null){
  if(deleting||!dialog)return;
  // 삭제 대상은 현재 불러온 같은 길드의 문서 ID로 한정합니다.
  const loaded=new Set(rows.map(r=>r._docId));
  const target=Array.from(new Set(ids||Array.from(selectedIds))).filter(id=>id&&loaded.has(id)&&(ids||filteredRows().some(r=>r._docId===id)));
  if(!target.length)return;
  if(!confirm(`관리자 활동 기록 ${target.length}건을 영구 삭제하시겠습니까?\n삭제하면 앱에서 복구할 수 없습니다.\n현재 길드의 선택 기록만 삭제됩니다.`))return;
  if(!await window.CAT_HERO_V4_TENANT?.ensureAdmin?.()){alert('길드 관리자 권한이 없습니다.');return;}
  deleting=true;updateBulkControls();
  try{
    // 한 번에 400건 이하로 나누어 Firestore 문서를 직접 삭제합니다.
    for(let i=0;i<target.length;i+=400){const batch=writeBatch(db);for(const id of target.slice(i,i+400))batch.delete(doc(db,'guilds',gid,'audit',id));await batch.commit();}
    selectedIds.clear();bulkMode=false;
    await showRecords(dialog.querySelector('#auditContent'));
    alert(`관리자 활동 기록 ${target.length}건이 삭제되었습니다.`);
  }catch(e){console.error('관리자 기록 삭제 실패',e);alert(`기록 삭제 실패: ${e.code||e.message}\nFirebase 보안 규칙이 최신 버전인지 확인해 주세요.`);await showRecords(dialog.querySelector('#auditContent')).catch(()=>{});}
  finally{deleting=false;updateBulkControls();}
}
async function loadMore(){
  if(!cursor||deleting)return;const more=dialog?.querySelector('#auditMore');if(more)more.disabled=true;
  try{const snap=await getDocs(query(collection(db,'guilds',gid,'audit'),orderBy('at','desc'),startAfter(cursor),limit(pageSize)));rows.push(...snap.docs.map(d=>({...d.data(),_docId:d.id})));cursor=snap.docs.length===pageSize?snap.docs.at(-1):null;render();}
  catch(e){alert('기록 조회 실패: '+(e.code||e.message));}finally{if(more)more.disabled=false;}
}
async function showRecords(host){
  host.innerHTML='<div class="auditLoading">활동 기록을 불러오는 중…</div>';
  const adminsP=getDocs(collection(db,'guilds',gid,'admins')).then(s=>s.docs.filter(d=>d.data().active===true).length).catch(e=>{console.warn('관리자 수 조회 실패',e);return null;});
  const auditP=getDocs(query(collection(db,'guilds',gid,'audit'),orderBy('at','desc'),limit(pageSize))).catch(e=>{console.warn('활동 기록 조회 실패',e);return e;});
  const [count,snap]=await Promise.all([adminsP,auditP]);
  if(dialog)dialog.querySelector('#auditAdminCount').textContent=count===null?'확인 실패':count+'명';
  if(snap instanceof Error||!snap?.docs){host.innerHTML=`<div class="auditError">활동 기록 조회 실패: ${esc(snap?.code||snap?.message||'unknown')}</div>`;return;}
  rows=snap.docs.map(d=>({...d.data(),_docId:d.id}));cursor=snap.docs.length===pageSize?snap.docs.at(-1):null;render();
}
async function open(){if(!await window.CAT_HERO_V4_TENANT?.requestAdmin?.())return;const host=frame();await showRecords(host);}
async function recordReward(record){if(!await window.CAT_HERO_V4_TENANT?.ensureAdmin?.())throw Error('관리 권한이 없습니다.');await addDoc(collection(db,'guilds',gid,'audit'),{kind:'보상 분배 기록 추가',name:record.type||'보상',text:[record.rank,record.period,...(record.items||[]).map(i=>`${i.name} ${i.qty}개 · ${(i.recipients||[]).join(', ')}`)].join(' / '),uid:auth.currentUser?.uid||null,at:serverTimestamp()});}
const css=document.createElement('style');css.textContent=`#dosaljaAuditOverlay{position:fixed;inset:0;z-index:2147483645;background:rgba(6,3,15,.82);display:grid;place-items:center;padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));box-sizing:border-box;font-family:inherit}#dosaljaAuditPanel{box-sizing:border-box;width:min(470px,calc(100vw - 20px));height:min(88dvh,720px);max-height:calc(100vh - 20px);display:flex;flex-direction:column;border:3px solid #8841df;border-radius:20px;background:#fff;color:#2e2140;padding:11px 12px 10px;box-shadow:0 20px 55px #0007;overflow:hidden}.auditHead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 0 8px;border-bottom:1px solid #eadff7}.auditHead strong{font-size:clamp(18px,4.5vw,21px);color:#502388;font-weight:950;letter-spacing:-.03em}.auditHead button{flex:none;width:48px;height:48px;padding:0;border:1.5px solid #d1bceb;border-radius:14px;background:#f6f0ff;color:#6326a4;font-size:30px;font-weight:950;line-height:1;display:grid;place-items:center;box-shadow:0 3px 10px rgba(91,48,145,.08)}.auditHead button:active{transform:scale(.96);background:#eee4ff}.auditTools{margin:8px 0 7px;padding:8px;border:1px solid #e1d4f1;border-radius:13px;background:linear-gradient(180deg,#f9f6fe,#f5f0fc)}.auditMeta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.auditCount{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:850;white-space:nowrap}.auditCount strong{font-size:16px;color:#51218c}.auditAddressState{min-width:0;font-size:9.8px;color:#6f6280;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.auditQuickActions{display:grid;grid-template-columns:1.45fr repeat(3,minmax(0,.82fr));gap:5px}.auditQuickActions button{min-width:0;height:34px;padding:0 5px;border:1px solid #ccb0ec;border-radius:9px;background:#fff;color:#603398;font-size:10.2px;font-weight:900;white-space:nowrap}.auditQuickActions button:active{background:#f1e7ff}.auditQuickActions button:disabled{opacity:.38}.auditQuickActions .auditInvite{background:#7440c8;color:#fff;border-color:#7440c8;box-shadow:0 4px 10px rgba(100,50,170,.12)}.auditFilter{display:grid;grid-template-columns:minmax(0,1fr) minmax(108px,132px);align-items:center;gap:8px;margin:2px 0 6px}.auditFilter strong{font-size:12.5px;letter-spacing:-.025em}.auditFilter select{appearance:none;-webkit-appearance:none;width:100%;height:34px;padding:0 28px 0 10px;border:1px solid #d6c4e8;border-radius:9px;color:#4d2883;font-size:11px;font-weight:850;background-color:#fbf9ff;background-image:linear-gradient(45deg,transparent 50%,#5f2f94 50%),linear-gradient(135deg,#5f2f94 50%,transparent 50%);background-position:calc(100% - 14px) 14px,calc(100% - 9px) 14px;background-size:5px 5px,5px 5px;background-repeat:no-repeat}.auditColumns,.auditRow{display:grid;grid-template-columns:27% 35% 23% 15%;align-items:center;gap:0}.auditColumns{padding:6px 5px;background:#f1e9fa;color:#502388;font-size:10.5px;border-radius:7px 7px 0 0}.auditScroll{min-height:160px;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.auditRow{padding:6px 5px;border-bottom:1px solid #eee6f4;font-size:10.8px;line-height:1.25;min-height:31px}.auditRow time{color:#74677e;white-space:nowrap;font-size:9.8px;font-variant-numeric:tabular-nums}.auditRow span{padding-right:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.auditRow b{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.auditEmpty,.auditError,.auditLoading{text-align:center;padding:18px 8px;font-size:11px;color:#766983}#auditMore{margin-top:5px;height:32px;border:1px solid #d8c3ef;border-radius:9px;background:#faf6ff;color:#62369b;font-size:10.5px;font-weight:850}.auditFooter{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px;padding-top:7px;border-top:1px solid #eadff7}.auditFooter button{min-width:88px;height:36px;border:1px solid #d4bee9;background:#f7f2ff;color:#62369b;border-radius:10px;padding:0 12px;font-size:12px;font-weight:900}@media(max-width:360px){#dosaljaAuditPanel{padding:9px 9px 8px}.auditHead button{width:45px;height:45px;font-size:28px}.auditQuickActions{grid-template-columns:1.35fr repeat(3,minmax(0,.8fr));gap:4px}.auditQuickActions button{font-size:9.5px;padding:0 3px}.auditColumns,.auditRow{grid-template-columns:27% 35% 23% 15%}.auditRow{font-size:10.2px}.auditFilter{grid-template-columns:minmax(0,1fr) 112px}}`;css.textContent += '\n/* V4.2.5 관리자 전용 기록 정리 */\n.auditBulkToolbar{display:flex;justify-content:flex-end;align-items:center;min-height:31px;margin:10px 0 7px;gap:6px}\n#auditBulkToggle{border:1px solid #cdb5e7;color:#65339b;background:#f7f1fd;padding:0 11px;height:30px;border-radius:9px;font-size:10.5px;font-weight:850}\n#auditBulkActions{display:flex;gap:6px;align-items:center}\n#auditBulkActions[hidden],.auditSelectTools[hidden],#auditBulkToggle[hidden]{display:none!important}\n#auditBulkActions button{padding:0 9px;height:30px;border-radius:9px;border:1px solid #d2bce9;background:#f8f3fc;color:#623497;font-size:10.5px;font-weight:850}\n#auditBulkDelete{background:#a52e58!important;border-color:#a52e58!important;color:#fff!important}\n#auditBulkDelete:disabled{opacity:.45}\n.auditSelectTools{display:flex;align-items:center;gap:8px;margin:2px 0 6px;padding:7px 8px;border:1px solid #eadcf4;border-radius:8px;background:#fbf7ff;color:#5b3085;font-size:10.5px;font-weight:800}\n.auditSelectTools input,.auditPick input{width:15px;height:15px;accent-color:#7b40c8;cursor:pointer;margin:0}\n.auditColumns.auditColumnsBulk,.auditRow.auditRowBulk{grid-template-columns:28px 27% 35% minmax(0,1fr)}\n.auditColumns b:last-child{min-width:0}.auditDeleteOne{justify-self:end;min-width:37px;height:26px;border:1px solid #e5b8c7;border-radius:7px;background:#fff5f8;color:#9f335b;font-size:10px;font-weight:900;padding:0 3px;cursor:pointer}\n.auditDeleteOne:active{background:#fce4ee}.auditPick{display:flex;align-items:center;justify-content:center}\n@media(max-width:360px){.auditColumns,.auditRow{grid-template-columns:28% 33% 23% 16%}.auditColumns.auditColumnsBulk,.auditRow.auditRowBulk{grid-template-columns:24px 28% 32% minmax(0,1fr)}.auditDeleteOne{min-width:34px;font-size:9px}.auditBulkToolbar{margin-top:8px}}\n';document.head.append(css);window.DOSALJA_ADMIN_AUDIT={open,recordReward,setPrivateAddress};
