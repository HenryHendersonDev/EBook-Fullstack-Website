import request from 'supertest';
import app from '../../src/app';

export const getCsrfTokenAndCookie = async () => {
  const csrfResponse = await request(app)
    .get('/protection/csrf')
    .expect('Content-Type', /json/)
    .expect(200);

  const token = csrfResponse.body.token;
  if (!token) {
    throw new Error('CSRF token not found');
  }

  const csrfCookies = csrfResponse.headers['set-cookie'];
  if (!csrfCookies) {
    throw new Error('CSRF cookies not found');
  }

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

  if (!csrfCookie) {
    throw new Error('CSRF cookie not found');
  }

  return { token, csrfCookie };
};
