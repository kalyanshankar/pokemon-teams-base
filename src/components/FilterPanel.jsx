import ChipPicker from './ChipPicker.jsx';
import { Portrait, ItemIcon } from './Sprites.jsx';
import { speciesName, itemName, moveName } from '../lib/dex.js';
import { EMPTY_FILTERS, activeCount } from '../lib/filters.js';

const speciesIcon = (v) => <Portrait speciesId={v} size={22} />;
const itemIcon = (v) => <ItemIcon item={v} />;

export default function FilterPanel({ filters, setFilters, options }) {
  const set = (k) => (v) => setFilters({ ...filters, [k]: v });
  const n = activeCount(filters);

  return (
    <aside className="window filters" aria-label="Filters">
      <div className="filters-head">
        <h2>Filters</h2>
        {n > 0 && <button type="button" className="link" onClick={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}>Clear {n}</button>}
      </div>

      <div className="field">
        <label htmlFor="q">Search</label>
        <input id="q" type="search" value={filters.q} onChange={(e) => set('q')(e.target.value)} placeholder="Title, notes, player, code" />
      </div>

      <ChipPicker label="Must include all" values={filters.all} onChange={set('all')} options={options.species} labelOf={speciesName} iconOf={speciesIcon} tone="go" />
      <ChipPicker label="Include at least one" values={filters.any} onChange={set('any')} options={options.species} labelOf={speciesName} iconOf={speciesIcon} />
      <ChipPicker label="Exclude" values={filters.none} onChange={set('none')} options={options.species} labelOf={speciesName} iconOf={speciesIcon} tone="stop" />
      <ChipPicker label="Items" hint="Teams holding all of these" values={filters.items} onChange={set('items')} options={options.items} labelOf={itemName} iconOf={itemIcon} />
      <ChipPicker label="Moves" hint="Teams using all of these" values={filters.moves} onChange={set('moves')} options={options.moves} labelOf={moveName} />
      <ChipPicker label="Tags" values={filters.tags} onChange={set('tags')} options={options.tags} />

      <div className="field-row">
        <div className="field">
          <label htmlFor="author">Player</label>
          <input id="author" value={filters.author} onChange={(e) => set('author')(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rating">Min rating</label>
          <select id="rating" value={filters.minRating} onChange={(e) => set('minRating')(Number(e.target.value))}>
            <option value={0}>Any</option>
            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{'★'.repeat(r)}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="sort">Sort</label>
        <select id="sort" value={filters.sort} onChange={(e) => set('sort')(e.target.value)}>
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
          <option value="rating">Highest rated</option>
          <option value="title">Title A to Z</option>
        </select>
      </div>
    </aside>
  );
}
