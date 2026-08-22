import React from 'react';

const InputField = ({ label, placeholder, type = "text", required = false, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
    />
  </div>
);

const SelectField = ({ label, required = false, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select 
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700 appearance-none"
    >
      <option value="" disabled>Select {label}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const GeneralTab = ({ data, onChange }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SelectField 
          label="Title" 
          required 
          value={data.title} 
          onChange={(val) => onChange('title', val)}
          options={[
            { label: 'Mr', value: 'Mr' },
            { label: 'Mrs', value: 'Mrs' },
            { label: 'Miss', value: 'Miss' },
            { label: 'Dr', value: 'Dr' },
            { label: 'Rev', value: 'Rev' }
          ]}
        />
        <InputField label="First Name" placeholder="e.g. John" required value={data.firstName} onChange={(val) => onChange('firstName', val)} />
        <InputField label="Middle Name" placeholder="e.g. Quincy" value={data.middleName} onChange={(val) => onChange('middleName', val)} />
        <InputField label="Last Name" placeholder="e.g. Doe" required value={data.lastName} onChange={(val) => onChange('lastName', val)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InputField label="Customer Code" placeholder="PAT-2026-XXXX" required value={data.customerCode} onChange={(val) => onChange('customerCode', val)} />
        <SelectField 
          label="Gender" 
          required 
          value={data.gender} 
          onChange={(val) => onChange('gender', val)}
          options={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' }
          ]}
        />
        <InputField label="NIC / ID Number" placeholder="98XXXXXXXV" required value={data.nic} onChange={(val) => onChange('nic', val)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InputField label="Date of Birth" type="date" required value={data.dob} onChange={(val) => onChange('dob', val)} />
        <InputField label="Joining Date" type="date" required value={data.joiningDate} onChange={(val) => onChange('joiningDate', val)} />
        <InputField label="Registration Number" placeholder="REG-XXX-XXX" required value={data.registrationNumber} onChange={(val) => onChange('registrationNumber', val)} />
      </div>

      <div className="h-px bg-slate-100 my-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Mobile Number" placeholder="+94 XX XXX XXXX" required value={data.mobile} onChange={(val) => onChange('mobile', val)} />
        <InputField label="Home Phone" placeholder="+94 XX XXX XXXX" value={data.homePhone} onChange={(val) => onChange('homePhone', val)} />
      </div>

      <div className="space-y-4">
        <InputField label="Address Line 1" placeholder="Street Address" required value={data.addressLine1} onChange={(val) => onChange('addressLine1', val)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Address Line 2" placeholder="City / Area" value={data.addressLine2} onChange={(val) => onChange('addressLine2', val)} />
          <InputField label="Address Line 3" placeholder="Province / District" value={data.addressLine3} onChange={(val) => onChange('addressLine3', val)} />
        </div>
        
        <div className="pt-4 flex items-center gap-4">
           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Status</span>
           <button 
             onClick={() => onChange('isActive', !data.isActive)}
             className={`w-12 h-6 rounded-full transition-all relative ${data.isActive ? 'bg-blue-600' : 'bg-slate-300'}`}
           >
             <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${data.isActive ? 'right-1' : 'left-1'}`} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
