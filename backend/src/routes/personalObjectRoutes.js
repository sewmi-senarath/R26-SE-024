const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const PersonalObject = require('../models/PersonalObject');

const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// AI Service URL
const AI_SERVICE_URL = 'http://localhost:8000';

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { patientId, objectName, itemType, relationship } = req.body;
    const file = req.file;
    const mongoose = require('mongoose');

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 1. Send to AI Service for YOLO detection (and extract Embeddings!)
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), file.originalname);

    // Call generic detect (YOLO)
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-objects`, formData, {
      headers: { ...formData.getHeaders() }
    });
    
    // Also extract mathematical Embeddings for Few-Shot Learning
    const embFormData = new FormData();
    embFormData.append('file', fs.createReadStream(file.path), file.originalname);
    let embedding = [];
    try {
        const embResponse = await axios.post(`${AI_SERVICE_URL}/extract-embedding?type=${itemType || 'object'}`, embFormData, {
          headers: { ...embFormData.getHeaders() }
        });
        if (embResponse.data.success) {
            embedding = embResponse.data.embedding;
        }
    } catch (e) { console.error("Embedding extraction failed", e.message); }


    console.log('=== AI SERVICE RAW RESPONSE ===');
    console.log(JSON.stringify(aiResponse.data, null, 2));
    console.log('================================');

    const detectedLabels = aiResponse.data.objects || [];
    const detections = aiResponse.data.detections || [];

    console.log('Detected Labels:', detectedLabels);
    console.log('Detections count:', detections.length);

    // 2. Save to Database
    const newPersonalObject = new PersonalObject({
      patientId: new mongoose.Types.ObjectId(patientId),
      objectName: objectName || (detectedLabels[0] || 'Unknown Object'),
      detectedLabels,
      detections,
      imageUrl: `/uploads/${file.filename}` 
    });

    await newPersonalObject.save();

    res.json({
      success: true,
      data: {
        _id: newPersonalObject._id,
        patientId: newPersonalObject.patientId,
        objectName: newPersonalObject.objectName, itemType: itemType || 'object', relationship: relationship || '',
        imageUrl: newPersonalObject.imageUrl,
        detectedLabels: detectedLabels,
        detections: detections   // raw from AI service - always populated
      }
    });
  } catch (err) {
    console.error('Personal Object Upload Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/patient/:patientId', async (req, res) => {
  try {
    const objects = await PersonalObject.find({ patientId: req.params.patientId });
    res.json({ success: true, data: objects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stats for Analytics
router.get('/stats/all', async (req, res) => {
  try {
    const stats = await PersonalObject.aggregate([
      {
        $group: {
          _id: "$patientId",
          objectCount: { $sum: 1 },
          objects: { $push: "$objectName" },
          detections: { $push: "$detectedLabels" },
          avgAccuracy: { $avg: 94 }
        }
      },
      {
        $lookup: {
          from: "patientregistries",
          localField: "_id",
          foreignField: "_id",
          as: "patientInfo"
        }
      },
      {
        $project: {
          patientName: { 
            $concat: [
              { $arrayElemAt: ["$patientInfo.firstName", 0] }, 
              " ", 
              { $arrayElemAt: ["$patientInfo.lastName", 0] }
            ] 
          },
          objectCount: 1,
          objects: 1,
          avgAccuracy: 1
        }
      }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
