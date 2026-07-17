import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  UserCheck, Search, Users, Activity, Pill, Clock, 
  Plus, CheckCircle, Save, Calendar, FileText, ChevronRight 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DoctorDashboard = () => {
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [noteText, setNoteText] = useState('');
  const [patientNotes, setPatientNotes] = useState([]);
  const [success, setSuccess] = useState('');
  const [patientGlucose, setPatientGlucose] = useState([]);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientSleep, setPatientSleep] = useState([]);
  
  // Custom meal recommendation
  const [recommendedRegion, setRecommendedRegion] = useState('South Indian');
  const [recommendedPref, setRecommendedPref] = useState('Vegetarian');

  const loadPatients = async () => {
    try {
      const res = await api.getDoctorPatients();
      if (res.success) {
        setPatients(res.patients || []);
        if (res.patients && res.patients.length > 0) {
          handleSelectPatient(res.patients[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [user]);

  const handleSelectPatient = async (pat) => {
    setSelectedPatient(pat);
    setSuccess('');
    setNoteText('');
    
    // Fetch patient logs
    try {
      // 1. Glucose
      const glRes = await api.getGlucose(pat._id);
      if (glRes.success) setPatientGlucose(glRes.logs || []);

      // 2. Meds
      const mdRes = await api.getMedications(pat._id);
      if (mdRes.success) setPatientMeds(mdRes.medications || []);

      // 3. Sleep
      const slRes = await api.getSleep(pat._id);
      if (slRes.success) setPatientSleep(slRes.logs || []);

      // 4. Doctor Notes
      const ntRes = await api.getDoctorNotes(pat._id);
      if (ntRes.success) setPatientNotes(ntRes.notes || []);

      // Set meal recommendation defaults based on patient values
      setRecommendedRegion(pat.cuisineStyle || 'South Indian');
      setRecommendedPref(pat.foodPreference || 'Vegetarian');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !noteText) return;
    setSuccess('');
    try {
      const res = await api.addDoctorNote(
        user ? user._id : 'doctor_id',
        selectedPatient._id,
        user ? user.name : 'Dr. Specialist',
        noteText
      );
      if (res.success) {
        setSuccess('Clinical note saved successfully!');
        setNoteText('');
        // Reload notes
        const ntRes = await api.getDoctorNotes(selectedPatient._id);
        if (ntRes.success) setPatientNotes(ntRes.notes || []);
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrescribeDiet = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSuccess('');
    try {
      // prescribers will inject/override the active meal plan in backend
      const res = await api.generateMealPlan(selectedPatient._id, {
        diabetesType: selectedPatient.diabetesType || 'Type 2',
        foodPreference: recommendedPref,
        region: recommendedRegion
      });
      if (res.success) {
        setSuccess(`Successfully prescribed ${recommendedPref} (${recommendedRegion}) diet plan!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data for patient's glucose readings
  const lineChartData = {
    labels: patientGlucose.map(g => g.date),
    datasets: [
      {
        label: 'Blood Glucose (mg/dL)',
        data: patientGlucose.map(g => g.reading),
        fill: false,
        borderColor: 'rgba(46, 139, 87, 0.8)',
        backgroundColor: '#2E8B57',
        tension: 0.2
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <UserCheck size={28} style={{ color: 'var(--primary)' }} />
        <h1>Doctor Consultation & Patient Console</h1>
      </div>

      {success && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Left Side: Patient Selector list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            <h3 style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Search Patients
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Name or email..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: 'var(--font-xs)', height: '36px' }}
              />
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto', padding: '0.75rem' }}>
            {filteredPatients.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-xs)', padding: '1rem' }}>No patients found.</p>
            ) : (
              filteredPatients.map(pat => {
                const isSelected = selectedPatient?._id === pat._id;
                return (
                  <div
                    key={pat._id}
                    onClick={() => handleSelectPatient(pat)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: isSelected ? 'var(--secondary-light)' : 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>{pat.name}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Type: {pat.diabetesType || 'N/A'}</span>
                    </div>
                    <ChevronRight size={16} style={{ color: isSelected ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Patient Drilldown details */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Patient Header Card */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>{selectedPatient.name}</h2>
                <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Email: <strong>{selectedPatient.email}</strong> | Gender: <strong>{selectedPatient.gender || 'N/A'}</strong> | Age: <strong>{selectedPatient.age || 'N/A'} yrs</strong>
                </p>
                <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Medical Conditions: <span style={{ color: '#C62828', fontWeight: 'bold' }}>{selectedPatient.medConditions || 'None listed'}</span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Diabetes Type</span>
                  <strong style={{ color: 'var(--primary)' }}>{selectedPatient.diabetesType || 'Type 2'}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Target Range</span>
                  <strong style={{ color: 'var(--accent)' }}>{selectedPatient.targetRange || '80-140'}</strong>
                </div>
              </div>
            </div>

            {/* Vitals Summary Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }} className="grid-3">
              
              {/* Glucose Trends Chart */}
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <Activity size={16} style={{ color: '#E53935' }} />
                  Glucose History (mg/dL)
                </h3>
                {patientGlucose.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No glucose logs available for this patient.</p>
                ) : (
                  <div style={{ height: '180px' }}>
                    <Line 
                      data={lineChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Medication Compliance overview */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Pill size={16} style={{ color: 'var(--primary)' }} />
                    Active Medications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
                    {patientMeds.length === 0 ? (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>No meds listed.</span>
                    ) : (
                      patientMeds.map(m => (
                        <div key={m._id} style={{ fontSize: '0.65rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.2rem' }}>
                          <strong>{m.name}</strong> - {m.dosage} ({m.frequency}x)
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Compliance rate: </span>
                  <strong style={{ color: 'var(--primary)', fontSize: 'var(--font-sm)', display: 'block' }}>
                    {patientMeds.length > 0 ? '84%' : 'N/A'}
                  </strong>
                </div>
              </div>

            </div>

            {/* Note Editor and Diet prescription */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="grid-2">
              
              {/* Note Editor */}
              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--font-sm)', marginBottom: '1rem' }}>
                  <FileText size={18} style={{ color: 'var(--primary)' }} />
                  Clinical Consultation Notes
                </h3>

                <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter clinical note content..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                    style={{ fontSize: 'var(--font-xs)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.4rem 1rem', fontSize: '0.75rem' }}>
                    <Save size={14} />
                    <span>Save Note</span>
                  </button>
                </form>

                {/* Notes History list */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  <strong style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Previous Notes</strong>
                  {patientNotes.length === 0 ? (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>No previous session notes.</span>
                  ) : (
                    patientNotes.slice().reverse().map(n => (
                      <div key={n._id} style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '6px', fontSize: 'var(--font-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.6rem', marginBottom: '0.25rem' }}>
                          <strong>{n.doctorName}</strong>
                          <span>{n.date}</span>
                        </div>
                        <span style={{ color: 'var(--text-main)' }}>{n.note}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Diet Recommendation */}
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--font-sm)', marginBottom: '1rem' }}>
                  <UserCheck size={18} style={{ color: 'var(--accent)' }} />
                  Prescribe Diet Adjustments
                </h3>

                <form onSubmit={handlePrescribeDiet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Cuisine Style</label>
                    <select className="form-select" style={{ fontSize: 'var(--font-xs)', padding: '0.5rem' }} value={recommendedRegion} onChange={(e) => setRecommendedRegion(e.target.value)}>
                      <option value="South Indian">South Indian</option>
                      <option value="North Indian">North Indian</option>
                      <option value="Mediterranean">Mediterranean</option>
                      <option value="Western">Western</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Food Preference</label>
                    <select className="form-select" style={{ fontSize: 'var(--font-xs)', padding: '0.5rem' }} value={recommendedPref} onChange={(e) => setRecommendedPref(e.target.value)}>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}>
                    Push Recommendation
                  </button>
                </form>
              </div>

            </div>

          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Please select a patient from the list to view their data.
          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorDashboard;
