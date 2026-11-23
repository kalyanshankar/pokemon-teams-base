import { useState } from 'react';
import Modal from './Modal.jsx';
import { AnimatedSprite, ItemIcon, Portrait } from './Sprites.jsx';
import { speciesName } from '../lib/dex.js';
import { deleteTeam } from '../lib/store.js';

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = async (what, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1600); }
    catch { setCopied(''); }
  };
  return [copied, copy];
}

export default function TeamDetail({ team, onClose, onEdit, onDeleted }) {
  const [copied, copy] = useCopy();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    try { await deleteTeam(team.id); onDeleted(team.id); }
    catch (e) { setError(e.message || 'Delete failed.'); }
  }

  const tags = [...(team.tags || []), ...(team.auto_tags || [])];
  const title = team.title || team.members.map((m) => m.species).slice(0, 2).join(' + ') + ' team';

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="detail-meta">
        <span>{team.author ? `by ${team.author}` : 'Unknown player'}</span>
        {team.format && <span className="tag">{team.format}</span>}
        {team.rating ? <span className="stars">{'★'.repeat(team.rating)}</span> : null}
      </div>

      <div className="row wrap">
        <button type="button" className="btn primary" onClick={() => copy('paste', team.raw_paste)}>
          {copied === 'paste' ? 'Copied' : 'Copy team text'}
        </button>
        {team.replica_code && (
          <button type="button" className="btn" onClick={() => copy('code', team.replica_code)}>
            {copied === 'code' ? 'Copied' : `Copy code ${team.replica_code}`}
          </button>
        )}
        {team.source_url && <a className="btn" href={team.source_url} target="_blank" rel="noreferrer">Open source</a>}
        {team.pokepaste_url && <a className="btn" href={team.pokepaste_url} target="_blank" rel="noreferrer">Open pokepaste</a>}
        <span className="spacer" />
        <button type="button" className="btn ghost" onClick={() => onEdit(team)}>Edit</button>
        {confirm
          ? <button type="button" className="btn danger" onClick={remove}>Delete for good</button>
          : <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>Delete</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {tags.length > 0 && <div className="tags">{tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
      {team.notes && <p className="notes">{team.notes}</p>}

      <ul className="members">
        {team.members.map((m, i) => (
          <li key={i} className="member">
            <div className="member-art">
              <AnimatedSprite speciesId={m.speciesId} />
              {m.mega && (
                <span className="mega-chip" title={`Mega Evolves into ${speciesName(m.mega)}`}>
                  <Portrait speciesId={m.mega} size={32} /> Mega
                </span>
              )}
            </div>
            <div className="member-body">
              <h3>{m.nickname ? `${m.nickname} (${m.species})` : m.species}{m.gender ? <small> {m.gender}</small> : null}</h3>
              {m.item && <ItemIcon item={m.itemId || m.item} showName />}
              <dl>
                {m.ability && <><dt>Ability</dt><dd>{m.ability}</dd></>}
                {m.nature && <><dt>Nature</dt><dd>{m.nature}</dd></>}
                {m.teraType && <><dt>Tera</dt><dd>{m.teraType}</dd></>}
              </dl>
              {m.spread?.map((line) => <p key={line} className="spread">{line}</p>)}
              <ul className="moves">{m.moves.map((mv) => <li key={mv}>{mv}</li>)}</ul>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
