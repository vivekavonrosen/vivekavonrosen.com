/* ============================================================
   The Quantum Field entrance — phoenix edition.
   A purple starry night with teal speckles and nebula glow.
   Stars gather to form the technologies Viveka teaches. On
   click, the stars assemble into her phoenix mark, hold, then
   collapse into a slow vortex while the technologies appear
   one or two at a time — readable — before each is drawn in.
   Plays once per session; skippable; honors reduced motion.
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
  var W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var WORDS = ['VIOS', 'AI', 'CLAUDE', 'LOVABLE', 'LINKEDIN', 'SUBSTACK', 'WTIC'];
  var GOLD = '223,178,74';
  var LAVENDER = '196,186,220';
  var WHITE = '255,250,240';
  var TEAL = '110,205,218';
  var BIRD_COLORS = ['123,59,173', '44,151,175', LAVENDER, WHITE, GOLD];

  // ---- timeline (ms) ----
  var PHX_MS = 3200;                    // phoenix forms and holds
  var WORD_SPACING = 1500;              // a new pair every 1.5s
  var WORD_LIFE = 2100;                 // each word: fade in, hold, get drawn in
  var PAIRS = Math.ceil(WORDS.length / 2);
  var WORDS_MS = (PAIRS - 1) * WORD_SPACING + WORD_LIFE;
  var COLLAPSE_MS = 1300;               // final pull + bloom

  var N = Math.min(2100, Math.max(900, Math.floor((W * H) / 1100)));
  var particles = [];

  // preload the real phoenix logo so the entrance can assemble it pixel-accurate
  var phoenixImg = new Image();
  var phoenixReady = false;
  phoenixImg.onload = function () { phoenixReady = true; };
  phoenixImg.src = 'images/phoenix-mark.png';
  var mouse = { x: -9999, y: -9999 };
  var mode = 'drift';                   // drift | word | phoenix | vortex
  var wordIndex = 0;
  var modeTimer = 0;
  var phoenixStart = 0, vortexStart = 0;
  var destination = '';

  var nebulae = [
    { x: 0.28, y: 0.30, r: 0.55, c: '87,31,129',  a: 0.20 },
    { x: 0.78, y: 0.62, r: 0.50, c: '62,22,96',   a: 0.22 },
    { x: 0.55, y: 0.15, r: 0.40, c: '44,40,120',  a: 0.14 },
    { x: 0.15, y: 0.80, r: 0.45, c: '123,59,173', a: 0.12 }
  ];

  for (var i = 0; i < N; i++) {
    var big = Math.random() < 0.05;
    var tint = Math.random();
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: big ? Math.random() * 1.4 + 1.8 : Math.random() * 1.2 + 0.5,
      big: big,
      tx: null, ty: null,
      color: tint < 0.45 ? GOLD : (tint < 0.62 ? TEAL : (tint < 0.88 ? LAVENDER : WHITE)),
      phxColor: null,
      tw: Math.random() * Math.PI * 2,
      twSpeed: 0.015 + Math.random() * 0.03,
      a: Math.random() * 0.45 + 0.35
    });
  }

  /* ---- sample Viveka's actual phoenix logo into particle targets,
     carrying each pixel's real gradient color so the stars assemble
     the true purple-blue-gold mark. Falls back to a drawn silhouette
     if the image hasn't loaded yet. ---- */
  function phoenixTargets() {
    if (!phoenixReady) return phoenixTargetsFallback();
    var iw = phoenixImg.naturalWidth, ih = phoenixImg.naturalHeight;
    var scale = Math.min((H * 0.64) / ih, (W * 0.72) / iw);
    var dw = Math.round(iw * scale), dh = Math.round(ih * scale);
    var off = document.createElement('canvas');
    off.width = dw; off.height = dh;
    var o = off.getContext('2d');
    o.drawImage(phoenixImg, 0, 0, dw, dh);
    var data = o.getImageData(0, 0, dw, dh).data;
    var pts = [];
    var step = 4;
    var ox = (W - dw) / 2, oy = (H - dh) / 2 - H * 0.02;
    for (var y = 0; y < dh; y += step) {
      for (var x = 0; x < dw; x += step) {
        var idx = (y * dw + x) * 4;
        if (data[idx + 3] > 130) {
          pts.push({
            x: x + ox, y: y + oy,
            color: data[idx] + ',' + data[idx + 1] + ',' + data[idx + 2]
          });
        }
      }
    }
    return pts;
  }

  // drawn-silhouette fallback (only used if the logo png is slow to load)
  function phoenixTargetsFallback() {
    var vw = 880, vh = 1160;
    var s = Math.min((H * 0.60) / vh, (W * 0.70) / vw);
    var off = document.createElement('canvas');
    off.width = Math.ceil(vw * s); off.height = Math.ceil(vh * s);
    var o = off.getContext('2d');
    o.scale(s, s);
    o.strokeStyle = '#f00'; o.lineWidth = 52;
    o.beginPath(); o.arc(520, 560, 330, -2.55, 2.05); o.stroke();
    o.fillStyle = '#00f';
    var paths = [
      'M560,400 C600,420 592,472 566,524 C540,582 502,652 472,702 C456,728 440,742 430,736 C444,660 460,560 480,480 C494,430 528,394 560,400 Z',
      'M560,398 L600,418 L562,432 Z',
      'M500,470 C380,330 220,180 60,56 C140,220 280,362 432,472 Z',
      'M482,502 C360,420 200,330 88,288 C190,420 342,512 452,542 Z',
      'M470,542 C380,520 278,520 208,560 C300,612 402,612 462,582 Z',
      'M440,720 C400,820 350,940 278,1042 C360,980 422,880 456,780 Z',
      'M456,760 C440,860 410,962 368,1062 C430,990 472,890 482,800 Z',
      'M472,792 C482,892 472,992 450,1092 C502,1002 512,892 502,812 Z'
    ];
    for (var p = 0; p < paths.length; p++) o.fill(new Path2D(paths[p]));
    var data = o.getImageData(0, 0, off.width, off.height).data;
    var pts = [], step = 4;
    var ox = (W - off.width) / 2, oy = (H - off.height) / 2 - H * 0.03;
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        var idx = (y * off.width + x) * 4;
        if (data[idx + 3] > 128) {
          pts.push({ x: x + ox, y: y + oy, color: data[idx] > 128 ? GOLD : BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)] });
        }
      }
    }
    return pts;
  }

  /* Star-words form ABOVE the name (upper area) so they read clearly —
     fit to 72% width OR ~17% viewport height, whichever comes first. */
  function wordTargets(word) {
    var off = document.createElement('canvas');
    off.width = W; off.height = Math.round(H * 0.34);
    var octx = off.getContext('2d');
    var fontSize = H * 0.17;
    octx.font = fontSize + 'px "Bebas Neue", sans-serif';
    var maxW = W * 0.72;
    var measured = octx.measureText(word).width;
    if (measured > maxW) {
      fontSize = fontSize * maxW / measured;
      octx.font = fontSize + 'px "Bebas Neue", sans-serif';
    }
    octx.fillStyle = '#fff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(word, off.width / 2, off.height / 2);
    var data = octx.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    var step = 4;
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 128) {
          pts.push({ x: x, y: y + H * 0.20 - off.height / 2 });
        }
      }
    }
    return pts;
  }

  function assignWord(word) {
    var pts = wordTargets(word);
    if (!pts.length) return;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var t = pts[Math.floor(Math.random() * pts.length)];
      p.tx = t.x; p.ty = t.y;
    }
  }

  function assignPhoenix() {
    var pts = phoenixTargets();
    if (!pts.length) return;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // stride through the mark so stars cover it evenly, carrying real color
      var t = pts[Math.floor(i / particles.length * pts.length)];
      p.tx = t.x; p.ty = t.y;
      p.phxColor = t.color || GOLD;
    }
  }

  function releaseTargets() {
    particles.forEach(function (p) {
      p.tx = null; p.ty = null;
      p.vx = (Math.random() - 0.5) * 0.7;
      p.vy = (Math.random() - 0.5) * 0.7;
    });
  }

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
  });

  var last = performance.now();

  function drawStar(p, alpha, color) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.fill();
    if (p.big) {
      var len = p.r * 4 * (0.7 + 0.3 * Math.sin(p.tw));
      ctx.strokeStyle = 'rgba(' + color + ',' + alpha * 0.55 + ')';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x - len, p.y); ctx.lineTo(p.x + len, p.y);
      ctx.moveTo(p.x, p.y - len); ctx.lineTo(p.x, p.y + len);
      ctx.stroke();
    }
  }

  /* One word's journey: fade in at its post, hold readable,
     then spiral into the center and vanish. */
  function drawFlyWord(word, t, slot) {
    // t: 0..1 across WORD_LIFE
    var holdEnd = 0.45;
    var baseAng = slot * 2.4 + 0.6;
    var R0 = Math.min(W, H) * 0.30;
    var x, y, size, alpha;
    if (t < holdEnd) {
      var fadeIn = Math.min(1, t / 0.12);
      x = W / 2 + Math.cos(baseAng) * R0;
      y = H / 2 + Math.sin(baseAng) * R0 * 0.8;
      size = 34;
      alpha = fadeIn;
    } else {
      var u = (t - holdEnd) / (1 - holdEnd);    // 0..1 suck-in
      var ease = u * u;
      var ang = baseAng + ease * 2.2;
      var rad = R0 * (1 - ease);
      x = W / 2 + Math.cos(ang) * rad;
      y = H / 2 + Math.sin(ang) * rad * 0.8;
      size = 34 * (1 - ease * 0.75);
      alpha = 1 - ease;
    }
    ctx.save();
    ctx.globalAlpha = alpha * 0.95;
    ctx.fillStyle = '#EFD9A0';
    ctx.shadowColor = 'rgba(223,178,74,.8)';
    ctx.shadowBlur = 16;
    ctx.font = size + 'px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, x, y);
    ctx.restore();
  }

  function frame(now) {
    var dt = Math.min((now - last) / 16.7, 3);
    last = now;
    modeTimer += dt * 16.7;

    if (mode === 'drift' && modeTimer > 500) {
      if (wordIndex >= WORDS.length) {
        // shown every word once — now settle onto the phoenix and rest there
        mode = 'rest';
        assignPhoenix();
      } else {
        mode = 'word';
        modeTimer = 0;
        assignWord(WORDS[wordIndex]);
        wordIndex++;
      }
    } else if (mode === 'word' && modeTimer > 2500) {
      mode = 'drift';
      modeTimer = 0;
      releaseTargets();
    }

    // transparent — the gold scrollwork backdrop (CSS) shows through
    ctx.clearRect(0, 0, W, H);

    for (var n = 0; n < nebulae.length; n++) {
      var nb = nebulae[n];
      var ng = ctx.createRadialGradient(nb.x * W, nb.y * H, 0, nb.x * W, nb.y * H, nb.r * Math.max(W, H));
      ng.addColorStop(0, 'rgba(' + nb.c + ',' + nb.a + ')');
      ng.addColorStop(1, 'rgba(' + nb.c + ',0)');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    }

    var elapsed = 0, collapseT = 0;
    if (mode === 'vortex') {
      elapsed = now - vortexStart;
      collapseT = Math.max(0, (elapsed - WORDS_MS) / COLLAPSE_MS);   // 0 → 1 in the finale
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.tw += p.twSpeed * dt;

      if (mode === 'vortex') {
        var dx = W / 2 - p.x, dy = H / 2 - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // a slow ambient swirl while the words play, then the real pull
        var pull = (0.004 + collapseT * 0.22) * dt;
        var swirl = (0.016 + collapseT * 0.06) * dt;
        p.x += dx * pull + (-dy / dist) * swirl * dist;
        p.y += dy * pull + (dx / dist) * swirl * dist;
      } else if (p.tx !== null) {
        var phx = (mode === 'phoenix' || mode === 'rest');
        var k = phx ? 0.17 : 0.06;
        var ddx = p.tx - p.x, ddy = p.ty - p.y;
        if (phx && ddx * ddx + ddy * ddy < 4) {
          p.x = p.tx; p.y = p.ty;        // snap home so the bird reads crisply
        } else {
          p.x += ddx * k * dt;
          p.y += ddy * k * dt;
        }
      } else {
        var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 160 && md > 20) {
          p.vx += (mdx / md) * 0.010 * dt;
          p.vy += (mdy / md) * 0.010 * dt;
        }
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }

      var alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
      var color = p.color;
      if ((mode === 'phoenix' || mode === 'rest') && p.phxColor) {
        alpha = Math.min(1, alpha + 0.35);
        color = p.phxColor;
      } else if (mode === 'vortex') {
        alpha = Math.min(1, alpha + 0.2 + collapseT * 0.5);
        if (p.phxColor) color = p.phxColor;
      }
      drawStar(p, alpha, color);
    }

    if (mode === 'phoenix') {
      if (now - phoenixStart >= PHX_MS) {
        mode = 'vortex';
        vortexStart = now;
        releaseTargets();
      }
    }

    if (mode === 'vortex') {
      // technologies surface one pair at a time, readable, then get drawn in
      for (var w = 0; w < WORDS.length; w++) {
        var startAt = Math.floor(w / 2) * WORD_SPACING;
        var t = (elapsed - startAt) / WORD_LIFE;
        if (t > 0 && t < 1) drawFlyWord(WORDS[w], t, w);
      }
      // bloom
      if (collapseT > 0.55) {
        var bloom = (collapseT - 0.55) / 0.45;
        ctx.fillStyle = 'rgba(250,246,238,' + Math.min(1, bloom) + ')';
        ctx.fillRect(0, 0, W, H);
      }
      if (collapseT >= 1) { finish(); return; }
    }

    raf = requestAnimationFrame(frame);
  }

  var raf = requestAnimationFrame(frame);

  function enter(dest) {
    if (mode === 'vortex') return;
    destination = dest || '';
    assignPhoenix();               // ensure phoenix colors for the exit swirl
    mode = 'vortex';
    vortexStart = performance.now();
    entrance.classList.add('entering');
  }

  function finish() {
    cancelAnimationFrame(raf);
    sessionStorage.setItem('vvr-entered', '1');
    if (destination) {
      window.location.href = destination;
      return;
    }
    entrance.classList.add('closing');
    document.body.classList.remove('entrance-active');
    setTimeout(function () { entrance.remove(); }, 1300);
  }

  document.querySelectorAll('#enter-btn, #enter-browse').forEach(function (btn) {
    btn.addEventListener('click', function () { enter(btn.getAttribute('data-dest')); });
  });

  // debug handle (harmless in production)
  window.__vvr = {
    state: function () {
      var p = particles[0], q = particles[Math.floor(particles.length / 2)];
      return {
        mode: mode, n: particles.length,
        p0: { x: Math.round(p.x), y: Math.round(p.y), tx: p.tx === null ? null : Math.round(p.tx), ty: p.ty === null ? null : Math.round(p.ty) },
        pMid: { x: Math.round(q.x), y: Math.round(q.y), tx: q.tx === null ? null : Math.round(q.tx), ty: q.ty === null ? null : Math.round(q.ty) }
      };
    }
  };
  document.getElementById('skip-entrance').addEventListener('click', function () {
    sessionStorage.setItem('vvr-entered', '1');
    entrance.classList.add('closing');
    document.body.classList.remove('entrance-active');
    setTimeout(function () { entrance.remove(); }, 600);
  });
})();
