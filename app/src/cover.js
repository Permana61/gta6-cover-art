// Neon Coast Cover Studio — cover render engine (round 3).
// Draws a multi-panel poster-style cover on a 2D canvas: ink-banded panels,
// a pop-out hero that breaks its frame, face-aware smart crops, chrome 3D
// striped titles, per-panel role tags, eight colour grades, a Poster Ink
// painted look, eight layouts, and poster furniture (billing block, seal,
// quote bar, tagline) over grain, vignette, halftone, a badge ribbon and a
// five-star heat meter. Everything is drawn in code; no outside artwork,
// no trademarked logo, wordmark or font is used anywhere.

export const LAYOUTS = {
  hero: { label: 'Hero + 3', panels: 4 },
  grid4: { label: 'Grid 4', panels: 4 },
  grid9: { label: 'Grid 9', panels: 9 },
  bleed: { label: 'Full Bleed', panels: 1 },
  tilted: { label: 'Tilted Snaps', panels: 3 },
  seven: { label: '7-Panel', panels: 7 },
  duo: { label: 'Duo', panels: 2 },
  triptych: { label: 'Triptych', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.3) contrast(1.08)', top: '#ff9a3c', bottom: '#ff2e88' },
  neon: { label: 'Neon Pink / Teal', filter: 'saturate(1.55) contrast(1.12)', top: '#ff2ea6', bottom: '#00e5d4' },
  gold: { label: 'Gold Hour', filter: 'sepia(0.38) saturate(1.35) contrast(1.06)', top: '#ffd166', bottom: '#c2571b' },
  noir: { label: 'Mono Noir', filter: 'grayscale(1) contrast(1.28) brightness(1.06)', top: '#e8e8e8', bottom: '#111111' },
  twilight: { label: 'Twilight', filter: 'saturate(1.45) contrast(1.1) hue-rotate(-18deg)', top: '#7b5cff', bottom: '#1b2a6b' },
  vice: { label: 'Vice Pink', filter: 'saturate(1.6) contrast(1.1) hue-rotate(12deg)', top: '#ff5fa2', bottom: '#7a1fa2' },
  tealheat: { label: 'Teal Heat', filter: 'saturate(1.45) contrast(1.12) hue-rotate(140deg)', top: '#00e5d4', bottom: '#ff6b35' },
  mono: { label: 'Mono', filter: 'grayscale(1) contrast(1.45) brightness(1.1)', top: '#ffffff', bottom: '#000000' },
};

export const SIZES = {
  '1080x1080': { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { label: 'Story · 1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export const ROLE_PRESETS = [
  'THE DRIVER',
  'THE FIXER',
  'THE LOOKOUT',
  'THE MUSCLE',
  'THE HACKER',
  'THE QUEEN',
  'THE WHEELMAN',
  'THE INSIDE MAN',
];

export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.hero).panels;
}

/** Panel rectangles for a layout at canvas size w x h. Each rect is {x, y, w, h, rot}. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  switch (layout) {
    case 'grid4': {
      const cw = (w - g * 3) / 2;
      const ch = (h - g * 3) / 2;
      return [
        { x: g, y: g, w: cw, h: ch, rot: 0 },
        { x: g * 2 + cw, y: g, w: cw, h: ch, rot: 0 },
        { x: g, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
        { x: g * 2 + cw, y: g * 2 + ch, w: cw, h: ch, rot: 0 },
      ];
    }
    case 'grid9': {
      const cw = (w - g * 4) / 3;
      const ch = (h - g * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch, rot: 0 });
        }
      }
      return out;
    }
    case 'bleed':
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    case 'tilted': {
      const pw = w * 0.52;
      const ph = h * 0.58;
      return [
        { x: w * 0.04, y: h * 0.10, w: pw, h: ph, rot: -0.11 },
        { x: w * 0.44, y: h * 0.04, w: pw, h: ph, rot: 0.06 },
        { x: w * 0.24, y: h * 0.34, w: pw, h: ph, rot: -0.03 },
      ];
    }
    case 'seven': {
      // Big panel top-left, two stacked top-right, four across the bottom.
      const topH = Math.round(h * 0.52) - g;
      const heroW = Math.round(w * 0.56) - g;
      const rightX = heroW + g * 2;
      const rightW = w - rightX - g;
      const halfH = (topH - g) / 2;
      const botY = topH + g * 2;
      const botH = h - botY - g;
      const botW = (w - g * 5) / 4;
      return [
        { x: g, y: g, w: heroW, h: topH, rot: 0 },
        { x: rightX, y: g, w: rightW, h: halfH, rot: 0 },
        { x: rightX, y: g * 2 + halfH, w: rightW, h: halfH, rot: 0 },
        { x: g, y: botY, w: botW, h: botH, rot: 0 },
        { x: g * 2 + botW, y: botY, w: botW, h: botH, rot: 0 },
        { x: g * 3 + botW * 2, y: botY, w: botW, h: botH, rot: 0 },
        { x: g * 4 + botW * 3, y: botY, w: botW, h: botH, rot: 0 },
      ];
    }
    case 'duo': {
      if (w >= h) {
        const cw = (w - g * 3) / 2;
        return [
          { x: g, y: g, w: cw, h: h - g * 2, rot: 0 },
          { x: g * 2 + cw, y: g, w: cw, h: h - g * 2, rot: 0 },
        ];
      }
      const ch = (h - g * 3) / 2;
      return [
        { x: g, y: g, w: w - g * 2, h: ch, rot: 0 },
        { x: g, y: g * 2 + ch, w: w - g * 2, h: ch, rot: 0 },
      ];
    }
    case 'triptych': {
      const sideW = Math.round(w * 0.28);
      const midW = w - sideW * 2 - g * 4;
      const midH = h - g * 2;
      const sideH = Math.round(h * 0.82);
      const sideY = g + (midH - sideH) / 2;
      return [
        { x: g, y: sideY, w: sideW, h: sideH, rot: 0 },
        { x: g * 2 + sideW, y: g, w: midW, h: midH, rot: 0 },
        { x: g * 3 + sideW + midW, y: sideY, w: sideW, h: sideH, rot: 0 },
      ];
    }
    case 'hero':
    default: {
      if (w >= h) {
        // Landscape: big hero panel left, three stacked on the right.
        const hw = w * 0.62 - g * 1.5;
        const sw = w - hw - g * 3;
        const sh = (h - g * 4) / 3;
        return [
          { x: g, y: g, w: hw, h: h - g * 2, rot: 0 },
          { x: hw + g * 2, y: g, w: sw, h: sh, rot: 0 },
          { x: hw + g * 2, y: g * 2 + sh, w: sw, h: sh, rot: 0 },
          { x: hw + g * 2, y: g * 3 + sh * 2, w: sw, h: sh, rot: 0 },
        ];
      }
      // Portrait / square: hero on top, three across the bottom.
      const hh = h * 0.62 - g * 1.5;
      const sw = (w - g * 4) / 3;
      const sy = hh + g * 2;
      const sh = h - sy - g;
      return [
        { x: g, y: g, w: w - g * 2, h: hh, rot: 0 },
        { x: g, y: sy, w: sw, h: sh, rot: 0 },
        { x: g * 2 + sw, y: sy, w: sw, h: sh, rot: 0 },
        { x: g * 3 + sw * 2, y: sy, w: sw, h: sh, rot: 0 },
      ];
    }
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Deterministic pseudo-random generator so the grain looks the same every render.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 192;
  const g = c.getContext('2d');
  const img = g.createImageData(192, 192);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = '#14081f';
  ctx.stroke();
}

/** Draws the five-star heat meter. `wanted` is 1..5 filled stars. */
export function drawHeatMeter(ctx, x, y, starR, wanted, gap) {
  for (let i = 0; i < 5; i++) {
    const cx = x + i * (starR * 2 + gap);
    drawStar(ctx, cx, y, starR, i < wanted ? '#ffd166' : 'rgba(20,8,31,0.55)');
    if (i < wanted) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      drawStar(ctx, cx, y, starR * 1.35, '#ff9a3c');
      ctx.restore();
    }
  }
}

/** Halftone dot field inside a band: dots grow from left to right. */
function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, Math.round(w / 64));
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const t = (xx - x) / w;
      const r = step * (0.12 + 0.34 * t);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Fallback artwork for a panel with no photo yet: sunset stripes + sun disc. */
function drawEmptyPanel(ctx, rect, grade, index) {
  const { x, y, w, h } = rect;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, grade.top);
  sky.addColorStop(1, grade.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Sun disc.
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Horizon stripes.
  ctx.fillStyle = 'rgba(20,8,31,0.55)';
  for (let i = 0; i < 4; i++) {
    const sy = y + h * (0.62 + i * 0.09);
    ctx.fillRect(x, sy, w, Math.max(2, h * 0.018));
  }
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `bold ${Math.max(14, Math.round(Math.min(w, h) * 0.07))}px Anton, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, x + w / 2, y + h * 0.88);
  ctx.textBaseline = 'alphabetic';
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Face-aware smart crop
//
// The photo is downscaled to a small grid and every cell is scored for
// skin-tone likelihood plus local contrast (edges and faces both score
// high). An integral image then finds the crop window of the panel's aspect
// ratio with the highest total saliency, so the subject lands in frame
// instead of the dead centre. Results are cached per photo + aspect.
// ---------------------------------------------------------------------------

const saliencyCache = new WeakMap(); // image -> { cols, rows, score }
const smartOffsetCache = new WeakMap(); // image -> Map(aspectKey -> { fx, fy })

function saliencyMap(img) {
  const cached = saliencyCache.get(img);
  if (cached) return cached;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const cols = 48;
  const rows = Math.max(8, Math.round((48 * ih) / iw));
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, cols, rows);
  const d = g.getImageData(0, 0, cols, rows).data;
  const score = new Float32Array(cols * rows);
  const lum = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = d[i];
      const gg = d[i + 1];
      const b = d[i + 2];
      // Skin tone: warm, red-dominant, mid-bright.
      let skin = 0;
      if (r > 95 && r > gg && r > b && r - gg >= 12 && r - gg <= 95 && r - b >= 15) {
        skin = 1.6;
      }
      // Saturation: vivid regions (clothes, cars, neon) attract the eye.
      const mx = Math.max(r, gg, b);
      const mn = Math.min(r, gg, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      // Local contrast against the right and lower neighbour.
      let edge = 0;
      if (x + 1 < cols) edge = Math.max(edge, Math.abs(lum(i) - lum(i + 4)));
      if (y + 1 < rows) edge = Math.max(edge, Math.abs(lum(i) - lum(i + cols * 4)));
      // Gentle centre bias so a flat photo still crops to its middle.
      const cx = (x + 0.5) / cols - 0.5;
      const cy = (y + 0.5) / rows - 0.5;
      const centre = 1 - 0.35 * Math.sqrt(cx * cx + cy * cy);
      score[y * cols + x] = skin + sat * 0.9 + Math.min(edge / 64, 1) * 1.1 + centre * 0.25;
    }
  }
  const map = { cols, rows, score };
  saliencyCache.set(img, map);
  return map;
}

/** Best crop-window centre as fractions (fx, fy) of the image, for a panel aspect. */
function smartCropCentre(img, panelAspect) {
  const key = panelAspect.toFixed(2);
  let per = smartOffsetCache.get(img);
  if (!per) {
    per = new Map();
    smartOffsetCache.set(img, per);
  }
  const hit = per.get(key);
  if (hit) return hit;
  const { cols, rows, score } = saliencyMap(img);
  const mapAspect = cols / rows;
  let winW;
  let winH;
  if (panelAspect >= mapAspect) {
    winW = cols;
    winH = Math.max(2, Math.round(cols / panelAspect));
  } else {
    winH = rows;
    winW = Math.max(2, Math.round(rows * panelAspect));
  }
  // Integral image for O(1) window sums.
  const integ = new Float32Array((cols + 1) * (rows + 1));
  for (let y = 0; y < rows; y++) {
    let rowSum = 0;
    for (let x = 0; x < cols; x++) {
      rowSum += score[y * cols + x];
      integ[(y + 1) * (cols + 1) + (x + 1)] = integ[y * (cols + 1) + (x + 1)] + rowSum;
    }
  }
  const winSum = (x0, y0) => {
    const x1 = x0 + winW;
    const y1 = y0 + winH;
    return (
      integ[y1 * (cols + 1) + x1] -
      integ[y0 * (cols + 1) + x1] -
      integ[y1 * (cols + 1) + x0] +
      integ[y0 * (cols + 1) + x0]
    );
  };
  let best = -Infinity;
  let bx = 0;
  let by = 0;
  for (let y0 = 0; y0 + winH <= rows; y0++) {
    for (let x0 = 0; x0 + winW <= cols; x0++) {
      const s = winSum(x0, y0);
      if (s > best) {
        best = s;
        bx = x0;
        by = y0;
      }
    }
  }
  const out = { fx: (bx + winW / 2) / cols, fy: (by + winH / 2) / rows };
  per.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------
// Poster Ink: posterize + Sobel edge-darken, for a painted-look panel.
// The graded photo is processed once per photo + grade (max 900 px wide)
// and cached, so previews stay fast.
// ---------------------------------------------------------------------------

const inkCache = new WeakMap(); // image -> Map(gradeKey -> canvas)

function inkedImage(img, grade) {
  let per = inkCache.get(img);
  if (!per) {
    per = new Map();
    inkCache.set(img, per);
  }
  const key = grade.filter + '|' + grade.top + '|' + grade.bottom;
  const hit = per.get(key);
  if (hit) return hit;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, 900 / Math.max(iw, ih));
  const w = Math.max(2, Math.round(iw * scale));
  const h = Math.max(2, Math.round(ih * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.filter = grade.filter;
  g.drawImage(img, 0, 0, w, h);
  g.filter = 'none';
  const data = g.getImageData(0, 0, w, h);
  const d = data.data;
  const levels = 5;
  const step = 255 / (levels - 1);
  // Posterize first, then Sobel on the posterized luminance.
  const lum = new Float32Array(w * h);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
    lum[i / 4] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  const edge = new Float32Array(w * h);
  let edgeMax = 1;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx =
        -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] +
        lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
      const gy =
        -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] +
        lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
      const m = Math.sqrt(gx * gx + gy * gy);
      edge[p] = m;
      if (m > edgeMax) edgeMax = m;
    }
  }
  for (let p = 0; p < w * h; p++) {
    const e = edge[p] / edgeMax;
    if (e > 0.22) {
      const darken = 1 - Math.min(0.85, (e - 0.22) * 1.6);
      const i = p * 4;
      d[i] *= darken;
      d[i + 1] *= darken;
      d[i + 2] *= darken;
    }
  }
  g.putImageData(data, 0, 0);
  per.set(key, c);
  return c;
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

/**
 * Draws one photo into a panel rect, cover-fit, with the panel's crop
 * transform (zoom 1.., dx/dy in fractions of panel size), smart crop,
 * Poster Ink and the grade.
 * opts: { popout } — pop-out hero gets a white keyline instead of the
 * dark ink band.
 */
function drawPhotoPanel(ctx, img, rect, slot, grade, opts) {
  const { x, y, w, h, rot } = rect;
  const popout = opts && opts.popout;
  ctx.save();
  // Rotate first, then clip: the clip follows the tilted panel.
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  if (!img) {
    drawEmptyPanel(ctx, { x: 0, y: 0, w, h }, grade, slot.index);
  } else {
    const source = slot.ink ? inkedImage(img, grade) : img;
    const iw = source.naturalWidth || source.width;
    const ih = source.naturalHeight || source.height;
    const zoom = slot.zoom || 1;
    const base = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    let ox = (w - dw) / 2;
    let oy = (h - dh) / 2;
    if (slot.smartCrop) {
      // Aim the crop window at the saliency centre, then clamp so the
      // panel never shows empty space.
      const centre = smartCropCentre(img, w / h);
      ox = clamp(w / 2 - centre.fx * dw, w - dw, 0);
      oy = clamp(h / 2 - centre.fy * dh, h - dh, 0);
    }
    ox += (slot.dx || 0) * w;
    oy += (slot.dy || 0) * h;
    ox = clamp(ox, w - dw, 0);
    oy = clamp(oy, h - dh, 0);
    if (!slot.ink) ctx.filter = grade.filter;
    ctx.drawImage(source, ox, oy, dw, dh);
    ctx.filter = 'none';
    // Gradient-map wash: warm top, hot bottom, blended over the photo.
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, hexA(grade.top, 0.28));
    wash.addColorStop(1, hexA(grade.bottom, 0.42));
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Bottom shade so the caption band reads over any photo.
    const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
    shade.addColorStop(0, 'rgba(10,4,20,0)');
    shade.addColorStop(1, 'rgba(10,4,20,0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  }
  // Ink band: thick dark frame + thin neon inner line, poster style.
  // Still inside the rotated transform, so the frame follows the panel.
  const band = Math.max(5, Math.round(Math.min(w, h) * 0.014));
  ctx.lineWidth = band;
  ctx.strokeStyle = '#12081f';
  ctx.strokeRect(0, 0, w, h);
  if (popout) {
    // White keyline outside the ink band: the pop-out hero's hard edge.
    ctx.lineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.008));
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(-band * 0.4, -band * 0.4, w + band * 0.8, h + band * 0.8);
  } else {
    ctx.lineWidth = Math.max(1.5, band * 0.22);
    ctx.strokeStyle = grade.top;
    ctx.globalAlpha = 0.85;
    ctx.strokeRect(band * 0.9, band * 0.9, w - band * 1.8, h - band * 1.8);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** Fits the caption to the width, returns the font size to use. */
function fitCaptionSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

// ---------------------------------------------------------------------------
// Striped retro-chrome 3D title
//
// The caption is drawn to a scratch canvas: dark extrusion layers offset
// down-right for the 3D depth, a chrome gradient fill (silver with a tint
// of the grade), then diagonal stripes clipped to the letterforms, and a
// thin dark outline. The scratch canvas is stamped onto the cover tilted.
// ---------------------------------------------------------------------------

function drawChromeCaption(ctx, text, cx, cy, size, grade) {
  const font = (s) => `${s}px Anton, 'Arial Black', sans-serif`;
  ctx.save();
  ctx.font = font(size);
  const textW = ctx.measureText(text).width;
  ctx.restore();
  const steps = 6;
  const step = Math.max(2, size * 0.022);
  const pad = Math.ceil(size * 0.55);
  const tw = Math.ceil(textW + pad * 2 + steps * step);
  const th = Math.ceil(size * 1.7 + steps * step);
  const tmp = document.createElement('canvas');
  tmp.width = tw;
  tmp.height = th;
  const g = tmp.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  const tx = tw / 2 - (steps * step) / 2;
  const ty = th / 2 - (steps * step) / 2;
  // Extrusion: stacked dark layers, down-right.
  for (let i = steps; i >= 1; i--) {
    g.font = font(size);
    g.fillStyle = i % 2 === 0 ? '#1c0b33' : '#2a1145';
    g.fillText(text, tx + i * step, ty + i * step * 0.9);
  }
  // Chrome fill: silver gradient tinted with the grade at the foot.
  const chrome = g.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
  chrome.addColorStop(0, '#ffffff');
  chrome.addColorStop(0.3, '#cfd8e3');
  chrome.addColorStop(0.52, '#ffffff');
  chrome.addColorStop(0.72, grade.top);
  chrome.addColorStop(1, '#8fa0b5');
  g.font = font(size);
  g.fillStyle = chrome;
  g.fillText(text, tx, ty);
  // Diagonal stripes clipped to the letterforms.
  g.globalCompositeOperation = 'source-atop';
  g.save();
  g.translate(tw / 2, th / 2);
  g.rotate(-0.6);
  const stripeW = Math.max(6, size * 0.09);
  for (let x = -tw; x < tw; x += stripeW * 2) {
    g.fillStyle = 'rgba(255,255,255,0.20)';
    g.fillRect(x, -th, stripeW, th * 2);
    g.fillStyle = 'rgba(10,4,20,0.10)';
    g.fillRect(x + stripeW, -th, stripeW, th * 2);
  }
  g.restore();
  g.globalCompositeOperation = 'source-over';
  // Thin dark outline so the letters hold against bright photos.
  g.lineWidth = Math.max(2, size * 0.045);
  g.strokeStyle = '#12081f';
  g.strokeText(text, tx, ty);
  // Stamp tilted, like a poster title.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.028);
  ctx.drawImage(tmp, -tw / 2, -th / 2);
  ctx.restore();
}

/** Role tag chip: a small dark chip with a coloured border, drawn at a panel corner.
 *  `maxBottom` keeps the chip above the title band so it never covers the
 *  subtitle or the billing block. */
function drawRoleTag(ctx, rect, role, grade, canvasW, maxBottom) {
  const label = (role || '').trim().toUpperCase();
  if (!label) return;
  const fontSize = Math.max(13, Math.round(Math.min(rect.w, rect.h) * 0.062));
  ctx.save();
  ctx.font = `bold ${fontSize}px Anton, 'Arial Black', sans-serif`;
  const textW = ctx.measureText(label).width;
  const padX = Math.round(fontSize * 0.7);
  const padY = Math.round(fontSize * 0.42);
  const chipW = textW + padX * 2;
  const chipH = fontSize + padY * 2;
  const x = rect.x + Math.max(8, Math.round(canvasW * 0.012));
  let y = rect.y + rect.h - chipH - Math.max(8, Math.round(canvasW * 0.012));
  if (maxBottom !== undefined && y + chipH > maxBottom) {
    y = Math.max(rect.y + 4, maxBottom - chipH);
  }
  ctx.fillStyle = 'rgba(18,8,31,0.88)';
  ctx.strokeStyle = grade.top;
  ctx.lineWidth = Math.max(2, fontSize * 0.12);
  ctx.beginPath();
  const r = Math.min(chipH / 2, 10);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + chipW - r, y);
  ctx.arcTo(x + chipW, y, x + chipW, y + r, r);
  ctx.lineTo(x + chipW, y + chipH - r);
  ctx.arcTo(x + chipW, y + chipH, x + chipW - r, y + chipH, r);
  ctx.lineTo(x + r, y + chipH);
  ctx.arcTo(x, y + chipH, x, y + chipH - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + chipW / 2, y + chipH / 2 + 1);
  ctx.restore();
}

/** Circular seal / stamp with a star and up to two lines of text. */
function drawSeal(ctx, cx, cy, r, text) {
  ctx.save();
  ctx.translate(cx, cy);
  // Drop shadow so the stamp sits on the poster.
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = r * 0.25;
  ctx.shadowOffsetY = r * 0.08;
  ctx.fillStyle = '#f5efff';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = '#12081f';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
  ctx.stroke();
  // Star at the top of the seal.
  drawStar(ctx, 0, -r * 0.42, r * 0.22, '#ff2e88');
  // Seal text, wrapped to at most two lines.
  const words = (text || '').trim().toUpperCase().split(/\s+/).filter(Boolean);
  let lines = [''];
  if (words.length) {
    let size = Math.max(9, Math.round(r * 0.24));
    ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
    const fits = (line) => ctx.measureText(line).width <= r * 1.5;
    let first = words[0];
    let rest = words.slice(1).join(' ');
    while (!fits(first) && size > 8) {
      size -= 1;
      ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
    }
    if (rest && fits(`${first} ${rest}`)) {
      lines = [`${first} ${rest}`];
    } else if (rest) {
      lines = [first, rest];
      while (!fits(lines[1]) && size > 8) {
        size -= 1;
        ctx.font = `bold ${size}px Anton, 'Arial Black', sans-serif`;
      }
    } else {
      lines = [first];
    }
    ctx.fillStyle = '#12081f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineH = size * 1.25;
    const startY = r * 0.12 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, startY + i * lineH);
    });
  }
  ctx.restore();
}

/**
 * Draws the whole cover.
 * opts: { photos: Image[], slots: [{photo, zoom, dx, dy, role, smartCrop, ink}],
 *         layout, grade, caption, subtitle, tagline, wanted (1..5), badge,
 *         popout, ink, billing, seal, quote }
 */
export function drawCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[opts.grade] || GRADES.sunset;
  const layout = opts.layout || 'hero';
  const rects = layoutPanels(layout, w, h);
  const slots = opts.slots || [];
  const popout = opts.popout !== false && layout === 'hero';

  // Backdrop: deep violet sky with a warm horizon glow.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#160a2e');
  bg.addColorStop(0.55, '#3a1150');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (layout === 'tilted') {
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, Math.max(w, h) * 0.55);
    glow.addColorStop(0, hexA(grade.top, 0.5));
    glow.addColorStop(0.6, hexA(grade.bottom, 0.28));
    glow.addColorStop(1, 'rgba(18,8,31,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  // Panels. With pop-out, the hero is drawn last and oversized so it
  // breaks its frame and overlaps the panels beside it.
  const drawnRects = rects.map((r) => ({ ...r }));
  const drawPanel = (i) => {
    const rect = rects[i];
    const slot = { ...(slots[i] || { photo: -1, zoom: 1, dx: 0, dy: 0 }), index: i };
    if (slot.ink === undefined) slot.ink = !!opts.ink;
    const img = slot.photo >= 0 ? opts.photos[slot.photo] : null;
    if (popout && i === 0) {
      const over = Math.round(Math.min(w, h) * 0.038);
      const big = { x: rect.x, y: rect.y, w: rect.w + over, h: rect.h + over, rot: 0 };
      drawnRects[0] = big;
      // Drop shadow cast by the lifted hero panel.
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = Math.round(Math.min(w, h) * 0.03);
      ctx.shadowOffsetY = Math.round(Math.min(w, h) * 0.012);
      ctx.fillStyle = '#12081f';
      ctx.fillRect(big.x, big.y, big.w, big.h);
      ctx.restore();
      drawPhotoPanel(ctx, img, big, slot, grade, { popout: true });
    } else {
      drawPhotoPanel(ctx, img, rect, slot, grade, {});
    }
  };
  if (popout) {
    for (let i = 1; i < rects.length; i++) drawPanel(i);
    drawPanel(0);
  } else {
    rects.forEach((_, i) => drawPanel(i));
  }

  // Title block: halftone band across the foot of the cover.
  const bandH = Math.round(h * 0.28);
  const bandY = h - bandH;

  // Quote / callout bar just above the title band.
  const quote = (opts.quote || '').trim();
  if (quote) {
    const qH = Math.round(h * 0.052);
    const qY = bandY - qH - Math.round(h * 0.008);
    ctx.fillStyle = 'rgba(18,8,31,0.92)';
    ctx.fillRect(0, qY, w, qH);
    ctx.fillStyle = grade.top;
    ctx.fillRect(0, qY, Math.round(w * 0.012), qH);
    const qSize = Math.max(15, Math.round(w * 0.021));
    ctx.save();
    ctx.font = `italic bold ${qSize}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let q = quote;
    while (ctx.measureText(`\u201c${q}\u201d`).width > w * 0.9 && q.length > 4) q = q.slice(0, -1);
    ctx.fillText(`\u201c${q}\u201d`, w / 2, qY + qH / 2 + 1);
    ctx.restore();
  }

  const bandGrad = ctx.createLinearGradient(0, bandY, 0, h);
  bandGrad.addColorStop(0, 'rgba(18,8,31,0)');
  bandGrad.addColorStop(0.35, 'rgba(18,8,31,0.88)');
  bandGrad.addColorStop(1, 'rgba(18,8,31,0.96)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.rect(0, bandY + bandH * 0.06, w, bandH * 0.42);
  ctx.clip();
  drawHalftone(ctx, 0, bandY + bandH * 0.06, w, bandH * 0.42, hexA(grade.top, 0.9));
  ctx.restore();

  // Tagline: small gold caps line above the caption.
  const tagline = (opts.tagline || '').trim().toUpperCase();
  if (tagline) {
    const tagSize = Math.max(13, Math.round(w * 0.02));
    ctx.save();
    ctx.font = `bold ${tagSize}px Anton, 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let t = tagline;
    while (ctx.measureText(t.split('').join('\u2009')).width > w * 0.88 && t.length > 4) t = t.slice(0, -1);
    ctx.fillText(t.split('').join('\u2009'), w / 2, bandY + bandH * 0.10);
    ctx.restore();
  }

  // Caption: striped retro-chrome 3D title. Size is capped by the band
  // height so it never clips at the bottom or covers the tagline.
  const caption = (opts.caption || '').trim().toUpperCase();
  if (caption) {
    const maxW = w * 0.92;
    const size = Math.min(
      fitCaptionSize(ctx, caption, maxW, Math.round(w * 0.115)),
      Math.round(bandH * 0.52),
    );
    drawChromeCaption(ctx, caption, w / 2, bandY + bandH * 0.47, size, grade);
  }

  // Subtitle in script lettering under the caption.
  const subtitle = (opts.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.max(20, Math.round(w * 0.038));
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.82);
    ctx.rotate(-0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.bottom === '#111111' || grade.bottom === '#000000' ? '#ffffff' : grade.bottom;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.3;
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

  // Role tags, drawn after the title band so they read on top of it,
  // but kept above the band's top edge so they never cover the subtitle.
  slots.forEach((slot, i) => {
    if (slot && slot.role && drawnRects[i]) {
      drawRoleTag(ctx, drawnRects[i], slot.role, grade, w, bandY - Math.round(h * 0.008));
    }
  });

  // Badge ribbon, top-left corner.
  const badge = (opts.badge || 'COVER STAR').trim().toUpperCase();
  if (badge) {
    ctx.save();
    ctx.translate(w * 0.16, h * 0.055);
    ctx.rotate(-0.09);
    ctx.font = `bold ${Math.max(16, Math.round(w * 0.024))}px Anton, 'Arial Black', sans-serif`;
    const textW = ctx.measureText(badge).width;
    const rw = textW + Math.round(w * 0.05);
    const rh = Math.max(26, Math.round(h * 0.042));
    ctx.fillStyle = '#ff2e88';
    ctx.strokeStyle = '#12081f';
    ctx.lineWidth = Math.max(3, rh * 0.12);
    ctx.beginPath();
    ctx.moveTo(-rw / 2, -rh / 2);
    ctx.lineTo(rw / 2, -rh / 2);
    ctx.lineTo(rw / 2 + rh * 0.5, 0);
    ctx.lineTo(rw / 2, rh / 2);
    ctx.lineTo(-rw / 2, rh / 2);
    ctx.lineTo(-rw / 2 - rh * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, 1);
    ctx.restore();
  }

  // Heat meter: five stars, top-right.
  const starR = Math.max(12, Math.round(w * 0.016));
  const gap = starR * 0.55;
  const meterW = 5 * starR * 2 + 4 * gap;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = starR * 0.5;
  drawHeatMeter(ctx, w - meterW - Math.round(w * 0.03) + starR, Math.round(h * 0.045) + starR, starR, clamp(opts.wanted || 5, 1, 5), gap);
  ctx.restore();

  // Circular seal / stamp, right edge just below the heat meter.
  const seal = (opts.seal || '').trim();
  if (seal) {
    const r = Math.max(30, Math.round(Math.min(w, h) * 0.052));
    drawSeal(ctx, w - r - Math.round(w * 0.028), Math.round(h * 0.17), r, seal);
  }

  // Billing block: tiny credits line at the very bottom.
  const billing = (opts.billing || '').trim();
  if (billing) {
    let bSize = Math.max(9, Math.round(h * 0.0115));
    ctx.save();
    ctx.font = `${bSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let b = billing.toUpperCase();
    while (ctx.measureText(b).width > w * 0.86 && bSize > 8) {
      bSize -= 1;
      ctx.font = `${bSize}px Arial, sans-serif`;
    }
    ctx.fillText(b, w / 2, h - Math.round(h * 0.014));
    ctx.restore();
  }

  // Grain + vignette over everything.
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10,4,20,0)');
  vig.addColorStop(1, 'rgba(10,4,20,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
