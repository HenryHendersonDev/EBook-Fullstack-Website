import cloudinary from '@/config/cloudinaryConfig';
import handleError from '@/utils/errorHandle';
import { UploadApiResponse } from 'cloudinary';

export enum CloudinaryFolders {
  PROFILE_PICS = 'profile_pics',
  PRODUCT_IMAGES = 'product_images',
}

interface IStorageUtils {
  upload(file: string, folder: CloudinaryFolders): Promise<UploadApiResponse>;
  delete(publicId: string, type: string): Promise<UploadApiResponse>;
}

/**
 *
 * Purpose: Storage service
 *
 */

class StorageUtils implements IStorageUtils {
  /**
   *
   * Purpose: Upload Files To cloudinary
   *
   * Context: Upload GIven File to cloudinary Storage
   *
   * Returns: <UploadApiResponse> Object
   *
   */

  async upload(
    file: string,
    folder: CloudinaryFolders
  ): Promise<UploadApiResponse> {
    try {
      const res = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'auto',
      });
      return res;
    } catch (error) {
      return handleError(error, 'Uploading File');
    }
  }
  /**
   *
   * Purpose: Deleting given file on cloudinary
   *
   * Context: Delete Given File public ID on the cloudinary
   *
   * Returns: <UploadApiResponse> Object
   *
   */

  async delete(publicId: string, type: string): Promise<UploadApiResponse> {
    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
      });
      return res;
    } catch (error) {
      return handleError(error, 'Deleting File');
    }
  }
}

/**
 *
 * Purpose: Uploading and deleting Files
 *
 */

const storageUtils = new StorageUtils();

export default storageUtils;
