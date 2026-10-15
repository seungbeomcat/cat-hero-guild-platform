/* Cat Hero V4 multi-guild shared calculator core. No guild-specific roster is bundled. */
(function(global){
  "use strict";
  function readContext(){
    try{
      if(global.parent && global.parent!==global && global.parent.CAT_HERO_V4_CONTEXT) return global.parent.CAT_HERO_V4_CONTEXT;
    }catch(_e){}
    const gid=new URLSearchParams(location.search).get('g')||'';
    if(!gid)return {guildId:'',guild:{},members:{},aliases:{}};
    try{return JSON.parse(localStorage.getItem(`cat-hero-v4:${gid}:context`)||'null')||{guildId:gid,guild:{},members:{},aliases:{}};}catch(_e){return {guildId:gid,guild:{},members:{},aliases:{}};}
  }
  const context=readContext();
  const members={}; Object.assign(members,context.members||{});
  const aliases={}; Object.assign(aliases,context.aliases||{});
  const formerNames={}; Object.assign(formerNames,context.formerNames||{});
  const bosses={
    "루이": [[15,325000],[16,330000],[17,335000],[18,340000],[19,345000],[20,350000]],
    "루니": [[25,375000],[26,380000],[27,385000],[28,390000],[29,395000],[30,400000]],
    "루나": [[35,425000],[36,430000],[37,435000],[38,440000],[39,445000],[40,450000]],
    "바나냥": [[45,475000],[46,480000],[47,485000],[48,490000],[49,495000],[50,500000]]
  };
  const rules={wavesPerSecond:63/60,scorePerWave:1000,safeSeconds:1,serverOptions:[0,1,2,3,4,6]};
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const canonical=n=>{
    let key=String(n??'').trim();
    if(own(members,key))return key;
    const visited=new Set();
    while(key&&!visited.has(key)){
      visited.add(key);
      const next=aliases[key]||formerNames[key];
      if(!next)break;
      key=String(next).trim();
      if(own(members,key))return key;
    }
    return key;
  };
  function memberOrder(){return Object.keys(members).sort((a,b)=>Number(members[b]?.base||0)-Number(members[a]?.base||0)||a.localeCompare(b,'ko-KR'));}
  function zoneTotal(name,server,zone){const m=members[canonical(name)];return m?Number(m.base||0)+Number(server)+(Number(m[{z1:'z1r',z2:'z2r',z3:'z3r'}[zone]])||0):null;}
  function regionTotal(name,server,region){const m=members[canonical(name)];return m&&m.field&&m.field[region]!=null?Number(m.base||0)+Number(server)+Number(m.field[region]||0):null;}
  function sustainedDpsFromG(G){return rules.wavesPerSecond*rules.scorePerWave*(1+Number(G)/100);}
  function scoreAtCompletedWaves(name,G,waves){const m=members[canonical(name)];return Math.round(Number(waves)*rules.scorePerWave*(1+Number(G)/100)+(m?Number(m.minScore||0):0));}
  function safeSecRange(sec){const c=Math.max(0,Math.round(sec));return {center:c,low:Math.max(0,c-rules.safeSeconds),high:c+rules.safeSeconds};}
  function largestRemainder(raws,target,tieGs){const floors=raws.map(Math.floor);const remaining=Math.max(0,target-floors.reduce((a,b)=>a+b,0));const ranked=raws.map((r,i)=>({i,frac:r-Math.floor(r),G:Number(tieGs[i])||0})).sort((a,b)=>(b.frac-a.frac)||(b.G-a.G)||(a.i-b.i));const out=floors.slice();for(let i=0;i<remaining;i++)out[ranked[i%ranked.length].i]++;return {out,ranked,remaining};}
  function allocateHpExact(hp,items){const S=items.reduce((a,x)=>a+x.P,0);const raws=items.map(x=>S?hp*x.P/S:0);const alloc=largestRemainder(raws,hp,items.map(x=>x.G));return {raws,out:alloc.out,totalMin:0,remain:hp,S};}
  const core={schemaVersion:4,version:'V4.0.0-rc3',guildId:context.guildId,guild:context.guild||{},members,aliases,formerNames,bosses,rules,canonical,memberOrder,zoneTotal,regionTotal,sustainedDpsFromG,scoreAtCompletedWaves,safeSecRange,largestRemainder,allocateHpExact};
  global.CatHeroV4={...(global.CatHeroV4||{}),guildId:context.guildId,guild:context.guild||{},cacheKey:(name)=>`cat-hero-v4:${context.guildId}:${name}`};
  global.CatHeroShared=core;
  global.DosaljaShared=core; // V3 engine compatibility alias; contains no fixed guild roster.
})(window);
