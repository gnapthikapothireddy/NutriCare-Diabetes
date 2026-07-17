import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Dumbbell, Plus, Flame, Heart, TrendingUp, RefreshCw } from 'lucide-react';

const ExerciseTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('Walking');
  const [duration, setDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    if (!user) return;
    try {
      const res = await api.getExercise(user._id);
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadLogs();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!duration || isNaN(duration)) return alert('Please enter a valid workout duration.');

    setLoading(true);
    try {
      const res = await api.logExercise(user._id, type, duration, steps);
      if (res.success) {
        setSuccess('Exercise session logged successfully!');
        setDuration('');
        setSteps('');
        loadLogs();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {}
    setLoading(false);
  };

  // Compute metrics
  const totalCalBurned = logs.reduce((a, b) => a + b.calories, 0);
  const totalDuration = logs.reduce((a, b) => a + b.duration, 0);
  const avgHeartScore = logs.length > 0 ? Math.round(logs.reduce((a, b) => a + b.heartScore, 0) / logs.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Dumbbell size={28} style={{ color: 'var(--primary)' }} />
        <h1>{t("exercise")}</h1>
      </div>

      {/* Stats Summary Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="grid-3">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Flame size={32} style={{ color: 'var(--accent)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Energy Burned</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{totalCalBurned} kcal</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Dumbbell size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Active Duration</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{totalDuration} mins</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Heart size={32} style={{ color: '#E53935' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Avg Heart Score</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{avgHeartScore} / 100</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
        {/* Form panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Plus size={20} style={{ color: 'var(--primary)' }} />
            {t("logExercise")}
          </h3>

          {success && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', marginBottom: '1rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t("exType")}</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Walking">{t("walking")}</option>
                <option value="Running">{t("running")}</option>
                <option value="Cycling">{t("cycling")}</option>
                <option value="Yoga">{t("yoga")}</option>
                <option value="Gym">{t("gym")}</option>
                <option value="Meditation">{t("meditation")}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("duration")}</label>
              <input type="number" className="form-input" placeholder="e.g. 30" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </div>

            {type === 'Walking' && (
              <div className="form-group">
                <label className="form-label">{t("steps")}</label>
                <input type="number" className="form-input" placeholder="e.g. 4000" value={steps} onChange={(e) => setSteps(e.target.value)} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging Workout...' : t("logWorkoutBtn")}
            </button>
          </form>
        </div>

        {/* Workout list */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>{t("workoutLogs")}</h3>
          
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No activities logged yet. Record your daily walk or yoga session!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Type</th>
                    <th style={{ padding: '0.75rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem' }}>Steps</th>
                    <th style={{ padding: '0.75rem' }}>Calories</th>
                    <th style={{ padding: '0.75rem' }}>Heart Score</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice().reverse().map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>
                      <td style={{ padding: '0.75rem' }}>{log.date}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{log.type}</td>
                      <td style={{ padding: '0.75rem' }}>{log.duration} mins</td>
                      <td style={{ padding: '0.75rem' }}>{log.steps || '--'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>{log.calories} kcal</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{log.heartScore} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestion Card */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--secondary-light)', border: '1px solid rgba(2, 136, 209, 0.15)' }}>
        <TrendingUp size={24} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: 'var(--font-sm)', display: 'block', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            AI Health Suggestions:
          </strong>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Consistent light exercise like walking lowers blood glucose immediately by absorbing glucose directly into muscles. If you have Type 2, aim for at least 150 minutes of moderate activity weekly.
          </span>
        </div>
      </div>

    </div>
  );
};

export default ExerciseTracker;
