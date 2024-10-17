import handleError from '@/utils/errorHandle';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface SecretKey {
  secret: string;
  otpauth_url: string;
}

interface ITotpUtils {
  generateSecretKey(): SecretKey;
  generateQRCode(otpauth_url: string): Promise<string>;
  verifyToken(secret: string, token: string): boolean;
}

/**
 *
 * Purpose: TOTP utils for create verify and qr return
 *
 */

class TotpUtils implements ITotpUtils {
  /**
   *
   * Purpose: Generate Totp secret key
   *
   * Context: generate totp secret key and otp Auth url with length 20
   *
   * Returns: <SecretKey> Object
   *
   */

  generateSecretKey(): SecretKey {
    try {
      const secret = speakeasy.generateSecret({
        name: process.env['WEBSITE_NAME'] || 'Your 2FA Key',
        length: 20,
      });

      return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
      };
    } catch (error) {
      return handleError(error, 'generating TOTP secret Key');
    }
  }
  /**
   *
   * Purpose: generate Qr Code
   *
   * Context: generate Qr Code for TOTP auth apps
   *
   * Returns: string of base64 image
   *
   */

  async generateQRCode(otpauth_url: string): Promise<string> {
    try {
      return new Promise<string>((resolve, reject) => {
        QRCode.toDataURL(otpauth_url, (err, url) => {
          if (err) return reject(err);
          resolve(url);
        });
      });
    } catch (error) {
      return handleError(error, 'generating TOTP secret Key');
    }
  }
  /**
   *
   * Purpose: verify Totp secret key
   *
   * Context: verify totp secret key using secret and token
   *
   * Returns: boolean
   *
   */

  verifyToken(secret: string, token: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 0,
      });
    } catch (error) {
      return handleError(error, 'Verifying TOTP secret Key');
    }
  }
}

/**
 *
 * Purpose: TOTP utils for create verify and qr return
 *
 */

const totpUtils = new TotpUtils();

export default totpUtils;
