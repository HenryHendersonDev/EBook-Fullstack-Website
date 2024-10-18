import { cleanDB } from './../utils/cleanDBUtils';
import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { generateRandomData, FixedData } from '../utils/userData';
import prisma from '../../src/config/prismaClientConfig';
import { createDynamicUser } from '../utils/createNewUser';

describe('POST /auth/me', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .get('/auth/me')
      .set('x-csrf-token', csrf.token)
      .set(
        'Cookie',
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg'
      )
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });

  it('Should Return 404 with Error Code SESSION_NOT_FOUND ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    await new Promise((resolve) => setTimeout(resolve, 2500));
    await cleanDB();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', user.accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('SESSION_NOT_FOUND');
  });

  it('Should return 200 and respond with JSON. using Cookie', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', user.accessTokenCookie)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.data).toBeDefined;
    expect(res.body.code).toBe('SUCCESSFULLY_GET_USER_DATA');
  });
});
