import { Portrait, ItemIcon } from './Sprites.jsx';

export function TeamStrip({ members, size = 56 }) {
  return (
    <ul className="strip">
      {members.map((m, i) => (
        <li key={i} className="slot">
          <Portrait speciesId={m.speciesId} size={size} title={m.species} />
          {m.itemId && <span className="slot-item"><ItemIcon item={m.itemId} /></span>}
          {m.mega && <span className="slot-mega" title="Mega Evolves">M</span>}
        </li>
      ))}
    </ul>
  );
}

export default function TeamCard({ team, onOpen }) {
  const tags = [...(team.tags || []), ...(team.auto_tags || [])].slice(0, 5);
  return (
    <article className="window card">
      <button type="button" className="card-hit" onClick={() => onOpen(team)}>
        <span className="card-title">{team.title || team.members.map((m) => m.species).slice(0, 2).join(' + ') + ' team'}</span>
        <span className="card-meta">
          {team.author ? `by ${team.author}` : 'Unknown player'}
          {team.rating ? <span className="stars" aria-label={`${team.rating} of 5`}>{'★'.repeat(team.rating)}</span> : null}
        </span>
        <TeamStrip members={team.members} />
        {tags.length > 0 && (
          <span className="tags">{tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
        )}
        {team.replica_code && <span className="code">{team.replica_code}</span>}
      </button>
    </article>
  );
}
