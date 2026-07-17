import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import WaterTracker from '../components/WaterTracker';
import { 
  Heart, Flame, Droplet, Pill, Apple, Award, Bell, 
  Plus, Calendar, ShieldAlert, Sparkles, TrendingUp,
  Activity, Moon, ShieldCheck, Zap, UserCheck, AlertTriangle
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend 
} from 'chart.js';
import confetti from 'canvas-confetti';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const HEALTH_TIPS = {
  en: [
    "Swap refined white rice with brown rice or foxtail millets to reduce post-meal sugar spikes.",
    "Brisk walking for just 15 minutes after meals can significantly improve insulin sensitivity.",
    "Stay hydrated! Drinking water helps your kidneys flush out excess glucose through urine.",
    "Pair carbohydrate foods with fiber or healthy fats (like almonds) to slow down sugar absorption."
  ],
  te: [
    "రక్తంలో చక్కెర పెరగకుండా ఉండటానికి తెల్లటి అన్నానికి బదులుగా బ్రౌన్ రైస్ లేదా కొర్రలు వాడండి.",
    "భోజనం తర్వాత 15 నిమిషాల పాటు నడవడం వల్ల ఇన్సులిన్ పనితీరు గణనీయంగా మెరుగుపడుతుంది.",
    "సరిపడా నీరు తాగండి! ఇది మీ కిడ్నీలు అదనపు గ్లూకోజ్ ను మూత్రం ద్వారా బయటకు పంపడానికి సహాయపడుతుంది.",
    "చక్కెర గ్రహణ శక్తిని తగ్గించడానికి పిండి పదార్థాలతో పాటు పీచు పదార్థాలు (బాదంపప్పు వంటివి) తీసుకోండి."
  ],
  hi: [
    "सफेद चावल के स्थान पर ब्राउन राइस या बाजरे/रागी का उपयोग करें जिससे ब्लड शुगर न बढ़े।",
    "भोजन के बाद 15 मिनट की सैर इंसुलिन की संवेदनशीलता में काफी सुधार कर सकती है।",
    "पानी पीते रहें! पर्याप्त पानी आपके गुर्दे को मूत्र के माध्यम से अतिरिक्त ग्लूकोज को बाहर निकालने में मदद करता है।",
    "कार्बोहाइड्रेट युक्त खाद्य पदार्थों को फाइबर या बादाम के साथ खाएं ताकि शर्करा का अवशोषण धीमा हो सके।"
  ]
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { permission, requestPermission, triggerNotification } = useNotifications();

  const [glucoseLogs, setGlucoseLogs] = useState([]);
  const [waterData, setWaterData] = useState({ amount: 0, goal: 2500 });
  const [meds, setMeds] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [healthScore, setHealthScore] = useState(85);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [tipIndex, setTipIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // New states
  const [sleepLogs, setSleepLogs] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  
  // AI Risk State
  const [riskData, setRiskData] = useState({
    riskLevel: 'Low',
    explanation: 'Loading metabolic risk analysis...',
    recommendations: [],
    predicted24h: Array.from({length: 24}, () => 120),
    predicted7d: Array.from({length: 7}, () => 120)
  });
  const [forecastTab, setForecastTab] = useState('24h'); // '24h' | '7d'

  // Log modalities toggles
  const [showLogSugarModal, setShowLogSugarModal] = useState(false);
  const [showLogExerciseModal, setShowLogExerciseModal] = useState(false);

  // Sugar modal form
  const [sugarReading, setSugarReading] = useState('120');
  const [sugarPeriod, setSugarPeriod] = useState('Fasting');
  const [sugarNote, setSugarNote] = useState('');

  // Exercise modal form
  const [exType, setExType] = useState('Walking');
  const [exDuration, setExDuration] = useState('20');
  const [exSteps, setExSteps] = useState('3000');

  // Reminders Checklist
  const [reminders, setReminders] = useState([
    { id: 1, text: "Check fasting blood sugar", done: false },
    { id: 2, text: "Take morning medication", done: false },
    { id: 3, text: "Drink 2.5L water goal", done: false },
    { id: 4, text: "Evening 20-min cardio walk", done: false }
  ]);

  useEffect(() => {
    const index = Math.floor(Math.random() * (HEALTH_TIPS[language]?.length || 4));
    setTipIndex(index);
  }, [language]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Glucose Logs
      const glucRes = await api.getGlucose(user._id);
      if (glucRes.success) setGlucoseLogs(glucRes.logs || []);

      // 2. Water Logs
      const watRes = await api.getWater(user._id);
      if (watRes.success) setWaterData(watRes.record || { amount: 0, goal: 2500 });

      // 3. Meds
      const medRes = await api.getMedications(user._id);
      if (medRes.success) setMeds(medRes.medications || []);

      // 4. Meal Plan
      const mealRes = await api.getMealPlan(user._id);
      if (mealRes.success && mealRes.plan) setMealPlan(mealRes.plan.plan);

      // 5. Sleep Logs
      const sleepRes = await api.getSleep(user._id);
      if (sleepRes.success) setSleepLogs(sleepRes.logs || []);

      // 6. Exercise Logs
      const exRes = await api.getExercise(user._id);
      if (exRes.success) setExerciseLogs(exRes.logs || []);

      // 7. Insights (Health Score & Streak)
      const insRes = await api.getInsights(user._id);
      if (insRes.success && insRes.hasData) {
        setHealthScore(insRes.metrics.healthScore);
      }

      // 8. AI Risk Analysis & Predictions
      const riskRes = await api.getRiskPrediction(user._id);
      if (riskRes.success) {
        setRiskData(riskRes);
      }

      // Check local storage streak
      const streakVal = parseInt(localStorage.getItem(`nutricare_streak_${user._id}`) || '0');
      setStreak(streakVal);

      // Award mock initial badge if streak is high
      const cachedAchievements = localStorage.getItem(`nutricare_mock_achievements`);
      if (cachedAchievements) {
        const awards = JSON.parse(cachedAchievements).filter(a => a.userId === user._id);
        setBadges(awards.map(a => a.badge));
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleAddWater = async (amount) => {
    if (!user) return;
    try {
      const res = await api.updateWater(user._id, amount);
      if (res.success) {
        setWaterData(res.record);
        if (res.record.amount >= res.record.goal) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          triggerNotification("🏆 Hydration Achieved!", "Excellent! You have reached your daily 2.5 Liter water target.");
        }
        // Reload risk prediction
        const riskRes = await api.getRiskPrediction(user._id);
        if (riskRes.success) setRiskData(riskRes);
      }
    } catch (err) {}
  };

  const handleToggleMed = async (medId, isTaken) => {
    const today = new Date().toLocaleDateString('en-CA');
    try {
      const res = await api.toggleMedicationAdherence(medId, today, !isTaken);
      if (res.success) {
        const medRes = await api.getMedications(user._id);
        if (medRes.success) setMeds(medRes.medications || []);
        
        if (!isTaken) {
          confetti({ particleCount: 30, spread: 40, colors: ['#4CAF50', '#2E8B57'] });
          triggerNotification("💊 Medication Logged", "You successfully marked your medicine as taken today.");
        }
        // Reload risk prediction & health score
        const riskRes = await api.getRiskPrediction(user._id);
        if (riskRes.success) setRiskData(riskRes);
        const insRes = await api.getInsights(user._id);
        if (insRes.success && insRes.hasData) setHealthScore(insRes.metrics.healthScore);
      }
    } catch (err) {}
  };

  const toggleReminder = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  // Submit modal sugar
  const handleSubmitSugar = async (e) => {
    e.preventDefault();
    if (!sugarReading || isNaN(sugarReading)) return;
    try {
      const res = await api.logGlucose(user._id, sugarReading, sugarPeriod, sugarNote);
      if (res.success) {
        setShowLogSugarModal(false);
        setSugarNote('');
        loadDashboardData();
        confetti({ particleCount: 50, spread: 50 });
        
        // Critical / Red alert trigger
        const glucoseValue = parseFloat(sugarReading);
        if (glucoseValue > 200 || glucoseValue < 70) {
          triggerNotification(
            "⚠️ Critical Glycemic Alert!",
            `Your logged glucose of ${glucoseValue} mg/dL is in the warning threshold. Please check emergency guidance.`
          );
          // Dispatch caregiver SOS alert
          await api.triggerSOS(user._id, "Blood Sugar Warning", `Critical glucose log: ${glucoseValue} mg/dL (${sugarPeriod})`);
        } else {
          triggerNotification("🩸 Glucose Logged", `Successfully logged ${glucoseValue} mg/dL. Level status: GREEN.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit modal workout
  const handleSubmitWorkout = async (e) => {
    e.preventDefault();
    try {
      const res = await api.logExercise(user._id, exType, exDuration, exSteps);
      if (res.success) {
        setShowLogExerciseModal(false);
        loadDashboardData();
        confetti({ particleCount: 60, spread: 60, colors: ['#FF9800', '#FFB74D'] });
        triggerNotification("🏃 Workout Logged!", `Recorded a ${exDuration} minute ${exType} session.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SOS Emergency button trigger
  const handleSOSTrigger = async () => {
    if (!window.confirm("🔴 TRIGGER SOS DISTRESS ALERT? This will immediately alert all linked caregivers.")) return;
    try {
      let lat = null, lon = null;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          await api.triggerSOS(user._id, "CRITICAL EMERGENCY SOS", "Emergency Distress Panic Button Pressed!", lat, lon);
        }, async () => {
          await api.triggerSOS(user._id, "CRITICAL EMERGENCY SOS", "Emergency Distress Panic Button Pressed!");
        });
      } else {
        await api.triggerSOS(user._id, "CRITICAL EMERGENCY SOS", "Emergency Distress Panic Button Pressed!");
      }
      
      confetti({ particleCount: 150, colors: ['#ff0000', '#ffffff'], spread: 100 });
      alert("🔴 Emergency SOS broadcasted successfully! Caregivers have been notified.");
    } catch (e) {
      console.error(e);
    }
  };

  // Compute latest glucose
  const latestGlucose = glucoseLogs.length > 0 ? glucoseLogs[glucoseLogs.length - 1] : null;

  // Compute calorie/carb sums if mealplan exists
  let totalCalories = 0, totalCarbs = 0, totalProtein = 0, totalSugar = 0;
  if (mealPlan) {
    Object.values(mealPlan).forEach(m => {
      // MealPlan might store arrays or objects depending on preferences
      if (Array.isArray(m) && m.length > 0) {
        totalCalories += m[0].calories || 0;
        totalCarbs += m[0].carbs || 0;
        totalProtein += m[0].protein || 0;
        totalSugar += m[0].sugar || 0;
      } else if (m && typeof m === 'object') {
        totalCalories += m.calories || 0;
        totalCarbs += m.carbs || 0;
        totalProtein += m.protein || 0;
        totalSugar += m.sugar || 0;
      }
    });
  } else {
    totalCalories = 1125;
    totalCarbs = 135;
    totalProtein = 55;
    totalSugar = 12;
  }

  // Get active health status for avatar
  const getAvatarStatus = () => {
    if (latestGlucose?.status === 'red' || riskData.riskLevel === 'Critical') return 'critical';
    if (riskData.riskLevel === 'High') return 'high';
    if (riskData.riskLevel === 'Moderate') return 'moderate';
    return 'healthy';
  };

  // Get motivational avatar dialog bubble
  const getAvatarDialogue = () => {
    const today = new Date().toLocaleDateString('en-CA');
    
    // Check missing meds today
    const missedMeds = meds.some(m => !m.adherence?.[today]);
    if (missedMeds) return "Take your medicine on time! 💊 It stabilizes insulin production.";
    
    // Check hydration
    if (waterData.amount < 1500) return "Stay hydrated! 💧 Drinking water clears excess glucose.";
    
    // Check exercise
    const workoutToday = exerciseLogs.some(e => e.date === today);
    if (!workoutToday) return "Time for exercise! 🏃 A brief walk builds muscle glucose uptake.";
    
    // Default happy status
    return "Metabolic metrics are looking optimal today! Great job. 🏆";
  };

  // SVGs for Digital avatar expressions
  const renderAvatarSVG = () => {
    const status = getAvatarStatus();
    let bodyColor = "#A3E4D7"; // Greenish
    let eyeExpr = (
      <>
        <ellipse cx="38" cy="45" rx="4" ry="6" fill="#2C3E50" />
        <ellipse cx="62" cy="45" rx="4" ry="6" fill="#2C3E50" />
        <path d="M 32 35 Q 38 32 44 35" stroke="#2C3E50" strokeWidth="2.5" fill="none" />
        <path d="M 56 35 Q 62 32 68 35" stroke="#2C3E50" strokeWidth="2.5" fill="none" />
      </>
    );
    let mouthExpr = <path d="M 38 62 Q 50 72 62 62" stroke="#2C3E50" strokeWidth="3" fill="none" />;
    let details = null;

    if (status === 'critical') {
      bodyColor = "#FADBD8"; // Light Red
      eyeExpr = (
        <>
          <path d="M 32 48 L 42 40 M 32 40 L 42 48" stroke="#D32F2F" strokeWidth="3" />
          <path d="M 58 48 L 68 40 M 58 40 L 68 48" stroke="#D32F2F" strokeWidth="3" />
        </>
      );
      mouthExpr = <path d="M 40 65 Q 50 55 60 65" stroke="#2C3E50" strokeWidth="3.5" fill="none" />;
      details = <circle cx="82" cy="30" r="10" fill="#E53935" opacity="0.8" className="pulse-animation" />;
    } else if (status === 'high') {
      bodyColor = "#FDEBD0"; // Orange
      eyeExpr = (
        <>
          <path d="M 32 45 Q 38 48 44 45" stroke="#2C3E50" strokeWidth="3" fill="none" />
          <path d="M 56 45 Q 62 48 68 45" stroke="#2C3E50" strokeWidth="3" fill="none" />
        </>
      );
      mouthExpr = <line x1="42" y1="62" x2="58" y2="62" stroke="#2C3E50" strokeWidth="3" />;
    } else if (status === 'moderate') {
      bodyColor = "#FCF3CF"; // Yellow
      mouthExpr = <path d="M 42 62 Q 50 64 58 62" stroke="#2C3E50" strokeWidth="3" fill="none" />;
    }

    return (
      <svg width="110" height="110" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0px 6px 12px rgba(0,0,0,0.1))', animation: 'float 3s ease-in-out infinite' }}>
        {/* Character Base body */}
        <circle cx="50" cy="50" r="45" fill={bodyColor} stroke="var(--border)" strokeWidth="2" />
        {eyeExpr}
        {mouthExpr}
        {details}
      </svg>
    );
  };

  // Forecast trend line chart configuration
  const forecastLabels = forecastTab === '24h' 
    ? Array.from({length: 24}, (_, i) => `${(i + 8) % 24}:00`) 
    : ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  
  const forecastData = forecastTab === '24h' 
    ? riskData.predicted24h 
    : riskData.predicted7d;

  const forecastChartConfig = {
    labels: forecastLabels,
    datasets: [
      {
        label: forecastTab === '24h' ? '24-Hour Projected Glucose (mg/dL)' : '7-Day Projected Averages (mg/dL)',
        data: forecastData,
        fill: true,
        borderColor: 'rgba(2, 136, 209, 0.8)',
        backgroundColor: 'rgba(2, 136, 209, 0.08)',
        tension: 0.3,
        pointBackgroundColor: 'var(--secondary)'
      }
    ]
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}><h2>Synchronizing Metabolic Vitals...</h2></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner with welcome and Animated Health Avatar */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(46, 139, 87, 0.06) 100%)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1.5rem',
          padding: '1.75rem 2rem'
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
            <Sparkles size={14} /> METABOLIC DASHBOARD ACTIVE
          </span>
          <h1 style={{ margin: 0, fontSize: 'var(--font-2xl)' }}>
            {t("welcomeBack")} {user?.name || 'User'}!
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: 'var(--font-sm)' }}>
            Circadian rhythms are active. Keep your glucose in normal ranges to increase your metabolic score.
          </p>
        </div>

        {/* Digital Avatar Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-app)', padding: '0.75rem 1.25rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
          {renderAvatarSVG()}
          
          <div style={{ maxWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <strong style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Health Avatar</strong>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
              "{getAvatarDialogue()}"
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <strong style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quick Actions</strong>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowLogSugarModal(true)} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
              <Plus size={16} />
              <span>Log Glucose</span>
            </button>
            <button className="btn btn-secondary" onClick={() => handleAddWater(250)} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
              <Droplet size={16} />
              <span>Log Water (+250ml)</span>
            </button>
            <button className="btn btn-accent" onClick={() => setShowLogExerciseModal(true)} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
              <Flame size={16} />
              <span>Log Workout</span>
            </button>
            <button className="btn btn-danger" onClick={handleSOSTrigger} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
              <ShieldAlert size={16} />
              <span>SOS Emergency</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Metrics: Health Score & Reminders */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }} className="grid-2">
        {/* AI Health Score Card */}
        <div className="card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '8px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            boxShadow: '0 4px 15px rgba(46,139,87,0.15)'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{healthScore}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Score</span>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              {t("healthScore")}
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>
              Calculated from your glucose targets, medicine compliance, hydration, and steps. Keeping your glucose green pushes this score to 100!
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
                Sugar Status: <strong style={{ color: latestGlucose?.status === 'red' ? '#E53935' : '#2E8B57' }}>
                  {latestGlucose ? latestGlucose.status.toUpperCase() : 'NO LOGS'}
                </strong>
              </div>
              <div style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
                Risk Grade: <strong style={{ color: healthScore > 80 ? '#2E8B57' : '#EF6C00' }}>
                  {healthScore > 80 ? 'Optimal' : 'Moderate'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Checklist */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: 'var(--font-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bell size={18} style={{ color: 'var(--accent)' }} />
            {t("reminders")}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.map(rem => (
              <label 
                key={rem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: 'var(--font-xs)',
                  color: rem.done ? 'var(--text-muted)' : 'var(--text-main)',
                  textDecoration: rem.done ? 'line-through' : 'none',
                  cursor: 'pointer'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={rem.done} 
                  onChange={() => toggleReminder(rem.id)} 
                  style={{ accentColor: 'var(--primary)' }}
                />
                {rem.text}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* AI DIABETES RISK PREDICTION SECTION */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: 0 }}>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              AI Diabetes Risk Prediction
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dynamically recomputed from glucose levels, workouts, medications, and age</span>
          </div>

          {/* Risk Level Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>AI Risk Evaluation:</span>
            <span 
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '30px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: riskData.riskLevel === 'Low' ? '#2E7D32' : riskData.riskLevel === 'Moderate' ? '#EF6C00' : riskData.riskLevel === 'High' ? '#D32F2F' : '#ff0000',
                background: riskData.riskLevel === 'Low' ? '#E8F5E9' : riskData.riskLevel === 'Moderate' ? '#FFF3E0' : riskData.riskLevel === 'High' ? '#FFEBEE' : '#ffebeb',
                border: '1px solid currentColor',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {riskData.riskLevel.toUpperCase()} RISK
            </span>
          </div>
        </div>

        {/* Prediction content Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }} className="grid-2">
          {/* Trend Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>Projected Glycemic Forecast</strong>
              <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-app)', padding: '0.2rem', borderRadius: '10px' }}>
                <button 
                  onClick={() => setForecastTab('24h')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.65rem',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    background: forecastTab === '24h' ? 'var(--secondary)' : 'transparent',
                    color: forecastTab === '24h' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  24-Hour Forecast
                </button>
                <button 
                  onClick={() => setForecastTab('7d')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.65rem',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    background: forecastTab === '7d' ? 'var(--secondary)' : 'transparent',
                    color: forecastTab === '7d' ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  7-Day Trend
                </button>
              </div>
            </div>

            <div style={{ height: '220px', width: '100%' }}>
              <Line 
                data={forecastChartConfig} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: false } }
                }} 
              />
            </div>
          </div>

          {/* Explanation and Recs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <strong style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                AI Prediction Rationale
              </strong>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                {riskData.explanation}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                Direct Recommendations to Reduce Risk
              </strong>
              {riskData.recommendations?.map((rec, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-app)',
                    borderRadius: '8px',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-main)',
                    borderLeft: '3px solid var(--primary)'
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Trackers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem' }} className="grid-3">
        {/* Latest Blood Sugar Indicator */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-md)' }}>
              <Heart size={18} style={{ color: '#E53935' }} />
              {t("bloodSugar")}
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Latest reading for today</p>
          </div>
          
          <div style={{ margin: '1rem 0', textAlign: 'center' }}>
            <span style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: latestGlucose?.status === 'red' ? '#D32F2F' : latestGlucose?.status === 'yellow' ? '#FBC02D' : '#2E7D32' 
            }}>
              {latestGlucose ? `${latestGlucose.reading}` : '---'}
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>mg/dL</span>
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            {latestGlucose ? latestGlucose.insight : 'No sugar logs recorded today. Log values to see AI insights.'}
          </div>
        </div>

        {/* Water Intake Integrated Widget */}
        <WaterTracker waterData={waterData} onAddWater={handleAddWater} />

        {/* Nutrition Macro Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-md)' }}>
              <Apple size={18} style={{ color: 'var(--primary)' }} />
              Today's Meal Macros
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Estimated from your active meal plan</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', margin: '0.5rem 0' }}>
            <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
              Cal: <strong>{totalCalories} kcal</strong>
            </div>
            <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
              Carbs: <strong>{totalCarbs}g</strong>
            </div>
            <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
              Prot: <strong>{totalProtein}g</strong>
            </div>
            <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '8px', fontSize: 'var(--font-xs)' }}>
              Sugar: <strong style={{ color: '#D32F2F' }}>{totalSugar}g</strong>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Low sugar target limit: <strong>&lt; 30g</strong>
          </div>
        </div>
      </div>

      {/* Medication Adherence Checklist */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Medication checklist */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-md)', marginBottom: '1rem' }}>
            <Pill size={18} style={{ color: 'var(--primary)' }} />
            Medication Log & Checkoff
          </h3>
          
          {meds.length === 0 ? (
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              No medications listed. Add them in the Medication Manager.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {meds.map(med => {
                const today = new Date().toLocaleDateString('en-CA');
                const isTaken = !!med.adherence?.[today];
                return (
                  <div 
                    key={med._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--bg-app)',
                      borderRadius: '10px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', display: 'block' }}>{med.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dosage: {med.dosage} ({med.frequency}x daily)</span>
                    </div>
                    <button
                      onClick={() => handleToggleMed(med._id, isTaken)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: isTaken ? 'rgba(76,175,80,0.15)' : 'var(--primary)',
                        color: isTaken ? '#2E7D32' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isTaken ? 'Taken ✔' : 'Take Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Tip & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tip Card */}
          <div className="card" style={{ background: 'var(--secondary-light)', border: '1px solid rgba(2, 136, 209, 0.15)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-md)', color: 'var(--secondary)' }}>
              <TrendingUp size={18} />
              {t("healthTips")}
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', margin: '0.5rem 0 0 0', lineHeight: 1.5, fontWeight: 500 }}>
              {HEALTH_TIPS[language]?.[tipIndex] || HEALTH_TIPS['en'][0]}
            </p>
          </div>

          {/* Badges / Gamification */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-md)', marginBottom: '0.75rem' }}>
              <Award size={18} style={{ color: 'var(--accent)' }} />
              {t("activeBadges")}
            </h3>
            {badges.length === 0 ? (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
                Log blood sugar for 3 days to unlock your first discipline badge!
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {badges.map((badge, idx) => (
                  <span 
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.35rem 0.65rem',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(255, 152, 0, 0.25)',
                      borderRadius: '20px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}
                  >
                    🏆 {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOG SUGAR MODAL DIALOG */}
      {showLogSugarModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.3s ease-out', position: 'relative' }}>
            <button 
              onClick={() => setShowLogSugarModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}
            >
              ×
            </button>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Heart size={20} style={{ color: '#E53935' }} />
              Log Glucose Reading
            </h3>

            <form onSubmit={handleSubmitSugar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Reading (mg/dL)</label>
                <input type="number" className="form-input" value={sugarReading} onChange={(e) => setSugarReading(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Period</label>
                <select className="form-select" value={sugarPeriod} onChange={(e) => setSugarPeriod(e.target.value)}>
                  <option value="Fasting">Fasting</option>
                  <option value="Before Breakfast">Before Breakfast</option>
                  <option value="After Breakfast">After Breakfast</option>
                  <option value="Before Lunch">Before Lunch</option>
                  <option value="After Lunch">After Lunch</option>
                  <option value="Before Dinner">Before Dinner</option>
                  <option value="After Dinner">After Dinner</option>
                  <option value="Bedtime">Bedtime</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. felt slightly dizzy, heavy meal" value={sugarNote} onChange={(e) => setSugarNote(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary">Save Log</button>
            </form>
          </div>
        </div>
      )}

      {/* LOG WORKOUT MODAL DIALOG */}
      {showLogExerciseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.3s ease-out', position: 'relative' }}>
            <button 
              onClick={() => setShowLogExerciseModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}
            >
              ×
            </button>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={20} style={{ color: 'var(--accent)' }} />
              Log Exercise Session
            </h3>

            <form onSubmit={handleSubmitWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Workout Type</label>
                <select className="form-select" value={exType} onChange={(e) => setExType(e.target.value)}>
                  <option value="Walking">Walking</option>
                  <option value="Running">Running</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Gym">Gym Strength</option>
                  <option value="Yoga">Yoga / Stretch</option>
                  <option value="Meditation">Meditation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input type="number" className="form-input" value={exDuration} onChange={(e) => setExDuration(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Steps (Optional)</label>
                <input type="number" className="form-input" placeholder="e.g. 5000" value={exSteps} onChange={(e) => setExSteps(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-accent">Log Exercise</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
