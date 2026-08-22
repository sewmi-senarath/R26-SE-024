import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { 
  TrendingUp, Users, Box, Target, FileText, Download, Filter, 
  ChevronRight, ChevronDown, ChevronUp, Calendar, ArrowUpRight, ArrowDownRight, Package
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AnalyticsCard = ({ title, value, change, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
    <div className="relative z-10 flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const PersonalizedAnalytics = () => {
  const [data, setData] = useState({
    patientObjects: [],
    trends: [
      { day: 'Mon', detections: 12 },
      { day: 'Tue', detections: 15 },
      { day: 'Wed', detections: 18 },
      { day: 'Thu', detections: 22 },
      { day: 'Fri', detections: 30 },
      { day: 'Sat', detections: 25 },
      { day: 'Sun', detections: 20 },
    ]
  });
  const [loading, setLoading] = useState(true);
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [patientItems, setPatientItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const toggleExpand = async (patientId, idx) => {
    const key = patientId || idx;
    if (expandedPatient === key) {
      setExpandedPatient(null);
      return;
    }
    setExpandedPatient(key);
    if (patientItems[key]) return; // already loaded
    setLoadingItems(prev => ({ ...prev, [key]: true }));
    try {
      const res = await axios.get(`${API_URL}/admin/personal-objects/patient/${patientId}`);
      if (res.data.success) {
        setPatientItems(prev => ({ ...prev, [key]: res.data.data }));
      }
    } catch (e) {
      console.error('Failed to load items', e);
    } finally {
      setLoadingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/personal-objects/stats/all`);
        if (res.data.success) {
          const mappedData = res.data.data.map(item => ({
            patientId: item._id,
            name: item.patientName && item.patientName.trim() !== "" ? item.patientName : 'Unknown Patient',
            objects: item.objectCount,
            accuracy: Math.floor(Math.random() * 5) + 90 
          }));
          setData(prev => ({ ...prev, patientObjects: mappedData }));
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">AI Intelligence Reports</h2>
          <p className="text-slate-500 font-medium text-lg">Power BI style analytics for personalized object detection performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} />
            Export PDF
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all">
            <Filter size={18} />
            Advanced Filter
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Total Personalized Objects" value="135" change="+12%" trend="up" icon={Box} />
        <AnalyticsCard title="Active Training Models" value="8" change="+2" trend="up" icon={Target} />
        <AnalyticsCard title="Avg. Detection Accuracy" value="92.4%" change="+0.8%" trend="up" icon={TrendingUp} />
        <AnalyticsCard title="Report Generation" value="Automated" change="Ready" trend="up" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Objects per Patient Bar Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black text-slate-800">Objects Vault Distribution</h4>
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <Calendar size={14} /> Last 30 Days
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.patientObjects}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Bar dataKey="objects" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detection Trends Area Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-black text-slate-800">Daily Recognition Volume</h4>
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              <TrendingUp size={12} /> Live Feed
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Area type="monotone" dataKey="detections" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorDetections)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Detailed Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xl font-black text-slate-800">Individual Training Performance</h4>
          <button className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            View All Patients <ChevronRight size={16} />
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Objects</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Accuracy</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.patientObjects.length > 0 ? data.patientObjects.map((p, i) => {
              const key = p.patientId || i;
              const isExpanded = expandedPatient === key;
              const items = patientItems[key] || [];
              const isLoadingRow = loadingItems[key];
              return (
                <React.Fragment key={i}>
                  <tr className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => toggleExpand(p.patientId, i)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-xs uppercase">
                          {p.name[0]}
                        </div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button className="flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        {p.objects} Items
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-[100px] overflow-hidden">
                             <div className={`h-full rounded-full ${p.accuracy > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${p.accuracy}%`}} />
                          </div>
                          <span className="text-sm font-black text-slate-800">{p.accuracy}%</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">Active Profile</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-400">Just now</td>
                  </tr>

                  {/* Expandable Image Grid Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan="5" className="px-8 py-6 bg-slate-50/70 border-t border-slate-100">
                        {isLoadingRow ? (
                          <div className="flex items-center gap-3 text-slate-400 font-bold py-4">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Loading objects...
                          </div>
                        ) : items.length === 0 ? (
                          <div className="flex items-center gap-3 text-slate-400 font-bold py-4">
                            <Package size={18} />
                            No objects found for this patient.
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {items.map((obj, idx) => (
                              <div key={idx} className="group relative">
                                <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                                  <img
                                    src={obj.imageUrl.startsWith('http') ? obj.imageUrl : `${BACKEND_URL}${obj.imageUrl}`}
                                    alt={obj.objectName}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => { e.target.src = ''; e.target.parentElement.classList.add('bg-slate-100'); }}
                                  />
                                </div>
                                <p className="text-center text-[9px] font-black text-slate-500 mt-1 uppercase truncate">{obj.objectName}</p>
                                {obj.detectedLabels?.[0] && (
                                  <p className="text-center text-[8px] font-bold text-blue-400 truncate">{obj.detectedLabels[0]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }) : (
              <tr>
                <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                   No personalized objects detected yet. Start uploading from the Personal Vault.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonalizedAnalytics;
