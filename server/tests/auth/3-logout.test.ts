import request from 'supertest';
import app from '../../src/app';
import fs from 'fs';
import path from 'path';
import { getCsrfTokenAndCookie } from '../utils/csrfToken';

describe('POST /auth/logout', () => {
  it('Should Return 401 with Error Code NOT_LOGGED_IN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .post('/auth/logout')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });

  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .post('/auth/logout')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrf.csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });

  it('Should return 200, Remove the Access Token cookie, and respond with JSON.', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const filePath = path.join(__dirname, '../data/accessToken.txt');

    const data = fs.readFileSync(filePath, 'utf8');

    const res = await request(app)
      .post('/auth/logout')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [data, csrf.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_LOGOUT');

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
    fs.unlinkSync(path.join(__dirname, '../data/accessToken.txt'));
    expect(accessTokenCookie).toBeDefined();
  });
});
