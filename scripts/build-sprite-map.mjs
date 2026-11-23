// Builds src/data/spriteMap.json: Showdown species id -> PMD SpriteCollab folder paths.
// Run with: npm run sprites   (re-run whenever PMD adds new forms)
import { Dex } from '@pkmn/dex';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const TRACKER_URL = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/tracker.json';
const local = process.argv[2];
const tracker = local && existsSync(local)
  ? JSON.parse(readFileSync(local, 'utf8'))
  : await (await fetch(TRACKER_URL)).json();

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const hasPortrait = (n) => !!n && !!n.portrait_files && 'Normal' in n.portrait_files;
const hasSprite = (n) => !!n && !!n.sprite_files && 'Idle' in n.sprite_files;

// Showdown forme names that PMD spells differently
const FORME_ALIASES = {
  'f': ['female'],
  'mega': ['mega'],
  'paldeacombat': ['paldea'],
  'bloodmoon': ['bloodmoon'],
  'shadow': ['shadowrider', 'shadow'],
  'ice': ['icerider', 'ice'],
};

function findForm(root, forme) {
  const want = norm(forme);
  const candidates = [want, ...(FORME_ALIASES[want] || [])];
  for (const [key, node] of Object.entries(root.subgroups || {})) {
    if (candidates.includes(norm(node.name))) return { key, node };
  }
  return null;
}

function femaleNode(root) {
  const n = root.subgroups?.['0000']?.subgroups?.['0000']?.subgroups?.['0002'];
  return n && norm(n.name) === 'female' ? n : null;
}

const map = {};
const missing = [];
for (const id of Object.keys(Dex.data.Species)) {
  const sp = Dex.species.get(id);
  if (!sp.exists || sp.num <= 0) continue;
  const dex = String(sp.num).padStart(4, '0');
  const root = tracker[dex];
  if (!root) { missing.push(sp.name); continue; }

  let pPath = dex, sPath = hasSprite(root) ? dex : null, matched = !sp.forme;
  if (sp.forme) {
    let form = findForm(root, sp.forme);
    if (form) {
      matched = true;
      if (hasPortrait(form.node)) pPath = `${dex}/${form.key}`;
      if (hasSprite(form.node)) sPath = `${dex}/${form.key}`;
    } else if (norm(sp.forme) === 'f' && femaleNode(root)) {
      matched = true;
      const n = femaleNode(root);
      if (hasPortrait(n)) pPath = `${dex}/0000/0000/0002`;
      if (hasSprite(n)) sPath = `${dex}/0000/0000/0002`;
    }
  }
  if (!hasPortrait(root) && pPath === dex) pPath = null;
  if (!matched && !/gmax|totem|starter|antique|masterpiece/i.test(sp.forme)) missing.push(sp.name);
  map[sp.id] = { p: pPath, s: sPath };
}

mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/spriteMap.json', JSON.stringify(map));
console.log(`Mapped ${Object.keys(map).length} species. Forms without a dedicated PMD form (use base art): ${missing.length}`);
if (process.env.VERBOSE) console.log(missing.join(', '));
