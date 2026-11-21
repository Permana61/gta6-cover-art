// Neon Coast Cover Studio — editor.
// Owns the state, the controls, drag/wheel cropping, undo/redo and PNG export.
// The drawing itself lives in cover.js; this file only wires the UI to it.
import {
  GRADES, LAYOUTS, ROLES, gradeById, layoutById,
  smartCropWindow, centreWindow, drawCover, renderCoverToCanvas,
} from './cover.js';
import { readShot } from './shots.js';

const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

const stage = document.getElementById('stage');
const statusLine = document.getElementById('statusLine');
const $ = (id) => document.getElementById(id);

let photoSeq = 0;
let sizeKey = 'square';
let activePanel = 0;
let undoStack = [];
let redoStack = [];
let renderQueued = false;
let shot = null;

function defaultPanels() {
  return Array.from({ length: 9 }, (_, i) => ({
    photo: -1,
    role: ROLES[i % ROLES.length],
    crop: null,
    manual: false,
  }));
}

let state = {
  caption: 'SUNSET HEIST',
  tagline: 'vice city nights',
  quote: '“One last job. Then we disappear.”',
  ribbon: 'EST. 2026',
  layout: 'hero',
  grade: 'sunset',
  ink: true,
  smart: true,
  grain: true,
  vignette: true,
  halftone: true,
  seal: true,
  billing: true,
  heat: 5,
  photos: [],
  panels: defaultPanels(),
};

function setStatus(text) { statusLine.textContent = text; }

// --- snapshots (undo / redo) ------------------------------------------------
function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify(rest);
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}

function restore(json) {
  const data = JSON.parse(json);
  const photos = state.photos;
  state = { ...data, photos };
  syncControls();
  buildPanelList();
  queueRender();
}

function refreshUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

// --- photos -----------------------------------------------------------------
function addPhotoImage(img, name) {
  const id = `p${++photoSeq}`;
  img.dataset.saliencyKey = id;
  const photo = { id, img, name, src: img.currentSrc || img.src };
  state.photos.push(photo);
  // Fill the first empty panel with the new photo.
  const empty = state.panels.find((p) => p.photo < 0);
  if (empty) {
    empty.photo = state.photos.length - 1;
    empty.crop = null;
    empty.manual = false;
  }
  return photo;
}

function loadSample(name, file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(addPhotoImage(img, name));
    img.onerror = () => reject(new Error(`could not load ${file}`));
    img.src = file;
  });
}

async function loadSamples() {
  setStatus('Loading samples…');
  try {
    await loadSample('Boulevard', 'samples/boulevard.jpg');
    await loadSample('Pier', 'samples/pier.jpg');
    pushUndo();
    buildPanelList();
    queueRender();
    setStatus('Samples loaded — drag a panel to crop, scroll to zoom.');
  } catch (err) {
    setStatus(`Samples failed: ${err.message}`);
  }
}

function onFilesPicked(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) { setStatus('No image files picked.'); return; }
  pushUndo();
  let done = 0;
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        addPhotoImage(img, file.name);
        done += 1;
        if (done === list.length) {
          buildPanelList();
          queueRender();
          setStatus(`${done} photo${done > 1 ? 's' : ''} added — fill panels or drag to crop.`);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- render -----------------------------------------------------------------
// Recompute crops for panels that the user has not positioned by hand:
// the crop window must match the panel's current aspect, which changes
// with the layout and the export size.
function refreshAutoCrops() {
  const layout = layoutById(state.layout);
  const titleFrac = layout.full ? 0 : (stage.width / stage.height) > 1.2 ? 0.30
    : (stage.width / stage.height) < 0.9 ? 0.22 : 0.24;
  const artH = stage.height * (1 - titleFrac);
  const rects = layout.art();
  rects.forEach((r, i) => {
    const panel = state.panels[i];
    if (!panel || panel.photo < 0 || panel.manual) return;
    const photo = state.photos[panel.photo];
    if (!photo) return;
    const aspect = (r.w * stage.width) / (r.h * artH);
    const want = state.smart ? smartCropWindow(photo.img, aspect) : centreWindow(photo.img, aspect);
    if (!panel.crop || Math.abs((panel.crop.w / panel.crop.h) - aspect) > 0.03) panel.crop = want;
  });
}

function renderNow() {
  refreshAutoCrops();
  drawCover(stage, state);
  renderQueued = false;
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(renderNow);
}

// --- controls ---------------------------------------------------------------
function buildLayoutPicker() {
  const box = $('layoutPicker');
  box.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.textContent = l.name;
    b.setAttribute('aria-pressed', String(state.layout === l.id));
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushUndo();
      state.layout = l.id;
      state.panels.forEach((p) => { if (!p.manual) p.crop = null; });
      buildLayoutPicker();
      buildPanelList();
      queueRender();
      setStatus(`Layout: ${l.name}.`);
    });
    box.appendChild(b);
  });
}

function buildGradePicker() {
  const box = $('gradePicker');
  box.innerHTML = '';
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.title = g.name;
    b.style.background = `linear-gradient(135deg, ${g.wash[0]}, ${g.wash[1]})`;
    b.setAttribute('aria-pressed', String(state.grade === g.id));
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushUndo();
      state.grade = g.id;
      $('gradeName').textContent = g.desc;
      buildGradePicker();
      queueRender();
      setStatus(`Grade: ${g.name}.`);
    });
    box.appendChild(b);
  });
  $('gradeName').textContent = gradeById(state.grade).desc;
}

function bindToggle(id, key) {
  const el = $(id);
  el.setAttribute('aria-pressed', String(state[key]));
  el.addEventListener('click', () => {
    pushUndo();
    state[key] = !state[key];
    el.setAttribute('aria-pressed', String(state[key]));
    queueRender();
  });
}

function syncControls() {
  $('captionInput').value = state.caption;
  $('taglineInput').value = state.tagline;
  $('quoteInput').value = state.quote;
  $('ribbonInput').value = state.ribbon;
  $('heatInput').value = String(state.heat);
  $('heatLabel').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  buildLayoutPicker();
  buildGradePicker();
  ['toggleInk', 'toggleSmart', 'toggleGrain', 'toggleVignette', 'toggleHalftone', 'toggleSeal', 'toggleBilling']
    .forEach((id) => {
      const key = { toggleInk: 'ink', toggleSmart: 'smart', toggleGrain: 'grain', toggleVignette: 'vignette', toggleHalftone: 'halftone', toggleSeal: 'seal', toggleBilling: 'billing' }[id];
      $(id).setAttribute('aria-pressed', String(state[key]));
    });
  document.querySelectorAll('#sizePicker .chip-btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.size === sizeKey));
  });
  refreshUndoButtons();
}

// --- panel list -------------------------------------------------------------
function visiblePanelCount() {
  return layoutById(state.layout).art().length;
}

function buildPanelList() {
  const list = $('panelList');
  list.innerHTML = '';
  const count = visiblePanelCount();
  for (let i = 0; i < count; i++) {
    const panel = state.panels[i];
    const card = document.createElement('div');
    card.className = `panel-card${i === activePanel ? ' active' : ''}`;
    const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;

    const top = document.createElement('div');
    top.className = 'row';
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = '';
    if (photo) thumb.src = photo.src;
    top.appendChild(thumb);
    const name = document.createElement('div');
    name.className = 'pname';
    name.textContent = `Panel ${i + 1}${panel.hero ? '' : ''} — ${photo ? photo.name : 'no photo'}`;
    top.appendChild(name);
    card.appendChild(top);

    const row = document.createElement('div');
    row.className = 'row';
    const photoSel = document.createElement('select');
    photoSel.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const none = document.createElement('option');
    none.value = '-1';
    none.textContent = 'No photo';
    photoSel.appendChild(none);
    state.photos.forEach((ph, idx) => {
      const o = document.createElement('option');
      o.value = String(idx);
      o.textContent = ph.name;
      photoSel.appendChild(o);
    });
    photoSel.value = String(panel.photo);
    photoSel.addEventListener('change', () => {
      pushUndo();
      panel.photo = Number(photoSel.value);
      panel.crop = null;
      panel.manual = false;
      buildPanelList();
      queueRender();
    });
    row.appendChild(photoSel);

    const roleSel = document.createElement('select');
    roleSel.setAttribute('aria-label', `Cast role for panel ${i + 1}`);
    ROLES.forEach((r) => {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = r;
      roleSel.appendChild(o);
    });
    roleSel.value = panel.role;
    roleSel.addEventListener('change', () => {
      pushUndo();
      panel.role = roleSel.value;
      queueRender();
    });
    row.appendChild(roleSel);
    card.appendChild(row);

    const bottom = document.createElement('div');
    bottom.className = 'row';
    bottom.style.marginTop = '6px';
    const recrop = document.createElement('button');
    recrop.type = 'button';
    recrop.className = 'mini';
    recrop.textContent = panel.manual ? 'Re-crop (smart)' : 'Smart crop on';
    recrop.addEventListener('click', () => {
      pushUndo();
      panel.manual = false;
      panel.crop = null;
      buildPanelList();
      queueRender();
      setStatus(`Panel ${i + 1} re-cropped ${state.smart ? 'face-aware' : 'to centre'}.`);
    });
    bottom.appendChild(recrop);
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'mini';
    pick.textContent = 'Select';
    pick.addEventListener('click', () => {
      activePanel = i;
      buildPanelList();
    });
    bottom.appendChild(pick);
    card.appendChild(bottom);

    card.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'SELECT' || ev.target.tagName === 'BUTTON') return;
      activePanel = i;
      buildPanelList();
    });
    list.appendChild(card);
  }
}

// --- drag / wheel crop on the preview ---------------------------------------
// Hit-test the canvas: the hero is drawn last, so test it first.
function panelRectsOnCanvas() {
  const layout = layoutById(state.layout);
  const titleFrac = layout.full ? 0 : (stage.width / stage.height) > 1.2 ? 0.30
    : (stage.width / stage.height) < 0.9 ? 0.22 : 0.24;
  const artH = stage.height * (1 - titleFrac);
  return layout.art().map((r, i) => {
    const rw = r.w * stage.width;
    const rh = r.h * artH;
    let x = r.x * stage.width;
    let y = r.y * artH;
    if (r.hero) { x -= rw * 0.045; y -= rh * 0.045; }
    return { x, y, w: rw * (r.hero ? 1.09 : 1), h: rh * (r.hero ? 1.09 : 1), hero: !!r.hero, index: i, rot: r.rot || 0 };
  });
}

function pickPanel(cx, cy) {
  const rects = panelRectsOnCanvas();
  for (let k = rects.length - 1; k >= 0; k--) {
    const r = rects[k];
    // Undo the small tilt for the hit test by testing the unrotated box.
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r;
  }
  return null;
}

function canvasPoint(ev) {
  const box = stage.getBoundingClientRect();
  return {
    x: ((ev.clientX - box.left) / box.width) * stage.width,
    y: ((ev.clientY - box.top) / box.height) * stage.height,
  };
}

let drag = null;

stage.addEventListener('pointerdown', (ev) => {
  const p = canvasPoint(ev);
  const hit = pickPanel(p.x, p.y);
  if (!hit) return;
  const panel = state.panels[hit.index];
  if (!panel || panel.photo < 0 || !panel.crop) return;
  activePanel = hit.index;
  buildPanelList();
  pushUndo();
  drag = { panel, rect: hit, last: p };
  stage.classList.add('dragging');
  stage.setPointerCapture(ev.pointerId);
});

stage.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const p = canvasPoint(ev);
  const { panel, rect, last } = drag;
  const dx = p.x - last.x;
  const dy = p.y - last.y;
  drag.last = p;
  const crop = panel.crop;
  crop.x = Math.min(1 - crop.w, Math.max(0, crop.x - (dx / rect.w) * crop.w));
  crop.y = Math.min(1 - crop.h, Math.max(0, crop.y - (dy / rect.h) * crop.h));
  panel.manual = true;
  queueRender();
});

stage.addEventListener('pointerup', () => {
  drag = null;
  stage.classList.remove('dragging');
  if (activePanel >= 0) buildPanelList();
});

stage.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const p = canvasPoint(ev);
  const hit = pickPanel(p.x, p.y);
  if (!hit) return;
  const panel = state.panels[hit.index];
  if (!panel || panel.photo < 0 || !panel.crop) return;
  if (!drag) pushUndo();
  const factor = ev.deltaY > 0 ? 1.12 : 1 / 1.12;
  const crop = panel.crop;
  const aspect = crop.w / crop.h;
  const cx = crop.x + crop.w / 2;
  const cy = crop.y + crop.h / 2;
  let nw = Math.min(1, Math.max(0.12, crop.w * factor));
  let nh = nw / aspect;
  if (nh > 1) { nh = 1; nw = nh * aspect; }
  crop.w = nw;
  crop.h = nh;
  crop.x = Math.min(1 - nw, Math.max(0, cx - nw / 2));
  crop.y = Math.min(1 - nh, Math.max(0, cy - nh / 2));
  panel.manual = true;
  activePanel = hit.index;
  queueRender();
}, { passive: false });

// --- export -----------------------------------------------------------------
function slug(text) {
  return (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportSize(key) {
  return new Promise((resolve, reject) => {
    const size = SIZES[key];
    const cv = renderCoverToCanvas(state, size.w, size.h);
    cv.toBlob((blob) => {
      if (!blob) { reject(new Error('export produced no image')); return; }
      downloadBlob(blob, `neon-coast-${slug(state.caption)}-${size.w}x${size.h}.png`);
      resolve({ key, w: size.w, h: size.h, bytes: blob.size });
    }, 'image/png');
  });
}

async function exportAll() {
  if (!state.photos.length) { setStatus('Add a photo first — the samples work too.'); return; }
  setStatus('Exporting all 3 sizes…');
  try {
    const results = [];
    for (const key of Object.keys(SIZES)) {
      results.push(await exportSize(key));
      setStatus(`Exported ${results.length} of 3…`);
      await new Promise((r) => setTimeout(r, 350));
    }
    setStatus(`Done — 3 PNGs: ${results.map((r) => `${r.w}×${r.h}`).join(', ')}.`);
    window.__neonExported = results;
  } catch (err) {
    setStatus(`Export failed: ${err.message}`);
  }
}

// --- wiring -----------------------------------------------------------------
function wire() {
  $('addPhotos').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (ev) => {
    onFilesPicked(ev.target.files);
    ev.target.value = '';
  });
  $('loadSamples').addEventListener('click', loadSamples);
  $('fillAll').addEventListener('click', () => {
    if (!state.photos.length) { setStatus('Add a photo first — the samples work too.'); return; }
    pushUndo();
    const count = visiblePanelCount();
    for (let i = 0; i < count; i++) {
      state.panels[i].photo = 0;
      state.panels[i].crop = null;
      state.panels[i].manual = false;
    }
    buildPanelList();
    queueRender();
    setStatus(`Filled ${count} panels with “${state.photos[0].name}”.`);
  });
  $('shufflePhotos').addEventListener('click', () => {
    if (state.photos.length < 2) { setStatus('Add at least two photos to shuffle.'); return; }
    pushUndo();
    const count = visiblePanelCount();
    for (let i = 0; i < count; i++) {
      state.panels[i].photo = (state.panels[i].photo + 1) % state.photos.length;
      state.panels[i].crop = null;
      state.panels[i].manual = false;
    }
    buildPanelList();
    queueRender();
    setStatus('Photos shuffled across panels.');
  });

  const textBind = (id, key) => {
    let snap = null;
    // Snapshot on focus, before the edit: the undo stack must hold the
    // pre-edit state, not the state after the change event fires.
    $(id).addEventListener('focus', () => { snap = snapshot(); });
    $(id).addEventListener('input', () => {
      state[key] = $(id).value;
      queueRender();
    });
    $(id).addEventListener('change', () => {
      if (snap !== null && snap !== snapshot()) {
        undoStack.push(snap);
        if (undoStack.length > 60) undoStack.shift();
        redoStack = [];
        refreshUndoButtons();
      }
      snap = null;
    });
  };
  textBind('captionInput', 'caption');
  textBind('taglineInput', 'tagline');
  textBind('quoteInput', 'quote');
  textBind('ribbonInput', 'ribbon');

  let heatSnap = null;
  $('heatInput').addEventListener('focus', () => { heatSnap = snapshot(); });
  $('heatInput').addEventListener('input', () => {
    state.heat = Number($('heatInput').value);
    $('heatLabel').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    queueRender();
  });
  $('heatInput').addEventListener('change', () => {
    if (heatSnap !== null && heatSnap !== snapshot()) {
      undoStack.push(heatSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack = [];
      refreshUndoButtons();
    }
    heatSnap = null;
  });

  bindToggle('toggleInk', 'ink');
  bindToggle('toggleSmart', 'smart');
  bindToggle('toggleGrain', 'grain');
  bindToggle('toggleVignette', 'vignette');
  bindToggle('toggleHalftone', 'halftone');
  bindToggle('toggleSeal', 'seal');
  bindToggle('toggleBilling', 'billing');

  document.querySelectorAll('#sizePicker .chip-btn').forEach((b) => {
    b.addEventListener('click', () => {
      if (sizeKey === b.dataset.size) return;
      sizeKey = b.dataset.size;
      const size = SIZES[sizeKey];
      stage.width = size.w;
      stage.height = size.h;
      state.panels.forEach((p) => { if (!p.manual) p.crop = null; });
      syncControls();
      queueRender();
      setStatus(`Preview size: ${size.label}.`);
    });
  });

  $('exportOne').addEventListener('click', async () => {
    if (!state.photos.length) { setStatus('Add a photo first — the samples work too.'); return; }
    setStatus('Exporting…');
    try {
      const r = await exportSize(sizeKey);
      setStatus(`Exported ${r.w}×${r.h} PNG (${Math.round(r.bytes / 1024)} KiB).`);
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    }
  });
  $('exportAll').addEventListener('click', exportAll);

  $('undoBtn').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    refreshUndoButtons();
    setStatus('Undid.');
  });
  $('redoBtn').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    refreshUndoButtons();
    setStatus('Redid.');
  });

  document.addEventListener('keydown', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    if (ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      $('undoBtn').click();
    } else if ((ev.key.toLowerCase() === 'z' && ev.shiftKey) || ev.key.toLowerCase() === 'y') {
      ev.preventDefault();
      $('redoBtn').click();
    }
  });
}

// --- shot mode (screenshots) -------------------------------------------------
async function applyShot() {
  shot = readShot();
  if (!shot) return false;
  if (shot.caption) state.caption = shot.caption;
  if (shot.tagline !== undefined) state.tagline = shot.tagline;
  if (shot.quote !== undefined) state.quote = shot.quote;
  if (shot.layout) state.layout = shot.layout;
  if (shot.grade) state.grade = shot.grade;
  if (shot.ink !== undefined) state.ink = shot.ink;
  if (shot.photo) {
    const file = shot.photo === 'pier' ? 'samples/pier.jpg' : 'samples/boulevard.jpg';
    const name = shot.photo === 'pier' ? 'Pier' : 'Boulevard';
    await loadSample(name, file);
    // Second photo in the other sample for multi-panel shots.
    if (shot.photo2) {
      const file2 = shot.photo2 === 'pier' ? 'samples/pier.jpg' : 'samples/boulevard.jpg';
      await loadSample(shot.photo2 === 'pier' ? 'Pier' : 'Boulevard', file2);
    }
    // Spread the loaded photos across the panels.
    const count = visiblePanelCount();
    for (let i = 0; i < count; i++) {
      state.panels[i].photo = state.photos.length > 1 ? i % state.photos.length : 0;
      state.panels[i].crop = null;
      state.panels[i].manual = false;
    }
  }
  if (shot.mode === 'cover') {
    document.body.classList.add('shot-cover');
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
  }
  syncControls();
  buildPanelList();
  return true;
}

// --- init -------------------------------------------------------------------
async function init() {
  wire();
  syncControls();
  buildPanelList();
  await applyShot();
  // Fonts load async; redraw once they arrive so canvas lettering is real.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => queueRender());
    try {
      await Promise.all([
        document.fonts.load('80px Anton'),
        document.fonts.load('40px Pacifico'),
      ]);
    } catch { /* fall back to system fonts */ }
  }
  queueRender();
  // Small test hook: the verification driver reads these, the app never shows them.
  window.__neon = {
    get state() { return state; },
    get sizeKey() { return sizeKey; },
    exportSize,
    exportAll,
    render: () => { queueRender(); return true; },
  };
  window.__shotReady = true;
}

init();
