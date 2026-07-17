import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Droplet, Plus } from 'lucide-react';

const WaterTracker = ({ waterData, onAddWater }) => {
  const { t } = useLanguage();
  const { amount = 0, goal = 2500 } = waterData || {};

  const percentage = Math.min(100, Math.round((amount / goal) * 100));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'space-between', height: '100%' }}>
      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Droplet size={20} style={{ color: 'var(--secondary)' }} />
          {t("waterIntake")}
        </h3>
        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
          {amount} / {goal} ml ({percentage}%)
        </p>
      </div>

      {/* Animated Water Cup Cup Container */}
      <div 
        style={{
          width: '100px',
          height: '140px',
          border: '4px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 20px 20px',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '1.5rem 0',
          display: 'flex',
          alignItems: 'flex-end',
          boxShadow: 'inset 0 10px 10px rgba(0,0,0,0.05)'
        }}
      >
        {/* Animated Water Layer */}
        <div 
          style={{
            width: '100%',
            height: `${percentage}%`,
            background: 'linear-gradient(180deg, #4FC3F7 0%, #0288D1 100%)',
            transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}
        >
          {/* Wave effect */}
          {percentage > 0 && percentage < 100 && (
            <div 
              style={{
                position: 'absolute',
                top: '-10px',
                left: 0,
                width: '200%',
                height: '20px',
                background: 'rgba(79, 195, 247, 0.5)',
                borderRadius: '40%',
                animation: 'wave 4s linear infinite',
                transform: 'translateX(0)'
              }}
            />
          )}
        </div>
      </div>

      {/* Log Button */}
      <button 
        className="btn btn-secondary" 
        onClick={() => onAddWater(250)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem',
          fontSize: 'var(--font-sm)',
          padding: '0.5rem 1rem'
        }}
      >
        <Plus size={16} />
        {t("addWater")}
      </button>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WaterTracker;
