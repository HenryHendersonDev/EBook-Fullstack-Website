import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { FixedData, generateRandomData } from '../utils/userData';
import prisma from '../../src/config/prismaClientConfig';
import { exec } from 'child_process';

describe('POST /auth/register', () => {
  it('Should return 201, set the Access Token cookie, and respond with JSON.', async () => {
    await prisma?.user.deleteMany();
    exec('rdcli flushall');
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
    const body = {
      email: FixedData.email,
      password: FixedData.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
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

    expect(accessTokenCookie).toBeDefined();
  });

  it('Should Return 409 with Error Code UNIQUE_CONSTRAINT_FAILED ', async () => {
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
    const body = {
      email: FixedData.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const res = await request(app)
      .post('/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', csrfCookie)
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
