import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  Utensils, RefreshCw, CheckCircle, Sparkles, BookOpen, Heart, 
  Info, X, ShoppingBag, Shuffle, Search, CheckSquare, Square, 
  Download, Copy, ChevronRight 
} from 'lucide-react';

const ALTERNATIVES_DB = {
  biryani: {
    original: "Chicken Biryani (White Rice)",
    alt: "Foxtail Millet Chicken Biryani or Brown Rice Pulao",
    calories: 490, carbs: 62, protein: 22, fiber: 2, gi: 68,
    altCalories: 310, altCarbs: 38, altProtein: 26, altFiber: 8, altGi: 50,
    portion: "1 small bowl (approx. 150g)",
    pairingAvoid: "Sweetened raita, double ka meetha, or soft drinks.",
    bestTime: "Lunch (allows physical activity to stabilize glucose post-meal)",
    advice: "Pair with a double portion of cucumber and onion salad. Drink a glass of water 15 minutes before eating to enhance satiety."
  },
  pizza: {
    original: "Pepperoni Pizza (Maida Crust)",
    alt: "Ragi-Oats Crust Pizza with Low-Fat Paneer & Veggies",
    calories: 290, carbs: 36, protein: 12, fiber: 1.2, gi: 80,
    altCalories: 195, altCarbs: 22, altProtein: 15, altFiber: 5.5, altGi: 52,
    portion: "2 medium slices",
    pairingAvoid: "Garlic bread, potato wedges, or sugary carbonated sodas.",
    bestTime: "Lunch or early Dinner (before 7:30 PM)",
    advice: "Load up with high-fiber toppings like broccoli, mushrooms, spinach, and bell peppers. Keep cheese moderate."
  },
  dosa: {
    original: "Plain Rice Dosa (Polished Rice & Urad)",
    alt: "Moong Dal Dosa (Pesarattu) or Ragi Dosa",
    calories: 120, carbs: 22, protein: 3, fiber: 1.2, gi: 75,
    altCalories: 140, altCarbs: 18, altProtein: 8, altFiber: 4.5, altGi: 45,
    portion: "1-2 pieces",
    pairingAvoid: "Potato masalas (potato stuffing) or sweetened coconut chutneys.",
    bestTime: "Breakfast (gives sustained metabolic energy)",
    advice: "Serve with refreshing ginger-mint chutney and a bowl of vegetable-loaded sambar to decrease overall glycemic load."
  },
  idli: {
    original: "Regular Rice Idli",
    alt: "Brown Rice Oats Idli or Ragi Idli",
    calories: 65, carbs: 15, protein: 2, fiber: 0.8, gi: 77,
    altCalories: 60, altCarbs: 12, altProtein: 2.2, altFiber: 2.5, altGi: 50,
    portion: "2 pieces",
    pairingAvoid: "Sweetened tea or high-sodium pickle spreads.",
    bestTime: "Breakfast",
    advice: "Swap normal idli with steamed oats idli loaded with grated carrots and green peas. Pair with tomato-mint chutney."
  },
  "gulab jamun": {
    original: "Deep-fried Gulab Jamun in Sugar Syrup",
    alt: "Stevia Sweetened Baked Ragi Oats Dumplings",
    calories: 150, carbs: 24, protein: 2, fiber: 0.1, gi: 88,
    altCalories: 65, altCarbs: 8, altProtein: 3, altFiber: 1.8, altGi: 42,
    portion: "1 small piece (occasionally)",
    pairingAvoid: "Ice cream pairings or eating on an empty stomach.",
    bestTime: "Mid-day Snack (after a protein-rich meal, never fasting)",
    advice: "Bake dumplings using millet flour, sweeten with pure stevia or erythritol, and skip the sugary liquid syrup completely."
  },
  sweets: {
    original: "Traditional Indian Sweets (Laddu/Barfi)",
    alt: "Sugar-free Date & Nut Roll or Baked Oats Ladoos",
    calories: 180, carbs: 28, protein: 2, fiber: 0.5, gi: 85,
    altCalories: 90, altCarbs: 12, altProtein: 4, altFiber: 3, altGi: 48,
    portion: "1 piece (max 30g)",
    pairingAvoid: "Sweet juices, deep fried snacks.",
    bestTime: "Evening Snack with unsweetened black tea",
    advice: "Sweeten natural sweets using small amounts of blended dates or figs combined with almonds, cashews, and flaxseeds."
  },
  "soft drinks": {
    original: "Carbonated Cola / Fruit Juices",
    alt: "Buttermilk (Spiced Chaas) or Fresh Lemon Water (Stevia)",
    calories: 140, carbs: 35, protein: 0, fiber: 0, gi: 70,
    altCalories: 35, altCarbs: 3, altProtein: 2.5, altFiber: 0.5, altGi: 15,
    portion: "1 glass (approx. 200ml)",
    pairingAvoid: "Fried snacks or heavy white rice meals.",
    bestTime: "Anytime (cooling hydration helper)",
    advice: "Churn spiced buttermilk using fresh curd, ginger, mint leaves, and a pinch of roasted cumin. It acts as a natural probiotic."
  }
};

const GROCERY_CATEGORIES = {
  Grains: ["Foxtail Millets", "Brown Rice Sona Masoori", "Oats Flour", "Multigrain Flour (Besan, Ragi)", "Quinoa"],
  Vegetables: ["Spinach (Palak)", "Broccoli", "Bitter Gourd (Karela)", "Cucumber", "Ivy Gourd (Dondakaya)", "Tomatoes & Onions"],
  Protein: ["Low-fat Paneer", "Organic Firm Tofu", "Green Moong Dal", "Black Chana (Chickpeas)", "Boiled Chicken Breast / Fish Tikka"],
  Dairy: ["Low-fat Curd", "Unsweetened Almond Milk", "Tone Cow Milk"]
};

const MealPlanner = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'alternatives' | 'grocery'
  const [diabetesType, setDiabetesType] = useState('Type 2');
  const [foodPreference, setFoodPreference] = useState('Vegetarian');
  const [region, setRegion] = useState('South Indian');
  
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState('Breakfast');

  const [selectedMeals, setSelectedMeals] = useState({});
  const [detailMeal, setDetailMeal] = useState(null);

  // Alternatives Finder state
  const [altQuery, setAltQuery] = useState('Biryani');
  const [altResult, setAltResult] = useState(null);

  // Grocery List state
  const [groceryItems, setGroceryItems] = useState([]);
  const [groceryQuantities, setGroceryQuantities] = useState({});
  const [success, setSuccess] = useState('');

  // Pre-fill questionnaire from Profile
  useEffect(() => {
    if (user) {
      setDiabetesType(user.diabetesType || 'Type 2');
      setFoodPreference(user.foodPreference || 'Vegetarian');
      setRegion(user.cuisineStyle || 'South Indian');
    }
  }, [user]);

  const initializeSelection = (plan) => {
    if (!plan) return;
    const initial = {};
    Object.keys(plan).forEach(category => {
      const options = plan[category];
      if (Array.isArray(options) && options.length > 0) {
        initial[category] = options[0].id;
      }
    });
    setSelectedMeals(initial);
  };

  const loadActivePlan = async () => {
    if (!user) return;
    try {
      const res = await api.getMealPlan(user._id);
      if (res.success && res.plan && res.plan.plan) {
        setActivePlan(res.plan.plan);
        initializeSelection(res.plan.plan);
      } else {
        handleGenerate(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadActivePlan();
  }, [user]);

  // Handle Alternatives Search
  const handleAlternativesSearch = (e) => {
    if (e) e.preventDefault();
    const query = altQuery.toLowerCase().trim();
    
    // Simple lookup
    let matchKey = null;
    for (let key in ALTERNATIVES_DB) {
      if (query.includes(key) || key.includes(query)) {
        matchKey = key;
        break;
      }
    }

    if (matchKey && ALTERNATIVES_DB[matchKey]) {
      setAltResult(ALTERNATIVES_DB[matchKey]);
    } else {
      setAltResult({
        original: altQuery,
        alt: "Try Millets / Quinoa cooked with double salad fiber",
        calories: 350, carbs: 48, protein: 8, fiber: 1.5, gi: 75,
        altCalories: 220, altCarbs: 28, altProtein: 12, altFiber: 6.5, altGi: 48,
        portion: "1 standard bowl",
        pairingAvoid: "Refined sugars, sweet chutneys, sugary sodas",
        bestTime: "Lunch time",
        advice: "Avoid processed carbohydrates. Swap with high-fiber grains like oats or millets, and pair with protein (lentils/tofu) to buffer glycemic absorption."
      });
    }
  };

  useEffect(() => {
    handleAlternativesSearch(null);
  }, []);

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.generateMealPlan(user._id, {
        diabetesType,
        foodPreference,
        region
      });
      if (res.success && res.plan && res.plan.plan) {
        setActivePlan(res.plan.plan);
        initializeSelection(res.plan.plan);
      }
    } catch (err) {
      alert('Error generating meal plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compile Grocery List from Active Plan
  useEffect(() => {
    if (!activePlan) return;
    
    // Scan all selected options inside active plan
    const uniqueFoods = new Set();
    Object.keys(activePlan).forEach(category => {
      const options = activePlan[category];
      const selectedId = selectedMeals[category];
      if (options && selectedId) {
        const selectedOption = options.find(o => o.id === selectedId);
        if (selectedOption) {
          uniqueFoods.add(selectedOption.name);
        }
      }
    });

    // Compile list matching Grains, Veggies, Protein, Dairy items based on activePlan names
    const compiledList = [];
    const quantities = {};

    Object.keys(GROCERY_CATEGORIES).forEach(cat => {
      const matches = GROCERY_CATEGORIES[cat].filter(groceryItem => {
        // If active plan has this category of items
        return true; // add all standard categorizations
      });

      matches.forEach(item => {
        compiledList.push({ name: item, category: cat, checked: false });
        quantities[item] = cat === 'Grains' ? "1 kg" : cat === 'Protein' ? "500g" : cat === 'Dairy' ? "1 Liter" : "2 bunches";
      });
    });

    setGroceryItems(compiledList);
    setGroceryQuantities(quantities);
  }, [activePlan, selectedMeals]);

  const handleToggleGrocery = (name) => {
    setGroceryItems(prev => prev.map(item => 
      item.name === name ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleCopyGrocery = () => {
    const text = groceryItems
      .map(item => `[${item.checked ? 'X' : ' '}] ${item.name} (${groceryQuantities[item.name]}) [${item.category}]`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setSuccess('Grocery list copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleExportGrocery = () => {
    const text = groceryItems
      .map(item => `[${item.checked ? 'X' : ' '}] ${item.name} (${groceryQuantities[item.name]})`)
      .join('\n');
    
    const element = document.createElement("a");
    const file = new Blob([`NutriCare Smart Grocery List\nGenerated: ${new Date().toLocaleDateString()}\n\n${text}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "NutriCare_Grocery_List.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getMealTitle = (mealKey) => {
    switch (mealKey) {
      case 'Breakfast': return t("breakfast");
      case 'MorningSnack': return t("morningSnack");
      case 'Lunch': return t("lunch");
      case 'EveningSnack': return t("eveningSnack");
      case 'Dinner': return t("dinner");
      case 'BedtimeSnack': return t("bedtimeSnack");
      default: return mealKey;
    }
  };

  const getSelectedOptionName = (category) => {
    const options = activePlan?.[category];
    const selectedId = selectedMeals[category];
    if (options && selectedId) {
      const match = options.find(o => o.id === selectedId);
      return match ? match.name : '';
    }
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Utensils size={28} style={{ color: 'var(--primary)' }} />
          <h1>AI Nutrition & Meal Planner</h1>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('planner')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
              background: activeTab === 'planner' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'planner' ? '#fff' : 'var(--text-muted)'
            }}
          >
            AI Planner
          </button>
          <button 
            onClick={() => setActiveTab('alternatives')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
              background: activeTab === 'alternatives' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'alternatives' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Alternatives Finder
          </button>
          <button 
            onClick={() => setActiveTab('grocery')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
              background: activeTab === 'grocery' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'grocery' ? '#fff' : 'var(--text-muted)'
            }}
          >
            Smart Grocery
          </button>
        </div>
      </div>

      {success && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(76,175,80,0.15)', color: '#2E7D32', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* TAB 1: AI MEAL PLANNER ENGINE */}
      {activeTab === 'planner' && (
        <>
          {/* Settings Card */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              Configure AI Meal Engine
            </h3>

            <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }} className="grid-4">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t("diabetesType")}</label>
                <select className="form-select" value={diabetesType} onChange={(e) => setDiabetesType(e.target.value)}>
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="Gestational">Gestational</option>
                  <option value="Prediabetes">Prediabetes</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t("foodPreference")}</label>
                <select className="form-select" value={foodPreference} onChange={(e) => setFoodPreference(e.target.value)}>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cuisine Style</label>
                <select className="form-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="South Indian">South Indian</option>
                  <option value="North Indian">North Indian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Western">Western</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }} disabled={loading}>
                <RefreshCw size={18} className={loading ? 'pulse-animation' : ''} />
                <span>Regenerate Meal Plan</span>
              </button>
            </form>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Computing Balanced Glycemic Ratios...</h2>
              <p style={{ color: 'var(--text-muted)' }}>AI is selecting diabetic-safe meal options for your profile.</p>
            </div>
          )}

          {activePlan && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }} className="grid-2">
              {/* Left panel: Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.keys(activePlan).map((mealKey) => {
                  const isSelected = expandedMeal === mealKey;
                  const chosenMealName = getSelectedOptionName(mealKey);
                  return (
                    <div
                      key={mealKey}
                      onClick={() => setExpandedMeal(mealKey)}
                      className="card"
                      style={{
                        padding: '1rem', cursor: 'pointer',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        background: isSelected ? 'var(--secondary-light)' : 'var(--bg-card)',
                        display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                          {mealKey.toUpperCase()}
                        </span>
                        {chosenMealName && <CheckCircle size={16} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)' }}>
                        {getMealTitle(mealKey)}
                      </strong>
                      {chosenMealName && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95%' }}>
                          {chosenMealName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right panel: Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)', margin: 0 }}>
                    Meal Options for {getMealTitle(expandedMeal)}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {activePlan[expandedMeal]?.map((option) => {
                    const isSelected = selectedMeals[expandedMeal] === option.id;
                    return (
                      <div 
                        key={option.id}
                        className="card"
                        style={{
                          display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0,
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)'
                        }}
                      >
                        <div style={{ width: '100%', height: '150px', position: 'relative' }}>
                          <img src={option.image} alt={option.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                            <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                              {option.calories} kcal
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-main)', margin: 0, fontWeight: 'bold', lineHeight: 1.4 }}>
                            {option.name}
                          </h3>

                          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                            {option.description}
                          </p>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.7rem', fontWeight: 600 }}>
                            <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-app)', color: 'var(--text-muted)', borderRadius: '4px' }}>
                              P: {option.protein}g
                            </span>
                            <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-app)', color: 'var(--text-muted)', borderRadius: '4px' }}>
                              C: {option.carbs}g
                            </span>
                            <span style={{ padding: '0.2rem 0.4rem', background: 'var(--bg-app)', color: 'var(--text-muted)', borderRadius: '4px' }}>
                              F: {option.fiber}g fiber
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => setDetailMeal(option)}
                              className="btn btn-outline"
                              style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem' }}
                            >
                              <BookOpen size={14} />
                              <span>Recipe</span>
                            </button>
                            <button
                              onClick={() => setSelectedMeals(prev => ({ ...prev, [expandedMeal]: option.id }))}
                              className="btn"
                              style={{
                                flex: 1, fontSize: '0.7rem', padding: '0.4rem',
                                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                                color: isSelected ? '#fff' : 'var(--text-main)',
                                border: isSelected ? 'none' : '1px solid var(--border)'
                              }}
                            >
                              {isSelected ? '✓ Selected' : 'Choose'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: SMART INDIAN FOOD ALTERNATIVES */}
      {activeTab === 'alternatives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shuffle size={20} style={{ color: 'var(--primary)' }} />
              Diabetic-Safe Indian Alternatives
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Type standard high-carb foods (e.g., Biryani, Dosa, Gulab Jamun) to find low-GI healthy alternatives.
            </p>

            <form onSubmit={handleAlternativesSearch} style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Biryani, Pizza, Dosa, Gulab Jamun..." 
                  value={altQuery}
                  onChange={(e) => setAltQuery(e.target.value)}
                  style={{ paddingLeft: '38px', height: '38px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>
                Find Alternatives
              </button>
            </form>
          </div>

          {/* Alternatives Result Card */}
          {altResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="grid-2 animate-fade-in">
              
              {/* Left detail card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#D32F2F', fontWeight: 'bold', textTransform: 'uppercase' }}>High Glycemic Risk Food</span>
                  <h2 style={{ fontSize: 'var(--font-lg)', margin: '0.2rem 0', color: '#C62828' }}>{altResult.original}</h2>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
                    Macros: <strong>{altResult.calories} kcal</strong> | Carbs: <strong>{altResult.carbs}g</strong> | GI: <strong>{altResult.gi} (High)</strong>
                  </p>
                </div>

                <div style={{ background: 'var(--accent-light)', borderLeft: '5px solid var(--accent)', padding: '1rem', borderRadius: '0 12px 12px 0' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>
                    💡 Suggested Diabetic Alternative
                  </span>
                  <h3 style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)', margin: '0.2rem 0' }}>{altResult.alt}</h3>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
                    Macros: <strong style={{ color: '#2E7D32' }}>{altResult.altCalories} kcal</strong> | Carbs: <strong>{altResult.altCarbs}g</strong> | Fiber: <strong>{altResult.altProtein}g</strong> | GI: <strong style={{ color: '#2E7D32' }}>{altResult.altGi} (Low)</strong>
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-xs)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div>
                    <span style={{ display: 'block', color: 'var(--text-muted)' }}>Portion Sizing</span>
                    <strong>{altResult.portion}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', color: 'var(--text-muted)' }}>Best Eating Time</span>
                    <strong>{altResult.bestTime}</strong>
                  </div>
                </div>
              </div>

              {/* Right clinical pairing card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--secondary-light)', borderColor: 'rgba(2, 136, 209, 0.15)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-sm)', color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Info size={18} />
                    Clinical Dietitian Advice
                  </h3>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                    {altResult.advice}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(2, 136, 209, 0.2)', paddingTop: '0.75rem', fontSize: 'var(--font-xs)' }}>
                  <span style={{ display: 'block', color: '#D32F2F', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                    ⚠️ Avoid Pairing With
                  </span>
                  <span style={{ color: 'var(--text-main)' }}>{altResult.pairingAvoid}</span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: SMART GROCERY LIST */}
      {activeTab === 'grocery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header actions card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-md)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
                Smart Shopping Checklist
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Automatically compiled from your active selected AI meals.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }} onClick={handleCopyGrocery}>
                <Copy size={14} />
                <span>Copy List</span>
              </button>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }} onClick={handleExportGrocery}>
                <Download size={14} />
                <span>Download TXT</span>
              </button>
            </div>
          </div>

          {/* Grocery items checklist splits */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Object.keys(GROCERY_CATEGORIES).map(cat => {
              const itemsInCat = groceryItems.filter(item => item.category === cat);
              if (itemsInCat.length === 0) return null;
              return (
                <div key={cat} className="card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    color: cat === 'Grains' ? 'var(--primary)' : cat === 'Protein' ? 'var(--accent)' : cat === 'Dairy' ? 'var(--secondary)' : '#6D4C41',
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px', 
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '0.5rem', 
                    marginBottom: '0.75rem' 
                  }}>
                    {cat}
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {itemsInCat.map(item => (
                      <label 
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: 'var(--font-xs)',
                          color: item.checked ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: item.checked ? 'line-through' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          onChange={() => handleToggleGrocery(item.name)} 
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span style={{ flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          {groceryQuantities[item.name]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nutritional Shopping Summary */}
          <div className="card" style={{ background: 'var(--secondary-light)', border: '1px solid rgba(2, 136, 209, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={18} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', fontWeight: 500 }}>
                This shopping cart supports low Glycemic Index (GI) and high dietary fiber absorption. Ideal for metabolic score target.
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', fontSize: 'var(--font-xs)' }}>
              <span>Total Estimated Protein: <strong>~180g</strong></span>
              <span>Total Dietary Fiber: <strong>~45g</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* Recipe details modal popup */}
      {detailMeal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto',
            position: 'relative', padding: '1.75rem', animation: 'slideUp 0.3s ease-out'
          }}>
            <button 
              onClick={() => setDetailMeal(null)}
              style={{
                position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            <img 
              src={detailMeal.image} 
              alt={detailMeal.name} 
              style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' }} 
            />

            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              DIABETIC RECIPE & CLINICAL ADVANTAGES
            </span>
            <h2 style={{ fontSize: 'var(--font-md)', margin: '0.2rem 0 0.75rem 0', color: 'var(--text-main)' }}>
              {detailMeal.name}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', background: 'var(--bg-app)', padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem', fontSize: 'var(--font-xs)' }}>
              <div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Calories</span>
                <strong>{detailMeal.calories} kcal</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Protein</span>
                <strong>{detailMeal.protein}g</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Carbs</span>
                <strong>{detailMeal.carbs}g</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Fiber</span>
                <strong>{detailMeal.fiber}g</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: 'var(--font-xs)' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>Ingredients</strong>
                <span style={{ color: 'var(--text-muted)' }}>{detailMeal.ingredients}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>Instructions</strong>
                <span style={{ color: 'var(--text-muted)' }}>{detailMeal.instructions}</span>
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>Clinical Benefits</strong>
                <span style={{ color: 'var(--text-muted)' }}>{detailMeal.benefits}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MealPlanner;
