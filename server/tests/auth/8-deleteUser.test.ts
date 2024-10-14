import request from 'supertest';
import app from '../../src/app';
import fs from 'fs';
import path from 'path';
import { generateRandomData } from '../utils/userData';
import { deleteAllEmails, getOtpFromEmail } from '../utils/getOTPfromEmail';

describe('POST delete-me', () => {
  it('Should Return 401 with Error Code NOT_LOGGED_IN ', async () => {
    const res = await request(app)
      .delete('/auth/delete-me')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });

  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_TOKEN ', async () => {
    const body = {
      otp: '123456',
    };
    const res = await request(app)
      .delete('/auth/delete-me')
      .set(
        'Cookie',
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg'
      )
      .send(body)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });

  it('Should return 400, with Error code INVALID_OTP', async () => {
    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body = {
      email: data.email,
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

    const body_2 = {
      otp: data.otp,
    };

    const res_2 = await request(app)
      .delete('/auth/delete-me')
      .set('Cookie', accessTokenCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res_2.body.code).toBe('INVALID_OTP');
  });

  it('Should return 200, with  code SUCCESSFULLY_DELETED_USER', async () => {
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
      otp: otpString,
    };

    const res_2 = await request(app)
      .delete('/auth/delete-me')
      .set('Cookie', accessTokenCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res_2.body.code).toBe('SUCCESSFULLY_DELETED_USER');
  });
});
