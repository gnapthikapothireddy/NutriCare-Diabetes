const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Local Simulation Database Helper if backend fails
const getLocalData = (key, defaultVal = []) => {
  const data = localStorage.getItem(`nutricare_mock_${key}`);
  return data ? JSON.parse(data) : defaultVal;
};

const saveLocalData = (key, data) => {
  localStorage.setItem(`nutricare_mock_${key}`, JSON.stringify(data));
};

// Safe request wrapper that falls back to simulation
const request = async (url, options = {}, fallbackAction) => {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Request failed');
    }
    return await res.json();
  } catch (err) {
    console.warn(`API: Request to ${url} failed. Falling back to local simulation.`, err.message);
    return fallbackAction();
  }
};

const api = {
  // Auth & Profile
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, () => {
      const users = getLocalData('users');
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid email or password. (Simulated)');
      return { success: true, user };
    });
  },

  signup: async (email, password, name, phone) => {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone })
    }, () => {
      const users = getLocalData('users');
      if (users.find(u => u.email === email)) throw new Error('User already exists. (Simulated)');
      const newUser = {
        _id: 'mock_usr_' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        name: name || email.split('@')[0],
        phone: phone || '',
        role: 'user',
        profileCompleted: false,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      saveLocalData('users', users);
      return { success: true, user: newUser };
    });
  },

  googleLogin: async (email, name, googleId, photo, credential) => {
    return request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name, googleId, uid: googleId, photo, credential })
    }, () => {
      const users = getLocalData('users');
      let user = users.find(u => u.email === email);
      if (!user) {
        user = {
          _id: 'mock_usr_' + Math.random().toString(36).substr(2, 9),
          email,
          name,
          googleId,
          uid: googleId,
          photo: photo || '',
          role: 'user',
          profileCompleted: false,
          createdAt: new Date().toISOString()
        };
        users.push(user);
        saveLocalData('users', users);
      } else {
        if (photo && user.photo !== photo) user.photo = photo;
        if (googleId && !user.uid) user.uid = googleId;
        if (googleId && !user.googleId) user.googleId = googleId;
        if (name && !user.name) user.name = name;
        saveLocalData('users', users);
      }
      return { success: true, user };
    });
  },

  otpLogin: async (phone, otp) => {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp })
    }, () => {
      if (otp !== '123456') throw new Error('Invalid OTP. Use 123456 for testing.');
      const users = getLocalData('users');
      let user = users.find(u => u.phone === phone);
      if (!user) {
        user = {
          _id: 'mock_usr_' + Math.random().toString(36).substr(2, 9),
          phone,
          email: `${phone}@nutricare.local`,
          name: `User ${phone.slice(-4)}`,
          role: 'user',
          profileCompleted: false,
          createdAt: new Date().toISOString()
        };
        users.push(user);
        saveLocalData('users', users);
      }
      return { success: true, user };
    });
  },

  getProfile: async (userId) => {
    return request(`/auth/profile/${userId}`, {}, () => {
      const users = getLocalData('users');
      const user = users.find(u => u._id === userId);
      if (!user) throw new Error('User not found');
      return { success: true, profile: user };
    });
  },

  updateProfile: async (userId, profileData) => {
    return request(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    }, () => {
      const users = getLocalData('users');
      const idx = users.findIndex(u => u._id === userId);
      if (idx === -1) throw new Error('User not found');
      users[idx] = { ...users[idx], ...profileData, profileCompleted: true };
      saveLocalData('users', users);
      return { success: true, user: users[idx] };
    });
  },

  // Blood Sugar Tracker
  logGlucose: async (userId, reading, mealPeriod, note) => {
    return request('/tracker/glucose', {
      method: 'POST',
      body: JSON.stringify({ userId, reading, mealPeriod, note })
    }, () => {
      const logs = getLocalData('bloodsugar');
      const glucoseValue = parseFloat(reading);
      let status = 'green';
      let insight = '';

      if (['Fasting', 'Before Breakfast', 'Before Lunch', 'Before Dinner'].includes(mealPeriod)) {
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
      } else {
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

      const newEntry = {
        _id: 'mock_log_' + Math.random().toString(36).substr(2, 9),
        userId,
        reading: glucoseValue,
        mealPeriod,
        status,
        insight,
        note: note || '',
        date: new Date().toLocaleDateString('en-CA'),
        createdAt: new Date().toISOString()
      };

      logs.push(newEntry);
      saveLocalData('bloodsugar', logs);

      // Streaks and Badges simulation
      let streak = parseInt(localStorage.getItem(`nutricare_streak_${userId}`) || '0') + 1;
      localStorage.setItem(`nutricare_streak_${userId}`, streak.toString());

      const achievements = getLocalData('achievements');
      if (streak === 3 && !achievements.find(a => a.userId === userId && a.badge === 'Sugar Tracker Pro (3 Days)')) {
        achievements.push({ userId, badge: 'Sugar Tracker Pro (3 Days)', awardedAt: new Date().toISOString() });
      }
      if (streak === 7 && !achievements.find(a => a.userId === userId && a.badge === 'Weekly Discipline Master (7 Days)')) {
        achievements.push({ userId, badge: 'Weekly Discipline Master (7 Days)', awardedAt: new Date().toISOString() });
      }
      saveLocalData('achievements', achievements);

      return { success: true, entry: newEntry, currentStreak: streak };
    });
  },

  getGlucose: async (userId) => {
    return request(`/tracker/glucose/${userId}`, {}, () => {
      const logs = getLocalData('bloodsugar');
      return { success: true, logs: logs.filter(l => l.userId === userId) };
    });
  },

  // Water Tracker
  updateWater: async (userId, amountMl) => {
    return request('/tracker/water', {
      method: 'POST',
      body: JSON.stringify({ userId, amountMl })
    }, () => {
      const waterLogs = getLocalData('water');
      const today = new Date().toLocaleDateString('en-CA');
      let record = waterLogs.find(w => w.userId === userId && w.date === today);

      if (record) {
        record.amount += parseFloat(amountMl);
      } else {
        record = {
          _id: 'mock_wat_' + Math.random().toString(36).substr(2, 9),
          userId,
          amount: parseFloat(amountMl),
          goal: 2500,
          date: today
        };
        waterLogs.push(record);
      }
      saveLocalData('water', waterLogs);
      return { success: true, record };
    });
  },

  getWater: async (userId) => {
    return request(`/tracker/water/${userId}`, {}, () => {
      const waterLogs = getLocalData('water');
      const today = new Date().toLocaleDateString('en-CA');
      let record = waterLogs.find(w => w.userId === userId && w.date === today);
      if (!record) {
        record = { userId, amount: 0, goal: 2500, date: today };
      }
      return { success: true, record };
    });
  },

  // Exercise Tracker
  logExercise: async (userId, type, durationMinutes, steps) => {
    return request('/tracker/exercise', {
      method: 'POST',
      body: JSON.stringify({ userId, type, durationMinutes, steps })
    }, () => {
      const logs = getLocalData('exercise');
      let calPerMin = 4.5;
      if (type === 'Running') calPerMin = 10;
      if (type === 'Cycling') calPerMin = 7;
      if (type === 'Gym') calPerMin = 6;
      if (type === 'Yoga') calPerMin = 3;
      if (type === 'Walking') calPerMin = 4.5;

      const caloriesBurned = Math.round(parseFloat(durationMinutes) * calPerMin);
      const heartScore = Math.min(100, Math.round(parseFloat(durationMinutes) * 1.5 + (steps ? steps / 300 : 0)));

      const newEntry = {
        _id: 'mock_ex_' + Math.random().toString(36).substr(2, 9),
        userId,
        type,
        duration: parseFloat(durationMinutes),
        steps: steps ? parseInt(steps) : 0,
        calories: caloriesBurned,
        heartScore,
        date: new Date().toLocaleDateString('en-CA'),
        createdAt: new Date().toISOString()
      };
      logs.push(newEntry);
      saveLocalData('exercise', logs);
      return { success: true, entry: newEntry };
    });
  },

  getExercise: async (userId) => {
    return request(`/tracker/exercise/${userId}`, {}, () => {
      const logs = getLocalData('exercise');
      return { success: true, logs: logs.filter(l => l.userId === userId) };
    });
  },

  // Medication
  addMedication: async (userId, medData) => {
    return request('/medications', {
      method: 'POST',
      body: JSON.stringify({ userId, ...medData })
    }, () => {
      const meds = getLocalData('medications');
      const newMed = {
        _id: 'mock_med_' + Math.random().toString(36).substr(2, 9),
        userId,
        ...medData,
        adherence: {},
        createdAt: new Date().toISOString()
      };
      meds.push(newMed);
      saveLocalData('medications', meds);
      return { success: true, medication: newMed };
    });
  },

  getMedications: async (userId) => {
    return request(`/medications/${userId}`, {}, () => {
      const meds = getLocalData('medications');
      return { success: true, medications: meds.filter(m => m.userId === userId) };
    });
  },

  toggleMedicationAdherence: async (medId, date, status) => {
    return request('/medications/toggle-adherence', {
      method: 'PUT',
      body: JSON.stringify({ medId, date, status })
    }, () => {
      const meds = getLocalData('medications');
      const idx = meds.findIndex(m => m._id === medId);
      if (idx === -1) throw new Error('Medication not found');
      
      const adherence = { ...meds[idx].adherence };
      if (status) {
        adherence[date] = true;
      } else {
        delete adherence[date];
      }
      meds[idx].adherence = adherence;
      saveLocalData('medications', meds);
      return { success: true, adherence };
    });
  },

  deleteMedication: async (medId) => {
    return request(`/medications/${medId}`, { method: 'DELETE' }, () => {
      const meds = getLocalData('medications');
      const filtered = meds.filter(m => m._id !== medId);
      saveLocalData('medications', filtered);
      return { success: true };
    });
  },

  // Food Database
  searchFood: async (query) => {
    return request(`/food-database?query=${encodeURIComponent(query || '')}`, {}, () => {
      // Mock search from client-side array representation (see backend/routes/api.js)
      // Since it's easier, we will just return a small set here or keep a static copy in UI.
      // We will perform local filtering inside the component if this fails.
      return { success: false }; 
    });
  },

  // Meal Planner
  generateMealPlan: async (userId, plannerData) => {
    return request('/meal-planner', {
      method: 'POST',
      body: JSON.stringify({ userId, ...plannerData })
    }, () => {
      const meals = getLocalData('meals');
      const today = new Date().toLocaleDateString('en-CA');
      const pref = plannerData.foodPreference || 'Vegetarian';
      const reg = plannerData.region || 'South Indian';

      // Re-use same recipe pool locally
      const localRecipes = [
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
          instructions: 'Knead besan and wheat flour into dough. Roll into flatbread and cook on tawa. Serve with spinach curd.',
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
          instructions: 'Stuff multigrain dough balls with cottage cheese. Roll out and pan-fry with olive oil drop.',
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
          description: 'Cold soaked chia seed pudding with fresh blueberries and sliced almonds.',
          ingredients: 'Chia seeds, unsweetened almond milk, blueberries, stevia, almond slices.',
          instructions: 'Stir chia seeds in almond milk with stevia. Refrigerate overnight. Top with blueberries and almonds.',
          benefits: 'Chia seeds are loaded with soluble fiber that acts as a natural glucose buffer.'
        },
        
        // SNACK
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
          instructions: 'Dry roast chickpeas in a pan with turmeric and a pinch of black salt.',
          benefits: 'Extremely low Glycemic Index snack that keeps energy stable.'
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
          instructions: 'Count and eat raw.',
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
          instructions: 'Wash sprouts thoroughly. Toss with fresh lemon juice and spice.',
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
          instructions: 'Steam millets. Prepare sambar with dal and vegetables. Sauté karela. Serve hot.',
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
          instructions: 'Cook quinoa. Cool and mix with curd, salt, and grated cucumber. Temper.',
          benefits: 'Curd contains probiotics, quinoa supplies complete plant proteins.'
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
          ingredients: 'Fish fillets, brown rice, shallots, tomato, Chettinad spices.',
          instructions: 'Prepare curry base. Simmer fish until cooked. Serve with brown rice.',
          benefits: 'Omega-3 fats protect the heart; brown rice provides steady carbs.'
        },
        {
          category: 'Lunch',
          cuisines: ['North Indian'],
          veg: true,
          vegan: false,
          name: 'Multigrain Roti with Dal Tadka & Palak Paneer',
          image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=400&auto=format&fit=crop&q=60',
          calories: 350, protein: 15, carbs: 46, fiber: 8.5,
          description: 'Two multigrain rotis with yellow dal fry and cottage cheese in spinach.',
          ingredients: 'Wheat, oats, ragi flour (for roti), yellow lentils, paneer, spinach purée.',
          instructions: 'Knead multigrain flour and make rotis. Boil lentils and temper. Sauté paneer in spinach.',
          benefits: 'Palak paneer supplies high iron and calcium; yellow dal is a robust protein.'
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
          instructions: 'Marinate chicken. Skewer and bake. Serve with fresh garden salad.',
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
          description: 'Cooked quinoa tossed with cherry tomatoes, cucumbers, olives, and feta.',
          ingredients: 'Quinoa, cucumber, tomatoes, olives, feta, olive oil, oregano.',
          instructions: 'Toss cooked quinoa with chopped vegetables, olives, and crumbled feta. Drizzle olive oil.',
          benefits: 'Provides heart-healthy fats and low-GI carbohydrates.'
        },
        {
          category: 'Lunch',
          cuisines: ['Mediterranean', 'Western'],
          veg: false,
          vegan: false,
          name: 'Pan-Seared Salmon with Asparagus',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60',
          calories: 360, protein: 29, carbs: 6, fiber: 3.5,
          description: 'Fresh salmon fillet seared in olive oil with garlic-rubbed grilled asparagus.',
          ingredients: 'Salmon fillet, asparagus spears, fresh garlic, olive oil, lemon juice.',
          instructions: 'Pan-sear salmon in a hot skillet. Grill asparagus. Plate together.',
          benefits: 'Outstanding source of anti-inflammatory Omega-3 fats.'
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
          description: 'Boiled black chickpeas tossed with chopped tomatoes, mango, and coriander.',
          ingredients: 'Black chickpeas, tomatoes, mango, green chilies, coriander, lemon.',
          instructions: 'Boil black chickpeas. Mix with chopped raw veggies, lemon, and salt.',
          benefits: 'Complex carbs and high fiber keep evening hunger away.'
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
          instructions: 'Roast makhana on low heat until crunchy. Toss with pepper and turmeric.',
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
          description: 'Fresh sliced cucumber sticks served with hummus.',
          ingredients: 'Cucumber, chickpeas, tahini, garlic, lemon juice.',
          instructions: 'Slice cucumber. Serve with 2 tablespoons of freshly blended hummus.',
          benefits: 'Low glycemic complex carbs and protein.'
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
          instructions: 'Sauté ginger-garlic in oil. Add broccoli and bell peppers. Stir fry. Add paneer cubes.',
          benefits: 'Low-carb, high-protein dinner that limits overnight sugar spike.'
        },
        {
          category: 'Dinner',
          cuisines: ['South Indian'],
          veg: false,
          vegan: false,
          name: 'Grilled Pepper Chicken with Beans Poriyal',
          image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=60',
          calories: 280, protein: 28, carbs: 7, fiber: 3.8,
          description: 'Black pepper crusted chicken breast paired with French beans.',
          ingredients: 'Chicken breast, black pepper, French beans, mustard seeds, grated coconut.',
          instructions: 'Grill pepper marinated chicken. Sauté chopped French beans. Serve together.',
          benefits: 'Excellent protein count with zero starches ensures stable fasting glucose.'
        },
        {
          category: 'Dinner',
          cuisines: ['North Indian'],
          veg: true,
          vegan: true,
          name: 'Tofu Bhurji with Cauliflower Roti',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
          calories: 220, protein: 14, carbs: 12, fiber: 5,
          description: 'Crumbled tofu sautéed with tomatoes, served with cauliflower flatbread.',
          ingredients: 'Tofu, onions, tomatoes, green chilies, grated cauliflower, wheat.',
          instructions: 'Scramble tofu in a pan with spices. Mix cauliflower into dough, roll, and cook on tawa.',
          benefits: 'Tofu is rich in soy protein and is completely cholesterol-free.'
        },
        {
          category: 'Dinner',
          cuisines: ['Mediterranean', 'Western'],
          veg: true,
          vegan: true,
          name: 'Grilled Lemon Herb Tofu',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
          calories: 210, protein: 15, carbs: 10, fiber: 4.5,
          description: 'Organic firm tofu marinated in lemon juice and oregano, grilled with zucchini.',
          ingredients: 'Firm tofu, zucchini, kale, lemon, garlic, olive oil.',
          instructions: 'Marinate tofu slabs. Grill on a grill pan. Sauté kale and zucchini. Plate.',
          benefits: 'Light digestability. Helps stabilize overnight liver glucose production.'
        },
        {
          category: 'Dinner',
          cuisines: ['Mediterranean', 'Western'],
          veg: false,
          vegan: false,
          name: 'Lemon Grilled Chicken Breast',
          image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=60',
          calories: 250, protein: 29, carbs: 5, fiber: 3.5,
          description: 'Chicken breast grilled with Mediterranean herbs, served with steamed broccoli.',
          ingredients: 'Chicken breast, broccoli, olive oil, lemon, garlic.',
          instructions: 'Rub chicken with garlic and lemon. Grill. Steam broccoli and plate.',
          benefits: 'Promotes muscle recovery and maintains stable blood sugar overnight.'
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
          benefits: 'Anti-inflammatory. Prevents overnight hypoglycemia.'
        },
        {
          category: 'BedtimeSnack',
          cuisines: ['South Indian', 'North Indian', 'Mediterranean', 'Western'],
          veg: true,
          vegan: true,
          name: 'Chamomile Tea & Soaked Walnuts',
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60',
          calories: 45, protein: 1.5, carbs: 1, fiber: 1.2,
          description: 'Soothing chamomile tea paired with three soaked walnuts.',
          ingredients: 'Chamomile tea bag, hot water, 3 soaked walnuts.',
          instructions: 'Steep tea. Eat walnuts alongside.',
          benefits: 'Aids in quality sleep and prevents early morning sugar spikes.'
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
          benefits: 'High in protein, slowly absorbed to maintain a steady glucose baseline.'
        }
      ];

      const getLocalOptions = (category) => {
        const isVeg = pref === 'Vegetarian' || pref === 'Vegan';
        const isVegan = pref === 'Vegan';

        let list = localRecipes.filter(r => r.category === category);
        let cuisineList = list.filter(r => r.cuisines.includes(reg));
        if (cuisineList.length === 0) cuisineList = list;

        let dietList = cuisineList.filter(r => {
          if (isVegan) return r.vegan === true;
          if (isVeg) return r.veg === true;
          return true;
        });

        if (dietList.length < 3) {
          const remaining = list.filter(r => {
            if (isVegan) return r.vegan === true;
            if (isVeg) return r.veg === true;
            return true;
          });
          const ids = new Set(dietList.map(d => d.name));
          remaining.forEach(r => {
            if (!ids.has(r.name)) {
              dietList.push(r);
              ids.add(r.name);
            }
          });
        }

        if (dietList.length < 3) {
          const ids = new Set(dietList.map(d => d.name));
          list.forEach(r => {
            if (!ids.has(r.name)) {
              dietList.push(r);
              ids.add(r.name);
            }
          });
        }

        return dietList.slice(0, 3).map((r, idx) => ({
          ...r,
          id: `${category.toLowerCase()}_opt_${idx + 1}_${Date.now()}`
        }));
      };

      const mealPlan = {
        Breakfast: getLocalOptions('Breakfast'),
        MorningSnack: getLocalOptions('MorningSnack'),
        Lunch: getLocalOptions('Lunch'),
        EveningSnack: getLocalOptions('EveningSnack'),
        Dinner: getLocalOptions('Dinner'),
        BedtimeSnack: getLocalOptions('BedtimeSnack')
      };

      const newPlan = {
        _id: 'mock_meal_' + Math.random().toString(36).substr(2, 9),
        userId,
        date: today,
        plan: mealPlan,
        preference: pref,
        region: reg
      };

      meals.push(newPlan);
      saveLocalData('meals', meals);
      return { success: true, plan: newPlan };
    });
  },

  getMealPlan: async (userId) => {
    return request(`/meal-planner/${userId}`, {}, () => {
      const meals = getLocalData('meals');
      const today = new Date().toLocaleDateString('en-CA');
      const plan = meals.find(m => m.userId === userId && m.date === today);
      return { success: true, plan };
    });
  },

  // AI Chatbot
  chatWithAI: async (message, lang, userId) => {
    return request('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message, lang, userId })
    }, () => {
      const currentLang = lang || 'en';
      const q = message ? message.toLowerCase() : '';
      
      const localKnowledge = {
        en: {
          mango: "Mango has a high Glycemic Index (around 60). Limit to 1-2 small slices paired with almonds to prevent spikes. Avoid mango juice.",
          dosa: "Traditional rice dosa has a high GI (75+). Try Moong Dal Pesarattu or Oats Dosa as healthy fiber-rich alternatives.",
          sugar_250: "A blood sugar reading of 250 mg/dL is high. Drink water, avoid all carbs/sugars, walk for 10-15 mins, and consult your doctor immediately.",
          breakfast: "Try Vegetable Oats Upma, Moong Dal Pesarattu, or vegetable egg-white omelet for a high fiber, low carb start.",
          coconut: "Yes, you can drink coconut water, but limit to 1 glass (150ml) per day. Avoid packaged varieties with added sugars.",
          default: "Stay hydrated, monitor carbohydrate portions, and check glucose readings before and after eating."
        },
        te: {
          mango: "మామిడి పండులో గ్లైసెమిక్ ఇండెక్స్ (సుమారు 60) ఎక్కువ. అప్పుడప్పుడు 1-2 ముక్కలకు పరిమితం చేయండి. మామిడి రసం (జ్యూస్) వద్దు.",
          dosa: "బియ్యం దోసె (GI 75+) కన్నా పెసరట్టు, రాగి దోసె లేదా ఓట్స్ దోసె డయాబెటిస్ వాళ్లకు చాలా మంచిది.",
          sugar_250: "షుగర్ 250 చాలా ఎక్కువ. నీరు తాగండి, కార్బోహైడ్రేట్లు ఆపేయండి, మందులు వేసుకోండి మరియు వైద్యుడిని సంప్రదించండి.",
          breakfast: "పెసరట్టు, కూరగాయల ఓట్స్ ఉప్మా, సాంబార్‌తో రాగి ఇడ్లీ అల్పాహారానికి ఉత్తమమైన ఎంపికలు.",
          coconut: "రోజుకు 1 గ్లాసు కొబ్బరి నీరు తాగవచ్చు, కానీ పరిమితంగా మాత్రమే. నిల్వ ఉంచిన కొబ్బరి నీటిని నివారించండి.",
          default: "సరిపడా నీరు తాగడం, నడవడం మరియు పిండి పదార్థాలను నియంత్రించడం డయాబెటిస్ మేనేజ్మెంట్ కు చాలా అవసరం."
        },
        hi: {
          mango: "आम का ग्लाइसेमिक इंडेक्स (लगभग 60) अधिक होता है। 1-2 फांक से अधिक न खाएं। आम के रस/जूस से पूरी तरह बचें।",
          dosa: "सफेद चावल के डोसे का जीआई अधिक होता है। इसके बजाय मूंग दाल डोसा (पेसरट्टू) या ओट्स डोसा खाएं।",
          sugar_250: "शुगर 250 काफी अधिक है। पानी पिएं, मीठा तुरंत बंद कर दें, टहलें, दवाएं लें और तत्काल डॉक्टर से बात करें।",
          breakfast: "नाश्ते में सब्जियों वाला ओट्स उपमा, मूंग दाल चीला या अंडा-सफेद ऑमलेट एक स्वस्थ विकल्प है।",
          coconut: "हाँ, नारियल पानी पी सकते हैं, लेकिन रोजाना 1 गिलास (150ml) ही पिएं। मीठे डिब्बाबंद जूस से बचें।",
          default: "पर्याप्त पानी पिएं, नियमित टहलें, और भोजन में कार्बोहाइड्रेट्स की मात्रा को सीमित रखें।"
        }
      };

      const set = localKnowledge[currentLang] || localKnowledge['en'];
      let reply = '';
      if (q.includes('mango') || q.includes('మామిడి') || q.includes('आम')) reply = set.mango;
      else if (q.includes('dosa') || q.includes('దోస') || q.includes('डोसा')) reply = set.dosa;
      else if (q.includes('250') || q.includes('షుగర్ 250') || q.includes('शुगर 250')) reply = set.sugar_250;
      else if (q.includes('breakfast') || q.includes('అల్పాహారం') || q.includes('नाश्ता') || q.includes('tiffin')) reply = set.breakfast;
      else if (q.includes('coconut') || q.includes('కొబ్బరి') || q.includes('नारियल')) reply = set.coconut;
      else reply = set.default;

      return { success: true, reply };
    });
  },

  // Insights Reports
  getInsights: async (userId) => {
    return request(`/insights/${userId}`, {}, () => {
      const logs = getLocalData('bloodsugar').filter(l => l.userId === userId);
      const waterLogs = getLocalData('water').filter(w => w.userId === userId);
      const exercises = getLocalData('exercise').filter(e => e.userId === userId);
      const meds = getLocalData('medications').filter(m => m.userId === userId);

      if (logs.length === 0) {
        return { success: true, hasData: false, message: 'Not enough tracking logs yet.' };
      }

      const readings = logs.map(l => l.reading);
      const avgSugar = Math.round(readings.reduce((a, b) => a + b, 0) / readings.length);
      const maxSugar = Math.max(...readings);
      const minSugar = Math.min(...readings);

      let greenCount = 0, yellowCount = 0, redCount = 0;
      logs.forEach(l => {
        if (l.status === 'green') greenCount++;
        else if (l.status === 'yellow') yellowCount++;
        else if (l.status === 'red') redCount++;
      });

      const greenPct = Math.round((greenCount / logs.length) * 100);
      const yellowPct = Math.round((yellowCount / logs.length) * 100);
      const redPct = Math.round((redCount / logs.length) * 100);

      let totalExpected = 0, totalTaken = 0;
      meds.forEach(m => {
        totalExpected += (parseInt(m.frequency) || 1) * 7;
        totalTaken += Object.keys(m.adherence || {}).length;
      });
      const medAdherenceRate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100;

      let actualWater = 0, goalWater = 0;
      waterLogs.forEach(w => {
        actualWater += w.amount;
        goalWater += w.goal;
      });
      const waterPct = goalWater > 0 ? Math.round((actualWater / goalWater) * 100) : 0;

      const exerciseScore = exercises.length >= 3 ? 100 : Math.round((exercises.length / 3) * 100);
      const healthScore = Math.round(
        (greenPct * 0.4) + 
        (medAdherenceRate * 0.3) + 
        (exerciseScore * 0.15) + 
        (Math.min(100, waterPct) * 0.15)
      );

      let riskLevel = 'Low';
      let recommendations = [];

      if (avgSugar > 160) {
        riskLevel = 'High';
        recommendations.push('Reduce carbohydrate intake. Focus on proteins and leafy greens.');
        recommendations.push('Consult your doctor to evaluate medication adjustments.');
      } else if (avgSugar > 130) {
        riskLevel = 'Moderate';
        recommendations.push('Walk for 15 minutes after meals.');
        recommendations.push('Swap white rice for Foxtail Millets or Quinoa.');
      } else {
        riskLevel = 'Optimal';
        recommendations.push('Maintain current balanced diet and exercise regime.');
      }

      return {
        success: true,
        hasData: true,
        metrics: {
          avgSugar, maxSugar, minSugar,
          greenPct, yellowPct, redPct,
          medAdherenceRate, waterPct: Math.min(100, waterPct), healthScore, riskLevel
        },
        recommendations
      };
    });
  },

  // Admin Dashboard
  getAdminMetrics: async () => {
    return request('/admin/metrics', {}, () => {
      const users = getLocalData('users');
      const logs = getLocalData('bloodsugar');
      return {
        success: true,
        hasData: true,
        metrics: {
          totalUsers: users.length || 1,
          totalSugarLogs: logs.length || 5,
          totalChatQueries: 12,
          languagesUsed: { english: 8, telugu: 3, hindi: 1 }
        },
        users: users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt }))
      };
    });
  },

  // Sleep Tracker
  getSleep: async (userId) => {
    return request(`/tracker/sleep/${userId}`, {}, () => {
      const logs = getLocalData('sleep').filter(l => l.userId === userId);
      return { success: true, logs };
    });
  },
  logSleep: async (userId, sleepData) => {
    return request('/tracker/sleep', {
      method: 'POST',
      body: JSON.stringify({ userId, ...sleepData })
    }, () => {
      const logs = getLocalData('sleep');
      const newEntry = {
        _id: 'mock_slp_' + Math.random().toString(36).substr(2, 9),
        userId,
        ...sleepData,
        createdAt: new Date().toISOString()
      };
      logs.push(newEntry);
      saveLocalData('sleep', logs);
      return { success: true, entry: newEntry };
    });
  },

  // AI Risk Prediction
  getRiskPrediction: async (userId) => {
    return request(`/tracker/ai-risk/${userId}`, {}, () => {
      const logs = getLocalData('bloodsugar').filter(l => l.userId === userId);
      const waterLogs = getLocalData('water').filter(w => w.userId === userId);
      const exercises = getLocalData('exercise').filter(e => e.userId === userId);
      const meds = getLocalData('medications').filter(m => m.userId === userId);
      
      const readings = logs.map(l => l.reading);
      const avgSugar = readings.length > 0 ? Math.round(readings.reduce((a,b)=>a+b, 0)/readings.length) : 120;
      
      let riskLevel = 'Low';
      if (avgSugar > 160) riskLevel = 'High';
      else if (avgSugar > 130) riskLevel = 'Moderate';
      
      const explanation = `Glycemic status averages ${avgSugar} mg/dL. Based on hydration and medication log adherence, your metabolic load is at ${riskLevel.toLowerCase()} risk.`;
      
      const recommendations = [
        "Drink at least 2.5L of water daily.",
        "Incorporate a 15-minute brisk walk after meals.",
        "Ensure strict compliance with your medication schedules."
      ];
      
      const predicted24h = Array.from({length: 24}, (_, i) => {
        let dev = Math.sin((i - 6) * Math.PI / 12) * 10;
        if ([8, 9, 13, 14, 20, 21].includes(i)) dev += 50;
        return Math.round(avgSugar + dev + Math.random()*10 - 5);
      });
      
      const predicted7d = Array.from({length: 7}, (_, i) => Math.round(avgSugar - i*1.5 + Math.random()*6 - 3));
      
      return {
        success: true,
        riskLevel,
        explanation,
        recommendations,
        predicted24h,
        predicted7d
      };
    });
  },

  // Doctor Dashboard
  getDoctorPatients: async () => {
    return request('/doctor/patients', {}, () => {
      const users = getLocalData('users').filter(u => u.role === 'user');
      return { success: true, patients: users };
    });
  },
  addDoctorNote: async (doctorId, patientId, doctorName, note) => {
    return request('/doctor/notes', {
      method: 'POST',
      body: JSON.stringify({ doctorId, patientId, doctorName, note })
    }, () => {
      const notes = getLocalData('doctor_notes');
      const newNote = {
        _id: 'mock_note_' + Math.random().toString(36).substr(2, 9),
        doctorId,
        patientId,
        doctorName,
        note,
        date: new Date().toLocaleDateString('en-CA'),
        createdAt: new Date().toISOString()
      };
      notes.push(newNote);
      saveLocalData('doctor_notes', notes);
      return { success: true, entry: newNote };
    });
  },
  getDoctorNotes: async (patientId) => {
    return request(`/doctor/notes/${patientId}`, {}, () => {
      const notes = getLocalData('doctor_notes').filter(n => n.patientId === patientId);
      return { success: true, notes };
    });
  },
  shareReportWithDoctor: async (userId, doctorEmail) => {
    return request('/auth/share-report', {
      method: 'PUT',
      body: JSON.stringify({ userId, doctorEmail })
    }, () => {
      const users = getLocalData('users');
      const idx = users.findIndex(u => u._id === userId);
      if (idx !== -1) {
        const shared = users[idx].sharedDoctors || [];
        if (!shared.includes(doctorEmail)) shared.push(doctorEmail);
        users[idx].sharedDoctors = shared;
        saveLocalData('users', users);
        return { success: true, sharedDoctors: shared };
      }
      return { success: false, message: 'User not found' };
    });
  },

  // Family Caregiver
  addCaregiverMember: async (userId, email, relation) => {
    return request('/caregiver/members', {
      method: 'POST',
      body: JSON.stringify({ userId, email, relation })
    }, () => {
      const list = getLocalData('caregivers');
      const newEntry = {
        _id: 'mock_cg_' + Math.random().toString(36).substr(2, 9),
        userId,
        caregiverEmail: email,
        relation,
        dateAdded: new Date().toLocaleDateString('en-CA'),
        createdAt: new Date().toISOString()
      };
      list.push(newEntry);
      saveLocalData('caregivers', list);
      return { success: true, entry: newEntry };
    });
  },
  getCaregiverMembers: async (userId) => {
    return request(`/caregiver/members/${userId}`, {}, () => {
      const list = getLocalData('caregivers').filter(c => c.userId === userId);
      return { success: true, members: list };
    });
  },
  getCaregiverPatients: async (caregiverEmail) => {
    return request(`/caregiver/patients/${caregiverEmail}`, {}, () => {
      const mappings = getLocalData('caregivers').filter(c => c.caregiverEmail === caregiverEmail);
      const users = getLocalData('users');
      const patients = mappings.map(m => {
        const u = users.find(usr => usr._id === m.userId);
        return u ? { ...u, relation: m.relation } : null;
      }).filter(Boolean);
      return { success: true, patients };
    });
  },
  getCaregiverAlerts: async (userId) => {
    return request(`/caregiver/alerts/${userId}`, {}, () => {
      const list = getLocalData('emergency_alerts').filter(a => a.userId === userId);
      return { success: true, alerts: list };
    });
  },
  triggerSOS: async (userId, type, message, lat, lon) => {
    return request('/caregiver/trigger-sos', {
      method: 'POST',
      body: JSON.stringify({ userId, type, message, lat, lon })
    }, () => {
      const list = getLocalData('emergency_alerts');
      const newAlert = {
        _id: 'mock_alt_' + Math.random().toString(36).substr(2, 9),
        userId,
        type,
        message,
        lat,
        lon,
        resolved: false,
        date: new Date().toLocaleDateString('en-CA'),
        createdAt: new Date().toISOString()
      };
      list.push(newAlert);
      saveLocalData('emergency_alerts', list);
      return { success: true, entry: newAlert };
    });
  }
};

export default api;
