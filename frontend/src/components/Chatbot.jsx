import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MessageSquare, Send, X, Mic, Volume2, VolumeX, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text: language === 'te' 
          ? "నమస్కారం! నేను న్యూట్రికేర్ AI, మీ మధుమేహం పోషకాహార సహాయకుడిని. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?" 
          : language === 'hi'
            ? "नमस्ते! मैं न्यूट्रीकेयर एआई हूँ, आपका मधुमेह पोषण सहायक। आज मैं आपकी क्या सहायता कर सकता हूँ?"
            : "Hello! I am NutriCare AI, your diabetes nutrition assistant. How can I help you manage your diet, blood sugar, or health goals today?",
        timestamp: new Date()
      }
    ]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Web Speech API - Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      
      // Map app language to Web Speech locales
      const localeMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
      recognition.lang = localeMap[language] || 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Map language right before starting
      const localeMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
      recognitionRef.current.lang = localeMap[language] || 'en-US';
      recognitionRef.current.start();
    }
  };

  // Web Speech API - Synthesis / Text-to-Speech Output
  const speakText = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel(); // Stop any active reading
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate lang and find a matching voice if possible
    const localeMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
    utterance.lang = localeMap[language] || 'en-US';
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const data = await api.chatWithAI(text, language, user ? user._id : 'anonymous');
      
      setIsTyping(false);
      const aiMsg = { sender: 'ai', text: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      
      // Speak response if voice output is enabled
      speakText(data.reply);
    } catch (err) {
      setIsTyping(false);
      const errorMsg = { sender: 'ai', text: "Sorry, I am having trouble connecting right now.", timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const quickReplies = {
    en: [
      "Can I eat mango?",
      "Is dosa good for diabetes?",
      "Suggest diabetic breakfast",
      "What should I eat if sugar is 250?",
      "Can diabetics drink coconut water?"
    ],
    te: [
      "నేను మామిడి పండు తినవచ్చా?",
      "దోస డయాబెటిస్ వాళ్లకు మంచిదేనా?",
      "డయాబెటిక్ అల్పాహారం సూచించండి",
      "షుగర్ 250 ఉంటే ఏం తినాలి?",
      "కొబ్బరి నీళ్లు తాగవచ్చా?"
    ],
    hi: [
      "क्या मैं आम खा सकता हूँ?",
      "क्या डोसा मधुमेह में खा सकते हैं?",
      "शुगर मरीजों के लिए नाश्ता बताएं",
      "शुगर 250 होने पर क्या खाना चाहिए?",
      "क्या नारियल पानी पी सकते हैं?"
    ]
  };

  const activeQuickReplies = quickReplies[language] || quickReplies['en'];

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, fontFamily: 'inherit' }}>
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pulse-animation"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(46, 139, 87, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform var(--transition-fast)'
          }}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            height: '500px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          className="chat-window"
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} />
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>NutriCare AI</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online Assistant</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Text to Speech Toggle */}
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) window.speechSynthesis.cancel();
                }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                title={voiceEnabled ? "Mute Voice Output" : "Enable Voice Output"}
              >
                {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                }}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'var(--bg-app)'
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-main)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    fontSize: 'var(--font-sm)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    marginTop: '0.25rem',
                    padding: '0 0.25rem'
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Chips */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              background: 'var(--bg-app)',
              borderTop: '1px solid var(--border)',
              scrollbarWidth: 'none'
            }}
          >
            {activeQuickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSend(reply)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  transition: 'all var(--transition-fast)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat Input Footer */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {/* Voice Dictation Button */}
            <button
              onClick={toggleListening}
              style={{
                background: isListening ? '#E53935' : 'var(--bg-app)',
                color: isListening ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Speak message"
            >
              <Mic size={18} className={isListening ? 'pulse-animation' : ''} />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask diabetes query..."}
              disabled={isListening}
              style={{
                flex: 1,
                padding: '0.6rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: 'var(--bg-app)',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: 'var(--font-sm)'
              }}
            />

            <button
              onClick={() => handleSend()}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Animations style */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @media (max-width: 480px) {
          .chat-window {
            width: 320px !important;
            right: 1rem !important;
            bottom: 5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
