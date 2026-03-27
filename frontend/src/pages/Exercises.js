import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, X, Youtube, ChevronRight, Info, AlertTriangle,
  Lightbulb, Bookmark, BookmarkCheck, Globe, Loader,
} from 'lucide-react';
import { EXERCISE_DB } from '../data/exercises';
import {
  searchExercisesOnline, getSavedExercises, saveExercise, deleteSavedExercise,
} from '../api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'My Library'];

const CATEGORY_COLORS = {
  Chest: '#6c5ce7', Back: '#00d2ff', Shoulders: '#ffa502',
  Arms: '#fd79a8', Legs: '#2ed573', Core: '#ff6b6b', Cardio: '#fdcb6e',
  'My Library': '#a29bfe',
};

const DIFFICULTY_COLORS = {
  Beginner:     { background: 'rgba(46,213,115,0.15)',  color: '#2ed573' },
  Intermediate: { background: 'rgba(108,92,231,0.15)',  color: '#6c5ce7' },
  Advanced:     { background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' },
};

// ─── Exercise Detail Modal ────────────────────────────────────────────────────
function ExerciseModal({ exercise, onClose, isSaved, savedId, onSave, onUnsave }) {
  const [saving, setSaving] = useState(false);

  if (!exercise) return null;

  const catColor = CATEGORY_COLORS[exercise.category] || '#6c5ce7';
  const diff     = DIFFICULTY_COLORS[exercise.difficulty] || DIFFICULTY_COLORS.Beginner;
  const ytUrl    = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.videoSearch || exercise.name + ' exercise tutorial')}`;
  const isWeb    = !!exercise.source;

  const steps    = exercise.steps    || exercise.instructions || [];
  const tips     = exercise.tips     ? exercise.tips     : exercise.tip     ? [exercise.tip]     : [];
  const mistakes = exercise.mistakes
    ? (Array.isArray(exercise.mistakes) ? exercise.mistakes : exercise.mistakes.split(' · '))
    : [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(exercise);
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    setSaving(true);
    try {
      await onUnsave(exercise.name, savedId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal exercise-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ex-modal-header" style={{ borderColor: catColor }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span className="ex-cat-chip" style={{ background: `${catColor}20`, color: catColor }}>
                {exercise.category}
              </span>
              {isWeb && (
                <span className="ex-web-badge">
                  <Globe size={10} /> From Web
                </span>
              )}
              {isSaved && (
                <span className="ex-saved-badge">
                  <BookmarkCheck size={10} /> Saved
                </span>
              )}
            </div>
            <h2 className="ex-modal-title">{exercise.name}</h2>
            {exercise.description && (
              <p className="ex-modal-desc">{exercise.description}</p>
            )}
          </div>
          <button className="ex-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Meta row */}
        <div className="ex-meta-row">
          <span className="ex-badge" style={diff}>{exercise.difficulty}</span>
          <span className="ex-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
            🏋️ {exercise.equipment}
          </span>
          <span className="ex-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
            ⏱ {exercise.sets}
          </span>
          <span className="ex-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
            💤 Rest: {exercise.rest}
          </span>
        </div>

        {/* Muscles */}
        {(exercise.muscles?.length > 0 || exercise.secondary?.length > 0) && (
          <div className="ex-muscles-section">
            {exercise.muscles?.length > 0 && (
              <div className="ex-muscle-group">
                <span className="ex-muscle-label">Primary</span>
                <div className="ex-muscle-tags">
                  {exercise.muscles.map(m => (
                    <span key={m} className="ex-muscle-tag primary">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondary?.length > 0 && (
              <div className="ex-muscle-group">
                <span className="ex-muscle-label">Secondary</span>
                <div className="ex-muscle-tags">
                  {exercise.secondary.map(m => (
                    <span key={m} className="ex-muscle-tag secondary">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step-by-step instructions */}
        {steps.length > 0 && (
          <div className="ex-section">
            <h4 className="ex-section-title"><Info size={14} /> How To Do It</h4>
            <ol className="ex-steps">
              {steps.map((step, i) => (
                <li key={i} className="ex-step">
                  <span className="ex-step-num" style={{ background: `${catColor}25`, color: catColor }}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Pro Tips */}
        {tips.length > 0 && (
          <div className="ex-tip-box">
            <Lightbulb size={15} style={{ color: '#ffa502', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div className="ex-tip-label">Pro Tips</div>
              {tips.map((t, i) => (
                <div key={i} className="ex-tip-text" style={i > 0 ? { marginTop: 6 } : {}}>
                  {tips.length > 1 && <span style={{ color: '#ffa502', marginRight: 6 }}>›</span>}
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {mistakes.length > 0 && (
          <div className="ex-mistake-box">
            <AlertTriangle size={15} style={{ color: '#ff6b6b', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div className="ex-mistake-label">Common Mistakes to Avoid</div>
              {mistakes.map((m, i) => (
                <div key={i} className="ex-mistake-text" style={i > 0 ? { marginTop: 6 } : {}}>
                  {mistakes.length > 1 && <span style={{ color: '#ff6b6b', marginRight: 6 }}>›</span>}
                  {m}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No steps fallback for web results */}
        {steps.length === 0 && isWeb && (
          <div className="ex-section" style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            Detailed instructions not available from the web source. Watch the tutorial below for guidance.
          </div>
        )}

        {/* Action row: Save + YouTube */}
        <div className="ex-action-row">
          {isSaved ? (
            <button
              className="ex-unsave-btn"
              onClick={handleUnsave}
              disabled={saving}
            >
              {saving ? <Loader size={15} className="spin" /> : <BookmarkCheck size={15} />}
              {saving ? 'Removing…' : 'Saved — Remove'}
            </button>
          ) : (
            <button
              className="ex-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader size={15} className="spin" /> : <Bookmark size={15} />}
              {saving ? 'Saving…' : 'Save to My Library'}
            </button>
          )}

          <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="ex-yt-btn">
            <Youtube size={18} />
            Watch Tutorial
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </a>
        </div>

      </div>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onClick, isSaved }) {
  const catColor = CATEGORY_COLORS[exercise.category] || '#6c5ce7';
  const diff     = DIFFICULTY_COLORS[exercise.difficulty] || DIFFICULTY_COLORS.Beginner;
  const isWeb    = !!exercise.source;

  return (
    <div className="ex-card animate-in" onClick={() => onClick(exercise)}>
      <div className="ex-card-top" style={{ background: `${catColor}10` }}>
        <span className="ex-cat-chip-sm" style={{ background: `${catColor}20`, color: catColor }}>
          {exercise.category}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isWeb && (
            <span className="ex-web-badge-sm">
              <Globe size={9} />
            </span>
          )}
          {isSaved && (
            <span className="ex-saved-badge-sm">
              <BookmarkCheck size={9} />
            </span>
          )}
          <span className="ex-diff-chip" style={diff}>{exercise.difficulty}</span>
        </div>
      </div>
      <div className="ex-card-body">
        <h4 className="ex-card-name">{exercise.name}</h4>
        <div className="ex-card-muscles">
          {(exercise.muscles || []).slice(0, 2).map(m => (
            <span key={m} className="ex-muscle-tag primary small">{m}</span>
          ))}
        </div>
        <div className="ex-card-equipment">🏋️ {exercise.equipment}</div>
        <div className="ex-card-sets">{exercise.sets}</div>
      </div>
      <div className="ex-card-footer">
        <span style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>
          View Details →
        </span>
      </div>
    </div>
  );
}

// ─── Main Exercises Page ──────────────────────────────────────────────────────
function Exercises() {
  const [category,       setCategory]       = useState('All');
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState(null);

  // Online search state
  const [onlineResults,  setOnlineResults]  = useState([]);
  const [onlineLoading,  setOnlineLoading]  = useState(false);
  const [onlineError,    setOnlineError]    = useState('');
  const [onlineSearched, setOnlineSearched] = useState('');  // query that was last searched

  // My Library state — Map<name, saved_id>
  const [savedMap,       setSavedMap]       = useState({});
  const [savedExercises, setSavedExercises] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Load saved exercises on mount
  useEffect(() => {
    setLibraryLoading(true);
    getSavedExercises()
      .then(res => {
        const exs = res.data || [];
        setSavedExercises(exs);
        const map = {};
        exs.forEach(ex => { map[ex.name] = ex.saved_id; });
        setSavedMap(map);
      })
      .catch(() => {})
      .finally(() => setLibraryLoading(false));
  }, []);

  // Reset online results when search query changes
  useEffect(() => {
    if (search !== onlineSearched) {
      setOnlineResults([]);
      setOnlineError('');
    }
  }, [search, onlineSearched]);

  // ── Filtered local results ──────────────────────────────────
  const filtered = useMemo(() => {
    if (category === 'My Library') {
      if (!search) return savedExercises;
      const q = search.toLowerCase();
      return savedExercises.filter(ex =>
        ex.name.toLowerCase().includes(q) ||
        (ex.muscles || []).some(m => m.toLowerCase().includes(q)) ||
        (ex.equipment || '').toLowerCase().includes(q)
      );
    }
    return EXERCISE_DB.filter(ex => {
      const matchCat = category === 'All' || ex.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscles.some(m => m.toLowerCase().includes(q)) ||
        ex.secondary.some(m => m.toLowerCase().includes(q)) ||
        ex.equipment.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [category, search, savedExercises]);

  // ── Online search handler ───────────────────────────────────
  const handleSearchOnline = useCallback(async () => {
    if (!search || search.length < 2) return;
    setOnlineLoading(true);
    setOnlineError('');
    setOnlineResults([]);
    try {
      const res = await searchExercisesOnline(search);
      const exs = res.data?.exercises || [];
      setOnlineResults(exs);
      setOnlineSearched(search);
      if (exs.length === 0) setOnlineError('No results found online. Try a different term.');
    } catch {
      setOnlineError('Could not reach the exercise database. Check your connection.');
    } finally {
      setOnlineLoading(false);
    }
  }, [search]);

  // ── Save / Unsave handlers ──────────────────────────────────
  const handleSave = useCallback(async (exercise) => {
    try {
      const res = await saveExercise(exercise);
      const newSavedId = res.data.saved_id;
      setSavedMap(prev => ({ ...prev, [exercise.name]: newSavedId }));
      // Add to savedExercises list
      setSavedExercises(prev => [{ ...exercise, saved_id: newSavedId }, ...prev]);
      // Update selected so the modal reflects saved state instantly
      setSelected(s => s ? { ...s } : s);
    } catch (err) {
      if (err.response?.status === 409) {
        // Already saved — sync the map
        const existingId = err.response.data?.saved_id;
        if (existingId) setSavedMap(prev => ({ ...prev, [exercise.name]: existingId }));
      }
    }
  }, []);

  const handleUnsave = useCallback(async (name, savedId) => {
    try {
      await deleteSavedExercise(savedId);
      setSavedMap(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setSavedExercises(prev => prev.filter(e => e.name !== name));
    } catch {}
  }, []);

  const showSearchOnline = category !== 'My Library' && search.length >= 2;

  return (
    <div>
      <div className="page-header">
        <h2>Exercise Library</h2>
        <p>
          {EXERCISE_DB.length} built-in exercises · search online for anything else · save to your personal library
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          className="form-input"
          placeholder="Search by name, muscle, equipment…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40, maxWidth: 420 }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setOnlineResults([]); setOnlineSearched(''); }}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 4,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="ex-category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`ex-cat-tab ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(cat); setOnlineResults([]); }}
            style={category === cat && cat !== 'All'
              ? { background: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat], borderColor: `${CATEGORY_COLORS[cat]}40` }
              : {}}
          >
            {cat === 'My Library' ? '🔖 My Library' : cat}
            {cat !== 'All' && cat !== 'My Library' && (
              <span className="ex-cat-count">
                {EXERCISE_DB.filter(e => e.category === cat).length}
              </span>
            )}
            {cat === 'My Library' && Object.keys(savedMap).length > 0 && (
              <span className="ex-cat-count">{Object.keys(savedMap).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── MY LIBRARY view ──────────────────────────────────── */}
      {category === 'My Library' && (
        <div>
          {libraryLoading ? (
            <div className="empty-state">
              <Loader size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
              <p style={{ marginTop: 12 }}>Loading your library…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
              <h3>Your library is empty</h3>
              <p>
                Search for any exercise, click <strong>Save to My Library</strong> in the detail view,
                and it will appear here permanently.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                {filtered.length} saved exercise{filtered.length !== 1 ? 's' : ''}
              </div>
              <div className="ex-grid">
                {filtered.map(ex => (
                  <ExerciseCard
                    key={ex.saved_id || ex.id || ex.name}
                    exercise={ex}
                    onClick={setSelected}
                    isSaved
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NORMAL / SEARCH view ─────────────────────────────── */}
      {category !== 'My Library' && (
        <div>
          {/* Results count */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
            {category !== 'All' && (
              <span style={{ color: CATEGORY_COLORS[category] || 'var(--accent-primary)', marginLeft: 8, fontWeight: 600 }}>
                · {category}
              </span>
            )}
          </div>

          {/* Local results grid */}
          {filtered.length > 0 && (
            <div className="ex-grid">
              {filtered.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onClick={setSelected}
                  isSaved={!!savedMap[ex.name]}
                />
              ))}
            </div>
          )}

          {/* No local results message */}
          {filtered.length === 0 && !showSearchOnline && (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3>No exercises found</h3>
              <p>Try a different search term or category.</p>
            </div>
          )}

          {/* ── Search Online section ─────────────────────────── */}
          {showSearchOnline && (
            <div className="ex-online-section">
              <div className="ex-online-header">
                <Globe size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {filtered.length > 0
                    ? `Don't see what you need? Search the web for "${search}"`
                    : `No local results for "${search}" — try searching online`}
                </span>
              </div>

              {/* Search Online button */}
              {!onlineLoading && onlineSearched !== search && (
                <button className="ex-search-online-btn" onClick={handleSearchOnline}>
                  <Globe size={15} />
                  Search Online for "{search}"
                </button>
              )}

              {/* Loading spinner */}
              {onlineLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', padding: '16px 0' }}>
                  <Loader size={18} className="spin" />
                  <span>Searching exercise database…</span>
                </div>
              )}

              {/* Error */}
              {onlineError && (
                <div style={{ color: 'var(--danger)', fontSize: 13, padding: '8px 0' }}>
                  {onlineError}
                </div>
              )}

              {/* Online results */}
              {onlineResults.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '16px 0 12px' }}>
                    {onlineResults.length} result{onlineResults.length !== 1 ? 's' : ''} from web
                    <span style={{ marginLeft: 8, color: 'var(--accent-primary)' }}>· Click to view details · Save to keep permanently</span>
                  </div>
                  <div className="ex-grid">
                    {onlineResults.map(ex => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        onClick={setSelected}
                        isSaved={!!savedMap[ex.name]}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <ExerciseModal
          exercise={selected}
          onClose={() => setSelected(null)}
          isSaved={!!savedMap[selected.name]}
          savedId={savedMap[selected.name]}
          onSave={handleSave}
          onUnsave={handleUnsave}
        />
      )}
    </div>
  );
}

export default Exercises;
