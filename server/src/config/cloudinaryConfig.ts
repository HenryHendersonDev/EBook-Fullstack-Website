import AppError from '@/models/AppErrorModel';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

// Function to handle file upload
const handleUpload = async (file: string): Promise<UploadApiResponse> => {
  try {
    const res = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
    });
    return res;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Uploading image',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

const handleDelete = async (publicId: string, type: string) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
    return res;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        'Something went Wrong While Uploading image',
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }
};

export { handleUpload, handleDelete };
