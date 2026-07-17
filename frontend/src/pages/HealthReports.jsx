import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import { 
  FileText, Download, Printer, Share2, Sparkles, CheckCircle2, 
  TrendingUp, Activity, Pill, Droplet, Dumbbell, Award, Mail, Send 
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HealthReports = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [success, setSuccess] = useState('');
  const [selectedReportIdx, setSelectedReportIdx] = useState(0);

  // Mock historical reports list
  const mockHistoricalReports = [
    { title: "Weekly Report: Jul 10 - Jul 16, 2026", range: "July 10 - July 16, 2026", duration: "Weekly" },
    { title: "Weekly Report: Jul 03 - Jul 09, 2026", range: "July 03 - July 09, 2026", duration: "Weekly" },
    { title: "Monthly Report: June 2026", range: "June 01 - June 30, 2026", duration: "Monthly" }
  ];

  const loadReportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getInsights(user._id);
      if (res.success) {
        setInsights(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [user, selectedReportIdx]);

  const handlePrint = () => {
    window.print();
  };

  // Generate and Download PDF using jsPDF
  const handleDownloadPDF = () => {
    if (!insights || !insights.metrics) return;
    const doc = new jsPDF();
    const { metrics, recommendations } = insights;

    // Header styling
    doc.setFillColor(46, 139, 87); // Primary Sea Green
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NutriCare Diabetes AI Health Report", 15, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Patient: ${user.name} | Age: ${user.age || 'N/A'}`, 15, 30);

    // AI Health Score Section
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Metabolic Score & Summary", 15, 55);

    // Draw box for metrics
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 250, 247);
    doc.rect(15, 62, 180, 50, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(46, 139, 87);
    doc.text(`AI Metabolic Health Score: ${metrics.healthScore} / 100`, 22, 72);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`• Average Blood Glucose: ${metrics.avgSugar} mg/dL`, 22, 82);
    doc.text(`• Target Status Breakdown: Green: ${metrics.greenPct}%, Yellow: ${metrics.yellowPct}%, Red: ${metrics.redPct}%`, 22, 90);
    doc.text(`• Medication Adherence: ${metrics.medAdherenceRate}%`, 22, 98);
    doc.text(`• Water Intake Goal Completion: ${metrics.waterPct}%`, 22, 106);

    // AI Diabetes Risk Level Box
    doc.setDrawColor(230, 230, 230);
    let riskColor = [46, 139, 87]; // Green
    if (metrics.riskLevel === 'High') riskColor = [239, 108, 0]; // Orange
    if (metrics.riskLevel === 'Critical') riskColor = [229, 57, 53]; // Red
    
    doc.setFillColor(...riskColor);
    doc.rect(140, 70, 45, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AI Risk Level", 145, 78);
    doc.setFontSize(14);
    doc.text(metrics.riskLevel, 145, 87);

    // Recommendations Section
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Personalized AI Clinical Recommendations", 15, 125);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    let yOffset = 135;
    recommendations.forEach((rec, idx) => {
      // Word wrap text to avoid overflow
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 180);
      lines.forEach(line => {
        doc.text(line, 15, yOffset);
        yOffset += 7;
      });
      yOffset += 3;
    });

    // Disclaimer footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Disclaimer: NutriCare AI predictions are generated from clinical guidelines and local heuristics. Share with your provider for actual medical advice.", 15, 280);

    doc.save(`NutriCare_Health_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.pdf`);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!doctorEmail) return;
    setIsSharing(true);
    setSuccess('');
    try {
      const res = await api.shareReportWithDoctor(user._id, doctorEmail);
      if (res.success) {
        setSuccess(`Report shared successfully with doctor at: ${doctorEmail}`);
        setDoctorEmail('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>Generating Comprehensive Report Card...</h2></div>;
  }

  const hasReportData = insights && insights.hasData;

  // Chart data setup for Daily Compliance Rates
  const chartData = hasReportData ? {
    labels: ['Fasting Glucose', 'Med Adherence', 'Hydration', 'Workout Logged'],
    datasets: [
      {
        label: 'Completion / Score (%)',
        data: [
          insights.metrics.greenPct,
          insights.metrics.medAdherenceRate,
          insights.metrics.waterPct,
          insights.metrics.healthScore
        ],
        backgroundColor: [
          'rgba(46, 139, 87, 0.7)',
          'rgba(2, 136, 209, 0.7)',
          'rgba(255, 152, 0, 0.7)',
          'rgba(76, 175, 80, 0.7)'
        ],
        borderColor: [
          '#2E8B57',
          '#0288D1',
          '#FF9800',
          '#4CAF50'
        ],
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} style={{ color: 'var(--primary)' }} />
          <h1>Weekly & Monthly AI Health Reports</h1>
        </div>

        {hasReportData && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }} onClick={handlePrint}>
              <Printer size={16} />
              <span>Print Report</span>
            </button>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }} onClick={handleDownloadPDF}>
              <Download size={16} />
              <span>Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {success && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Left Column: Historical Reports list & Share Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Reports History */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', marginBottom: '1rem' }}>Historical Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div 
                onClick={() => setSelectedReportIdx(0)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: selectedReportIdx === 0 ? 'var(--secondary-light)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-xs)'
                }}
              >
                <strong>Current Dashboard State</strong>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Real-time aggregated parameters</span>
              </div>

              {mockHistoricalReports.map((rep, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedReportIdx(idx + 1)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: selectedReportIdx === idx + 1 ? 'var(--secondary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-xs)'
                  }}
                >
                  <strong>{rep.title}</strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Duration: {rep.duration} | {rep.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secure Doctor Sharing */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--font-sm)', marginBottom: '0.75rem' }}>
              <Share2 size={16} style={{ color: 'var(--primary)' }} />
              Share Report with Doctor
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Pushes this weekly medical diagnostic overview directly into your doctor's clinical dashboard.
            </p>

            <form onSubmit={handleShare} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Doctor's email..." 
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  style={{ paddingLeft: '32px', paddingRight: '10px', fontSize: 'var(--font-xs)', height: '36px' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', height: '36px' }} disabled={isSharing}>
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Analytical Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="print-section">
          
          {!hasReportData ? (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={48} style={{ color: 'var(--primary)', opacity: 0.3, marginBottom: '1rem' }} />
              <h3>Not Enough Diagnostic Logs Yet</h3>
              <p style={{ margin: '0.5rem 0 0 0' }}>Log blood sugar readings and mark daily medications to generate your AI health report card!</p>
            </div>
          ) : (
            <>
              {/* Score & Summary Metrics */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--font-md)', margin: 0 }}>Metabolic Summary Report</h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Report Interval: {selectedReportIdx === 0 ? "Latest Aggregation" : mockHistoricalReports[selectedReportIdx - 1].range}
                    </span>
                  </div>
                  
                  <span 
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: insights.metrics.riskLevel === 'Low' || insights.metrics.riskLevel === 'Optimal' ? '#2E7D32' : insights.metrics.riskLevel === 'Moderate' ? '#EF6C00' : '#D32F2F',
                      background: insights.metrics.riskLevel === 'Low' || insights.metrics.riskLevel === 'Optimal' ? '#E8F5E9' : insights.metrics.riskLevel === 'Moderate' ? '#FFF3E0' : '#FFEBEE'
                    }}
                  >
                    AI Risk: {insights.metrics.riskLevel}
                  </span>
                </div>

                {/* Score Dial */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      border: '8px solid var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 'bold',
                      color: 'var(--primary)',
                      margin: '0 auto 0.5rem auto'
                    }}>
                      {insights.metrics.healthScore}
                    </div>
                    <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>AI Health Score</strong>
                  </div>

                  {/* Standard Health metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 'var(--font-xs)' }}>Average Glucose: <strong>{insights.metrics.avgSugar} mg/dL</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Pill size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 'var(--font-xs)' }}>Medication Adherence: <strong>{insights.metrics.medAdherenceRate}%</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Droplet size={18} style={{ color: '#0288D1' }} />
                      <span style={{ fontSize: 'var(--font-xs)' }}>Hydration Level: <strong>{insights.metrics.waterPct}%</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} style={{ color: '#2E7D32' }} />
                      <span style={{ fontSize: 'var(--font-xs)' }}>Sugar in Green target: <strong>{insights.metrics.greenPct}%</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart section */}
              <div className="card">
                <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', marginBottom: '1rem' }}>Metrics Compliance Comparison</h3>
                <div style={{ height: '220px', width: '100%' }}>
                  <Bar 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100
                        }
                      },
                      plugins: {
                        legend: { display: false }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-sm)', color: 'var(--text-main)', margin: 0 }}>
                  <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                  AI Clinical Directives
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {insights.recommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-app)',
                        borderLeft: '4px solid var(--accent)',
                        borderRadius: '0 8px 8px 0',
                        fontSize: 'var(--font-xs)',
                        lineHeight: 1.4,
                        color: 'var(--text-main)'
                      }}
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default HealthReports;
