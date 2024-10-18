import AppError from '@/models/AppErrorModel';
import handleError from '@/utils/errorHandle';
import crypto from 'crypto';

interface IUserVerifyLinkGenerate {
  encryptUserEmailLink(email: string): string;
  decryptUserEmailLink(
    encryptedData: string,
    iv: string,
    authTag: string
  ): string | null;
}

/**
 * Class for generating and handling user verification links.
 */
class UserVerifyLinkGenerate implements IUserVerifyLinkGenerate {
  private email_verification_encryption_key: string;
  private protocol: string;
  private domain: string;
  private port: string;

  constructor() {
    if (
      !process.env['EMAIL_VERIFICATION_ENCRYPTION_KEY'] ||
      !process.env['PROTOCOL'] ||
      !process.env['DOMAIN'] ||
      !process.env['PORT']
    ) {
      throw new AppError(
        'User Link gen Environment Variables are not set',
        500,
        false,
        undefined,
        true,
        'SERVER_ERROR'
      );
    }

    this.email_verification_encryption_key =
      process.env['EMAIL_VERIFICATION_ENCRYPTION_KEY'];
    this.protocol = process.env['PROTOCOL'];
    this.domain = process.env['DOMAIN'];
    this.port = process.env['PORT'];
  }

  /**
   *
   * Purpose: Encrypts the provided email using AES-256-GCM and generates
   * a verification link containing the encrypted data, IV, and auth tag.
   *
   * Context: Used during user registration to verify the user's email.
   *
   * Returns: The generated verification link or null if an error occurs.
   */
  encryptUserEmailLink(email: string): string {
    try {
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(this.email_verification_encryption_key, 'hex'),
        iv
      );

      let encrypted = cipher.update(email, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag().toString('base64');

      return `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}/auth/email-Verification-check?data=${encrypted}&iv=${iv.toString('base64')}&tag=${authTag}`;
    } catch (error) {
      return handleError(error, 'Encrypting User Email Link');
    }
  }

  /**
   *
   * Purpose: Decrypts the encrypted data received in the verification link
   * to extract the original email address.
   *
   * Context: Used after the user clicks the verification link to verify
   * their email.
   *
   * Returns: The original email or null if decryption fails.
   */
  decryptUserEmailLink(
    encryptedData: string,
    iv: string,
    authTag: string
  ): string | null {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(this.email_verification_encryption_key, 'hex'),
        Buffer.from(iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'base64'));

      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.log(error);
      throw new AppError(
        'Invalid Link',
        400,
        true,
        undefined,
        false,
        'INVALID_LINK'
      );
    }
  }
}

/**
 * Instance of UserVerifyLinkGenerate for use in other parts of the application.
 */
const userVerifyLinkGenerate = new UserVerifyLinkGenerate();

export default userVerifyLinkGenerate;
