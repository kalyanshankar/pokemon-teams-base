import { Dex } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import spriteMap from '../data/spriteMap.json' with { type: 'json' };

const PMD = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master';

export const toID = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function speciesData(nameOrId) {
  const s = Dex.species.get(nameOrId || '');
  return s && s.exists ? s : null;
}

export function speciesName(id) {
  return speciesData(id)?.name || id;
}

export function itemName(id) {
  const i = Dex.items.get(id || '');
  return i && i.exists ? i.name : id;
}

export function moveName(id) {
  const m = Dex.moves.get(id || '');
  return m && m.exists ? m.name : id;
}

/** Mega form id if this item is the species' mega stone. */
export function megaFor(speciesId, itemId) {
  const item = Dex.items.get(itemId || '');
  const sp = speciesData(speciesId);
  if (!item?.exists || !item.megaStone || !sp) return null;
  const target = item.megaStone[sp.baseSpecies] || item.megaStone[sp.name];
  return target ? toID(target) : null;
}

function entry(speciesId) {
  let e = spriteMap[speciesId];
  if (!e) {
    const base = speciesData(speciesId);
    if (base) e = spriteMap[toID(base.baseSpecies)];
  }
  return e || null;
}

export function portraitUrl(speciesId) {
  const e = entry(speciesId);
  return e?.p ? `${PMD}/portrait/${e.p}/Normal.png` : null;
}

export function spriteBase(speciesId) {
  const e = entry(speciesId);
  return e?.s ? `${PMD}/sprite/${e.s}` : null;
}

/** Inline style object for an item icon from Showdown's item sheet. */
export function itemIconStyle(name) {
  if (!name) return null;
  const item = Dex.items.get(name);
  if (!item?.exists) return null;
  const css = Icons.getItem(item.name).style;
  const style = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[prop] = decl.slice(i + 1).trim();
  }
  return style;
}

export { Dex };
