// Neon Coast Cover Studio — cover renderer.
// Draws the whole poster on a 2D canvas: sky, photo panels, pop-out hero,
// striped retro-chrome title, cast tags, billing, seal, quote, heat and grain.
// Every effect is computed here from the state; nothing is fetched at run time.

export const GRADES = [
  { id: 'sunset', name: 'Sunset', desc: 'Sunset — warm orange-pink dusk.',
    sky: ['#2b1055', '#ff7a18', '#ff2e88'], wash: ['#ff7a18', '#ff2e88'], chrome: ['#fff6c9', '#ffc93c', '#ff7a18', '#ff2e88'] },
  { id: 'neon', name: 'Neon', desc: 'Neon — hot pink and electric teal night.',
    sky: ['#0b0221', '#7b2fff', '#ff2e88'], wash: ['#19e3d6', '#ff2e88'], chrome: ['#d8fff9', '#19e3d6', '#7b2fff', '#ff2e88'] },
  { id: 'gold', name: 'Gold Hour', desc: 'Gold Hour — honey light, long shadows.',
    sky: ['#3d1e05', '#ffb347', '#ffdf8a'], wash: ['#ffb347', '#ffdf8a'], chrome: ['#fffbe0', '#ffd76a', '#ff9d00', '#b96a00'] },
  { id: 'noir', name: 'Mono Noir', desc: 'Mono Noir — black and white, hard contrast.',
    sky: ['#000000', '#3a3a3a', '#8a8a8a'], wash: ['#ffffff', '#777777'], chrome: ['#ffffff', '#cfcfcf', '#777777', '#222222'] },
  { id: 'twilight', name: 'Twilight', desc: 'Twilight — violet dusk fading to blue.',
    sky: ['#12082e', '#5b2a86', '#2a4d8f'], wash: ['#7b2fff', '#2a4d8f'], chrome: ['#efe6ff', '#b388ff', '#5b2a86', '#2a4d8f'] },
  { id: 'vicepink', name: 'Vice Pink', desc: 'Vice Pink — bubblegum pink over palm purple.',
    sky: ['#3d0a3d', '#ff5da2', '#ff9ecf'], wash: ['#ff5da2', '#ff9ecf'], chrome: ['#fff0f7', '#ff9ecf', '#ff2e88', '#7b2fff'] },
  { id: 'tealheat', name: 'Teal Heat', desc: 'Teal Heat — turquoise sea against hot sand.',
    sky: ['#03252b', '#0e7c7b', '#ffc93c'], wash: ['#19e3d6', '#ffc93c'], chrome: ['#e6fffa', '#19e3d6', '#0e7c7b', '#ffc93c'] },
  { id: 'mono', name: 'Mono', desc: 'Mono — single-hue duotone, cool grey.',
    sky: ['#0e0e14', '#2c2c3a', '#565664'], wash: ['#9aa0b5', '#565664'], chrome: ['#ffffff', '#c9cede', '#565664', '#1c1c26'] },
];

export const ROLES = [
  'The Driver', 'The Hacker', 'The Lookout', 'The Muscle',
  'The Queen', 'The Wheelman', 'The Fixer', 'The Inside Man', 'The Rookie',
];

// A panel rect is fractions of the art area: {x, y, w, h, hero, rot}.
// The art area is the canvas minus the title band at the bottom.
export const LAYOUTS = [
  { id: 'hero', name: 'Hero + 3', art: () => ([
    { x: 0.00, y: 0.00, w: 0.615, h: 1.00, hero: true },
    { x: 0.63, y: 0.00, w: 0.37, h: 0.32 },
    { x: 0.63, y: 0.34, w: 0.37, h: 0.32 },
    { x: 0.63, y: 0.68, w: 0.37, h: 0.32 },
  ]) },
  { id: 'grid4', name: 'Grid of 4', art: () => ([
    { x: 0.00, y: 0.00, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0.00, w: 0.49, h: 0.49 },
    { x: 0.00, y: 0.51, w: 0.49, h: 0.49 },
    { x: 0.51, y: 0.51, w: 0.49, h: 0.49 },
  ]) },
  { id: 'grid9', name: 'Grid of 9', art: () => {
    const out = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      out.push({ x: c * 0.34, y: r * 0.34, w: 0.32, h: 0.32, hero: r === 1 && c === 1 });
    return out;
  } },
  { id: 'fullbleed', name: 'Full Bleed', full: true, art: () => ([
    { x: 0, y: 0, w: 1, h: 1, hero: true },
  ]) },
  { id: 'tilted', name: 'Tilted Snaps', art: () => ([
    { x: 0.03, y: 0.06, w: 0.42, h: 0.80, rot: -6 },
    { x: 0.31, y: 0.02, w: 0.42, h: 0.86, hero: true, rot: 2 },
    { x: 0.58, y: 0.08, w: 0.40, h: 0.78, rot: 5 },
  ]) },
  { id: 'cast7', name: '7-Panel Cast', art: () => ([
    { x: 0.00, y: 0.00, w: 0.28, h: 0.32 },
    { x: 0.00, y: 0.34, w: 0.28, h: 0.32 },
    { x: 0.00, y: 0.68, w: 0.28, h: 0.32 },
    { x: 0.30, y: 0.04, w: 0.40, h: 0.92, hero: true },
    { x: 0.72, y: 0.00, w: 0.28, h: 0.32 },
    { x: 0.72, y: 0.34, w: 0.28, h: 0.32 },
    { x: 0.72, y: 0.68, w: 0.28, h: 0.32 },
  ]) },
  { id: 'duo', name: 'Duo', art: () => ([
    { x: 0.00, y: 0.00, w: 0.49, h: 1.00, hero: true },
    { x: 0.51, y: 0.00, w: 0.49, h: 1.00 },
  ]) },
  { id: 'triptych', name: 'Triptych', art: () => ([
    { x: 0.00, y: 0.04, w: 0.32, h: 0.92 },
    { x: 0.34, y: 0.00, w: 0.32, h: 1.00, hero: true },
    { x: 0.68, y: 0.04, w: 0.32, h: 0.92 },
  ]) },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// --- face-aware smart crop -------------------------------------------------
// Saliency grid: skin-tone warmth plus local contrast, scored on a small
// downscaled copy. The best window for a target aspect keeps faces in frame.
const saliencyCache = new Map();

function saliencyGrid(img) {
  const key = img.dataset ? img.dataset.saliencyKey : null;
  if (key && saliencyCache.has(key)) return saliencyCache.get(key);
  const gw = 48, gh = 36;
  const cv = document.createElement('canvas');
  cv.width = gw; cv.height = gh;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0, gw, gh);
  const d = c.getImageData(0, 0, gw, gh).data;
  const lum = new Float32Array(gw * gh);
  const skin = new Float32Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    // Warm skin: red clearly above green and blue, mid brightness.
    const warm = (r > g + 12 && r > b + 20 && r > 70 && r < 245) ? 1 : 0;
    skin[i] = warm * (1 - Math.abs(r - 185) / 185);
  }
  const score = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const i = y * gw + x;
    const l = lum[i];
    const lx = lum[y * gw + Math.min(gw - 1, x + 1)] - lum[y * gw + Math.max(0, x - 1)];
    const ly = lum[Math.min(gh - 1, y + 1) * gw + x] - lum[Math.max(0, y - 1) * gw + x];
    const contrast = Math.min(1, (Math.abs(lx) + Math.abs(ly)) / 90);
    // Faces live near the top of a photo; weight the saliency so the
    // window climbs toward them instead of settling on a bare torso.
    // Contrast outweighs bare skin here on purpose: a face (eyes, smile,
    // sunglasses, hat brim) is busy, a torso is smooth skin, and a crop
    // that chases skin alone ends up framing a chest instead of a face.
    const topBias = 1.35 - (y / (gh - 1)) * 0.7;
    score[i] = (skin[i] * 1.2 + contrast * 1.6 + 0.08) * topBias;
    void l;
  }
  const grid = { gw, gh, score };
  if (key) saliencyCache.set(key, grid);
  return grid;
}

// Integral image over the saliency grid, for fast window sums.
function integral(grid) {
  const { gw, gh, score } = grid;
  const integ = new Float32Array((gw + 1) * (gh + 1));
  for (let y = 0; y < gh; y++) {
    let row = 0;
    for (let x = 0; x < gw; x++) {
      row += score[y * gw + x];
      integ[(y + 1) * (gw + 1) + x + 1] = integ[y * (gw + 1) + x + 1] + row;
    }
  }
  return integ;
}

function windowSum(integ, gw, x0, y0, x1, y1) {
  return integ[y1 * (gw + 1) + x1] - integ[y0 * (gw + 1) + x1]
    - integ[y1 * (gw + 1) + x0] + integ[y0 * (gw + 1) + x0];
}

// Pick the best crop window (normalised {x, y, w, h}) for `aspect` (w/h).
export function smartCropWindow(img, aspect) {
  const grid = saliencyGrid(img);
  const { gw, gh } = grid;
  const integ = integral(grid);
  let best = null;
  // Try three window heights; smaller windows zoom in, larger stay wide.
  for (const frac of [1.0, 0.82, 0.66]) {
    let wh = Math.max(6, Math.round(gh * frac));
    let ww = Math.round(wh * aspect * (gw / gh));
    if (ww > gw) { ww = gw; wh = Math.max(6, Math.round(ww / aspect * (gh / gw))); }
    if (ww < 4 || wh < 4) continue;
    for (let y = 0; y + wh <= gh; y++) {
      for (let x = 0; x + ww <= gw; x++) {
        const sum = windowSum(integ, gw, x, y, x + ww, y + wh);
        const density = sum / (ww * wh);
        // Prefer dense windows, but a small window must be far denser to
        // win, or every crop zooms into one shoulder and loses the face.
        const value = density * frac * frac;
        if (!best || value > best.value) best = { value, x, y, ww, wh };
      }
    }
  }
  if (!best) return { x: 0, y: 0, w: 1, h: 1 };
  return {
    x: best.x / gw,
    y: best.y / gh,
    w: best.ww / gw,
    h: best.wh / gh,
  };
}

// Default centre window for an aspect: the full image cropped to fit.
export function centreWindow(img, aspect) {
  const ia = img.naturalWidth / img.naturalHeight;
  if (ia > aspect) {
    const w = aspect / ia;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }
  const h = ia / aspect;
  return { x: 0, y: (1 - h) / 2, w: 1, h };
}

// --- Poster Ink ------------------------------------------------------------
// Painted look: posterize to few levels, then darken Sobel edges. Cached per
// photo so toggling the grade does not rebuild it.
const inkCache = new Map();

export function inkedImage(img) {
  const key = img.dataset ? img.dataset.saliencyKey : null;
  if (key && inkCache.has(key)) return inkCache.get(key);
  const w = Math.min(720, img.naturalWidth);
  const h = Math.round((w / img.naturalWidth) * img.naturalHeight);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0, w, h);
  const data = c.getImageData(0, 0, w, h);
  const px = data.data;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    // Posterize each channel to 7 levels (gentler than 5: keeps faces photographic).
    px[i * 4] = Math.round(r / 36) * 36;
    px[i * 4 + 1] = Math.round(g / 36) * 36;
    px[i * 4 + 2] = Math.round(b / 36) * 36;
  }
  // Sobel edge darkening.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -lum[i - w - 1] - 2 * lum[i - 1] - lum[i + w - 1]
        + lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1];
      const gy = -lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1]
        + lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1];
      const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 260);
      if (edge > 0.4) {
        const f = 1 - (edge - 0.4) * 0.45;
        px[i * 4] *= f; px[i * 4 + 1] *= f; px[i * 4 + 2] *= f;
      }
    }
  }
  c.putImageData(data, 0, 0);
  if (key) inkCache.set(key, cv);
  return cv;
}

// --- drawing helpers -------------------------------------------------------

// Deterministic grain tile (fixed seed, so two renders are identical).
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const cv = document.createElement('canvas');
  cv.width = 140; cv.height = 140;
  const c = cv.getContext('2d');
  const data = c.createImageData(140, 140);
  let seed = 20261121;
  const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(next() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  grainTile = cv;
  return cv;
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// Striped retro-chrome title: extrusion, chrome gradient, diagonal stripes
// clipped to the letterforms, white keyline. Drawn via an offscreen layer
// so the stripes only land inside the letters.
function drawChromeTitle(ctx, text, cx, topY, maxW, startPx, chrome) {
  // The tagline draws centred and the role tags draw left-aligned, so the
  // alignment left over on this context is unpredictable: pin it here,
  // or the extrusion and keyline centre on x0 and slide half a title left.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const px = fitFont(ctx, text, maxW, startPx, 'Anton, sans-serif');
  ctx.font = `${px}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const x0 = cx - tw / 2;
  const depth = Math.max(4, Math.round(px * 0.09));
  // Extrusion: stacked dark copies stepping down-right.
  ctx.textBaseline = 'top';
  for (let d = depth; d >= 1; d--) {
    ctx.fillStyle = d % 2 ? '#1a0518' : '#3d0a2e';
    ctx.fillText(text, x0 + d, topY + d);
  }
  // Letterforms on an offscreen layer.
  const layer = document.createElement('canvas');
  const pad = depth + 4;
  layer.width = Math.ceil(tw) + pad * 2;
  layer.height = Math.ceil(px * 1.25) + pad * 2;
  const l = layer.getContext('2d');
  l.font = `${px}px Anton, sans-serif`;
  l.textBaseline = 'top';
  l.fillStyle = '#fff';
  l.fillText(text, pad, pad);
  l.globalCompositeOperation = 'source-in';
  const grad = l.createLinearGradient(0, 0, 0, layer.height);
  const stops = chrome.length;
  chrome.forEach((col, i) => grad.addColorStop(i / (stops - 1), col));
  l.fillStyle = grad;
  l.fillRect(0, 0, layer.width, layer.height);
  // Diagonal stripes over the chrome.
  l.globalCompositeOperation = 'source-atop';
  const stripe = Math.max(5, Math.round(px * 0.09));
  l.fillStyle = 'rgba(255,255,255,0.38)';
  for (let sx = -layer.height; sx < layer.width + layer.height; sx += stripe * 2) {
    l.beginPath();
    l.moveTo(sx, 0);
    l.lineTo(sx + stripe, 0);
    l.lineTo(sx + stripe - layer.height, layer.height);
    l.lineTo(sx - layer.height, layer.height);
    l.closePath();
    l.fill();
  }
  l.globalCompositeOperation = 'source-over';
  ctx.drawImage(layer, x0 - pad, topY - pad);
  // White keyline around the letters.
  ctx.lineWidth = Math.max(2, px * 0.035);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.strokeText(text, x0, topY);
  return px;
}

function drawCircularText(ctx, text, cx, cy, radius, startAngle, colour, px) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.font = `${px}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = (Math.PI * 2) / text.length;
  for (let i = 0; i < text.length; i++) {
    const a = startAngle + i * step;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawPhotoInto(ctx, img, crop, rx, ry, rw, rh) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  ctx.drawImage(img, crop.x * iw, crop.y * ih, crop.w * iw, crop.h * ih, rx, ry, rw, rh);
}

function drawPanelPhoto(ctx, photo, crop, rect, grade, useInk, px) {
  if (!photo || !photo.img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#3a2350');
    g.addColorStop(1, '#12081d');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(244,233,216,0.75)';
    ctx.font = `${Math.max(12, Math.round(px * 0.32))}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  const src = useInk ? inkedImage(photo.img) : photo.img;
  drawPhotoInto(ctx, src, crop, rect.x, rect.y, rect.w, rect.h);
  // Colour grade wash: light enough that faces stay photographic.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = grade.wash[0];
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Bottom shade so the role tag stays legible.
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.55, rect.w, rect.h * 0.45);
}

function drawRoleTag(ctx, role, x, y, px) {
  ctx.font = `${px}px Anton, sans-serif`;
  const tw = ctx.measureText(role).width;
  const padX = px * 0.55;
  const h = px * 1.7;
  ctx.fillStyle = 'rgba(10,4,18,0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, tw + padX * 2, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffc93c';
  ctx.lineWidth = Math.max(1.5, px * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#ffc93c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, x + padX, y + h / 2 + px * 0.04);
  return tw + padX * 2;
}

// --- the cover -------------------------------------------------------------

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080; // scale unit: 1 at 1080 wide
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  const aspect = W / H;

  // Sky behind everything.
  const sky = ctx.createLinearGradient(0, 0, W * 0.25, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Title band height by aspect: wide covers need more room for the title.
  const titleFrac = layout.full ? 0 : aspect > 1.2 ? 0.30 : aspect < 0.9 ? 0.22 : 0.24;
  const artH = H * (1 - titleFrac);
  const artW = W;

  const rects = layout.art().map((r) => ({
    x: r.x * artW,
    y: r.y * artH,
    w: r.w * artW,
    h: r.h * artH,
    hero: !!r.hero,
    rot: r.rot || 0,
  }));
  const panels = rects.map((r, i) => ({ rect: r, panel: state.panels[i] || null, index: i }));

  function paintPanel(entry, popOut) {
    const { rect, panel } = entry;
    ctx.save();
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    let rw = rect.w;
    let rh = rect.h;
    if (popOut) { rw = rect.w * 1.09; rh = rect.h * 1.09; }
    let x = cx - rw / 2;
    let y = cy - rh / 2;
    if (popOut) {
      // Pop over neighbours and dip into the title band, but never past
      // the canvas edges, or the hero's role tag gets clipped off-frame.
      const maxY = artH + (H - artH) * 0.5;
      if (x < 0) { rw += x; x = 0; }
      if (y < 0) { rh += y; y = 0; }
      if (x + rw > W) rw = W - x;
      if (y + rh > maxY) rh = maxY - y;
    }
    ctx.translate(cx, cy);
    if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    if (popOut) {
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 34 * u;
      ctx.shadowOffsetY = 14 * u;
    }
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.fillStyle = '#12081d';
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (panel && panel.photo >= 0 && state.photos[panel.photo]) {
      const photo = state.photos[panel.photo];
      const crop = panel.crop || centreWindow(photo.img, rw / rh);
      drawPanelPhoto(ctx, photo, crop, { x, y, w: rw, h: rh }, grade, state.ink, 16 * u);
      const tagPx = Math.max(11, Math.round(15 * u * Math.min(1.4, rw / (300 * u))));
      if (panel.role) drawRoleTag(ctx, panel.role, x + 10 * u, y + rh - 10 * u - tagPx * 1.7, tagPx);
    } else {
      drawPanelPhoto(ctx, null, null, { x, y, w: rw, h: rh }, grade, false, 16 * u);
    }
    ctx.restore();
    // White keyline.
    ctx.lineWidth = popOut ? 5 * u : 2.5 * u;
    ctx.strokeStyle = popOut ? '#ffffff' : 'rgba(255,255,255,0.85)';
    ctx.strokeRect(x, y, rw, rh);
    ctx.restore();
  }

  // Non-hero panels first, hero last so it pops over its neighbours.
  panels.filter((p) => !p.rect.hero).forEach((p) => paintPanel(p, false));

  // Title band.
  if (!layout.full) {
    const band = ctx.createLinearGradient(0, artH, 0, H);
    band.addColorStop(0, '#160a24');
    band.addColorStop(1, '#0a0512');
    ctx.fillStyle = band;
    ctx.fillRect(0, artH, W, H - artH);
    // Halftone dots across the band.
    if (state.halftone) {
      ctx.fillStyle = 'rgba(255,201,60,0.20)';
      const step = 26 * u;
      for (let yy = artH + 8 * u; yy < H - 6 * u; yy += step) {
        for (let xx = 14 * u; xx < W; xx += step) {
          ctx.beginPath();
          ctx.arc(xx, yy, 2.2 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = grade.wash[0];
    ctx.fillRect(0, artH, W, 3 * u);
  }

  panels.filter((p) => p.rect.hero).forEach((p) => paintPanel(p, true));

  // Tagline in script, then the chrome title.
  const bandTop = layout.full ? H * 0.66 : artH;
  const bandH = layout.full ? H * 0.34 : H - artH;
  if (state.tagline) {
    const scriptPx = Math.max(16, Math.round((aspect > 1.2 ? 40 : 34) * u));
    ctx.font = `${scriptPx}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,46,136,0.9)';
    ctx.shadowBlur = 18 * u;
    ctx.fillText(state.tagline, W / 2, bandTop + scriptPx * 1.15);
    ctx.shadowBlur = 0;
  }
  const titleCap = Math.round(bandH * (state.tagline ? 0.55 : 0.62));
  const titlePx = Math.min(
    Math.round((aspect > 1.2 ? 132 : aspect < 0.9 ? 116 : 120) * u),
    Math.max(48, titleCap),
  );
  const titleY = bandTop + bandH * (state.tagline ? 0.30 : 0.12);
  drawChromeTitle(ctx, (state.caption || 'UNTITLED').toUpperCase(), W / 2, titleY, W * 0.94, titlePx, grade.chrome);

  // Quote bar: a pill straddling the bottom of the art area, above the
  // title band, so it never collides with the title or the billing block.
  if (state.quote) {
    const qPx = Math.max(13, Math.round(21 * u));
    ctx.font = `italic ${qPx}px Georgia, serif`;
    const qw = ctx.measureText(state.quote).width;
    const bw = Math.min(W * 0.86, qw + 40 * u);
    const bh = qPx * 2.1;
    const bx = (W - bw) / 2;
    const by = artH - bh - 10 * u - (state.billing ? 34 * u : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,201,60,0.7)';
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();
    ctx.fillStyle = '#f4e9d8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.quote, W / 2, by + bh / 2 + qPx * 0.06, bw - 30 * u);
  }

  // Billing block.
  if (state.billing) {
    const bPx = Math.max(9, Math.round(12.5 * u));
    ctx.fillStyle = 'rgba(244,233,216,0.72)';
    ctx.font = `${bPx}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const cast = state.panels.slice(0, 4).map((p) => p.role).filter(Boolean).join('   ·   ');
    ctx.fillText('NEON COAST  PRESENTS', W / 2, H - 22 * u);
    if (cast) ctx.fillText(cast.toUpperCase(), W / 2, H - 9 * u);
  }

  // Circular seal, top right of the art area.
  if (state.seal) {
    const r = Math.max(30, Math.round(44 * u));
    const cx = W - r - 18 * u;
    const cy = r + 18 * u;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.22);
    ctx.fillStyle = 'rgba(255,46,136,0.92)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath();
    ctx.arc(0, 0, r - 5 * u, 0, Math.PI * 2);
    ctx.stroke();
    drawStar(ctx, 0, -r * 0.18, r * 0.30, '#fff');
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(9, Math.round(13 * u))}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VICE CITY', 0, r * 0.34);
    ctx.fillText('2026', 0, r * 0.60);
    ctx.restore();
  }

  // Heat meter: stars under the seal, with the HEAT label on the same row
  // to the left of them, so it never tucks under the seal's edge.
  if (state.heat > 0) {
    const sPx = Math.max(13, Math.round(20 * u));
    const y = (state.seal ? 18 * u + Math.max(30, Math.round(44 * u)) * 2 + 12 * u : 18 * u);
    let x = W - 18 * u;
    const centres = [];
    for (let i = 0; i < 5; i++) {
      centres.push(x - sPx * 0.6);
      drawStar(ctx, x - sPx * 0.6, y + sPx * 0.6, sPx * 0.55, i < state.heat ? '#ffc93c' : 'rgba(255,255,255,0.25)');
      x -= sPx * 1.5;
    }
    ctx.fillStyle = 'rgba(244,233,216,0.85)';
    ctx.font = `${Math.max(9, Math.round(12 * u))}px Anton, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('HEAT', centres[4] - sPx * 1.2, y + sPx * 0.6);
  }

  // Badge ribbon, top-left corner.
  if (state.ribbon) {
    ctx.save();
    ctx.translate(0, 0);
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(190 * u, 0);
    ctx.lineTo(0, 190 * u);
    ctx.closePath();
    ctx.fill();
    ctx.translate(46 * u, 46 * u);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(10, Math.round(15 * u))}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.ribbon.toUpperCase(), 0, 0);
    ctx.restore();
  }

  // Grain + vignette over everything.
  if (state.grain) {
    const tile = getGrainTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  return canvas;
}

// Render the state to a fresh canvas at exactly W x H.
export function renderCoverToCanvas(state, w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return drawCover(cv, state);
}
