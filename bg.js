'use strict';
// Живой фон «чёрный минимализм»: сетка точек, которая расступается и светлеет вокруг курсора (линза),
// медленно плывущие математические знаки и редкие падающие линии. 30 кадров/с, на паузе, когда вкладка скрыта.
(() => {
  const cv = document.getElementById('bgDust');
  if (!cv) return;
  const cx = cv.getContext('2d');
  const STEP = 34, LENS = 170; // шаг сетки и радиус линзы, px
  const GLYPHS = ['π', '∫', '√x', 'Σ', 'x²', 'sin α', 'log₂', '∞', 'Δ', 'f(x)', '≈', '∠', 'eˣ', 'n!', 'ℝ', 'a⃗', 'P(A)', 'y′', '10₂', 'bin()', 'while', '%3'];
  let W = 0, H = 0, dpr = 1, glyphs = [], lines = [], nextLine = 0;
  const mouse = { x: -999, y: -999, tx: -999, ty: -999, k: 0 };
  function size() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glyphs = GLYPHS.map((g, i) => ({ g, x: Math.random() * W, y: Math.random() * H, z: .4 + Math.random() * .8, s: 12 + Math.random() * 22,
      rot: (Math.random() - .5) * .4, vr: (Math.random() - .5) * .0003, v: .04 + Math.random() * .08, ph: i }));
  }
  addEventListener('resize', size); size();
  addEventListener('pointermove', e => { mouse.tx = e.clientX; mouse.ty = e.clientY; if (mouse.x < -900) { mouse.x = mouse.tx; mouse.y = mouse.ty; } }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -999; });
  // вспышка от клика: волна по сетке
  let wave = null;
  addEventListener('pointerdown', e => { wave = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { passive: true });

  const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = -1e9;
  function frame(now) {
    if (!STILL) requestAnimationFrame(frame);
    if (document.hidden || now - last < 33) return;
    last = now;
    const on = mouse.tx > -900;
    mouse.k += ((on ? 1 : 0) - mouse.k) * .08;
    if (on) { mouse.x += (mouse.tx - mouse.x) * .12; mouse.y += (mouse.ty - mouse.y) * .12; }
    cx.clearRect(0, 0, W, H);

    // сетка точек: рядом с курсором точки отталкиваются и разгораются, по экрану бежит медленная «дыхательная» волна
    const wr = wave ? (now - wave.t) * .9 : -1;
    if (wave && wr > Math.hypot(W, H)) wave = null;
    for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) {
      const dxm = x - mouse.x, dym = y - mouse.y, d = Math.hypot(dxm, dym);
      const near = mouse.k * Math.max(0, 1 - d / LENS);
      const breath = .5 + .5 * Math.sin(now * .0007 - (x + y) * .006);
      let px = x, py = y, a = .05 + breath * .05 + near * .7, r = .8 + near * 1.6;
      if (near > 0) { const push = near * near * 18 / (d || 1); px += dxm * push; py += dym * push; }
      if (wave) { const dw = Math.abs(Math.hypot(x - wave.x, y - wave.y) - wr); if (dw < 40) { const k = (1 - dw / 40) * Math.max(0, 1 - wr / 900); a += k * .6; r += k * 1.2; } }
      cx.fillStyle = `rgba(255,255,255,${Math.min(a, .9)})`;
      cx.fillRect(px - r / 2, py - r / 2, r, r);
    }

    // знаки плывут вверх, у курсора чуть ярче
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    for (const g of glyphs) {
      g.y -= g.v * g.z; g.rot += g.vr;
      if (g.y < -40) { g.y = H + 40; g.x = Math.random() * W; }
      const x = g.x + Math.sin(now * .00025 + g.ph) * 14, d = Math.hypot(x - mouse.x, g.y - mouse.y);
      const a = .05 * g.z + mouse.k * Math.max(0, 1 - d / 260) * .25;
      cx.save(); cx.translate(x, g.y); cx.rotate(g.rot);
      cx.font = `300 ${g.s}px 'JetBrains Mono', Consolas, monospace`; cx.fillStyle = `rgba(255,255,255,${a})`; cx.fillText(g.g, 0, 0);
      cx.restore();
    }

    // редкая падающая линия по диагонали
    if (now > nextLine) { nextLine = now + 3500 + Math.random() * 6000; lines.push({ x: Math.random() * W * .8 + W * .2, y: -20, t: now, len: 90 + Math.random() * 120 }); }
    lines = lines.filter(l => now - l.t < 1400);
    for (const l of lines) {
      const p = (now - l.t) / 1400, x = l.x - p * 520, y = l.y + p * 520;
      const g = cx.createLinearGradient(x, y, x + l.len * .7, y - l.len * .7);
      g.addColorStop(0, `rgba(255,255,255,${.55 * (1 - p)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      cx.strokeStyle = g; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + l.len * .7, y - l.len * .7); cx.stroke();
    }
  }
  requestAnimationFrame(frame);
})();
