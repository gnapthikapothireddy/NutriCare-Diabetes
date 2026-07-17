import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, Plus, Calendar, AlertTriangle, ShieldAlert, 
  Activity, Pill, Droplet, Dumbbell, UserCheck, BellRing 
} from 'lucide-react';

const CaregiverDashboard = () => {
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [caregiversList, setCaregiversList] = useState([]);
  
  // As caregiver, list patients I track
  const [patientsITrack, setPatientsITrack] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [patientGlucose, setPatientGlucose] = useState([]);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientAlerts, setPatientAlerts] = useState([]);
  const [patientWater, setPatientWater] = useState({ amount: 0, goal: 2500 });
  const [success, setSuccess] = useState('');

  const loadCaregiverInfo = async () => {
    if (!user) return;
    try {
      // 1. Get my caregiver connections (people watching me)
      const res = await api.getCaregiverMembers(user._id);
      if (res.success) setCaregiversList(res.members || []);

      // 2. Get people I am watching (using my email)
      const res2 = await api.getCaregiverPatients(user.email);
      if (res2.success) {
        setPatientsITrack(res2.patients || []);
        if (res2.patients && res2.patients.length > 0) {
          handleSelectPatient(res2.patients[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCaregiverInfo();
  }, [user]);

  const handleSelectPatient = async (pat) => {
    setSelectedPatient(pat);
    try {
      // Load patient glucose logs
      const glRes = await api.getGlucose(pat._id);
      if (glRes.success) setPatientGlucose(glRes.logs || []);

      // Load patient meds
      const medRes = await api.getMedications(pat._id);
      if (medRes.success) setPatientMeds(medRes.medications || []);

      // Load patient water
      const watRes = await api.getWater(pat._id);
      if (watRes.success) setPatientWater(watRes.record || { amount: 0, goal: 2500 });

      // Load patient alerts
      const altRes = await api.getCaregiverAlerts(pat._id);
      if (altRes.success) setPatientAlerts(altRes.alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCaregiver = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSuccess('');
    try {
      const res = await api.addCaregiverMember(user._id, email, relation);
      if (res.success) {
        setSuccess(`Successfully added caregiver: ${email}`);
        setEmail('');
        loadCaregiverInfo();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Users size={28} style={{ color: 'var(--primary)' }} />
        <h1>Caregiver & Family Support</h1>
      </div>

      {success && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Left Column: Link Caregiver / Family Vitals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add Caregiver Panel */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--font-sm)', marginBottom: '0.75rem' }}>
              <Plus size={16} style={{ color: 'var(--primary)' }} />
              Add Family Caregiver
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Invite a family member to monitor your blood sugar trends, medication alarms, and receive SOS alerts.
            </p>

            <form onSubmit={handleAddCaregiver} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Caregiver Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. caregiver@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: 'var(--font-xs)', height: '36px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Relation</label>
                <select 
                  className="form-select" 
                  value={relation} 
                  onChange={(e) => setRelation(e.target.value)}
                  style={{ fontSize: 'var(--font-xs)', padding: '0.4rem', height: '36px' }}
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Doctor">Doctor / Care Manager</option>
                  <option value="Friend">Friend / Guardian</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                Grant Access
              </button>
            </form>
          </div>

          {/* List of my Caregivers */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Authorized Caregivers</h3>
            {caregiversList.length === 0 ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>No caregivers listed yet. Invite one above!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {caregiversList.map((cg) => (
                  <div 
                    key={cg._id}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-app)',
                      borderRadius: '8px',
                      fontSize: 'var(--font-xs)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{cg.caregiverEmail}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 'bold', background: 'var(--secondary-light)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      {cg.relation}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Caregiver Console View (Patients I Track) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BellRing size={18} style={{ color: 'var(--accent)' }} />
                Caregiver Monitoring Board
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Track live vitals and receive emergency alerts for linked family members.
              </span>
            </div>

            {/* List of patients I am watching selector tabs */}
            {patientsITrack.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {patientsITrack.map(pat => (
                  <button
                    key={pat._id}
                    onClick={() => handleSelectPatient(pat)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      background: selectedPatient?._id === pat._id ? 'var(--primary)' : 'var(--bg-card)',
                      color: selectedPatient?._id === pat._id ? '#fff' : 'var(--text-main)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {pat.name} ({pat.relation})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drilldown details */}
          {selectedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Critical Alerts Console */}
              {patientAlerts.length > 0 && patientAlerts.some(a => !a.resolved) && (
                <div 
                  style={{
                    background: 'rgba(229, 57, 53, 0.08)',
                    border: '2px solid rgba(229, 57, 53, 0.4)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E53935' }}>
                    <ShieldAlert size={24} />
                    <strong style={{ fontSize: 'var(--font-sm)' }}>CRITICAL EMERGENCY ALERT TRIGGERED!</strong>
                  </div>
                  
                  {patientAlerts.filter(a => !a.resolved).map(alt => (
                    <div key={alt._id} style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>
                      ⚠️ <strong>{alt.type} Warning:</strong> {alt.message} logged on {alt.date}.
                      {alt.lat && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          GPS Coordinates: {alt.lat}, {alt.lon} | Locate on Emergency Guide Map.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Vitals Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="grid-3">
                {/* Glucose Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Activity size={16} style={{ color: '#E53935' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Blood Sugar</span>
                  </div>
                  <div style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: patientGlucose.length > 0 && patientGlucose[patientGlucose.length-1].status === 'red' ? '#D32F2F' : '#2E7D32' }}>
                      {patientGlucose.length > 0 ? `${patientGlucose[patientGlucose.length-1].reading}` : '---'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>mg/dL</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                    Last reading: {patientGlucose.length > 0 ? patientGlucose[patientGlucose.length-1].mealPeriod : 'No logs'}
                  </span>
                </div>

                {/* Hydration Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Droplet size={16} style={{ color: '#0288D1' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Hydration Status</span>
                  </div>
                  <div style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                      {patientWater.amount} ml
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Goal: {patientWater.goal}ml</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                    Hydration: {Math.round((patientWater.amount/patientWater.goal)*100) || 0}% completed
                  </span>
                </div>

                {/* Meds Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Pill size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Medication Timings</span>
                  </div>
                  <div style={{ margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '50px', overflowY: 'auto' }}>
                    {patientMeds.length === 0 ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>No meds.</span>
                    ) : (
                      patientMeds.map(m => {
                        const today = new Date().toLocaleDateString('en-CA');
                        const isTaken = !!m.adherence?.[today];
                        return (
                          <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
                            <span>{m.name}</span>
                            <span style={{ color: isTaken ? '#2E7D32' : '#C62828', fontWeight: 'bold' }}>
                              {isTaken ? 'Taken ✔' : 'Missed ✖'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                    Missed alert trigger is active
                  </span>
                </div>
              </div>

              {/* Glucose history listings */}
              <div className="card">
                <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Recent Glycemic Excursions</h3>
                {patientGlucose.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>No recent logs.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {patientGlucose.slice().reverse().slice(0, 4).map((log) => (
                      <div 
                        key={log._id} 
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-app)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 'var(--font-xs)',
                          borderLeft: `4px solid ${log.status === 'red' ? '#E53935' : log.status === 'yellow' ? '#FF9800' : '#4CAF50'}`
                        }}
                      >
                        <div>
                          <strong>{log.reading} mg/dL</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: '0.5rem' }}>{log.mealPeriod}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{log.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No family members registered under your caregiver email. Invite family members to link profiles.
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CaregiverDashboard;
