import { useMemo, useState } from 'react';
import Modal from './Modal.jsx';
import { TeamStrip } from './TeamCard.jsx';
import { parsePaste, pokepasteId, fetchPokepaste } from '../lib/parse.js';
import { findDuplicates } from '../lib/dupes.js';
import { insertTeam, updateTeam } from '../lib/store.js';

const blank = { title: '', author: '', source_url: '', pokepaste_url: '', replica_code: '', format: 'Champions', notes: '', rating: 0, tags: '' };

export default function TeamForm({ team, teams, onSaved, onClose }) {
  const editing = !!team;
  const [input, setInput] = useState(team?.raw_paste || '');
  const [rawPaste, setRawPaste] = useState(team?.raw_paste || '');
  const [fields, setFields] = useState(() => {
    if (!team) return blank;
    const f = Object.fromEntries(Object.keys(blank).map((k) => [k, team[k] ?? blank[k]]));
    return { ...f, tags: (team.tags || []).join(', ') };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ackDuplicate, setAckDuplicate] = useState(false);

  const set = (k) => (e) => setFields({ ...fields, [k]: e.target.value });

  const parsed = useMemo(() => {
    if (!rawPaste.trim()) return null;
    try { return parsePaste(rawPaste); } catch { return null; }
  }, [rawPaste]);

  const dupes = useMemo(
    () => (parsed ? findDuplicates({ ...parsed, replica_code: fields.replica_code }, teams, team?.id) : { exact: [], similar: [] }),
    [parsed, fields.replica_code, teams, team?.id]
  );

  async function readTeam() {
    setError('');
    const id = pokepasteId(input);
    if (!id) {
      try { parsePaste(input); setRawPaste(input); } catch (e) { setError(e.message); setRawPaste(''); }
      return;
    }
    setLoading(true);
    try {
      const p = await fetchPokepaste(id);
      parsePaste(p.paste);
      setRawPaste(p.paste);
      setInput(p.paste);
      setFields((f) => ({
        ...f,
        pokepaste_url: input.trim(),
        title: f.title || p.title,
        author: f.author || p.author,
        notes: f.notes || p.notes,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!parsed) { setError('Read a team first: paste a pokepast.es link or the team text, then press Read team.'); return; }
    setSaving(true);
    setError('');
    const row = {
      ...fields,
      raw_paste: rawPaste,
      rating: Number(fields.rating) || null,
      tags: fields.tags.split(',').map((t) => t.trim()).filter(Boolean),
      replica_code: fields.replica_code.trim().toUpperCase(),
      ...parsed,
    };
    try {
      const saved = editing ? await updateTeam(team.id, row) : await insertTeam(row);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Saving failed.');
      setSaving(false);
    }
  }

  const blocked = dupes.exact.length > 0 && !ackDuplicate;

  return (
    <Modal title={editing ? 'Edit team' : 'Add a team'} onClose={onClose} wide>
      <form onSubmit={save} className="team-form">
        <div className="field">
          <label htmlFor="paste">Pokepaste link or team text <span className="req">required</span></label>
          <textarea
            id="paste"
            rows={parsed ? 5 : 10}
            value={input}
            onChange={(e) => { setInput(e.target.value); if (!pokepasteId(e.target.value)) setRawPaste(''); }}
            placeholder={'https://pokepast.es/...\n\nor paste the Showdown export here'}
            spellCheck={false}
          />
          <div className="row">
            <button type="button" className="btn" onClick={readTeam} disabled={!input.trim() || loading}>
              {loading ? 'Reading…' : 'Read team'}
            </button>
            {parsed && <span className="ok">Found {parsed.members.length} Pokémon</span>}
          </div>
        </div>

        {parsed && (
          <div className="preview">
            <TeamStrip members={parsed.members} size={64} />
            {parsed.auto_tags.length > 0 && (
              <div className="tags">{parsed.auto_tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            )}
          </div>
        )}

        {dupes.exact.length > 0 && (
          <div className="notice notice-stop" role="alert">
            <strong>This looks like a team you already saved.</strong>
            <ul>{dupes.exact.map(({ team: t, reason }) => <li key={t.id}>{t.title || 'Untitled team'}{t.author ? ` by ${t.author}` : ''}: {reason}</li>)}</ul>
            <label className="check"><input type="checkbox" checked={ackDuplicate} onChange={(e) => setAckDuplicate(e.target.checked)} /> Save it anyway</label>
          </div>
        )}
        {dupes.exact.length === 0 && dupes.similar.length > 0 && (
          <div className="notice">
            <strong>Same six Pokémon as {dupes.similar.length === 1 ? 'a saved team' : `${dupes.similar.length} saved teams`}, but the sets differ, so it isn't a duplicate.</strong>
            {dupes.similar.slice(0, 3).map(({ team: t, diffs }) => (
              <details key={t.id}>
                <summary>Compared with {t.title || 'Untitled team'}{t.author ? ` by ${t.author}` : ''}</summary>
                <ul>{diffs.map((d) => <li key={d.species}><b>{d.species}</b>: {d.parts.join('; ')}</li>)}</ul>
                {diffs.length === 0 && <p>Only EV/stat spreads or other details differ.</p>}
              </details>
            ))}
          </div>
        )}

        <fieldset className="grid-fields">
          <legend>Details (all optional)</legend>
          <div className="field"><label htmlFor="title">Title</label><input id="title" value={fields.title} onChange={set('title')} /></div>
          <div className="field"><label htmlFor="author2">Player or source person</label><input id="author2" value={fields.author} onChange={set('author')} /></div>
          <div className="field"><label htmlFor="source">Source link</label><input id="source" type="url" value={fields.source_url} onChange={set('source_url')} placeholder="YouTube, X, Reddit…" /></div>
          <div className="field"><label htmlFor="code">Replica code</label><input id="code" value={fields.replica_code} onChange={set('replica_code')} autoCapitalize="characters" /></div>
          <div className="field"><label htmlFor="format">Format</label><input id="format" value={fields.format} onChange={set('format')} placeholder="Champions" /></div>
          <div className="field">
            <label htmlFor="rating2">Rating</label>
            <select id="rating2" value={fields.rating || 0} onChange={set('rating')}>
              <option value={0}>Not rated</option>
              {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
            </select>
          </div>
          <div className="field span-2"><label htmlFor="tags">Your tags</label><input id="tags" value={fields.tags} onChange={set('tags')} placeholder="Comma separated, e.g. ladder, tried it, worlds" /></div>
          <div className="field span-2"><label htmlFor="notes">Notes</label><textarea id="notes" rows={3} value={fields.notes} onChange={set('notes')} /></div>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={!parsed || saving || blocked}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
