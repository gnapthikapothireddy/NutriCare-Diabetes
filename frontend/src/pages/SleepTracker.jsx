import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Moon, RefreshCw, Sparkles, Plus, Calendar, Star, Info } from 'lucide-react';

const SleepTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [duration, setDuration] = useState('7.5');
  const [quality, setQuality] = useState('Good');
  const [bedtime, setBedtime] = useState('22:30');
  const [waketime, setWaketime] = useState('06:00');
  const [notes, setNotes] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [success, setSuccess] = useState('');

  const loadSleepLogs = async () => {
    if (!user) return;
    try {
      const res = await api.getSleep(user._id);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSleepLogs();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!duration || isNaN(duration) || parseFloat(duration) <= 0) {
      return alert("Please enter a valid sleep duration.");
    }

    const today = new Date().toLocaleDateString('en-CA');
    const sleepData = {
      duration: parseFloat(duration),
      quality,
      date: today,
      bedtime,
      waketime,
      notes
    };

    try {
      const res = await api.logSleep(user._id, sleepData);
      if (res.success) {
        setSuccess('Sleep session logged successfully!');
        setNotes('');
        loadSleepLogs();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Wearable Device Mock Sync
  const handleWearableSync = () => {
    setIsSyncing(true);
    setSyncMessage('Establishing encrypted handshake with wearable API...');
    
    setTimeout(() => {
      setSyncMessage('Syncing circadian metrics from Apple Health / Fitbit...');
      
      setTimeout(() => {
        // Mock data parsed from wearable
        const mockDur = (7 + Math.random() * 2).toFixed(1);
        const qualities = ['Excellent', 'Good', 'Fair'];
        const mockQual = qualities[Math.floor(Math.random() * qualities.length)];
        
        setDuration(mockDur);
        setQuality(mockQual);
        setBedtime('23:00');
        setWaketime('06:45');
        setNotes('Wearable Auto-Sync: Deep Sleep: 2h 10m, REM: 1h 45m.');
        
        setIsSyncing(false);
        setSyncMessage('');
        setSuccess('Successfully synced data from your wearable device!');
        setTimeout(() => setSuccess(''), 3000);
      }, 2000);
    }, 1500);
  };

  // Generate sleep advice based on average sleep
  const getAIAdvice = () => {
    if (logs.length === 0) {
      return "Log a few nights of sleep to unlock custom AI clinical insights. Regular rest stabilizes metabolic functions.";
    }

    const avg = logs.reduce((sum, log) => sum + log.duration, 0) / logs.length;
    const poorLogs = logs.filter(l => l.quality === 'Poor' || l.quality === 'Fair').length;

    if (avg < 6.5) {
      return "⚠️ Warning: Your average sleep duration is below the recommended 7 hours. Chronic sleep deprivation increases cortisol production, which triggers liver glucose release and makes cells more insulin resistant. Try to maintain a regular sleep schedule.";
    }
    if (poorLogs > 2) {
      return "💡 Insight: Multiple logs indicate fair or poor sleep quality. Sleep fragmentation disrupts autonomic nervous system balance and leads to higher morning fasting glucose. Consider avoiding screen exposure 1 hour before bedtime and drinking warm chamomile tea.";
    }
    return "✅ Excellent: You are getting quality rest! Steady 7-8 hours of sleep regulates ghrelin and leptin (hunger hormones) and ensures optimal insulin sensitivity during fasting hours.";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Moon size={28} style={{ color: 'var(--secondary)' }} />
          <h1>Sleep Tracker & Circadian Analysis</h1>
        </div>
        
        {/* Mock Sync Button */}
        <button 
          onClick={handleWearableSync} 
          disabled={isSyncing}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={isSyncing ? 'spin-animation' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Smartwatch / Fitbit'}</span>
        </button>
      </div>

      {isSyncing && (
        <div className="card" style={{ textAlign: 'center', border: '1px solid rgba(2, 136, 209, 0.3)', background: 'rgba(2, 136, 209, 0.05)' }}>
          <RefreshCw size={24} className="spin-animation" style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontWeight: 500, fontSize: 'var(--font-sm)' }}>{syncMessage}</p>
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Main Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Left Form Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Plus size={20} style={{ color: 'var(--secondary)' }} />
            Log Nightly Sleep
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Sleep Duration (Hours)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sleep Quality</label>
              <select className="form-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                <option value="Excellent">Excellent 😊 (Undisturbed, Rested)</option>
                <option value="Good">Good 🙂 (Normal sleep, light waking)</option>
                <option value="Fair">Fair 😐 (Restless, waking up tired)</option>
                <option value="Poor">Poor 😫 (Tossing, severe insomnia)</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Bedtime</label>
                <input type="time" className="form-input" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Wake Time</label>
                <input type="time" className="form-input" value={waketime} onChange={(e) => setWaketime(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sleep Interruption / Notes</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="e.g. woke up once for water, felt anxious" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Log Sleep
            </button>
          </form>
        </div>

        {/* Right Insights and History Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AI Sleep Analysis */}
          <div className="card" style={{ background: 'var(--secondary-light)', border: '1px solid rgba(2, 136, 209, 0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', margin: 0 }}>
              <Sparkles size={20} />
              AI Circadian Insight
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              {getAIAdvice()}
            </p>
          </div>

          {/* Sleep logs table */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={20} style={{ color: 'var(--secondary)' }} />
              Circadian Sleep History
            </h3>

            {logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No sleep records found. Log your sleep to start tracking trends!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-xs)', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Duration</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Timings</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Quality</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice().reverse().map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{log.date}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--secondary)', fontWeight: 'bold' }}>{log.duration} hrs</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{log.bedtime} - {log.waketime}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span 
                            style={{
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                              color: log.quality === 'Excellent' || log.quality === 'Good' ? '#2E7D32' : '#C62828',
                              background: log.quality === 'Excellent' || log.quality === 'Good' ? '#E8F5E9' : '#FFEBEE'
                            }}
                          >
                            {log.quality}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{log.notes || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .spin-animation {
          animation: spin 1.2s infinite linear;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SleepTracker;
