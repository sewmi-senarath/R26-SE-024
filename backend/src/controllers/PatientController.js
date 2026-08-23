const Patient = require('../models/Patient'); // This exports PatientRegistry

// @desc    Register a new patient
// @route   POST /api/patients
const registerPatient = async (req, res) => {
  try {
    const patientData = req.body;
    
    // Check if customer code already exists
    const existingPatient = await Patient.findOne({ customerCode: patientData.customerCode });
    if (existingPatient) {
      return res.status(400).json({ message: 'Customer code already exists' });
    }

    const patient = new Patient(patientData);
    await patient.save();
    
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk upload patients
// @route   POST /api/patients/bulk
const bulkUploadPatients = async (req, res) => {
  try {
    const patients = req.body; // Expecting an array of patient objects
    
    if (!Array.isArray(patients)) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array.' });
    }

    // This is a simple implementation. In a real scenario, you'd handle duplicates properly.
    const result = await Patient.insertMany(patients, { ordered: false });
    
    res.status(201).json({
      success: true,
      message: `${result.length} patients uploaded successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      // If some inserted successfully despite others failing (due to ordered: false)
      insertedCount: error.insertedDocs ? error.insertedDocs.length : 0
    });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get patient by ID
// @route   GET /api/admin/patients/by-id/:id
const getPatientById = async (req, res) => {
  try {
    console.log('Fetching patient by ID:', req.params.id);
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get patient by customer code
// @route   GET /api/patients/:code
const getPatientByCode = async (req, res) => {
  try {
    const patient = await Patient.findOne({ customerCode: req.params.code });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerPatient,
  bulkUploadPatients,
  getAllPatients,
  getPatientByCode,
  getPatientById,
  updatePatient
};
