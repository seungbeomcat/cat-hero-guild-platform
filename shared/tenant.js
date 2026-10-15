(function(global){
  "use strict";
  function ctx(){try{if(parent&&parent!==window&&parent.CAT_HERO_V4_CONTEXT)return parent.CAT_HERO_V4_CONTEXT;}catch(_e){} const gid=new URLSearchParams(location.search).get('g')||'';return {guildId:gid};}
  function gid(){return String(ctx().guildId||new URLSearchParams(location.search).get('g')||'').trim();}
  function isAdmin(){try{return !!(parent&&parent.CAT_HERO_V4_AUTH_STATE?.guildId===gid()&&parent.CAT_HERO_V4_AUTH_STATE?.isGuildAdmin);}catch(_e){return false;}}
  async function waitLocalAuth(){
    try{
      const [appLib,authLib]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js')
      ]);
      const app=appLib.getApps().length?appLib.getApp():appLib.initializeApp(window.GUILD_OPS_CONFIG.firebase);
      const auth=authLib.getAuth(app);
      if(typeof auth.authStateReady==='function')await auth.authStateReady();
      if(auth.currentUser)return auth.currentUser;
      return await new Promise(resolve=>{
        let done=false,unsub=()=>{};
        const finish=u=>{if(done)return;done=true;clearTimeout(timer);try{unsub();}catch(_e){} resolve(u||null);};
        const timer=setTimeout(()=>finish(auth.currentUser),3500);
        unsub=authLib.onAuthStateChanged(auth,u=>{if(u)finish(u);});
      });
    }catch(_e){return null;}
  }
  async function ensureAdmin(){
    try{
      if(parent&&typeof parent.CAT_HERO_V4_ENSURE_ADMIN==='function'){
        const ok=await parent.CAT_HERO_V4_ENSURE_ADMIN(gid());
        if(!ok)return false;
        const user=await waitLocalAuth();
        if(!user){alert('관리자 인증은 완료됐지만 현재 화면의 Firebase 인증 동기화가 지연되고 있습니다. 화면을 한 번 새로고침해 주세요.');return false;}
        return true;
      }
    }catch(_e){}
    alert('길드 관리자 인증 화면을 열 수 없습니다. 길드 전용 주소에서 다시 접속해 주세요.');
    return false;
  }
  async function requestAdmin(){return ensureAdmin();}
  global.CAT_HERO_V4_TENANT={ctx,gid,isAdmin,ensureAdmin,requestAdmin,waitLocalAuth,cacheKey:(name)=>`cat-hero-v4:${gid()}:${name}`};
})(window);
