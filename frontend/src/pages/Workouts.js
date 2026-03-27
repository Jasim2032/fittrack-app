import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Search, Calculator, ChevronDown } from 'lucide-react';
import { getWorkouts, createWorkout, deleteWorkout } from '../api';

const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Yoga', 'Running', 'Cycling', 'Swimming', 'Boxing', 'Pilates', 'CrossFit'];

// MET values for calorie estimation (kcal/kg/hour)
const MET = {
  Running: 9.8, Cycling: 7.5, HIIT: 8.0, Strength: 5.0,
  Cardio: 6.5, Yoga: 3.0, Swimming: 7.0, Boxing: 9.0,
  Pilates: 3.5, CrossFit: 8.5,
};

function estimateCals(type, minutes, weightKg = 75) {
  const met = MET[type] || 6.0;
  return Math.round(met * weightKg * (minutes / 60));
}

// ─── Exercise Autocomplete ────────────────────────────────────
function ExerciseInput({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const fetchSuggestions = useCallback(async (term) => {
    if (term.length < 2) { setSuggestions([]); setOpen(false); return; }
    setFetching(true);
    try {
      const res = await fetch(
        `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(term)}&language=english&format=json`
      );
      const data = await res.json();
      const names = (data.suggestions || []).map(s => s.value).filter(Boolean).slice(0, 8);
      setSuggestions(names);
      setOpen(names.length > 0);
    } catch {
      // Silently fail — user can still type manually
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
  };

  const handleSelect = (name) => {
    onChange(name);
    setSuggestions([]);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {fetching && (
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          width: 12, height: 12, border: '2px solid var(--accent-primary)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block'
        }} />
      )}
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="autocomplete-item"
              onMouseDown={() => handleSelect(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Workouts Page ────────────────────────────────────────────
function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [toast, setToast] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [form, setForm] = useState({
    workout_type: 'Strength',
    duration_minutes: '',
    calories_burned: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    exercises: [{ name: '', sets: '', reps: '', weight_kg: '' }]
  });

  const [calsAuto, setCalsAuto] = useState(false);

  useEffect(() => { loadWorkouts(); }, []);

  // Auto-estimate calories when type or duration changes
  useEffect(() => {
    if (calsAuto && form.duration_minutes) {
      const est = estimateCals(form.workout_type, parseInt(form.duration_minutes) || 0);
      setForm(f => ({ ...f, calories_burned: String(est) }));
    }
  }, [form.workout_type, form.duration_minutes, calsAuto]);

  const loadWorkouts = async () => {
    try {
      const res = await getWorkouts();
      setWorkouts(res.data);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        duration_minutes: parseInt(form.duration_minutes) || 0,
        calories_burned: parseInt(form.calories_burned) || 0,
        exercises: form.exercises
          .filter(ex => ex.name.trim())
          .map(ex => ({
            ...ex,
            sets: parseInt(ex.sets) || 0,
            reps: parseInt(ex.reps) || 0,
            weight_kg: parseFloat(ex.weight_kg) || 0
          }))
      };
      await createWorkout(payload);
      setShowModal(false);
      resetForm();
      await loadWorkouts();
      showToast('Workout logged successfully!');
    } catch (err) {
      console.error('Failed to create workout:', err);
    }
  };

  const resetForm = () => {
    setForm({
      workout_type: 'Strength',
      duration_minutes: '',
      calories_burned: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      exercises: [{ name: '', sets: '', reps: '', weight_kg: '' }]
    });
    setCalsAuto(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteWorkout(id);
      await loadWorkouts();
      showToast('Workout deleted');
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  const addExercise = () => {
    setForm(f => ({ ...f, exercises: [...f.exercises, { name: '', sets: '', reps: '', weight_kg: '' }] }));
  };

  const updateExercise = (i, field, value) => {
    setForm(f => ({
      ...f,
      exercises: f.exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex)
    }));
  };

  const removeExercise = (i) => {
    setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));
  };

  const handleAutoCalc = () => {
    const newAuto = !calsAuto;
    setCalsAuto(newAuto);
    if (newAuto && form.duration_minutes) {
      const est = estimateCals(form.workout_type, parseInt(form.duration_minutes) || 0);
      setForm(f => ({ ...f, calories_burned: String(est) }));
    }
  };

  const allTypes = ['All', ...WORKOUT_TYPES];
  const filtered = workouts.filter(w => {
    const matchType = typeFilter === 'All' || w.workout_type === typeFilter;
    const matchSearch = !filter ||
      w.workout_type.toLowerCase().includes(filter.toLowerCase()) ||
      (w.notes && w.notes.toLowerCase().includes(filter.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Workouts</h2>
          <p>{workouts.length} workout{workouts.length !== 1 ? 's' : ''} logged</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Log Workout
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            className="form-input"
            placeholder="Search workouts..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {allTypes.map(t => (
            <button
              key={t}
              className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Workout List */}
      {loading ? (
        <div className="empty-state"><p>Loading workouts...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
          <h3>No workouts found</h3>
          <p>Start by logging your first workout.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Workout
          </button>
        </div>
      ) : (
        <div className="workout-list">
          {filtered.map((w) => (
            <div key={w.id} className="workout-item animate-in">
              <div className="workout-item-left">
                <span className={`workout-type-badge badge-${w.workout_type.toLowerCase()}`}>
                  {w.workout_type}
                </span>
                <div className="workout-info">
                  <h4>{w.notes || w.workout_type + ' Session'}</h4>
                  <span>
                    {new Date(w.date).toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {w.exercises?.length > 0 && ` · ${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
              <div className="workout-stats">
                <div className="workout-stat">
                  <div className="value">{w.duration_minutes}</div>
                  <div className="label">min</div>
                </div>
                <div className="workout-stat">
                  <div className="value">{w.calories_burned}</div>
                  <div className="label">kcal</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Workout Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Log New Workout</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Workout Type</label>
                  <select
                    className="form-select"
                    value={form.workout_type}
                    onChange={e => setForm(f => ({ ...f, workout_type: e.target.value }))}
                  >
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date" className="form-input"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number" className="form-input"
                    placeholder="e.g. 45"
                    value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Calories Burned</span>
                    <button
                      type="button"
                      onClick={handleAutoCalc}
                      className={`calorie-auto-btn ${calsAuto ? 'active' : ''}`}
                      title="Auto-calculate with MET formula"
                    >
                      <Calculator size={12} />
                      {calsAuto ? 'Auto ON' : 'Auto'}
                    </button>
                  </label>
                  <input
                    type="number" className="form-input"
                    placeholder="e.g. 350"
                    value={form.calories_burned}
                    onChange={e => { setCalsAuto(false); setForm(f => ({ ...f, calories_burned: e.target.value })); }}
                    readOnly={calsAuto}
                    style={calsAuto ? { background: 'rgba(108,92,231,0.08)', color: 'var(--accent-primary)' } : {}}
                  />
                  {calsAuto && (
                    <div style={{ fontSize: 11, color: 'var(--accent-primary)', marginTop: 4 }}>
                      Estimated via MET formula (75kg body weight)
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="How was the workout?"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Exercises */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600,
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                  letterSpacing: '0.8px', marginBottom: 8
                }}>
                  Exercises <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>· type to search exercise database</span>
                </label>
                {form.exercises.map((ex, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: 8, marginBottom: 8, alignItems: 'start'
                  }}>
                    <ExerciseInput
                      value={ex.name}
                      onChange={val => updateExercise(i, 'name', val)}
                      placeholder="Exercise name"
                    />
                    <input type="number" className="form-input" placeholder="Sets"
                      value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} />
                    <input type="number" className="form-input" placeholder="Reps"
                      value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                    <input type="number" className="form-input" placeholder="Kg"
                      value={ex.weight_kg} onChange={e => updateExercise(i, 'weight_kg', e.target.value)} />
                    {form.exercises.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeExercise(i)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addExercise}>
                  <Plus size={14} /> Add Exercise
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Workouts;
