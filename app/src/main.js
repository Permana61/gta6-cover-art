// Neon Coast Cover Studio — editor wiring (round 3).
// Uploads the user's own photos (read locally with FileReader, never sent
// anywhere), crops and positions each panel by drag / wheel / slider, fills
// several panels from one photo or several, edits the caption, subtitle,
// tagline, badge and heat meter, picks layout and grade, tags each panel
// with a crew role, toggles face-aware smart crop and Poster Ink, adds
// poster furniture (billing block, seal, quote bar), exports one PNG or
// all three post sizes in one click, and keeps undo/redo for 60 steps.
import { drawCover, layoutPanels, panelCount, LAYOUTS, GRADES, SIZES, ROLE_PRESETS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const captionInput = $('caption');
const subtitleInput = $('subtitle');
const taglineInput = $('tagline');
const badgeInput = $('badge');
const billingInput = $('billing');
const sealInput = $('seal');
const quoteInput = $('quote');
const statusEl = $('status');
const filmstrip = $('filmstrip');
const panelLabel = $('panelLabel');
const zoomRange = $('zoomRange');
const roleSelect = $('roleSelect');
const smartCropToggle = $('smartCropToggle');
const inkToggle = $('inkToggle');
const popoutToggle = $('popoutToggle');

const SAMPLE_PHOTOS = ['samples/boulevard.jpg', 'samples/pier.jpg'];

let photos = []; // [{ id, img, name }]
let photoSeq = 0;
let selectedPhoto = 0; // index into photos, or -1
let selectedPanel = 0;
let dragging = null; // { x, y, dx, dy } while pointer-dragging a panel

const state = {
  layout: 'hero',
  grade: 'sunset',
  caption: 'NEON COAST',
  subtitle: 'chase the sunset',
  tagline: 'LEONIDA · 2026',
  badge: 'COVER STAR',
  wanted: 5,
  size: '1080x1080',
  ink: false,
  popout: true,
  billing: 'A NEON COAST PRODUCTION · STARRING YOU · IN CINEMAS SOON',
  seal: 'VICE CITY',
  quote: '',
  slots: defaultSlots('hero'),
};

function defaultSlots(layout) {
  return Array.from({ length: panelCount(layout) }, () => ({
    photo: -1, zoom: 1, dx: 0, dy: 0, role: '', smartCrop: false, ink: false,
  }));
}

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subtitle: state.subtitle,
    tagline: state.tagline,
    badge: state.badge,
    wanted: state.wanted,
    size: state.size,
    ink: state.ink,
    popout: state.popout,
    billing: state.billing,
    seal: state.seal,
    quote: state.quote,
    slots: state.slots,
  });
}

const history = { past: [], future: [] };

function pushHistory() {
  history.past.push(snapshot());
  if (history.past.length > 60) history.past.shift();
  history.future.length = 0;
  syncUndoButtons();
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.slots = s.slots.map((slot) => ({ ...slot }));
  syncControls();
  redraw();
}

function undo() {
  if (!history.past.length) return;
  history.future.push(snapshot());
  restore(history.past.pop());
  syncUndoButtons();
}

function redo() {
  if (!history.future.length) return;
  history.past.push(snapshot());
  restore(history.future.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undoBtn').disabled = history.past.length === 0;
  $('redoBtn').disabled = history.future.length === 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

/** Procedural stand-in photo (sunset gradient + sun) used only if a sample file is missing. */
function proceduralPhoto(seed) {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1080;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 1080);
  sky.addColorStop(0, seed % 2 ? '#ff9a3c' : '#ff2ea6');
  sky.addColorStop(0.55, '#c22a7a');
  sky.addColorStop(1, '#2b0f45');
  g.fillStyle = sky;
  g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = '#fff3c4';
  g.beginPath();
  g.arc(540, 430, 150, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(20,8,31,0.6)';
  for (let i = 0; i < 5; i++) g.fillRect(0, 660 + i * 70, 1080, 22);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.font = "bold 64px Anton, 'Arial Black', sans-serif";
  g.textAlign = 'center';
  g.fillText('NEON COAST', 540, 980);
  return c;
}

async function loadSamples() {
  for (let i = 0; i < SAMPLE_PHOTOS.length; i++) {
    try {
      const img = await loadImage(SAMPLE_PHOTOS[i]);
      addPhoto(img, SAMPLE_PHOTOS[i].split('/').pop());
    } catch {
      addPhoto(proceduralPhoto(i), `sample-${i + 1}`);
    }
  }
  // Default fill: alternate the two samples across the panels.
  state.slots.forEach((slot, i) => {
    slot.photo = photos.length ? i % photos.length : -1;
    slot.smartCrop = true;
    slot.ink = state.ink;
  });
  selectedPhoto = 0;
  renderFilmstrip();
  redraw();
}

function addPhoto(img, name) {
  photos.push({ id: photoSeq++, img, name });
  return photos.length - 1;
}

/** Reads user-picked files locally with FileReader; nothing is uploaded. */
function onFilesPicked(files) {
  const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  let pending = list.length;
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = await loadImage(reader.result);
        const idx = addPhoto(img, file.name);
        selectedPhoto = idx;
        renderFilmstrip();
        redraw();
        setStatus(`Loaded ${file.name}`);
      } catch {
        setStatus(`Could not read ${file.name}`);
      }
      if (--pending === 0) $('photoInput').value = '';
    };
    reader.onerror = () => {
      setStatus(`Could not read ${file.name}`);
      if (--pending === 0) $('photoInput').value = '';
    };
    reader.readAsDataURL(file);
  });
}

function renderFilmstrip() {
  filmstrip.innerHTML = '';
  photos.forEach((p, i) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'thumb' + (i === selectedPhoto ? ' selected' : '');
    thumb.title = `${p.name} — click to select, then "Use in panel"`;
    const img = document.createElement('img');
    img.src = p.img instanceof HTMLCanvasElement ? p.img.toDataURL('image/png') : p.img.src;
    img.alt = p.name;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => {
      selectedPhoto = i;
      renderFilmstrip();
    });
    thumb.addEventListener('dblclick', () => usePhotoInSelectedPanel());
    filmstrip.appendChild(thumb);
  });
  const empty = document.createElement('span');
  empty.className = 'filmstrip-hint';
  empty.textContent = photos.length ? 'Click a photo, then “Use in panel”. Double-click fills the selected panel.' : 'No photos yet — add your own or use the samples.';
  filmstrip.appendChild(empty);
}

function coverOpts() {
  return {
    photos: photos.map((p) => p.img),
    slots: state.slots,
    layout: state.layout,
    grade: state.grade,
    caption: state.caption,
    subtitle: state.subtitle,
    tagline: state.tagline,
    badge: state.badge,
    wanted: state.wanted,
    ink: state.ink,
    popout: state.popout,
    billing: state.billing,
    seal: state.seal,
    quote: state.quote,
  };
}

function redraw() {
  const size = SIZES[state.size] || SIZES['1080x1080'];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, coverOpts());
  updatePanelLabel();
}

function updatePanelLabel() {
  const slot = state.slots[selectedPanel];
  const name = slot && slot.photo >= 0 && photos[slot.photo] ? photos[slot.photo].name : 'empty';
  const role = slot && slot.role ? ` · ${slot.role}` : '';
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${state.slots.length} · ${name} · zoom ${((slot && slot.zoom) || 1).toFixed(2)}×${role}`;
  if (slot) {
    zoomRange.value = String(Math.round(((slot.zoom || 1) - 1) * 100));
    roleSelect.value = slot.role || '';
    smartCropToggle.checked = !!slot.smartCrop;
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function syncControls() {
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  taglineInput.value = state.tagline;
  badgeInput.value = state.badge;
  billingInput.value = state.billing;
  sealInput.value = state.seal;
  quoteInput.value = state.quote;
  inkToggle.checked = state.ink;
  popoutToggle.checked = state.popout;
  $('wantedRange').value = String(state.wanted);
  $('wantedValue').textContent = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
  $('sizeSelect').value = state.size;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  selectedPanel = Math.min(selectedPanel, state.slots.length - 1);
  updatePanelLabel();
}

function setLayout(layout) {
  if (!LAYOUTS[layout] || layout === state.layout) return;
  pushHistory();
  const old = state.slots;
  state.layout = layout;
  state.slots = defaultSlots(layout);
  // Keep each panel's photo, role and crop where a same-index panel exists.
  state.slots.forEach((slot, i) => {
    if (old[i]) {
      slot.photo = old[i].photo;
      slot.role = old[i].role || '';
      slot.smartCrop = !!old[i].smartCrop;
      slot.zoom = old[i].zoom || 1;
      slot.dx = old[i].dx || 0;
      slot.dy = old[i].dy || 0;
    }
  });
  selectedPanel = 0;
  syncControls();
  redraw();
}

function setGrade(grade) {
  if (!GRADES[grade] || grade === state.grade) return;
  pushHistory();
  state.grade = grade;
  syncControls();
  redraw();
}

function usePhotoInSelectedPanel() {
  if (selectedPhoto < 0 || !photos[selectedPhoto]) {
    setStatus('Pick a photo first.');
    return;
  }
  pushHistory();
  state.slots[selectedPanel] = {
    photo: selectedPhoto, zoom: 1, dx: 0, dy: 0,
    role: state.slots[selectedPanel].role || '', smartCrop: true, ink: state.ink,
  };
  redraw();
  setStatus(`Panel ${selectedPanel + 1} ← ${photos[selectedPhoto].name}`);
}

function fillAllWithPhoto() {
  if (selectedPhoto < 0 || !photos[selectedPhoto]) {
    setStatus('Pick a photo first.');
    return;
  }
  pushHistory();
  state.slots.forEach((slot) => {
    slot.photo = selectedPhoto;
    slot.zoom = 1;
    slot.dx = 0;
    slot.dy = 0;
    slot.smartCrop = true;
    slot.ink = state.ink;
  });
  redraw();
  setStatus(`All panels ← ${photos[selectedPhoto].name}`);
}

function clearSelectedPanel() {
  pushHistory();
  state.slots[selectedPanel] = { photo: -1, zoom: 1, dx: 0, dy: 0, role: '', smartCrop: false, ink: state.ink };
  redraw();
}

/** Hit-tests a point on the preview canvas (CSS pixels) to a panel index. */
function hitPanel(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    let px = x - cx;
    let py = y - cy;
    if (r.rot) {
      const c = Math.cos(-r.rot);
      const s = Math.sin(-r.rot);
      const rx = px * c - py * s;
      const ry = px * s + py * c;
      px = rx;
      py = ry;
    }
    if (Math.abs(px) <= r.w / 2 && Math.abs(py) <= r.h / 2) return i;
  }
  return -1;
}

function bindCanvas() {
  canvas.addEventListener('pointerdown', (e) => {
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit < 0) return;
    selectedPanel = hit;
    canvas.setPointerCapture(e.pointerId);
    dragging = { x: e.clientX, y: e.clientY, dx: state.slots[hit].dx, dy: state.slots[hit].dy };
    updatePanelLabel();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const slot = state.slots[selectedPanel];
    const panel = layoutPanels(state.layout, canvas.width, canvas.height)[selectedPanel];
    slot.dx = dragging.dx + ((e.clientX - dragging.x) / rect.width) * (canvas.width / panel.w);
    slot.dy = dragging.dy + ((e.clientY - dragging.y) / rect.height) * (canvas.height / panel.h);
    slot.dx = Math.max(-0.6, Math.min(0.6, slot.dx));
    slot.dy = Math.max(-0.6, Math.min(0.6, slot.dy));
    redraw();
  });
  const endDrag = () => {
    if (dragging) {
      pushHistory();
      dragging = null;
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.slots[selectedPanel];
    if (!slot) return;
    slot.zoom = Math.max(1, Math.min(3, (slot.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
    redraw();
    updatePanelLabel();
  }, { passive: false });
}

function downloadCanvas(off, size) {
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — try again.');
        resolve(false);
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(true);
    }, 'image/png');
  });
}

function renderSize(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, coverOpts());
  return { off, size };
}

async function exportPNG() {
  const { off, size } = renderSize(state.size);
  const ok = await downloadCanvas(off, size);
  if (ok) setStatus(`Saved neon-coast-cover-${size.w}x${size.h}.png`);
}

/** Exports all three post sizes in one click. */
async function exportAllPNG() {
  const keys = Object.keys(SIZES);
  let saved = 0;
  for (const key of keys) {
    const { off, size } = renderSize(key);
    if (await downloadCanvas(off, size)) saved++;
    // A short pause between downloads so the browser keeps all three.
    await new Promise((r) => setTimeout(r, 250));
  }
  setStatus(saved === keys.length ? `Saved all ${saved} sizes.` : `Saved ${saved} of ${keys.length} sizes.`);
}

function bindControls() {
  $('photoInput').addEventListener('change', (e) => onFilesPicked(e.target.files));
  $('addPhotoBtn').addEventListener('click', () => $('photoInput').click());
  $('useInPanelBtn').addEventListener('click', usePhotoInSelectedPanel);
  $('fillAllBtn').addEventListener('click', fillAllWithPhoto);
  $('clearPanelBtn').addEventListener('click', clearSelectedPanel);
  zoomRange.addEventListener('input', () => {
    const slot = state.slots[selectedPanel];
    if (!slot) return;
    slot.zoom = 1 + Number(zoomRange.value) / 100;
    redraw();
    updatePanelLabel();
  });
  zoomRange.addEventListener('change', pushHistory);
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.addEventListener('click', () => setLayout(b.dataset.layout));
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => setGrade(b.dataset.grade));
  });
  roleSelect.addEventListener('change', () => {
    const slot = state.slots[selectedPanel];
    if (!slot) return;
    pushHistory();
    slot.role = roleSelect.value;
    redraw();
    updatePanelLabel();
  });
  smartCropToggle.addEventListener('change', () => {
    const slot = state.slots[selectedPanel];
    if (!slot) return;
    pushHistory();
    slot.smartCrop = smartCropToggle.checked;
    redraw();
    updatePanelLabel();
  });
  inkToggle.addEventListener('change', () => {
    pushHistory();
    state.ink = inkToggle.checked;
    state.slots.forEach((slot) => { slot.ink = state.ink; });
    redraw();
  });
  popoutToggle.addEventListener('change', () => {
    pushHistory();
    state.popout = popoutToggle.checked;
    redraw();
  });
  captionInput.addEventListener('input', () => {
    state.caption = captionInput.value;
    redraw();
  });
  captionInput.addEventListener('change', pushHistory);
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value;
    redraw();
  });
  subtitleInput.addEventListener('change', pushHistory);
  taglineInput.addEventListener('input', () => {
    state.tagline = taglineInput.value;
    redraw();
  });
  taglineInput.addEventListener('change', pushHistory);
  badgeInput.addEventListener('input', () => {
    state.badge = badgeInput.value;
    redraw();
  });
  badgeInput.addEventListener('change', pushHistory);
  billingInput.addEventListener('input', () => {
    state.billing = billingInput.value;
    redraw();
  });
  billingInput.addEventListener('change', pushHistory);
  sealInput.addEventListener('input', () => {
    state.seal = sealInput.value;
    redraw();
  });
  sealInput.addEventListener('change', pushHistory);
  quoteInput.addEventListener('input', () => {
    state.quote = quoteInput.value;
    redraw();
  });
  quoteInput.addEventListener('change', pushHistory);
  $('wantedRange').addEventListener('input', () => {
    state.wanted = Number($('wantedRange').value);
    $('wantedValue').textContent = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
    redraw();
  });
  $('wantedRange').addEventListener('change', pushHistory);
  $('sizeSelect').addEventListener('change', () => {
    pushHistory();
    state.size = $('sizeSelect').value;
    redraw();
  });
  $('exportBtn').addEventListener('click', exportPNG);
  $('exportAllBtn').addEventListener('click', exportAllPNG);
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
  bindCanvas();
}

/** Applies a fixed screenshot scene (called by shots.js). */
async function applyScene(scene) {
  if (scene.size) state.size = scene.size;
  if (scene.layout) {
    state.layout = scene.layout;
    state.slots = defaultSlots(scene.layout);
  }
  if (scene.caption !== undefined) state.caption = scene.caption;
  if (scene.subtitle !== undefined) state.subtitle = scene.subtitle;
  if (scene.tagline !== undefined) state.tagline = scene.tagline;
  if (scene.badge !== undefined) state.badge = scene.badge;
  if (scene.billing !== undefined) state.billing = scene.billing;
  if (scene.seal !== undefined) state.seal = scene.seal;
  if (scene.quote !== undefined) state.quote = scene.quote;
  if (scene.grade) state.grade = scene.grade;
  if (scene.wanted) state.wanted = scene.wanted;
  if (scene.ink !== undefined) state.ink = scene.ink;
  if (scene.popout !== undefined) state.popout = scene.popout;
  if (scene.photos) {
    photos = [];
    photoSeq = 0;
    for (const url of scene.photos) {
      try {
        addPhoto(await loadImage(url), url.split('/').pop());
      } catch {
        addPhoto(proceduralPhoto(photos.length), 'sample');
      }
    }
    const mode = scene.fill || 'alternate';
    state.slots.forEach((slot, i) => {
      if (!photos.length) {
        slot.photo = -1;
      } else if (mode === 'first') {
        slot.photo = 0;
      } else {
        slot.photo = i % photos.length;
      }
      slot.smartCrop = scene.smartCrop !== false;
      slot.ink = state.ink;
      if (scene.roles && scene.roles[i]) slot.role = scene.roles[i];
    });
  }
  try {
    await document.fonts.ready;
  } catch {
    // Fonts are a progressive enhancement; the cover still draws.
  }
  syncControls();
  renderFilmstrip();
  redraw();
}

async function start() {
  bindControls();
  syncControls();
  syncUndoButtons();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, {
      applyScene,
      ready() {
        window.__shotReady = true;
      },
    });
  } else {
    await loadSamples();
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font load failures; fallback fonts still draw.
    }
    redraw();
  }
}

start();
