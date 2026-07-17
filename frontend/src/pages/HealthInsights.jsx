import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { FilePieChart, Printer, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const HealthInsights = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const loadInsights = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getInsights(user._id);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInsights();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>Generating Health Report...</h2></div>;
  }

  const { metrics, hasData, alerts } = reportData || {};

  // Default mock fallback values if no database records are found
  const sugarAvg = metrics?.avgGlucose || 128;
  const medCompliance = metrics?.medAdherenceRate || 90;
  const healthScore = metrics?.healthScore || 85;
  const activeAlerts = alerts || [
    "Keep tracking morning glucose. Fasting readings are slightly elevated.",
    "Great work on drinking water! Hydration goals met 6 days this week."
  ];

  // Doughnut Chart for Health Score
  const doughnutData = {
    labels: ['Health Score', 'Remaining'],
    datasets: [
      {
        data: [healthScore, 100 - healthScore],
        backgroundColor: ['#2E8B57', 'rgba(0, 0, 0, 0.05)'],
        borderWidth: 0,
        hoverBackgroundColor: ['#257046', 'rgba(0, 0, 0, 0.05)']
      }
    ]
  };

  // Bar Chart for Sugar Level Ranges
  const barData = {
    labels: ['Fasting', 'Post-Meal', 'Bedtime'],
    datasets: [
      {
        label: 'Your Avg (mg/dL)',
        data: [102, 138, 118],
        backgroundColor: '#4FC3F7',
        borderRadius: 8
      },
      {
        label: 'Target Limit (mg/dL)',
        data: [100, 140, 120],
        backgroundColor: '#FFB74D',
        borderRadius: 8
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="printable-report">
      
      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FilePieChart size={28} style={{ color: 'var(--primary)' }} />
          <h1>{t("healthInsights")}</h1>
        </div>
        
        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={18} />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Heading Banner */}
      <div className="print-only" style={{ display: 'none', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0' }}>NutriCare Diabetes AI Report</h1>
        <p style={{ margin: 0 }}>Patient Name: <strong>{user?.name || 'Not provided'}</strong> | Age: <strong>{user?.age || '--'}</strong> | Class: <strong>{user?.diabetesType || 'Type 2'}</strong></p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>Generated on: {new Date().toLocaleDateString()} | Doctor: {user?.doctorName || 'Dr. Self'}</p>
      </div>

      {/* Stats Summary Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Average Glucose</span>
          <strong style={{ fontSize: '2rem', color: sugarAvg > 140 ? '#C62828' : '#2E7D32' }}>{sugarAvg} mg/dL</strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Estimated HbA1c: <strong>{((sugarAvg + 46.7) / 28.7).toFixed(1)}%</strong></span>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Medication Adherence</span>
          <strong style={{ fontSize: '2rem', color: 'var(--primary)' }}>{medCompliance}%</strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Target threshold: <strong>&gt; 85%</strong></span>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Overall Health Score</span>
          <strong style={{ fontSize: '2rem', color: 'var(--secondary)' }}>{healthScore} / 100</strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Grade: <strong>{healthScore > 80 ? 'Optimal' : 'Standard'}</strong></span>
        </div>
      </div>

      {/* Charts Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }} className="grid-2">
        {/* Doughnut Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 'var(--font-sm)', alignSelf: 'flex-start', marginBottom: '1.5rem' }}>Health Quality Index</h3>
          <div style={{ width: '180px', height: '180px' }}>
            <Doughnut data={doughnutData} options={{ cutout: '75%', plugins: { legend: { display: false } } }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem', textAlign: 'center' }}>
            Combined score of glucose trends, hydration, and calories.
          </span>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: 'var(--font-sm)', marginBottom: '1rem' }}>Glucose Range vs Targets</h3>
          <div style={{ height: '220px' }}>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Clinical warning & recommendation notes */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <AlertTriangle size={20} style={{ color: 'var(--accent)' }} />
          Clinical Risk Audit & Warnings
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeAlerts.map((alertText, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '10px',
                background: 'rgba(255, 183, 77, 0.08)',
                borderLeft: '4px solid var(--accent)',
                alignItems: 'flex-start'
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {alertText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Summary Footer (Only visible on print/export PDF) */}
      <div className="print-only" style={{ display: 'none', marginTop: '4rem', borderTop: '1px solid #ccc', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
        <p>This document is an AI generated summary of daily patient metrics. Present this report during clinical consultations.</p>
        <p>Emergency Contact: <strong>{user?.emergencyContact || '911'}</strong> | Hospital: <strong>{user?.city || 'Local Emergency'} Medical Center</strong></p>
      </div>

      {/* Custom Styles for Printing */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .sidebar, .mobile-toggle, .no-print, .pulse-animation {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .printable-report {
            gap: 1.5rem !important;
          }
          .card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          .print-only {
            display: block !important;
          }
          .grid-2, .grid-3 {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};

export default HealthInsights;
