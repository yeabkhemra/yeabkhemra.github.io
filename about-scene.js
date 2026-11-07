// A small, dependency-free WebGL sculpture. No portrait or remote model is used.
const art = document.querySelector('.lab-art');
if (art) {
  const canvas = art.querySelector('.lab-sculpture');
  const stage = art.querySelector('.lab-stage');
  const button = art.querySelector('.lab-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let gl;
  try { gl = canvas.getContext('webgl', {alpha:true, antialias:true, powerPreference:'low-power'}); } catch {}
  if (gl) {
    try { initialize(gl); }
    catch { art.classList.remove('has-webgl'); art.classList.add('is-paused'); canvas.hidden = true; button.hidden = true; }
  } else { art.classList.add('is-paused'); canvas.hidden = true; button.hidden = true; }

  function initialize(gl) {
    const vertex = `
      attribute vec3 a_position;
      attribute vec3 a_normal;
      attribute float a_path;
      uniform vec2 u_angles;
      uniform float u_aspect;
      varying vec3 v_normal;
      varying vec3 v_position;
      varying float v_path;
      void main() {
        float cx=cos(u_angles.x), sx=sin(u_angles.x);
        float cy=cos(u_angles.y), sy=sin(u_angles.y);
        mat3 rx=mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);
        mat3 ry=mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy);
        vec3 p=ry*rx*a_position;
        v_normal=ry*rx*a_normal;
        v_position=p;
        v_path=a_path;
        float depth=4.6-p.z;
        gl_Position=vec4(p.x*2.35/u_aspect,p.y*2.35,1.01*depth-.201,depth);
      }`;
    const fragment = `
      precision mediump float;
      varying vec3 v_normal;
      varying vec3 v_position;
      varying float v_path;
      void main() {
        vec3 n=normalize(v_normal);
        vec3 view=normalize(vec3(0.,0.,4.6)-v_position);
        vec3 key=normalize(vec3(-3.,4.,5.));
        vec3 rim=normalize(vec3(3.,.4,-1.));
        float diffuse=max(dot(n,key),0.);
        float edge=pow(1.-max(dot(n,view),0.),2.6);
        float spec=pow(max(dot(n,normalize(key+view)),0.),65.);
        float strip=pow(max(0.,sin(n.y*7.+n.x*2.)),12.)*.19;
        float tint=smoothstep(.20,.7,sin(v_path*6.283*3.));
        vec3 steel=mix(vec3(.32,.39,.51),vec3(.53,.26,.36),tint*.78);
        vec3 color=steel*(.32+diffuse*.83);
        color+=vec3(.91,.93,1.)*spec*1.15;
        color+=vec3(.72,.81,1.)*strip;
        color+=vec3(.53,.16,.27)*max(dot(n,rim),0.)*.7;
        color+=vec3(.53,.65,.94)*edge*.58;
        color=pow(color,vec3(.83));
        gl_FragColor=vec4(color,1.);
      }`;
    function shader(type, source) {
      const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('Sculpture shader unavailable');
      return s;
    }
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Sculpture unavailable');
    gl.useProgram(program);
    const normalize=v=>{const length=Math.hypot(...v);return v.map(x=>x/length);};
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const center=t=>{const r=1.04+.36*Math.cos(3*t);return [r*Math.cos(2*t),r*Math.sin(2*t),.48*Math.sin(3*t)];};
    const rows=256, sides=28, vertices=[], indices=[];
    for(let i=0;i<=rows;i++) {
      const t=i/rows*Math.PI*2, c=center(t), next=center(t+.001);
      const tangent=normalize(next.map((v,k)=>v-c[k]));
      const normal=normalize(cross(tangent,[0,0,1]));
      const binormal=normalize(cross(tangent,normal));
      for(let j=0;j<=sides;j++) {
        const angle=j/sides*Math.PI*2;
        const n=normal.map((v,k)=>v*Math.cos(angle)+binormal[k]*Math.sin(angle));
        vertices.push(...c.map((v,k)=>v+n[k]*.205),...n,i/rows);
        if(i<rows&&j<sides) {
          const a=i*(sides+1)+j,b=a+sides+1;
          indices.push(a,b,a+1,b,b+1,a+1);
        }
      }
    }
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [name,size,offset] of [['a_position',3,0],['a_normal',3,12],['a_path',1,24]]) {
      const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,28,offset);
    }
    const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    const angles=gl.getUniformLocation(program,'u_angles'), aspect=gl.getUniformLocation(program,'u_aspect');
    let frame=0,last=0,elapsed=0,visible=false,paused=false,lost=false;
    let x=.32,y=-.3,targetX=0,targetY=0,drag=null;
    art.classList.add('has-webgl');
    const active=()=>visible&&!paused&&!reduced.matches&&!document.hidden&&!lost;
    function draw() {
      if(lost)return;
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(angles,x+Math.sin(elapsed*.19)*.18,y+elapsed*.13);
      gl.uniform1f(aspect,canvas.width/canvas.height);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    }
    function render(time) {
      frame=0;if(!active())return;
      const dt=last?Math.min((time-last)/1000,.05):.016;last=time;elapsed+=dt;
      x+=(targetX+.32-x)*Math.min(dt*4,1);y+=(targetY-.3-y)*Math.min(dt*4,1);
      draw();frame=requestAnimationFrame(render);
    }
    function sync() {
      cancelAnimationFrame(frame);frame=0;last=0;
      art.classList.toggle('is-paused',!active());
      button.setAttribute('aria-pressed',String(paused));
      button.setAttribute('aria-label',paused?'Resume 3D animation':'Pause 3D animation');
      button.querySelector('span').textContent=paused?'▷':'Ⅱ';
      if(active())frame=requestAnimationFrame(render);else draw();
    }
    function resize() {
      const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75);
      canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));draw();
    }
    stage.addEventListener('pointerdown',e=>{if(paused||reduced.matches)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,rx:targetX,ry:targetY};});
    stage.addEventListener('pointermove',e=>{
      if(paused||reduced.matches)return;
      if(drag&&e.pointerId===drag.id){targetY=drag.ry+(e.clientX-drag.x)*.009;targetX=drag.rx+(e.clientY-drag.y)*.005;}
      else if(fine.matches){const r=stage.getBoundingClientRect();targetX=((e.clientY-r.top)/r.height-.5)*.45;targetY=((e.clientX-r.left)/r.width-.5)*.65;}
    });
    window.addEventListener('pointerup',()=>{drag=null;});
    window.addEventListener('pointercancel',()=>{drag=null;});
    stage.addEventListener('pointerleave',()=>{drag=null;targetX=targetY=0;});
    button.addEventListener('click',()=>{paused=!paused;sync();});
    reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);art.classList.remove('has-webgl');art.classList.add('is-paused');canvas.hidden=true;button.hidden=true;});
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
    resize();sync();
  }
}
