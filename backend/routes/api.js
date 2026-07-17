const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- PRE-SEEDED INDIAN FOOD DATABASE ---
const INDIAN_FOODS_DB = [
  // South Indian
  { name: 'Brown Rice Idli', calories: 60, carbs: 12, protein: 2, fat: 0.5, sugar: 0, fiber: 2, gi: 50, suitable: true, qty: '2 Pcs', category: 'South Indian', alternatives: 'Ragi Idli, Oats Idli' },
  { name: 'Regular Rice Idli', calories: 65, carbs: 15, protein: 2, fat: 0.2, sugar: 0.1, fiber: 0.8, gi: 77, suitable: false, qty: '1 Pc', alternatives: 'Brown Rice Idli, Oats Idli' },
  { name: 'Plain Dosa', calories: 120, carbs: 22, protein: 3, fat: 3, sugar: 0.1, fiber: 1.2, gi: 75, suitable: false, qty: '1 Pc', alternatives: 'Ragi Dosa, Moong Dal Pesarattu' },
  { name: 'Moong Dal Pesarattu', calories: 140, carbs: 18, protein: 8, fat: 2, sugar: 0, fiber: 4.5, gi: 45, suitable: true, qty: '1 Pc', category: 'South Indian', alternatives: 'Oats Dosa' },
  { name: 'Ragi Dosa', calories: 110, carbs: 19, protein: 3.5, fat: 1.8, sugar: 0, fiber: 3.8, gi: 55, suitable: true, qty: '1 Pc', category: 'South Indian', alternatives: 'Moong Dal Pesarattu' },
  { name: 'Sambar', calories: 85, carbs: 12, protein: 4, fat: 2.5, sugar: 2, fiber: 3, gi: 48, suitable: true, qty: '1 Small Bowl', category: 'South Indian', alternatives: 'Spinach Dal, Tomato Rasam' },
  { name: 'Tomato Rasam', calories: 40, carbs: 5, protein: 1, fat: 1.5, sugar: 1, fiber: 0.5, gi: 40, suitable: true, qty: '1 Bowl', category: 'South Indian', alternatives: 'Clear Vegetable Soup' },
  { name: 'Brown Rice Sona Masoori', calories: 150, carbs: 32, protein: 3.5, fat: 1, sugar: 0, fiber: 2.8, gi: 50, suitable: true, qty: '1 Cup (Cooked)', category: 'South Indian', alternatives: 'Millets, Cauliflower Rice' },
  { name: 'White Rice Sona Masoori', calories: 170, carbs: 38, protein: 3, fat: 0.4, sugar: 0, fiber: 0.5, gi: 72, suitable: false, qty: '0.5 Cup (Cooked)', alternatives: 'Brown Rice, Foxtail Millet' },
  { name: 'Hyderabadi Chicken Biryani', calories: 490, carbs: 62, protein: 22, fat: 16, sugar: 1.5, fiber: 2, gi: 68, suitable: false, qty: '0.5 Bowl', alternatives: 'Brown Rice Chicken Pulao' },
  
  // North Indian
  { name: 'Wheat Chapati / Roti', calories: 85, carbs: 17, protein: 3, fat: 0.5, sugar: 0.1, fiber: 2.5, gi: 62, suitable: true, qty: '1-2 Pcs', category: 'North Indian', alternatives: 'Multigrain Roti, Missi Roti' },
  { name: 'Missi Roti (Gram Flour)', calories: 110, carbs: 16, protein: 5.5, fat: 2.2, sugar: 0.2, fiber: 3.5, gi: 45, suitable: true, qty: '1-2 Pcs', category: 'North Indian', alternatives: 'Multigrain Roti' },
  { name: 'Tandoori Naan (Maida)', calories: 260, carbs: 48, protein: 7, fat: 5, sugar: 2, fiber: 1.5, gi: 82, suitable: false, qty: 'Avoid', alternatives: 'Tandoori Wheat Roti' },
  { name: 'Yellow Moong Dal (Tadka)', calories: 120, carbs: 16, protein: 7, fat: 3, sugar: 0, fiber: 4, gi: 42, suitable: true, qty: '1 Bowl', category: 'North Indian', alternatives: 'Black Chana Soup' },
  { name: 'Paneer Butter Masala', calories: 280, carbs: 9, protein: 12, fat: 22, sugar: 4, fiber: 1.5, gi: 50, suitable: false, qty: '0.5 Bowl', alternatives: 'Paneer Bhurji with Olive Oil' },
  { name: 'Paneer Bhurji', calories: 160, carbs: 4, protein: 14, fat: 10, sugar: 1, fiber: 1, gi: 30, suitable: true, qty: '1 Bowl', category: 'North Indian', alternatives: 'Tofu Bhurji' },
  { name: 'Mixed Vegetable Curry', calories: 95, carbs: 11, protein: 2.5, fat: 4.5, sugar: 3, fiber: 3.5, gi: 45, suitable: true, qty: '1 Bowl', category: 'North Indian', alternatives: 'Steamed Broccoli, Cauliflower Stirfry' },
  
  // Dairy & Millets
  { name: 'Curd (Low Fat)', calories: 60, carbs: 5, protein: 5, fat: 1.5, sugar: 4.5, fiber: 0, gi: 28, suitable: true, qty: '1 Cup', category: 'Dairy', alternatives: 'Greek Yogurt' },
  { name: 'Cow Milk (Tone)', calories: 90, carbs: 9, protein: 6, fat: 3, sugar: 8, fiber: 0, gi: 31, suitable: true, qty: '1 Glass (200ml)', category: 'Dairy', alternatives: 'Almond Milk (Unsweetened)' },
  { name: 'Ragi Malt (Sugar-free)', calories: 80, carbs: 16, protein: 2, fat: 0.8, sugar: 0, fiber: 2.8, gi: 55, suitable: true, qty: '1 Glass', category: 'Millets', alternatives: 'Jowar Malt' },
  { name: 'Foxtail Millet Upma', calories: 140, carbs: 24, protein: 4.5, fat: 3.2, sugar: 0.2, fiber: 4.2, gi: 52, suitable: true, qty: '1 Bowl', category: 'Millets', alternatives: 'Oats Upma' },
  
  // Meats, Fish, Eggs
  { name: 'Boiled Egg White', calories: 17, carbs: 0.2, protein: 4, fat: 0.1, sugar: 0, fiber: 0, gi: 0, suitable: true, qty: '2-3 Eggs', category: 'Meats & Eggs', alternatives: 'Whole Boiled Egg (limit 1)' },
  { name: 'Grilled Fish (Tikka)', calories: 180, carbs: 2, protein: 24, fat: 8, sugar: 0, fiber: 0, gi: 0, suitable: true, qty: '1 Plate (150g)', category: 'Meats & Eggs', alternatives: 'Baked Chicken Breast' },
  { name: 'Chicken Breast Curry (Less Oil)', calories: 190, carbs: 4, protein: 26, fat: 7, sugar: 0.5, fiber: 1, gi: 5, suitable: true, qty: '1 Bowl', category: 'Meats & Eggs', alternatives: 'Grilled Chicken Salad' },
  
  // Fruits & Vegetables
  { name: 'Mango (Ripe)', calories: 120, carbs: 28, protein: 1.5, fat: 0.5, sugar: 24, fiber: 2.5, gi: 60, suitable: false, qty: 'Avoid or max 2 slices', alternatives: 'Guava, Green Apple, Papaya' },
  { name: 'Apple (Red)', calories: 80, carbs: 19, protein: 0.5, fat: 0.3, sugar: 14, fiber: 4, gi: 39, suitable: true, qty: '1 Medium', category: 'Fruits', alternatives: 'Guava, Pear' },
  { name: 'Guava (Jamakaya)', calories: 50, carbs: 11, protein: 2, fat: 0.7, sugar: 7, fiber: 5.5, gi: 32, suitable: true, qty: '1 Medium', category: 'Fruits', alternatives: 'Amla, Pomegranate' },
  { name: 'Bitter Gourd (Karela) Fry', calories: 90, carbs: 8, protein: 2, fat: 5, sugar: 0.5, fiber: 3, gi: 24, suitable: true, qty: '1 Bowl', category: 'Vegetables', alternatives: 'Sautéed Ivy Gourd (Dondakaya)' },
  { name: 'Ladies Finger (Okra) Masala', calories: 105, carbs: 10, protein: 2.2, fat: 6, sugar: 1, fiber: 3.2, gi: 28, suitable: true, qty: '1 Bowl', category: 'Vegetables', alternatives: 'Steamed Beans' }
];

// --- AI Chatbot Knowledge base / Local Engine ---
const CHATBOT_RESPONSES = {
  en: {
    greeting: "Hello! I am NutriCare AI, your diabetes nutrition assistant. How can I help you manage your diet, blood sugar, or health goals today?",
    mango: "Mango has a high Glycemic Index (around 60) and is rich in natural sugars. If you have diabetes, it is recommended to limit mango consumption to 1-2 small slices occasionally, ideally paired with a fiber or protein source (like almonds) to prevent sudden blood sugar spikes. Avoid mango juice.",
    dosa: "Traditional white rice dosa has a high Glycemic Index (75+) and can quickly raise blood sugar. Alternatives: Try Moong Dal Dosa (Pesarattu), Ragi Dosa, or Oats Dosa. They contain more fiber and protein, which helps stabilize glucose levels.",
    sugar_250: "A blood sugar reading of 250 mg/dL is high (Hyperglycemia). If you feel dizzy, thirsty, or nauseous: 1. Drink plenty of water to help flush out glucose via urine. 2. Avoid all carbs and sugars immediately. 3. Engage in a light walk if you feel well. 4. Take your prescribed medication/insulin if due. 5. Monitor your levels. If you feel extremely unwell or if levels don't drop, contact your doctor immediately.",
    breakfast: "A healthy diabetic breakfast should be high in fiber and protein, and low in simple carbs. Good options: 1. Moong Dal Pesarattu with mint chutney. 2. Oats Upma loaded with vegetables. 3. Vegetable Omelet with 1 slice of multigrain toast. 4. Ragi Idli (2 pieces) with Sambar.",
    coconut_water: "Yes, diabetics can drink coconut water, but in moderation (max 1 glass or 150ml per day). It contains natural potassium and electrolytes, but it also has natural sugars. Avoid packaged coconut water with added preservatives or sugars.",
    default: "Maintaining consistent physical activity, staying hydrated, and controlling carbohydrate portions are key to managing diabetes. Try to track your blood sugar before and after meals and limit foods with a Glycemic Index above 55."
  },
  te: {
    greeting: "నమస్కారం! నేను న్యూట్రికేర్ AI, మీ మధుమేహం పోషకాహార సహాయకుడిని. ఈ రోజు మీ ఆహారం, రక్తంలో చక్కెర లేదా ఆరోగ్య లక్ష్యాలను నిర్వహించడానికి నేను మీకు ఎలా సహాయపడగలను?",
    mango: "మామిడి పండులో గ్లైసెమిక్ ఇండెక్స్ (సుమారు 60) ఎక్కువగా ఉంటుంది మరియు సహజ చక్కెరలు సమృద్ధిగా ఉంటాయి. మీకు షుగర్ ఉంటే, మామిడి పండ్లను అప్పుడప్పుడు 1-2 చిన్న ముక్కలకు పరిమితం చేయడం మంచిది. రక్తంలో చక్కెర వేగంగా పెరగకుండా ఉండటానికి దీన్ని బాదంపప్పు వంటి ఫైబర్ లేదా ప్రోటీన్‌తో కలిపి తీసుకోండి. మామిడి రసం (జ్యూస్) పూర్తిగా నివారించండి.",
    dosa: "సాధారణ బియ్యం దోసెలో గ్లైసెమిక్ ఇండెక్స్ (75+) ఎక్కువగా ఉంటుంది, ఇది రక్తంలో చక్కెరను వేగంగా పెంచుతుంది. ప్రత్యామ్నాయాలు: పెసరట్టు (పెసర దోసె), రాగి దోసె లేదా ఓట్స్ దోసె ప్రయత్నించండి. వీటిలో ఫైబర్ మరియు ప్రోటీన్ ఎక్కువగా ఉండటం వల్ల షుగర్ కంట్రోల్ లో ఉంటుంది.",
    sugar_250: "రక్తంలో చక్కెర 250 mg/dL కి చేరితే అది చాలా ఎక్కువ (హైపర్గ్లైసీమియా). మీరు ఇలా చేయాలి: 1. మూత్రం ద్వారా అదనపు గ్లూకోజ్ బయటకు వెళ్ళడానికి నీరు ఎక్కువగా తాగండి. 2. కార్బోహైడ్రేట్లు, స్వీట్లు వెంటనే ఆపేయండి. 3. వీలైతే కొద్దిసేపు తేలికగా నడవండి. 4. మీ డాక్టర్ సూచించిన షుగర్ మందులు లేదా ఇన్సులిన్ సమయానికి వేసుకోండి. 5. షుగర్ మళ్ళీ చెక్ చేయండి. తగ్గకపోతే లేదా కళ్ళు తిరగడం వంటివి ఉంటే వెంటనే డాక్టర్‌ను సంప్రదించండి.",
    breakfast: "మధుమేహం ఉన్నవారికి ఆరోగ్యకరమైన అల్పాహారం (టిఫిన్) లో ఫైబర్ మరియు ప్రోటీన్లు ఎక్కువగా ఉండాలి. మంచి ఎంపికలు: 1. పుదీనా చట్నీతో పెసరట్టు. 2. కూరగాయలతో చేసిన ఓట్స్ ఉప్మా. 3. వెజిటబుల్ ఆమ్లెట్. 4. సాంబార్‌తో రాగి ఇడ్లీ (2 ముక్కలు).",
    coconut_water: "అవును, మధుమేహం ఉన్నవారు కొబ్బరి నీటిని తాగవచ్చు, కానీ పరిమితంగా మాత్రమే (రోజుకు గరిష్టంగా 1 గ్లాసు లేదా 150ml). ఇందులో పొటాషియం మరియు ఎలక్ట్రోలైట్లు ఉంటాయి, కానీ సహజ చక్కెర కూడా ఉంటుంది. డబ్బా కొబ్బరి నీళ్లను తాగకండి.",
    default: "రోజూ వ్యాయామం చేయడం, తగినంత నీరు తాగడం మరియు కార్బోహైడ్రేట్లను నియంత్రించడం వల్ల మధుమేహాన్ని సులభంగా అదుపులో ఉంచుకోవచ్చు. మీ రక్తంలో చక్కెర స్థాయిలను క్రమం తప్పకుండా పర్యవేక్షించండి."
  },
  hi: {
    greeting: "नमस्ते! मैं न्यूट्रीकेयर एआई (NutriCare AI) हूँ, आपका मधुमेह पोषण सहायक। आज मैं आपके आहार, रक्त शर्करा (ब्लड शुगर) या स्वास्थ्य लक्ष्यों को प्रबंधित करने में आपकी क्या सहायता कर सकता हूँ?",
    mango: "आम का ग्लाइसेमिक इंडेक्स (लगभग 60) काफी अधिक होता है और इसमें प्राकृतिक मिठास भी ज्यादा होती है। यदि आपको मधुमेह है, तो कभी-कभार केवल 1-2 छोटी फांकें खाना ही सुरक्षित है। ब्लड शुगर के अचानक बढ़ने से बचने के लिए इसे फाइबर या प्रोटीन (जैसे बादाम) के साथ खाएं। मैंगो शेक या जूस से बचें।",
    dosa: "साधारण चावल के डोसे का ग्लाइसेमिक इंडेक्स (75+) अधिक होता है, जिससे ब्लड शुगर तेजी से बढ़ सकता है। विकल्प: मूँग दाल डोसा (पेसरट्टू), रागी डोसा या ओट्स डोसा खाएं। इनमें फाइबर और प्रोटीन अधिक होता है, जो ग्लूकोज को स्थिर रखता है।",
    sugar_250: "रक्त शर्करा का 250 mg/dL होना उच्च स्तर (हाइपरग्लाइसीमिया) है। ऐसे में: 1. पर्याप्त मात्रा में पानी पिएं ताकि मूत्र के माध्यम से ग्लूकोज बाहर निकल सके। 2. मीठा या कार्बोहाइड्रेट तुरंत बंद कर दें। 3. यदि संभव हो तो थोड़ी देर टहलें। 4. डॉक्टर द्वारा दी गई इंसुलिन या दवाएं समय पर लें। 5. शुगर स्तर की दोबारा जांच करें। यदि सुधार न हो या चक्कर आएं, तो तुरंत डॉक्टर से संपर्क करें।",
    breakfast: "मधुमेह रोगियों के लिए एक स्वस्थ नाश्ते में प्रचुर मात्रा में फाइबर और प्रोटीन होना चाहिए। अच्छे विकल्प: 1. पुदीने की चटनी के साथ मूँग दाल पेसरट्टू। 2. सब्जियों से भरपूर ओट्स उपमा। 3. वेजिटेबल ऑमलेट। 4. सांभर के साथ रागी इडली (2 पीस)।",
    coconut_water: "हां, मधुमेह रोगी नारियल पानी पी सकते हैं, लेकिन सीमित मात्रा में (दिन में अधिकतम 1 गिलास या 150ml)। इसमें प्राकृतिक पोटेशियम और इलेक्ट्रोलाइट्स होते हैं, लेकिन प्राकृतिक शर्करा भी होती है। डिब्बाबंद या मीठे नारियल पानी से दूर रहें।",
    default: "नियमित व्यायाम, भरपूर पानी पीना और कार्बोहाइड्रेट (रोटी, चावल) की मात्रा को नियंत्रित करना शुगर कंट्रोल करने के प्रमुख तरीके हैं। समय-समय पर अपने शुगर स्तर की जांच करते रहें।"
  }
};

// --- AUTHENTICATION ROUTES ---

// Signup
router.post('/auth/signup', async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const existingUser = await db.findOne('users', { email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists with this email.' });
  }

  const newUser = await db.insert('users', {
    email,
    password, // in real production use bcrypt
    name: name || email.split('@')[0],
    phone: phone || '',
    role: 'user',
    profileCompleted: false
  });

  res.json({ success: true, message: 'User registered successfully!', user: newUser });
});

// Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findOne('users', { email });
  if (!user || user.password !== password) {
    return res.status(400).json({ success: false, message: 'Invalid email or password.' });
  }
  res.json({ success: true, message: 'Logged in successfully!', user });
});

// Google OAuth 2.0 Login & Profile Verification
router.post('/auth/google', async (req, res) => {
  try {
    const { email, name, googleId, uid, photo, credential } = req.body;
    
    let userEmail = email;
    let userName = name;
    let userUid = uid || googleId;
    let userPhoto = photo;

    // If an ID Token (credential) is provided, verify it against GOOGLE_CLIENT_ID
    if (credential && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (payload) {
          userEmail = payload.email || userEmail;
          userName = payload.name || userName;
          userUid = payload.sub || userUid;
          userPhoto = payload.picture || userPhoto;
        }
      } catch (tokenErr) {
        console.warn("[Google Auth] ID Token verification fallback:", tokenErr.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google authentication failed: Valid email address is required.' });
    }

    // Check if user exists by email or googleId/uid
    let user = await db.findOne('users', { email: userEmail });
    if (!user && userUid) {
      user = await db.findOne('users', { googleId: userUid });
    }

    if (!user) {
      // First login! Save the user's name, email, profile photo, and UID in database!
      user = await db.insert('users', {
        email: userEmail,
        name: userName || userEmail.split('@')[0],
        googleId: userUid,
        uid: userUid,
        photo: userPhoto || '',
        role: 'user',
        profileCompleted: false,
        createdAt: new Date().toISOString()
      });
      console.log(`[Google Auth] Created new user profile for: ${userEmail} (UID: ${userUid})`);
    } else {
      // Existing user login! Update their photo, uid, and name if missing or changed
      const updates = {};
      if (userPhoto && user.photo !== userPhoto) updates.photo = userPhoto;
      if (userUid && !user.uid) updates.uid = userUid;
      if (userUid && !user.googleId) updates.googleId = userUid;
      if (userName && !user.name) updates.name = userName;

      if (Object.keys(updates).length > 0) {
        await db.update('users', { _id: user._id }, updates);
        user = { ...user, ...updates };
        console.log(`[Google Auth] Updated existing user profile for: ${userEmail}`);
      }
    }

    res.json({ success: true, message: 'Google authentication successful!', user });
  } catch (err) {
    console.error("[Google Auth] Error during authentication:", err);
    res.status(500).json({ success: false, message: 'Server error during Google authentication.' });
  }
});

// OTP Verification Mock
router.post('/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456') { // Mock OTP check
    let user = await db.findOne('users', { phone });
    if (!user) {
      user = await db.insert('users', {
        phone,
        email: `${phone}@nutricare.local`,
        name: `User ${phone.slice(-4)}`,
        role: 'user',
        profileCompleted: false
      });
    }
    return res.json({ success: true, message: 'OTP verified successfully!', user });
  }
  res.status(400).json({ success: false, message: 'Invalid OTP. Use 123456 for testing.' });
});

// Profile Management
router.get('/auth/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await db.findOne('users', { _id: userId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }
  res.json({ success: true, profile: user });
});

router.put('/auth/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  
  const result = await db.update('users', { _id: userId }, {
    ...updates,
    profileCompleted: true
  });
  
  if (result.modifiedCount === 0) {
    return res.status(400).json({ success: false, message: 'Failed to update profile.' });
  }
  
  const updatedUser = await db.findOne('users', { _id: userId });
  res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
});

// --- BLOOD SUGAR TRACKER ---

// Log Blood Sugar
router.post('/tracker/glucose', async (req, res) => {
  const { userId, reading, mealPeriod, note } = req.body;
  if (!userId || !reading || !mealPeriod) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }

  const glucoseValue = parseFloat(reading);
  let status = 'green'; // Green: Normal, Yellow: Caution, Red: Critical/Alert
  let insight = '';

  // Determine status based on values (general guidance)
  if (mealPeriod === 'Fasting' || mealPeriod === 'Before Breakfast' || mealPeriod === 'Before Lunch' || mealPeriod === 'Before Dinner') {
    if (glucoseValue < 70) {
      status = 'red';
      insight = 'Warning: Hypoglycemia. Drink fruit juice or eat candy immediately.';
    } else if (glucoseValue >= 70 && glucoseValue <= 130) {
      status = 'green';
      insight = 'Excellent! Your sugar level is within the healthy fasting range.';
    } else if (glucoseValue > 130 && glucoseValue <= 180) {
      status = 'yellow';
      insight = 'Caution: Fasting reading is slightly high. Limit high-carb dinner choices.';
    } else {
      status = 'red';
      insight = 'Critical Alert: High fasting glucose. Avoid simple carbs and consult your doctor.';
    }
  } else { // After meals or bedtime
    if (glucoseValue < 70) {
      status = 'red';
      insight = 'Warning: Hypoglycemia. Eat a snack immediately.';
    } else if (glucoseValue >= 70 && glucoseValue <= 180) {
      status = 'green';
      insight = 'Good work! Post-meal glucose is stable and within target range.';
    } else if (glucoseValue > 180 && glucoseValue <= 240) {
      status = 'yellow';
      insight = 'Warning: Glucose is elevated. Try walking for 15 minutes and drinking water.';
    } else {
      status = 'red';
      insight = 'Critical Alert: Very high post-meal reading. Restrict sugar and monitor symptoms.';
    }
  }

  const entry = await db.insert('bloodsugar', {
    userId,
    reading: glucoseValue,
    mealPeriod,
    status,
    insight,
    note: note || '',
    date: new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  });

  // Achievements: Check for streak / daily logs
  // Simple streak updating
  const today = new Date().toLocaleDateString('en-CA');
  const userStreaks = await db.findOne('streaks', { userId });
  let currentStreak = 1;
  if (userStreaks) {
    const lastLogDate = userStreaks.lastLogDate;
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    if (lastLogDate === yesterday) {
      currentStreak = userStreaks.count + 1;
    } else if (lastLogDate === today) {
      currentStreak = userStreaks.count;
    }
    await db.update('streaks', { userId }, { count: currentStreak, lastLogDate: today });
  } else {
    await db.insert('streaks', { userId, count: 1, lastLogDate: today });
  }

  // Award badge if streak matches milestone
  const badges = [];
  if (currentStreak === 3) badges.push('Sugar Tracker Pro (3 Days)');
  if (currentStreak === 7) badges.push('Weekly Discipline Master (7 Days)');

  for (let badge of badges) {
    const hasBadge = await db.findOne('achievements', { userId, badge });
    if (!hasBadge) {
      await db.insert('achievements', { userId, badge, awardedAt: new Date().toISOString() });
    }
  }

  res.json({ success: true, message: 'Blood glucose logged successfully!', entry, currentStreak });
});

// Retrieve Blood Sugar Logs
router.get('/tracker/glucose/:userId', async (req, res) => {
  const { userId } = req.params;
  const logs = await db.find('bloodsugar', { userId });
  res.json({ success: true, logs });
});

// --- WATER INTAKE TRACKER ---

router.post('/tracker/water', async (req, res) => {
  const { userId, amountMl } = req.body;
  const today = new Date().toLocaleDateString('en-CA');
  
  let record = await db.findOne('water', { userId, date: today });
  if (record) {
    const newAmount = record.amount + parseFloat(amountMl);
    await db.update('water', { _id: record._id }, { amount: newAmount });
    record.amount = newAmount;
  } else {
    record = await db.insert('water', {
      userId,
      amount: parseFloat(amountMl),
      goal: 2500, // 2.5L Default
      date: today
    });
  }

  res.json({ success: true, message: 'Water intake updated!', record });
});

router.get('/tracker/water/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toLocaleDateString('en-CA');
  let record = await db.findOne('water', { userId, date: today });
  if (!record) {
    record = { userId, amount: 0, goal: 2500, date: today };
  }
  res.json({ success: true, record });
});

// --- EXERCISE TRACKER ---

router.post('/tracker/exercise', async (req, res) => {
  const { userId, type, durationMinutes, steps } = req.body;
  if (!userId || !type || !durationMinutes) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }

  // Estimate calories burned
  let calPerMin = 4;
  if (type === 'Running') calPerMin = 10;
  if (type === 'Cycling') calPerMin = 7;
  if (type === 'Gym') calPerMin = 6;
  if (type === 'Yoga') calPerMin = 3;
  if (type === 'Walking') calPerMin = 4.5;
  if (type === 'Meditation') calPerMin = 1;

  const caloriesBurned = Math.round(parseFloat(durationMinutes) * calPerMin);
  const heartScore = Math.min(100, Math.round(parseFloat(durationMinutes) * 1.5 + (steps ? steps / 300 : 0)));

  const entry = await db.insert('exercise', {
    userId,
    type,
    duration: parseFloat(durationMinutes),
    steps: steps ? parseInt(steps) : 0,
    calories: caloriesBurned,
    heartScore,
    date: new Date().toLocaleDateString('en-CA')
  });

  res.json({ success: true, message: 'Exercise session logged!', entry });
});

router.get('/tracker/exercise/:userId', async (req, res) => {
  const { userId } = req.params;
  const logs = await db.find('exercise', { userId });
  res.json({ success: true, logs });
});

// --- MEDICATION MANAGER ---

router.post('/medications', async (req, res) => {
  const { userId, name, dosage, frequency, doctor, startDate, endDate, reminders } = req.body;
  const med = await db.insert('medications', {
    userId,
    name,
    dosage,
    frequency,
    doctor: doctor || '',
    startDate: startDate || '',
    endDate: endDate || '',
    reminders: reminders || [],
    adherence: {} // tracks dates that med was taken, e.g., { '2026-07-05': true }
  });
  res.json({ success: true, message: 'Medication added successfully!', medication: med });
});

router.get('/medications/:userId', async (req, res) => {
  const { userId } = req.params;
  const meds = await db.find('medications', { userId });
  res.json({ success: true, medications: meds });
});

router.put('/medications/toggle-adherence', async (req, res) => {
  const { medId, date, status } = req.body; // status is true/false
  const med = await db.findOne('medications', { _id: medId });
  if (!med) {
    return res.status(404).json({ success: false, message: 'Medication not found.' });
  }

  const updatedAdherence = { ...med.adherence };
  if (status) {
    updatedAdherence[date] = true;
  } else {
    delete updatedAdherence[date];
  }

  await db.update('medications', { _id: medId }, { adherence: updatedAdherence });
  res.json({ success: true, message: 'Adherence updated!', adherence: updatedAdherence });
});

router.delete('/medications/:medId', async (req, res) => {
  const { medId } = req.params;
  await db.delete('medications', { _id: medId });
  res.json({ success: true, message: 'Medication deleted.' });
});

// --- SEARCH FOOD DATABASE ---

router.get('/food-database', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json({ success: true, foods: INDIAN_FOODS_DB });
  }
  const filtered = INDIAN_FOODS_DB.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) || 
    f.category?.toLowerCase().includes(query.toLowerCase())
  );
  res.json({ success: true, foods: filtered });
});

// --- RECIPES DATABASE FOR MULTI-OPTION MEAL PLANS ---
const RECIPES = [
  // BREAKFAST
  {
    category: 'Breakfast',
    cuisines: ['South Indian'],
    veg: true,
    vegan: true,
    name: 'Moong Dal Pesarattu with Pudina Chutney',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60',
    calories: 220, protein: 12, carbs: 28, fiber: 6,
    description: 'High protein green gram crepes served with refreshing sugar-free mint chutney.',
    ingredients: 'Green gram (mung dal), green chilies, ginger, mint leaves, salt.',
    instructions: 'Grind soaked green gram with ginger and green chilies. Pour batter on tawa to make thin crepes. Serve hot with mint dip.',
    benefits: 'Rich in plant-based proteins and fiber, which helps avoid sudden sugar spikes.'
  },
  {
    category: 'Breakfast',
    cuisines: ['South Indian'],
    veg: true,
    vegan: false,
    name: 'Oats & Vegetable Rava Idli',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=60',
    calories: 180, protein: 7, carbs: 24, fiber: 5,
    description: 'Steamed oats cakes filled with grated carrots, peas, and low GI spices.',
    ingredients: 'Powdered oats, semolina, yogurt, grated carrot, mustard seeds, curry leaves.',
    instructions: 'Roast oats powder and semolina. Mix with yogurt, grated carrots, and water to form batter. Steam for 10-12 minutes.',
    benefits: 'Oats are rich in beta-glucan fiber, lowering cholesterol and stabilizing glucose.'
  },
  {
    category: 'Breakfast',
    cuisines: ['South Indian'],
    veg: true,
    vegan: true,
    name: 'Finger Millet (Ragi) Dosa',
    image: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=400&auto=format&fit=crop&q=60',
    calories: 195, protein: 5, carbs: 26, fiber: 7,
    description: 'Calcium-rich fermented ragi crepes cooked with minimum oil.',
    ingredients: 'Ragi flour, urad dal batter, water, curry leaves, salt.',
    instructions: 'Mix ragi flour with urad dal batter and water. Spread on hot pan, cook until crispy using minimal spray oil.',
    benefits: 'High dietary fiber slows down digestion, ensuring steady glucose release.'
  },
  {
    category: 'Breakfast',
    cuisines: ['South Indian', 'North Indian'],
    veg: false,
    vegan: false,
    name: 'Masala Egg White Omelet',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&auto=format&fit=crop&q=60',
    calories: 120, protein: 16, carbs: 3, fiber: 1.5,
    description: 'Fluffy egg white omelet loaded with green chilies, coriander, onions, and tomato.',
    ingredients: '3 egg whites, chopped onions, tomato, green chillies, turmeric, pepper.',
    instructions: 'Whisk egg whites with chopped veggies and spices. Pour on tawa, cook both sides until golden.',
    benefits: 'High protein content with nearly zero glycemic impact, perfect for morning glucose stability.'
  },
  {
    category: 'Breakfast',
    cuisines: ['North Indian'],
    veg: true,
    vegan: true,
    name: 'Missi Roti with Spinach Raita',
    image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&auto=format&fit=crop&q=60',
    calories: 210, protein: 10, carbs: 30, fiber: 6,
    description: 'Gram-flour based Indian bread seasoned with spices, paired with curd.',
    ingredients: 'Gram flour (besan), whole wheat flour, spinach leaves, low-fat curd.',
    instructions: 'Knead besan and wheat flour into dough. Roll into flatbread and cook on tawa. Serve with whisked spinach curd.',
    benefits: 'Gram flour has a low Glycemic Index and supplies excellent vegetable protein.'
  },
  {
    category: 'Breakfast',
    cuisines: ['North Indian'],
    veg: true,
    vegan: false,
    name: 'Paneer Stuffed Multigrain Paratha',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60',
    calories: 240, protein: 12, carbs: 28, fiber: 5.5,
    description: 'Flatbread stuffed with spiced low-fat paneer, roasted lightly.',
    ingredients: 'Multigrain flour, grated low-fat paneer, green chilies, coriander leaves.',
    instructions: 'Stuff multigrain dough balls with spiced grated cottage cheese. Roll out carefully and pan-fry with olive oil drop.',
    benefits: 'Paneer supplies slow-release casein protein which controls early morning glucose.'
  },
  {
    category: 'Breakfast',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Avocado Toast on Sourdough',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400&auto=format&fit=crop&q=60',
    calories: 230, protein: 7, carbs: 26, fiber: 8,
    description: 'Mashed seasoned avocado on high-quality toasted sourdough bread.',
    ingredients: 'Ripe avocado, sourdough slice, lemon juice, red pepper flakes, black pepper.',
    instructions: 'Toast the sourdough. Mash avocado with lemon juice, salt, and pepper. Spread evenly on toast.',
    benefits: 'Monounsaturated fats in avocado improve insulin sensitivity and cardio health.'
  },
  {
    category: 'Breakfast',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Berries & Almond Chia Pudding',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    calories: 140, protein: 4.5, carbs: 16, fiber: 9,
    description: 'Cold soaked chia seed porridge with fresh blueberries and sliced almonds.',
    ingredients: 'Chia seeds, unsweetened almond milk, blueberries, stevia, almond slices.',
    instructions: 'Stir chia seeds in almond milk with stevia. Refrigerate overnight. Top with blueberries and almonds.',
    benefits: 'Chia seeds are loaded with soluble fiber that acts as a natural glucose buffer.'
  },
  
  // MORNING SNACK
  {
    category: 'MorningSnack',
    cuisines: ['South Indian', 'North Indian'],
    veg: true,
    vegan: true,
    name: 'Roasted Bengal Gram (Chana)',
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d4f?w=400&auto=format&fit=crop&q=60',
    calories: 90, protein: 6, carbs: 12, fiber: 4,
    description: 'Crispy dry-roasted black chickpeas seasoned with turmeric.',
    ingredients: 'Black chickpeas (chana), turmeric, black salt.',
    instructions: 'Dry roast chickpeas in a pan with turmeric and a pinch of black salt. Eat dry.',
    benefits: 'Extremely low Glycemic Index snack that keeps energy stable until lunch.'
  },
  {
    category: 'MorningSnack',
    cuisines: ['South Indian', 'North Indian', 'Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Almonds & Walnuts Mix',
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d4f?w=400&auto=format&fit=crop&q=60',
    calories: 110, protein: 4, carbs: 3.5, fiber: 3,
    description: 'A portion of raw, unsalted almonds and walnut halves.',
    ingredients: '7 raw almonds, 3 walnut halves.',
    instructions: 'Count and eat raw. (Optional: Soak almonds overnight and peel skins).',
    benefits: 'Healthy fats retard stomach emptying, flattening glycemic curves.'
  },
  {
    category: 'MorningSnack',
    cuisines: ['South Indian', 'North Indian', 'Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Sprouted Green Mung Cup',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60',
    calories: 80, protein: 5.5, carbs: 11, fiber: 4.5,
    description: 'Raw sprouted mung beans tossed with lemon juice and chaat masala.',
    ingredients: 'Sprouted moong beans, lemon juice, green coriander, chaat masala.',
    instructions: 'Wash sprouts thoroughly. Toss with freshly squeezed lemon juice, salt, and spice.',
    benefits: 'Live enzymes aid digestion, low glycemic profile prevents mid-morning spikes.'
  },

  // LUNCH
  {
    category: 'Lunch',
    cuisines: ['South Indian'],
    veg: true,
    vegan: true,
    name: 'Foxtail Millet Rice with Sambar & Karela',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&auto=format&fit=crop&q=60',
    calories: 340, protein: 12, carbs: 52, fiber: 9.5,
    description: 'Steamed foxtail millets served with fiber-rich vegetable lentil sambar and bitter gourd.',
    ingredients: 'Foxtail millets, pigeon peas (toor dal), bitter gourd (karela), drumsticks, carrots.',
    instructions: 'Steam millets. Prepare sambar with dal and vegetables. Sauté karela with spices and minimum oil. Serve hot.',
    benefits: 'Millets digest much slower than polished rice, offering excellent glycemic control.'
  },
  {
    category: 'Lunch',
    cuisines: ['South Indian'],
    veg: true,
    vegan: false,
    name: 'Quinoa Curd Rice with Cucumber & Pomegranate',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    calories: 290, protein: 10.5, carbs: 38, fiber: 6.5,
    description: 'A cooling diabetic alternative to traditional curd rice using high-protein quinoa.',
    ingredients: 'Quinoa, low-fat Greek yogurt, grated cucumber, mustard seeds, curry leaves.',
    instructions: 'Cook quinoa. Cool and mix with curd, water, salt, and grated cucumber. Temper with mustard seeds.',
    benefits: 'Curd contains probiotics for gut health, and quinoa supplies complete plant proteins.'
  },
  {
    category: 'Lunch',
    cuisines: ['South Indian'],
    veg: false,
    vegan: false,
    name: 'Chettinad Fish Curry with Brown Rice',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60',
    calories: 390, protein: 26, carbs: 42, fiber: 5,
    description: 'Spicy South-Indian chettinad fish curry paired with steamed brown rice.',
    ingredients: 'Fish fillets, brown rice, shallots, tomato, shredded coconut, Chettinad spices.',
    instructions: 'Prepare curry base using onions, tomatoes, and home-ground spices. Simmer fish until cooked. Serve with brown rice.',
    benefits: 'Omega-3 fatty acids in fish protect the heart; brown rice provides steady carbs.'
  },
  {
    category: 'Lunch',
    cuisines: ['North Indian'],
    veg: true,
    vegan: false,
    name: 'Multigrain Roti with Dal Tadka & Palak Paneer',
    image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60',
    calories: 350, protein: 15, carbs: 46, fiber: 8.5,
    description: 'Two multigrain rotis with yellow dal fry and cottage cheese cooked in creamy spinach.',
    ingredients: 'Wheat, oats, ragi flour (for roti), yellow lentils, paneer, spinach purée.',
    instructions: 'Knead multigrain flour and make rotis. Boil lentils and temper with cumin. Sauté paneer in cooked spinach sauce.',
    benefits: 'Palak paneer supplies high iron and calcium; yellow dal is a robust vegetarian protein.'
  },
  {
    category: 'Lunch',
    cuisines: ['North Indian'],
    veg: false,
    vegan: false,
    name: 'Tandoori Chicken Tikka with Garden Salad',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=60',
    calories: 310, protein: 32, carbs: 8, fiber: 3,
    description: 'Yogurt-marinated baked chicken skewers served with a fresh salad.',
    ingredients: 'Chicken breast, yogurt, ginger-garlic paste, tandoori masala, cucumber, lettuce.',
    instructions: 'Marinate chicken in spiced yogurt. Skewer and bake or grill. Serve with cucumber, radish, and onion salad.',
    benefits: 'Excellent protein-dense lunch with very low carbohydrates, keeping insulin needs low.'
  },
  {
    category: 'Lunch',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Quinoa Greek Salad with Olive Oil Dressing',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=60',
    calories: 270, protein: 9, carbs: 32, fiber: 7.2,
    description: 'Cooked quinoa tossed with cherry tomatoes, cucumbers, kalamata olives, and feta cheese.',
    ingredients: 'Quinoa, cucumber, tomatoes, olives, feta cheese, extra virgin olive oil, oregano.',
    instructions: 'Toss cooked quinoa with chopped vegetables, olives, and crumbled feta. Drizzle olive oil and sprinkle oregano.',
    benefits: 'Provides heart-healthy fats and low-GI carbohydrates to sustain afternoon energy.'
  },
  {
    category: 'Lunch',
    cuisines: ['Mediterranean', 'Western'],
    veg: false,
    vegan: false,
    name: 'Pan-Seared Salmon with Asparagus & Garlic',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60',
    calories: 360, protein: 29, carbs: 6, fiber: 3.5,
    description: 'Fresh salmon fillet seared in olive oil with garlic-rubbed grilled asparagus.',
    ingredients: 'Salmon fillet, asparagus spears, fresh garlic, olive oil, lemon juice.',
    instructions: 'Pan-sear salmon in a hot skillet with olive oil. Grill asparagus with minced garlic and lemon juice. Plate together.',
    benefits: 'Outstanding source of anti-inflammatory Omega-3 fats, excellent for cardiovascular health.'
  },

  // EVENING SNACK
  {
    category: 'EveningSnack',
    cuisines: ['South Indian', 'North Indian'],
    veg: true,
    vegan: true,
    name: 'Boiled Kala Chana Chaat',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60',
    calories: 95, protein: 5.2, carbs: 13, fiber: 4.8,
    description: 'Boiled black chickpeas tossed with chopped tomatoes, raw mango, and fresh coriander.',
    ingredients: 'Black chickpeas, tomatoes, raw mango, green chilies, coriander, lemon.',
    instructions: 'Boil soaked black chickpeas. Mix with chopped raw veggies, squeeze lemon juice, and toss with black salt.',
    benefits: 'Complex carbs and high fiber keep evening hunger away and stabilize blood sugar.'
  },
  {
    category: 'EveningSnack',
    cuisines: ['South Indian', 'North Indian', 'Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Roasted Phool Makhana (Foxnuts)',
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d4f?w=400&auto=format&fit=crop&q=60',
    calories: 75, protein: 2.5, carbs: 12, fiber: 2.2,
    description: 'Crispy dry-roasted makhana with a pinch of turmeric and black pepper.',
    ingredients: 'Foxnuts (makhana), olive oil drops, turmeric, pepper.',
    instructions: 'Heat drops of olive oil. Roast makhana on low heat until crunchy. Toss with pepper and turmeric.',
    benefits: 'Low calorie, gluten-free snack with a low glycemic load.'
  },
  {
    category: 'EveningSnack',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Cucumber & Hummus Dippers',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60',
    calories: 110, protein: 3.8, carbs: 10, fiber: 3.5,
    description: 'Fresh sliced cucumber sticks served with creamy sesame chickpea dip.',
    ingredients: 'Cucumber, chickpeas (garbanzo), tahini, garlic, lemon juice.',
    instructions: 'Slice cucumber into thick sticks. Serve with 2 tablespoons of freshly blended hummus.',
    benefits: 'Provides low glycemic complex carbs and protein with hydrating minerals.'
  },

  // DINNER
  {
    category: 'Dinner',
    cuisines: ['South Indian'],
    veg: true,
    vegan: false,
    name: 'Sautéed Paneer & Broccoli Stir-Fry',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    calories: 260, protein: 16, carbs: 9, fiber: 4,
    description: 'Pan-seared cottage cheese cubes cooked with garlic, broccoli, and red bell peppers.',
    ingredients: 'Paneer, broccoli florets, bell peppers, soy sauce, ginger, olive oil.',
    instructions: 'Sauté sliced ginger-garlic in oil. Add broccoli and bell peppers. Stir fry on high heat. Add paneer cubes and cook for 3 minutes.',
    benefits: 'Low-carb, high-protein dinner that limits overnight glycogen loading.'
  },
  {
    category: 'Dinner',
    cuisines: ['South Indian'],
    veg: false,
    vegan: false,
    name: 'Grilled Pepper Chicken with Beans Poriyal',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=60',
    calories: 280, protein: 28, carbs: 7, fiber: 3.8,
    description: 'Black pepper crusted chicken breast paired with steamed French beans and mustard tempering.',
    ingredients: 'Chicken breast, black pepper, French beans, mustard seeds, curry leaves, grated coconut.',
    instructions: 'Grill pepper marinated chicken. Sauté chopped French beans with mustard seeds and curry leaves. Serve together.',
    benefits: 'Excellent protein count with zero starches ensures high fat burning and stable fasting glucose.'
  },
  {
    category: 'Dinner',
    cuisines: ['North Indian'],
    veg: true,
    vegan: true,
    name: 'Tofu Bhurji with Cauliflower Roti',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    calories: 220, protein: 14, carbs: 12, fiber: 5,
    description: 'Crumbled spiced tofu sautéed with tomatoes, served with fiber-rich cauliflower flatbread.',
    ingredients: 'Tofu, onions, tomatoes, green chilies, grated cauliflower, wheat flour (minimal).',
    instructions: 'Scramble tofu in a pan with turmeric, cumin, and onions. Mix grated cauliflower into dough, roll, and cook on tawa.',
    benefits: 'Tofu is rich in soy protein and is completely cholesterol-free.'
  },
  {
    category: 'Dinner',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Grilled Lemon Herb Tofu with Stir-Fried Greens',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
    calories: 210, protein: 15, carbs: 10, fiber: 4.5,
    description: 'Organic firm tofu marinated in lemon juice and oregano, grilled with zucchini.',
    ingredients: 'Firm tofu, zucchini, kale, lemon, garlic, olive oil.',
    instructions: 'Marinate tofu slabs in lemon juice, garlic, and herbs. Grill on a grill pan. Sauté kale and zucchini. Plate.',
    benefits: 'Light digestability. Excellent fibers help stabilize overnight liver glucose production.'
  },
  {
    category: 'Dinner',
    cuisines: ['Mediterranean', 'Western'],
    veg: false,
    vegan: false,
    name: 'Lemon Grilled Chicken Breast with Broccoli',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=60',
    calories: 250, protein: 29, carbs: 5, fiber: 3.5,
    description: 'Chicken breast grilled with Mediterranean herbs, served alongside steamed broccoli.',
    ingredients: 'Chicken breast, broccoli florets, olive oil, lemon zest, garlic.',
    instructions: 'Rub chicken with garlic, herbs, and lemon. Grill until fully cooked. Steam broccoli and drizzle with olive oil.',
    benefits: 'Promotes muscle recovery and maintains stable blood sugar through the night.'
  },

  // BEDTIME SNACK
  {
    category: 'BedtimeSnack',
    cuisines: ['South Indian', 'North Indian'],
    veg: true,
    vegan: false,
    name: 'Turmeric Almond Milk (Sugar-free)',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60',
    calories: 60, protein: 2, carbs: 3, fiber: 1,
    description: 'Warm unsweetened almond milk infused with organic turmeric powder and a pinch of black pepper.',
    ingredients: 'Unsweetened almond milk, organic turmeric, black pepper powder.',
    instructions: 'Warm almond milk. Stir in turmeric and black pepper. Drink while warm.',
    benefits: 'Anti-inflammatory properties. Prevents overnight hypoglycemia (liver sugar drops).'
  },
  {
    category: 'BedtimeSnack',
    cuisines: ['South Indian', 'North Indian', 'Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Chamomile Tea & Soaked Walnuts',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60',
    calories: 45, protein: 1.5, carbs: 1, fiber: 1.2,
    description: 'Soothing organic chamomile tea paired with three soaked walnut halves.',
    ingredients: 'Chamomile tea bag, hot water, 3 soaked walnuts.',
    instructions: 'Steep tea in boiling water for 5 minutes. Eat walnuts alongside.',
    benefits: 'Aids in quality sleep and prevents early morning cortisol-induced sugar spikes.'
  },
  {
    category: 'BedtimeSnack',
    cuisines: ['Mediterranean', 'Western'],
    veg: true,
    vegan: true,
    name: 'Warm Unsweetened Soy Milk',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60',
    calories: 70, protein: 6, carbs: 4, fiber: 1.5,
    description: 'A comforting cup of warm unsweetened soy milk.',
    ingredients: 'Organic unsweetened soy milk.',
    instructions: 'Heat the soy milk in a microwave or saucepan and drink warm.',
    benefits: 'High in protein, slowly absorbed to maintain a steady glucose baseline overnight.'
  }
];

const getMealOptions = (category, preference, region) => {
  const isVeg = preference === 'Vegetarian' || preference === 'Vegan';
  const isVegan = preference === 'Vegan';

  // Filter recipes of this category
  let list = RECIPES.filter(r => r.category === category);

  // Filter by cuisine style if matching
  let cuisineList = list.filter(r => r.cuisines.includes(region));
  if (cuisineList.length === 0) {
    cuisineList = list; // Fallback
  }

  // Filter by diet preference
  let dietList = cuisineList.filter(r => {
    if (isVegan) return r.vegan === true;
    if (isVeg) return r.veg === true;
    return true; // Non-veg can eat anything
  });

  // Fallback to general list if not enough recipes matching preference
  if (dietList.length < 3) {
    const remaining = list.filter(r => {
      if (isVegan) return r.vegan === true;
      if (isVeg) return r.veg === true;
      return true;
    });
    // Deduplicate
    const ids = new Set(dietList.map(d => d.name));
    remaining.forEach(r => {
      if (!ids.has(r.name)) {
        dietList.push(r);
        ids.add(r.name);
      }
    });
  }

  // If still less than 3, just add whatever is in list
  if (dietList.length < 3) {
    const ids = new Set(dietList.map(d => d.name));
    list.forEach(r => {
      if (!ids.has(r.name)) {
        dietList.push(r);
        ids.add(r.name);
      }
    });
  }

  // Add options IDs dynamically
  return dietList.slice(0, 3).map((r, idx) => ({
    ...r,
    id: `${category.toLowerCase()}_opt_${idx + 1}_${Date.now()}`
  }));
};

router.post('/meal-planner', async (req, res) => {
  const { userId, diabetesType, foodPreference, activityLevel, region } = req.body;

  const mealPlan = {
    Breakfast: getMealOptions('Breakfast', foodPreference, region),
    MorningSnack: getMealOptions('MorningSnack', foodPreference, region),
    Lunch: getMealOptions('Lunch', foodPreference, region),
    EveningSnack: getMealOptions('EveningSnack', foodPreference, region),
    Dinner: getMealOptions('Dinner', foodPreference, region),
    BedtimeSnack: getMealOptions('BedtimeSnack', foodPreference, region)
  };

  const savedPlan = await db.insert('meals', {
    userId,
    date: new Date().toLocaleDateString('en-CA'),
    plan: mealPlan,
    preference: foodPreference,
    region
  });

  res.json({ success: true, plan: savedPlan });
});

router.get('/meal-planner/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toLocaleDateString('en-CA');
  const plan = await db.findOne('meals', { userId, date: today });
  res.json({ success: true, plan });
});

// --- AI CHATBOT ROUTE ---

router.post('/chatbot', async (req, res) => {
  const { message, lang, userId } = req.body;
  const currentLang = lang || 'en';
  const query = message ? message.toLowerCase() : '';

  // Log conversation to database
  await db.insert('chatbot_logs', {
    userId: userId || 'anonymous',
    query: message,
    language: currentLang,
    timestamp: new Date().toISOString()
  });

  // Attempt real Gemini API if key is present
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are NutriCare AI, an empathetic, premium diabetes nutrition assistant. Answer the user question in their chosen language (current language code: ${currentLang}). Be structured, informative, professional, and friendly. Provide dietary guidelines, diabetic recipes, macro metrics, and precautions. User asks: "${message}"`
            }]
          }]
        })
      });
      const data = await response.json();
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.json({ success: true, reply: aiReply });
    } catch (err) {
      console.error('Gemini API call failed, falling back to local chat engine.', err);
    }
  }

  // Fallback engine
  let reply = '';
  const responses = CHATBOT_RESPONSES[currentLang] || CHATBOT_RESPONSES['en'];

  if (query.includes('mango') || query.includes('మామిడి') || query.includes('आम')) {
    reply = responses.mango;
  } else if (query.includes('dosa') || query.includes('దోస') || query.includes('डोसा')) {
    reply = responses.dosa;
  } else if (query.includes('250') || query.includes('షుగర్ 250') || query.includes('शुगर 250')) {
    reply = responses.sugar_250;
  } else if (query.includes('breakfast') || query.includes('అల్పాహారం') || query.includes('नाश्ता') || query.includes('tiffin')) {
    reply = responses.breakfast;
  } else if (query.includes('coconut') || query.includes('కొబ్బరి') || query.includes('नारियल')) {
    reply = responses.coconut_water;
  } else {
    // Attempt semantic match on general foods from database
    const matchedFood = INDIAN_FOODS_DB.find(f => query.includes(f.name.toLowerCase()));
    if (matchedFood) {
      if (currentLang === 'te') {
        reply = `${matchedFood.name} లో ${matchedFood.calories} క్యాలరీలు, ${matchedFood.carbs}g కార్బోహైడ్రేట్లు మరియు ${matchedFood.sugar}g చక్కెర ఉన్నాయి. దీని గ్లైసెమిక్ ఇండెక్స్ ${matchedFood.gi}. మధుమేహానికి ఇది ${matchedFood.suitable ? 'మంచిది (పరిమిత మోతాదులో: ' + matchedFood.qty + ')' : 'సరైనది కాదు. దీనికి బదులు ' + matchedFood.alternatives + ' ఉపయోగించండి'}.`;
      } else if (currentLang === 'hi') {
        reply = `${matchedFood.name} में ${matchedFood.calories} कैलोरी, ${matchedFood.carbs}g कार्ब्स और ${matchedFood.sugar}g शुगर है। इसका ग्लाइसेमिक इंडेक्स ${matchedFood.gi} है। मधुमेह के लिए यह ${matchedFood.suitable ? 'सुरक्षित है (सुझाई गई मात्रा: ' + matchedFood.qty + ')' : 'अच्छा नहीं माना जाता। विकल्प: ' + matchedFood.alternatives + ' खाएं'}.`;
      } else {
        reply = `${matchedFood.name} contains ${matchedFood.calories} kcal, ${matchedFood.carbs}g carbs, and ${matchedFood.sugar}g sugar with a Glycemic Index of ${matchedFood.gi}. It is ${matchedFood.suitable ? 'suitable for diabetes (Recommended quantity: ' + matchedFood.qty + ')' : 'NOT recommended. Try healthier alternatives like ' + matchedFood.alternatives}.`;
      }
    } else {
      reply = responses.default;
    }
  }

  // Prepend greeting in the selected language
  res.json({ success: true, reply });
});

// --- INSIGHTS / ANALYTICS REPORT ---

router.get('/insights/:userId', async (req, res) => {
  const { userId } = req.params;
  const logs = await db.find('bloodsugar', { userId });
  const waterLogs = await db.find('water', { userId });
  const exercises = await db.find('exercise', { userId });
  const meds = await db.find('medications', { userId });

  if (logs.length === 0) {
    return res.json({
      success: true,
      hasData: false,
      message: 'Not enough data yet. Log your blood sugar to unlock reports!'
    });
  }

  // Calculate metrics
  const readings = logs.map(l => l.reading);
  const avgSugar = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);
  const maxSugar = Math.max(...readings);
  const minSugar = Math.min(...readings);

  // Status breakdown
  let greenCount = 0, yellowCount = 0, redCount = 0;
  logs.forEach(l => {
    if (l.status === 'green') greenCount++;
    else if (l.status === 'yellow') yellowCount++;
    else if (l.status === 'red') redCount++;
  });

  const greenPct = Math.round((greenCount / logs.length) * 100);
  const yellowPct = Math.round((yellowCount / logs.length) * 100);
  const redPct = Math.round((redCount / logs.length) * 100);

  // Medication adherence rate
  let totalDosesExpected = 0;
  let totalDosesTaken = 0;
  meds.forEach(m => {
    // Assume 7 days tracking
    const frequency = parseInt(m.frequency) || 1; // times per day
    totalDosesExpected += frequency * 7;
    const takenDates = Object.keys(m.adherence || {});
    totalDosesTaken += takenDates.length;
  });
  const medAdherenceRate = totalDosesExpected > 0 ? Math.round((totalDosesTaken / totalDosesExpected) * 100) : 100;

  // Water completion rate
  let totalWaterGoal = 0, totalWaterActual = 0;
  waterLogs.forEach(w => {
    totalWaterGoal += w.goal;
    totalWaterActual += w.amount;
  });
  const waterPct = totalWaterGoal > 0 ? Math.round((totalWaterActual / totalWaterGoal) * 100) : 0;

  // Overall Health Score (Weighted averages)
  // 40% Sugar in Green Range, 30% Medication adherence, 15% exercise frequency, 15% water intake
  const exerciseScore = exercises.length >= 3 ? 100 : Math.round((exercises.length / 3) * 100);
  const healthScore = Math.round(
    (greenPct * 0.4) + 
    (medAdherenceRate * 0.3) + 
    (exerciseScore * 0.15) + 
    (Math.min(100, waterPct) * 0.15)
  );

  // Risk Analysis & Smart Insights
  let riskLevel = 'Low';
  let recommendations = [];

  if (avgSugar > 160 || redPct > 25) {
    riskLevel = 'High';
    recommendations.push('Reduce carbohydrate intake during dinners. Focus on proteins and leafy green salads.');
    recommendations.push('Schedule an emergency check-up with your endocrinologist to adjust dosages.');
  } else if (avgSugar > 130 || yellowPct > 35) {
    riskLevel = 'Moderate';
    recommendations.push('Try incorporating 15 minutes of brisk walking after lunch and dinner.');
    recommendations.push('Opt for low Glycemic Index (GI < 55) grains like millets or quinoa.');
  } else {
    riskLevel = 'Optimal';
    recommendations.push('Excellent glycemic control. Maintain current physical activities and diet routines.');
  }

  if (medAdherenceRate < 80) {
    recommendations.push('Set custom notification alerts to avoid missing your prescribed insulin or tablets.');
  }

  res.json({
    success: true,
    hasData: true,
    metrics: {
      avgSugar,
      maxSugar,
      minSugar,
      greenPct,
      yellowPct,
      redPct,
      medAdherenceRate,
      waterPct,
      healthScore,
      riskLevel
    },
    recommendations
  });
});

// --- ADMIN / BACKOFFICE ANALYTICS ---

router.get('/admin/metrics', async (req, res) => {
  const users = await db.find('users');
  const logs = await db.find('bloodsugar');
  const chatlogs = await db.find('chatbot_logs');
  
  res.json({
    success: true,
    metrics: {
      totalUsers: users.length,
      totalSugarLogs: logs.length,
      totalChatQueries: chatlogs.length,
      languagesUsed: {
        english: chatlogs.filter(c => c.language === 'en').length,
        telugu: chatlogs.filter(c => c.language === 'te').length,
        hindi: chatlogs.filter(c => c.language === 'hi').length,
      }
    },
    users: users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }))
  });
});

// --- SLEEP TRACKER ROUTES ---

router.post('/tracker/sleep', async (req, res) => {
  const { userId, duration, quality, date, bedtime, waketime, notes } = req.body;
  if (!userId || !duration || !quality || !date) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }

  const entry = await db.insert('sleep', {
    userId,
    duration: parseFloat(duration),
    quality,
    date,
    bedtime: bedtime || '',
    waketime: waketime || '',
    notes: notes || ''
  });

  // Gamification check: Sleep Streaks or Sleeping Beauty Badge
  const allSleep = await db.find('sleep', { userId });
  if (allSleep.length >= 3) {
    const hasBadge = await db.findOne('achievements', { userId, badge: 'Sleep Champion (3 Days)' });
    if (!hasBadge) {
      await db.insert('achievements', { userId, badge: 'Sleep Champion (3 Days)', awardedAt: new Date().toISOString() });
    }
  }

  res.json({ success: true, message: 'Sleep session logged!', entry });
});

router.get('/tracker/sleep/:userId', async (req, res) => {
  const { userId } = req.params;
  const logs = await db.find('sleep', { userId });
  res.json({ success: true, logs });
});

// --- DOCTOR DASHBOARD ROUTES ---

router.get('/doctor/patients', async (req, res) => {
  // Return all users that have marked profileCompleted or are patients
  const patients = await db.find('users', { role: 'user' });
  res.json({ success: true, patients });
});

router.post('/doctor/notes', async (req, res) => {
  const { doctorId, patientId, doctorName, note } = req.body;
  if (!patientId || !note) {
    return res.status(400).json({ success: false, message: 'Missing patientId or note.' });
  }
  const entry = await db.insert('doctor_notes', {
    doctorId: doctorId || 'anonymous_doc',
    patientId,
    doctorName: doctorName || 'Dr. Specialist',
    note,
    date: new Date().toLocaleDateString('en-CA')
  });
  res.json({ success: true, message: 'Clinical note added successfully!', entry });
});

router.get('/doctor/notes/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const notes = await db.find('doctor_notes', { patientId });
  res.json({ success: true, notes });
});

router.put('/auth/share-report', async (req, res) => {
  const { userId, doctorEmail } = req.body;
  if (!userId || !doctorEmail) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }
  const user = await db.findOne('users', { _id: userId });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  const sharedDoctors = user.sharedDoctors || [];
  if (!sharedDoctors.includes(doctorEmail)) {
    sharedDoctors.push(doctorEmail);
  }
  await db.update('users', { _id: userId }, { sharedDoctors });
  res.json({ success: true, message: `Report shared successfully with ${doctorEmail}!`, sharedDoctors });
});

// --- FAMILY CAREGIVER ROUTES ---

router.post('/caregiver/members', async (req, res) => {
  const { userId, email, relation } = req.body; // userId = patient, email = caregiver email
  if (!userId || !email) {
    return res.status(400).json({ success: false, message: 'Missing parameters.' });
  }
  
  const entry = await db.insert('caregivers', {
    userId,
    caregiverEmail: email,
    relation: relation || 'Caregiver',
    dateAdded: new Date().toLocaleDateString('en-CA')
  });

  res.json({ success: true, message: 'Caregiver added successfully!', entry });
});

router.get('/caregiver/members/:userId', async (req, res) => {
  const { userId } = req.params;
  const members = await db.find('caregivers', { userId });
  res.json({ success: true, members });
});

router.get('/caregiver/patients/:caregiverEmail', async (req, res) => {
  const { caregiverEmail } = req.params;
  const mappings = await db.find('caregivers', { caregiverEmail });
  const patientIds = mappings.map(m => m.userId);
  const patients = [];
  for (let id of patientIds) {
    const p = await db.findOne('users', { _id: id });
    if (p) {
      patients.push({ ...p, relation: mappings.find(m => m.userId === id)?.relation });
    }
  }
  res.json({ success: true, patients });
});

router.get('/caregiver/alerts/:userId', async (req, res) => {
  const { userId } = req.params;
  const alerts = await db.find('emergency_alerts', { userId });
  res.json({ success: true, alerts });
});

router.post('/caregiver/trigger-sos', async (req, res) => {
  const { userId, type, message, lat, lon } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Missing userId.' });

  const entry = await db.insert('emergency_alerts', {
    userId,
    type: type || 'SOS',
    message: message || 'Emergency SOS activated!',
    lat: lat || null,
    lon: lon || null,
    resolved: false,
    date: new Date().toLocaleDateString('en-CA')
  });

  res.json({ success: true, message: 'Emergency alert dispatched to caregivers!', entry });
});

// --- AI DIABETES RISK PREDICTION ROUTE ---

router.get('/tracker/ai-risk/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // 1. Gather all patient metrics
  const patient = await db.findOne('users', { _id: userId });
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient profile not found.' });
  }

  const glucoseLogs = await db.find('bloodsugar', { userId });
  const waterLogs = await db.find('water', { userId });
  const exercises = await db.find('exercise', { userId });
  const meds = await db.find('medications', { userId });
  const sleepLogs = await db.find('sleep', { userId });

  // Compute BMI
  let bmi = 23; // Default normal
  const heightVal = parseFloat(patient.height);
  const weightVal = parseFloat(patient.weight);
  if (heightVal && weightVal) {
    // Check if height is in cm or meters (if > 3, it is likely in cm)
    const heightInMeters = heightVal > 3 ? heightVal / 100 : heightVal;
    bmi = parseFloat((weightVal / (heightInMeters * heightInMeters)).toFixed(1));
  }

  const ageVal = parseInt(patient.age) || 30;

  // Calculate average glucose
  let avgSugar = 120;
  let redPct = 0, yellowPct = 0, greenPct = 0;
  if (glucoseLogs.length > 0) {
    const readings = glucoseLogs.map(l => l.reading);
    avgSugar = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);
    let r = 0, y = 0, g = 0;
    glucoseLogs.forEach(l => {
      if (l.status === 'red') r++;
      else if (l.status === 'yellow') y++;
      else g++;
    });
    redPct = Math.round((r / glucoseLogs.length) * 100);
    yellowPct = Math.round((y / glucoseLogs.length) * 100);
    greenPct = Math.round((g / glucoseLogs.length) * 100);
  }

  // Medication compliance
  let totalExpectedDoses = 0;
  let totalTakenDoses = 0;
  meds.forEach(m => {
    const frequency = parseInt(m.frequency) || 1;
    totalExpectedDoses += frequency * 7;
    totalTakenDoses += Object.keys(m.adherence || {}).length;
  });
  const medAdherence = totalExpectedDoses > 0 ? Math.round((totalTakenDoses / totalExpectedDoses) * 100) : 100;

  // Water completion rate
  let totalWaterGoal = 0, totalWaterActual = 0;
  waterLogs.forEach(w => {
    totalWaterGoal += w.goal;
    totalWaterActual += w.amount;
  });
  const waterPct = totalWaterGoal > 0 ? Math.round((totalWaterActual / totalWaterGoal) * 100) : 0;

  // Exercise average duration
  let totalDuration = 0;
  exercises.forEach(e => {
    totalDuration += e.duration || 0;
  });
  const avgWorkoutMin = exercises.length > 0 ? Math.round(totalDuration / exercises.length) : 0;

  // Sleep Quality average
  let avgSleep = 7.2;
  let poorSleepCount = 0;
  if (sleepLogs.length > 0) {
    const durs = sleepLogs.map(s => s.duration);
    avgSleep = parseFloat((durs.reduce((a,b)=>a+b, 0) / sleepLogs.length).toFixed(1));
    poorSleepCount = sleepLogs.filter(s => s.quality === 'Poor' || s.quality === 'Fair').length;
  }

  // Attempt real Gemini API if key is present
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a clinical diabetes risk analysis AI. 
              Analyze the patient parameters:
              - Age: ${ageVal} years old
              - BMI: ${bmi}
              - Diabetes Type: ${patient.diabetesType || 'Type 2'}
              - Average Glucose (Last 7 days): ${avgSugar} mg/dL
              - Glucose status breakdown: Green: ${greenPct}%, Yellow: ${yellowPct}%, Red: ${redPct}%
              - Medication Adherence: ${medAdherence}%
              - Average Daily Workout: ${avgWorkoutMin} minutes
              - Water Intake Goal Completion: ${waterPct}%
              - Average Sleep Duration: ${avgSleep} hours, poor sleep logs count: ${poorSleepCount}

              Compute the diabetes risk level (Low, Moderate, High, Critical), explain the risk reasoning, and give 3-4 personalized recommendations. 
              Also predict the next 24 hours of blood sugar (hourly readings, 24 values) and next 7 days of blood sugar averages (7 values).
              
              Format your reply STRICTLY as a valid JSON object (no markdown, no quotes around outer braces) with exactly these fields:
              {
                "riskLevel": "Low" | "Moderate" | "High" | "Critical",
                "explanation": "string details",
                "recommendations": ["rec1", "rec2", "rec3"],
                "predicted24h": [24 numbers],
                "predicted7d": [7 numbers]
              }`
            }]
          }]
        })
      });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      // Clean potential markdown formatting
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return res.json({ success: true, ...parsed });
    } catch (err) {
      console.error('Gemini Risk Prediction API failed, falling back to local clinical rules.', err.message);
    }
  }

  // --- LOCAL CLINICAL RULE-BASED ENGINE FALLBACK ---
  let riskLevel = 'Low';
  const explanationParts = [];
  const recommendations = [];

  // Determine Risk Level
  if (avgSugar > 175 || redPct > 40 || medAdherence < 60) {
    riskLevel = 'Critical';
    explanationParts.push(`Your average blood sugar of ${avgSugar} mg/dL is critically high, with ${redPct}% of logs in the hyperglycemic warning range.`);
  } else if (avgSugar > 140 || redPct > 20 || bmi >= 30) {
    riskLevel = 'High';
    explanationParts.push(`Your blood sugar averages ${avgSugar} mg/dL. Obesity index (BMI: ${bmi}) combined with glycemic excursions indicates high metabolic distress.`);
  } else if (avgSugar > 115 || yellowPct > 25 || bmi > 25) {
    riskLevel = 'Moderate';
    explanationParts.push(`Glycemic control is moderate (average sugar: ${avgSugar} mg/dL). Minor weight management (BMI: ${bmi}) or meal modifications can restore normal glucose.`);
  } else {
    riskLevel = 'Low';
    explanationParts.push(`Excellent health score! Glycemic status is stable (average: ${avgSugar} mg/dL) with high medication adherence (${medAdherence}%) and healthy BMI.`);
  }

  // Explanations for lifestyle factors
  if (medAdherence < 80) explanationParts.push(`Medication compliance is low (${medAdherence}%), which leads to erratic insulin levels.`);
  if (waterPct < 60) explanationParts.push(`Inadequate hydration (${waterPct}% of goal) limits renal clearance of excess blood glucose.`);
  if (avgWorkoutMin < 20) explanationParts.push(`Sedentary routines reduce muscle glucose uptake, contributing to post-meal spikes.`);
  if (avgSleep < 6.5) explanationParts.push(`Short sleep duration (${avgSleep}h) activates cortisol releases, triggering overnight liver glucose spikes.`);

  // Generate personalized recommendations
  if (avgSugar > 130) {
    recommendations.push("Substitute high-glycemic grains (polished rice, maida rotis) with fiber-rich options like Foxtail Millets or Brown Rice.");
  }
  if (medAdherence < 85) {
    recommendations.push("Set active smartphone alarms for your medication times. Skipping insulin/tablets directly exposes you to glycemic swings.");
  }
  if (waterPct < 80) {
    recommendations.push("Drink at least 2.5L of water daily. Increased fluid volume dilutes blood glucose and aids kidney filtration.");
  }
  if (avgWorkoutMin < 30) {
    recommendations.push("Incorporate a 15-minute brisk walk immediately after lunch and dinner to stimulate insulin-independent glucose uptake.");
  }
  if (bmi > 25) {
    recommendations.push("Engage in calorie-deficit meal portions and low-intensity cardio to lower your BMI towards a healthy target of 18.5-24.9.");
  }
  if (avgSleep < 7) {
    recommendations.push("Maintain a consistent bedtime routine. Aim for 7.5 hours of sleep to lower insulin resistance caused by high cortisol.");
  }

  // If no recommendations were populated, add default
  if (recommendations.length === 0) {
    recommendations.push("Maintain your current healthy routines! Log daily workouts, stay hydrated, and monitor fasting glucose.");
  }

  // Diurnal blood sugar fluctuation predictions (24 hours)
  const base = avgSugar;
  const predicted24h = [];
  const mealPeriods = {
    8: 45,  // Breakfast bump
    9: 55,
    13: 50, // Lunch bump
    14: 65,
    15: 40,
    20: 55, // Dinner bump
    21: 75,
    22: 40
  };

  for (let hour = 0; hour < 24; hour++) {
    let dev = (Math.sin((hour - 6) * Math.PI / 12) * 10); // natural circadian rhythm
    if (mealPeriods[hour]) {
      dev += mealPeriods[hour] * (1 + (bmi - 23)/100);
    }
    // Adjust if user is active/medicated
    if (medAdherence > 80) dev -= 10;
    if (avgWorkoutMin > 20) dev -= 8;

    predicted24h.push(Math.round(Math.max(65, base + dev + (Math.random() * 8 - 4))));
  }

  // 7 Days average glucose prediction
  const predicted7d = [];
  for (let day = 1; day <= 7; day++) {
    // Assumes improvements as user implements recommendations
    let factor = 0;
    if (medAdherence > 85) factor -= day * 1.5;
    if (avgWorkoutMin > 25) factor -= day * 1.0;
    if (waterPct > 80) factor -= day * 0.8;
    
    // Fluctuations
    const noise = Math.random() * 6 - 3;
    predicted7d.push(Math.round(Math.max(75, base + factor + noise)));
  }

  res.json({
    success: true,
    riskLevel,
    explanation: explanationParts.join(' '),
    recommendations,
    predicted24h,
    predicted7d
  });
});

module.exports = router;
