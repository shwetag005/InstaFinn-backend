import express from 'express';
import upload from '../config/cloudinaryUploader';

const router = express.Router();

// Upload multiple files (photo, aadhar, etc.)
router.post('/loan/upload/:id', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadharcard', maxCount: 2 },
  { name: 'pancard', maxCount: 1 },
  { name: 'incomeTaxReturn', maxCount: 5 },
  { name: 'creditReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];

    Object.keys(files).forEach((field) => {
      files[field].forEach((file) => {
        uploadedFiles.push({
          name: field,
          url: file.path,
          type: file.mimetype
        });
      });
    });

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

export default router;
