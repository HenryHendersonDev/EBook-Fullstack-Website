import request from 'supertest';
import app from '../../src/app';
import { generateRandomData } from '../utils/userData';
import path from 'path';
import { faker } from '@faker-js/faker';
import { getOtpFromEmail, deleteAllEmails } from '../utils/getOTPfromEmail';
import prisma from '../../src/config/prismaClientConfig';

describe('POST /auth/change-name', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_TOKEN ', async () => {
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set(
        'Cookie',
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg'
      )
      .send(body)
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
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('Cookie', accessTokenCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });
  it('Should Return 401 with Error Code NOT_LOGGED_IN ', async () => {
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });

  it('Should Return 400 with Error Code SCHEMA_VALIDATE_ERROR', async () => {
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
      .post('/auth/change-name')
      .set('Cookie', accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing First Name', async () => {
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
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('Cookie', accessTokenCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing last Name', async () => {
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
    const data = generateRandomData();
    const body = {
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('Cookie', accessTokenCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing First Name and Last Name', async () => {
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
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('Cookie', accessTokenCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
});
