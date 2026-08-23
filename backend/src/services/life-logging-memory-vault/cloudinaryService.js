const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'life-logging-memory-vault',
    allowed_formats: ['jpg', 'png', 'jpeg', 'mp3', 'wav'],
  },
});

const upload = multer({ storage: storage });

const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, upload, deleteImage };
