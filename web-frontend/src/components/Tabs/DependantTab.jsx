import React, { useState } from 'react';
import { User, Shield, Camera, Upload, Trash2 } from 'lucide-react';

const DependantTab = ({ data, onChange }) => {
  const [image, setImage] = useState(data.guardian?.image || null);

  const handleImageChange = (val) => {
    setImage(val);
    onChange('image', val, 'guardian');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Shield className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-800">Guardian Information</h4>
          <p className="text-sm text-slate-500 font-medium">Primary contact for emergency alerts and routine updates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Full Name *</label>
            <input 
              type="text"
              placeholder="e.g. Jane Smith"
              value={data.guardian?.name || ''}
              onChange={(e) => onChange('name', e.target.value, 'guardian')}
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">NIC / ID Number *</label>
            <input 
              type="text"
              placeholder="85XXXXXXXV"
              value={data.guardian?.nic || ''}
              onChange={(e) => onChange('nic', e.target.value, 'guardian')}
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Relationship to Patient</label>
            <select 
              value={data.guardian?.relationship || ''}
              onChange={(e) => onChange('relationship', e.target.value, 'guardian')}
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            >
              <option value="" disabled>Select Relationship</option>
              <option value="child">Child</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="caregiver">Professional Caregiver</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Guardian Identity Image</label>
           
           <div className="w-full aspect-video bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
              {image ? (
                <>
                  <img src={image} alt="Guardian" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => handleImageChange(null)} className="p-3 bg-white text-red-500 rounded-xl shadow-lg transform hover:scale-110 transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Camera className="text-slate-400 w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No Photo Attached</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all">
                 <Camera size={16} />
                 Open Camera
              </button>
              <label className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all">
                 <Upload size={16} />
                 Browse File
                 <input type="file" className="hidden" onChange={(e) => {
                   const file = e.target.files[0];
                   if (file) handleImageChange(URL.createObjectURL(file));
                 }} />
              </label>
           </div>
           <p className="text-[10px] text-slate-400 font-medium italic text-center leading-relaxed">
             Identity verification required for smart glass hardware handover.
           </p>
        </div>
      </div>
    </div>
  );
};

export default DependantTab;
