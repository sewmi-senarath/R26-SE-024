import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Fingerprint, 
  ShieldCheck, 
  History,
  Save,
  ChevronRight,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import GeneralTab from '../components/Tabs/GeneralTab';
import BiometricsTab from '../components/Tabs/BiometricsTab';
import DependantTab from '../components/Tabs/DependantTab';
import BehaviorTab from '../components/Tabs/BehaviorTab';

const PatientRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '', firstName: '', middleName: '', lastName: '', customerCode: '',
    isActive: true,
    gender: '', nic: '', dob: '', joiningDate: '', registrationNumber: '',
    mobile: '', homePhone: '', addressLine1: '', addressLine2: '', addressLine3: '',
    patientImage: '',
    guardian: { name: '', nic: '', relationship: '', image: '' },
    routines: []
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      // Find by ID for update (we need to ensure the backend supports fetching by ID)
      // The current backend getPatientByCode uses :code, but we should probably use ID for edit.
      // I'll try fetching by code first if it's passed as ID, or I'll update backend to support ID.
      // Actually, I'll update backend to support GET /api/admin/patients/by-id/:id
      const response = await axios.get(`http://localhost:5000/api/admin/patients/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        // Format dates for input fields
        if (data.dob) data.dob = data.dob.split('T')[0];
        if (data.joiningDate) data.joiningDate = data.joiningDate.split('T')[0];
        
        // Merge with existing state to preserve defaults
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch patient data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const url = isEditMode 
        ? `http://localhost:5000/api/admin/patients/${formData._id}` 
        : 'http://localhost:5000/api/admin/patients';
      
      const method = isEditMode ? 'put' : 'post';
      
      const response = await axios[method](url, formData);
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: isEditMode ? 'Patient record updated successfully!' : 'Patient registered successfully!' 
        });
        if (!isEditMode) {
          // Reset form on success if creating new
          setFormData({
            title: '', firstName: '', middleName: '', lastName: '', customerCode: '',
            gender: '', nic: '', dob: '', joiningDate: '', registrationNumber: '',
            mobile: '', homePhone: '', addressLine1: '', addressLine2: '', addressLine3: '',
            patientImage: '',
            guardian: { name: '', nic: '', relationship: '', image: '' },
            routines: []
          });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General Information', icon: User },
    { id: 'biometrics', name: 'Biometrics', icon: Fingerprint },
    { id: 'dependant', name: 'Dependant / Guardian', icon: ShieldCheck },
    { id: 'behavior', name: 'Behavior Patterns', icon: History },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {isEditMode && (
            <button 
              onClick={() => navigate('/admin/list')}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-black text-slate-800">
              {isEditMode ? 'Patient Edit' : 'Patient Registration'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isEditMode ? `Modifying record for ${formData.firstName || '...'} ${formData.lastName || '...'}` : 'Create a new patient profile and assign monitoring parameters'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className={`flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? 'Processing...' : <><Save size={20} /> {isEditMode ? 'Update Patient Details' : 'Save Full Profile'}</>}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <History size={20} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-100 p-4 space-y-2 bg-slate-50/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all font-bold text-sm
                ${activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-md border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
              `}
            >
              <tab.icon size={18} />
              <span className="flex-1 text-left">{tab.name}</span>
              {activeTab === tab.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 md:p-12">
          {activeTab === 'general' && <GeneralTab data={formData} onChange={handleChange} />}
          {activeTab === 'biometrics' && <BiometricsTab data={formData} onChange={handleChange} />}
          {activeTab === 'dependant' && <DependantTab data={formData} onChange={handleChange} />}
          {activeTab === 'behavior' && <BehaviorTab data={formData} onChange={handleChange} />}
        </div>
      </div>
    </div>
  );
};

export default PatientRegistration;
