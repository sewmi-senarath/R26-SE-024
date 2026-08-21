import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  Activity, 
  AlertCircle,
  Clock,
  Calendar,
  Search
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        {subValue && <span className="text-slate-400 text-sm font-semibold">{subValue}</span>}
      </div>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="text-white w-7 h-7" />
    </div>
  </div>
);

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/patients');
        if (response.data.success) {
          setPatients(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registered Patients" 
          value={loading ? '...' : patients.length} 
          icon={Users} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Active Connections" 
          value="12" 
          icon={UserCheck} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Alerts (24h)" 
          value="4" 
          icon={AlertCircle} 
          color="bg-rose-500" 
        />
        <StatCard 
          title="System Health" 
          value="98" 
          icon={Activity} 
          color="bg-indigo-600" 
          subValue="%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Table Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Recent Enrollments</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                 <Search size={16} className="text-slate-400" />
                 <input type="text" placeholder="Search customer code..." className="bg-transparent outline-none text-xs font-bold text-slate-600" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIC</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic">Loading records...</td></tr>
                  ) : patients.length === 0 ? (
                    <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold italic">No records found</td></tr>
                  ) : (
                    patients.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-all cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{p.firstName} {p.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-blue-600">{p.customerCode}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{p.nic}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-lg">
              <h4 className="text-xl font-bold mb-4">Ingestion Guide</h4>
              <p className="text-sm font-medium text-white/80 leading-relaxed mb-6">
                Ensure CSV files use UTF-8 encoding. Large uploads (over 500 records) should be processed during low-traffic periods.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/50" />
                  <span className="text-xs font-bold">Last backup: Today, 4:00 AM</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white/50" />
                  <span className="text-xs font-bold">Server Latency: 12ms</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">System Health</h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2">
                       <span>DATABASE SYNC</span>
                       <span className="text-emerald-500">OPTIMAL</span>
                    </div>
                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[94%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2">
                       <span>API THROUGHPUT</span>
                       <span className="text-blue-500">8.4 REQ/S</span>
                    </div>
                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[45%]"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
