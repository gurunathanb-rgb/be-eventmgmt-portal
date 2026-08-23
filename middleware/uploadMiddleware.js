const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload folders
const imageDir = path.join(__dirname, '../uploads/images');
const videoDir = path.join(__dirname, '../uploads/videos');

// Create folders automatically if they don't exist
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, imageDir);
    } else if (file.fieldname === 'video') {
      cb(null, videoDir);
    } else {
      cb(new Error('Invalid upload field'));
    }
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1E9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

// Validate file types
const fileFilter = (req, file, cb) => {

  // Images
  if (file.fieldname === 'image') {
    const allowedImages = [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (allowedImages.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error('Only JPG, JPEG and PNG image files are allowed')
    );
  }

  // Videos
  if (file.fieldname === 'video') {
    const allowedVideos = [
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (allowedVideos.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error('Only MP4, WebM and MOV video files are allowed')
    );
  }

  cb(new Error('Invalid upload field'));
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024 // Maximum 100 MB per file
  }
});

module.exports = upload;