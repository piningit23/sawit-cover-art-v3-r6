// Neon Bay Cover Studio — cover renderer.
// Draw order is the whole point: sky -> skyline + palms -> panels ->
// title band -> grain + vignette. The skyline is NEVER drawn over a photo.
(function () {
  'use strict';

  // Seeded random so every render of the same state looks identical.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var GRADES = {
    sunset: {
      label: 'Vice Sunset',
      skyTop: '#2b0f54', skyMid: '#ff2d78', skyLow: '#ff7a18',
      tint: 'rgba(255, 80, 40, 0.16)', wash: 'rgba(255, 45, 120, 0.10)',
      glow: '#ff9a3d', band: '#160818', accent: '#ffd23f',
      saturate: 1.35, contrast: 1.14, bright: 1.03
    },
    neon: {
      label: 'Neon Night',
      skyTop: '#05081f', skyMid: '#3b0f8f', skyLow: '#00c2d6',
      tint: 'rgba(0, 210, 255, 0.15)', wash: 'rgba(123, 47, 247, 0.14)',
      glow: '#00e5ff', band: '#04081a', accent: '#00e5ff',
      saturate: 1.4, contrast: 1.16, bright: 1.0
    },
    gold: {
      label: 'Palm Gold',
      skyTop: '#3d1c00', skyMid: '#ff8c00', skyLow: '#ffd23f',
      tint: 'rgba(255, 170, 0, 0.20)', wash: 'rgba(255, 110, 0, 0.10)',
      glow: '#ffd23f', band: '#1c0e00', accent: '#ffe9a3',
      saturate: 1.38, contrast: 1.13, bright: 1.05
    },
    noir: {
      label: 'Vice Noir',
      skyTop: '#05050c', skyMid: '#1c1038', skyLow: '#7b2ff7',
      tint: 'rgba(130, 60, 255, 0.18)', wash: 'rgba(10, 10, 20, 0.12)',
      glow: '#b967ff', band: '#050510', accent: '#c9a7ff',
      saturate: 1.3, contrast: 1.2, bright: 0.97
    }
  };

  var LOOKS = {
    'sunset-heist': {
      label: 'Sunset Heist', layout: 'hero', grade: 'sunset',
      lettering: 'solid', title: 'VICE CITY', subtitle: 'Sunset Heist \u00b7 Est. 2026',
      titleSize: 'large', titleColor: 'white'
    },
    'boulevard-queen': {
      label: 'Boulevard Queen', layout: 'duo', grade: 'gold',
      lettering: 'solid', title: 'BOULEVARD QUEEN', subtitle: 'Queen of the Boulevard',
      titleSize: 'large', titleColor: 'gold'
    },
    'neon-nights': {
      label: 'Neon Nights', layout: 'poster', grade: 'neon',
      lettering: 'outline', title: 'NEON NIGHTS', subtitle: 'Neon Nights \u00b7 Est. 2026',
      titleSize: 'huge', titleColor: 'cyan'
    },
    'vice-noir': {
      label: 'Vice Noir', layout: 'poster', grade: 'noir',
      lettering: 'outline', title: 'VICE NOIR', subtitle: 'After Dark \u00b7 Vice City',
      titleSize: 'huge', titleColor: 'white'
    }
  };

  var TITLE_COLORS = {
    white: '#ffffff', pink: '#ff5fa2', gold: '#ffd23f', cyan: '#7df3ff'
  };

  // Panel rectangles, in fractions of the canvas. The panel area sits
  // between the sky strip (top 14%) and the title band (bottom 24%).
  // Poster is the exception: one full-bleed photo.
  function layoutPanels(layout, w, h) {
    var gap = Math.max(4, Math.round(w * 0.006));
    var x0 = w * 0.03, y0 = h * 0.14, pw = w * 0.94, ph = h * 0.62;
    if (layout === 'duo') {
      var half = (pw - gap) / 2;
      return [
        { x: x0, y: y0, w: half, h: ph, kind: 'photo' },
        { x: x0 + half + gap, y: y0, w: half, h: ph, kind: 'photo' }
      ];
    }
    if (layout === 'poster') {
      return [{ x: 0, y: 0, w: w, h: h, kind: 'photo' }];
    }
    // hero: 1 big + 2 small; the third slot is an art card, never a repeat.
    var bigW = pw * 0.62;
    var smallW = pw - bigW - gap;
    var smallH = (ph - gap) / 2;
    return [
      { x: x0, y: y0, w: bigW, h: ph, kind: 'photo' },
      { x: x0 + bigW + gap, y: y0, w: smallW, h: smallH, kind: 'photo' },
      { x: x0 + bigW + gap, y: y0 + smallH + gap, w: smallW, h: smallH, kind: 'art' }
    ];
  }

  function drawSky(ctx, grade, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, grade.skyTop);
    g.addColorStop(0.45, grade.skyMid);
    g.addColorStop(1, grade.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Low sun disc, half-hidden behind the skyline band.
    var sunR = h * 0.09;
    var sun = ctx.createRadialGradient(w * 0.78, h * 0.16, 0, w * 0.78, h * 0.16, sunR * 2.2);
    sun.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
    sun.addColorStop(0.35, grade.glow);
    sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.16, sunR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.16, sunR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Skyline + palms, drawn BEHIND the panels. Confined to the sky strip
  // above the panel area, so no building or frond ever covers a photo.
  function drawSkyline(ctx, grade, w, h, seed) {
    var rnd = mulberry32(seed);
    var base = h * 0.14;
    var skyline = '#0d0a1e';
    ctx.fillStyle = skyline;
    var x = 0;
    while (x < w) {
      var bw = w * (0.04 + rnd() * 0.07);
      var bh = h * (0.03 + rnd() * 0.085);
      ctx.fillRect(x, base - bh, bw, bh);
      if (rnd() < 0.5) { // antenna on some towers
        ctx.fillRect(x + bw / 2 - 1, base - bh - h * 0.02, 2, h * 0.02);
      }
      x += bw + w * 0.004;
    }
    // A few lit windows in the towers.
    ctx.fillStyle = grade.glow;
    for (var i = 0; i < 26; i++) {
      var wx = rnd() * w, wy = base - rnd() * h * 0.1;
      ctx.globalAlpha = 0.35 + rnd() * 0.5;
      ctx.fillRect(wx, wy, Math.max(2, w * 0.003), Math.max(2, h * 0.004));
    }
    ctx.globalAlpha = 1;
    // Palms silhouetted in the sky strip, left and right edges.
    drawPalm(ctx, w * 0.05, base, h * 0.11, -0.25, skyline);
    drawPalm(ctx, w * 0.95, base, h * 0.13, 0.25, skyline);
  }

  function drawPalm(ctx, bx, by, size, lean, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * size, by - size * 0.6, bx + lean * size * 1.4, by - size);
    ctx.stroke();
    var tx = bx + lean * size * 1.4, ty = by - size;
    // Fronds arc out from the crown and droop at the tips, drawn as
    // filled blades so they read as palms even at small sizes.
    for (var i = 0; i < 7; i++) {
      var t = i / 6; // 0 = far left, 1 = far right
      var ang = -Math.PI * (0.95 - t * 0.9); // sweep over the top
      var len = size * (0.6 + 0.22 * Math.sin(t * Math.PI));
      var fx = tx + Math.cos(ang) * len;
      var fy = ty + Math.sin(ang) * len * 0.5 + len * 0.42; // tips droop down
      var mx = tx + Math.cos(ang) * len * 0.5;
      var my = ty + Math.sin(ang) * len * 0.5 - size * 0.14;
      var blade = size * 0.05;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx + blade, my, fx, fy);
      ctx.quadraticCurveTo(mx - blade, my, tx, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath(); // coconut cluster under the crown
    ctx.arc(tx, ty + size * 0.05, Math.max(1.5, size * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPhotoPanel(ctx, img, rect, crop, grade) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    // Cover-fit source rect, then zoom + pan from the crop controls.
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(rect.w / iw, rect.h / ih) * (crop.zoom || 1);
    var sw = rect.w / scale, sh = rect.h / scale;
    var sx = (iw - sw) / 2 + (crop.x || 0) * (iw - sw) / 2;
    var sy = (ih - sh) / 2 + (crop.y || 0) * (ih - sh) / 2;
    sx = Math.max(0, Math.min(iw - sw, sx));
    sy = Math.max(0, Math.min(ih - sh, sy));
    ctx.filter = 'saturate(' + grade.saturate + ') contrast(' + grade.contrast +
      ') brightness(' + grade.bright + ')';
    ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
    ctx.filter = 'none';
    // Strong saturated grade wash on top of the photo.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    var wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, 'rgba(0,0,0,0)');
    wash.addColorStop(1, grade.wash);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Thin neon frame so panels read as poster panels.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, rect.w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  function drawArtPanel(ctx, rect, grade, seed) {
    var g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, grade.skyMid);
    g.addColorStop(1, grade.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(10,6,24,0.85)';
    ctx.fillRect(rect.x, rect.y + rect.h * 0.62, rect.w, rect.h * 0.38);
    drawPalm(ctx, rect.x + rect.w * 0.22, rect.y + rect.h * 0.66,
      rect.h * 0.34, -0.2, '#0d0a1e');
    drawPalm(ctx, rect.x + rect.w * 0.8, rect.y + rect.h * 0.66,
      rect.h * 0.3, 0.2, '#0d0a1e');
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 ' + Math.round(rect.h * 0.13) + 'px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EST. 2026', rect.x + rect.w / 2, rect.y + rect.h * 0.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, rect.w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  function drawTitleBand(ctx, state, grade, w, h) {
    var bandTop = h * 0.76;
    var g = ctx.createLinearGradient(0, bandTop - h * 0.04, 0, h);
    g.addColorStop(0, 'rgba(8,4,18,0)');
    g.addColorStop(0.25, grade.band);
    g.addColorStop(1, grade.band);
    ctx.fillStyle = g;
    ctx.fillRect(0, bandTop - h * 0.04, w, h - bandTop + h * 0.04);
    // Neon rule above the title.
    ctx.fillStyle = grade.glow;
    ctx.fillRect(w * 0.08, bandTop + h * 0.015, w * 0.84, Math.max(2, h * 0.006));
    var color = TITLE_COLORS[state.titleColor] || '#ffffff';
    var sizeFactor = state.titleSize === 'huge' ? 0.115 :
      state.titleSize === 'medium' ? 0.075 : 0.095;
    var titleSize = Math.round(h * sizeFactor);
    var title = (state.title || 'VICE CITY').toUpperCase();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shrink long titles until they fit the cover instead of running off it.
    var titleFont = function (px) {
      return '900 ' + px + 'px "Arial Black", Impact, "Helvetica Neue", sans-serif';
    };
    var fitSize = titleSize;
    ctx.font = titleFont(fitSize);
    while (fitSize > 12 && ctx.measureText(title).width > w * 0.92) {
      fitSize -= 2;
      ctx.font = titleFont(fitSize);
    }
    titleSize = fitSize;
    try { ctx.letterSpacing = Math.round(titleSize * 0.06) + 'px'; } catch (e) {}
    var cy = bandTop + (h - bandTop) * 0.42;
    if (state.lettering === 'outline') {
      ctx.lineWidth = Math.max(2, titleSize * 0.07);
      ctx.strokeStyle = color;
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = titleSize * 0.45;
      ctx.strokeText(title, w / 2, cy);
      ctx.shadowBlur = 0;
      ctx.lineWidth = Math.max(1, titleSize * 0.02);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(title, w / 2, cy);
    } else {
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = titleSize * 0.5;
      ctx.fillStyle = color;
      ctx.fillText(title, w / 2, cy);
      ctx.shadowBlur = 0;
      ctx.lineWidth = Math.max(1, titleSize * 0.03);
      ctx.strokeStyle = 'rgba(10,4,20,0.65)';
      ctx.strokeText(title, w / 2, cy);
    }
    try { ctx.letterSpacing = '0px'; } catch (e) {}
    var sub = state.subtitle || '';
    if (sub) {
      ctx.font = '600 ' + Math.round(h * 0.032) + 'px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = grade.accent;
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = h * 0.01;
      ctx.fillText(sub, w / 2, bandTop + (h - bandTop) * 0.78);
      ctx.shadowBlur = 0;
    }
  }

  function drawGrain(ctx, w, h, seed) {
    var rnd = mulberry32(seed + 77);
    var n = Math.round((w * h) / 1400);
    for (var i = 0; i < n; i++) {
      var v = rnd();
      ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
    }
    var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // state: { layout, grade, lettering, title, subtitle, titleSize,
  //   titleColor, skyline, grain, panels: [{ photo: index|'art', zoom, x, y }] }
  // photos: array of HTMLImageElement (loaded). Missing photos fall back
  // to a grade gradient so first paint is never an empty state.
  function renderCover(canvas, state, photos) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var grade = GRADES[state.grade] || GRADES.sunset;
    var seed = 20261120;
    drawSky(ctx, grade, w, h);
    if (state.skyline !== false) drawSkyline(ctx, grade, w, h, seed);
    var panels = layoutPanels(state.layout || 'hero', w, h);
    var photoSlots = panels.map(function (p, i) {
      var spec = (state.panels && state.panels[i]) || {};
      return { panel: p, spec: spec, index: i };
    });
    photoSlots.forEach(function (slot) {
      var p = slot.panel, spec = slot.spec;
      var kind = spec.photo === 'art' ? 'art' : 'photo';
      if (p.kind === 'art' && spec.photo !== undefined && spec.photo !== 'art') kind = 'photo';
      if (p.kind === 'photo' && spec.photo === 'art') kind = 'art';
      if (kind === 'art') {
        drawArtPanel(ctx, p, grade, seed + slot.index);
        return;
      }
      var img = null;
      if (typeof spec.photo === 'number') img = photos[spec.photo] || null;
      else if (photos.length) img = photos[slot.index % photos.length] || null;
      if (!img) {
        var g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
        g.addColorStop(0, grade.skyMid);
        g.addColorStop(1, grade.skyLow);
        ctx.fillStyle = g;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        return;
      }
      drawPhotoPanel(ctx, img, p, {
        zoom: spec.zoom || 1, x: spec.x || 0, y: spec.y || 0
      }, grade);
    });
    drawTitleBand(ctx, state, grade, w, h);
    if (state.grain !== false) drawGrain(ctx, w, h, seed);
  }

  window.NeonBayCover = {
    GRADES: GRADES, LOOKS: LOOKS, TITLE_COLORS: TITLE_COLORS,
    layoutPanels: layoutPanels, renderCover: renderCover
  };
})();
