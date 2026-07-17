import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [permission, setPermission] = useState('default');
  const [inAppToasts, setInAppToasts] = useState([]);

  // 1. Request Browser Notification Permissions
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications.');
      return 'unsupported';
    }
    const status = await Notification.requestPermission();
    setPermission(status);
    return status;
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 2. Fetch/sync medications list when user changes
  const syncMeds = async () => {
    if (!user) return;
    try {
      const res = await api.getMedications(user._id);
      if (res.success) {
        setMedications(res.medications);
      }
    } catch (err) {
      console.error('Failed to sync medications for reminders:', err);
    }
  };

  useEffect(() => {
    if (user) {
      syncMeds();
      // Sync every 30 seconds
      const syncInterval = setInterval(syncMeds, 30000);
      return () => clearInterval(syncInterval);
    } else {
      setMedications([]);
    }
  }, [user]);

  // Helper to add in-app fallback visual toast notifications
  const addInAppToast = (title, body) => {
    const id = Date.now();
    setInAppToasts(prev => [...prev, { id, title, body }]);
    // Auto-remove toast after 8 seconds
    setTimeout(() => {
      setInAppToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  // Expose manual trigger function
  const triggerNotification = (title, body, tag = 'generic') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        requireInteraction: true
      });
    }

    // Play notification beep sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.log('Audio playback blocked/unsupported');
    }

    addInAppToast(title, body);
  };

  // 3. Background checker loop comparing clock to medication alarms and lifestyle reminders
  useEffect(() => {
    if (!user) return;

    // Keep track of already notified medication triggers for today to avoid spamming within the same minute
    // Key format: "type-date-hh:mm" or "medId-date-hh:mm"
    const sentAlerts = new Set();

    const checkAlarms = async () => {
      const now = new Date();
      const currentHhMm = now.toTimeString().slice(0, 5); // "HH:MM"
      const todayDate = now.toLocaleDateString('en-CA'); // "YYYY-MM-DD"

      // A. Medication Alarms
      if (medications.length > 0) {
        medications.forEach(med => {
          const isTakenToday = !!med.adherence?.[todayDate];
          if (isTakenToday) return;

          med.reminders?.forEach(alarmTime => {
            if (alarmTime === currentHhMm) {
              const alertKey = `med-${med._id}-${todayDate}-${alarmTime}`;
              if (!sentAlerts.has(alertKey)) {
                sentAlerts.add(alertKey);
                triggerNotification(
                  "💊 Medication Reminder!",
                  `It's time to take your prescribed dose of ${med.name} (${med.dosage}).`
                );
              }
            }
          });
        });
      }

      // B. Water Reminders (Checks at 15:00 if water is under 1500ml)
      if (currentHhMm === "15:00") {
        const alertKey = `water-rem-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          try {
            const res = await api.getWater(user._id);
            if (res.success && res.record && res.record.amount < 1500) {
              triggerNotification(
                "💧 Hydration Check!",
                `You have only logged ${res.record.amount}ml of water today. Drink more water to flush out excess glucose!`
              );
            }
          } catch (e) {
            console.error('Failed to check water reminders:', e);
          }
        }
      }

      // C. Workout Reminders
      // Morning Workout Reminder (07:00 AM)
      if (currentHhMm === "07:00") {
        const alertKey = `workout-morning-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          triggerNotification(
            "🏃 Morning Exercise!",
            "Kickstart your insulin sensitivity with a light 15-minute workout session."
          );
        }
      }
      // Evening Walk Reminder (18:00 PM)
      if (currentHhMm === "18:00") {
        const alertKey = `workout-evening-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          triggerNotification(
            "👟 Evening Walk Reminder!",
            "A 15-minute evening stroll after dinner helps lower glucose spikes."
          );
        }
      }

      // D. Meal Reminders
      // Breakfast (08:30)
      if (currentHhMm === "08:30") {
        const alertKey = `meal-bf-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          triggerNotification(
            "🍳 Healthy Breakfast Time!",
            "Choose a high-protein, low-carb meal. Check your AI Meal Planner!"
          );
        }
      }
      // Lunch (13:30)
      if (currentHhMm === "13:30") {
        const alertKey = `meal-lunch-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          triggerNotification(
            "🍲 Healthy Lunch Time!",
            "Avoid high glycemic index foods. Pair carbs with fiber or green leafy salads."
          );
        }
      }
      // Dinner (20:30)
      if (currentHhMm === "20:30") {
        const alertKey = `meal-dinner-${todayDate}`;
        if (!sentAlerts.has(alertKey)) {
          sentAlerts.add(alertKey);
          triggerNotification(
            "🥗 Healthy Dinner Time!",
            "Keep it light. Steamed vegetables or grilled tofu/chicken will prevent overnight spikes."
          );
        }
      }
    };

    // Run check immediately and then every 15 seconds
    checkAlarms();
    const checkerInterval = setInterval(checkAlarms, 15000);
    return () => clearInterval(checkerInterval);

  }, [user, medications]);

  const removeToast = (id) => {
    setInAppToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, syncMeds, inAppToasts, removeToast, triggerNotification }}>
      {children}

      {/* Floating In-App Toast Notifications UI Overlay Container */}
      <div 
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '350px',
          width: '100%'
        }}
      >
        {inAppToasts.map(toast => (
          <div 
            key={toast.id}
            style={{
              background: 'var(--bg-card)',
              borderLeft: '5px solid var(--primary)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              borderRadius: '10px',
              padding: '1rem',
              color: 'var(--text-main)',
              fontSize: 'var(--font-sm)',
              position: 'relative',
              animation: 'slideIn 0.3s ease-out',
              backdropFilter: 'blur(10px)'
            }}
          >
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ×
            </button>
            <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {toast.title}
            </strong>
            <span>{toast.body}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
