import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertOctagon, Users, ShieldAlert, BarChart3, Database, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const MOCK_AUDITS = [
  { time: '14:24:10', type: 'SOS_TRIGGER', detail: 'User Srinivas R. triggered SOS Distress mode in Jubilee Hills.' },
  { time: '13:05:42', type: 'GLUCOSE_WARN', detail: 'User Priya K. logged critical glucose reading (268 mg/dL).' },
  { time: '11:15:19', type: 'USER_REGISTER', detail: 'New user Amit Sharma registered from Delhi (Type 2).' },
  { time: '09:40:02', type: 'AI_CHAT', detail: 'Chatbot query answered in Telugu regarding Ragi Dosa Glycemic Index.' }
];

const AdminPanel = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [usersList, setUsersList] = useState([
    { id: '1', name: 'Srinivas Rao', age: 58, type: 'Type 2', region: 'Telangana', active: true },
    { id: '2', name: 'Priya Kulkarni', age: 34, type: 'Gestational', region: 'Maharashtra', active: true },
    { id: '3', name: 'Amit Sharma', age: 46, type: 'Type 2', region: 'Delhi', active: true },
    { id: '4', name: 'Rahul Varma', age: 24, type: 'Type 1', region: 'Karnataka', active: false }
  ]);

  const [activeTab, setActiveTab] = useState('users');

  const toggleUserStatus = (id) => {
    setUsersList(usersList.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertOctagon size={28} style={{ color: 'var(--primary)' }} />
        <h1>{t("adminPanel")}</h1>
      </div>

      {/* Aggregate metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }} className="grid-4">
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Users size={32} style={{ color: 'var(--primary)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Active Patients</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>4,821</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <BarChart3 size={32} style={{ color: 'var(--secondary)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>AI Chat Conversations</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>19,450</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert size={32} style={{ color: '#E53935' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Active SOS Distress</span>
            <strong style={{ fontSize: '1.5rem', color: '#E53935' }}>1</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Database size={32} style={{ color: 'var(--accent)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Avg Blood Glucose</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>126 mg/dL</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)'
          }}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('language')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'language' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'language' ? '2px solid var(--primary)' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)'
          }}
        >
          Chatbot Analytics
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'audit' ? '2px solid var(--primary)' : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)'
          }}
        >
          Security Audit Logs
        </button>
      </div>

      {/* Content panes */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Registered Patient Directory</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Age</th>
                  <th style={{ padding: '0.75rem' }}>Diabetes Type</th>
                  <th style={{ padding: '0.75rem' }}>Region</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '0.75rem' }}>{u.age} yrs</td>
                    <td style={{ padding: '0.75rem' }}>{u.type}</td>
                    <td style={{ padding: '0.75rem' }}>{u.region}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        background: u.active ? '#4CAF50' : '#E53935'
                      }}>
                        {u.active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="btn btn-outline"
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.7rem',
                          borderColor: u.active ? '#E53935' : '#4CAF50',
                          color: u.active ? '#E53935' : '#4CAF50'
                        }}
                      >
                        {u.active ? 'Suspend Account' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'language' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Conversations by Language</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '0.35rem' }}>
                  <strong>English</strong>
                  <span>62%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '62%', background: 'var(--primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '0.35rem' }}>
                  <strong>Telugu (తెలుగు)</strong>
                  <span>24%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '24%', background: 'var(--secondary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '0.35rem' }}>
                  <strong>Hindi (हिन्दी)</strong>
                  <span>14%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '14%', background: 'var(--accent)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Top Medical Queries Searched</h3>
            <ul style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
              <li>Can diabetics eat mangoes in summer? (2,810 times)</li>
              <li>Sona Masoori Rice Glycemic Index (1,920 times)</li>
              <li>Is Ragi dosa good for Type 2? (1,480 times)</li>
              <li>Fasting blood sugar 140 mg/dL normal? (1,230 times)</li>
              <li>Is coconut water safe for high blood pressure? (810 times)</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Active Audit Log Feed</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_AUDITS.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '1rem',
                  fontSize: 'var(--font-xs)'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>[{item.time}]</span>
                <span style={{
                  color: item.type === 'SOS_TRIGGER' ? '#E53935' : item.type === 'GLUCOSE_WARN' ? 'var(--accent)' : 'var(--primary)',
                  fontWeight: 'bold'
                }}>
                  {item.type}
                </span>
                <span style={{ color: 'var(--text-main)', flex: 1 }}>{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
