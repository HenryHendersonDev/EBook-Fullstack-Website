import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { generateRandomData, FixedData } from '../utils/userData';
import prisma from '../../src/config/prismaClientConfig';

describe('POST /auth/me', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_TOKEN ', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set(
        'Cookie',
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg'
      )
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });

  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data_2 = generateRandomData();
    const body_2 = {
      email: data_2.email,
      password: data_2.password,
      firstName: data_2.firstName,
      lastName: data_2.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body_2.email)
      .field('password', body_2.password)
      .field('firstName', body_2.firstName)
      .field('lastName', body_2.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res_2.body.code).toBe('SUCCESSFULLY_CREATED');

    const cookies = res_2.headers['set-cookie'];
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
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await prisma?.user.deleteMany();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('Should return 200 and respond with JSON. using Cookie', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data_2 = generateRandomData();
    const body_2 = {
      email: data_2.email,
      password: data_2.password,
      firstName: data_2.firstName,
      lastName: data_2.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body_2.email)
      .field('password', body_2.password)
      .field('firstName', body_2.firstName)
      .field('lastName', body_2.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res_2.body.code).toBe('SUCCESSFULLY_CREATED');

    const cookies = res_2.headers['set-cookie'];
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
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.data).toBeDefined;
    expect(res.body.code).toBe('SUCCESSFULLY_GET_USER_DATA');
  });
});
