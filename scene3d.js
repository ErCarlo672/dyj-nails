/* D&J Style — Hero 3D: glass polish bottle + floating nails (Three.js r158, global build) */
(function () {
  'use strict';
  window.__DYJ__ = window.__DYJ__ || {};

  var canvas = document.getElementById('scene');
  if (!canvas || typeof THREE === 'undefined') { document.documentElement.classList.add('no-webgl'); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { document.documentElement.classList.add('no-webgl'); return; }

  var isMobile = window.matchMedia('(max-width: 860px)').matches;
  var maxDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75), dpr = maxDpr;
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ---------- Studio environment (softboxes) for chrome & glass reflections ---------- */
  (function buildEnv() {
    var env = new THREE.Scene();
    var room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x3a2a33, side: THREE.BackSide }));
    env.add(room);
    function box(w, h, color, k, pos, rot) {
      var m = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
      m.color.multiplyScalar(k);
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(pos[0], pos[1], pos[2]);
      p.lookAt(0, 0, 0);
      if (rot) p.rotation.z += rot;
      env.add(p);
    }
    box(14, 4, 0xffffff, 4.0, [0, 12, 4]);          // top key
    box(3, 16, 0xffffff, 2.6, [-12, 0, 4]);          // left strip
    box(4, 14, 0xff3d8b, 3.2, [12, 0, -2]);          // pink LED (like the shop)
    box(10, 3, 0x7b3fe4, 2.2, [0, -10, -6]);         // violet floor bounce
    box(6, 6, 0xffffff, 1.6, [6, 4, 12]);            // front fill
    box(5, 10, 0xffffff, 2.2, [-7, 2, 10]);          // front-left strip
    box(16, 2, 0xffffff, 1.2, [0, -3, 14]);          // low front bounce
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, 0.035).texture;
    pmrem.dispose();
  })();

  /* ---------- Helpers ---------- */
  function smoothProfile(pts, n) {
    var curve = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], 0); }), false, 'centripetal');
    return curve.getPoints(n).map(function (v) { return new THREE.Vector2(Math.max(0, v.x), v.y); });
  }

  /* ---------- Bottle ---------- */
  var activeColor = new THREE.Color('#ff3d8b');
  var targetColor = activeColor.clone();
  var targetMetal = 0, targetRough = 0.18;

  var bottle = new THREE.Group();
  scene.add(bottle);

  var glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.6, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, specularIntensity: 1
  });
  var glass = new THREE.Mesh(new THREE.LatheGeometry(smoothProfile([
    [0, -1.02], [0.8, -1.02], [0.98, -0.94], [1.04, -0.72], [1.04, 0.42], [0.98, 0.66], [0.78, 0.84], [0.42, 0.95], [0.34, 1.0], [0.34, 1.16], [0.0, 1.16]
  ], 70), 64), glassMat);
  bottle.add(glass);

  var liquidMat = new THREE.MeshPhysicalMaterial({
    color: activeColor.clone(), metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 1.2
  });
  var liqPts = smoothProfile([[0, -0.93], [0.76, -0.93], [0.92, -0.84], [0.95, -0.66], [0.95, 0.44]], 50);
  liqPts.push(new THREE.Vector2(0.0, 0.44));
  var liquid = new THREE.Mesh(new THREE.LatheGeometry(liqPts, 64), liquidMat);
  bottle.add(liquid);

  var chromeMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f6, metalness: 1, roughness: 0.12, clearcoat: 1, envMapIntensity: 2.2 });
  var cap = new THREE.Mesh(new THREE.LatheGeometry(smoothProfile([
    [0, 1.1], [0.37, 1.1], [0.4, 1.16], [0.4, 2.5], [0.37, 2.6], [0.28, 2.66], [0, 2.67]
  ], 44), 64), chromeMat);
  bottle.add(cap);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.025, 10, 64), new THREE.MeshPhysicalMaterial({ color: 0xff3d8b, metalness: 0.6, roughness: 0.25, emissive: 0xff3d8b, emissiveIntensity: 0.6 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.24;
  bottle.add(ring);

  // engraved-ish label: a thin chrome band with the monogram drawn on canvas
  (function label() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    var g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 256);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = 'italic 600 120px "Bodoni Moda", Didot, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('D&J', 512, 112);
    g.font = '600 34px Manrope, sans-serif';
    g.fillText('S T Y L E', 512, 200);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    var m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.FrontSide });
    var band = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.75, 48, 1, true, -Math.PI / 2, Math.PI), m);
    band.position.y = -0.18;
    bottle.add(band);
  })();

  // soft contact shadow
  (function shadow() {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,61,139,0.55)'); gr.addColorStop(0.4, 'rgba(255,61,139,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    var s = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.rotation.x = -Math.PI / 2; s.position.y = -1.08;
    bottle.add(s);
  })();

  /* ---------- Nails ---------- */
  function nailGeometry() {
    var s = new THREE.Shape();
    s.moveTo(-0.25, 0);
    s.bezierCurveTo(-0.28, 0.48, -0.13, 0.86, 0, 0.98);
    s.bezierCurveTo(0.13, 0.86, 0.28, 0.48, 0.25, 0);
    s.quadraticCurveTo(0, -0.09, -0.25, 0);
    var g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.028, bevelSize: 0.028, bevelSegments: 3, curveSegments: 20 });
    var p = g.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i);
      p.setZ(i, p.getZ(i) - x * x * 1.5 - (y * y) * 0.12); // C-curve + slight length arch
    }
    g.computeVertexNormals();
    g.center();
    return g;
  }
  var nailGeo = nailGeometry();
  var activeNailMat = new THREE.MeshPhysicalMaterial({ color: activeColor.clone(), roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 });
  var palette = [
    activeNailMat,
    new THREE.MeshPhysicalMaterial({ color: 0xe9c1b3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04 }),                                   // nude
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [200, 800] }), // chrome aurora
    activeNailMat,
    new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02 }),                                   // black laca
    new THREE.MeshPhysicalMaterial({ color: 0xfbeef2, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color(0xff9ec4), iridescence: 0.6, clearcoat: 1 }) // pearl
  ];

  var floaters = new THREE.Group();
  scene.add(floaters);
  var items = [];
  var NAILS = isMobile ? 9 : 14;
  for (var n = 0; n < NAILS; n++) {
    var mesh = new THREE.Mesh(nailGeo, palette[n % palette.length]);
    var a = (n / NAILS) * Math.PI * 2 + Math.random() * 0.3;
    var r = 1.9 + Math.random() * 1.1;
    mesh.userData = {
      a: a, r: r, y: (Math.random() - 0.5) * 3.0, speed: 0.05 + Math.random() * 0.06,
      bob: 0.3 + Math.random() * 0.5, phase: Math.random() * 10,
      rs: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6)
    };
    var sc = 0.5 + Math.random() * 0.38;
    mesh.scale.setScalar(sc);
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    floaters.add(mesh); items.push(mesh);
  }
  // pearls
  var pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xfff6f8, roughness: 0.18, metalness: 0.1, iridescence: 1, iridescenceIOR: 1.25, sheen: 1, sheenColor: new THREE.Color(0xffc2da), clearcoat: 1 });
  var pearlGeo = new THREE.SphereGeometry(1, 24, 16);
  for (var k = 0; k < (isMobile ? 6 : 12); k++) {
    var pm = new THREE.Mesh(pearlGeo, k % 4 === 0 ? chromeMat : pearlMat);
    pm.scale.setScalar(0.06 + Math.random() * 0.1);
    pm.userData = { a: Math.random() * 6.28, r: 1.5 + Math.random() * 1.4, y: (Math.random() - 0.5) * 3.2, speed: 0.08 + Math.random() * 0.1, bob: 0.2 + Math.random() * 0.4, phase: Math.random() * 10, rs: new THREE.Vector3() };
    floaters.add(pm); items.push(pm);
  }

  /* ---------- Layout ---------- */
  var anchor = new THREE.Vector3();
  var baseScale = 1, portrait = false;
  function layout() {
    var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    portrait = camera.aspect < 0.95;
    if (portrait) { var H = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); var vh = window.innerHeight || h; baseScale = Math.min(0.6, 0.3 * vh / h * 2 * H / 3.7); anchor.set(0, H * (1 - 2 * (0.15 * vh) / h) - 0.82 * baseScale, 0); }
    else { anchor.set(Math.min(2.7, 1.25 * camera.aspect + 0.55), -0.15, 0); baseScale = camera.aspect > 1.6 ? 1.05 : 0.72; }
    floaters.position.copy(anchor);
    floaters.scale.setScalar(portrait ? 0.5 : (camera.aspect > 1.6 ? 1 : 0.78));
  }
  layout();
  var lt; window.addEventListener('resize', function () { clearTimeout(lt); lt = setTimeout(layout, 100); });

  /* ---------- Interaction ---------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  var spin = 0, spinVel = 0, dragging = false, lastX = 0;
  canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; });
  window.addEventListener('pointerup', function () { dragging = false; });
  window.addEventListener('pointercancel', function () { dragging = false; });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    spinVel += (e.clientX - lastX) * 0.0025; lastX = e.clientX;
  }, { passive: true });

  window.__DYJ__.setColor = function (hex) {
    targetColor.set(hex);
    var chrome = hex.toLowerCase() === '#d9d9de';
    targetMetal = chrome ? 1 : 0;
    targetRough = chrome ? 0.06 : (hex.toLowerCase() === '#1a1a1f' ? 0.08 : 0.18);
    spinVel += 0.35; // little celebratory twirl
  };
  if (window.__DYJ__.pendingColor) { window.__DYJ__.setColor(window.__DYJ__.pendingColor); spinVel = 0; }

  /* ---------- Loop (paused when hero off-screen) ---------- */
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }
  var clock = new THREE.Clock();
  var t = 0;
  var intro = 0, perfAcc = 0, perfN = 0;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    var raw = clock.getDelta(), dt = Math.min(raw, 0.05);
    // adaptive resolution: drop DPR on slow devices, recover when smooth
    perfAcc += raw; perfN++;
    if (perfN === 45) {
      var avg = perfAcc / perfN; perfAcc = 0; perfN = 0;
      var nd = avg > 0.024 ? Math.max(0.75, dpr - 0.25) : (avg < 0.0155 ? Math.min(maxDpr, dpr + 0.25) : dpr);
      if (nd !== dpr) { dpr = nd; renderer.setPixelRatio(dpr); layout(); }
    }
    t += dt;
    intro = Math.min(1, intro + dt * 0.55);
    var ease = 1 - Math.pow(1 - intro, 3);

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    var sp = Math.min(1, (window.scrollY || 0) / (window.innerHeight || 1));

    spinVel *= 0.94; spin += spinVel + dt * 0.25;

    // colour morph
    activeNailMat.color.lerp(targetColor, 0.07);
    liquidMat.color.lerp(targetColor, 0.07);
    liquidMat.metalness += (targetMetal - liquidMat.metalness) * 0.07;
    liquidMat.roughness += (targetRough - liquidMat.roughness) * 0.07;
    activeNailMat.metalness = liquidMat.metalness;
    activeNailMat.roughness = liquidMat.roughness;
    ring.material.color.copy(liquidMat.color); ring.material.emissive.copy(liquidMat.color);

    var s = baseScale * (0.6 + 0.4 * ease);
    bottle.scale.setScalar(s);
    bottle.position.set(anchor.x, anchor.y + Math.sin(t * 0.9) * 0.08 - (1 - ease) * 1.2 + sp * 1.4, anchor.z);
    bottle.rotation.y = spin + mouse.x * 0.5;
    bottle.rotation.x = mouse.y * 0.18 + sp * 0.5;
    bottle.rotation.z = -0.12 + mouse.x * -0.06 + sp * -0.3;

    for (var i = 0; i < items.length; i++) {
      var m = items[i], u = m.userData;
      var ang = u.a + t * u.speed + sp * 1.5;
      var rad = u.r * (0.4 + 0.6 * ease) * (1 + sp * 0.6);
      m.position.set(Math.cos(ang) * rad, u.y + Math.sin(t * u.bob + u.phase) * 0.25 + sp * 1.2, Math.sin(ang) * rad * 0.7);
      m.rotation.x += u.rs.x * dt; m.rotation.y += u.rs.y * dt; m.rotation.z += u.rs.z * dt;
    }
    floaters.rotation.y = mouse.x * 0.25;
    floaters.rotation.x = mouse.y * 0.12;

    camera.position.x = mouse.x * 0.35;
    camera.position.y = -mouse.y * 0.25;
    camera.lookAt(anchor.x * 0.35, portrait ? 0 : anchor.y * 0.35, 0);

    renderer.render(scene, camera);
  }
  frame();
  requestAnimationFrame(function () { document.documentElement.classList.add('webgl-ready'); });
})();
