/* Cat Hero Plinko physics v4.3.9 — denser high-tension physical drawing with abundant randomized specialty pegs.
   - No predetermined destination or hidden steering.
   - Each round randomizes the peg layout, peg specialties and small offsets.
   - Participants are uniformly shuffled across slots before every drop.
   - Physics determines the landing slot; the participant in that slot wins.
   - Extra baffles, denser rows and calmer landing cups reduce sudden late jumps. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CatPlinkoPhysics=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const WIDTH=840,HEIGHT=890;
  const RADIUS=9.4;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const randomFloat=rand=>clamp(Number(rand())||0,0,0.999999999999);
  function createBoard(n,rand=Math.random){
    if(!Number.isInteger(n)||n<1||n>17)throw new Error('플링코 남은 참여 인원은 1~17명입니다.');
    const left=38,right=WIDTH-38,slotTop=734,slotBottom=828;
    const slotWidth=(right-left)/n;
    const pegs=[];
    const rows=n<=4?12:n<=8?13:n<=12?14:15;
    const baseCols=n<=5?10:n<=9?11:12;
    const xGap=baseCols>=12?56:baseCols===11?60:66;
    const yGap=rows>=15?39:41;
    const firstY=146;
    const typeBag=['standard','standard','standard','spring','spring','prism','prism','booster','booster','bumper','bumper'];
    const variants=[];
    for(let row=0;row<rows;row++){
      const parity=row%2;
      const count=baseCols-(parity?1:0);
      const start=(WIDTH-((count-1)*xGap))/2;
      for(let c=0;c<count;c++){
        const edge=c===0||c===count-1;
        const rPick=randomFloat(rand);
        const jitterX=(rPick-.5)*(edge?9:16);
        const jitterY=(randomFloat(rand)-.5)*9;
        let type='standard';
        if(!edge || randomFloat(rand)>.25){
          type=typeBag[Math.floor(randomFloat(rand)*typeBag.length)]||'standard';
        }
        if(row<2 && type==='booster')type='spring';
        if(row<2 && type==='bumper')type='prism';
        if(row>=rows-2 && type==='spring' && randomFloat(rand)<.55)type='bumper';
        if(row>=rows-3 && type==='booster' && randomFloat(rand)<.4)type='prism';
        const radius=type==='spring'?8.8:type==='prism'?8.2:type==='booster'?8.4:type==='bumper'?9.2:7.6;
        const bias=(type==='prism'?(randomFloat(rand)<.5?-1:1):0);
        const peg={x:start+c*xGap+jitterX,y:firstY+row*yGap+jitterY,r:radius,type,row,col:c,bias};
        pegs.push(peg);
        variants.push(type);
      }
    }
    const boundaries=Array.from({length:n-1},(_,i)=>left+slotWidth*(i+1));
    return {width:WIDTH,height:HEIGHT,n,left,right,slotTop,slotBottom,slotWidth,ballRadius:RADIUS,pegs,boundaries,
      rows,baseCols,layoutKey:variants.join(','),minCollisions:Math.max(10,Math.round(rows*1.05))};
  }
  function simulate(board,rand=Math.random){
    const radius=board.ballRadius;
    const bounded=()=>randomFloat(rand);
    const ball={x:board.width/2+(bounded()-.5)*108,y:80,vx:(bounded()-.5)*1.8,vy:0};
    const history=[],events=[];
    const g=0.175,air=.9985,wallRest=.79;
    const pegRest={standard:.82,spring:1.15,prism:.91,booster:1.03,bumper:.88};
    let arrived=false,slot=-1,bounceCount=0,collisions=0,settledFrames=0;
    // multiple-hit rows are expected; this is not a straight waterfall.
    for(let step=0;step<5600;step++){
      let {x,y,vx,vy}=ball;
      vy=Math.min(8.35,vy+g);
      vx*=air;
      const sub=4;
      const frameEvents=[];
      for(let substep=0;substep<sub;substep++){
        const oldX=x,oldY=y;
        x+=vx/sub;y+=vy/sub;
        const wallL=board.left+radius,wallR=board.right-radius;
        if(x<wallL){x=wallL;vx=Math.abs(vx)*wallRest;frameEvents.push({type:'wall',x,y});}
        if(x>wallR){x=wallR;vx=-Math.abs(vx)*wallRest;frameEvents.push({type:'wall',x,y});}
        for(let i=0;i<board.pegs.length;i++){
          const peg=board.pegs[i];
          if(Math.abs(peg.y-y)>radius+peg.r+5||Math.abs(peg.x-x)>radius+peg.r+5)continue;
          const dx=x-peg.x,dy=y-peg.y,dist2=dx*dx+dy*dy,minD=radius+peg.r;
          if(dist2>=minD*minD)continue;
          const len=Math.sqrt(dist2)||1,nx=dx/len,ny=dy/len;
          x=peg.x+nx*(minD+.14);y=peg.y+ny*(minD+.14);
          const dot=vx*nx+vy*ny;
          if(dot<0){
            const restitution=pegRest[peg.type]??pegRest.standard;
            vx-=(1+restitution)*dot*nx;vy-=(1+restitution)*dot*ny;
            let spin=(bounded()-.5)*0.18;
            if(peg.type==='spring'){spin+=(bounded()-.5)*0.85;vy-=0.22;}
            else if(peg.type==='prism'){spin+=peg.bias*0.46;vx+=peg.bias*0.22;}
            else if(peg.type==='booster'){spin+=(bounded()-.5)*0.55;vx*=1.05;vy*=0.98;}
            else if(peg.type==='bumper'){spin+=(bounded()-.5)*0.3;vx*=0.95;vy*=0.94;}
            vx+=-ny*spin;vy+=nx*spin;
            if(Math.abs(vx)<0.045)vx+=(bounded()-.5)*0.12;
            vx=clamp(vx,-7.2,7.2);vy=clamp(vy,-7.5,8.5);
            collisions++;
            frameEvents.push({type:peg.type,x:peg.x,y:peg.y,peg:i,impact:Math.abs(dot)});
          }
        }
        if(y>=board.slotTop-70&&y<=board.slotBottom+radius){
          for(const bx of board.boundaries){
            const half=4.2,walltop=board.slotTop-66,minDist=radius+half;
            if(Math.abs(x-bx)>=minDist||y<walltop)continue;
            const dir=oldX<bx?-1:oldX>bx?1:(x<bx?-1:1);
            x=bx+dir*(minDist+.08);
            vx=dir*Math.max(.08,Math.abs(vx)*.54);
            if(y>board.slotTop+18)vy*=0.985;
            frameEvents.push({type:'divider',x:bx,y});
          }
        }
        if(y>board.slotBottom-radius){
          y=board.slotBottom-radius;
          if(vy>0.06){vy=-vy*0.18;bounceCount++;frameEvents.push({type:'floor',x,y});}
          else vy=0;
          vx*=0.72;
        }
      }
      if(y>board.slotTop-10){vx*=0.958;}
      if(y>board.slotTop+18){vy*=0.996;}
      ball.x=x;ball.y=y;ball.vx=vx;ball.vy=vy;
      const record={x,y,vx,vy,events:frameEvents};
      history.push(record);if(frameEvents.length)events.push(...frameEvents.map(e=>({...e,frame:history.length-1})));
      if(y>=board.slotBottom-radius-.55){
        if(Math.abs(vx)<0.16&&Math.abs(vy)<0.3)settledFrames++;
        else settledFrames=0;
        if(settledFrames>=9){
          const lane=clamp(Math.floor((x-board.left)/board.slotWidth),0,board.n-1);
          slot=lane;arrived=true;break;
        }
      }else settledFrames=0;
    }
    return {arrived,slot,history,events,collisions,bounceCount,last:history[history.length-1]||null};
  }
  function shuffle(names,randIndex){
    const a=names.slice();
    for(let i=a.length-1;i>0;i--){const j=randIndex(i+1);[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function validate(result,board){
    if(!result.arrived||result.slot<0||result.slot>=board.n)return false;
    if(!result.history.length||result.collisions<board.minCollisions)return false;
    const last=result.last;
    if(!last||last.y<board.slotBottom-board.ballRadius-1)return false;
    for(let i=1;i<result.history.length;i++){
      const a=result.history[i-1],b=result.history[i];
      if(Math.hypot(a.x-b.x,a.y-b.y)>24)return false;
      if(!Number.isFinite(b.x+b.y+b.vx+b.vy))return false;
    }
    return true;
  }
  return {WIDTH,HEIGHT,createBoard,simulate,shuffle,validate};
});
