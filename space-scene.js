// Decorative, deliberately stylized scale: eight planets orbit the portrait.
export function createSpaceScene(hero) {
  const galaxy = hero.querySelector('.galaxy-backdrop');
  const worlds = hero.querySelector('.planet-system');
  const g = galaxy.getContext('2d');
  const c = worlds.getContext('2d');
  let width = 0, height = 0;
  const planets = [
    {name:'Mercury',size:6,color:'#9c9994',light:'#ddd4c3',speed:.27,phase:2.6},
    {name:'Venus',size:11,color:'#b88c54',light:'#ffe0a0',speed:.22,phase:5.3},
    {name:'Earth',size:13,color:'#286eae',light:'#85d5ec',speed:.18,phase:3.5},
    {name:'Mars',size:9,color:'#a74429',light:'#ef9b6e',speed:.145,phase:.65},
    {name:'Jupiter',size:29,color:'#ae8063',light:'#edcfaa',speed:.09,phase:3.05},
    {name:'Saturn',size:23,color:'#b09b73',light:'#f1deb1',speed:.07,phase:.3},
    {name:'Uranus',size:16,color:'#4d9ba9',light:'#b0e7e5',speed:.055,phase:4.3},
    {name:'Neptune',size:15,color:'#254baf',light:'#718eea',speed:.043,phase:1.6}
  ];
  const circle = (ctx,x,y,r,fill) => {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();};
  function drawGalaxy() {
    if (!g) return;
    g.clearRect(0,0,width,height);
    let seed=7319;
    const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const radius=Math.max(width*.58,450);
    g.save();g.translate(width*.5,height*.46);g.rotate(-.3);g.scale(1,.43);
    const glow=g.createRadialGradient(0,0,0,0,0,radius);
    glow.addColorStop(0,'#d9bca435');glow.addColorStop(.18,'#b6a6cf22');glow.addColorStop(.5,'#4e5e9a16');glow.addColorStop(1,'#080c2000');
    circle(g,0,0,radius,glow);
    // Soft clouds connect the star clusters into a broad galactic band.
    for(let i=0;i<140;i++) {
      const f=.14+random()*.8,a=(i%4)*Math.PI/2+f*5.3;
      const x=Math.cos(a)*f*radius,y=Math.sin(a)*f*radius;
      const size=radius*(.035+random()*.045);
      const cloud=g.createRadialGradient(x,y,0,x,y,size);
      cloud.addColorStop(0,i%3?'#7189bf12':'#ad88bb16');cloud.addColorStop(1,'#11132900');
      circle(g,x,y,size,cloud);
    }
    // Spiral arms, star clusters, and the dark spaces between them.
    for(let i=0;i<19000;i++) {
      const radiusFraction=Math.pow(random(),.64);
      const r=radiusFraction*radius;
      const arm=i%4;
      const spread=(random()+random()+random()-1.5)*(.14+radiusFraction*.3);
      const angle=arm*Math.PI/2+radiusFraction*5.3+spread;
      const x=Math.cos(angle)*r+(random()-.5)*28;
      const y=Math.sin(angle)*r+(random()-.5)*28;
      const size=.35+random()*1.15;
      const alpha=(1-radiusFraction*.75)*(.18+random()*.5);
      circle(g,x,y,size,`rgba(${i%7===0?'220,179,153':i%3===0?'173,164,216':'133,168,218'},${alpha})`);
    }
    const core=g.createRadialGradient(0,0,0,0,0,radius*.23);
    core.addColorStop(0,'#f4dfc47a');core.addColorStop(.25,'#dfc7b047');core.addColorStop(1,'#c4a3c000');circle(g,0,0,radius*.23,core);
    g.restore();
  }
  function sphere(p,x,y,r,time) {
    c.save();c.translate(x,y);
    const glow=c.createRadialGradient(0,0,r*.5,0,0,r*1.9);glow.addColorStop(0,p.color+'22');glow.addColorStop(1,p.color+'00');circle(c,0,0,r*1.9,glow);
    if(p.name==='Saturn') {c.save();c.rotate(-.35);c.strokeStyle='#d7c39966';c.lineWidth=r*.36;c.beginPath();c.ellipse(0,0,r*1.9,r*.55,0,0,Math.PI*2);c.stroke();c.restore();}
    const shade=c.createRadialGradient(-r*.4,-r*.4,r*.05,r*.25,r*.2,r*1.3);shade.addColorStop(0,p.light);shade.addColorStop(.46,p.color);shade.addColorStop(1,'#03050c');circle(c,0,0,r,shade);
    c.save();c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();
    if(p.name==='Earth') {
      c.fillStyle='#64a781';
      for(let j=0;j<4;j++){const a=j*1.65+time*.14;const xx=Math.sin(a)*r*.72;c.beginPath();c.ellipse(xx,(j-1.5)*r*.35,r*.24,r*.4,.7+j,0,Math.PI*2);c.fill();}
      c.strokeStyle='#e5f0ed70';c.lineWidth=r*.12;c.beginPath();c.ellipse(-r*.1,-r*.1,r*.85,r*.35,-.3,0,Math.PI*2);c.stroke();
    } else if(['Jupiter','Saturn','Venus','Uranus','Neptune'].includes(p.name)) {
      for(let j=0;j<8;j++){c.fillStyle=j%2?'#ffefd51e':'#261a2633';const y=(j/4-1)*r+Math.sin(time*.1+j)*r*.025;c.fillRect(-r,y,r*2,r*(p.name==='Jupiter'?.18:.1));}
      if(p.name==='Jupiter'){c.fillStyle='#94533c99';c.beginPath();c.ellipse(r*.35,r*.28,r*.25,r*.12,-.15,0,Math.PI*2);c.fill();}
    } else {
      for(let j=0;j<7;j++)circle(c,Math.sin(j*7)*r*.65,Math.cos(j*3)*r*.65,r*(.05+j*.008),'#17131a25');
    }
    const shadow=c.createLinearGradient(-r,-r,r,r);shadow.addColorStop(0,'#00000000');shadow.addColorStop(.45,'#00000000');shadow.addColorStop(1,'#010207bd');c.fillStyle=shadow;c.fillRect(-r,-r,r*2,r*2);
    c.restore();
    if(p.name==='Saturn'){c.save();c.rotate(-.35);c.strokeStyle='#e6d1a4aa';c.lineWidth=r*.24;c.beginPath();c.ellipse(0,0,r*1.9,r*.55,0,0,Math.PI);c.stroke();c.restore();}
    c.restore();
  }
  function render(time=0, cameraX=0, cameraY=0) {
    if(!c) return;
    c.clearRect(0,0,width,height);
    const mobile=width<650;
    const cx=width*.5+cameraX*7,cy=height*(mobile?.53:.46)+cameraY*5;
    const maxRadius=Math.min(width*.43,720);
    const scale=mobile?.65:Math.min(1,width/1200);
    const ordered=[];
    planets.forEach((p,i)=>{
      const rx=maxRadius*(.46+i*.075),ry=(mobile?155:210)*(.45+i*.074);
      const angle=p.phase+time*p.speed;
      c.save();c.translate(cx,cy);c.rotate(-.16);
      c.strokeStyle=`rgba(126,142,184,${i%2?.10:.16})`;c.lineWidth=.6;c.beginPath();c.ellipse(0,0,rx,ry,0,0,Math.PI*2);c.stroke();c.restore();
      const ox=Math.cos(angle)*rx,oy=Math.sin(angle)*ry;
      ordered.push({p,x:cx+ox*Math.cos(-.16)-oy*Math.sin(-.16),y:cy+ox*Math.sin(-.16)+oy*Math.cos(-.16),r:p.size*scale*(.9+Math.sin(angle)*.1)});
    });
    ordered.sort((a,b)=>a.y-b.y).forEach(v=>sphere(v.p,v.x,v.y,v.r,time));
  }
  function resize(w,h) {
    width=w;height=h;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    for(const [canvas,ctx] of [[galaxy,g],[worlds,c]]){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);}
    drawGalaxy();render();
  }
  return {resize,render};
}
