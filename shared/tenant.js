(function(global){
  "use strict";
  const permissionMessage='관리 권한이 없습니다.\n관리자 기능은 메인 화면의 관리자 메뉴에서 인증 후 사용할 수 있습니다.';
  function ctx(){try{if(parent&&parent!==window&&parent.CAT_HERO_V4_CONTEXT)return parent.CAT_HERO_V4_CONTEXT;}catch(_e){} const id=new URLSearchParams(location.search).get('g')||'';return {guildId:id};}
  function gid(){return String(ctx().guildId||new URLSearchParams(location.search).get('g')||'').trim();}
  function isAdmin(){try{return !!(parent&&parent.CAT_HERO_V4_AUTH_STATE?.guildId===gid()&&parent.CAT_HERO_V4_AUTH_STATE?.isGuildAdmin);}catch(_e){return false;}}
  let authPromise=null;
  function localAuth(){
    if(authPromise)return authPromise;
    authPromise=(async()=>{
      const [appLib,authLib]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js')
      ]);
      const app=appLib.getApps().length?appLib.getApp():appLib.initializeApp(window.GUILD_OPS_CONFIG.firebase);
      let auth;
      try{auth=authLib.initializeAuth(app,{persistence:[authLib.indexedDBLocalPersistence,authLib.browserLocalPersistence,authLib.browserSessionPersistence]});}
      catch(_e){auth=authLib.getAuth(app);}
      if(typeof auth.authStateReady==='function')await auth.authStateReady();
      return {auth,authLib};
    })();
    return authPromise;
  }
  // Start restoring the same Firebase session immediately in every V4 page.
  localAuth().catch(()=>{});
  async function waitLocalAuth(){try{const {auth}=await localAuth();return auth.currentUser||null;}catch(_e){return null;}}
  async function ensureAdmin(){
    try{
      if(parent&&typeof parent.CAT_HERO_V4_CHECK_ADMIN==='function'){
        const ok=await parent.CAT_HERO_V4_CHECK_ADMIN(gid());
        if(!ok)return false;
        const user=await waitLocalAuth();
        if(!user){alert('관리자 인증 동기화가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.');return false;}
        return true;
      }
    }catch(_e){}
    alert(permissionMessage);return false;
  }
  async function requestAdmin(){
    try{if(parent&&typeof parent.CAT_HERO_V4_REQUEST_ADMIN==='function')return !!(await parent.CAT_HERO_V4_REQUEST_ADMIN(gid()));}catch(_e){}
    return false;
  }
  async function logout(){try{if(parent&&typeof parent.CAT_HERO_V4_LOGOUT==='function')return await parent.CAT_HERO_V4_LOGOUT();}catch(e){alert('로그아웃 실패: '+(e.message||e));return false;}return false;}
  async function refreshRole(){try{if(parent&&typeof parent.CAT_HERO_V4_ROLE_REFRESH==='function')return await parent.CAT_HERO_V4_ROLE_REFRESH();}catch(_e){}return false;}
  function shareUrl(){try{return parent.CAT_HERO_V4_ACCESS?.shareUrl?.()||'';}catch(_e){return '';}}
  global.CAT_HERO_V4_TENANT={ctx,gid,isAdmin,ensureAdmin,requestAdmin,logout,refreshRole,waitLocalAuth,shareUrl,permissionMessage,cacheKey:(name)=>`cat-hero-v4:${gid()}:${name}`};
  try{parent.postMessage({type:'cat-hero-v4-role-request'},location.origin);}catch(_e){}
})(window);
