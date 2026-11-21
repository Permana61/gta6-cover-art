// Shot scenes for screenshots: the app draws its own cover full-frame
// (?shot=cover) or shows the editor with a photo loaded (?shot=editor).
// Params: shot=cover|editor, photo=boulevard|pier, photo2=..., caption=...,
// tagline=..., quote=..., layout=..., grade=..., ink=0|1.
export function readShot() {
  const q = new URLSearchParams(window.location.search);
  const mode = q.get('shot');
  if (mode !== 'cover' && mode !== 'editor') return null;
  const out = { mode };
  if (q.get('photo')) out.photo = q.get('photo');
  if (q.get('photo2')) out.photo2 = q.get('photo2');
  if (q.get('caption')) out.caption = q.get('caption');
  if (q.get('tagline') !== null) out.tagline = q.get('tagline') || '';
  if (q.get('quote') !== null) out.quote = q.get('quote') || '';
  if (q.get('layout')) out.layout = q.get('layout');
  if (q.get('grade')) out.grade = q.get('grade');
  if (q.get('ink') !== null) out.ink = q.get('ink') !== '0';
  return out;
}
