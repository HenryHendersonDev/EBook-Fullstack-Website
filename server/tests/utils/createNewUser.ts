import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { FixedData, generateRandomData } from '../utils/userData';

export const createFixedUser = async (csrf: string, csrfCookie: string) => {
  const imgDIR = path.join(__dirname, '../data/avatar.jpg');

  const data = generateRandomData();
  const body = {
    email: FixedData.email,
    password: FixedData.password,
    firstName: data.firstName,
    lastName: data.lastName,
  };

  const res = await request(app)
    .post('/auth/register')
    .set('x-csrf-token', csrf)
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

  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    accessTokenCookie,
  };
};

export const createDynamicUser = async (csrf: string, csrfCookie: string) => {
  const imgDIR = path.join(__dirname, '../data/avatar.jpg');
  const data = generateRandomData();
  const body = {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
  };

  const res = await request(app)
    .post('/auth/register')
    .set('x-csrf-token', csrf)
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

  return {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    accessTokenCookie,
  };
};
