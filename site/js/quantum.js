/* ============================================================
   The Quantum Field entrance — spinning vortex edition.
   A purple-and-gold galaxy spins continuously behind elegant
   word labels and gold scrollwork. On "Enter the Site" the
   vortex accelerates, the stars draw inward and assemble into
   Viveka's phoenix mark (real logo colors), then bloom into
   the site. Plays once per session; skippable; reduced-motion safe.
   ============================================================ */

(function () {
  var entrance = document.getElementById('entrance');
  if (!entrance) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = sessionStorage.getItem('vvr-entered');
  if (seen || reduced) {
    entrance.remove();
    document.body.classList.remove('entrance-active');
    return;
  }
  document.body.classList.add('entrance-active');

  var canvas = document.getElementById('quantum-canvas');
  var ctx = canvas.getContext('2d');
  var W, H, DPR, cx, cy, R;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H * 0.48;
    R = Math.min(W, H) * 0.46;        // outer radius of the galaxy
  }
  resize();
  window.addEventListener('resize', resize);

  var GOLD = '223,178,74';
  var GOLD_HI = '247,224,150';
  var LAVENDER = '196,186,220';
  var WHITE = '255,250,240';
  var PURPLE = '150,90,200';

  var INNER = 0.30;                   // dark eye, fraction of R
  var SQUISH = 0.82;                  // vertical squish → ellipse
  var ARMS = 2;
  var TIGHT = 2.6;                    // spiral arm tightness

  // ---- enter timeline (ms) ----
  var SPINUP_MS = 1000;
  var PHX_IN_MS = 800;
  var PHX_HOLD_MS = 1500;
  var BLOOM_MS = 900;

  var N = Math.min(2200, Math.max(900, Math.floor((W * H) / 950)));
  var particles = [];

  // real phoenix logo for the assemble-on-enter payoff
  var phoenixImg = new Image();
  var phoenixReady = false;
  phoenixImg.onload = function () { phoenixReady = true; };
  phoenixImg.src = 'images/phoenix-mark.png';

  function rand(a, b) { return a + Math.random() * (b - a); }

  for (var i = 0; i < N; i++) {
    var onArm = Math.random() < 0.45;
    var rr = INNER + Math.pow(Math.random(), 0.65) * (1 - INNER);  // bias outward a touch
    var baseR = rr * R;
    var ang;
    if (onArm) {
      var arm = i % ARMS;
      ang = arm * (Math.PI * 2 / ARMS) + TIGHT * Math.log(baseR / (INNER * R)) + rand(-0.16, 0.16);
    } else {
      ang = Math.random() * Math.PI * 2;   // diffuse haze
    }
    var streak = onArm && Math.random() < 0.5;
    particles.push({
      baseR: baseR, ang: ang, onArm: onArm, streak: streak,
      // inner particles orbit faster (differential rotation)
      omega: (1.0 + (1 - rr) * 1.4),
      r: baseR,
      size: onArm ? rand(0.7, 2.1) : rand(0.4, 1.2),
      color: onArm ? (Math.random() < 0.78 ? GOLD : GOLD_HI)
                   : (Math.random() < 0.5 ? PURPLE : (Math.random() < 0.6 ? LAVENDER : WHITE)),
      a: onArm ? rand(0.5, 0.95) : rand(0.18, 0.5),
      tw: Math.random() * Math.PI * 2,
      twSpeed: rand(0.001, 0.004),
      tx: null, ty: null, phxColor: null
    });
  }

  function phoenixTargets() {
    if (!phoenixReady) return [];
    var iw = phoenixImg.naturalWidth, ih = phoenixImg.naturalHeight;
    var scale = Math.min((H * 0.64) / ih, (W * 0.72) / iw);
    var dw = Math.round(iw * scale), dh = Math.round(ih * scale);
    var off = document.createElement('canvas');
    off.width = dw; off.height = dh;
    var o = off.getContext('2d');
    o.drawImage(phoenixImg, 0, 0, dw, dh);
    var data = o.getImageData(0, 0, dw, dh).data;
    var pts = [], step = 4;
    var ox = (W - dw) / 2, oy = cy - dh / 2;
    for (var y = 0; y < dh; y += step) {
      for (var x = 0; x < dw; x += step) {
        var idx = (y * dw + x) * 4;
        if (data[idx + 3] > 130) {
          pts.push({ x: x + ox, y: y + oy, color: data[idx] + ',' + data[idx + 1] + ',' + data[idx + 2] });
        }
      }
    }
    return pts;
  }

  function assignPhoenix() {
    var pts = phoenixTargets();
    if (!pts.length) return false;
    for (var i = 0; i < particles.length; i++) {
      var t = pts[Math.floor(i / particles.length * pts.length)];
      particles[i].tx = t.x; particles[i].ty = t.y; particles[i].phxColor = t.color;
    }
    return true;
  }

  var mode = 'idle';            // idle | enter
  var spin = 0;                 // accumulated rotation
  var enterStart = 0;
  var destination = '';
  var last = performance.now();
  var haveP = false;

  function frame(now) {
    var dt = now - last; last = now;
    if (dt > 60) dt = 60;

    // rotation speed: gentle idle, accelerating during spin-up
    var omegaBase = 0.00020;     // rad/ms idle
    var phase = '', pt = 0;
    if (mode === 'enter') {
      var e = now - enterStart;
      if (e < SPINUP_MS) { phase = 'spinup'; pt = e / SPINUP_MS; omegaBase = 0.00020 + pt * 0.0016; }
      else if (e < SPINUP_MS + PHX_IN_MS) { phase = 'phxin'; pt = (e - SPINUP_MS) / PHX_IN_MS; omegaBase = 0.0006; }
      else if (e < SPINUP_MS + PHX_IN_MS + PHX_HOLD_MS) { phase = 'phxhold'; }
      else { phase = 'bloom'; pt = (e - SPINUP_MS - PHX_IN_MS - PHX_HOLD_MS) / BLOOM_MS; }
    }
    spin += omegaBase * dt;

    // ---- background: dark eye → purple → deep edge ----
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createRadialGradient(cx, cy, R * INNER * 0.3, cx, cy, R * 1.25);
    bg.addColorStop(0, '#160826');
    bg.addColorStop(0.42, '#2a1048');
    bg.addColorStop(1, '#120620');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // soft purple core glow
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    glow.addColorStop(0, 'rgba(60,22,96,0)');
    glow.addColorStop(0.7, 'rgba(123,59,173,0.10)');
    glow.addColorStop(1, 'rgba(123,59,173,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    var shrink = 1, bloom = 0;
    if (phase === 'spinup') shrink = 1 - pt * 0.25;
    else if (phase === 'phxin' || phase === 'phxhold' || phase === 'bloom') shrink = 0.7;
    if (phase === 'bloom') bloom = Math.min(1, pt);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.tw += p.twSpeed * dt;
      var px, py, alpha = p.a, col = p.color, sz = p.size;

      if (phase === 'phxin' || phase === 'phxhold' || phase === 'bloom') {
        // lerp toward the phoenix mark, then hold
        var k = phase === 'phxin' ? 0.16 : 0.30;
        if (p.tx !== null) {
          p.cxp = (p.cxp == null ? (cx + p.r * Math.cos(p.ang)) : p.cxp);
        }
        var curx = (p._x == null) ? cx : p._x, cury = (p._y == null) ? cy : p._y;
        px = curx + (p.tx - curx) * k;
        py = cury + (p.ty - cury) * k;
        col = p.phxColor || p.color;
        alpha = Math.min(1, 0.7 + 0.3);
        sz = Math.max(p.size, 1.4);
      } else {
        var a = p.ang + spin * p.omega;
        var r = p.baseR * shrink;
        px = cx + r * Math.cos(a);
        py = cy + r * Math.sin(a) * SQUISH;
        alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
      }
      p._x = px; p._y = py;

      if (p.streak && phase !== 'bloom' && phase !== 'phxhold' && phase !== 'phxin') {
        // silky tangential filament along the arm
        var ta = p.ang + spin * p.omega + Math.PI / 2;
        var len = sz * 6 * (1 + p.baseR / R);
        ctx.strokeStyle = 'rgba(' + col + ',' + alpha * 0.7 + ')';
        ctx.lineWidth = sz * 0.9;
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(ta) * len, py - Math.sin(ta) * len * SQUISH);
        ctx.lineTo(px + Math.cos(ta) * len, py + Math.sin(ta) * len * SQUISH);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + col + ',' + alpha + ')';
      if (sz > 1.6) { ctx.shadowColor = 'rgba(' + col + ',0.9)'; ctx.shadowBlur = 6; }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (phase === 'bloom') {
      ctx.fillStyle = 'rgba(250,246,238,' + bloom + ')';
      ctx.fillRect(0, 0, W, H);
      if (pt >= 1) { finish(); return; }
    }

    raf = requestAnimationFrame(frame);
  }
  var raf = requestAnimationFrame(frame);

  function enter(dest) {
    if (mode === 'enter') return;
    destination = dest || '';
    mode = 'enter';
    enterStart = performance.now();
    haveP = assignPhoenix();
    entrance.classList.add('entering');
  }

  function finish() {
    cancelAnimationFrame(raf);
    sessionStorage.setItem('vvr-entered', '1');
    if (destination) { window.location.href = destination; return; }
    entrance.classList.add('closing');
    document.body.classList.remove('entrance-active');
    setTimeout(function () { entrance.remove(); }, 1100);
  }

  document.querySelectorAll('#enter-btn, #enter-browse').forEach(function (btn) {
    btn.addEventListener('click', function () { enter(btn.getAttribute('data-dest')); });
  });
  document.getElementById('skip-entrance').addEventListener('click', function () {
    sessionStorage.setItem('vvr-entered', '1');
    entrance.classList.add('closing');
    document.body.classList.remove('entrance-active');
    setTimeout(function () { entrance.remove(); }, 500);
  });
})();
