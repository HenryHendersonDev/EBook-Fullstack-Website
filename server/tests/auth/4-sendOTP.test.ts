import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import request from 'supertest';
import app from '../../src/app';
import { generateRandomData, FixedData } from '../utils/userData';
import { createDynamicUser } from '../utils/createNewUser';

describe('POST /auth/otp-request', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrf.csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });
  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const body = {
      email: 'test@test.com',
    };
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('Should return 200 and respond with JSON. Using email', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const body = {
      email: user.email,
    };
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SENT_OTP');
  });

  it('Should return 200 and respond with JSON. using Cookie', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SENT_OTP');
  });
});
