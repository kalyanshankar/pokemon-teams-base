import { useCallback, useEffect, useMemo, useState } from 'react';
import Login from './components/Login.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import TeamCard from './components/TeamCard.jsx';
import TeamForm from './components/TeamForm.jsx';
import TeamDetail from './components/TeamDetail.jsx';
import { demoMode, getSession, onAuthChange, listTeams, signOut } from './lib/store.js';
import { applyFilters, filtersFromURL, filtersToURL, libraryOptions, activeCount } from './lib/filters.js';

export default function App() {
  const [session, setSession] = useState(undefined);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFiltersState] = useState(filtersFromURL);
  const [showFilters, setShowFilters] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setTeams(await listTeams()); }
    catch (e) { setError(e.message || 'Could not load teams.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (session) load(); }, [session, load]);

  const setFilters = (f) => { setFiltersState(f); filtersToURL(f); };
  const options = useMemo(() => libraryOptions(teams), [teams]);
  const shown = useMemo(() => applyFilters(teams, filters), [teams, filters]);

  const upsert = (saved) => {
    setTeams((ts) => (ts.some((t) => t.id === saved.id) ? ts.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...ts]));
    setAdding(false); setEditing(null); setViewing(saved);
  };

  if (session === undefined) return null;
  if (!session) return <Login />;

  const n = activeCount(filters);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo">Team Base</h1>
        <div className="topbar-actions">
          <button type="button" className="btn ghost filter-toggle" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            Filters{n ? ` (${n})` : ''}
          </button>
          <button type="button" className="btn primary" onClick={() => setAdding(true)}>Add team</button>
          {!demoMode && <button type="button" className="btn ghost" onClick={signOut}>Sign out</button>}
        </div>
      </header>

      {demoMode && (
        <p className="demo-banner">
          Demo mode: teams are saved in this browser only. Add your Supabase keys (see README) to use the cloud database.
        </p>
      )}

      <div className={`layout ${showFilters ? 'filters-open' : ''}`}>
        <FilterPanel filters={filters} setFilters={setFilters} options={options} />

        <main className="library" aria-live="polite">
          {error && <p className="error" role="alert">{error} <button className="link" onClick={load}>Try again</button></p>}
          {!loading && !error && (
            <p className="count">
              {teams.length === 0 ? '' : shown.length === teams.length ? `${teams.length} teams` : `${shown.length} of ${teams.length} teams match`}
            </p>
          )}
          {!loading && teams.length === 0 && !error && (
            <div className="window empty">
              <h2>Your base is empty</h2>
              <p>Save your first team from a pokepast.es link or a Showdown export.</p>
              <button type="button" className="btn primary" onClick={() => setAdding(true)}>Add team</button>
            </div>
          )}
          {!loading && teams.length > 0 && shown.length === 0 && (
            <div className="window empty">
              <h2>No teams match these filters</h2>
              <p>Remove a filter or two to widen the search.</p>
            </div>
          )}
          <div className="grid">
            {shown.map((t) => <TeamCard key={t.id} team={t} onOpen={setViewing} />)}
          </div>
        </main>
      </div>

      <footer className="credits">
        Pokémon portraits and sprites from the <a href="https://sprites.pmdcollab.org/" target="_blank" rel="noreferrer">PMD Sprite Repository</a>, credited to their artists there. Item icons from Pokémon Showdown.
      </footer>

      {adding && <TeamForm teams={teams} onSaved={upsert} onClose={() => setAdding(false)} />}
      {editing && <TeamForm team={editing} teams={teams} onSaved={upsert} onClose={() => setEditing(null)} />}
      {viewing && !editing && (
        <TeamDetail
          team={viewing}
          onClose={() => setViewing(null)}
          onEdit={(t) => setEditing(t)}
          onDeleted={(id) => { setTeams((ts) => ts.filter((t) => t.id !== id)); setViewing(null); }}
        />
      )}
    </div>
  );
}
