import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { FixedData, data } from '../utils/userData';

describe('POST /auth/login', () => {
  it('Should return 200, set the Access Token cookie, and respond with JSON.', async () => {
    const body = {
      email: FixedData.email,
      password: FixedData.password,
    };

    const res = await request(app)
      .post('/auth/login')
      .field('email', body.email)
      .field('password', body.password)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_LOGIN');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    let accessTokenCookie;

    if (Array.isArray(cookies)) {
      accessTokenCookie = cookies
        .map((cookie) => cookie.split('; ')[0])
        .find((cookie) => cookie.startsWith('accessToken='));
    } else if (typeof cookies === 'string') {
      accessTokenCookie = cookies
        .split('; ')
        .find((cookie) => cookie.startsWith('accessToken='));
    }

    expect(accessTokenCookie).toBeDefined();
  });

  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
    const body = {
      email: data.email,
      password: data.password,
    };

    const res = await request(app)
      .post('/auth/login')
      .field('email', body.email)
      .field('password', body.password)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('Should Return 400 with Error Code INVALID_PASSWORD ', async () => {
    const body = {
      email: FixedData.email,
      password: data.password,
    };

    const res = await request(app)
      .post('/auth/login')
      .field('email', body.email)
      .field('password', body.password)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(res.body.code).toBe('INVALID_PASSWORD');
  });
});
