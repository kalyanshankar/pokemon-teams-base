// Quick checks for the paste parser and duplicate detection. Run: npm test
import assert from 'node:assert/strict';
import { parsePaste, pokepasteId } from '../src/lib/parse.js';
import { findDuplicates } from '../src/lib/dupes.js';
import spriteMap from '../src/data/spriteMap.json' with { type: 'json' };

const TEAM = `Spiky (Dragonite) (F) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Extreme Speed
- Scale Shot
- Protect
- Tailwind

Incineroar @ Sitrus Berry
Ability: Intimidate
Stat Points: 32 HP / 2 Atk / 32 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Parting Shot
- Knock Off

Sinistcha @ Rocky Helmet
Ability: Hospitality
- Matcha Gotcha
- Rage Powder
- Trick Room
- Life Dew

Charizard @ Charizardite Y
Ability: Blaze
Modest Nature
- Heat Wave
- Solar Beam
- Protect
- Weather Ball

Urshifu-Rapid-Strike @ Mystic Water
Ability: Unseen Fist
- Surging Strikes
- Close Combat
- Aqua Jet
- Detect

Basculegion-F @ Choice Scarf
Ability: Swift Swim
- Wave Crash
- Last Respects
- Aqua Jet
- Flip Turn
`;

const t = parsePaste(TEAM.replace(/\n/g, '\r\n'));
assert.equal(t.members.length, 6);
assert.deepEqual(t.species, ['dragonite', 'incineroar', 'sinistcha', 'charizard', 'urshifurapidstrike', 'basculegionf']);
assert.equal(t.members[0].nickname, 'Spiky');
assert.equal(t.members[0].mega, 'dragonitemega');
assert.equal(t.members[3].mega, 'charizardmegay');
assert.deepEqual(t.members[1].spread, ['Stat Points: 32 HP / 2 Atk / 32 SpD']);
for (const tag of ['Mega', 'Tailwind', 'Fake Out', 'Redirection', 'Trick Room', 'Intimidate', 'Sun']) {
  assert.ok(t.auto_tags.includes(tag), `missing tag ${tag}`);
}
for (const id of t.species) assert.ok(spriteMap[id]?.p, `no PMD portrait for ${id}`);

// Duplicates: identical sets -> exact; one move changed -> similar (not duplicate)
const saved = [{ id: 'a', title: 'Saved', ...t }];
assert.equal(findDuplicates(t, saved).exact.length, 1);
const tweaked = parsePaste(TEAM.replace('- Life Dew', '- Protect'));
const d = findDuplicates(tweaked, saved);
assert.equal(d.exact.length, 0);
assert.equal(d.similar.length, 1);
assert.match(d.similar[0].diffs[0].parts[0], /Life Dew.*Protect/);
// Same replica code counts as exact even if sets differ
assert.equal(findDuplicates({ ...tweaked, replica_code: 'abc123' }, [{ ...saved[0], replica_code: 'ABC123' }]).exact.length, 1);

assert.equal(pokepasteId('https://pokepast.es/1a2b3c4d5e6f7a8b'), '1a2b3c4d5e6f7a8b');
assert.equal(pokepasteId('Incineroar @ Sitrus Berry'), null);
assert.throws(() => parsePaste('hello there'));

console.log('All parser and duplicate checks passed.');
