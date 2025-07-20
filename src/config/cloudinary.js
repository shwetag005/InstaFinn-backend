import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = (file, folderPath) => {
  return new Promise((resolve, reject) => {
     if (!file.buffer) {
      return reject(new Error("File buffer is missing"));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderPath,
         timeout: 120000, // 2-minute timeout
        resource_type: 'auto', // handles all file types (image/pdf/etc.)
       },
      (error, result) => {
       if (error) return reject(error);
        // Free buffer only after upload completes
        resolve({
          name: file.originalname,
          url: result.secure_url,
          type: file.fieldname,
        });
        file.buffer = null; // ✅ Move this line here
      }
    );
    
    stream.end(file.buffer); // ✅ Use the buffer first
  });
};


export const deleteFromCloudinaryByUrl = async (url) => {
  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|pdf|webp)/;
    const match = url.match(regex);

    if (!match || !match[1]) {
      console.error("❌ Failed to extract public_id from URL:", url);
      return;
    }

    const publicId = match[1]; // Everything after 'upload/v123/' and before extension

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Deleted from Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary Delete Error:', error.message);
    throw error;
  }
};



export default cloudinary;