import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Activity, Utensils, Database, Camera, ScanBarcode,
  Pill, Dumbbell, FilePieChart, User, AlertOctagon, ShieldAlert,
  LogOut, Languages, Sun, Moon, Eye, ZoomIn, Menu, X,
  UserCheck, Users, FileText
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { 
    darkMode, setDarkMode, 
    highContrast, setHighContrast, 
    largeText, setLargeText 
  } = useTheme();
  
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/sugar-tracker", label: t("sugarTracker"), icon: Activity },
    { to: "/meal-planner", label: t("mealPlanner"), icon: Utensils },
    { to: "/food-database", label: t("foodDb"), icon: Database },
    { to: "/food-scanner", label: t("scanner"), icon: Camera },
    { to: "/barcode-scanner", label: t("barcode"), icon: ScanBarcode },
    { to: "/medications", label: t("medications"), icon: Pill },
    { to: "/exercise-tracker", label: t("exercise"), icon: Dumbbell },
    { to: "/health-insights", label: t("healthInsights"), icon: FilePieChart },
    { to: "/health-reports", label: t("healthReports") || "Health Reports", icon: FileText },
    { to: "/sleep-tracker", label: t("sleepTracker") || "Sleep Tracker", icon: Moon },
    { to: "/caregiver", label: t("caregiver") || "Caregiver Care", icon: Users },
    { to: "/doctor-dashboard", label: t("doctorDashboard") || "Doctor Dashboard", icon: UserCheck },
    { to: "/profile", label: t("profile"), icon: User },
    { to: "/emergency", label: t("emergency"), icon: ShieldAlert }
  ];

  // If user is admin, add admin panel link
  if (user && user.role === 'admin') {
    navItems.push({ to: "/admin", label: t("adminPanel"), icon: AlertOctagon });
  }

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 999,
          padding: '0.5rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          display: 'none'
        }}
        className="mobile-toggle"
        onClick={toggleMobile}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside 
        style={{
          width: '280px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
          zIndex: 998,
          transition: 'transform var(--transition-normal)'
        }}
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
      >
        <div>
          {/* App Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              N
            </div>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              {t("appName")}
            </h2>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    color: isActive ? 'var(--text-light)' : 'var(--text-muted)',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: 'var(--font-sm)',
                    transition: 'all var(--transition-fast)'
                  })}
                  className="sidebar-link"
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Accessibility & Language Selectors */}
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          
          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages size={18} style={{ color: 'var(--text-muted)' }} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                flex: 1,
                padding: '0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: 'var(--font-xs)'
              }}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Accessibility Buttons Row */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={t("darkMode")}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: darkMode ? 'var(--primary)' : 'var(--bg-app)',
                color: darkMode ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* High Contrast Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              title={t("contrastMode")}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: highContrast ? 'var(--primary)' : 'var(--bg-app)',
                color: highContrast ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Eye size={16} />
            </button>

            {/* Large Text Toggle */}
            <button
              onClick={() => setLargeText(!largeText)}
              title={t("largeText")}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: largeText ? 'var(--primary)' : 'var(--bg-app)',
                color: largeText ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Logout Section */}
          {user && (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(229, 57, 53, 0.1)',
                color: '#E53935',
                fontWeight: 600,
                fontSize: 'var(--font-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#E53935';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(229, 57, 53, 0.1)';
                e.currentTarget.style.color = '#E53935';
              }}
            >
              <LogOut size={18} />
              <span>{t("logout")}</span>
            </button>
          )}
        </div>
      </aside>

      {/* CSS overlay for sidebar responsiveness */}
      <style>{`
        @media (max-width: 992px) {
          .mobile-toggle {
            display: block !important;
          }
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
