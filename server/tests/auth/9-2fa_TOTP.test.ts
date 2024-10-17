import { cleanDB } from './../utils/cleanDBUtils';
import { createDynamicUser } from './../utils/createNewUser';
import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import request from 'supertest';
import app from '../../src/app';
import generateToken from '../utils/2faGen';
import { getOtpFromEmail } from '../utils/getOTPfromEmail';

describe('POST /auth/generate-Totp', () => {
  let userCookie;
  let userEmail;
  let userPassword;
  let csrfCookieData;
  let csrfToken;
  let twpfaKey;

  let newUserCookie;
  let newUserEmail;
  let newUserPassword;

  it('Should return 401, With error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN', async () => {
    await cleanDB();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const csrfData = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrfData.token, csrfData.csrfCookie);
    userCookie = user.accessTokenCookie;
    userEmail = user.email;
    userPassword = user.password;
    csrfCookieData = csrfData.csrfCookie;
    csrfToken = csrfData.token;

    const res = await request(app)
      .post('/auth/generate-Totp')
      .set('x-csrf-token', csrfData.token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrfData.csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });

  it('Should return 401, With error Code NOT_LOGGED_IN', async () => {
    const res = await request(app)
      .post('/auth/generate-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });
  it('Should return 200, With error Code SUCCESSFULLY_CREATED_TOTP', async () => {
    const res = await request(app)
      .post('/auth/generate-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_CREATED_TOTP');
    expect(res.body.data.secret).toBeDefined();
    twpfaKey = res.body.data.secret;
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/verify-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should return 400, With error Code TOTP_NOT_ENABLED', async () => {
    const csrfData = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrfData.token, csrfData.csrfCookie);

    const body = {
      token: '123546',
    };

    newUserCookie = user.accessTokenCookie;
    newUserEmail = user.email;
    newUserPassword = user.password;

    const res = await request(app)
      .post('/auth/verify-Totp')
      .send(body)
      .set('x-csrf-token', csrfData.token)
      .set('Cookie', [user.accessTokenCookie, csrfData.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('TOTP_NOT_ENABLED');
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/verify-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
    expect(res.body.message).toBe(
      'You are not providing an email or you are not logged in.'
    );
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/verify-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });

  it('Should return 200, With error Code SUCCESSFULLY_VERIFIED_TOTP', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      token,
    };

    const res = await request(app)
      .post('/auth/verify-Totp')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_VERIFIED_TOTP');
  });

  it('Should return 200, With error Code SUCCESSFULLY_VERIFIED_TOTP', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      email: userEmail,
      token,
    };
    const res = await request(app)
      .post('/auth/verify-Totp')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_VERIFIED_TOTP');
  });

  it('Should return 401, With error Code INCORRECT_PASSWORD', async () => {
    const body = {
      email: userEmail,
      password: 'userPassword',
      otp: '325615',
    };
    const res = await request(app)
      .post('/auth/remove-Totp/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('INCORRECT_PASSWORD');
  });

  it('Should return 400, With error Code INVALID_OTP', async () => {
    const body = {
      email: userEmail,
      password: userPassword,
      otp: '325615',
    };
    const res = await request(app)
      .post('/auth/remove-Totp/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('Should return 400, With error Code TOTP_NOT_ENABLED', async () => {
    const body = {
      email: newUserEmail,
      password: newUserPassword,
      otp: '325615',
    };
    const res = await request(app)
      .post('/auth/remove-Totp/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('TOTP_NOT_ENABLED');
  });

  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const body = {
      email: newUserEmail,
      password: newUserPassword,
    };
    const res = await request(app)
      .post('/auth/remove-Totp/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });

  it('Should return 200, With error Code SUCCESSFULLY_REMOVED_TOTP', async () => {
    const res_2 = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_2.body.code).toBe('SUCCESSFULLY_SENT_OTP');
    const otp = await getOtpFromEmail();
    const otpString = otp.toString();
    const body = {
      email: userEmail,
      password: userPassword,
      otp: otpString,
    };
    const res = await request(app)
      .post('/auth/remove-Totp/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/);

    expect(res.body.code).toBe('SUCCESSFULLY_REMOVED_TOTP');
  });

  it('Should return 401, With error Code NOT_LOGGED_IN', async () => {
    const res = await request(app)
      .post('/auth/remove-Totp/Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/remove-Totp/Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });

  it('Should return 401, With error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN', async () => {
    const body = {
      token: '123456',
    };
    const res = await request(app)
      .post('/auth/remove-Totp/Totp')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrfCookieData,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });
  it('Should return 400, With error Code INVALID_TOTP_TOKEN', async () => {
    const csrfData = await getCsrfTokenAndCookie();

    const user = await createDynamicUser(csrfData.token, csrfData.csrfCookie);
    userCookie = user.accessTokenCookie;
    userEmail = user.email;
    userPassword = user.password;
    csrfCookieData = csrfData.csrfCookie;
    csrfToken = csrfData.token;

    const res_3 = await request(app)
      .post('/auth/generate-Totp')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res_3.body.code).toBe('SUCCESSFULLY_CREATED_TOTP');
    expect(res_3.body.data.secret).toBeDefined();
    twpfaKey = res_3.body.data.secret;

    const body = {
      token: '123455',
    };
    const res = await request(app)
      .post('/auth/remove-Totp/Totp')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_TOTP_TOKEN');
  });

  it('Should return 200, With error Code SUCCESSFULLY_REMOVED_TOTP', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      token,
    };
    const res = await request(app)
      .post('/auth/remove-Totp/Totp')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_REMOVED_TOTP');
  });
});
