import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { FixedData, data } from '../utils/userData';

describe('POST /auth/register', () => {
  it('Should return 201, set the Access Token cookie, and respond with JSON.', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');

    const body = {
      email: FixedData.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body.code).toBe('SUCCESSFULLY_CREATED');

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

  it('Should Return 409 with Error Code SUCCESSFULLY_CREATED ', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');

    const body = {
      email: FixedData.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(409);

    expect(res.body.code).toBe('UNIQUE_CONSTRAINT_FAILED');
  });
});
