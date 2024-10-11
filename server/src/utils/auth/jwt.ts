import AppError from '@/models/AppErrorModel';
import { createRefreshRecord, getRefreshRecord } from '@/models/auth/jwtModel';
import Redis from 'ioredis';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface Payload {
  id: string;
}

interface IJwtService {
  sign: (userID: string, redis: Redis) => Promise<string>;
  verify: (token: string, isRefreshToken: boolean) => Payload | null;
  decode: (token: string) => Payload;
  reSignAccess: (accessToken: string, redis: Redis | null) => Promise<string>;
}

class JwtService implements IJwtService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiresIn: string;
  private refreshTokenExpiresIn: string;

  constructor() {
    if (
      !process.env['JWT_ACCESS_TOKEN_SECRET'] ||
      !process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'] ||
      !process.env['JWT_REFRESH_TOKEN_SECRET'] ||
      !process.env['JWT_REFRESH_TOKEN_EXPIRES_IN']
    ) {
      throw new Error('JWT Environment Variables are not set');
    }

    this.accessTokenSecret = process.env['JWT_ACCESS_TOKEN_SECRET'];
    this.refreshTokenSecret = process.env['JWT_REFRESH_TOKEN_SECRET'];
    this.accessTokenExpiresIn = process.env['JWT_ACCESS_TOKEN_EXPIRES_IN'];
    this.refreshTokenExpiresIn = process.env['JWT_REFRESH_TOKEN_EXPIRES_IN'];
  }
  private handleError(error: unknown, context: string): never {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(
        `Something Went Wrong At ${context}`,
        500,
        false,
        error,
        true,
        'SERVER_ERROR'
      );
    }
    throw new Error(`An unexpected error occurred: ${error}`);
  }

  async sign(userID: string, redis: Redis): Promise<string> {
    try {
      const id = uuidv4();
      const tokenData = { id };
      const AccessToken = jwt.sign(tokenData, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiresIn,
        algorithm: 'HS512',
      });
      const RefreshToken = jwt.sign(tokenData, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiresIn,
        algorithm: 'HS512',
      });
      const sessionID = await createRefreshRecord(
        id,
        userID,
        RefreshToken,
        redis
      );
      if (!sessionID) {
        throw new AppError(
          'Something went Wrong Storing Session',
          500,
          false,
          undefined,
          false,
          'SERVER_ERROR'
        );
      }
      return AccessToken;
    } catch (error) {
      this.handleError(error, 'JWT Signing');
    }
  }

  verify(token: string, isRefreshToken: boolean): Payload | null {
    if (isRefreshToken) {
      try {
        return jwt.verify(token, this.refreshTokenSecret) as Payload;
      } catch (error) {
        if (
          error instanceof TokenExpiredError &&
          error.name === 'TokenExpiredError'
        ) {
          return null;
        }
        this.handleError(error, 'JWT Verification');
      }
    } else {
      try {
        return jwt.verify(token, this.accessTokenSecret) as Payload;
      } catch (error) {
        if (
          error instanceof TokenExpiredError &&
          error.name === 'TokenExpiredError'
        ) {
          return null;
        }
        this.handleError(error, 'JWT Verification');
      }
    }
  }
  decode(token: string): Payload {
    try {
      const payload = jwt.decode(token) as Payload;
      return payload;
    } catch (error) {
      this.handleError(error, 'JWT Decoding');
    }
  }
  async reSignAccess(
    accessToken: string,
    redis: Redis | null
  ): Promise<string> {
    try {
      const payload = this.decode(accessToken);

      const refreshToken = await getRefreshRecord(payload.id, redis);

      if (!refreshToken) {
        throw new AppError(
          'Session expired, please login again',
          401,
          true,
          undefined,
          false,
          'UNAUTHORIZED_SESSION_EXPIRED'
        );
      }

      const refreshVerify = this.verify(refreshToken, true);

      if (!refreshVerify) {
        throw new AppError(
          'Session expired, please login again',
          401,
          true,
          undefined,
          false,
          'UNAUTHORIZED_SESSION_EXPIRED'
        );
      }

      const AccessToken = jwt.sign(
        { id: refreshVerify.id },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiresIn,
          algorithm: 'HS512',
        }
      );

      return AccessToken;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else if (error instanceof Error) {
        this.handleError(error, 'Re Sign Access');
      }
      throw new Error(`An unexpected error occurred: ${error}`);
    }
  }
}

const jwtService = new JwtService();

export default jwtService;
