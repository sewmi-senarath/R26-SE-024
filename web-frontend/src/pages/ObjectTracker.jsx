import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Battery, 
  History, 
  MoreVertical,
  Navigation,
  Volume2,
  Mic,
  Camera,
  Layers,
  ChevronRight,
  Wifi
} from 'lucide-react';
import { startVoiceCommand, parseObjectQuery } from '../utils/voiceCommands';
import CameraScanner from '../components/CameraScanner';

const ObjectCard = ({ name, location, lastSeen, battery, status, icon: Icon, mapImage }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center text-lime-600">
          <Icon size={24} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800">{name}</h4>
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin size={12} className="text-lime-500" />
            <span className="text-[11px] font-bold uppercase tracking-tight">{location}</span>
          </div>
        </div>
      </div>
      <button className="text-slate-300 hover:text-slate-600">
        <MoreVertical size={20} />
      </button>
    </div>

    <div className="p-6 space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase">Last Seen</p>
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <History size={14} className="text-blue-500" />
            {lastSeen}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">Beacon Health</p>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${battery > 30 ? 'bg-lime-500' : 'bg-rose-500'}`} style={{ width: `${battery}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-slate-700">{battery}%</span>
          </div>
        </div>
      </div>

      <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-50">
        <img src={mapImage} alt="Map" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="w-4 h-4 bg-lime-500 rounded-full animate-ping absolute" />
           <div className="w-4 h-4 bg-lime-500 rounded-full relative shadow-lg border-2 border-white" />
        </div>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-slate-800 uppercase">
           {location}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 bg-lime-500 text-white py-3 rounded-xl text-xs font-bold hover:bg-lime-600 transition-all shadow-lg shadow-lime-100">
           <Volume2 size={16} />
           Ping Item
        </button>
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
           <Navigation size={16} className="text-blue-500" />
           Path History
        </button>
      </div>
    </div>
  </div>
);

const ObjectTracker = () => {
  const [isListening, setIsListening] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [targetObject, setTargetObject] = useState(null);

  const toggleVoice = () => {
    setIsListening(true);
    startVoiceCommand((text) => {
      setIsListening(false);
      const query = parseObjectQuery(text);
      if (query) {
        setTargetObject(query);
        setShowScanner(true);
      }
    });
  };

  const objects = [
    { name: 'House Keys', location: 'Entry Hallway', lastSeen: '2 mins ago', battery: 89, icon: Wifi, mapImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=300&h=200' },
    { name: 'Leather Wallet', location: 'Living Room', lastSeen: '14 mins ago', battery: 42, icon: Layers, mapImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=300&h=200' },
    { name: 'Hair Brush', location: 'Master Bedroom', lastSeen: 'Just now', battery: 95, icon: Camera, mapImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300&h=200' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Object Tracker</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time location of essential items via EchoCare AR Glasses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-white border border-slate-100 px-6 py-2 rounded-2xl shadow-sm">
             <div className="text-center border-r border-slate-100 pr-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracked</p>
                <p className="text-xl font-black text-slate-800">12</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</p>
                <p className="text-xl font-black text-emerald-500">11</p>
             </div>
             <button className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all ml-2">
                <History size={20} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search for 'Keys', 'Wallet', or room names..."
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
            value={targetObject || ''}
            onChange={(e) => setTargetObject(e.target.value)}
          />
          <button 
            onClick={toggleVoice}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
          >
            <Mic size={20} />
          </button>
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 bg-white border border-slate-100 px-6 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
           <Camera size={18} className="text-blue-500" />
           Open Scanner
        </button>
        <button className="flex items-center gap-2 bg-lime-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-lime-100 hover:bg-lime-600 transition-all">
           <Plus size={20} />
           Add New Item
        </button>
      </div>

      <div className="bg-lime-50 border border-lime-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
               <Wifi className="text-lime-500 animate-pulse" />
            </div>
            <div>
               <h5 className="font-bold text-lime-900">Glasses Synchronization Active</h5>
               <p className="text-sm text-lime-700 font-medium">Using interior mapping data from Maduranga's Smart Glasses. Last sync 12 seconds ago.</p>
            </div>
         </div>
         <span className="bg-white/80 backdrop-blur text-lime-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-lime-200">Live Feed</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {objects.map((obj, idx) => <ObjectCard key={idx} {...obj} />)}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-10">
         <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-800">Recent Movement Logs</h4>
            <button className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">View Full Timeline</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Object</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {[
                    { item: 'House Keys', action: 'Detected', location: 'Entry Hallway', time: '11:42 AM', status: 'success' },
                    { item: 'Leather Wallet', action: 'Lost Contact', location: 'Living Room', time: '11:30 AM', status: 'error' },
                    { item: 'Hair Brush', action: 'Detected', location: 'Master Bedroom', time: '11:28 AM', status: 'success' },
                  ].map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-all">
                       <td className="px-8 py-5 font-bold text-slate-800 text-sm">{log.item}</td>
                       <td className="px-6 py-5">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {log.action}
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                             <MapPin size={14} className="text-slate-300" />
                             {log.location}
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right font-bold text-slate-400 text-sm">{log.time}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showScanner && (
        <CameraScanner 
          targetObject={targetObject} 
          onClose={() => { setShowScanner(false); setTargetObject(null); }}
          onDetected={(obj) => {
            console.log("Object Detected:", obj);
            // In a real app, we'd save this to the movement logs
          }}
        />
      )}
    </div>
  );
};

export default ObjectTracker;
