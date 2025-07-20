
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'loan-documents', // you can customize this
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: `${Date.now()}-${file.originalname}`
  })
});

const upload = multer({ storage });

export default upload;
