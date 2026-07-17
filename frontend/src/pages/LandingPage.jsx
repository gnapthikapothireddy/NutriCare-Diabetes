import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Activity, ShieldAlert, Sparkles, CheckCircle2, ChevronDown, 
  ChevronUp, Heart, ArrowRight, UserCheck, MessageSquare, Star 
} from 'lucide-react';

const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      title: "AI Chatbot & Nutritionist",
      desc: "Floating assistant supporting English, Telugu, and Hindi. Provides natural voice inputs, spoken replies, recipes, and dietary suggestions.",
      icon: MessageSquare,
      color: 'var(--primary)'
    },
    {
      title: "Smart Photo & Barcode Scanner",
      desc: "Upload food photographs or scan package barcodes to check glycemic index suitability, sugar content, and healthier food alternatives.",
      icon: Activity,
      color: 'var(--secondary)'
    },
    {
      title: "Blood Sugar & Water Tracker",
      desc: "Log daily glucose readings with green/yellow/red indicators, water intake with animated levels, and exercises with cardio health scores.",
      icon: Heart,
      color: '#E53935'
    },
    {
      title: "Emergency Rescue Module",
      desc: "One-click Red Alert button that compiles a health profile card, sends summaries, locates nearest hospitals, and guides emergency first-aid.",
      icon: ShieldAlert,
      color: 'var(--accent)'
    }
  ];

  const faqs = [
    {
      q: "Is NutriCare Diabetes AI suitable for Type 1 and Type 2 patients?",
      a: "Yes. During onboarding, users configure their diabetes class (Type 1, Type 2, Gestational, Prediabetes), and our AI engine modifies meal macronutrients and glycemic target boundaries accordingly."
    },
    {
      q: "Does the app support vernacular Indian languages?",
      a: "Absolutely! The system features instant switching between English, Telugu (తెలుగు), and Hindi (हिन्दी) for all user forms, chatbots, alerts, and medical reports."
    },
    {
      q: "How does the AI Food Scanner work?",
      a: "The scanner identifies the food item from an uploaded picture, estimates calorie counts, and references its Glycemic Index to suggest whether to 'Eat', 'Moderate', or 'Avoid' it, alongside healthy swaps."
    },
    {
      q: "Can I use it if I don't have internet connection?",
      a: "Yes. Our frontend is equipped with local localStorage databases that simulate the backend API if the server is offline or unreachable."
    }
  ];

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Top Header Navbar */}
      <header 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            N
          </div>
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            NutriCare AI
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Log In
          </Link>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        style={{
          width: '100%',
          backgroundImage: "linear-gradient(180deg, rgba(20, 50, 30, 0.82) 0%, rgba(12, 18, 14, 0.9) 100%), url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '7rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          color: '#ffffff'
        }}
      >
        <div 
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '30px',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <span>AI-Powered Diabetes Care Platform</span>
        </div>

        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', fontWeight: 800, marginBottom: '1.5rem', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Manage Diabetes Smarter with <span style={{ color: '#66BB6A' }}>NutriCare AI</span>
        </h1>
        
        <p style={{ fontSize: 'var(--font-lg)', color: 'rgba(255,255,255,0.85)', marginBottom: '2.5rem', maxWidth: '700px', textShadow: '0 1px 5px rgba(0,0,0,0.3)' }}>
          Get personalized meal plans, scan foods instantly, track blood glucose trends, and receive instant multilingual health coaching.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg" style={{ padding: '1rem 2rem', fontSize: '1rem', boxShadow: '0 4px 15px rgba(76,175,80,0.3)' }}>
            <span>Start Free Trial</span>
            <ArrowRight size={18} />
          </button>
          <a href="#features" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-main)' }}>Advanced Health Features</h2>
          <p style={{ color: 'var(--text-muted)' }}>Everything you need to control your glycemia, meals, and medication in one premium package.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '12px',
                  background: feat.color + '15',
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: 'var(--font-md)', margin: 0, color: 'var(--text-main)' }}>{feat.title}</h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '4rem 2rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-2xl)', marginBottom: '2.5rem' }}>Trusted by Patients & Clinicians</h2>
          
          <div className="card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-app)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} fill="var(--accent)" color="var(--accent)" />)}
            </div>
            <p style={{ fontSize: 'var(--font-md)', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: 1.6 }}>
              "NutriCare AI has changed how I cook. As a South Indian diabetic, finding a tool that recognizes Moong Dal Pesarattu and Ragi Idli while calculating accurate carbohydrate ratios in Telugu has been a life saver."
            </p>
            <strong style={{ display: 'block', marginTop: '1rem', color: 'var(--primary)' }}>- Srinivas R., Hyderabad</strong>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--font-2xl)', textAlign: 'center', marginBottom: '2.5rem' }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="card" 
              style={{ padding: '1rem 1.5rem', cursor: 'pointer' }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)' }}>{faq.q}</strong>
                {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: '0.75rem', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', textAlign: 'center', marginBottom: '1.5rem' }}>Contact Medical Board</h2>
          <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" rows="4" required></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer 
        style={{
          background: 'var(--bg-card)',
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} NutriCare Diabetes AI. All rights reserved.</p>
        <p style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.8 }}>
          Disclaimer: This application provides AI-powered nutritional coaching based on clinical guidelines. It does not replace medical advice from qualified healthcare professionals.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
