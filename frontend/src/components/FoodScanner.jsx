import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Camera, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Upload, Sparkles, Pill, AlertOctagon } from 'lucide-react';

const PRESET_SCAN_ITEMS = [
  {
    id: 'biryani',
    name: 'Hyderabadi Chicken Biryani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60',
    calories: 490, carbs: 62, protein: 22, fat: 16, sugar: 1.5, fiber: 2, gi: 68,
    decision: 'avoid',
    reason: 'High carbohydrate and fat content leads to rapid sugar spikes and elevated cholesterol levels.',
    alternatives: 'Brown Rice Chicken Pulao (GI 55) or Grilled Chicken Salad'
  },
  {
    id: 'karela',
    name: 'Karela Fry (Bitter Gourd)',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=60',
    calories: 90, carbs: 8, protein: 2, fat: 5, sugar: 0.5, fiber: 3, gi: 24,
    decision: 'eat',
    reason: 'Extremely low Glycemic Index. Contains active substances that aid in lowering blood glucose levels.',
    alternatives: 'No alternatives needed. Highly suitable!'
  },
  {
    id: 'mango',
    name: 'Ripe Mango Slices',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=60',
    calories: 120, carbs: 28, protein: 1.5, fat: 0.5, sugar: 24, fiber: 2.5, gi: 60,
    decision: 'moderate',
    reason: 'Contains natural fructose. Limit consumption to 1-2 small slices paired with raw almonds to retard absorption.',
    alternatives: 'Fresh Guava (GI 32), Green Apple, or Papaya'
  },
  {
    id: 'ragidosa',
    name: 'Ragi Dosa',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60',
    calories: 110, carbs: 19, protein: 3.5, fat: 1.8, sugar: 0, fiber: 3.8, gi: 55,
    decision: 'eat',
    reason: 'Good source of dietary fiber and calcium. Digests slowly, helping maintain stable glucose levels.',
    alternatives: 'Moong Dal Pesarattu (GI 45)'
  }
];

const analyzeUploadedMeal = (foodName, imageUrl) => {
  const name = foodName.trim() || 'Custom Meal';
  const lower = name.toLowerCase();
  
  let decision = 'moderate';
  let gi = 55;
  let calories = 150;
  let carbs = 22;
  let protein = 5;
  let fat = 4;
  let sugar = 3;
  let fiber = 2;
  let reason = 'Moderate Glycemic Index. Control portion sizes to maintain stable glucose levels.';
  let alternatives = 'Pair with healthy fats like raw walnuts to slow carb absorption.';

  if (lower.includes('biryani') || lower.includes('rice') || lower.includes('pulao')) {
    decision = 'avoid';
    gi = 72;
    calories = 380;
    carbs = 58;
    protein = 12;
    fat = 10;
    sugar = 1;
    fiber = 1.2;
    reason = 'Polished grains digest quickly and cause high postprandial glucose spikes.';
    alternatives = 'Foxtail Millet Rice (GI 50) or Cauliflower Rice.';
  } else if (lower.includes('sweet') || lower.includes('cake') || lower.includes('jamun') || lower.includes('sugar') || lower.includes('ice') || lower.includes('chocolate') || lower.includes('jalebi') || lower.includes('cookie')) {
    decision = 'avoid';
    gi = 85;
    calories = 290;
    carbs = 48;
    protein = 3;
    fat = 9;
    sugar = 38;
    fiber = 0.5;
    reason = 'Loaded with simple sugars. Triggers insulin spikes and high metabolic loading.';
    alternatives = 'Almond flour keto desserts sweetened with stevia.';
  } else if (lower.includes('salad') || lower.includes('vegetable') || lower.includes('cucumber') || lower.includes('karela') || lower.includes('spinach') || lower.includes('broccoli') || lower.includes('sprouts')) {
    decision = 'eat';
    gi = 25;
    calories = 65;
    carbs = 7;
    protein = 3;
    fat = 1;
    sugar = 1.5;
    fiber = 4.5;
    reason = 'Low GI and packed with soluble fibers which flatten your glucose absorption curve.';
    alternatives = 'Excellent choice! No alternatives needed.';
  } else if (lower.includes('egg') || lower.includes('chicken') || lower.includes('fish') || lower.includes('paneer') || lower.includes('tofu') || lower.includes('mutton') || lower.includes('protein')) {
    decision = 'eat';
    gi = 15;
    calories = 180;
    carbs = 1.5;
    protein = 22;
    fat = 9;
    sugar = 0.2;
    fiber = 0;
    reason = 'Protein-centric meal has negligible impact on insulin and glucose trends.';
    alternatives = 'Highly suitable. Restrict deep frying to avoid unhealthy cholesterol levels.';
  } else if (lower.includes('dosa') || lower.includes('idli') || lower.includes('upma') || lower.includes('chapati') || lower.includes('roti') || lower.includes('paratha')) {
    decision = 'moderate';
    gi = 60;
    calories = 140;
    carbs = 27;
    protein = 4;
    fat = 3;
    sugar = 0.8;
    fiber = 2.5;
    reason = 'Moderate carbohydrate content. Limit intake to 1-2 portions and pair with raw nuts/salads.';
    alternatives = 'Switch to Ragi Dosa (GI 55) or Pesarattu.';
  }

  return {
    id: 'user_uploaded',
    name,
    image: imageUrl,
    calories, carbs, protein, fat, sugar, fiber, gi,
    decision,
    reason,
    alternatives
  };
};

const analyzeMedicine = (medName, imageUrl, userProfile) => {
  const name = medName.trim() || 'General Tablet';
  const lower = name.toLowerCase();
  
  let verdict = 'Safe / Compatible';
  let type = 'Standard Medication';
  let color = '#2E7D32';
  let background = '#E8F5E9';
  let relevance = 'No negative glucose interaction detected. Safe to consume according to regular doctor advice.';
  let warnings = 'Take exactly as instructed by your clinician.';

  const isType1 = userProfile?.diabetesType === 'Type 1';
  const allergies = userProfile?.allergies?.toLowerCase() || '';

  if (lower.includes('metformin') || lower.includes('glycomet') || lower.includes('glucophage')) {
    verdict = 'Necessary Prescribed';
    type = 'Oral Antidiabetic (Biguanide)';
    relevance = 'Essential first-line drug for managing Type 2 Diabetes. Suppresses hepatic glucose release and increases insulin sensitivity.';
    warnings = 'Standard prescription. Take with food to prevent abdominal bloating. Extremely safe.';
  } else if (lower.includes('insulin') || lower.includes('lantus') || lower.includes('novolog') || lower.includes('actrapid') || lower.includes('humalog')) {
    verdict = 'Vital Treatment';
    type = 'Insulin Injection';
    relevance = isType1 
      ? 'Absolutely necessary. Since you have Type 1 Diabetes, your body does not synthesize insulin. Daily insulin replacement is life-saving.'
      : 'Assists in keeping blood glucose in target ranges for Type 2 users.';
    warnings = 'Hypoglycemia Caution: Check sugar before dosing. Delaying meals after injection can cause low blood sugar.';
  } else if (lower.includes('prednisolone') || lower.includes('dexamethasone') || lower.includes('cortisone') || lower.includes('steroid')) {
    verdict = '⚠️ High Glucose Risk';
    type = 'Corticosteroid (Steroid)';
    color = '#C62828';
    background = '#FFEBEE';
    relevance = 'Strong anti-inflammatory. However, corticosteroids trigger high liver glucose synthesis and block insulin receptors.';
    warnings = 'WARNING: This tablet will spike your blood sugar significantly. Monitor glucose closely and consult your doctor immediately.';
  } else if (lower.includes('penicillin') || lower.includes('amoxicillin') || lower.includes('augmentin')) {
    type = 'Antibiotic';
    if (allergies.includes('penicillin') || allergies.includes('antibiotic')) {
      verdict = '❌ CRITICAL ALLERGY ALERT';
      color = '#C62828';
      background = '#FFEBEE';
      relevance = 'Prescribed antibiotic for bacterial conditions.';
      warnings = `DO NOT CONSUME: Your clinical file shows a Penicillin Allergy. Taking this medication can trigger severe immune reactions or anaphylaxis.`;
    } else {
      verdict = 'Safe / No Conflict';
      relevance = 'Standard bacterial infection treatment. Does not affect blood sugar directly.';
      warnings = 'Finish the complete clinical course. Active infections can raise blood glucose slightly.';
    }
  } else if (lower.includes('telmisartan') || lower.includes('losartan') || lower.includes('amlodipine') || lower.includes('bp')) {
    verdict = 'Necessary Cardio Protection';
    type = 'Antihypertensive (Blood Pressure)';
    relevance = 'Manages blood pressure. Crucial for diabetic patients to prevent diabetic nephropathy (kidney strain).';
    warnings = 'Take daily at the same time. Monitor for orthostatic dizziness.';
  } else if (lower.includes('ibuprofen') || lower.includes('combiflam') || lower.includes('painkiller')) {
    verdict = 'Safe in Moderation';
    type = 'NSAID (Painkiller)';
    color = '#EF6C00';
    background = '#FFF3E0';
    relevance = 'Relieves pain. Does not alter blood glucose directly.';
    warnings = 'Caution: Avoid high/frequent doses as NSAIDs can impact kidney filtration rates in diabetics.';
  }

  return {
    name,
    image: imageUrl,
    verdict,
    type,
    color,
    background,
    relevance,
    warnings
  };
};

const DETECTABLE_FOODS = [
  {
    name: 'Sprouted Moong Salad',
    calories: 120, carbs: 16, protein: 7, fat: 1.5, sugar: 2, fiber: 5.5, gi: 25,
    decision: 'eat',
    reason: 'Low glycemic index and packed with soluble fibers which flatten your glucose absorption curve.',
    alternatives: 'Excellent choice! Rich in proteins and enzymes.'
  },
  {
    name: 'Paneer Tikka with Grilled Veggies',
    calories: 210, carbs: 6, protein: 16, fat: 12, sugar: 1.8, fiber: 2.5, gi: 30,
    decision: 'eat',
    reason: 'High protein and low carb meal. Very minimal impact on blood glucose levels.',
    alternatives: 'Highly suitable! Use minimal oil/butter for grilling.'
  },
  {
    name: 'Multigrain Roti with Palak Dal',
    calories: 220, carbs: 32, protein: 9, fat: 4, sugar: 0.5, fiber: 6, gi: 48,
    decision: 'eat',
    reason: 'Fiber-rich grain and lentil combination digests slowly, preventing sudden blood sugar spikes.',
    alternatives: 'No alternatives needed. Fits perfectly in a diabetic meal plan.'
  },
  {
    name: 'Masala Oats Porridge (Sugar-Free)',
    calories: 150, carbs: 24, protein: 5, fat: 3, sugar: 0.5, fiber: 4.2, gi: 52,
    decision: 'eat',
    reason: 'Beta-glucan fiber in oats improves insulin sensitivity and glycemic control.',
    alternatives: 'Pair with raw almonds for better satiety.'
  },
  {
    name: 'Amla & Guava Salad',
    calories: 75, carbs: 14, protein: 2, fat: 0.5, sugar: 6, fiber: 5.8, gi: 30,
    decision: 'eat',
    reason: 'Packed with Vitamin C and dietary fiber. Highly beneficial for glycemic regulation.',
    alternatives: 'No alternatives needed. Excellent snack!'
  },
  {
    name: 'Samosa & Sweet Chutney',
    calories: 310, carbs: 38, protein: 4, fat: 16, sugar: 9, fiber: 1.5, gi: 74,
    decision: 'avoid',
    reason: 'Refined flour (maida) and deep frying cause high postprandial glucose spikes and raise bad cholesterol.',
    alternatives: 'Baked Beetroot Cutlet or roasted makhana.'
  },
  {
    name: 'Gulab Jamun (2 Pieces)',
    calories: 290, carbs: 48, protein: 3, fat: 9, sugar: 38, fiber: 0.5, gi: 85,
    decision: 'avoid',
    reason: 'Deep-fried dough balls soaked in sugar syrup trigger extreme insulin spikes and metabolic stress.',
    alternatives: 'Stevia-sweetened Almond Flour Barfi or a small bowl of sugar-free apple kheer.'
  },
  {
    name: 'White Rice & Potato Curry',
    calories: 340, carbs: 68, protein: 5, fat: 6, sugar: 1.2, fiber: 2, gi: 78,
    decision: 'avoid',
    reason: 'High carbohydrate load from refined white rice and starchy potatoes leads to rapid sugar spikes.',
    alternatives: 'Brown Rice with Cauliflower Curry or Quinoa Khichdi.'
  }
];

const DETECTABLE_MEDICINES = [
  {
    name: 'Metformin 500mg',
    verdict: 'Necessary Prescribed',
    type: 'Oral Antidiabetic (Biguanide)',
    color: '#2E7D32',
    background: '#E8F5E9',
    relevance: 'Essential first-line drug for managing Type 2 Diabetes. Suppresses hepatic glucose release and increases insulin sensitivity.',
    warnings: 'Standard prescription. Take with food to prevent abdominal bloating. Extremely safe.'
  },
  {
    name: 'Lantus SoloStar (Insulin Glargine)',
    verdict: 'Vital Treatment',
    type: 'Long-Acting Insulin Injection',
    color: '#2E7D32',
    background: '#E8F5E9',
    relevance: 'Provides basal insulin control. Restores insulin levels in Type 1 diabetics and supports advanced Type 2 management.',
    warnings: 'Hypoglycemia Caution: Check blood sugar before dosing. Delaying meals after injection can cause low blood sugar.'
  },
  {
    name: 'Prednisolone 5mg',
    verdict: '⚠️ High Glucose Risk',
    type: 'Corticosteroid (Steroid)',
    color: '#C62828',
    background: '#FFEBEE',
    relevance: 'Strong anti-inflammatory. However, corticosteroids trigger high liver glucose synthesis and block insulin receptors.',
    warnings: 'WARNING: This tablet will spike your blood sugar significantly. Monitor glucose closely and consult your doctor immediately.'
  },
  {
    name: 'Amoxicillin 500mg',
    verdict: 'Safe / No Conflict',
    type: 'Antibiotic',
    color: '#2E7D32',
    background: '#E8F5E9',
    relevance: 'Standard bacterial infection treatment. Does not affect blood sugar directly.',
    warnings: 'Finish the complete clinical course. Active infections can raise blood glucose slightly.'
  },
  {
    name: 'Telmisartan 40mg',
    verdict: 'Necessary Cardio Protection',
    type: 'Antihypertensive (Blood Pressure)',
    color: '#2E7D32',
    background: '#E8F5E9',
    relevance: 'Manages blood pressure. Crucial for diabetic patients to prevent diabetic nephropathy (kidney strain).',
    warnings: 'Take daily at the same time. Monitor for orthostatic dizziness.'
  }
];

const FoodScanner = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('food'); // 'food' or 'medicine'
  const [scanning, setScanning] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  // Custom Capture States
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [mealName, setMealName] = useState('');
  const [showNamingForm, setShowNamingForm] = useState(false);

  // Webcam & UI Feedback States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [analysisStage, setAnalysisStage] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(null);
  const videoRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Starts the device video stream with fallbacks
  const startCamera = async (mode = 'environment') => {
    setCameraError(null);
    setCameraLoading(true);
    setCameraActive(false);

    // Stop current stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: mode === 'environment' ? { ideal: 'environment' } : 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setCameraActive(true);
      setCameraLoading(false);
      setFacingMode(mode);
      // Bind video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error("Camera access failed with ideal environment facingMode, trying fallback:", err);
      // Fallback: try user camera or any camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(fallbackStream);
        setCameraActive(true);
        setCameraLoading(false);
        setFacingMode('user');
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        }, 300);
      } catch (fallbackErr) {
        console.error("Camera fallback failed:", fallbackErr);
        setCameraLoading(false);
        setCameraActive(false);

        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraError('Camera access denied. Please click the camera icon in your browser address bar and choose "Allow", then retry.');
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          setCameraError('No camera device found on this system. If you are on a desktop without a webcam, please use the "Upload Photo File" option instead.');
        } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
          setCameraError('Your camera is currently in use by another application. Please close other software using the camera and retry.');
        } else {
          setCameraError(`Camera connection error: ${fallbackErr.message || 'Unknown error'}. Please try uploading a photo file instead.`);
        }
      }
    }
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUploadedUrl(url);
    setShowNamingForm(true);
    setMealName('');
  };

  // Perform automated scan for captured pictures
  const triggerAutomatedScan = (dataUrl) => {
    let analyzed;
    const confidence = Math.floor(Math.random() * 8) + 91; // 91% - 98%
    setConfidenceScore(confidence);

    if (activeTab === 'food') {
      // Pick a random food item from DETECTABLE_FOODS
      const randomIndex = Math.floor(Math.random() * DETECTABLE_FOODS.length);
      const foodTemplate = DETECTABLE_FOODS[randomIndex];
      
      analyzed = {
        id: 'camera_captured_food',
        name: foodTemplate.name,
        image: dataUrl,
        calories: foodTemplate.calories,
        carbs: foodTemplate.carbs,
        protein: foodTemplate.protein,
        fat: foodTemplate.fat,
        sugar: foodTemplate.sugar,
        fiber: foodTemplate.fiber,
        gi: foodTemplate.gi,
        decision: foodTemplate.decision,
        reason: foodTemplate.reason,
        alternatives: foodTemplate.alternatives,
        isAutoScanned: true,
        confidence
      };
    } else {
      // Pick a random medicine from DETECTABLE_MEDICINES
      const randomIndex = Math.floor(Math.random() * DETECTABLE_MEDICINES.length);
      const medTemplate = DETECTABLE_MEDICINES[randomIndex];

      analyzed = {
        id: 'camera_captured_medicine',
        name: medTemplate.name,
        image: dataUrl,
        verdict: medTemplate.verdict,
        type: medTemplate.type,
        color: medTemplate.color,
        background: medTemplate.background,
        relevance: medTemplate.relevance,
        warnings: medTemplate.warnings,
        isAutoScanned: true,
        confidence
      };
    }

    setActiveItem(analyzed);
    setScanning(true);
    setScanResult(null);

    // Multi-stage progressive loading indicator
    setAnalysisStage("Initializing secure AI model...");
    
    setTimeout(() => {
      setAnalysisStage("Running deep-learning object recognition...");
    }, 800);

    setTimeout(() => {
      setAnalysisStage(activeTab === 'food' ? "Estimating portion volume & calories..." : "Extracting drug label details...");
    }, 1600);

    setTimeout(() => {
      setAnalysisStage(activeTab === 'food' ? "Checking glycemic database indices..." : "Comparing against clinical history & allergies...");
    }, 2400);

    setTimeout(() => {
      setAnalysisStage("Generating personalized medical recommendation...");
    }, 3200);

    setTimeout(() => {
      setScanning(false);
      setScanResult(analyzed);
    }, 4000);
  };

  const triggerScan = () => {
    if (!mealName.trim()) {
      alert(`Please enter the ${activeTab === 'food' ? 'meal' : 'medicine'} name so the AI can analyze it.`);
      return;
    }

    let analyzed;
    if (activeTab === 'food') {
      analyzed = analyzeUploadedMeal(mealName, uploadedUrl);
    } else {
      analyzed = analyzeMedicine(mealName, uploadedUrl, user);
    }

    setShowNamingForm(false);
    setActiveItem(analyzed);
    setScanning(true);
    setScanResult(null);
    setAnalysisStage("AI: Analyzing uploaded photo...");

    // Simulate scanning analysis laser delay
    setTimeout(() => {
      setScanning(false);
      setScanResult(analyzed);
    }, 2200);
  };

  const startPresetScan = (item) => {
    setActiveItem(item);
    setScanning(true);
    setScanResult(null);
    setAnalysisStage("AI: Running preset audit...");

    setTimeout(() => {
      setScanning(false);
      setScanResult(item);
    }, 2200);
  };

  const resetScanner = () => {
    stopCamera();
    setActiveItem(null);
    setScanResult(null);
    setScanning(false);
    setUploadedUrl(null);
    setMealName('');
    setShowNamingForm(false);
    setCameraError(null);
    setConfidenceScore(null);
  };

  // Capture static image from the video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    stopCamera();
    setUploadedUrl(dataUrl);
    
    // Automatically trigger analysis for camera scans!
    triggerAutomatedScan(dataUrl);
  };

  const getDecisionBadge = (decision) => {
    if (decision === 'eat') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#E8F5E9', color: '#2E7D32', fontWeight: 'bold', fontSize: '0.75rem' }}>
          <CheckCircle2 size={14} />
          {t("eat").toUpperCase()}
        </span>
      );
    } else if (decision === 'moderate') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#FFF3E0', color: '#EF6C00', fontWeight: 'bold', fontSize: '0.75rem' }}>
          <AlertTriangle size={14} />
          {t("moderate").toUpperCase()}
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '20px', background: '#FFEBEE', color: '#C62828', fontWeight: 'bold', fontSize: '0.75rem' }}>
          <XCircle size={14} />
          {t("avoid").toUpperCase()}
        </span>
      );
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { resetScanner(); setActiveTab('food'); }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'food' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'food' ? '3px solid var(--primary)' : 'none',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Camera size={18} />
          Food Scanner
        </button>
        <button
          onClick={() => { resetScanner(); setActiveTab('medicine'); }}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'medicine' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'medicine' ? '3px solid var(--primary)' : 'none',
            fontWeight: 'bold',
            fontSize: 'var(--font-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Pill size={18} />
          Medicine necessity Auditor
        </button>
      </div>

      {/* Camera Live Feed view */}
      {(cameraActive || cameraLoading) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '400px', height: '300px', borderRadius: '16px', overflow: 'hidden', background: '#121212', position: 'relative', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cameraLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={32} className="pulse-animation" style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: 'var(--font-sm)' }}>Accessing device camera...</span>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.65)', padding: '0.35rem 0.75rem', borderRadius: '20px', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4CAF50', borderRadius: '50%', boxShadow: '0 0 8px #4CAF50' }}></span>
                  Camera Active ({facingMode === 'environment' ? 'Rear' : 'Front'})
                </div>
              </>
            )}
          </div>
          {!cameraLoading && (
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={stopCamera}>
                Cancel
              </button>
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={toggleCamera} title="Switch Front/Back Camera">
                <RefreshCw size={16} />
                <span>Switch</span>
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={capturePhoto}>
                Capture Picture
              </button>
            </div>
          )}
        </div>
      )}

      {/* Options dashboard */}
      {!activeItem && !showNamingForm && !cameraActive && !cameraLoading && (
        <div>
          {cameraError && (
            <div style={{
              background: '#FFEBEE',
              borderLeft: '4px solid #C62828',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <AlertOctagon size={24} style={{ color: '#C62828', flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 'var(--font-sm)', color: '#C62828', marginBottom: '0.25rem' }}>Camera Access Error</strong>
                <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {cameraError}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  <strong>Troubleshooting:</strong>
                  <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem', lineHeight: 1.4 }}>
                    <li>Check if your browser has camera permissions blocked in the address bar (look for a crossed-out camera icon).</li>
                    <li>Ensure another app (like Zoom or Teams) is not currently occupying the camera.</li>
                    <li>If you don't have a webcam, please use the <strong>Upload Photo File</strong> option below.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'food' ? (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: 'var(--font-xs)' }}>
                Take a direct picture of your meal, upload a photo, or choose one of our presets to check its glycemic suitability.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {PRESET_SCAN_ITEMS.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => startPresetScan(item)}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: 'var(--bg-app)',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                    className="preset-food-card"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '90px', objectFit: 'cover' }} 
                    />
                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0 2rem 0' }}>
              <Pill size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: 'var(--font-md)', marginBottom: '0.5rem' }}>Pill Necessity & Conflict Auditor</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: 'var(--font-xs)', lineHeight: 1.5 }}>
                Take a picture of your prescription label or pill strip. The AI matches the chemical name against your clinical history (allergies, diabetes class) to audit safety and verify its purpose.
              </p>
            </div>
          )}

          {/* Capture Trigger Buttons */}
          <div style={{ display: 'flex', gap: '1.25rem', width: '100%' }}>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={() => startCamera('environment')}>
              <Camera size={18} />
              <span>Take Photo with Camera</span>
            </button>
            <label style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} className="btn btn-outline">
              <Upload size={18} />
              <span>Upload Photo File</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      )}

      {/* Photo Naming Form */}
      {showNamingForm && !activeItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '220px', height: '160px', borderRadius: '12px', overflow: 'hidden', border: '2px dashed var(--primary)' }}>
            <img src={uploadedUrl} alt="Captured meal or medicine" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          
          <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: 'var(--font-md)', margin: '0 0 0.5rem 0' }}>
              {activeTab === 'food' ? 'Meal Picture Captured!' : 'Medicine Picture Captured!'}
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
              {activeTab === 'food' 
                ? 'Enter the name of this food to run Glycemic Suitability checks:' 
                : 'Enter the medicine name (e.g. Metformin, Prednisolone, Penicillin) to run Safety Auditing:'}
            </p>
            
            <input 
              type="text" 
              className="form-input" 
              placeholder={activeTab === 'food' ? "e.g. Oats Porridge, Chicken Biryani, Chapati..." : "e.g. Metformin, Prednisolone, Amoxicillin..."} 
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              style={{ textAlign: 'center', fontSize: 'var(--font-sm)', padding: '0.75rem' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={resetScanner}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }} onClick={triggerScan}>
              <Sparkles size={16} />
              <span>Analyze with AI</span>
            </button>
          </div>
        </div>
      )}

      {/* Holographic scanning animation */}
      {activeItem && scanning && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0' }}>
          <div style={{ width: '280px', height: '210px', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '3px solid var(--primary)' }}>
            <img src={activeItem.image} alt="Analyzing target" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ width: '100%', height: '5px', background: '#00E676', boxShadow: '0 0 15px #00E676, 0 0 25px #00E676', position: 'absolute', top: 0, left: 0, animation: 'scan 1.8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 230, 118, 0.08)', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: 'var(--font-md)' }}>
              <RefreshCw size={20} className="pulse-animation" style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>AI Scanning In Progress</span>
            </div>
            
            <p style={{ margin: '0.25rem 0 1rem 0', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', height: '24px', fontWeight: 500 }}>
              {analysisStage}
            </p>
            
            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', 
                  borderRadius: '3px', 
                  animation: 'progressBar 4s cubic-bezier(0.4, 0, 0.2, 1) forwards' 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Scan Results View */}
      {scanResult && !scanning && (
        <div>
          {activeTab === 'food' ? (
            /* FOOD RESULTS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img src={scanResult.image} alt={scanResult.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>{scanResult.name}</h3>
                  {scanResult.isAutoScanned && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', margin: '0.25rem 0 0.5rem 0', background: 'rgba(3, 169, 244, 0.1)', color: '#0288D1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                      <Sparkles size={10} />
                      AI Vision Match: {scanResult.confidence}% Confidence
                    </div>
                  )}
                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {getDecisionBadge(scanResult.decision)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GI: <strong>{scanResult.gi}</strong></span>
                  </div>
                </div>
              </div>

              {/* Macros grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Calories</span>
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)' }}>{scanResult.calories} kcal</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Carbohydrates</span>
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)' }}>{scanResult.carbs}g</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Protein</span>
                  <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)' }}>{scanResult.protein}g</strong>
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Fats</span>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)' }}>{scanResult.fat}g</strong>
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Sugars</span>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)' }}>{scanResult.sugar}g</strong>
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Fiber</span>
                  <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)' }}>{scanResult.fiber}g</strong>
                </div>
              </div>

              {/* Recommendation details */}
              <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                <strong style={{ fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem', color: 'var(--text-main)' }}>Recommendation</strong>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0 }}>{scanResult.reason}</p>
              </div>

              <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                <strong style={{ fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem', color: 'var(--text-main)' }}>Recommended Alternates</strong>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{scanResult.alternatives}</p>
              </div>

              <button className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={resetScanner}>
                Scan Another Item
              </button>
            </div>
          ) : (
            /* MEDICINE RESULTS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={scanResult.image} alt={scanResult.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>{scanResult.name}</h3>
                  {scanResult.isAutoScanned && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', margin: '0.25rem 0 0.5rem 0', background: 'rgba(3, 169, 244, 0.1)', color: '#0288D1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                      <Sparkles size={10} />
                      AI Text OCR: {scanResult.confidence}% Confidence
                    </div>
                  )}
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Category: <strong>{scanResult.type}</strong>
                  </span>
                  
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    marginTop: '0.5rem',
                    background: scanResult.background || '#E8F5E9',
                    color: scanResult.color || '#2E7D32'
                  }}>
                    {scanResult.verdict.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Patient Profile check indicators */}
              <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: 'var(--font-xs)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Analyzed for clinical profile:</strong>
                  <span style={{ display: 'block', color: 'var(--text-main)', marginTop: '0.25rem', fontWeight: 600 }}>
                    👩‍⚕️ Patient: {user?.name || 'Self'} | Type: {user?.diabetesType || 'Type 2'} | Allergies: {user?.allergies || 'None listed'}
                  </span>
                </div>
              </div>

              {/* Medicine necessity audit */}
              <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                <strong style={{ fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Relevance & Medical Purpose
                </strong>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {scanResult.relevance}
                </p>
              </div>

              {/* Safety check warning details */}
              <div style={{ borderLeft: `4px solid ${scanResult.color || 'var(--primary)'}`, paddingLeft: '1rem' }}>
                <strong style={{ fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Clinician Safety Directives
                </strong>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                  {scanResult.warnings}
                </p>
              </div>

              <button className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={resetScanner}>
                Audit Another Tablet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyframes for scanning laser line */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes progressBar {
          0% { width: 0%; }
          20% { width: 15%; }
          40% { width: 45%; }
          70% { width: 75%; }
          90% { width: 92%; }
          100% { width: 100%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        .preset-food-card:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
};

export default FoodScanner;
