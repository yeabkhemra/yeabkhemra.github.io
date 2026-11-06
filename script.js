import { createSpaceScene } from './space-scene.js?v=galaxy-7';
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const spaceScene = createSpaceScene(hero);
  const canvas = hero.querySelector('.depth-particles');
  const context = canvas.getContext('2d');
  const toggle = hero.querySelector('.motion-toggle');
  const referenceVideos = hero.querySelectorAll('.reference-loop video');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  let paused = false;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let clock = 0;
  let width = 0;
  let height = 0;
  let targetX = 0;
  let targetY = 0;
  let cameraX = 0;
  let cameraY = 0;
  let drag = null;
  let blockClick = false;
  const points = Array.from({length: finePointer.matches ? 65 : 30}, () => ({
    x: (Math.random() - .5) * 1800,
    y: (Math.random() - .5) * 1200,
    z: Math.random() * 1500 + 100,
    size: Math.random() * 1.7 + .45,
    phase: Math.random() * Math.PI * 2
  }));
  const canAnimate = () => !paused && !reducedMotion.matches && visible && !document.hidden;
  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    spaceScene.resize(width, height);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function resetCamera() { targetX = 0; targetY = 0; }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  function start() {
    if (canAnimate() && !frame) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    if (!canAnimate()) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : .016;
    lastTime = time;
    clock += delta;
    cameraX += (targetX - cameraX) * Math.min(delta * 5, 1);
    cameraY += (targetY - cameraY) * Math.min(delta * 5, 1);
    const drift = Math.sin(clock * .23) * .65;
    hero.style.setProperty('--scene-rx', `${-cameraY * 4 + Math.cos(clock * .29) * .3}deg`);
    hero.style.setProperty('--scene-ry', `${cameraX * 6 + drift}deg`);
    hero.style.setProperty('--light-x', `${50 + cameraX * 23 + Math.sin(clock * .24) * 6}%`);
    hero.style.setProperty('--light-y', `${38 + cameraY * 18}%`);
    spaceScene.render(clock, cameraX, cameraY);
    if (context) {
      context.clearRect(0, 0, width, height);
      for (const p of points) {
        p.z -= delta * 42;
        if (p.z < 45) p.z = 1600;
        const scale = 500 / (500 + p.z);
        const x = width / 2 + (p.x + cameraX * 95) * scale + Math.sin(clock * .3 + p.phase) * 9;
        const y = height * .46 + (p.y + cameraY * 65) * scale;
        const alpha = Math.min((1600 - p.z) / 400, 1) * .48;
        context.beginPath();
        context.fillStyle = `rgba(${p.size > 1.6 ? '180,207,255' : '106,131,218'},${alpha})`;
        context.arc(x, y, p.size * scale, 0, Math.PI * 2);
        context.fill();
      }
    }
    start();
  }
  function syncState() {
    const freeze = paused || reducedMotion.matches || !visible || document.hidden;
    hero.classList.toggle('motion-paused', freeze);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
    toggle.querySelector('.motion-label').textContent = paused ? 'RESUME MOTION' : 'PAUSE MOTION';
    toggle.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    for (const referenceVideo of referenceVideos) {
      if (freeze) referenceVideo.pause();
      else {
        const playback = referenceVideo.play();
        if (playback?.catch) playback.catch(() => {});
      }
    }
    if (freeze) stop(); else start();
  }
  hero.addEventListener('pointermove', event => {
    if (paused || reducedMotion.matches) return;
    if (drag && drag.id === event.pointerId) {
      const distance = event.clientX - drag.x;
      if (Math.abs(distance) > 9) drag.moved = true;
      targetX = Math.max(-1.4, Math.min(1.4, drag.startX + distance / (width * .28)));
      targetY = Math.max(-.7, Math.min(.7, (event.clientY - drag.y) / (height * .5)));
    } else if (finePointer.matches) {
      const bounds = hero.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    }
  });
  hero.addEventListener('pointerdown', event => {
    if (event.target.closest('a,button') || reducedMotion.matches || paused) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, startX:targetX, moved:false};
  });
  function endDrag() {
    if (drag?.moved) { blockClick = true; setTimeout(() => {blockClick = false;}, 0); }
    drag = null;
    if (!finePointer.matches) resetCamera();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  hero.addEventListener('click', event => { if (blockClick) { event.preventDefault(); event.stopPropagation(); } }, true);
  hero.addEventListener('pointerleave', () => { if (!drag) resetCamera(); });
  toggle.addEventListener('click', () => { paused = !paused; resetCamera(); syncState(); });
  reducedMotion.addEventListener('change', () => { resetCamera(); syncState(); });
  document.addEventListener('visibilitychange', syncState);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncState(); }, {threshold:0}).observe(hero);
  resize();
  syncState();
})();

// Copy only the visible email address, with accessible success/error feedback.
(() => {
  const button = document.querySelector('.copy-email');
  const email = document.querySelector('.email-address');
  const status = document.querySelector('.copy-status');
  if (!button || !email || !status) return;
  let feedbackTimer;
  button.addEventListener('click', async () => {
    clearTimeout(feedbackTimer);
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(email.textContent.trim());
      button.querySelector('span').textContent = 'COPIED!';
      status.textContent = 'Email address copied.';
    } catch {
      button.querySelector('span').textContent = 'COPY EMAIL';
      status.textContent = 'Select the email address and copy it manually.';
    } finally {
      button.disabled = false;
    }
    feedbackTimer = setTimeout(() => {
      button.querySelector('span').textContent = 'COPY EMAIL';
      status.textContent = '';
    }, 4000);
  });
})();

// Load the user's YouTube soundtrack only after an explicit play action.
(() => {
  const widget = document.querySelector('.site-music');
  if (!widget) return;
  const button = widget.querySelector('.music-toggle');
  const panel = widget.querySelector('.music-panel');
  const frame = widget.querySelector('.music-frame');
  const close = widget.querySelector('.music-close');
  const status = widget.querySelector('.music-status');
  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? 'STOP MUSIC' : 'PLAY MUSIC';
    widget.classList.toggle('music-active', open);
    if (open) {
      frame.src = 'https://www.youtube-nocookie.com/embed/q_BCyHd0vhA?autoplay=1&loop=1&playlist=q_BCyHd0vhA&playsinline=1&rel=0';
      status.textContent = 'Music player opened. Use the YouTube controls to play or pause.';
    } else {
      frame.removeAttribute('src');
      status.textContent = 'Music stopped.';
    }
  }
  button.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => { setOpen(false); button.focus(); });
  widget.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { setOpen(false); button.focus(); }
  });
})();
