import { itemName, moveName } from './dex.js';

const speciesKey = (team) => [...(team.species || [])].sort().join(',');

/**
 * Compare a parsed candidate against saved teams.
 * exact:   same replica code, or same species + items + abilities + moves on every Pokémon
 * similar: same six species, but some items/abilities/moves differ (listed in `diffs`)
 */
export function findDuplicates(candidate, teams, ignoreId = null) {
  const exact = [];
  const similar = [];
  const code = (candidate.replica_code || '').trim().toUpperCase();
  for (const t of teams) {
    if (t.id === ignoreId) continue;
    const sameCode = code && (t.replica_code || '').trim().toUpperCase() === code;
    if (sameCode || (candidate.signature && t.signature === candidate.signature)) {
      exact.push({ team: t, reason: sameCode ? 'Same replica code' : 'Same Pokémon, items, abilities and moves' });
    } else if (speciesKey(t) === speciesKey(candidate)) {
      similar.push({ team: t, diffs: diffMembers(candidate.members, t.members) });
    }
  }
  return { exact, similar };
}

function diffMembers(a, b) {
  const diffs = [];
  for (const m of a) {
    const o = b.find((x) => x.speciesId === m.speciesId);
    if (!o) continue;
    const parts = [];
    if (m.itemId !== o.itemId) parts.push(`item ${itemName(o.itemId) || 'none'} → ${itemName(m.itemId) || 'none'}`);
    if (m.abilityId !== o.abilityId) parts.push(`ability ${o.ability || 'none'} → ${m.ability || 'none'}`);
    const added = m.moveIds.filter((x) => !o.moveIds.includes(x)).map(moveName);
    const removed = o.moveIds.filter((x) => !m.moveIds.includes(x)).map(moveName);
    if (added.length || removed.length) {
      parts.push(`moves ${removed.length ? '−' + removed.join(', −') : ''}${removed.length && added.length ? ' ' : ''}${added.length ? '+' + added.join(', +') : ''}`);
    }
    if (parts.length) diffs.push({ species: m.species, parts });
  }
  return diffs;
}
