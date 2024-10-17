import { createFixedUser } from './../utils/createNewUser';
import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import { cleanDB } from './../utils/cleanDBUtils';
import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { FixedData, generateRandomData } from '../utils/userData';

describe('POST /auth/register', () => {
  it('Should return 201, set the Access Token cookie, and respond with JSON.', async () => {
    await cleanDB();
    const csrfData = await getCsrfTokenAndCookie();
    const user = await createFixedUser(csrfData.token, csrfData.csrfCookie);
  });

  it('Should Return 409 with Error Code UNIQUE_CONSTRAINT_FAILED ', async () => {
    const csrfData = await getCsrfTokenAndCookie();
    const imgDIR = path.join(__dirname, '../data/avatar.jpg');
    const data = generateRandomData();
    const body = {
      email: FixedData.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', csrfData.token)
      .set('Cookie', csrfData.csrfCookie)
      .field('email', body.email)
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR)
      .expect('Content-Type', /json/)
      .expect(409);

    expect(res.body.code).toBe('UNIQUE_CONSTRAINT_FAILED');
  });
});
