/* Khuôn bao bì Noben 3D (three.js), dùng chung cho ảnh 4K (scripts/mockup-pack.js) và khung xoay trên web (viewer3d.js).
   Kích thước bao bì cố định theo hàng thật (cm); nhãn thu đúng tỷ lệ cho vừa vùng dán, không kéo méo.
   Pack3D.build(THREE, kieu, { lw, lh } (cm), labelMat, { mau }) → { group, H, W }
   kieu: chai1l | chai500 | chainau | hu | hucao | hutron | xo | tuibac | tuivang | baodet | baogiay */
(function (root) {
  'use strict';
  function build(T, kieu, L, labelMat, opt) {
    opt = opt || {};
    var g = new T.Group(), H = 20, W = 10;
    var V2 = function (p) { return p.map(function (q) { return new T.Vector2(q[0], q[1]); }); };
    var mat = function (c, o) { var m = new T.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.5, clearcoat: 0.14, clearcoatRoughness: 0.55, envMapIntensity: 0.9 }, o || {})); return m; };
    var add = function (m) { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    var white = mat(opt.mau || 0xf3f3f0), cap = mat(0xfbfbfa, { roughness: 0.4, clearcoat: 0.25 });
    // khổ nhãn sau khi thu cho vừa (giữ tỷ lệ)
    function fit(maxW, maxH) { var s = Math.min(1, maxW / L.lw, maxH / L.lh); return { w: L.lw * s, h: L.lh * s }; }
    function wrap(r0, r1, y0, h, lb) { // nhãn quấn mặt trụ/côn, giữa nhãn quay ra trước
      var rm = (r0 + r1) / 2 + 0.015, len = Math.min(lb.w / rm, Math.PI * 2 - 0.02);
      var m = new T.Mesh(new T.CylinderGeometry(r1 + 0.015, r0 + 0.015, h, 200, 1, true, -len / 2, len), labelMat);
      m.position.y = y0 + h / 2; m.receiveShadow = true; g.add(m); return m;
    }
    function lathe(pts, m, seg) { return add(new T.Mesh(new T.LatheGeometry(V2(pts), seg || 160), m)); }
    function screwCap(r, h, y, m, ribs) {
      var c = lathe([[0, h], [r - 0.15, h], [r - 0.03, h - 0.08], [r, h - 0.2], [r, 0.05], [r - 0.05, 0]], m || cap, 120); c.position.y = y;
      var rib = new T.BoxGeometry(0.07, h * 0.75, 0.08);
      for (var i = 0; i < (ribs || 0); i++) { var a = i / ribs * Math.PI * 2, b = new T.Mesh(rib, m || cap); b.position.set(Math.sin(a) * r, y + h * 0.45, Math.cos(a) * r); b.rotation.y = a; g.add(b); }
    }

    if (kieu === 'chai1l' || kieu === 'chai500') {
      // chai HDPE dáng chai Noben: 1 lít Ø9,2 × 24 cm; 500 ml Ø7,6 × 18 cm
      var k = kieu === 'chai500' ? 0.76 : 1, R = 4.6 * k, bodyH = (kieu === 'chai500' ? 10.4 : 14.5);
      var top = 0.9 + bodyH, pts = [[0, 0], [3.7 * k, 0], [4.2 * k, 0.1], [4.5 * k, 0.38], [R, 0.9], [R, top]];
      for (var i = 1; i <= 18; i++) { var t = i / 18 * Math.PI / 2; pts.push([2.2 * k + (R - 2.2 * k) * Math.cos(t), top + 4.3 * k * Math.sin(t)]); }
      var nk = top + 4.3 * k;
      pts.push([2.2 * k, nk + 0.4], [2.5 * k, nk + 0.5], [2.5 * k, nk + 0.8], [2.1 * k, nk + 0.9], [2.1 * k, nk + 2.6]);
      lathe(pts, white);
      screwCap(2.42 * k, 2.62 * k, nk + 1.0, cap, 72);
      var lb = fit(Math.PI * 2 * R * 0.97, bodyH - 0.8);
      wrap(R, R, 0.9 + (bodyH - lb.h) / 2, lb.h, lb);
      H = nk + 1.0 + 2.62 * k; W = 2 * R;
    } else if (kieu === 'chainau') {
      // chai thủy tinh nâu 1 lít, vai tròn, nắp đen
      var Rg = 4.5, glass = mat(0x3d1c07, { roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });
      var p = [[0, 0], [Rg - 0.4, 0], [Rg, 0.4], [Rg, 15]];
      for (var j = 1; j <= 20; j++) { var a2 = j / 20 * Math.PI / 2; p.push([1.6 + (Rg - 1.6) * Math.cos(a2), 15 + 5.5 * Math.sin(a2)]); }
      p.push([1.5, 22.5], [1.7, 22.7], [1.5, 23.2]);
      lathe(p, glass);
      screwCap(1.85, 2.4, 22.9, mat(0x161616, { roughness: 0.45 }), 48);
      var lg = fit(Math.PI * 2 * Rg * 0.7, 12);
      wrap(Rg, Rg, 1.5 + (13 - lg.h) / 2, lg.h, lg);
      H = 25.3; W = 2 * Rg;
    } else if (kieu === 'hu' || kieu === 'hucao' || kieu === 'hutron') {
      // hũ nhựa trắng nắp vặn: hũ 1 kg Ø12 × 13; hũ cao Ø11,4 × 15,5; hũ bầu Ø13 × 12
      var Rj = kieu === 'hucao' ? 5.7 : kieu === 'hutron' ? 6.5 : 6.0, Hj = kieu === 'hucao' ? 15.5 : kieu === 'hutron' ? 12 : 13;
      var pj = [[0, 0], [Rj - 0.6, 0], [Rj - 0.15, 0.15], [Rj, 0.6]];
      if (kieu === 'hutron') { for (var q = 0; q <= 16; q++) { var tt = q / 16; pj.push([Rj + Math.sin(tt * Math.PI) * 0.6, 0.6 + tt * (Hj - 2.2)]); } }
      else pj.push([Rj, Hj - 1.6]);
      pj.push([Rj - 0.4, Hj - 1.1], [Rj - 0.55, Hj - 0.9], [Rj - 0.55, Hj]);
      lathe(pj, white);
      screwCap(Rj - 0.35, 2.2, Hj - 1.2, cap, 90);
      var lj = fit(Math.PI * 2 * Rj * 0.97, Hj - 2.6);
      wrap(Rj, Rj, 0.9 + (Hj - 2.6 - lj.h) / 2, lj.h, lj);
      H = Hj + 1.0; W = 2 * Rj;
    } else if (kieu === 'xo') {
      // xô nhựa 5 kg: miệng Ø24, đáy Ø21, cao 22, nắp, quai thép
      var Hb = 22, rb = 10.5, rt = 12;
      var rAt = function (y) { return rb + (rt - rb) * (y / Hb); };
      var px = [[0, 0], [rb - 0.5, 0], [rb - 0.1, 0.15], [rb, 0.6]];
      for (var m2 = 1; m2 <= 20; m2++) { var yy = 0.6 + (Hb - 2.2) * m2 / 20; px.push([rAt(yy), yy]); }
      px.push([rAt(Hb - 1.5) + 0.35, Hb - 1.5], [rAt(Hb - 1.2) + 0.35, Hb - 1.2], [rAt(Hb - 1.1), Hb - 1.1], [rt + 0.5, Hb - 0.4], [rt + 0.55, Hb], [0, Hb]);
      lathe(px, white, 192);
      lathe([[0, Hb + 0.9], [rt - 1.5, Hb + 0.85], [rt + 0.35, Hb + 0.75], [rt + 0.75, Hb + 0.55], [rt + 0.8, Hb - 0.6], [rt + 0.6, Hb - 0.7]], cap, 192);
      var lx = fit(Math.PI * 2 * rb * 0.98, Hb - 4.5);
      var y0 = 1.6 + (Hb - 4.5 - lx.h) / 2;
      wrap(rAt(y0), rAt(y0 + lx.h), y0, lx.h, lx);
      var metal = new T.MeshStandardMaterial({ color: 0x9aa1aa, metalness: 0.9, roughness: 0.32 });
      var ey = Hb - 2.6, er = rAt(ey) + 0.35, hp = [];
      [-1, 1].forEach(function (sg) { var ear = add(new T.Mesh(new T.BoxGeometry(0.5, 2.2, 1.8), white)); ear.position.set(sg * er, ey, 0); });
      for (var h2 = 0; h2 <= 64; h2++) { var b2 = Math.PI * h2 / 64; hp.push(new T.Vector3(-Math.cos(b2) * (er + 0.3), ey + Math.sin(b2) * rt * 0.62, -Math.sin(b2) * rt * 0.55)); }
      add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(hp), 160, 0.13, 10, false), metal));
      var grip = add(new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 6, 32), mat(0x2a3340, { roughness: 0.55 })));
      grip.rotation.z = Math.PI / 2; grip.position.copy(hp[32]);
      H = Hb + rt * 0.62 + 1.5; W = 2 * (rt + 1.2);
    } else {
      // túi / bao: hai mặt phồng, mép hàn; túi zip có đường zip, túi đứng có đáy phồng
      var cfg = {
        tuibac: { w: 16, h: 25, d: 0.17, mat: mat(0xc8ccd2, { metalness: 0.88, roughness: 0.26, clearcoat: 0.3 }), zip: true, dan: { w: 12, h: 15.5, cy: 0.46 } },
        tuivang: { w: 18, h: 26, d: 0.16, mat: mat(0xd9b23c, { metalness: 0.85, roughness: 0.3, clearcoat: 0.3 }), zip: true, in: { x: 0.04, y: 0.05, h: 0.8 } },
        baodet: { w: 42, h: 62, d: 0.13, mat: mat(0xf1f1ec, { roughness: 0.85, clearcoat: 0, sheen: 0.4, sheenRoughness: 0.8 }), dan: { w: 28, h: 30, cy: 0.5 }, det: true },
        baogiay: { w: 40, h: 62, d: 0.12, mat: mat(0xf2efe6, { roughness: 0.9, clearcoat: 0 }), in: { x: 0.02, y: 0.03, h: 0.93 } }
      }[kieu] || null;
      if (!cfg) cfg = { w: 16, h: 25, d: 0.17, mat: white, dan: { w: 12, h: 15.5, cy: 0.46 } };
      var Wb = cfg.w, Hbg = cfg.h, D = Wb * cfg.d, topSeal = cfg.zip ? 0.9 : 0.94;
      if (cfg.det) { // vân bao dệt
        var cv = document.createElement('canvas'); cv.width = cv.height = 256; var cx = cv.getContext('2d');
        cx.fillStyle = '#808080'; cx.fillRect(0, 0, 256, 256);
        for (var z = 0; z < 256; z += 8) { cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(z, 0, 4, 256); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.fillRect(0, z, 256, 4); }
        var bt = new T.CanvasTexture(cv); bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(Wb / 2, Hbg / 2);
        cfg.mat.bumpMap = bt; cfg.mat.bumpScale = 0.04;
      }
      var bul = function (u, v) {
        var a = Math.pow(Math.sin(Math.PI * u), 0.7);
        var vt = v > topSeal ? 0 : v > topSeal - 0.08 ? (topSeal - v) / 0.08 : 1;
        var vb = v < 0.05 ? 0.55 + v / 0.05 * 0.45 : 1; // đáy túi đứng vẫn phồng
        var vv = Math.min(v / topSeal, 1); return a * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * vv)), 0.45) * vt * vb;
      };
      var P = function (u, v, sg, off) { var b = bul(u, v); return [(u - 0.5) * Wb * (1 - 0.06 * b), v * Hbg, sg * (D * b + off) + Math.sin(u * 23 + v * 17) * 0.04 * b]; };
      var surf = function (u0, u1, v0, v1, sg, off, nu, nv) {
        var geo = new T.BufferGeometry(), PP = [], UV = [], I = [], jj, ii;
        for (jj = 0; jj <= nv; jj++) for (ii = 0; ii <= nu; ii++) {
          var u = u0 + (u1 - u0) * ii / nu, v = v0 + (v1 - v0) * jj / nv;
          PP.push.apply(PP, P(u, v, sg, off)); UV.push(sg > 0 ? ii / nu : 1 - ii / nu, jj / nv);
        }
        for (jj = 0; jj < nv; jj++) for (ii = 0; ii < nu; ii++) {
          var A = jj * (nu + 1) + ii, B = A + 1, C = A + nu + 1, E = C + 1;
          if (sg > 0) I.push(A, B, E, A, E, C); else I.push(A, E, B, A, C, E);
        }
        geo.setAttribute('position', new T.Float32BufferAttribute(PP, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
        geo.setIndex(I); geo.computeVertexNormals(); return geo;
      };
      cfg.mat.side = T.DoubleSide;
      add(new T.Mesh(surf(0, 1, 0, 1, 1, 0, 120, 170), cfg.mat));
      add(new T.Mesh(surf(0, 1, 0, 1, -1, 0, 60, 90), cfg.mat));
      if (cfg.zip) { var zp = add(new T.Mesh(new T.BoxGeometry(Wb * 0.96, 0.22, 0.12), mat(0xb9bdc4, { metalness: 0.6, roughness: 0.4 }))); zp.position.set(0, Hbg * (topSeal - 0.035), 0.05); }
      var seal = add(new T.Mesh(new T.BoxGeometry(Wb, Hbg * 0.012, 0.03), mat(0xd0d3d8, { metalness: 0.4, roughness: 0.5 }))); seal.position.set(0, Hbg * 0.965, 0.02);
      if (cfg.in) { // in toàn mặt trước: ảnh nhãn phủ vùng giữa, giữ tỷ lệ
        var hIn = cfg.in.h, wIn = Math.min(1 - 2 * cfg.in.x, (hIn * Hbg) * (L.lw / L.lh) / Wb), hh = wIn * Wb / (L.lw / L.lh) / Hbg;
        var v0 = cfg.in.y + (hIn - hh) / 2, u0 = 0.5 - wIn / 2;
        add(new T.Mesh(surf(u0, u0 + wIn, v0, v0 + hh, 1, 0.02, 90, 130), labelMat));
      } else if (cfg.dan) {
        var ld = fit(cfg.dan.w, cfg.dan.h), du = ld.w / Wb / 2, dv = ld.h / Hbg / 2;
        add(new T.Mesh(surf(0.5 - du, 0.5 + du, cfg.dan.cy - dv, cfg.dan.cy + dv, 1, 0.025, 90, 130), labelMat));
      }
      H = Hbg; W = Wb;
    }
    return { group: g, H: H, W: W };
  }
  root.Pack3D = { build: build };
})(typeof window !== 'undefined' ? window : globalThis);
