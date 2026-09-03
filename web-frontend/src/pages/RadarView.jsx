import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Activity } from 'lucide-react';

function RadarSweeper() {
  const map = useMap();
  
  useEffect(() => {
    // Add custom CSS for radar sweep
    const style = document.createElement('style');
    style.innerHTML = `
      .radar-sweep {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200%;
        height: 200%;
        margin-left: -100%;
        margin-top: -100%;
        background: conic-gradient(from 0deg, transparent 70%, rgba(34, 197, 94, 0.4) 100%);
        border-radius: 50%;
        animation: spin 4s linear infinite;
        pointer-events: none;
        z-index: 400;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .leaflet-container {
        background-color: #000 !important;
      }
      .dark-tiles {
        filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
      }
    `;
    document.head.appendChild(style);

    const sweep = document.createElement('div');
    sweep.className = 'radar-sweep';
    map.getContainer().appendChild(sweep);

    return () => {
      document.head.removeChild(style);
      if (map.getContainer().contains(sweep)) {
        map.getContainer().removeChild(sweep);
      }
    };
  }, [map]);

  return null;
}

function DynamicRadarCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: false });
    }
  }, [center, map]);
  return null;
}

const RadarView = ({ onClose, homeLocation, threshold, allPatients }) => {
  const [realtimeData, setRealtimeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds for radar
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://172.20.10.3:8000/admin/realtime-locations');
      if (res.data.status === 'success') {
        setRealtimeData(res.data.data);
      }
    } catch (err) {
      console.log("Radar fetch error", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 absolute top-0 left-0 right-0 z-[1000]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Activity className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-white font-black tracking-widest text-lg">LIVE RADAR VIEW</h3>
              <p className="text-emerald-400 font-bold text-xs">Scanning 360° Sector</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none w-64 text-sm font-bold"
            />
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-slate-900">
          <MapContainer 
            center={[homeLocation.lat, homeLocation.lng]} 
            zoom={18} 
            zoomControl={true}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <DynamicRadarCenter center={[homeLocation.lat, homeLocation.lng]} />
            {/* Dark Theme TileLayer using OSM with CSS filter */}
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              className="dark-tiles"
            />
            
            <RadarSweeper />

            {/* Safe Zone Circles (for all distinct home locations, though usually just 1) */}
            {Array.from(new Set(realtimeData.map(p => `${p.home_lat},${p.home_lng},${p.threshold}`))).map(str => {
              const [lat, lng, thr] = str.split(',').map(Number);
              return (
                <Circle 
                  key={str}
                  center={[lat, lng]} 
                  radius={thr}
                  pathOptions={{ 
                    color: '#22c55e', 
                    fillColor: '#22c55e', 
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 10'
                  }} 
                />
              );
            })}
            
            {realtimeData.length === 0 && (
              <Circle 
                center={[homeLocation.lat, homeLocation.lng]} 
                radius={threshold}
                pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} 
              />
            )}

            {/* Patients as Blips */}
            {realtimeData.map(patient => {
              // Get name from frontend state list
              const pInfo = allPatients.find(p => p.customerCode === patient.patientId) || {};
              const name = pInfo.firstName ? `${pInfo.firstName} ${pInfo.lastName}` : patient.patientId;
              
              if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase()) && !patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())) {
                return null;
              }
              
              if (!patient.current_lat || !patient.current_lng) return null;
              
              const isSafe = patient.is_safe;
              const color = isSafe ? '#3b82f6' : '#ef4444'; // Blue if safe, Red if outside
              
              return (
                <CircleMarker
                  key={patient.patientId}
                  center={[patient.current_lat, patient.current_lng]}
                  radius={isSafe ? 6 : 8}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 1,
                    weight: 2,
                    className: isSafe ? 'opacity-90' : 'animate-ping opacity-100' // Dim if safe, pulse if danger
                  }}
                >
                  <Popup className="bg-slate-800 border-none rounded-xl text-white">
                    <div className="p-1">
                      <p className="font-bold text-white text-sm mb-1">{name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">{patient.patientId}</p>
                      
                      <div className={`mt-2 px-2 py-1 rounded-md text-xs font-bold ${isSafe ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                        {isSafe ? '✓ IN SAFE ZONE' : '⚠️ WARNING: WANDERING'}
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-2">Distance: {Math.round(patient.distance)}m / {patient.threshold}m</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default RadarView;
