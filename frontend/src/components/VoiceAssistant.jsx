import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X } from 'lucide-react';

const SPOKEN_RESPONSES = {
  en: {
    ready: "Voice assistant ready. How can I help you manage your diabetes today?",
    notSupported: "Speech recognition is not supported in this browser. Please try Chrome.",
    listening: "Listening...",
    error: "Sorry, I didn't catch that. Could you repeat?",
    waterLogged: "Logged 250ml of water. Great job staying hydrated!",
    navigatingSugar: "Navigating to Blood Sugar Tracker. You can enter your reading here.",
    navigatingExercise: "Navigating to Exercise Tracker. Let's record your workout.",
    navigatingMeals: "Opening your active meal planner.",
    navigatingReports: "Opening your Weekly AI Health Report.",
    navigatingMeds: "Opening Medication Manager. Remember to take your tablets on time.",
    navigatingEmergency: "Opening emergency module and searching nearby medical facilities.",
    eatingAdvice: "For a healthy diabetic diet: try Moong Dal Pesarattu for breakfast, Foxtail Millet curd rice for lunch, and steamed paneer or grilled fish for dinner. Keep carbohydrates low!",
    unknown: "I understood your command but do not have a shortcut for it yet. Try saying: log my water, show my meal plan, or find nearby hospitals."
  },
  te: {
    ready: "వాయిస్ అసిస్టెంట్ సిద్ధంగా ఉంది. ఈ రోజు మీ షుగర్ నియంత్రణలో నేను మీకు ఎలా సహాయపడగలను?",
    notSupported: "ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి క్రోమ్ బ్రౌజర్ ఉపయోగించండి.",
    listening: "వింటున్నాను...",
    error: "క్షమించండి, నాకు అర్థం కాలేదు. మరొకసారి చెబుతారా?",
    waterLogged: "250ml నీరు విజయవంతంగా నమోదు చేయబడింది. మంచిది, నీరు బాగా తాగండి!",
    navigatingSugar: "బ్లడ్ షుగర్ ట్రాకర్‌కి వెళ్తున్నాము. మీ షుగర్ రీడింగ్‌లను ఇక్కడ నమోదు చేయండి.",
    navigatingExercise: "వ్యాయామ ట్రాకర్‌కి వెళ్తున్నాము. మీ ఈనాటి వర్కౌట్ నమోదు చేయండి.",
    navigatingMeals: "మీ ఆరోగ్యకరమైన డైట్ ప్లాన్ ఓపెన్ చేస్తున్నాను.",
    navigatingReports: "మీ వారపు AI హెల్త్ రిపోర్ట్ ఓపెన్ చేస్తున్నాను.",
    navigatingMeds: "మందుల పట్టికను ఓపెన్ చేస్తున్నాను. సమయానికి మందులు వేసుకోవడం మరువకండి.",
    navigatingEmergency: "అత్యవసర విభాగానికి వెళ్తున్నాము. సమీప ఆసుపత్రుల వివరాలు కనుగొంటున్నాము.",
    eatingAdvice: "మధుమేహ అల్పాహారానికి పెసరట్టు మంచిది. మధ్యాహ్నం కొర్రల అన్నం లేదా తోటకూర పప్పు, మరియు రాత్రికి తేలికపాటి చపాతీ లేదా పనీర్ తీసుకోండి.",
    unknown: "మీరు చెప్పింది నాకు అర్థమైంది, కానీ దానికి సంబంధించిన షార్ట్‌కట్ ఇంకా లేదు. దయచేసి 'నీరు లాగ్ చేయి', 'భోజన ప్రణాళిక చూపించు', లేదా 'ఆసుపత్రులను వెతకండి' అని చెప్పండి."
  },
  hi: {
    ready: "वॉयस असिस्टेंट तैयार है। आज मधुमेह को नियंत्रित करने में मैं आपकी क्या सहायता कर सकता हूँ?",
    notSupported: "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया क्रोम का उपयोग करें।",
    listening: "सुन रहा हूँ...",
    error: "माफ कीजिए, मुझे समझ नहीं आया। क्या आप दोहरा सकते हैं?",
    waterLogged: "250 मिलीलीटर पानी दर्ज कर लिया गया है। हाइड्रेटेड रहें!",
    navigatingSugar: "ब्लड शुगर ट्रैकर पर जा रहे हैं। आप अपनी रीडिंग यहाँ दर्ज कर सकते हैं।",
    navigatingExercise: "एक्सरसाइज ट्रैकर पर जा रहे हैं। आइए अपना वर्कआउट दर्ज करें।",
    navigatingMeals: "आपका डाइट मील प्लान खोला जा रहा है।",
    navigatingReports: "आपकी साप्ताहिक एआई स्वास्थ्य रिपोर्ट खोली जा रही है।",
    navigatingMeds: "दवा प्रबंधक खोला जा रहा है। समय पर दवा लेना न भूलें।",
    navigatingEmergency: "आपातकालीन मॉड्यूल खोला जा रहा है। नजदीकी अस्पतालों की खोज की जा रही है।",
    eatingAdvice: "मधुमेह के अनुकूल आहार के लिए: नाश्ते में मूंग दाल पेसरट्टू, दोपहर के भोजन में बाजरा/रागी और रात के खाने में पनीर भुर्जी या ग्रिल्ड फिश खाएं। कार्बोहाइड्रेट कम रखें!",
    unknown: "मुझे आपका कमांड समझ आया, लेकिन इसका शॉर्टकट अभी मौजूद नहीं है। कृपया कहें: पानी लॉग करें, डाइट प्लान दिखाएं, या नजदीकी अस्पताल खोजें।"
  }
};

const VoiceAssistant = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { triggerNotification } = useNotifications();
  const navigate = useNavigate();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showHelperCard, setShowHelperCard] = useState(false);
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(true);

  const recognitionRef = useRef(null);

  const activeLang = language || 'en';
  const responses = SPOKEN_RESPONSES[activeLang] || SPOKEN_RESPONSES['en'];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    rec.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      handleVoiceCommand(speechToText);
    };

    rec.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      speakBack(responses.error);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, [language]);

  const speakBack = (text) => {
    if (!speechOutputEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate language voice
    if (activeLang === 'te') utterance.lang = 'te-IN';
    else if (activeLang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';
    
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!speechSupported) {
      alert(responses.notSupported);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Set recognition language
      if (activeLang === 'te') recognitionRef.current.lang = 'te-IN';
      else if (activeLang === 'hi') recognitionRef.current.lang = 'hi-IN';
      else recognitionRef.current.lang = 'en-US';

      try {
        recognitionRef.current?.start();
        speakBack(responses.listening);
      } catch (e) {
        console.error("Failed to start voice recognition:", e);
      }
    }
  };

  const handleVoiceCommand = async (commandText) => {
    const query = commandText.toLowerCase().trim();
    console.log("Voice Command Detected:", query);

    // 1. Water Logging command
    if (
      query.includes("water") || query.includes("hydration") || 
      query.includes("నీరు") || query.includes("తాగాను") ||
      query.includes("पानी") || query.includes("जल")
    ) {
      if (user) {
        try {
          const res = await api.updateWater(user._id, 250);
          if (res.success) {
            speakBack(responses.waterLogged);
            triggerNotification("💧 Water Logged via Voice", "Successfully added 250ml water intake. Keep it up!");
            // Refresh current dashboard if active
            if (window.location.pathname === '/dashboard') {
              window.location.reload();
            }
          }
        } catch (e) {
          speakBack(responses.error);
        }
      }
      return;
    }

    // 2. Blood Sugar tracker navigation
    if (
      query.includes("sugar") || query.includes("glucose") || query.includes("blood sugar") ||
      query.includes("షుగర్") || query.includes("రక్తం") ||
      query.includes("शुगर") || query.includes("ग्लूकोज") || query.includes("शर्करा")
    ) {
      speakBack(responses.navigatingSugar);
      navigate('/sugar-tracker');
      return;
    }

    // 3. Exercise tracker navigation
    if (
      query.includes("exercise") || query.includes("workout") || query.includes("walk") || query.includes("steps") ||
      query.includes("వ్యాయామం") || query.includes("నడక") || query.includes("వర్కౌట్") ||
      query.includes("व्यायाम") || query.includes("वर्कआउट") || query.includes("सैर") || query.includes("कदम")
    ) {
      speakBack(responses.navigatingExercise);
      navigate('/exercise-tracker');
      return;
    }

    // 4. Meal Planner navigation
    if (
      query.includes("meal plan") || query.includes("diet plan") || query.includes("meal planner") ||
      query.includes("భోజన ప్రణాళిక") || query.includes("ఆహారం") ||
      query.includes("मील प्लान") || query.includes("डाइट प्लान") || query.includes("भोजन सूची")
    ) {
      speakBack(responses.navigatingMeals);
      navigate('/meal-planner');
      return;
    }

    // 5. Eating recommendation advice
    if (
      query.includes("what should i eat") || query.includes("what to eat") || query.includes("diet tips") ||
      query.includes("ఏమి తినాలి") || query.includes("ఆహార చిట్కాలు") ||
      query.includes("क्या खाऊं") || query.includes("क्या खाना चाहिए") || query.includes("भोजन सुझाव")
    ) {
      speakBack(responses.eatingAdvice);
      return;
    }

    // 6. Health Reports navigation
    if (
      query.includes("report") || query.includes("health report") || query.includes("insights") ||
      query.includes("రిపోర్ట్") || query.includes("విశ్లేషణ") ||
      query.includes("रिपोर्ट") || query.includes("स्वास्थ्य रिपोर्ट")
    ) {
      speakBack(responses.navigatingReports);
      navigate('/health-reports');
      return;
    }

    // 7. Medication Manager navigation
    if (
      query.includes("medicine") || query.includes("medication") || query.includes("pill") || query.includes("remind me") ||
      query.includes("మందులు") || query.includes("టాబ్లెట్") ||
      query.includes("दवा") || query.includes("गोली") || query.includes("रिमाइंड")
    ) {
      speakBack(responses.navigatingMeds);
      navigate('/medications');
      return;
    }

    // 8. Emergency / Nearby Hospitals navigation
    if (
      query.includes("hospital") || query.includes("emergency") || query.includes("doctor") || query.includes("sos") ||
      query.includes("ఆసుపత్రి") || query.includes("డాక్టర్") || query.includes("సహాయం") ||
      query.includes("अस्पताल") || query.includes("डॉक्टर") || query.includes("आपातकालीन")
    ) {
      speakBack(responses.navigatingEmergency);
      navigate('/emergency');
      return;
    }

    // Command understood but fallback
    speakBack(responses.unknown);
  };

  const toggleHelper = () => setShowHelperCard(!showHelperCard);

  return (
    <>
      {/* Floating Action Button Container */}
      <div 
        style={{
          position: 'fixed',
          bottom: '7.5rem',
          right: '2.2rem',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.75rem'
        }}
      >
        {/* Helper Card */}
        {showHelperCard && (
          <div 
            className="card"
            style={{
              width: '280px',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                <Sparkles size={14} />
                NutriCare Voice Commands
              </span>
              <button onClick={toggleHelper} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: 'var(--font-xs)', color: 'var(--text-main)', textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Try speaking these commands:</p>
              <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleVoiceCommand("Log my water")}>🗣️ "Log my water intake"</div>
              <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleVoiceCommand("Log my blood sugar")}>🗣️ "Log my blood sugar"</div>
              <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleVoiceCommand("What should I eat today?")}>🗣️ "What should I eat today?"</div>
              <div style={{ padding: '0.4rem', background: 'var(--bg-app)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleVoiceCommand("Find nearby hospitals")}>🗣️ "Find nearby hospitals"</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContext: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Spoken Response:</span>
              <button 
                onClick={() => setSpeechOutputEnabled(!speechOutputEnabled)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: speechOutputEnabled ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  marginLeft: 'auto'
                }}
              >
                {speechOutputEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {speechOutputEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        )}

        {/* Microphones floating button */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isListening && (
            <span 
              style={{
                background: 'rgba(229, 57, 53, 0.9)',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              {transcript ? `"${transcript}"` : responses.listening}
            </span>
          )}

          <button
            onClick={startListening}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleHelper();
            }}
            title="Right click for voice commands helper list"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: isListening ? '#E53935' : 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(46, 139, 87, 0.3)',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
            className={isListening ? 'pulse-animation' : ''}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            <span 
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleHelper();
              }}
            >
              ?
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default VoiceAssistant;
