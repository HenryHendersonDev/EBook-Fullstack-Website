import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

// Function to handle file upload
const handleUpload = async (file: string) => {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: 'auto',
  });
  return res;
};

const handleDelete = async (publicId: string, type: string) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
    return res;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export { handleUpload, handleDelete };
