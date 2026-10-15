/* V2.1.5: compact mobile reward entry — tightened selectors and separated date fields */
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
const config=window.GUILD_OPS_CONFIG.firebase;
const gid=window.CAT_HERO_V4_TENANT?.gid?.()||'';
const app=getApps().length?getApp():initializeApp(config);
const auth=getAuth(app),db=getFirestore(app),ref=doc(db,'guilds',gid,'data','rewards');
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={'균열':'균열의 격전지','은하':'은하 격전지','점령전':'점령전','난투전':'길드 난투전'};
const css=`
#rewardEntryOverlay[hidden]{display:none!important}#rewardEntryOverlay{position:fixed;inset:0;z-index:2147483640;background:rgba(7,3,16,.80);display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;font-family:inherit}
#rewardEntryDialog{box-sizing:border-box;width:min(402px,calc(100vw - 20px));max-height:calc(100dvh - 20px);overflow-y:auto;overscroll-behavior:contain;background:#fff;border:3px solid #8340dc;border-radius:20px;padding:14px;color:#302047;font-family:inherit;box-shadow:0 20px 65px #0007}
#rewardEntryDialog *{box-sizing:border-box}.rewardEntryHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid #eadff7}#rewardEntryDialog h2{font-size:20px;line-height:1;margin:0;color:#173f73;font-weight:900;letter-spacing:-.04em}
#rewardEntryClose{display:grid!important;place-items:center!important;width:31px!important;height:31px!important;min-height:31px!important;padding:0!important;border:0!important;border-radius:9px!important;background:#f1e9fb!important;color:#6831a8!important;font-size:20px!important;font-weight:900!important;line-height:1!important}
#rewardEntryDialog label{display:block;font-size:12px;font-weight:850;margin:8px 0 4px;color:#4d247c;letter-spacing:-.025em}
#rewardEntryDialog input:not([type=checkbox]),#rewardEntryDialog select{width:100%;min-width:0;height:40px;border:1.5px solid #c7b3e4;border-radius:10px;padding:0 10px;background:#fff;color:#34213f;font-family:inherit;font-size:14px;font-weight:750;outline:0}
#rewardEntryDialog select{appearance:none;-webkit-appearance:none;padding-right:28px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%235b2b8d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center;background-size:11px 7px;color:#4b2a69}
#rewardEntryDialog input:focus,#rewardEntryDialog select:focus{border-color:#8242d9;box-shadow:0 0 0 3px rgba(132,64,220,.10)}
#rewardEntryDialog .row{display:grid;min-width:0}
.reward-top-row{grid-template-columns:118px 84px;justify-content:space-between;column-gap:16px;align-items:end}
.reward-top-row>div{min-width:0}
.reward-top-row select{height:38px!important;font-size:14px!important;font-weight:850!important;letter-spacing:-.03em!important;padding-left:10px!important;padding-right:27px!important}
.reward-date-row{display:flex!important;justify-content:space-between!important;align-items:flex-end!important;gap:0!important;width:100%!important}
.reward-date-row>div{flex:0 0 46%!important;width:46%!important;max-width:46%!important;min-width:0!important}
#rewardEntryDialog input[type=date]{display:block;box-sizing:border-box;min-width:0!important;max-width:100%!important;width:100%!important;height:40px!important;padding:0 6px!important;font-family:inherit!important;font-size:13px!important;font-weight:850!important;line-height:40px!important;text-align:center!important;color:#173f73!important;background:#fff!important;-webkit-appearance:none!important;appearance:none!important;-webkit-min-logical-width:0!important}
#rewardEntryDialog input[type=date]::-webkit-date-and-time-value{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-height:100%!important;margin:0!important;padding:0!important}
#rewardEntryDialog input[type=date]::-webkit-datetime-edit{padding:0!important;text-align:center!important}
#rewardEntryDialog .item{border:1.5px solid #d7c5ed;border-radius:13px;padding:10px;margin:11px 0;background:#fefeff}.reward-item-row{grid-template-columns:minmax(0,1fr) 68px;gap:10px;align-items:end}.reward-item-row .item-name{font-size:13.5px;font-weight:850}.reward-item-row .item-qty{text-align:center!important;padding:0 3px!important;font-size:15px!important;font-weight:900!important;color:#173f73!important}
#rewardEntryDialog .recipients{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:7px}#rewardEntryDialog .recipients label{font-size:11px;font-weight:750;margin:0;border:1px solid #e2d8ef;border-radius:8px;padding:7px 3px;display:flex;align-items:center;gap:4px;white-space:nowrap;color:#4b2a69}#rewardEntryDialog .recipients input{accent-color:#8242d9;width:18px;height:18px;flex:none}
#rewardEntryDialog button{font-family:inherit;font-size:12px;font-weight:850;border:1.5px solid #8340dc;border-radius:9px;background:#f7f1ff;color:#542a8e;padding:8px 10px;cursor:pointer;min-height:36px}#rewardEntryDialog button.primary{background:linear-gradient(180deg,#8847dc,#6931b8);color:white;border-color:#6931b8}.remove{margin-top:8px!important;padding:6px 9px!important;min-height:31px!important;font-size:10.5px!important}
#rewardEntryDialog .actions{display:flex;gap:8px;margin-top:12px}#rewardEntryDialog .actions button{flex:1}#rewardEntryStatus{min-height:16px;font-size:10.5px;color:#6b517e;margin-top:8px;font-weight:700}
@media(max-width:370px){#rewardEntryDialog{padding:12px}.reward-top-row{grid-template-columns:110px 78px;column-gap:12px}.reward-date-row>div{flex-basis:45.5%!important;width:45.5%!important;max-width:45.5%!important}#rewardEntryDialog input[type=date]{font-size:12px!important;padding-inline:3px!important}.reward-item-row{grid-template-columns:minmax(0,1fr) 64px}.recipients{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;
let overlay,itemsHost,previousOverflow='';
function close(){if(!overlay)return;overlay.hidden=true;document.body.style.overflow=previousOverflow;}
function open(){
 if(!overlay){const st=document.createElement('style');st.textContent=css;document.head.append(st);overlay=document.createElement('div');overlay.id='rewardEntryOverlay';overlay.hidden=true;document.body.append(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});}
 const api=window.DOSALJA_REWARDS;const catalog=api?.getCatalog?.()||[];
 const names=Object.keys(window.DosaljaShared?.members||{}).sort((a,b)=>(window.DosaljaShared.members[b].base||0)-(window.DosaljaShared.members[a].base||0));
 overlay.innerHTML=`<section id="rewardEntryDialog" role="dialog" aria-modal="true" aria-label="보상 기록 추가"><div class="rewardEntryHead"><h2>보상 기록 추가</h2><button id="rewardEntryClose" type="button" aria-label="닫기">×</button></div><div class="row reward-top-row"><div><label for="rewardEntryType">전투 종류</label><select id="rewardEntryType">${Object.keys(titles).map(t=>`<option>${t}</option>`).join('')}</select></div><div><label for="rewardEntryRank">최종 순위</label><select id="rewardEntryRank">${Array.from({length:20},(_,i)=>`<option>${i+1}위</option>`).join('')}</select></div></div><div class="row reward-date-row"><div><label for="rewardEntryStart">시작일</label><input id="rewardEntryStart" type="date"></div><div><label for="rewardEntryEnd">종료일</label><input id="rewardEntryEnd" type="date"></div></div><div id="rewardEntryItems"></div><button id="rewardEntryAddItem" type="button">＋ 보상 아이템 추가</button><div class="actions"><button id="rewardEntryCancel" type="button">취소</button><button id="rewardEntrySave" type="button" class="primary">Firebase 저장</button></div><div id="rewardEntryStatus" role="status">보상 종류와 수령 길드원을 선택해 저장할 수 있습니다.</div></section>`;
 overlay.hidden=false;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const $=id=>overlay.querySelector('#'+id);itemsHost=$('rewardEntryItems');
 const today=new Date().toLocaleDateString('sv-SE');$('rewardEntryStart').value=today;$('rewardEntryEnd').value=today;
 $('rewardEntryClose').onclick=close;$('rewardEntryCancel').onclick=close;
 function addItem(){const el=document.createElement('div');el.className='item';el.innerHTML=`<div class="row reward-item-row"><div><label>보상 아이템</label><select class="item-name"><option value="">선택하세요</option>${catalog.map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join('')}</select></div><div><label>수량</label><input class="item-qty" type="number" min="1" step="1" value="1" inputmode="numeric"></div></div><label>보상 수령 길드원 (복수 선택)</label><div class="recipients">${names.map(n=>`<label><input type="checkbox" value="${safe(n)}">${safe(n)}</label>`).join('')}</div><button class="remove" type="button">아이템 삭제</button>`;itemsHost.append(el);el.querySelector('.remove').onclick=()=>el.remove();}
 $('rewardEntryAddItem').onclick=addItem;addItem();
 $('rewardEntrySave').onclick=async()=>{
  const status=$('rewardEntryStatus'),button=$('rewardEntrySave');
  try{
   const type=$('rewardEntryType').value,a=$('rewardEntryStart').value,b=$('rewardEntryEnd').value;
   if(!a||!b||a>b)throw Error('시작일과 종료일을 확인해 주세요.');
   const items=[...itemsHost.querySelectorAll('.item')].map(el=>({name:el.querySelector('.item-name').value,qty:Number(el.querySelector('.item-qty').value),recipients:[...el.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value)}));
   if(!items.length||items.some(x=>!x.name||!Number.isInteger(x.qty)||x.qty<1||!x.recipients.length))throw Error('아이템, 수량, 수령 길드원을 모두 선택해 주세요.');
   if(!await window.CAT_HERO_V4_TENANT?.ensureAdmin?.())throw Error('길드 관리자 인증이 필요합니다.');
   button.disabled=true;status.textContent='Firebase에 저장 중입니다…';
   const snap=await getDoc(ref),records=snap.exists()&&Array.isArray(snap.data().records)?snap.data().records:window.DOSALJA_REWARDS?.getRecords?.()||[];
   const record={id:'reward-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),type,title:titles[type],period:a.replaceAll('-','.')+' ~ '+b.replaceAll('-','.'),sort:b,rank:$('rewardEntryRank').value,items};
   const next=[...records,record];await setDoc(ref,{records:next,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});
   window.DOSALJA_REWARDS?.setRecords?.(next);try{await window.DOSALJA_ADMIN_AUDIT?.recordReward?.(record);}catch(auditError){console.error('보상 활동 기록 저장 실패',auditError);status.textContent='보상은 저장됐으나 활동 기록 저장 실패: '+(auditError.code||auditError.message);alert(status.textContent);close();return;}status.textContent='저장 완료';close();
  }catch(e){status.textContent='저장 실패: '+(e.code||e.message);alert(status.textContent);}finally{button.disabled=false;}
 };
}
function bind(){const button=document.getElementById('rewardHistoryAddBtn');if(!button)return;button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open();},true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
