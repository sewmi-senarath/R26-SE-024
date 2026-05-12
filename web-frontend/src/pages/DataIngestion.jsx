import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Users, Brain, Download, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SAMPLE_CSV = `patientId,date,time,activity,duration_minutes,location,notes
PAT-2026-050,2026-05-01,08:00,eating,30,kitchen,breakfast
PAT-2026-050,2026-05-01,10:00,walking,20,garden,morning walk
PAT-2026-050,2026-05-01,13:00,eating,25,kitchen,lunch
PAT-2026-050,2026-05-01,15:00,sitting,60,living room,watching TV
PAT-2026-050,2026-05-01,22:00,sleeping,480,bedroom,night sleep`;

const DataIngestion = () => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [training, setTraining] = useState({});
  const [trainResults, setTrainResults] = useState({});
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv')) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/admin/behavior/bulk-upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setUploading(false);
    }
  };

  const trainPatient = async (patientId) => {
    setTraining(prev => ({ ...prev, [patientId]: true }));
    try {
      const res = await axios.post(`${API_URL}/admin/behavior/train/${patientId}`);
      setTrainResults(prev => ({ ...prev, [patientId]: res.data }));
    } catch (err) {
      setTrainResults(prev => ({ ...prev, [patientId]: { success: false, error: err.response?.data?.message || 'Training failed' } }));
    } finally {
      setTraining(prev => ({ ...prev, [patientId]: false }));
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sample_behavior_data.csv'; a.click();
  };

  // Get unique patients from successful upload
  const uploadedPatients = result?.results?.success
    ? [...new Set(result.results.success)]
    : [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Data Ingestion Hub</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Upload behavior data to train personalized AI patterns</p>
        </div>
        <button onClick={downloadSample} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm transition-all">
          <Download size={16} /> Download Sample CSV
        </button>
      </div>

      {/* CSV Format Guide */}
      <div className="bg-slate-900 rounded-[2rem] p-6 text-sm font-mono text-slate-300 overflow-x-auto">
        <p className="text-slate-500 text-xs font-sans font-bold uppercase tracking-widest mb-3">Required CSV Format</p>
        <p className="text-blue-400">patientId, date, time, activity, duration_minutes, location, notes</p>
        <p className="text-slate-400">PAT-2026-050, 2026-05-01, 08:00, <span className="text-emerald-400">eating</span>, 30, kitchen, breakfast</p>
        <p className="text-slate-400">PAT-2026-050, 2026-05-01, 22:00, <span className="text-emerald-400">sleeping</span>, 480, bedroom, night sleep</p>
        <p className="mt-3 text-[11px] text-slate-500 font-sans">
          Activities: <span className="text-yellow-400">eating · sleeping · walking · wandering · sitting · medication · bathing · exercise · socializing</span>
        </p>
        <p className="text-[11px] text-slate-500 font-sans mt-1">⚠️ Only registered patients (by PatientID) will be accepted</p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-[3rem] p-16 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files[0])} />
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Upload className="text-blue-500 w-10 h-10" />
        </div>
        {file ? (
          <div>
            <p className="text-xl font-black text-slate-800">{file.name}</p>
            <p className="text-slate-400 font-medium mt-1">{(file.size / 1024).toFixed(1)} KB — Ready to upload</p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-black text-slate-600">Drop your CSV here or click to browse</p>
            <p className="text-slate-400 font-medium mt-2">Only registered patients will be imported</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-200"
        >
          {uploading ? <><Loader2 className="animate-spin w-6 h-6" /> Importing & Validating...</> : <><FileText size={22} /> Import Behavior Data</>}
        </button>
      )}

      {/* Upload Result */}
      {result && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-6 animate-in fade-in duration-500">
          <div className={`flex items-center gap-4 p-5 rounded-2xl ${result.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {result.success ? <CheckCircle2 className="text-emerald-500 w-8 h-8" /> : <XCircle className="text-red-500 w-8 h-8" />}
            <div>
              <p className="font-black text-slate-800 text-lg">{result.success ? result.message : 'Upload Failed'}</p>
              {result.results && (
                <p className="text-slate-500 font-medium text-sm">
                  ✅ {result.results.success?.length || 0} imported · ⚠️ {result.results.duplicates?.length || 0} duplicates skipped · ❌ {result.results.errors?.length || 0} invalid · 📊 {result.results.total} total
                </p>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {result.results?.errors?.length > 0 && (
            <div className="space-y-2">
              <p className="font-black text-slate-700 text-sm uppercase tracking-widest">❌ Invalid Rows (patient not registered)</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.results.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-xl text-sm">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span className="font-bold text-red-700">{e.row}</span>
                    <span className="text-red-500">{e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates */}
          {result.results?.duplicates?.length > 0 && (
            <div className="space-y-2">
              <p className="font-black text-slate-700 text-sm uppercase tracking-widest">⚠️ Duplicates Skipped</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.results.duplicates.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-xl text-sm">
                    <AlertTriangle size={14} className="text-orange-500" />
                    <span className="font-bold text-orange-700">{e.row}</span>
                    <span className="text-orange-500">{e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Train Buttons for each patient */}
          {uploadedPatients.length > 0 && (
            <div className="space-y-3">
              <p className="font-black text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-blue-500" /> Train AI Models
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uploadedPatients.map((pid) => {
                  const tr = trainResults[pid];
                  return (
                    <div key={pid} className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-black text-blue-600 text-sm">{pid.slice(-3)}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{pid}</p>
                          {tr?.success && <p className="text-[10px] text-emerald-500 font-bold">✅ Trained on {tr.result?.samples_trained} samples</p>}
                          {tr?.success === false && <p className="text-[10px] text-red-500 font-bold">❌ {tr.error}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => trainPatient(pid)}
                        disabled={training[pid] || tr?.success}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                      >
                        {training[pid] ? <Loader2 className="animate-spin w-3 h-3" /> : <Brain size={13} />}
                        {tr?.success ? 'Trained ✓' : training[pid] ? 'Training...' : 'Train Model'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => uploadedPatients.forEach(pid => { if (!trainResults[pid]?.success) trainPatient(pid); })}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Brain size={16} /> Train All Patients at Once
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataIngestion;
