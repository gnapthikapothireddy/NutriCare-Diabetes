import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Database, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const INDIAN_FOODS_DB = [
  // South Indian
  { name: 'Brown Rice Idli', calories: 60, carbs: 12, protein: 2, fat: 0.5, sugar: 0, fiber: 2, gi: 50, suitable: true, qty: '2 Pcs', category: 'South Indian', alternatives: 'Ragi Idli, Oats Idli' },
  { name: 'Regular Rice Idli', calories: 65, carbs: 15, protein: 2, fat: 0.2, sugar: 0.1, fiber: 0.8, gi: 77, suitable: false, qty: '1 Pc', category: 'South Indian', alternatives: 'Brown Rice Idli, Oats Idli' },
  { name: 'Plain Dosa', calories: 120, carbs: 22, protein: 3, fat: 3, sugar: 0.1, fiber: 1.2, gi: 75, suitable: false, qty: '1 Pc', category: 'South Indian', alternatives: 'Ragi Dosa, Moong Dal Pesarattu' },
  { name: 'Moong Dal Pesarattu', calories: 140, carbs: 18, protein: 8, fat: 2, sugar: 0, fiber: 4.5, gi: 45, suitable: true, qty: '1 Pc', category: 'South Indian', alternatives: 'Oats Dosa' },
  { name: 'Ragi Dosa', calories: 110, carbs: 19, protein: 3.5, fat: 1.8, sugar: 0, fiber: 3.8, gi: 55, suitable: true, qty: '1 Pc', category: 'South Indian', alternatives: 'Moong Dal Pesarattu' },
  { name: 'Sambar', calories: 85, carbs: 12, protein: 4, fat: 2.5, sugar: 2, fiber: 3, gi: 48, suitable: true, qty: '1 Small Bowl', category: 'South Indian', alternatives: 'Spinach Dal, Tomato Rasam' },
  { name: 'Tomato Rasam', calories: 40, carbs: 5, protein: 1, fat: 1.5, sugar: 1, fiber: 0.5, gi: 40, suitable: true, qty: '1 Bowl', category: 'South Indian', alternatives: 'Clear Vegetable Soup' },
  { name: 'Brown Rice Sona Masoori', calories: 150, carbs: 32, protein: 3.5, fat: 1, sugar: 0, fiber: 2.8, gi: 50, suitable: true, qty: '1 Cup (Cooked)', category: 'South Indian', alternatives: 'Millets, Cauliflower Rice' },
  { name: 'White Rice Sona Masoori', calories: 170, carbs: 38, protein: 3, fat: 0.4, sugar: 0, fiber: 0.5, gi: 72, suitable: false, qty: '0.5 Cup (Cooked)', category: 'South Indian', alternatives: 'Brown Rice, Foxtail Millet' },
  { name: 'Hyderabadi Chicken Biryani', calories: 490, carbs: 62, protein: 22, fat: 16, sugar: 1.5, fiber: 2, gi: 68, suitable: false, qty: '0.5 Bowl', category: 'South Indian', alternatives: 'Brown Rice Chicken Pulao' },
  
  // North Indian
  { name: 'Wheat Chapati / Roti', calories: 85, carbs: 17, protein: 3, fat: 0.5, sugar: 0.1, fiber: 2.5, gi: 62, suitable: true, qty: '1-2 Pcs', category: 'North Indian', alternatives: 'Multigrain Roti, Missi Roti' },
  { name: 'Missi Roti (Gram Flour)', calories: 110, carbs: 16, protein: 5.5, fat: 2.2, sugar: 0.2, fiber: 3.5, gi: 45, suitable: true, qty: '1-2 Pcs', category: 'North Indian', alternatives: 'Multigrain Roti' },
  { name: 'Tandoori Naan (Maida)', calories: 260, carbs: 48, protein: 7, fat: 5, sugar: 2, fiber: 1.5, gi: 82, suitable: false, qty: 'Avoid', category: 'North Indian', alternatives: 'Tandoori Wheat Roti' },
  { name: 'Yellow Moong Dal (Tadka)', calories: 120, carbs: 16, protein: 7, fat: 3, sugar: 0, fiber: 4, gi: 42, suitable: true, qty: '1 Bowl', category: 'North Indian', alternatives: 'Black Chana Soup' },
  { name: 'Paneer Butter Masala', calories: 280, carbs: 9, protein: 12, fat: 22, sugar: 4, fiber: 1.5, gi: 50, suitable: false, category: 'North Indian', qty: '0.5 Bowl', alternatives: 'Paneer Bhurji with Olive Oil' },
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
  { name: 'Mango (Ripe)', calories: 120, carbs: 28, protein: 1.5, fat: 0.5, sugar: 24, fiber: 2.5, gi: 60, suitable: false, qty: 'Avoid or max 2 slices', category: 'Fruits', alternatives: 'Guava, Green Apple, Papaya' },
  { name: 'Apple (Red)', calories: 80, carbs: 19, protein: 0.5, fat: 0.3, sugar: 14, fiber: 4, gi: 39, suitable: true, qty: '1 Medium', category: 'Fruits', alternatives: 'Guava, Pear' },
  { name: 'Guava (Jamakaya)', calories: 50, carbs: 11, protein: 2, fat: 0.7, sugar: 7, fiber: 5.5, gi: 32, suitable: true, qty: '1 Medium', category: 'Fruits', alternatives: 'Amla, Pomegranate' },
  { name: 'Bitter Gourd (Karela) Fry', calories: 90, carbs: 8, protein: 2, fat: 5, sugar: 0.5, fiber: 3, gi: 24, suitable: true, qty: '1 Bowl', category: 'Vegetables', alternatives: 'Sautéed Ivy Gourd (Dondakaya)' },
  { name: 'Ladies Finger (Okra) Masala', calories: 105, carbs: 10, protein: 2.2, fat: 6, sugar: 1, fiber: 3.2, gi: 28, suitable: true, qty: '1 Bowl', category: 'Vegetables', alternatives: 'Steamed Beans' }
];

const CATEGORIES = ['All', 'South Indian', 'North Indian', 'Dairy', 'Millets', 'Meats & Eggs', 'Fruits', 'Vegetables'];

const FoodDatabase = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const filteredFoods = INDIAN_FOODS_DB.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase()) ||
                          food.alternatives.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || food.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const getGiBadge = (gi) => {
    if (gi <= 55) {
      return <span style={{ color: '#2E7D32', background: '#E8F5E9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Low ({gi})</span>;
    } else if (gi <= 69) {
      return <span style={{ color: '#EF6C00', background: '#FFF3E0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Medium ({gi})</span>;
    } else {
      return <span style={{ color: '#C62828', background: '#FFEBEE', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>High ({gi})</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Database size={28} style={{ color: 'var(--primary)' }} />
        <h1>{t("foodDb")}</h1>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder={t("searchFood")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Categories Carousel */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: selectedCat === cat ? 'var(--primary)' : 'var(--bg-card)',
                color: selectedCat === cat ? '#fff' : 'var(--text-main)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 'var(--font-xs)',
                fontWeight: 600
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredFoods.map((food, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'space-between' }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 'var(--font-md)', margin: 0, color: 'var(--text-main)' }}>{food.name}</h3>
                {food.suitable ? (
                  <CheckCircle2 size={20} style={{ color: '#4CAF50' }} title="Suitable" />
                ) : (
                  <XCircle size={20} style={{ color: '#E53935' }} title="Avoid" />
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{food.category}</span>
            </div>

            {/* Nutrition metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', textAlign: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Cal</span>
                <strong>{food.calories} kcal</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Carbs</span>
                <strong>{food.carbs}g</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Sugar</span>
                <strong style={{ color: food.sugar > 10 ? '#C62828' : 'var(--text-main)' }}>{food.sugar}g</strong>
              </div>
            </div>

            {/* GI details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)' }}>
              <span>{t("gi")}:</span>
              {getGiBadge(food.gi)}
            </div>

            {/* Serving details */}
            <div style={{ fontSize: 'var(--font-xs)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t("recommendedQty")}: </span>
              <strong>{food.qty}</strong>
            </div>

            {/* Alternatives */}
            {!food.suitable && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: '#C62828', fontWeight: 600 }}>Swap with: </span>
                <span style={{ color: 'var(--text-main)' }}>{food.alternatives}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFoods.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No matching foods found in database.
        </div>
      )}
    </div>
  );
};

export default FoodDatabase;
