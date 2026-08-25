const Caregiver = require('../../models/caregiver/Caregiver');

// Helper 
const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// GET profile 
const getProfile = async (req, res) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id).select('-password');
    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }
    res.status(200).json({ success: true, caregiver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE caregiver 
const createCaregiver = async (req, res) => {
  try {
    const { name, email, password, role, avatarColor } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required',
      });
    }

    const existing = await Caregiver.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const caregiver = await Caregiver.create({
      name,
      email,
      password,
      role:        role || 'Caregiver',
      initials:    getInitials(name),
      avatarColor: avatarColor || '#2563EB',
    });

    const { password: _, ...data } = caregiver.toObject();
    res.status(201).json({ success: true, caregiver: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE profile — FIXED 
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Update request body:', req.body); 
    console.log('Update ID:', id);                  

    const {
      name,
      role,
      email,
      profileImage,
    } = req.body;

    // Build update object only with provided fields
    const updateData = {};

    if (name !== undefined && name !== '') {
      updateData.name     = name.trim();
      updateData.initials = getInitials(name.trim());
    }
    if (role !== undefined)         updateData.role         = role;
    if (email !== undefined)        updateData.email        = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    console.log('Update data:', updateData); // ← debug log

    const caregiver = await Caregiver.findByIdAndUpdate(
      id,
      { $set: updateData }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    console.log('Updated caregiver:', caregiver); 

    res.status(200).json({ success: true, caregiver });
  } catch (error) {
    console.log('Update error:', error.message); 
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE stats 
const updateStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { shiftsCompleted, patientsAssigned, hoursThisWeek } = req.body;

    const updateData = {};
    if (shiftsCompleted  !== undefined) updateData.shiftsCompleted  = shiftsCompleted;
    if (patientsAssigned !== undefined) updateData.patientsAssigned = patientsAssigned;
    if (hoursThisWeek    !== undefined) updateData.hoursThisWeek    = hoursThisWeek;

    const caregiver = await Caregiver.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    res.status(200).json({ success: true, caregiver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE online status 
const updateOnlineStatus = async (req, res) => {
  try {
    const { id }      = req.params;
    const { isOnline } = req.body;

    const caregiver = await Caregiver.findByIdAndUpdate(
      id,
      { $set: { isOnline } },
      { new: true }
    ).select('-password');

    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }

    res.status(200).json({ success: true, caregiver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE caregiver 
const deleteCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.findByIdAndDelete(req.params.id);
    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: 'Caregiver not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Caregiver deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  createCaregiver,
  updateProfile,
  updateStats,
  updateOnlineStatus,
  deleteCaregiver,
};