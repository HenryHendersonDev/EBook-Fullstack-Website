import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { generateRandomData } from '../utils/userData';
import { deleteAllEmails, getOtpFromEmail } from '../utils/getOTPfromEmail';
import { getCsrfTokenAndCookie } from '../utils/csrfToken';
import { createDynamicUser } from '../utils/createNewUser';

describe('POST delete-me', () => {
  it('Should Return 401 with Error Code NOT_LOGGED_IN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .delete('/auth/delete-me')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });

  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const body = {
      otp: '123456',
    };
    const res = await request(app)
      .delete('/auth/delete-me')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrf.csrfCookie,
      ])

      .send(body)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });

  it('Should return 400, with Error code INVALID_OTP', async () => {
    const data = generateRandomData();
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const body_2 = {
      otp: data.otp,
    };

    const res_2 = await request(app)
      .delete('/auth/delete-me')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res_2.body.code).toBe('INVALID_OTP');
  });

  it('Should return 200, with  code SUCCESSFULLY_DELETED_USER', async () => {
    const csrf = await getCsrfTokenAndCookie();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = generateRandomData();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const body_3 = {
      email: user.email,
    };
    const res_3 = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
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
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res_2.body.code).toBe('SUCCESSFULLY_DELETED_USER');
  });
});
