import request from 'supertest';
import app from '../../src/app';
import path from 'path';
import { faker } from '@faker-js/faker';

describe('POST /auth/register', () => {
  const email = faker.internet.email();
  it('Should return 201, set the Access Token cookie, and respond with JSON.', async () => {
    // Path to the image file
    const imgDIR = path.join(__dirname, './avatar.jpg');

    // Generate random user data
    const body = {
      email,
      password: faker.internet.password(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };

    // Make the POST request with form data
    const res = await request(app)
      .post('/auth/register') // Use POST instead of GET
      .field('email', body.email) // Send text fields as form data
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR) // Attach the image
      .expect('Content-Type', /json/) // Check that the response is JSON
      .expect(201); // Check for 201 status

    expect(res.body.code).toBe('SUCCESSFULLY_CREATED');
    // Get the 'set-cookie' header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // Check if 'cookies' is an array or string
    let accessTokenCookie;

    if (Array.isArray(cookies)) {
      // If cookies is an array, use .find() on it
      accessTokenCookie = cookies
        .map((cookie) => cookie.split('; ')[0]) // Split each cookie into key-value pair
        .find((cookie) => cookie.startsWith('accessToken='));
    } else if (typeof cookies === 'string') {
      // If cookies is a string, split it into an array first
      accessTokenCookie = cookies
        .split('; ') // Split the string by '; ' into an array
        .find((cookie) => cookie.startsWith('accessToken='));
    }

    expect(accessTokenCookie).toBeDefined();
  });

  it('Should Return 409 with Error Code SUCCESSFULLY_CREATED ', async () => {
    // Path to the image file
    const imgDIR = path.join(__dirname, './avatar.jpg');

    // Generate random user data
    const body = {
      email,
      password: faker.internet.password(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };

    // Make the POST request with form data
    const res = await request(app)
      .post('/auth/register') // Use POST instead of GET
      .field('email', body.email) // Send text fields as form data
      .field('password', body.password)
      .field('firstName', body.firstName)
      .field('lastName', body.lastName)
      .attach('profile', imgDIR) // Attach the image
      .expect('Content-Type', /json/) // Check that the response is JSON
      .expect(409); // Check for 201 status

    expect(res.body.code).toBe('UNIQUE_CONSTRAINT_FAILED');
  });
});
