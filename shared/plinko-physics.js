/* Cat Hero Plinko physics v4.3.6 — no predetermined destination or hidden steering.
   Winner fairness: participants are uniformly shuffled across slots before every drop.
   Physics picks a slot freely; participant at that physical slot is the winner.
   The permutation is independent of the ball, so each participant's win probability is 1/N.
   Standalone deterministic simulation for audit; randomness supplied by caller. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CatPlinkoPhysics=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const WIDTH=840,HEIGHT=890;
  const RADIUS=11.2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const RNG_STEP=1/90;
  function createBoard(n){
    if(!Number.isInteger(n)||n<1||n>17)throw new Error('플링코 남은 참여 인원은 1~17명입니다.');
    const left=38,right=WIDTH-38,slotTop=738,slotBottom=826;
    const slotWidth=(right-left)/n;
    const pegs=[];
    const rows=10,cols=11,xGap=64,firstY=180,yGap=49;
    for(let row=0;row<rows;row++){
      const parity=row%2;
      const count=parity?10:11;
      const start=(WIDTH-((count-1)*xGap))/2;
      for(let c=0;c<count;c++){
        const typ=(row*11+c)%13===0?'spring':(row*11+c)%11===0?'prism':'standard';
        pegs.push({x:start+c*xGap,y:firstY+row*yGap,r:typ==='spring'?9:7.8,type:typ,row,col:c});
      }
    }
    return {width:WIDTH,height:HEIGHT,n,left,right,slotTop,slotBottom,slotWidth,ballRadius:RADIUS,pegs,
      boundaries:Array.from({length:n-1},(_,i)=>left+slotWidth*(i+1))};
  }
  function simulate(board,rand=Math.random){
    const radius=board.ballRadius;
    const bounded=()=>clamp(Number(rand())||0,0,0.999999999999);
    // Launch from a visible nozzle across the middle third, never from a decided destination.
    const ball={x:board.width/2+(bounded()-.5)*125,y:84,vx:(bounded()-.5)*2.6,vy:0};
    const history=[],events=[];
    const g=0.185,air=.999,wallRest=.8,pegRest={standard:.79,spring:1.08,prism:.94};
    let arrived=false,slot=-1,bounceCount=0,collisions=0;
    const pegHits=new Int16Array(board.pegs.length);
    // Simulation is computed in advance and must reach an actual resting slot.
    for(let step=0;step<4000;step++){
      let {x,y,vx,vy}=ball;
      const previousY=y;
      vy=Math.min(8.7,vy+g);
      vx*=air;
      // Small substeps prevent tunneling through individual collision pins.
      const sub=3;
      const frameEvents=[];
      for(let substep=0;substep<sub;substep++){
        const oldX=x,oldY=y;
        x+=vx/sub;y+=vy/sub;
        const wallL=board.left+radius,wallR=board.right-radius;
        if(x<wallL){x=wallL;vx=Math.abs(vx)*wallRest;frameEvents.push({type:'wall',x,y});}
        if(x>wallR){x=wallR;vx=-Math.abs(vx)*wallRest;frameEvents.push({type:'wall',x,y});}
        // Peg collision is radial and reacts to the ACTUAL incoming velocity.
        for(let i=0;i<board.pegs.length;i++){
          const peg=board.pegs[i];
          if(Math.abs(peg.y-y)>radius+peg.r+4||Math.abs(peg.x-x)>radius+peg.r+4)continue;
          const dx=x-peg.x,dy=y-peg.y,dist2=dx*dx+dy*dy,minD=radius+peg.r;
          if(dist2>=minD*minD)continue;
          const len=Math.sqrt(dist2)||1,nx=dx/len,ny=dy/len;
          x=peg.x+nx*(minD+.18);y=peg.y+ny*(minD+.18);
          const dot=vx*nx+vy*ny;
          if(dot<0){
            const restitution=pegRest[peg.type];
            vx-=(1+restitution)*dot*nx;vy-=(1+restitution)*dot*ny;
            // Contact-driven tangent kick only, not a destination correction.
            const spin=peg.type==='spring'?1.2:peg.type==='prism'?.75:.22;
            const tangential=(bounded()-.5)*spin;
            vx+=-ny*tangential;vy+=nx*tangential;
            if(peg.type==='spring')vy-=.28;
            vx=clamp(vx,-9.5,9.5);vy=clamp(vy,-8.5,9.4);
            collisions++;pegHits[i]++;
            frameEvents.push({type:peg.type,x:peg.x,y:peg.y,peg:i,impact:Math.abs(dot)});
          }
        }
        // Tall baffles separate landing channels: collisions cannot cross a baffle.
        if(y>=board.slotTop-63&&y<=board.slotBottom+radius){
          for(const bx of board.boundaries){
            const half=3.1,walltop=board.slotTop-60;
            const minDist=radius+half;
            if(Math.abs(x-bx)>=minDist)continue;
            // Approach from the side: reflect horizontally. There is no hidden slot attraction.
            const dir=oldX<bx?-1:oldX>bx?1:(x<bx?-1:1);
            x=bx+dir*(minDist+.1);
            vx=dir*Math.max(.15,Math.abs(vx)*.62);
            frameEvents.push({type:'divider',x:bx,y});
          }
        }
        if(y>board.slotBottom-radius){
          y=board.slotBottom-radius;
          if(vy>0){vy=-vy*.23;bounceCount++;frameEvents.push({type:'floor',x,y});}
          vx*=.82;
        }
      }
      // Non-collision drag at the bottom settles the ball naturally.
      if(y>board.slotTop+27){vx*=.965;vy*=.995;}
      ball.x=x;ball.y=y;ball.vx=vx;ball.vy=vy;
      const record={x,y,vx,vy,events:frameEvents};
      history.push(record);if(frameEvents.length)events.push(...frameEvents.map(e=>({...e,frame:history.length-1})));
      if(y>=board.slotBottom-radius-.5&&Math.abs(vx)<.42&&Math.abs(vy)<.7){
        const lane=clamp(Math.floor((x-board.left)/board.slotWidth),0,board.n-1);
        slot=lane;arrived=true;break;
      }
      // If a rare trajectory stays trapped too long, reject this attempt. NEVER teleport or force a winner.
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
    if(!result.history.length)return false;
    const last=result.last;
    if(last.y<board.slotBottom-board.ballRadius-1)return false;
    for(let i=1;i<result.history.length;i++){
      const a=result.history[i-1],b=result.history[i];
      if(Math.hypot(a.x-b.x,a.y-b.y)>25)return false;
      if(!Number.isFinite(b.x+b.y))return false;
    }
    return true;
  }
  return {WIDTH,HEIGHT,createBoard,simulate,shuffle,validate};
});
