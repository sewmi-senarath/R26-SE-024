import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Save, CheckSquare, Square, AlertCircle, RefreshCw, Radar } from 'lucide-react';
import RadarView from './RadarView';

// Fix for leaflet marker icon missing in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.setView([position.lat, position.lng], 15, { animate: true });
    }
  }, [position, map]);
  return null;
}

const GeofenceSettings = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  
  // Default to Colombo
  const [position, setPosition] = useState({ lat: 6.9271, lng: 79.8612 });
  const [threshold, setThreshold] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showRadar, setShowRadar] = useState(false);
  
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('geofence_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedHubs, setSavedHubs] = useState([]);
  const [globalConfiguredPatients, setGlobalConfiguredPatients] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Patients list
      const pRes = await axios.get('http://localhost:5000/api/admin/patients');
      if (pRes.data.success) {
        setPatients(pRes.data.data);
      }
      
      // 2. Fetch existing geofence settings from Python ML backend
      const geoRes = await axios.get('http://172.20.10.3:8000/admin/realtime-locations');
      if (geoRes.data.status === 'success' && geoRes.data.data.length > 0) {
        const data = geoRes.data.data;
        
        // Map of patient to their location
        const pMap = {};
        data.forEach(p => pMap[p.patientId] = p);
        setGlobalConfiguredPatients(pMap);

        // Group by distinct locations
        const hubsMap = {};
        data.forEach(p => {
          const key = `${p.home_lat},${p.home_lng},${p.threshold}`;
          if (!hubsMap[key]) hubsMap[key] = [];
          hubsMap[key].push(p.patientId);
        });
        
        const hubs = Object.keys(hubsMap).map(k => {
          const [lat, lng, thr] = k.split(',');
          return { lat: parseFloat(lat), lng: parseFloat(lng), threshold: parseInt(thr), patients: hubsMap[k], name: `Location` };
        });
        
        // Reverse geocode to get city names
        for (let i = 0; i < hubs.length; i++) {
          try {
            const res = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${hubs[i].lat}&longitude=${hubs[i].lng}&localityLanguage=en`);
            hubs[i].name = res.data.locality || res.data.city || res.data.principalSubdivision || `Location ${i + 1}`;
          } catch (err) {
            hubs[i].name = `Location ${i + 1}`;
          }
        }
        
        setSavedHubs(hubs);

        // Auto-select the first hub
        if (hubs.length > 0) {
          setPosition({ lat: hubs[0].lat, lng: hubs[0].lng });
          setThreshold(hubs[0].threshold);
          setSelectedPatients(new Set(hubs[0].patients));
        }
      } else {
          setSavedHubs([]);
          setGlobalConfiguredPatients({});
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePatient = (customerCode) => {
    const newSet = new Set(selectedPatients);
    if (newSet.has(customerCode)) {
      newSet.delete(customerCode);
    } else {
      newSet.add(customerCode);
    }
    setSelectedPatients(newSet);
  };

  const toggleAll = () => {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(patients.map(p => p.customerCode)));
    }
  };

  const handleSave = async () => {
    if (selectedPatients.size === 0) {
      alert("Please select at least one patient.");
      return;
    }
    if (!position) {
      alert("Please select a location on the map.");
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);
    try {
      // Connect to Python ML Backend for Geofencing
      const payload = {
        patient_ids: Array.from(selectedPatients),
        lat: position.lat,
        lng: position.lng,
        threshold: parseInt(threshold, 10)
      };
      
      const res = await axios.post('http://172.20.10.3:8000/admin/geofence/update', payload);
      
      if (res.data.status === 'success') {
        setStatusMsg({ type: 'success', text: `Successfully updated geofence for ${selectedPatients.size} patients.` });
        await fetchInitialData(); // Refresh hubs
      }
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: "Failed to update. Ensure Python backend is running." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStatusMsg({ type: 'success', text: 'Location set to your current device location.' });
        },
        (err) => {
          setStatusMsg({ type: 'error', text: 'Could not get current location. Please allow location access.' });
        }
      );
    } else {
      setStatusMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    }
  };

  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!locationSearchQuery.trim()) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${locationSearchQuery}`);
      if (res.data && res.data.length > 0) {
        const newPos = { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
        setPosition(newPos);
        
        // Save to history
        const newHistoryItem = { name: res.data[0].display_name.split(',')[0], lat: newPos.lat, lng: newPos.lng };
        const updatedHistory = [newHistoryItem, ...searchHistory.filter(h => h.name !== newHistoryItem.name)].slice(0, 5);
        setSearchHistory(updatedHistory);
        localStorage.setItem('geofence_history', JSON.stringify(updatedHistory));
        
        setStatusMsg({ type: 'success', text: `Found: ${res.data[0].display_name}` });
      } else {
        setStatusMsg({ type: 'error', text: 'Location not found.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Search failed.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Geofence Configuration</h2>
          <p className="text-slate-500 font-medium">Set home locations and wandering thresholds for patients.</p>
        </div>
        <button 
          onClick={() => setShowRadar(true)}
          className="flex items-center gap-2 bg-slate-900 text-emerald-400 px-6 py-3 rounded-xl font-black tracking-widest text-sm hover:bg-slate-800 transition-all shadow-lg shadow-emerald-900/20"
        >
          <Radar className="animate-pulse" size={20} />
          View Patient Location Real-time
        </button>
      </div>

      {showRadar && (
        <RadarView 
          onClose={() => setShowRadar(false)} 
          homeLocation={position} 
          threshold={threshold}
          allPatients={patients} 
        />
      )}

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <AlertCircle size={20} />
          <span className="font-bold">{statusMsg.text}</span>
        </div>
      )}

      {/* Saved Hubs Section */}
      {savedHubs.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Configured Geofence Hubs</label>
          <div className="flex flex-wrap gap-2">
            {savedHubs.map((hub, i) => {
              const isSelected = position.lat === hub.lat && position.lng === hub.lng && threshold === hub.threshold;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPosition({ lat: hub.lat, lng: hub.lng });
                    setThreshold(hub.threshold);
                    setSelectedPatients(new Set(hub.patients));
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
                >
                  📍 {hub.name || `Location ${i + 1}`} ({hub.patients.length} Patients)
                </button>
              );
            })}
            <button
              onClick={() => {
                setPosition({ lat: 6.9271, lng: 79.8612 }); // Reset to Colombo or any blank state
                setThreshold(50);
                setSelectedPatients(new Set());
              }}
              className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-all"
            >
              + Create New Location
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Map and Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">1. Select Home Location on Map</label>
                <button onClick={handleUseCurrentLocation} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
                  <MapPin size={14} /> Use My Current Location
                </button>
              </div>
              
              <form onSubmit={handleSearchLocation} className="flex items-center gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="Search city or address (e.g., Colombo)"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold"
                />
                <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors">
                  Search
                </button>
              </form>

              {searchHistory.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {searchHistory.map((hist, i) => (
                    <button 
                      key={i} 
                      onClick={() => setPosition({lat: hist.lat, lng: hist.lng})}
                      className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-all"
                    >
                      {hist.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="h-64 rounded-xl overflow-hidden border-2 border-slate-100 relative z-0">
                <MapContainer center={[6.9271, 79.8612]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={position} setPosition={setPosition} />
                  <FlyToLocation position={position} />
                </MapContainer>
              </div>
              {position && (
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">2. Distance Threshold (Meters)</label>
              <input 
                type="number" 
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold"
              />
              <p className="text-xs text-slate-400 mt-1">If the patient wanders beyond this radius, SOS is triggered.</p>
            </div>
            
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Apply Configuration
            </button>
          </div>
        </div>

        {/* Right Col: Patient Selection */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Apply to Patients ({selectedPatients.size} selected)</label>
            <button onClick={toggleAll} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
              {selectedPatients.size === patients.length && patients.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
              Select All
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 border border-slate-100 rounded-xl p-2 bg-slate-50">
            {loading ? (
              <p className="text-slate-400 font-bold italic text-center p-10">Loading patients...</p>
            ) : patients.length === 0 ? (
              <p className="text-slate-400 font-bold italic text-center p-10">No patients found</p>
            ) : (
              patients.map(p => {
                const isSelected = selectedPatients.has(p.customerCode);
                const backendConfig = globalConfiguredPatients[p.customerCode];
                // Check if they are configured in a different location than the currently viewed one
                const isConfiguredElsewhere = backendConfig && (backendConfig.home_lat !== position.lat || backendConfig.home_lng !== position.lng);
                
                return (
                  <div 
                    key={p.customerCode} 
                    onClick={() => togglePatient(p.customerCode)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200'}`}
                  >
                    <div className="text-blue-600">
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-blue-500 uppercase">{p.customerCode}</p>
                        {isConfiguredElsewhere && !isSelected && (
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                            In Another Hub
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeofenceSettings;
