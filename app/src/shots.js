// Fixed scenes for screenshots.
// ?shot=cover  -> the cover alone, full-frame, hero layout with the pop-out
//                 hero and a chrome 3D title, 1920 x 1080.
// ?shot=cover2 -> the cover alone, 7-panel layout with role tags and
//                 Poster Ink, square 1080 x 1080.
// ?shot=editor -> the editor with a sample loaded, role-tag and grade
//                 controls visible.
// ?shot=cover3 -> the exported cover, full-bleed layout with the billing
//                 block and seal, 1080 x 1350.
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
      tagline: 'LEONIDA · 2026',
      badge: 'COVER STAR',
      wanted: 5,
      popout: true,
      ink: false,
      billing: 'A NEON COAST PRODUCTION · STARRING YOU · IN CINEMAS SOON',
      seal: 'VICE CITY',
      quote: '',
      photos,
      fill: 'alternate',
      roles: ['THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE MUSCLE'],
    });
  } else if (shot === 'cover2') {
    document.body.classList.add('shot-cover');
    await api.applyScene({
      layout: 'seven',
      size: '1080x1080',
      grade: 'vice',
      caption: query.get('caption') ?? 'VICE NIGHTS',
      subtitle: query.get('subtitle') ?? 'neon never sleeps',
      tagline: 'SEVEN WAYS IN · ONE WAY OUT',
      badge: 'COVER STAR',
      wanted: 4,
      popout: false,
      ink: true,
      billing: 'A NEON COAST PRODUCTION · STARRING YOU · IN CINEMAS SOON',
      seal: 'EST 2026',
      quote: '',
      photos,
      fill: 'alternate',
      roles: ['THE QUEEN', 'THE HACKER', 'THE WHEELMAN', 'THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE INSIDE MAN'],
    });
  } else if (shot === 'cover3') {
    document.body.classList.add('shot-cover');
    await api.applyScene({
      layout: 'bleed',
      size: '1080x1350',
      grade: 'gold',
      caption: query.get('caption') ?? 'GOLDEN MILE',
      subtitle: query.get('subtitle') ?? 'every sunset has a price',
      tagline: 'LEONIDA · 2026',
      badge: 'COVER STAR',
      wanted: 5,
      popout: false,
      ink: false,
      billing: 'A NEON COAST PRODUCTION · A FILM BY THE CREW · STARRING YOU · IN CINEMAS SOON',
      seal: 'VICE CITY',
      quote: 'The best sunset in Leonida.',
      photos,
      fill: 'first',
      roles: ['THE DRIVER'],
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
      tagline: 'LEONIDA · 2026',
      badge: 'COVER STAR',
      wanted: 5,
      popout: true,
      ink: false,
      billing: 'A NEON COAST PRODUCTION · STARRING YOU · IN CINEMAS SOON',
      seal: 'VICE CITY',
      quote: '',
      photos,
      fill: 'alternate',
      roles: ['THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE MUSCLE'],
    });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => api.ready()));
}
