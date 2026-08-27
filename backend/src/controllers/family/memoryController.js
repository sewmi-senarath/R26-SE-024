const Memory = require('../../models/family/FamilyMemory');
const Patient = require('../../models/caregiver/Patient');
const FamilyPatientProfile = require('../../models/family/FamilyPatientProfile');
const axios = require('axios');
const cloudinary = require('../../config/cloudinary');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// --- CREATE memory + generate story ---
const createMemory = async (req, res) => {
  try {
    const { patientId, familyNote, imageBase64 } = req.body;

    if (!patientId || !familyNote || !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'patientId, familyNote and imageBase64 are required',
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // get the family-specific profile (spouse, children, hometown)
    // defaults to empty values if no profile exists yet
    let profile = await FamilyPatientProfile.findOne({ patientId });
    if (!profile) {
      profile = { spouse: '', children: [], hometown: '' };
    }

    // upload photo to cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${imageBase64}`,
      { folder: 'memocare/memories' }
    );

    // call AI service — BLIP-2 + fine-tuned model
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/generate-from-photo`,
      {
        image_base64: imageBase64,
        family_note: familyNote,
        patient_name: patient.name,
        spouse: profile.spouse,
        children: (profile.children || []).join(', '),
        hometown: profile.hometown,
      },
      { timeout: 90000 }
    );

    if (!aiResponse.data.success) {
      return res.status(500).json({
        success: false,
        message: 'AI story generation failed',
      });
    }

    const memory = await Memory.create({
      patientId,
      uploadedBy: req.user ? req.user._id : null,
      photoUrl: uploadResult.secure_url,
      familyNote,
      aiPhotoDescription: aiResponse.data.photo_desc,
      generatedStory: aiResponse.data.story,
    });

    res.status(201).json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET all memories for a patient ---
const getMemoriesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const memories = await Memory.find({ patientId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GET single memory ---
const getMemoryById = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.status(200).json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPDATE play count ---
const incrementPlayCount = async (req, res) => {
  try {
    const memory = await Memory.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.status(200).json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DELETE memory ---
const deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findByIdAndDelete(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    res.status(200).json({ success: true, message: 'Memory deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMemory,
  getMemoriesByPatient,
  getMemoryById,
  incrementPlayCount,
  deleteMemory,
};