import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Activity, Plus, TrendingUp, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js structures
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BloodSugarTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [reading, setReading] = useState('');
  const [mealPeriod, setMealPeriod] = useState('Fasting');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');
  const [chartRange, setChartRange] = useState('7'); // '7' for weekly, '30' for monthly, '1' for daily

  const loadLogs = async () => {
    if (!user) return;
    try {
      const res = await api.getGlucose(user._id);
      if (res.success) {
        // Sort logs by date/time
        const sorted = res.logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setLogs(sorted);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadLogs();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!reading || isNaN(reading)) return alert('Please enter a valid numeric reading.');

    try {
      const res = await api.logGlucose(user._id, reading, mealPeriod, note);
      if (res.success) {
        setSuccess('Sugar reading logged successfully!');
        setReading('');
        setNote('');
        loadLogs();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {}
  };

  // Filter logs for Chart.js display
  const getFilteredLogs = () => {
    const rangeVal = parseInt(chartRange);
    if (rangeVal === 1) {
      // Only today's logs
      const today = new Date().toLocaleDateString('en-CA');
      return logs.filter(l => l.date === today);
    }
    // Limit to latest N readings
    return logs.slice(-rangeVal);
  };

  const chartFiltered = getFilteredLogs();

  // Prepare chart config
  const chartData = {
    labels: chartFiltered.map(l => `${l.mealPeriod} (${l.date.slice(5)})`),
    datasets: [
      {
        label: 'Blood Glucose (mg/dL)',
        data: chartFiltered.map(l => l.reading),
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.1)',
        tension: 0.3,
        pointBackgroundColor: chartFiltered.map(l => 
          l.status === 'red' ? '#E53935' : l.status === 'yellow' ? '#FFB74D' : '#4CAF50'
        ),
        pointBorderColor: '#fff',
        pointRadius: 6,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        min: 50,
        max: 300,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: 'var(--text-muted)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)' }
      }
    }
  };

  // Stats
  const readings = logs.map(l => l.reading);
  const avgGlucose = readings.length > 0 ? Math.round(readings.reduce((a, b) => a + b, 0) / readings.length) : 0;
  const maxGlucose = readings.length > 0 ? Math.max(...readings) : 0;
  const minGlucose = readings.length > 0 ? Math.min(...readings) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Activity size={28} style={{ color: 'var(--primary)' }} />
        <h1>{t("sugarTracker")}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Form Column */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Plus size={20} style={{ color: 'var(--primary)' }} />
            {t("logSugar")}
          </h3>

          {success && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', marginBottom: '1rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t("logSugarValue")}</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 110" 
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("period")}</label>
              <select className="form-select" value={mealPeriod} onChange={(e) => setMealPeriod(e.target.value)}>
                <option value="Fasting">{t("fasting")}</option>
                <option value="Before Breakfast">{t("beforeBreakfast")}</option>
                <option value="After Breakfast">{t("afterBreakfast")}</option>
                <option value="Before Lunch">{t("beforeLunch")}</option>
                <option value="After Lunch">{t("afterLunch")}</option>
                <option value="Before Dinner">{t("beforeDinner")}</option>
                <option value="After Dinner">{t("afterDinner")}</option>
                <option value="Bedtime">{t("bedtime")}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("notes")}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. felt tired, had heavy rice" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {t("saveReading")}
            </button>
          </form>
        </div>

        {/* Chart Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
              {t("dailyTrend")}
            </h3>
            
            {/* Filter Toggle */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[['1', 'Today'], ['7', '7 Logs'], ['30', '30 Logs']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setChartRange(val)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.7rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: chartRange === val ? 'var(--primary)' : 'var(--bg-app)',
                    color: chartRange === val ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '220px', position: 'relative' }}>
            {chartFiltered.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No readings recorded in this range.
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("avgSugar")}</span>
              <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)' }}>{avgGlucose || '--'} mg/dL</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("highestSugar")}</span>
              <strong style={{ fontSize: 'var(--font-md)', color: '#D32F2F' }}>{maxGlucose || '--'} mg/dL</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("lowestSugar")}</span>
              <strong style={{ fontSize: 'var(--font-md)', color: '#2E7D32' }}>{minGlucose || '--'} mg/dL</strong>
            </div>
          </div>
        </div>
      </div>

      {/* History Log List */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={20} style={{ color: '#E53935' }} />
          Glucose Log History
        </h3>
        
        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No logs registered yet. Submit your first reading above!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Time slot</th>
                  <th style={{ padding: '0.75rem' }}>Value</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>AI Warning / Insight</th>
                  <th style={{ padding: '0.75rem' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice().reverse().map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem' }}>{log.date}</td>
                    <td style={{ padding: '0.75rem' }}>{log.mealPeriod}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{log.reading} mg/dL</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span 
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: '#fff',
                          background: log.status === 'red' ? '#E53935' : log.status === 'yellow' ? '#FFB74D' : '#4CAF50'
                        }}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: log.status === 'red' ? '#C62828' : 'var(--text-muted)' }}>
                      {log.insight}
                    </td>
                    <td style={{ padding: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      {log.note || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default BloodSugarTracker;
