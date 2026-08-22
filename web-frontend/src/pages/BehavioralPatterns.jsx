import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, AlertTriangle, BrainCircuit, Clock,
  Search, Activity, User, Loader2, Brain, ChevronDown,
  Utensils, BedDouble, Footprints, Pill, Bath, Dumbbell,
  Users2, HelpCircle, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACTIVITY_META = {
  eating:      { icon: Utensils,   color: 'bg-orange-50 text-orange-600',  label: 'Eating' },
  sleeping:    { icon: BedDouble,  color: 'bg-indigo-50 text-indigo-600',  label: 'Sleeping' },
  walking:     { icon: Footprints, color: 'bg-emerald-50 text-emerald-600',label: 'Walking' },
  wandering:   { icon: AlertTriangle, color: 'bg-red-50 text-red-600',     label: 'Wandering' },
  sitting:     { icon: User,       color: 'bg-slate-100 text-slate-500',   label: 'Sitting' },
  medication:  { icon: Pill,       color: 'bg-blue-50 text-blue-600',      label: 'Medication' },
  bathing:     { icon: Bath,       color: 'bg-cyan-50 text-cyan-600',      label: 'Bathing' },
  exercise:    { icon: Dumbbell,   color: 'bg-purple-50 text-purple-600',  label: 'Exercise' },
  socializing: { icon: Users2,     color: 'bg-pink-50 text-pink-600',      label: 'Socializing' },
};

const getActivityMeta = (activity) =>
  ACTIVITY_META[activity?.toLowerCase()] || { icon: HelpCircle, color: 'bg-slate-100 text-slate-400', label: activity || 'Unknown' };

const BehavioralPatterns = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [routine, setRoutine] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState([]);

  // Load all patients
  useEffect(() => {
    axios.get(`${API_URL}/admin/patients`)
      .then(r => setPatients(r.data.data || []))
      .catch(console.error);

    axios.get(`${API_URL}/admin/behavior/stats`)
      .then(r => setStats(r.data.data || []))
      .catch(console.error);
  }, []);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLogs([]);
    setRoutine(null);
    setTrainResult(null);
    setLoadingLogs(true);
    try {
      const [logsRes, patternRes] = await Promise.all([
        axios.get(`${API_URL}/admin/behavior/logs/${patient._id}`),
        axios.get(`${API_URL}/admin/behavior/pattern/${patient._id}`)
      ]);
      setLogs(logsRes.data.data || []);
      if (patternRes.data.status === 'success') setRoutine(patternRes.data.routine);
    } catch (e) { console.error(e); }
    setLoadingLogs(false);
  };

  const trainModel = async () => {
    if (!selectedPatient) return;
    setTraining(true);
    setTrainResult(null);
    try {
      const res = await axios.post(`${API_URL}/admin/behavior/train/${selectedPatient._id}`);
      setTrainResult(res.data);
      // Reload routine
      const pr = await axios.get(`${API_URL}/admin/behavior/pattern/${selectedPatient._id}`);
      if (pr.data.status === 'success') setRoutine(pr.data.routine);
    } catch (e) {
      setTrainResult({ success: false, message: e.response?.data?.message || 'Training failed' });
    }
    setTraining(false);
  };

  const filteredLogs = logs.filter(l =>
    !search || l.activity?.toLowerCase().includes(search.toLowerCase()) || l.location?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const activityCounts = logs.reduce((acc, l) => {
    acc[l.activity] = (acc[l.activity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Behavior Logs</h2>
        <p className="text-slate-500 font-medium text-lg mt-1">View uploaded behavior patterns and train AI models per patient</p>
      </div>

      {/* Global Stats Bar */}
      {stats.length > 0 && (
        <div className="bg-slate-900 rounded-[2rem] p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(
            stats.reduce((acc, s) => { acc[s.activity] = (acc[s.activity] || 0) + s.count; return acc; }, {})
          ).slice(0, 4).map(([activity, count]) => {
            const meta = getActivityMeta(activity);
            const Icon = meta.icon;
            return (
              <div key={activity} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-white font-black text-xl">{count}</p>
                  <p className="text-slate-400 text-xs font-bold uppercase">{meta.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 space-y-4 h-fit">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Select Patient</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-600 outline-none border border-slate-100 focus:border-blue-300"
              placeholder="Search patient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {patients.filter(p =>
              !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
            ).map(p => (
              <button
                key={p._id}
                onClick={() => selectPatient(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  selectedPatient?._id === p._id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  selectedPatient?._id === p._id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.firstName?.[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{p.firstName} {p.lastName}</p>
                  <p className={`text-[10px] font-black uppercase ${selectedPatient?._id === p._id ? 'text-blue-200' : 'text-slate-400'}`}>
                    {p.customerCode}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPatient ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-20 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center">
                <Activity className="text-blue-400 w-8 h-8" />
              </div>
              <p className="font-black text-slate-400 text-lg">Select a patient to view their behavior logs</p>
            </div>
          ) : (
            <>
              {/* Patient Header + Train */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {selectedPatient.firstName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <p className="text-slate-400 font-bold text-sm">{logs.length} behavior records · {selectedPatient.customerCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {routine && (
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black">
                      <CheckCircle2 size={14} /> Model Trained
                    </span>
                  )}
                  <button
                    onClick={trainModel}
                    disabled={training || logs.length < 10}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-200"
                  >
                    {training ? <Loader2 className="animate-spin w-4 h-4" /> : <Brain size={16} />}
                    {training ? 'Training...' : 'Train AI Model'}
                  </button>
                </div>
              </div>

              {/* Train Result */}
              {trainResult && (
                <div className={`p-5 rounded-2xl font-bold text-sm flex items-center gap-3 animate-in fade-in ${
                  trainResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {trainResult.success
                    ? <><CheckCircle2 size={18} /> Model trained on {trainResult.result?.samples_trained} samples! Routine learned for {Object.keys(trainResult.result?.routine || {}).length} hours.</>
                    : <><AlertTriangle size={18} /> {trainResult.message}</>
                  }
                </div>
              )}

              {/* Activity Summary Pills */}
              {Object.keys(activityCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activityCounts).sort((a, b) => b[1] - a[1]).map(([act, count]) => {
                    const meta = getActivityMeta(act);
                    const Icon = meta.icon;
                    return (
                      <span key={act} className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black ${meta.color}`}>
                        <Icon size={14} /> {meta.label} <span className="opacity-60">×{count}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Learned Routine */}
              {routine && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-6">
                  <h4 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-blue-500" /> Learned Daily Routine
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {Object.entries(routine).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, activity]) => {
                      const meta = getActivityMeta(activity);
                      const Icon = meta.icon;
                      return (
                        <div key={hour} className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${meta.color} bg-opacity-20`}>
                          <p className="text-[10px] font-black text-slate-500">{String(hour).padStart(2,'0')}:00</p>
                          <Icon size={18} />
                          <p className="text-[9px] font-black uppercase text-center leading-tight">{meta.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Logs Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h4 className="font-black text-slate-700">Behavior Log ({filteredLogs.length} entries)</h4>
                  <button onClick={() => selectPatient(selectedPatient)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <RefreshCw size={16} className="text-slate-400" />
                  </button>
                </div>

                {loadingLogs ? (
                  <div className="p-20 flex items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin w-6 h-6" /> Loading logs...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-medium">
                    No behavior logs found. Upload a CSV from Data Ingestion Hub.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredLogs.map((log, i) => {
                          const meta = getActivityMeta(log.activity);
                          const Icon = meta.icon;
                          const isAnomaly = log.activity === 'wandering';
                          return (
                            <tr key={i} className={`hover:bg-slate-50/50 transition-all ${isAnomaly ? 'bg-red-50/30' : ''}`}>
                              <td className="px-6 py-3 text-sm font-bold text-slate-600">
                                {log.date} <span className="text-slate-400">{log.time}</span>
                              </td>
                              <td className="px-6 py-3">
                                <span className={`flex items-center gap-2 w-fit px-3 py-1 rounded-xl text-xs font-black ${meta.color}`}>
                                  <Icon size={12} /> {meta.label}
                                  {isAnomaly && <AlertTriangle size={11} />}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-500 font-medium">{log.duration} min</td>
                              <td className="px-6 py-3 text-sm text-slate-500">{log.location}</td>
                              <td className="px-6 py-3">
                                <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">{log.source}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BehavioralPatterns;
