import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { AlertTriangle, Clock, Activity, Download } from 'lucide-react';
import axios from 'axios';

// Note: Using hardcoded mock data for the UI as per design, real integration would use axios to fetch from backend
const MOCK_LINE_DATA = [
  { day: 'Sep 26', anomalies: 2 },
  { day: 'Sep 27', anomalies: 6 },
  { day: 'Sep 28', anomalies: 3 },
  { day: 'Sep 29', anomalies: 9 },
  { day: 'Oct 01', anomalies: 6 },
  { day: 'Oct 02', anomalies: 2 },
  { day: 'Oct 05', anomalies: 12 },
  { day: 'Oct 08', anomalies: 6 },
  { day: 'Oct 10', anomalies: 8 },
  { day: 'Oct 14', anomalies: 11 },
  { day: 'Oct 18', anomalies: 6 },
  { day: 'Oct 23', anomalies: 11 },
];

const MOCK_BAR_DATA = [
  { name: 'Wandering', count: 85, fill: '#3B82F6' },
  { name: 'Aggressive', count: 62, fill: '#EF4444' },
  { name: 'Agitation', count: 45, fill: '#F59E0B' },
  { name: 'Repetitive', count: 30, fill: '#10B981' },
];

const RECENT_ALERTS = [
  { time: 'Oct 26, 02:15 AM', patient: 'Kodikarage Karunawathi', type: 'Night Wandering', duration: '14m', location: 'Hallway 3', severity: 'High' },
  { time: 'Oct 26, 08:35 AM', patient: 'Godagal Bopege Nalini', type: 'Aggressive Outburst', duration: '18m', location: 'Dining Room', severity: 'High' },
  { time: 'Oct 25, 04:50 PM', patient: 'Dona Leelawathi Gunasekara', type: 'Fall / Unresponsive', duration: '2m', location: 'Room 112', severity: 'Critical' },
  { time: 'Oct 25, 11:30 AM', patient: 'Athukoralalage Dinee', type: 'Agitation', duration: '22m', location: 'Garden', severity: 'Medium' },
];

const BehaviorAnomalyReports = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('ALL');
  const [chartData, setChartData] = useState(MOCK_LINE_DATA);
  const [barData, setBarData] = useState(MOCK_BAR_DATA);
  const [totalAnomalies, setTotalAnomalies] = useState(248);

  useEffect(() => {
    // Fetch patients to show in dropdown
    axios.get('http://localhost:5000/api/admin/patients')
      .then(res => {
        if (res.data.success) {
          setPatients(res.data.data);
        }
      })
      .catch(e => console.log(e));
  }, []);

  const handlePatientSelect = (e) => {
    const val = e.target.value;
    setSelectedPatient(val);
    
    if (val === 'ALL') {
      setChartData(MOCK_LINE_DATA);
      setBarData(MOCK_BAR_DATA);
      setTotalAnomalies(248);
    } else {
      // Generate some random looking data for the selected patient to simulate "Personalized Analytics"
      const pData = MOCK_LINE_DATA.map(d => ({
        day: d.day,
        anomalies: Math.floor(Math.random() * 5)
      }));
      setChartData(pData);
      
      const bData = MOCK_BAR_DATA.map(d => ({
        ...d,
        count: Math.floor(Math.random() * 20) + 1
      }));
      setBarData(bData);
      
      const total = pData.reduce((acc, curr) => acc + curr.anomalies, 0);
      setTotalAnomalies(total);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 bg-slate-900 text-slate-100 p-8 rounded-3xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Personalized Behavior Reports</h1>
          <p className="text-slate-400">Real-time Anomaly Tracking & Panic Detection</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg outline-none focus:border-blue-500"
            value={selectedPatient}
            onChange={handlePatientSelect}
          >
            <option value="ALL">All Patients (Aggregate)</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700">
            <Download size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-400 mb-1">Total Anomalies (Last 30 Days)</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-bold text-white">{totalAnomalies}</h2>
              <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">↗ +12%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">+12% vs last month</p>
          </div>
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
            <Activity className="text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-400 mb-1">Peak Time of Occurrence</p>
            <h2 className="text-3xl font-bold text-white mt-2">03:00 PM - 05:00 PM</h2>
          </div>
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
            <Clock className="text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-1">Anomalies Trend (Last 30 Days)</h3>
          <p className="text-sm text-slate-400 mb-6">Total Anomalies: {totalAnomalies}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc'}} />
                <Line type="monotone" dataKey="anomalies" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Anomaly Types Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{top: 20}}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {MOCK_BAR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Behavior Alerts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 font-medium">Timestamp</th>
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ALERTS.map((alert, idx) => (
                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 text-sm text-slate-300">{alert.time}</td>
                  <td className="py-4 text-sm text-slate-200 font-medium">{alert.patient}</td>
                  <td className="py-4 text-sm text-slate-300">{alert.type}</td>
                  <td className="py-4 text-sm text-slate-300">{alert.duration}</td>
                  <td className="py-4 text-sm text-slate-300">{alert.location}</td>
                  <td className="py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.severity === 'Critical' ? 'bg-red-600/30 text-red-500' :
                      alert.severity === 'High' ? 'bg-orange-500/20 text-orange-400' : 
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnomalyReports;
