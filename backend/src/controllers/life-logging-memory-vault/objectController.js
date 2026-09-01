const ObjectLocation = require('../../models/ObjectLocation');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, require('os').tmpdir()),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
exports.upload = multer({ storage });

// Upsert object location - updates if exists, inserts if not
exports.upsertObjectLocation = async (req, res) => {
  try {
    const { patientId, objectName, roomLabel, locationDetail, lat, lng, confidence, detectedBy } = req.body;
    if (!patientId || !objectName) return res.status(400).json({ success: false, message: 'patientId and objectName required' });

    const objNameLower = objectName.toLowerCase().trim();
    const doc = await ObjectLocation.findOneAndUpdate(
      { patientId, objectName: objNameLower },
      { $set: { roomLabel: roomLabel || 'Unknown', locationDetail: locationDetail || '', 'coordinates.lat': lat || null, 'coordinates.lng': lng || null, confidence: confidence || 0, detectedBy: detectedBy || 'camera', detectedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Context-Aware Misplacement & Safe Zone Alerts
    if (roomLabel && roomLabel !== 'Unknown') {
      const User = require('../../models/auth/User');
      const { createNotification } = require('../caregiver/Notificationcontroller');
      
      const patient = await User.findById(patientId);
      if (patient && patient.assignedCaregiverId) {
        let alertMsg = null;
        let severity = 'info';

        // 1. Safe Zone Violation
        if ((objNameLower === 'wallet' || objNameLower === 'keys') && roomLabel.toLowerCase() === 'outside') {
          alertMsg = `⚠️ Safe Zone Alert: ${patient.fullName}'s ${objNameLower} was detected Outside!`;
          severity = 'high';
        }
        // 2. Misplacement Anomaly
        else if (
          (objNameLower === 'keys' && roomLabel.toLowerCase() === 'refrigerator') ||
          (objNameLower === 'remote' && roomLabel.toLowerCase() === 'bathroom') ||
          (objNameLower === 'wallet' && roomLabel.toLowerCase() === 'kitchen')
        ) {
          alertMsg = `🔍 Misplacement Alert: ${patient.fullName}'s ${objNameLower} was found in the ${roomLabel}.`;
          severity = 'warning';
        }

        if (alertMsg) {
          await createNotification({
            caregiverId: patient.assignedCaregiverId,
            patientName: patient.fullName,
            message: alertMsg,
            severity,
            source: 'object-detector'
          });
        }
      }
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all object locations for a patient
exports.getPatientObjects = async (req, res) => {
  try {
    const objects = await ObjectLocation.find({ patientId: req.params.patientId }).sort({ detectedAt: -1 });
    return res.status(200).json({ success: true, data: objects });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ESP32-CAM upload endpoint - receives image, runs YOLO, upserts all detections
exports.piCameraUpload = async (req, res) => {
  try {
    const { patientId, roomLabel } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file' });
    if (!patientId) return res.status(400).json({ success: false, message: 'patientId required' });

    const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    const imageBuffer = fs.readFileSync(req.file.path);
    const form = new FormData();
    form.append('file', imageBuffer, { filename: 'cam.jpg', contentType: 'image/jpeg' });

    const yoloRes = await axios.post(`${AI_URL}/detect`, form, { headers: form.getHeaders(), timeout: 20000 });
    const detections = yoloRes.data.detections || [];

    const saved = [];
    for (const det of detections) {
      const objectName = (det.label || det.class || det.class_name || '').toLowerCase().trim();
      if (!objectName || (det.confidence || 0) < 0.35) continue;
      const doc = await ObjectLocation.findOneAndUpdate(
        { patientId, objectName },
        { $set: { roomLabel: roomLabel || 'Unknown', confidence: Math.round((det.confidence || 0) * 100), detectedBy: 'esp32cam', detectedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      saved.push(doc);
    }
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(200).json({ success: true, detected: detections.length, saved: saved.length, objects: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
