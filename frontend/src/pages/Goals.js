import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    title: '',
    target_value: '',
    unit: 'km',
    deadline: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await getGoals();
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to load goals:', err);
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
      await createGoal({
        ...form,
        target_value: parseFloat(form.target_value) || 0
      });
      setShowModal(false);
      setForm({ title: '', target_value: '', unit: 'km', deadline: '' });
      await loadGoals();
      showToast('Goal created!');
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleUpdateProgress = async (goal) => {
    const newValue = prompt(`Update progress for "${goal.title}" (current: ${goal.current_value} ${goal.unit}):`, goal.current_value);
    if (newValue === null) return;
    
    const parsed = parseFloat(newValue);
    if (isNaN(parsed)) return;

    try {
      const updates = { current_value: parsed };
      if (parsed >= goal.target_value) {
        updates.status = 'completed';
      }
      await updateGoal(goal.id, updates);
      await loadGoals();
      showToast(parsed >= goal.target_value ? 'Goal completed!' : 'Progress updated!');
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id);
      await loadGoals();
      showToast('Goal deleted');
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#2ed573';
    if (pct >= 60) return '#6c5ce7';
    if (pct >= 30) return '#00d2ff';
    return '#ffa502';
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `${days} days left`;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Goals</h2>
          <p>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading goals...</p></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <Target size={48} />
          <h3>No goals yet</h3>
          <p>Set your first fitness goal and start tracking your progress.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Goal
          </button>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                Active Goals
              </h3>
              <div className="goals-grid">
                {activeGoals.map((goal) => {
                  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  const color = getProgressColor(pct);
                  return (
                    <div key={goal.id} className="goal-card animate-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4>{goal.title}</h4>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '14px',
                          fontWeight: 600, color
                        }}>
                          {pct}%
                        </span>
                      </div>
                      
                      <div className="goal-progress-bar">
                        <div
                          className="goal-progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}88)`
                          }}
                        />
                      </div>
                      
                      <div className="goal-meta">
                        <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                        <span style={{ color: goal.deadline && getDaysLeft(goal.deadline) === 'Overdue' ? 'var(--accent-warm)' : 'var(--text-muted)' }}>
                          {getDaysLeft(goal.deadline) || 'No deadline'}
                        </span>
                      </div>

                      <div className="goal-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateProgress(goal)}
                          style={{ flex: 1 }}
                        >
                          <TrendingUp size={14} /> Update Progress
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                Completed
              </h3>
              <div className="goals-grid">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="goal-card animate-in" style={{ opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle size={18} color="var(--accent-success)" />
                      <h4>{goal.title}</h4>
                    </div>
                    <div className="goal-progress-bar">
                      <div className="goal-progress-fill" style={{ width: '100%', background: 'var(--accent-success)' }} />
                    </div>
                    <div className="goal-meta">
                      <span>{goal.target_value} {goal.unit} completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Goal Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Goal</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Goal Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Run 50km this month"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Value</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={form.target_value}
                    onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    className="form-select"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="km">km</option>
                    <option value="kg">kg</option>
                    <option value="sessions">sessions</option>
                    <option value="kcal">kcal</option>
                    <option value="reps">reps</option>
                    <option value="hours">hours</option>
                    <option value="minutes">minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Deadline (optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Goals;
