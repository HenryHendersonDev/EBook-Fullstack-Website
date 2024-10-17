import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { generateRandomData } from '../utils/userData';
import exp from 'constants';
import generateToken from '../utils/2faGen';
import { getOtpFromEmail } from '../utils/getOTPfromEmail';

describe('POST /auth/generate-2fa', () => {
  let userCookie;
  let userEmail;
  let userPassword;
  let csrfCookieData;
  let csrfToken;
  let twpfaKey;

  let newUserCookie;
  let newUserEmail;
  let newUserPassword;

  it('Should return 401, With error Code UNAUTHORIZED_INVALID_TOKEN', async () => {
    const csrf_Token = await request(app)
      .get('/protection/csrf')
      .expect('Content-Type', /json/)
      .expect(200);
    const token = csrf_Token.body.token;
    expect(token).toBeDefined();

    const csrfCookies = csrf_Token.headers['set-cookie'];
    expect(csrfCookies).toBeDefined();

    let csrfCookie;

    if (Array.isArray(csrfCookies)) {
      csrfCookie = csrfCookies
        .map((cookie) => cookie.split('; ')[0])
        .find((cookie) => cookie.startsWith('csrf-Token='));
    } else if (typeof csrfCookies === 'string') {
      csrfCookie = csrfCookies
        .split('; ')
        .find((cookie) => cookie.startsWith('csrf-Token='));
    }

    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body_Create = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_create = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .field('email', body_Create.email)
      .field('password', body_Create.password)
      .field('firstName', body_Create.firstName)
      .field('lastName', body_Create.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res_create.body.code).toBe('SUCCESSFULLY_CREATED');

    const cookies = res_create.headers['set-cookie'];
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
    userCookie = accessTokenCookie;
    userEmail = body_Create.email;
    userPassword = body_Create.password;
    csrfCookieData = csrfCookie;
    csrfToken = token;

    const res = await request(app)
      .post('/auth/generate-2fa')
      .set('x-csrf-token', token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });

  it('Should return 401, With error Code NOT_LOGGED_IN', async () => {
    const res = await request(app)
      .post('/auth/generate-2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });
  it('Should return 200, With error Code SUCCESSFULLY_CREATED_2FA', async () => {
    const res = await request(app)
      .post('/auth/generate-2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_CREATED_2FA');
    expect(res.body.data.secret).toBeDefined();
    twpfaKey = res.body.data.secret;
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/verify-2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should return 400, With error Code 2FA_NOT_ENABLED', async () => {
    const csrf_Token = await request(app)
      .get('/protection/csrf')
      .expect('Content-Type', /json/)
      .expect(200);
    const token = csrf_Token.body.token;
    expect(token).toBeDefined();

    const csrfCookies = csrf_Token.headers['set-cookie'];
    expect(csrfCookies).toBeDefined();

    let csrfCookie;

    if (Array.isArray(csrfCookies)) {
      csrfCookie = csrfCookies
        .map((cookie) => cookie.split('; ')[0])
        .find((cookie) => cookie.startsWith('csrf-Token='));
    } else if (typeof csrfCookies === 'string') {
      csrfCookie = csrfCookies
        .split('; ')
        .find((cookie) => cookie.startsWith('csrf-Token='));
    }

    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body_Create = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_create = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .field('email', body_Create.email)
      .field('password', body_Create.password)
      .field('firstName', body_Create.firstName)
      .field('lastName', body_Create.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res_create.body.code).toBe('SUCCESSFULLY_CREATED');

    const cookies = res_create.headers['set-cookie'];
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
    const body = {
      token: '123546',
    };

    newUserCookie = accessTokenCookie;
    newUserEmail = body_Create.email;
    newUserPassword = body_Create.password;
    const res = await request(app)
      .post('/auth/verify-2fa')
      .send(body)
      .set('x-csrf-token', token)
      .set('Cookie', [accessTokenCookie, csrfCookie])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('2FA_NOT_ENABLED');
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/verify-2fa')
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
      .post('/auth/verify-2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });

  it('Should return 200, With error Code SUCCESSFULLY_VERIFIED_2FA', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      token,
    };
    const res = await request(app)
      .post('/auth/verify-2fa')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_VERIFIED_2FA');
  });

  it('Should return 200, With error Code SUCCESSFULLY_VERIFIED_2FA', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      email: userEmail,
      token,
    };
    const res = await request(app)
      .post('/auth/verify-2fa')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_VERIFIED_2FA');
  });

  it('Should return 401, With error Code INCORRECT_PASSWORD', async () => {
    const body = {
      email: userEmail,
      password: 'userPassword',
      otp: '325615',
    };
    const res = await request(app)
      .post('/auth/remove-2fa/email')
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
      .post('/auth/remove-2fa/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('Should return 400, With error Code 2FA_NOT_ENABLED', async () => {
    const body = {
      email: newUserEmail,
      password: newUserPassword,
      otp: '325615',
    };
    const res = await request(app)
      .post('/auth/remove-2fa/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('2FA_NOT_ENABLED');
  });

  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const body = {
      email: newUserEmail,
      password: newUserPassword,
    };
    const res = await request(app)
      .post('/auth/remove-2fa/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });

  it('Should return 200, With error Code SUCCESSFULLY_REMOVED_2FA', async () => {
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
      .post('/auth/remove-2fa/email')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/);

    expect(res.body.code).toBe('SUCCESSFULLY_REMOVED_2FA');
  });
  it('Should return 401, With error Code NOT_LOGGED_IN', async () => {
    const res = await request(app)
      .post('/auth/remove-2fa/2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', csrfCookieData)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const res = await request(app)
      .post('/auth/remove-2fa/2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should return 401, With error Code UNAUTHORIZED_INVALID_TOKEN', async () => {
    const body = {
      token: '123456',
    };
    const res = await request(app)
      .post('/auth/remove-2fa/2fa')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrfCookieData,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });
  it('Should return 400, With error Code INVALID_2FA_TOKEN', async () => {
    const csrf_Token = await request(app)
      .get('/protection/csrf')
      .expect('Content-Type', /json/)
      .expect(200);
    const token = csrf_Token.body.token;
    expect(token).toBeDefined();

    const csrfCookies = csrf_Token.headers['set-cookie'];
    expect(csrfCookies).toBeDefined();

    let csrfCookie;

    if (Array.isArray(csrfCookies)) {
      csrfCookie = csrfCookies
        .map((cookie) => cookie.split('; ')[0])
        .find((cookie) => cookie.startsWith('csrf-Token='));
    } else if (typeof csrfCookies === 'string') {
      csrfCookie = csrfCookies
        .split('; ')
        .find((cookie) => cookie.startsWith('csrf-Token='));
    }

    const imgDIR = path.join(__dirname, './avatar.jpg');
    const data = generateRandomData();
    const body_Create = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res_create = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .field('email', body_Create.email)
      .field('password', body_Create.password)
      .field('firstName', body_Create.firstName)
      .field('lastName', body_Create.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res_create.body.code).toBe('SUCCESSFULLY_CREATED');

    const cookies = res_create.headers['set-cookie'];
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
    userCookie = accessTokenCookie;
    userEmail = body_Create.email;
    userPassword = body_Create.password;
    csrfCookieData = csrfCookie;
    csrfToken = token;

    const res_3 = await request(app)
      .post('/auth/generate-2fa')
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res_3.body.code).toBe('SUCCESSFULLY_CREATED_2FA');
    expect(res_3.body.data.secret).toBeDefined();
    twpfaKey = res_3.body.data.secret;

    const body = {
      token: '123455',
    };
    const res = await request(app)
      .post('/auth/remove-2fa/2fa')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_2FA_TOKEN');
  });
  it('Should return 200, With error Code SUCCESSFULLY_REMOVED_2FA', async () => {
    const token = generateToken(twpfaKey);
    const body = {
      token,
    };
    const res = await request(app)
      .post('/auth/remove-2fa/2fa')
      .send(body)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', [userCookie, csrfCookieData])
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_REMOVED_2FA');
  });
});
