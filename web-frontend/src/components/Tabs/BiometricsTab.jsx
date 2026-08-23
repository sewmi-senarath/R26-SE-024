import React, { useState } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';

const BiometricsTab = ({ data, onChange }) => {
  const [image, setImage] = useState(data.patientImage || null);

  const handleImageChange = (val) => {
    setImage(val);
    onChange('patientImage', val);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h4 className="text-lg font-bold text-slate-800 mb-2">Patient Identification</h4>
        <p className="text-sm text-slate-500 mb-6 font-medium">Upload a clear front-facing photo of the patient for AI recognition and identity verification.</p>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-64 h-64 bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => handleImageChange(null)} className="p-3 bg-white text-red-500 rounded-xl shadow-lg transform hover:scale-110 transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <Camera className="text-slate-400 w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">No Photo Captured</p>
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            <button className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-900 transition-all">
              <Camera size={20} />
              Open System Camera
            </button>
            <label className="w-full bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
              <Upload size={20} />
              Browse Local Files
              <input type="file" className="hidden" onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleImageChange(URL.createObjectURL(file));
              }} />
            </label>
            <p className="text-xs text-slate-400 text-center font-medium italic">Supports JPG, PNG (Max 5MB)</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
             <Upload className="text-blue-600 w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-blue-900 text-sm mb-1">Cloudinary Integration Active</h5>
            <p className="text-blue-700 text-xs font-medium leading-relaxed">
              Images are automatically optimized and served via Cloudinary CDN for ultra-fast loading in the mobile application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricsTab;
