import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ScanBarcode, AlertOctagon, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

const PACKAGED_PRODUCTS = [
  {
    barcode: '8901499009841',
    name: 'Britannia Marie Gold Biscuits',
    image: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=400&auto=format&fit=crop&q=60',
    sugar: '19.5g', carbs: '74g', protein: '7.5g', calories: '440 kcal',
    rating: 'C',
    ingredients: 'Refined Wheat Flour (Maida), Sugar, Refined Palm Oil, Malt Extract, Milk Solids, Raising Agents.',
    alert: 'Contains refined wheat flour (Maida) and 19.5% sugar. Can cause quick spike in post-prandial blood sugar. Not recommended for daily intake.',
    recommendation: 'Avoid or eat max 1 biscuit with sugar-free tea.',
    suitable: false
  },
  {
    barcode: '8901207040523',
    name: 'Sugar-Free Oats & Ragi Cookies',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=60',
    sugar: '0.2g', carbs: '58g', protein: '9.8g', calories: '390 kcal',
    rating: 'A',
    ingredients: 'Whole Oats, Finger Millet (Ragi), Sorbitol, Wheat Bran, Rice Bran Oil, Soy Protein Isolates.',
    alert: 'Zero added sucrose. Rich in dietary fiber from oats and ragi. Uses diabetic-safe sweeteners in moderate quantities.',
    recommendation: 'Suitable snack option. Recommend limit of 2 cookies per session.',
    suitable: true
  },
  {
    barcode: '8901058002315',
    name: 'Tropicana 100% Mixed Fruit Juice',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&auto=format&fit=crop&q=60',
    sugar: '13.8g', carbs: '14.5g', protein: '0.4g', calories: '60 kcal',
    rating: 'D',
    ingredients: 'Concentrated Apple Juice, Orange Juice, Grape Juice, Pineapple Juice, Banana Puree.',
    alert: 'Warning: Although labeled 100% juice, it lacks fiber and contains high levels of concentrated natural sugars (13.8g per 100ml) which enter the bloodstream immediately.',
    recommendation: 'AVOID. Eat whole fruits instead (e.g. orange or apple) for healthy fiber content.',
    suitable: false
  },
  {
    barcode: '8901725181220',
    name: 'Kurkure Masala Munch',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?w=400&auto=format&fit=crop&q=60',
    sugar: '2.5g', carbs: '56.3g', protein: '5.8g', calories: '558 kcal',
    rating: 'F',
    ingredients: 'Meal (Corn, Rice, Gram), Edible Vegetable Oil (Palmolein), Seasoning, Salt, Condiments.',
    alert: 'Danger: Extremely high sodium content and palm oil. Highly processed starches with high glycemic index. Promotes arterial inflammation and insulin resistance.',
    recommendation: 'AVOID completely.',
    suitable: false
  }
];

const BarcodeScanner = () => {
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [activeCode, setActiveCode] = useState('');
  const [productResult, setProductResult] = useState(null);

  const triggerScan = (prod) => {
    setActiveCode(prod.barcode);
    setScanning(true);
    setProductResult(null);

    setTimeout(() => {
      setScanning(false);
      setProductResult(prod);
    }, 2000);
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'A': return '#2E7D32'; // Green
      case 'B': return '#4CAF50'; // Light Green
      case 'C': return '#FBC02D'; // Yellow
      case 'D': return '#F57C00'; // Orange
      case 'F': return '#D32F2F'; // Red
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: 'var(--font-xl)', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ScanBarcode size={24} style={{ color: 'var(--primary)' }} />
        {t("barcode")}
      </h2>

      {!activeCode && (
        <div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Select a packaged grocery item to scan its barcode and review the AI-assisted Glycemic Risk & Ingredient analysis.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {PACKAGED_PRODUCTS.map((prod) => (
              <div 
                key={prod.barcode}
                onClick={() => triggerScan(prod)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                className="barcode-item-row"
              >
                <ScanBarcode size={32} style={{ color: 'var(--secondary)' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-main)' }}>{prod.name}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Barcode: {prod.barcode}</span>
                </div>
                <div style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--bg-card)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Scan →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulated Scanner Screen */}
      {activeCode && scanning && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0' }}>
          <div 
            style={{ 
              width: '300px', 
              height: '150px', 
              border: '2px dashed var(--secondary)',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Holographic Barcode */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7].map((w, idx) => (
                <div key={idx} style={{ width: `${w}px`, height: '80px', background: '#fff' }} />
              ))}
            </div>
            {/* Moving red scanning laser */}
            <div 
              style={{
                width: '100%',
                height: '3px',
                background: '#ff1744',
                boxShadow: '0 0 10px #ff1744, 0 0 15px #ff1744',
                position: 'absolute',
                top: 0,
                left: 0,
                animation: 'barcodeLaser 2s linear infinite'
              }}
            />
          </div>
          <span style={{ marginTop: '1.25rem', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>
            Reading barcode: {activeCode}...
          </span>
        </div>
      )}

      {/* Scan Result Info */}
      {productResult && !scanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)' }}>{productResult.name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPC: {productResult.barcode}</span>
            </div>
            <div 
              style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '50%', 
                background: getRatingColor(productResult.rating),
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
              title="Nutriscore Grade"
            >
              {productResult.rating}
            </div>
          </div>

          {/* Macro grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("calories")}</span>
              <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>{productResult.calories}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("carbs")}</span>
              <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>{productResult.carbs}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("sugar")}</span>
              <strong style={{ fontSize: 'var(--font-xs)', color: productResult.suitable ? 'var(--text-main)' : '#C62828' }}>{productResult.sugar}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{t("protein")}</span>
              <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>{productResult.protein}</strong>
            </div>
          </div>

          {/* Ingredients list */}
          <div>
            <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', display: 'block', marginBottom: '0.2rem' }}>
              {t("ingredients")}:
            </strong>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
              {productResult.ingredients}
            </p>
          </div>

          {/* Health warnings */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              padding: '0.85rem', 
              borderRadius: '10px', 
              background: productResult.suitable ? 'rgba(76, 175, 80, 0.1)' : 'rgba(229, 57, 53, 0.08)',
              borderLeft: `4px solid ${productResult.suitable ? '#4CAF50' : '#E53935'}`,
              alignItems: 'flex-start'
            }}
          >
            {productResult.suitable ? (
              <ShieldCheck size={20} style={{ color: '#4CAF50', flexShrink: 0 }} />
            ) : (
              <AlertOctagon size={20} style={{ color: '#E53935', flexShrink: 0 }} />
            )}
            <div>
              <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', display: 'block', marginBottom: '0.2rem' }}>
                AI Analysis Alert:
              </strong>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {productResult.alert}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <strong style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', display: 'block', marginBottom: '0.2rem' }}>
              {t("recommendation")}:
            </strong>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              {productResult.recommendation}
            </p>
          </div>

          <button className="btn btn-outline" onClick={() => setProductResult(null)}>
            Scan Another Packaged Food
          </button>
        </div>
      )}

      {/* Keyframes for laser animation */}
      <style>{`
        @keyframes barcodeLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .barcode-item-row:hover {
          transform: scale(1.015);
          border-color: var(--secondary);
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
