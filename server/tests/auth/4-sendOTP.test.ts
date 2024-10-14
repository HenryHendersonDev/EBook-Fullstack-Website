import request from 'supertest';
import app from '../../src/app';
import { generateRandomData, FixedData } from '../utils/userData';

describe('POST /auth/otp-request', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_TOKEN ', async () => {
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
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_TOKEN');
  });
  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
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
    const body = {
      email: 'test@test.com',
    };
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('Should return 200 and respond with JSON. Using email', async () => {
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
    const body = {
      email: FixedData.email,
    };
    const res = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SENT_OTP');
  });

  it('Should return 200 and respond with JSON. using Cookie', async () => {
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
    const data = generateRandomData();
    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res1 = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(201);

    const cookies = res1.headers['set-cookie'];
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
      .post('/auth/otp-request')
      .set('x-csrf-token', token)
      .set('Cookie', [accessTokenCookie, csrfCookie])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SENT_OTP');
  });
});
