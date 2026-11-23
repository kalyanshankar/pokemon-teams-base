import { Teams } from '@pkmn/sets';
import { Dex, toID, speciesData, megaFor } from './dex.js';

const SPREAD_LINE = /^\s*(EVs|IVs|Stat Points|SPs?)\s*:/i;

/** Split a paste into one text block per Pokémon. */
function splitBlocks(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.split('\n').map((l) => l.replace(/\s+$/, '')).filter(Boolean).join('\n'))
    .filter((b) => b.trim() && !/^===/.test(b.trim()));
}

const TAG_RULES = [
  { tag: 'Trick Room', moves: ['trickroom'] },
  { tag: 'Tailwind', moves: ['tailwind'] },
  { tag: 'Fake Out', moves: ['fakeout'] },
  { tag: 'Redirection', moves: ['followme', 'ragepowder'] },
  { tag: 'Intimidate', abilities: ['intimidate'] },
  { tag: 'Sun', abilities: ['drought', 'orichalcumpulse', 'desolateland'], moves: ['sunnyday'] },
  { tag: 'Rain', abilities: ['drizzle', 'primordialsea'], moves: ['raindance'] },
  { tag: 'Sand', abilities: ['sandstream'], moves: ['sandstorm'] },
  { tag: 'Snow', abilities: ['snowwarning'], moves: ['snowscape'] },
  { tag: 'Psychic Terrain', abilities: ['psychicsurge'], moves: ['psychicterrain'] },
  { tag: 'Grassy Terrain', abilities: ['grassysurge'], moves: ['grassyterrain'] },
  { tag: 'Electric Terrain', abilities: ['electricsurge', 'hadronengine'], moves: ['electricterrain'] },
  { tag: 'Misty Terrain', abilities: ['mistysurge'], moves: ['mistyterrain'] },
  { tag: 'Perish Song', moves: ['perishsong'] },
  { tag: 'Speed Control', moves: ['icywind', 'electroweb', 'thunderwave', 'scaryface', 'bleakwindstorm'] },
];

function memberSignature(m) {
  return [m.speciesId, m.itemId, m.abilityId, [...m.moveIds].sort().join(',')].join(':');
}

/**
 * Parse a Showdown/Pokepaste export into everything the database stores.
 * Throws if no Pokémon could be read.
 */
export function parsePaste(text) {
  const blocks = splitBlocks(text || '');
  const parsed = Teams.importTeam(blocks.join('\n\n'))?.team || [];
  if (!parsed.length) throw new Error('No Pokémon found. Paste a Showdown export or a pokepast.es link.');

  const members = parsed.map((set, i) => {
    const sp = speciesData(set.species);
    const speciesId = sp ? sp.id : toID(set.species);
    const itemId = toID(set.item);
    const abilityId = toID(set.ability);
    const moves = (set.moves || []).filter(Boolean);
    const block = blocks[i] || '';
    const spread = block.split('\n').filter((l) => SPREAD_LINE.test(l)).map((l) => l.trim());
    const mega = megaFor(speciesId, itemId);
    return {
      species: sp ? sp.name : set.species,
      speciesId,
      nickname: set.name && toID(set.name) !== speciesId ? set.name : null,
      gender: set.gender || null,
      item: set.item || null,
      itemId,
      ability: set.ability || null,
      abilityId,
      nature: set.nature || null,
      teraType: set.teraType || null,
      level: set.level || null,
      moves,
      moveIds: moves.map(toID),
      spread,
      mega,
      text: block,
    };
  });

  // Abilities that matter for tags include the Mega's ability when holding its stone
  const abilityIds = new Set();
  for (const m of members) {
    if (m.abilityId) abilityIds.add(m.abilityId);
    if (m.mega) {
      const ab = speciesData(m.mega)?.abilities?.[0];
      if (ab) abilityIds.add(toID(ab));
    }
  }
  const moveIds = new Set(members.flatMap((m) => m.moveIds));
  const autoTags = TAG_RULES.filter(
    (r) => r.moves?.some((x) => moveIds.has(x)) || r.abilities?.some((x) => abilityIds.has(x))
  ).map((r) => r.tag);
  if (members.some((m) => m.mega)) autoTags.unshift('Mega');

  return {
    members,
    species: [...new Set(members.map((m) => m.speciesId))],
    items: [...new Set(members.map((m) => m.itemId).filter(Boolean))],
    moves: [...moveIds],
    auto_tags: autoTags,
    signature: members.map(memberSignature).sort().join('|'),
  };
}

/** Rebuild clean Showdown text from stored members (used for "Copy paste"). */
export function membersToText(members) {
  return members.map((m) => m.text).join('\n\n');
}

const PASTE_URL = /^https?:\/\/(?:www\.)?pokepast\.es\/([a-f0-9]+)/i;

export function pokepasteId(input) {
  const m = (input || '').trim().match(PASTE_URL);
  return m ? m[1] : null;
}

/**
 * Fetch a pokepast.es paste through our same-origin proxy (/pp/...),
 * which Vite (dev) and Vercel (production) forward to pokepast.es.
 */
export async function fetchPokepaste(id) {
  const res = await fetch(`/pp/${id}/json`);
  if (res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) {
      const j = await res.json();
      if (j?.paste) return { paste: j.paste, title: j.title || '', author: j.author || '', notes: j.notes || '' };
    }
  }
  const raw = await fetch(`/pp/${id}/raw`);
  if (!raw.ok) throw new Error(`Couldn't load that pokepaste (status ${raw.status}). Check the link or paste the text instead.`);
  return { paste: await raw.text(), title: '', author: '', notes: '' };
}

export { Dex };
