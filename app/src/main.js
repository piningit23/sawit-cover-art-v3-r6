// Neon Bay Cover Studio — editor wiring: auto-load, Looks, crop, export.
(function () {
  'use strict';

  var Cover = window.NeonBayCover;
  var canvas = document.getElementById('cover');
  var previewNote = document.getElementById('previewNote');

  var SIZES = {
    '1920x1080': { w: 1920, h: 1080, label: '1920 \u00d7 1080' },
    '1080x1080': { w: 1080, h: 1080, label: '1080 \u00d7 1080' },
    '1080x1350': { w: 1080, h: 1350, label: '1080 \u00d7 1350' }
  };

  var state = {
    layout: 'hero',
    grade: 'sunset',
    lettering: 'solid',
    title: 'VICE CITY',
    subtitle: 'Neon Nights \u00b7 Est. 2026',
    titleSize: 'large',
    titleColor: 'white',
    skyline: true,
    grain: true,
    panels: [{ photo: 0, y: -0.55 }, { photo: 1, y: -0.3 }, { photo: 'art' }]
  };

  var photos = []; // { img, name }
  var ready = false;

  function defaultPanels(layout) {
    // Default crops favour the top of each photo, where the faces are,
    // so the wide panels do not cut heads off.
    if (layout === 'duo') return [{ photo: 0, y: -0.55 }, { photo: 1, y: -0.3 }];
    if (layout === 'poster') return [{ photo: 0, y: -0.5 }];
    return [{ photo: 0, y: -0.55 }, { photo: 1, y: -0.3 }, { photo: 'art' }];
  }

  function layoutLabel() {
    return state.layout === 'hero' ? 'Hero' :
      state.layout === 'duo' ? 'Duo' : 'Poster';
  }

  function render() {
    var imgs = photos.map(function (p) { return p.img; });
    Cover.renderCover(canvas, state, imgs);
    var sizeKey = document.getElementById('previewSize').value;
    previewNote.textContent = layoutLabel() + ' \u00b7 ' +
      (Cover.GRADES[state.grade] || {}).label + ' \u00b7 ' +
      SIZES[sizeKey].label + ' preview';
    document.querySelectorAll('[data-look]').forEach(function (b) {
      b.classList.remove('active');
    });
  }

  function applyPreviewSize() {
    var sizeKey = document.getElementById('previewSize').value;
    var s = SIZES[sizeKey];
    var scale = sizeKey === '1920x1080' ? 960 / 1920 :
      sizeKey === '1080x1080' ? 540 / 1080 : 432 / 1080;
    canvas.width = Math.round(s.w * scale);
    canvas.height = Math.round(s.h * scale);
    render();
  }

  function photoOptions(selected) {
    var html = '';
    photos.forEach(function (p, i) {
      html += '<option value="' + i + '"' + (selected === i ? ' selected' : '') +
        '>Photo ' + (i + 1) + ' — ' + escapeHtml(p.name) + '</option>';
    });
    html += '<option value="art"' + (selected === 'art' ? ' selected' : '') +
      '>Art card (no photo)</option>';
    return html;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Panel cards: only for panels the active layout actually shows (max 3).
  function buildPanelCards() {
    var wrap = document.getElementById('panelCards');
    wrap.innerHTML = '';
    var panels = Cover.layoutPanels(state.layout, 100, 100);
    panels.forEach(function (p, i) {
      var spec = state.panels[i] || {};
      var card = document.createElement('div');
      card.className = 'panel-card';
      var title = state.layout === 'poster' ? 'Cover photo' :
        'Panel ' + (i + 1) + (p.kind === 'art' ? ' — art card' : '');
      var html = '<h3>' + title + '</h3>' +
        '<label>Photo<select data-panel="' + i + '" data-field="photo">' +
        photoOptions(spec.photo) + '</select></label>';
      if (spec.photo !== 'art') {
        html += '<label>Zoom<input type="range" min="1" max="2" step="0.01" value="' +
          (spec.zoom || 1) + '" data-panel="' + i + '" data-field="zoom"></label>' +
          '<label>Left / right<input type="range" min="-1" max="1" step="0.01" value="' +
          (spec.x || 0) + '" data-panel="' + i + '" data-field="x"></label>' +
          '<label>Up / down<input type="range" min="-1" max="1" step="0.01" value="' +
          (spec.y || 0) + '" data-panel="' + i + '" data-field="y"></label>';
      }
      card.innerHTML = html;
      wrap.appendChild(card);
    });
    wrap.querySelectorAll('select, input').forEach(function (el) {
      el.addEventListener('change', onPanelChange);
      el.addEventListener('input', onPanelChange);
    });
  }

  function onPanelChange(ev) {
    var el = ev.target;
    var i = Number(el.getAttribute('data-panel'));
    var field = el.getAttribute('data-field');
    if (!state.panels[i]) state.panels[i] = {};
    if (field === 'photo') {
      state.panels[i].photo = el.value === 'art' ? 'art' : Number(el.value);
      state.panels[i].zoom = 1; state.panels[i].x = 0; state.panels[i].y = 0;
      buildPanelCards();
    } else {
      state.panels[i][field] = Number(el.value);
    }
    render();
  }

  function applyLook(key) {
    var look = Cover.LOOKS[key];
    if (!look) return;
    state.layout = look.layout;
    state.grade = look.grade;
    state.lettering = look.lettering;
    state.title = look.title;
    state.subtitle = look.subtitle;
    state.titleSize = look.titleSize;
    state.titleColor = look.titleColor;
    state.panels = defaultPanels(look.layout);
    syncControls();
    buildPanelCards();
    render();
    document.querySelectorAll('[data-look]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-look') === key);
    });
  }

  function syncControls() {
    document.getElementById('layout').value = state.layout;
    document.getElementById('grade').value = state.grade;
    document.getElementById('lettering').value = state.lettering;
    document.getElementById('title').value = state.title;
    document.getElementById('subtitle').value = state.subtitle;
    document.getElementById('titleSize').value = state.titleSize;
    document.getElementById('titleColor').value = state.titleColor;
    document.getElementById('skyline').checked = state.skyline;
    document.getElementById('grain').checked = state.grain;
  }

  function loadImage(src, name) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve({ img: img, name: name }); };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Auto-load the two sample photos on first paint: first paint is a
  // finished cover. No "ADD PHOTO", no empty state, ever.
  function autoLoadSamples() {
    return Promise.all([
      loadImage('samples/boulevard.jpg', 'Boulevard'),
      loadImage('samples/pier.jpg', 'Pier')
    ]).then(function (loaded) {
      photos = loaded;
      ready = true;
      buildPanelCards();
      render();
    }).catch(function () {
      ready = true;
      buildPanelCards();
      render();
    });
  }

  function exportPNG(sizeKey) {
    var s = SIZES[sizeKey] || SIZES['1920x1080'];
    var off = document.createElement('canvas');
    off.width = s.w; off.height = s.h;
    Cover.renderCover(off, state, photos.map(function (p) { return p.img; }));
    return new Promise(function (resolve) {
      off.toBlob(function (blob) { resolve(blob); }, 'image/png');
    });
  }

  function exportDataURL(w, h) {
    var off = document.createElement('canvas');
    off.width = w; off.height = h;
    Cover.renderCover(off, state, photos.map(function (p) { return p.img; }));
    return off.toDataURL('image/png');
  }

  document.querySelectorAll('[data-look]').forEach(function (b) {
    b.addEventListener('click', function () { applyLook(b.getAttribute('data-look')); });
  });

  document.getElementById('layout').addEventListener('change', function (ev) {
    state.layout = ev.target.value;
    state.panels = defaultPanels(state.layout);
    buildPanelCards();
    render();
  });
  document.getElementById('grade').addEventListener('change', function (ev) {
    state.grade = ev.target.value; render();
  });
  document.getElementById('lettering').addEventListener('change', function (ev) {
    state.lettering = ev.target.value; render();
  });
  document.getElementById('title').addEventListener('input', function (ev) {
    state.title = ev.target.value; render();
  });
  document.getElementById('subtitle').addEventListener('input', function (ev) {
    state.subtitle = ev.target.value; render();
  });
  document.getElementById('titleSize').addEventListener('change', function (ev) {
    state.titleSize = ev.target.value; render();
  });
  document.getElementById('titleColor').addEventListener('change', function (ev) {
    state.titleColor = ev.target.value; render();
  });
  document.getElementById('skyline').addEventListener('change', function (ev) {
    state.skyline = ev.target.checked; render();
  });
  document.getElementById('grain').addEventListener('change', function (ev) {
    state.grain = ev.target.checked; render();
  });
  document.getElementById('previewSize').addEventListener('change', applyPreviewSize);

  document.getElementById('upload').addEventListener('change', function (ev) {
    var files = Array.prototype.slice.call(ev.target.files || []);
    if (!files.length) return;
    var loaders = files.map(function (f) {
      return loadImage(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, ''));
    });
    Promise.all(loaders).then(function (loaded) {
      photos = photos.concat(loaded);
      buildPanelCards();
      render();
    });
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    var sizeKey = document.getElementById('previewSize').value;
    var s = SIZES[sizeKey];
    exportPNG(sizeKey).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'neon-bay-cover-' + s.w + 'x' + s.h + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    });
  });

  // Test / screenshot hook for the maker: drive the app without a mouse.
  window.NeonBay = {
    state: state,
    get photos() { return photos; },
    get ready() { return ready; },
    render: render,
    applyLook: applyLook,
    setState: function (patch) {
      Object.assign(state, patch);
      if (patch.layout) state.panels = patch.panels || defaultPanels(patch.layout);
      syncControls();
      buildPanelCards();
      render();
    },
    exportDataURL: exportDataURL,
    exportPNG: exportPNG
  };

  buildPanelCards();
  render();
  autoLoadSamples();
})();
