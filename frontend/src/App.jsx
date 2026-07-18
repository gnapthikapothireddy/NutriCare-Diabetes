import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import BloodSugarTracker from './pages/BloodSugarTracker';
import MealPlanner from './pages/MealPlanner';
import FoodDatabase from './pages/FoodDatabase';
import MedicationManager from './pages/MedicationManager';
import ExerciseTracker from './pages/ExerciseTracker';
import HealthInsights from './pages/HealthInsights';
import Emergency from './pages/Emergency';
import AdminPanel from './pages/AdminPanel';

// New Pages
import HealthReports from './pages/HealthReports';
import DoctorDashboard from './pages/DoctorDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import SleepTracker from './pages/SleepTracker';

// Components
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import FoodScanner from './components/FoodScanner';
import BarcodeScanner from './components/BarcodeScanner';
import VoiceAssistant from './components/VoiceAssistant';

// Protected Layout Wrapper
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force onboarding if profile is not completed (except when already on profile page)
  const isProfilePage = location.pathname === '/profile';
  if (!user.profileCompleted && !isProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  // Map path to realistic medical/healthy background image
  const bgMap = {
    '/dashboard': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=70',
    '/sugar-tracker': 'https://images.unsplash.com/photo-1508847154043-be12a62861c1?auto=format&fit=crop&w=1200&q=70',
    '/meal-planner': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=70',
    '/food-database': 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=70',
    '/food-scanner': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70',
    '/barcode-scanner': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=70',
    '/medications': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=70',
    '/exercise-tracker': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=70',
    '/health-insights': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=70',
    '/health-reports': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=70',
    '/sleep-tracker': 'https://images.unsplash.com/photo-1511295742364-927d44ffca62?auto=format&fit=crop&w=1200&q=70',
    '/caregiver': 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=70',
    '/doctor-dashboard': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70',
    '/profile': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1200&q=70',
    '/emergency': 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=1200&q=70'
  };

  const currentBg = bgMap[location.pathname] || bgMap['/dashboard'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Page Area */}
      <main 
        style={{
          flex: 1,
          marginLeft: '280px',
          padding: '2rem',
          minHeight: '100vh',
          transition: 'margin-left var(--transition-normal)',
          backgroundImage: `linear-gradient(var(--bg-overlay), var(--bg-overlay)), url('${currentBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
        className="main-content"
      >
        <div key={location.pathname} className="fade-in-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Floating AI Chatbot Assistant */}
      <Chatbot />

      {/* Floating AI Voice Assistant */}
      <VoiceAssistant />

      {/* CSS responsiveness for main container */}
      <style>{`
        @media (max-width: 992px) {
          .main-content {
            margin-left: 0 !important;
            padding: 5rem 1rem 2rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes inside AppLayout */}
                <Route path="/profile" element={
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                } />
                
                <Route path="/dashboard" element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                } />

                <Route path="/sugar-tracker" element={
                  <AppLayout>
                    <BloodSugarTracker />
                  </AppLayout>
                } />

                <Route path="/meal-planner" element={
                  <AppLayout>
                    <MealPlanner />
                  </AppLayout>
                } />

                <Route path="/food-database" element={
                  <AppLayout>
                    <FoodDatabase />
                  </AppLayout>
                } />

                <Route path="/food-scanner" element={
                  <AppLayout>
                    <FoodScanner />
                  </AppLayout>
                } />

                <Route path="/barcode-scanner" element={
                  <AppLayout>
                    <BarcodeScanner />
                  </AppLayout>
                } />

                <Route path="/medications" element={
                  <AppLayout>
                    <MedicationManager />
                  </AppLayout>
                } />

                <Route path="/exercise-tracker" element={
                  <AppLayout>
                    <ExerciseTracker />
                  </AppLayout>
                } />

                <Route path="/health-insights" element={
                  <AppLayout>
                    <HealthInsights />
                  </AppLayout>
                } />

                <Route path="/health-reports" element={
                  <AppLayout>
                    <HealthReports />
                  </AppLayout>
                } />

                <Route path="/doctor-dashboard" element={
                  <AppLayout>
                    <DoctorDashboard />
                  </AppLayout>
                } />

                <Route path="/caregiver" element={
                  <AppLayout>
                    <CaregiverDashboard />
                  </AppLayout>
                } />

                <Route path="/sleep-tracker" element={
                  <AppLayout>
                    <SleepTracker />
                  </AppLayout>
                } />

                <Route path="/emergency" element={
                  <AppLayout>
                    <Emergency />
                  </AppLayout>
                } />

                <Route path="/admin" element={
                  <AppLayout>
                    <AdminPanel />
                  </AppLayout>
                } />

                {/* Fallback to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
