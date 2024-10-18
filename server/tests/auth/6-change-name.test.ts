import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import request from 'supertest';
import app from '../../src/app';
import { generateRandomData } from '../utils/userData';
import path from 'path';
import prisma from '../../src/config/prismaClientConfig';
import { createDynamicUser } from '../utils/createNewUser';
import { cleanDB } from '../utils/cleanDBUtils';

describe('POST /auth/change-name', () => {
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
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
  it('Should Return 404 with Error Code SESSION_NOT_FOUND ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await cleanDB();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('SESSION_NOT_FOUND');
  });
  it('Should Return 401 with Error Code NOT_LOGGED_IN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body)
      .expect('Content-Type', /json/)
      .expect(401);
    expect(res.body.code).toBe('NOT_LOGGED_IN');
  });

  it('Should Return 400 with Error Code SCHEMA_VALIDATE_ERROR', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing First Name', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing last Name', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const data = generateRandomData();
    const body = {
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)

      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_UPDATED_NAMES This is for only Changing First Name and Last Name', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const data = generateRandomData();
    const body = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    const res = await request(app)
      .post('/auth/change-name')
      .set('x-csrf-token', csrf.token)

      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_UPDATED_NAMES');
  });
});
