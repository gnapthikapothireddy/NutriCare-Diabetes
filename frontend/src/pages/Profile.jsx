import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, ClipboardList, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateProfile, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    diabetesType: 'Type 2',
    bloodGroup: 'O+',
    foodPreference: 'Vegetarian',
    state: '',
    city: '',
    medConditions: '',
    allergies: '',
    activityLevel: 'Sedentary',
    targetRange: '80-140 mg/dL',
    doctorName: '',
    emergencyContact: ''
  });

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || 'Male',
        height: user.height || '',
        weight: user.weight || '',
        diabetesType: user.diabetesType || 'Type 2',
        bloodGroup: user.bloodGroup || 'O+',
        foodPreference: user.foodPreference || 'Vegetarian',
        state: user.state || '',
        city: user.city || '',
        medConditions: user.medConditions || '',
        allergies: user.allergies || '',
        activityLevel: user.activityLevel || 'Sedentary',
        targetRange: user.targetRange || '80-140 mg/dL',
        doctorName: user.doctorName || '',
        emergencyContact: user.emergencyContact || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await updateProfile(formData);
      setSuccessMsg('Profile saved successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <User size={28} style={{ color: 'var(--primary)' }} />
        <h1>{t("profile")}</h1>
      </div>

      {!user?.profileCompleted && (
        <div style={{
          padding: '1.25rem',
          borderRadius: '12px',
          background: 'var(--accent-light)',
          color: 'var(--text-main)',
          fontSize: 'var(--font-sm)',
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--accent)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldCheck size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>{t("completeProfileMsg")}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          background: 'rgba(76, 175, 80, 0.15)',
          color: '#2E7D32',
          fontSize: 'var(--font-sm)',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #4CAF50',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldCheck size={20} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Core Info Section */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
            Personal Biomarkers
          </h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("age")}</label>
              <input type="number" name="age" className="form-input" value={formData.age} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("gender")}</label>
              <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("height")}</label>
              <input type="number" name="height" className="form-input" value={formData.height} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("weight")}</label>
              <input type="number" name="weight" className="form-input" value={formData.weight} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input type="text" name="bloodGroup" className="form-input" placeholder="e.g. O+, B-" value={formData.bloodGroup} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Diabetes Configuration */}
        <div>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            Diabetes Profile
          </h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("diabetesType")}</label>
              <select name="diabetesType" className="form-select" value={formData.diabetesType} onChange={handleChange}>
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
                <option value="Gestational">Gestational Diabetes</option>
                <option value="Prediabetes">Prediabetes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("foodPreference")}</label>
              <select name="foodPreference" className="form-select" value={formData.foodPreference} onChange={handleChange}>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("activityLevel")}</label>
              <select name="activityLevel" className="form-select" value={formData.activityLevel} onChange={handleChange}>
                <option value="Sedentary">Sedentary (No Exercise)</option>
                <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                <option value="Very Active">Very Active (Daily Workouts)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("targetRange")}</label>
              <input type="text" name="targetRange" className="form-input" placeholder="e.g. 80-140 mg/dL" value={formData.targetRange} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Region & Medicine Details */}
        <div>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            Location & Medical History
          </h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("state")}</label>
              <input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("city")}</label>
              <input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("medConditions")}</label>
              <input type="text" name="medConditions" className="form-input" placeholder="e.g. Hypertension, None" value={formData.medConditions} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">{t("allergies")}</label>
              <input type="text" name="allergies" className="form-input" placeholder="e.g. Peanuts, Penicillin" value={formData.allergies} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Doctor & Emergency Details */}
        <div>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            Doctor & Emergency Contacts
          </h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t("doctorName")}</label>
              <input type="text" name="doctorName" className="form-input" value={formData.doctorName} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">{t("emergencyContact")}</label>
              <input type="tel" name="emergencyContact" className="form-input" placeholder="Emergency contact phone" value={formData.emergencyContact} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Saving Profile...' : t("saveProfile")}
        </button>

      </form>
    </div>
  );
};

export default Profile;
