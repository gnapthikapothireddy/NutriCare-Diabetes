import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldAlert, Phone, MapPin, Copy, ExternalLink, Heart, 
  Navigation, Search, RefreshCw, AlertCircle, CheckCircle2, 
  Loader2, Compass 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Haversine distance calculator between two lat/lon points in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Emergency = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const [sosTriggered, setSosTriggered] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Geolocation & Real-Time Hospitals State ──────────────────────────────
  // Initialized to null: No hardcoded coordinates or fallback locations!
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [hospitals, setHospitals] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [hospitalError, setHospitalError] = useState(null);

  // Leaflet Map Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const watchIdRef = useRef(null);
  const lastFetchedCoordsRef = useRef({ lat: null, lon: null });

  // ─── Query Nominatim API STRICTLY within a 20km Bounding Box ─────────────
  const fetchNominatimWithinBox = async (queryTerm, lat, lon) => {
    // ~20 km radius in degrees is approximately 0.18 degrees
    const left = (lon - 0.18).toFixed(6);
    const right = (lon + 0.18).toFixed(6);
    const top = (lat + 0.18).toFixed(6);
    const bottom = (lat - 0.18).toFixed(6);
    
    // bounded=1 and viewbox strictly restrict results to this geographical box
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryTerm)}&viewbox=${left},${top},${right},${bottom}&bounded=1&addressdetails=1&limit=25`;
    
    try {
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'NutriCareDiabetesApp/1.0' }, 
        signal: AbortSignal.timeout(8000) 
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      
      return data.map((elem, idx) => {
        const hLat = parseFloat(elem.lat);
        const hLon = parseFloat(elem.lon);
        if (isNaN(hLat) || isNaN(hLon)) return null;
        
        const dist = calculateDistance(lat, lon, hLat, hLon);
        // Strictly ignore any result outside 20 km
        if (dist > 20) return null;

        const name = elem.name || elem.display_name?.split(',')[0] || 'Medical Center / Hospital';
        const address = elem.display_name?.split(',').slice(1, 4).join(', ').trim() || `Medical Facility (${dist.toFixed(1)} km away)`;
        
        return {
          id: `nom-${elem.place_id || idx}-${Math.random()}`,
          name,
          lat: hLat,
          lon: hLon,
          address,
          phone: '+91 108 / 112 (Emergency)',
          distance: `${dist.toFixed(1)} km`,
          distanceVal: dist
        };
      }).filter(Boolean);
    } catch (err) {
      console.warn(`[NutriCare Debug] Nominatim query '${queryTerm}' failed:`, err);
      return [];
    }
  };

  // ─── Query Overpass API within 15-20km radius ────────────────────────────
  const fetchOverpassAround = async (lat, lon) => {
    const query = `[out:json][timeout:12];(node["amenity"="hospital"](around:20000,${lat},${lon});way["amenity"="hospital"](around:20000,${lat},${lon});node["healthcare"="hospital"](around:20000,${lat},${lon});node["amenity"="clinic"](around:15000,${lat},${lon}););out center 30;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !data.elements) return [];
      
      return data.elements.map(elem => {
        const hLat = elem.lat || elem.center?.lat;
        const hLon = elem.lon || elem.center?.lon;
        if (!hLat || !hLon) return null;
        
        const dist = calculateDistance(lat, lon, hLat, hLon);
        // Strictly ignore any result outside 20 km
        if (dist > 20) return null;

        const name = elem.tags?.name || elem.tags?.['name:en'] || elem.tags?.['healthcare:speciality'] || 'Emergency Medical Hospital & ER';
        const street = elem.tags?.['addr:street'] || elem.tags?.['addr:full'] || '';
        const city = elem.tags?.['addr:city'] || elem.tags?.['addr:suburb'] || '';
        const address = [street, city].filter(Boolean).join(', ') || `Medical Facility (${dist.toFixed(1)} km away)`;
        const phone = elem.tags?.['contact:phone'] || elem.tags?.phone || elem.tags?.['emergency:phone'] || elem.tags?.['contact:mobile'] || '+91 108 / 112';

        return {
          id: `ov-${elem.id || Math.random()}`,
          name,
          lat: hLat,
          lon: hLon,
          address,
          phone,
          distance: `${dist.toFixed(1)} km`,
          distanceVal: dist
        };
      }).filter(Boolean);
    } catch (err) {
      console.warn("[NutriCare Debug] Overpass API failed:", err);
      return [];
    }
  };

  // ─── Fetch Nearby Hospitals (Strictly within 10-20km radius) ─────────────
  const fetchNearbyHospitals = useCallback(async (lat, lon) => {
    setIsLoadingHospitals(true);
    setHospitalError(null);
    console.log(`[NutriCare Debug] Fetching hospitals strictly within 20km for coordinates: lat=${lat}, lon=${lon}`);

    try {
      // 1. Fetch from Overpass API
      const overpassResults = await fetchOverpassAround(lat, lon);
      console.log(`[NutriCare Debug] Overpass API returned ${overpassResults.length} facilities within 20km.`);

      let combined = [...overpassResults];

      // 2. If Overpass returned fewer than 5 results, supplement with Nominatim bounded search
      if (combined.length < 5) {
        const nomHospitals = await fetchNominatimWithinBox('hospital', lat, lon);
        const nomClinics = await fetchNominatimWithinBox('clinic', lat, lon);
        console.log(`[NutriCare Debug] Nominatim bounded search returned ${nomHospitals.length} hospitals and ${nomClinics.length} clinics.`);
        
        const nomResults = [...nomHospitals, ...nomClinics];
        
        // Deduplicate facilities that are within 150 meters of each other
        for (const item of nomResults) {
          if (!combined.some(c => calculateDistance(c.lat, c.lon, item.lat, item.lon) < 0.15)) {
            combined.push(item);
          }
        }
      }

      // 3. STRICT FILTER: Guarantee no hospital outside 20 km is ever included
      combined = combined.filter(h => h.distanceVal <= 20);

      // 4. Sort ascending by nearest distance
      combined.sort((a, b) => a.distanceVal - b.distanceVal);

      console.log(`[NutriCare Debug] Final sorted nearby hospitals (${combined.length}):`, combined);

      if (combined.length === 0) {
        setHospitalError("No hospitals or trauma centers found within a 20 km radius of your location. Please try searching for a nearby major city or PIN code.");
      }

      setHospitals(combined);
    } catch (err) {
      console.error("[NutriCare Debug] Error fetching hospitals:", err);
      setHospitalError("Failed to fetch nearby hospitals. Please check your internet connection or try searching by city/PIN code.");
      setHospitals([]);
    } finally {
      setIsLoadingHospitals(false);
    }
  }, []);

  // ─── Initialize Geolocation Tracking (Real-Time GPS) ──────────────────────
  const initLocationTracking = useCallback(() => {
    setIsLoadingLocation(true);
    setLocationError(null);
    setHospitalError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Please search manually by city or PIN code below.");
      setIsLoadingLocation(false);
      setUserLocation(null);
      return;
    }

    console.log("[NutriCare GPS Debug] Requesting browser getCurrentPosition permission...");

    // 1. Request real-time GPS coordinates
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("[NutriCare GPS Debug] Real-time location detected successfully:", { latitude, longitude });
        
        setUserLocation({ 
          lat: latitude, 
          lon: longitude, 
          address: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 
          source: 'gps' 
        });
        setIsLoadingLocation(false);
        lastFetchedCoordsRef.current = { lat: latitude, lon: longitude };
        fetchNearbyHospitals(latitude, longitude);
      },
      (err) => {
        console.warn("[NutriCare GPS Debug] Geolocation permission denied or failed:", err);
        setIsLoadingLocation(false);
        setLocationError("Location permission denied or unavailable. Please enter your City or PIN code below to search manually.");
        // DO NOT use hardcoded coordinates or fallback locations!
        setUserLocation(null);
        setHospitals([]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    // 2. Watch position for real-time updates as user moves
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const last = lastFetchedCoordsRef.current;
        // If moved by more than ~200 meters (0.002 degrees), automatically update and refetch
        if (!last.lat || calculateDistance(last.lat, last.lon, latitude, longitude) > 0.2) {
          console.log("[NutriCare GPS Debug] Significant GPS movement detected. New coords:", { latitude, longitude });
          lastFetchedCoordsRef.current = { lat: latitude, lon: longitude };
          setUserLocation({ 
            lat: latitude, 
            lon: longitude, 
            address: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Updated)`, 
            source: 'gps' 
          });
          fetchNearbyHospitals(latitude, longitude);
        }
      },
      (err) => {
        console.warn("[NutriCare GPS Debug] watchPosition error:", err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, [fetchNearbyHospitals]);

  useEffect(() => {
    initLocationTracking();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [initLocationTracking]);

  // ─── Manual Search by City or PIN Code ────────────────────────────────────
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setLocationError(null);
    setHospitalError(null);
    console.log(`[NutriCare Debug] Manual location search triggered for: "${searchQuery.trim()}"`);
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`, {
        headers: { 'User-Agent': 'NutriCareDiabetesApp/1.0' }
      });
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        console.log(`[NutriCare Debug] Manual search resolved to coordinates:`, { latitude, longitude, display_name });
        
        setUserLocation({
          lat: latitude,
          lon: longitude,
          address: display_name.split(',').slice(0, 3).join(', '),
          source: 'manual'
        });
        
        lastFetchedCoordsRef.current = { lat: latitude, lon: longitude };
        await fetchNearbyHospitals(latitude, longitude);
      } else {
        console.warn(`[NutriCare Debug] Manual search found no coordinates for: "${searchQuery.trim()}"`);
        setLocationError(`Could not find location for "${searchQuery}". Please try another city name or postal PIN code.`);
      }
    } catch (err) {
      console.error("[NutriCare Debug] Manual search error:", err);
      setLocationError("Error searching location. Please check your internet connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // ─── Leaflet Map Rendering & Marker Updates ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    
    // Initialize map if not already created
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([userLocation.lat, userLocation.lon], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    } else {
      // Animate view to new user location
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 13, { animate: true });
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 1. Add User Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="background: #2196F3; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 15px rgba(33, 150, 243, 0.9); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>📍 Your Location</b><br/>${userLocation.address}`);
    
    markersRef.current.push(userMarker);

    // 2. Add Hospital Markers
    const hospitalIcon = L.divIcon({
      className: 'custom-hosp-marker',
      html: `<div style="background: #E53935; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(229, 57, 53, 0.6); display: flex; align-items: center; justify-content: center; font-size: 16px;">🏥</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });

    hospitals.forEach(hosp => {
      const marker = L.marker([hosp.lat, hosp.lon], { icon: hospitalIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 210px; padding: 4px; font-family: sans-serif;">
            <strong style="color: #E53935; font-size: 14px; display: block; margin-bottom: 4px;">🏥 ${hosp.name}</strong>
            <span style="font-size: 12px; color: #555; display: block; margin-bottom: 4px;">📍 ${hosp.address}</span>
            <span style="font-size: 12px; font-weight: bold; color: #2E7D32; display: block; margin-bottom: 8px;">📏 Distance: ${hosp.distance}</span>
            <div style="display: flex; gap: 8px; margin-top: 6px;">
              <a href="https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${hosp.lat},${hosp.lon}" target="_blank" rel="noopener noreferrer" style="background: #2196F3; color: white; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">🗺️ Directions</a>
              <a href="tel:${hosp.phone.replace(/\s+/g, '')}" style="background: #E53935; color: white; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">📞 Call</a>
            </div>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds if we have hospitals
    if (hospitals.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
    }

  }, [userLocation, hospitals]);

  // Clean up Leaflet map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ─── SOS Trigger & Profile Handlers ───────────────────────────────────────
  const handleSosTrigger = () => {
    setSosTriggered(true);
    confetti({ particleCount: 80, colors: ['#E53935', '#ff1744'], spread: 90 });
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = language === 'te' 
        ? "అత్యవసర హెచ్చరిక సక్రియం చేయబడింది. దయచేసి సమీపంలోని ఆసుపత్రిని సంప్రదించండి."
        : language === 'hi'
          ? "आपातकालीन चेतावनी सक्रिय है। कृपया निकटतम अस्पताल से संपर्क करें।"
          : "Emergency distress alert activated. Please view clinical instructions or contact nearest emergency center.";
      const utterance = new SpeechSynthesisUtterance(text);
      const localeMap = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };
      utterance.lang = localeMap[language] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const getHealthSummaryText = () => {
    return `**NUTRICARE EMERGENCY HEALTH PROFILE**
Patient Name: ${user?.name || 'Not specified'}
Age/Gender: ${user?.age || '--'} / ${user?.gender || '--'}
Diabetes Type: ${user?.diabetesType || 'Type 2'}
Blood Group: ${user?.bloodGroup || 'O+'}
Allergies: ${user?.allergies || 'None'}
Doctor Name: ${user?.doctorName || 'Self Care'}
Emergency Contact Phone: ${user?.emergencyContact || 'Not specified'}
Location: ${userLocation?.address || user?.city || ''}`;
  };

  const handleCopySummary = () => {
    const text = getHealthSummaryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldAlert size={28} style={{ color: '#E53935' }} />
        <h1 style={{ color: '#E53935' }}>{t("emergency")}</h1>
      </div>

      {!sosTriggered ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
          {/* Big SOS Button Column */}
          <div 
            className="card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center',
              padding: '3rem 2rem',
              border: '2px solid rgba(229, 57, 53, 0.2)'
            }}
          >
            <button
              onClick={handleSosTrigger}
              className="pulse-animation"
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: '#E53935',
                color: '#fff',
                border: 'none',
                boxShadow: '0 12px 35px rgba(229, 57, 53, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '1px'
              }}
            >
              <ShieldAlert size={40} style={{ marginBottom: '0.25rem' }} />
              TRIGGER SOS
            </button>

            {/* Subtle heartbeat waveform decoration */}
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 30" style={{ width: '120px', height: '30px', opacity: 0.45, stroke: '#E53935', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L53,10 L56,20 L59,15 L100,15" />
              </svg>
            </div>

            <h3 style={{ marginTop: '0.75rem', color: '#E53935', fontSize: 'var(--font-md)' }}>
              Press in case of Emergency
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              Instantly compile clinical profile card, read acute guidelines, and find local trauma medical clinics.
            </p>
          </div>

          {/* Normal Guidelines Column */}
          <div className="card">
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Emergency Glucose Guidelines
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <strong style={{ color: '#E53935', fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem' }}>
                  Hypoglycemia (Glucose &lt; 70 mg/dL)
                </strong>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Follow the <strong>15-15 Rule</strong>: Eat/Drink 15 grams of fast-acting sugar (e.g. 1/2 cup fruit juice, 3-4 sugar candies, 1 tablespoon honey). Wait 15 minutes. Recheck sugar. If still below 70 mg/dL, repeat.
                </p>
              </div>

              <div>
                <strong style={{ color: '#EF6C00', fontSize: 'var(--font-sm)', display: 'block', marginBottom: '0.25rem' }}>
                  Hyperglycemia (Glucose &gt; 250 mg/dL)
                </strong>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Drink plenty of sugar-free fluids (water) to avoid ketoacidosis dehydration. Test urine ketones if possible. Administer doctor-prescribed correction insulin bolus. If vomiting or hyperventilating, seek immediate ER care.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SOS Triggered Distress Dashboard */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div 
            style={{
              background: 'rgba(229, 57, 53, 0.1)',
              border: '2px solid #E53935',
              padding: '1.25rem',
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={28} style={{ color: '#E53935' }} className="pulse-animation" />
              <div>
                <h3 style={{ margin: 0, color: '#E53935', fontSize: 'var(--font-md)' }}>SOS Emergency Active</h3>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)' }}>Distress profile generated. Share details with doctors or caregivers immediately.</span>
              </div>
            </div>
            <button 
              className="btn btn-outline" 
              style={{ color: '#E53935', borderColor: '#E53935', padding: '0.4rem 1rem' }}
              onClick={() => setSosTriggered(false)}
            >
              Cancel Distress Mode
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }} className="grid-2">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-md)', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Patient Medical Card
                </h3>
                
                <table style={{ width: '100%', fontSize: 'var(--font-xs)', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Name</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>{user?.name}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Class</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>{user?.diabetesType}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Blood Group</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>{user?.bloodGroup}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Allergies</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600, color: '#E53935' }}>{user?.allergies || 'None'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Doctor Contact</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>{user?.doctorName}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>Emergency Contact</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600, color: '#E53935' }}>{user?.emergencyContact}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleCopySummary}
              >
                <Copy size={16} />
                <span>{copied ? 'Copied Details!' : 'Copy Details to SMS'}</span>
              </button>
            </div>

            <div className="card" style={{ background: '#FFF3E0', border: '1px solid rgba(255, 152, 0, 0.2)' }}>
              <h3 style={{ color: '#EF6C00', fontSize: 'var(--font-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={20} />
                Critical First-Aid Actions
              </h3>
              
              <ul style={{ fontSize: 'var(--font-xs)', color: 'var(--text-main)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 0 }}>
                <li><strong>Confirm state of consciousness:</strong> If the patient is confused or fainting, do not administer fluids/food by mouth. Check if glucagon injection is available.</li>
                <li><strong>Check sugar level immediately:</strong> Log the value if possible. If reading is below 70, give 1/2 glass fruit juice.</li>
                <li><strong>Call Emergency Contacts:</strong> Call <strong>{user?.emergencyContact || '911'}</strong> immediately or click nearby hospital contact numbers below.</li>
                <li><strong>Ketones audit:</strong> If sugar is above 250, request urine ketone test kit. Drink water continuously.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── REAL-TIME HOSPITAL FINDER & LEAFLET MAPS PANEL ──────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-main)' }}>
              <MapPin size={22} style={{ color: '#E53935' }} />
              Local Hospitals & Trauma Centers
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isLoadingLocation ? 'Detecting real-time GPS location...' : userLocation ? `Active Location: ${userLocation.address}` : 'Waiting for GPS permission or manual search...'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userLocation && (
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.3rem 0.7rem', 
                borderRadius: '20px', 
                background: userLocation.source === 'gps' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                color: userLocation.source === 'gps' ? '#2E7D32' : '#1976D2',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                {userLocation.source === 'gps' ? <CheckCircle2 size={13} /> : <Compass size={13} />}
                {userLocation.source === 'gps' ? 'Live GPS Active' : 'Manual City Search'}
              </span>
            )}

            <button 
              onClick={() => {
                if (userLocation?.source === 'manual') {
                  fetchNearbyHospitals(userLocation.lat, userLocation.lon);
                } else {
                  initLocationTracking();
                }
              }}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Refresh Location & Hospitals"
            >
              <RefreshCw size={14} className={isLoadingHospitals || isLoadingLocation ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Bar for City / PIN Code if Permission Denied or Manual Search Desired */}
        <div style={{ marginBottom: '1.25rem' }}>
          <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by City or PIN code (e.g., Hyderabad, Mumbai, 500033, New Delhi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem 0.6rem 2.2rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSearching}
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{isSearching ? 'Searching...' : 'Find Hospitals'}</span>
            </button>
          </form>
        </div>

        {/* Error / Warning Banners */}
        {locationError && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            borderRadius: '10px', 
            background: 'rgba(255, 152, 0, 0.1)', 
            border: '1px solid #FF9800', 
            color: '#EF6C00', 
            fontSize: '0.8rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{locationError}</span>
            </div>
            <button 
              onClick={initLocationTracking} 
              style={{ background: 'transparent', border: '1px solid #EF6C00', color: '#EF6C00', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Retry GPS
            </button>
          </div>
        )}

        {hospitalError && (
          <div style={{ 
            padding: '0.75rem 1rem', 
            borderRadius: '10px', 
            background: 'rgba(33, 150, 243, 0.1)', 
            border: '1px solid #2196F3', 
            color: '#1976D2', 
            fontSize: '0.8rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{hospitalError}</span>
          </div>
        )}

        {/* Interactive Leaflet Map Container or Permission Prompt */}
        {!userLocation ? (
          <div style={{ 
            height: '380px', 
            width: '100%', 
            background: 'var(--bg-app)', 
            border: '2px dashed var(--border)', 
            borderRadius: '16px', 
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            gap: '1rem',
            color: 'var(--text-main)'
          }}>
            <MapPin size={48} style={{ color: '#E53935', opacity: 0.8 }} />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Waiting for Location Permission</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px' }}>
                Please allow browser GPS access when prompted, or manually enter your City / PIN code above to find nearby emergency hospitals within 10–20 km.
              </p>
            </div>
            <button 
              onClick={initLocationTracking} 
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Compass size={16} />
              <span>Request GPS Permission</span>
            </button>
          </div>
        ) : (
          <div 
            style={{ 
              height: '380px', 
              width: '100%', 
              background: 'var(--bg-app)', 
              border: '2px solid var(--border)', 
              borderRadius: '16px', 
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            {/* Leaflet DOM Node */}
            <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

            {/* Loading Spinner Overlay */}
            {(isLoadingHospitals || isLoadingLocation) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                gap: '0.75rem',
                color: 'var(--text-main)'
              }}>
                <Loader2 size={36} className="animate-spin" style={{ color: '#E53935' }} />
                <strong style={{ fontSize: '0.9rem' }}>Scanning nearby hospitals within 20 km...</strong>
              </div>
            )}
          </div>
        )}

        {/* Hospitals Details List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            Nearby Medical & Trauma Facilities ({hospitals.length})
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Strictly within 20 km • Sorted by shortest distance
          </span>
        </div>

        {hospitals.length === 0 && !isLoadingHospitals ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No hospitals found within 20 km of your coordinates. Try searching for a nearby major city or PIN code above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {hospitals.map((hosp) => (
              <div 
                key={hosp.id}
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-app)',
                  borderRadius: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                className="hover-card"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', lineHeight: 1.3 }}>
                      🏥 {hosp.name}
                    </strong>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '12px', 
                      background: 'rgba(46, 125, 50, 0.1)', 
                      color: '#2E7D32', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {hosp.distance}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                    <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--secondary)' }} />
                    <span>{hosp.address}</span>
                  </p>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                    <Phone size={14} style={{ color: '#E53935' }} />
                    <span>Contact: {hosp.phone}</span>
                  </p>
                </div>

                {/* Action Buttons: Directions & Call Now */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${hosp.lat},${hosp.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.35rem', 
                      fontSize: '0.75rem', 
                      padding: '0.45rem',
                      borderColor: '#2196F3',
                      color: '#2196F3',
                      textDecoration: 'none',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}
                  >
                    <Navigation size={13} />
                    <span>Directions</span>
                  </a>

                  <a 
                    href={`tel:${hosp.phone.replace(/\s+/g, '')}`}
                    className="btn"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.35rem', 
                      fontSize: '0.75rem', 
                      padding: '0.45rem',
                      background: '#E53935',
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: 600,
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(229, 57, 53, 0.3)'
                    }}
                  >
                    <Phone size={13} />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Emergency;
