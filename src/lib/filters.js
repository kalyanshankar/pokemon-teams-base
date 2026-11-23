export const EMPTY_FILTERS = {
  q: '', all: [], any: [], none: [], items: [], moves: [], tags: [], author: '', minRating: 0, sort: 'new',
};

const LISTS = ['all', 'any', 'none', 'items', 'moves', 'tags'];

export function filtersFromURL() {
  const p = new URLSearchParams(window.location.search);
  const f = { ...EMPTY_FILTERS };
  for (const k of LISTS) f[k] = p.get(k) ? p.get(k).split(',').filter(Boolean) : [];
  f.q = p.get('q') || '';
  f.author = p.get('author') || '';
  f.minRating = Number(p.get('rating') || 0);
  f.sort = p.get('sort') || 'new';
  return f;
}

export function filtersToURL(f) {
  const p = new URLSearchParams();
  for (const k of LISTS) if (f[k].length) p.set(k, f[k].join(','));
  if (f.q) p.set('q', f.q);
  if (f.author) p.set('author', f.author);
  if (f.minRating) p.set('rating', String(f.minRating));
  if (f.sort !== 'new') p.set('sort', f.sort);
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export function activeCount(f) {
  return LISTS.reduce((n, k) => n + f[k].length, 0) + (f.q ? 1 : 0) + (f.author ? 1 : 0) + (f.minRating ? 1 : 0);
}

export function applyFilters(teams, f) {
  const q = f.q.trim().toLowerCase();
  const author = f.author.trim().toLowerCase();
  const out = teams.filter((t) => {
    const sp = t.species || [];
    if (f.all.length && !f.all.every((s) => sp.includes(s))) return false;
    if (f.any.length && !f.any.some((s) => sp.includes(s))) return false;
    if (f.none.length && f.none.some((s) => sp.includes(s))) return false;
    if (f.items.length && !f.items.every((i) => (t.items || []).includes(i))) return false;
    if (f.moves.length && !f.moves.every((m) => (t.moves || []).includes(m))) return false;
    const tags = [...(t.tags || []), ...(t.auto_tags || [])];
    if (f.tags.length && !f.tags.every((x) => tags.includes(x))) return false;
    if (author && !(t.author || '').toLowerCase().includes(author)) return false;
    if (f.minRating && (t.rating || 0) < f.minRating) return false;
    if (q) {
      const hay = [t.title, t.author, t.notes, t.replica_code, ...(t.members || []).map((m) => m.species)]
        .join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const by = {
    new: (a, b) => b.created_at.localeCompare(a.created_at),
    old: (a, b) => a.created_at.localeCompare(b.created_at),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || b.created_at.localeCompare(a.created_at),
    title: (a, b) => (a.title || '~').localeCompare(b.title || '~'),
  };
  return out.sort(by[f.sort] || by.new);
}

/** Counts of species / items / moves / tags across the library, for suggestions. */
export function libraryOptions(teams) {
  const count = (arr) => {
    const m = new Map();
    for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, n }));
  };
  return {
    species: count(teams.flatMap((t) => t.species || [])),
    items: count(teams.flatMap((t) => t.items || [])),
    moves: count(teams.flatMap((t) => t.moves || [])),
    tags: count(teams.flatMap((t) => [...(t.tags || []), ...(t.auto_tags || [])])),
  };
}
