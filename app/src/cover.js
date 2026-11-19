// Neon Coast Cover Studio — cover render engine.
// Draws a multi-panel poster-style cover on a 2D canvas: ink-banded panels,
// gradient-map colour grades, bold poster caption lettering with a script
// subtitle, a halftone title block, grain, vignette, a badge ribbon and a
// five-star heat meter. Everything is drawn in code; no outside artwork,
// no trademarked logo, wordmark or font is used anywhere.

export const LAYOUTS = {
  hero: { label: 'Hero + 3', panels: 4 },
  grid4: { label: 'Grid 4', panels: 4 },
  grid9: { label: 'Grid 9', panels: 9 },
  bleed: { label: 'Full Bleed', panels: 1 },
  tilted: { label: 'Tilted Snaps', panels: 3 },
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.3) contrast(1.08)', top: '#ff9a3c', bottom: '#ff2e88' },
  neon: { label: 'Neon Pink / Teal', filter: 'saturate(1.55) contrast(1.12)', top: '#ff2ea6', bottom: '#00e5d4' },
  gold: { label: 'Gold Hour', filter: 'sepia(0.38) saturate(1.35) contrast(1.06)', top: '#ffd166', bottom: '#c2571b' },
  noir: { label: 'Mono Noir', filter: 'grayscale(1) contrast(1.28) brightness(1.06)', top: '#e8e8e8', bottom: '#111111' },
};

export const SIZES = {
  '1080x1080': { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { label: 'Story · 1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.hero).panels;
}

/** Panel rectangles for a layout at canvas size w x h. Each rect is {x, y, w, h, rot}. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.012));
  const gap = (n) => g * n;
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

/**
 * Draws one photo into a panel rect, cover-fit, with the panel's crop
 * transform (zoom 1.., dx/dy in fractions of panel size) and the grade.
 */
function drawPhotoPanel(ctx, img, rect, slot, grade) {
  const { x, y, w, h, rot } = rect;
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
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = slot.zoom || 1;
    const base = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    const ox = (w - dw) / 2 + (slot.dx || 0) * w;
    const oy = (h - dh) / 2 + (slot.dy || 0) * h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, ox, oy, dw, dh);
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
  ctx.lineWidth = Math.max(1.5, band * 0.22);
  ctx.strokeStyle = grade.top;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(band * 0.9, band * 0.9, w - band * 1.8, h - band * 1.8);
  ctx.restore();
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
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

/**
 * Draws the whole cover.
 * opts: { photos: Image[], slots: [{photo, zoom, dx, dy}], layout, grade,
 *         caption, subtitle, wanted (1..5), badge (ribbon text) }
 */
export function drawCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[opts.grade] || GRADES.sunset;
  const layout = opts.layout || 'hero';
  const rects = layoutPanels(layout, w, h);
  const slots = opts.slots || [];

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

  // Panels.
  rects.forEach((rect, i) => {
    const slot = { ...(slots[i] || { photo: -1, zoom: 1, dx: 0, dy: 0 }), index: i };
    const img = slot.photo >= 0 ? opts.photos[slot.photo] : null;
    drawPhotoPanel(ctx, img, rect, slot, grade);
  });

  // Title block: halftone band across the foot of the cover.
  // Band is tall enough to hold the caption (sized from the band height)
  // plus the script subtitle beneath it, with room to spare.
  const bandH = Math.round(h * 0.26);
  const bandY = h - bandH;
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

  // Caption: thick poster lettering, slight tilt, dark outline + warm fill.
  // Size is capped by the band height so it never clips at the bottom.
  const caption = (opts.caption || '').trim().toUpperCase();
  if (caption) {
    const maxW = w * 0.92;
    const size = Math.min(
      fitCaptionSize(ctx, caption, maxW, Math.round(w * 0.115)),
      Math.round(bandH * 0.62),
    );
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.42);
    ctx.rotate(-0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    const fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, '#fff3c4');
    fill.addColorStop(1, grade.top);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size * 0.16);
    ctx.strokeStyle = '#12081f';
    ctx.strokeText(caption, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(caption, 0, 0);
    ctx.restore();
  }

  // Subtitle in script lettering under the caption.
  const subtitle = (opts.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.max(20, Math.round(w * 0.038));
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.84);
    ctx.rotate(-0.028);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.bottom === '#111111' ? '#ffffff' : grade.bottom;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.3;
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

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
