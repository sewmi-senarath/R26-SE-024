import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Calendar, 
  Filter, 
  User, 
  ChevronRight, 
  Download,
  FileText,
  Edit3
} from 'lucide-react';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    regNumber: '',
    joiningDate: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
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

  const filteredPatients = patients.filter(patient => {
    const matchReg = patient.registrationNumber.toLowerCase().includes(filters.regNumber.toLowerCase());
    const matchDate = filters.joiningDate ? patient.joiningDate.includes(filters.joiningDate) : true;
    const matchActive = patient.isActive !== false; // Include if true or undefined (default)
    return matchReg && matchDate && matchActive;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Patient Registry</h2>
          <p className="text-slate-500 font-medium">Search and manage all registered patient records</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[250px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Registration Number</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by Reg No..."
              value={filters.regNumber}
              onChange={(e) => setFilters({...filters, regNumber: e.target.value})}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Joining Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date"
              value={filters.joiningDate}
              onChange={(e) => setFilters({...filters, joiningDate: e.target.value})}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <button 
          onClick={() => setFilters({regNumber: '', joiningDate: ''})}
          className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-all flex items-center gap-2"
        >
          <Filter size={18} />
          Clear
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reg. Number</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">NIC / ID</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold italic">Scanning Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Search size={48} className="text-slate-300 mb-4" />
                      <p className="text-slate-500 font-bold italic">No matching patients found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{patient.title} {patient.firstName} {patient.lastName}</p>
                          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-tighter">{patient.customerCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        {patient.registrationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs font-bold">{new Date(patient.joiningDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-500">{patient.nic}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">{patient.mobile}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/edit/${patient._id}`)}
                          className="p-2 bg-blue-50 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all shadow-sm">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Total Records: {filteredPatients.length}
           </p>
           <div className="flex gap-2">
              <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-400 hover:text-slate-800 transition-all">Prev</button>
              <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-400 hover:text-slate-800 transition-all">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientList;
