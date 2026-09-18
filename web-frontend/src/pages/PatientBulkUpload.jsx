import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Download,
  UploadCloud,
  X,
  AlertTriangle,
  Edit3,
  Trash2
} from 'lucide-react';

const PatientBulkUpload = () => {
  const [ingestionType, setIngestionType] = useState('Patients'); // 'Patients' or 'Behaviors'
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [existingCodes, setExistingCodes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/patients');
        if (response.data.success) {
          setExistingCodes(response.data.data.map(p => p.customerCode));
        }
      } catch (err) {
        console.error('Failed to fetch existing codes', err);
      }
    };
    fetchCodes();
  }, []);

  const validateData = (data) => {
    const errors = {};
    const seenCodes = new Set();
    data.forEach((item, index) => {
      const rowErrors = [];
      if (!item.customerCode) rowErrors.push('code_missing');
      else if (existingCodes.includes(item.customerCode)) rowErrors.push('code_exists_db');
      else if (seenCodes.has(item.customerCode)) rowErrors.push('code_duplicate_file');
      if (!item.firstName || !item.lastName) rowErrors.push('name_missing');
      if (item.customerCode) seenCodes.add(item.customerCode);
      if (rowErrors.length > 0) errors[index] = rowErrors;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const parsed = lines.slice(1).filter(line => line.trim()).map((line, i) => {
        // Regex to split by comma but ignore commas inside quotes
        const v = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item?.replace(/(^"|"$)/g, '').trim() || '');
        
        if (ingestionType === 'Patients') {
          // dementia_patients_data.csv format: Patient_ID,Name,Age,Years_in_Home,Behaviors_Sinhala,Behaviors_English,Key_Categories
          const [id, name, age, years, bSin, bEng, categories] = v;
          return {
            id: i,
            customerCode: `PAT-2026-${String(id).padStart(3, '0')}`,
            title: 'Mr/Ms',
            firstName: name?.split(' ')[0] || 'Unknown',
            lastName: name?.split(' ').slice(1).join(' ') || '',
            gender: 'Not Specified', 
            nic: `NIC-${id}`,
            dob: new Date(new Date().getFullYear() - parseInt(age || 70), 0, 1),
            joiningDate: new Date(),
            registrationNumber: `REG-${id}`,
            mobile: 'Not Provided',
            addressLine1: 'Not Provided',
            isActive: true,
            behaviorNotes: bEng,
            keyCategories: categories
          };
        } else {
          // CSV format: patientId,date,time,activity,duration_minutes,location,notes
          return {
            id: i,
            patientCode: v[0],
            date: v[1],
            time: v[2],
            activity: v[3],
            duration: v[4],
            location: v[5],
            notes: v[6] || '',
            nic: v[0], // show patientId in the NIC column for display
          };
        }
      });
      setPreviewData(parsed);
      validateData(parsed);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to parse CSV' });
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...previewData];
    updated[index][field] = value;
    setPreviewData(updated);
    validateData(updated);
  };

  const handleProcess = async () => {
    if (ingestionType !== 'Behaviors' && !validateData(previewData)) {
      setMessage({ type: 'error', text: 'Please resolve validation errors highlighted in red.' });
      return;
    }
    setIsUploading(true);
    try {
      if (ingestionType === 'Patients') {
        const endpoint = 'http://localhost:5000/api/admin/patients/bulk';
        const response = await axios.post(endpoint, previewData);
        if (response.data.success) {
          setMessage({ type: 'success', text: response.data.message });
          setPreviewData([]);
          setFile(null);
        }
        setIsUploading(false);
        return;
      }

      // Behaviors: use multipart/form-data with the original file
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://localhost:5000/api/admin/behavior/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setPreviewData([]);
        setFile(null);
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error uploading data';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const hasErrors = ingestionType !== 'Behaviors' && Object.keys(validationErrors).length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Ingestion Hub</h2>
          <p className="text-slate-500 font-medium mt-1">Smart bulk upload for patients and behavioral logs.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {['Patients', 'Behaviors'].map(type => (
            <button
              key={type}
              onClick={() => { setIngestionType(type); setFile(null); setPreviewData([]); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${ingestionType === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-6 rounded-3xl flex items-center justify-between border animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
           <div className="flex items-center gap-4">
              {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <span className="font-bold">{message.text}</span>
           </div>
           <button onClick={() => setMessage(null)}><X size={20} /></button>
        </div>
      )}

      <div className="space-y-8">
        {!file ? (
          <div 
            className={`h-64 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center p-12 bg-white ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          >
            <FileUp className="text-blue-600 w-12 h-12 mb-4" />
            <p className="text-slate-600 font-bold mb-4 text-center">Drag and drop your patient CSV here</p>
            <input type="file" className="hidden" id="csv-input" accept=".csv" onChange={(e) => handleFile(e.target.files[0])} />
            <label htmlFor="csv-input" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              Browse Files
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                   <FileSpreadsheet className="text-white w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-black text-slate-800">{file.name}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{previewData.length} Records Found</p>
                 </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => { setFile(null); setPreviewData([]); }} className="p-2 text-slate-400 hover:text-rose-500 transition-all">
                   <Trash2 size={20} />
                 </button>
                 <button 
                   onClick={handleProcess}
                   disabled={isUploading || hasErrors}
                   className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${hasErrors ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}
                 >
                   {isUploading ? 'Processing...' : <><UploadCloud size={18} /> Finalize Sync</>}
                 </button>
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {ingestionType === 'Behaviors' ? (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date &amp; Time</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (min)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identification</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reg. Number</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewData.map((row, idx) => {
                    const rowErrors = validationErrors[idx] || [];
                    const isError = rowErrors.length > 0;
                    const isEditing = editingRow === idx;

                    if (ingestionType === 'Behaviors') {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-all border-b border-slate-50">
                          <td className="px-6 py-4 font-bold text-blue-600 text-sm">{row.patientCode}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{row.date} {row.time}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase">{row.activity}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{row.duration} min</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{row.location}</td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx} className={`${isError ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'} transition-all`}>
                        <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {isEditing ? (
                            <>
                              <input 
                                className="text-sm font-bold bg-white border border-blue-200 px-2 py-1 rounded-lg outline-none w-full"
                                value={`${row.title} ${row.firstName} ${row.lastName}`}
                                onChange={(e) => {
                                  const parts = e.target.value.split(' ');
                                  handleInputChange(idx, 'title', parts[0]);
                                  handleInputChange(idx, 'firstName', parts[1] || '');
                                  handleInputChange(idx, 'lastName', parts.slice(2).join(' ') || '');
                                }}
                              />
                              <input 
                                className="text-[10px] font-black uppercase bg-white border border-blue-200 px-2 py-0.5 rounded outline-none"
                                value={row.customerCode}
                                onChange={(e) => handleInputChange(idx, 'customerCode', e.target.value.toUpperCase())}
                              />
                            </>
                          ) : (
                            <>
                              <p className={`text-sm font-bold ${rowErrors.includes('name_missing') ? 'text-rose-500' : 'text-slate-700'}`}>
                                {row.title} {row.firstName} {row.lastName}
                              </p>
                              <p className={`text-[10px] font-black uppercase ${isError && rowErrors.some(e => e.startsWith('code_')) ? 'text-rose-600' : 'text-blue-600'}`}>
                                {row.customerCode} • NIC: {row.nic || 'N/A'}
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input 
                            className="text-xs font-bold bg-white border border-blue-200 px-2 py-1 rounded-lg outline-none w-full"
                            value={row.registrationNumber}
                            onChange={(e) => handleInputChange(idx, 'registrationNumber', e.target.value)}
                          />
                        ) : (
                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                            {row.registrationNumber}
                          </span>
                        )}
                      </td>
                        <td className="px-6 py-4 text-center">
                          {isError ? (
                            <div className="flex justify-center" title={rowErrors.join(', ')}>
                              <AlertTriangle className="text-rose-500 w-5 h-5" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setEditingRow(isEditing ? null : idx)}
                            className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          >
                            <Edit3 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientBulkUpload;
