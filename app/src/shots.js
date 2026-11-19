// Fixed scenes for screenshots.
// ?shot=cover  -> the cover alone, full-frame, hero layout, sample photos,
//                 no editor chrome (body gets .shot-cover).
// ?shot=cover2 -> the cover alone, square 1080 x 1080, 4-panel grid layout.
// ?shot=editor -> the editor with a sample photo loaded.
// No query -> the editor with the samples loaded (handled by main.js).
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  const caption = query.get('caption') ?? 'NEON COAST';
  const subtitle = query.get('subtitle') ?? 'chase the sunset';
  const photos = ['samples/boulevard.jpg', 'samples/pier.jpg'];

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await api.applyScene({
      layout: 'hero',
      size: '1920x1080',
      grade: 'sunset',
      caption,
      subtitle,
      badge: 'COVER STAR',
      wanted: 5,
      photos,
      fill: 'alternate',
    });
  } else if (shot === 'cover2') {
    document.body.classList.add('shot-cover');
    await api.applyScene({
      layout: 'grid4',
      size: '1080x1080',
      grade: 'neon',
      caption: query.get('caption') ?? 'VICE NIGHTS',
      subtitle: query.get('subtitle') ?? 'neon never sleeps',
      badge: 'COVER STAR',
      wanted: 4,
      photos,
      fill: 'alternate',
    });
  } else {
    // ?shot=editor (or any other value): editor with a sample loaded.
    document.body.classList.add('shot-editor');
    await api.applyScene({
      layout: 'hero',
      size: '1080x1080',
      grade: 'sunset',
      caption,
      subtitle,
      badge: 'COVER STAR',
      wanted: 5,
      photos,
      fill: 'alternate',
    });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => api.ready()));
}
