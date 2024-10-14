import request from 'supertest';
import app from '../../src/app';
import { generateRandomData } from '../utils/userData';
import path from 'path';
import { getOtpFromEmail, deleteAllEmails } from '../utils/getOTPfromEmail';
import prisma from '../../src/config/prismaClientConfig';

describe('POST /auth/password-reset', () => {
  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
    const data = generateRandomData();
    const body = {
      email: data.email,
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body.code).toBe('USER_NOT_FOUND');
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
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('Cookie', accessTokenCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_TOKEN ', async () => {
    const data = generateRandomData();
    const body = {
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set(
        'Cookie',
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg'
      )
      .send(body)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });

  it('Should Return 400 with Error Code INVALID_OTP | using Token', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

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
    const body_2 = {
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('Cookie', accessTokenCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('Should Return 400 with Error Code INVALID_OTP | Using Email ', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    const cookies = res_2.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const body_2 = {
      email: body.email,
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_PASSWORD | using Token', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const imgDIR = path.join(__dirname, './avatar.jpg');

    const data = generateRandomData();

    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

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

    const res_3 = await request(app)
      .post('/auth/otp-request')
      .set('Cookie', accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_3.body.code).toBe('SUCCESSFULLY_SENT_OTP');

    const otp = await getOtpFromEmail();
    const otpString = otp.toString();
    const body_2 = {
      otp: otpString,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('Cookie', accessTokenCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_PASSWORD');
  });

  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_PASSWORD | Using Email ', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_2 = await request(app)
      .post('/auth/register')
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    const cookies = res_2.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const body_3 = {
      email: body.email,
    };
    const res_3 = await request(app)
      .post('/auth/otp-request')
      .send(body_3)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_3.body.code).toBe('SUCCESSFULLY_SENT_OTP');
    const otp = await getOtpFromEmail();
    const otpString = otp.toString();
    const body_2 = {
      email: body.email,
      otp: otpString,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_PASSWORD');
  });
});
