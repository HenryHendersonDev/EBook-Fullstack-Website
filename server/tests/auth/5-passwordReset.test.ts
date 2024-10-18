import { createDynamicUser } from './../utils/createNewUser';
import request from 'supertest';
import app from '../../src/app';
import { generateRandomData } from '../utils/userData';
import { getOtpFromEmail, deleteAllEmails } from '../utils/getOTPfromEmail';
import prisma from '../../src/config/prismaClientConfig';
import { getCsrfTokenAndCookie } from '../utils/csrfToken';
import { subMinutes } from 'date-fns';
import { exec } from 'child_process';
import { cleanDB } from '../utils/cleanDBUtils';

describe('POST /auth/password-reset', () => {
  it('Should Return 404 with Error Code SESSION_NOT_FOUND ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    await new Promise((resolve) => setTimeout(resolve, 2500));
    await cleanDB();
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const data = generateRandomData();

    const body = {
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body)
      .expect('Content-Type', /json/)
      .expect(404);
    expect(res.body.code).toBe('SESSION_NOT_FOUND');
  });
  it('Should Return 404 with Error Code USER_NOT_FOUND ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const data = generateRandomData();
    const body = {
      email: data.email,
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .send(body)
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body.code).toBe('USER_NOT_FOUND');
  });
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const data = generateRandomData();
    const body = {
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
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

  it('Should Return 400 with Error Code INVALID_OTP | using Token', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const data = generateRandomData();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const body_2 = {
      otp: data.otp,
      newPassword: user.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('Should Return 400 with Error Code INVALID_OTP | Using Email ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    const data = generateRandomData();
    const body = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    };

    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const body_2 = {
      email: user.email,
      otp: data.otp,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });
  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_PASSWORD | using Token', async () => {
    const csrf = await getCsrfTokenAndCookie();

    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const data = generateRandomData();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);
    const res_3 = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_3.body.code).toBe('SUCCESSFULLY_SENT_OTP');

    const otp = await getOtpFromEmail();
    const otpString = otp.toString();
    const body_2 = {
      otp: otpString,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [user.accessTokenCookie, csrf.csrfCookie])
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body.code).toBe('SUCCESSFULLY_RESET_PASSWORD');
  });

  it('Should Return 200 with Error Code SUCCESSFULLY_RESET_PASSWORD | Using Email ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const data = generateRandomData();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const body_3 = {
      email: user.email,
    };

    const res_3 = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body_3)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_3.body.code).toBe('SUCCESSFULLY_SENT_OTP');

    const otp = await getOtpFromEmail();

    const otpString = otp.toString();

    const body_2 = {
      email: user.email,
      otp: otpString,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_RESET_PASSWORD');
  });
  it('Should Return 400 with Error Code EXPIRED_OTP | Using Email ', async () => {
    const csrf = await getCsrfTokenAndCookie();

    await new Promise((resolve) => setTimeout(resolve, 2500));
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const data = generateRandomData();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const body_3 = {
      email: user.email,
    };

    const res_3 = await request(app)
      .post('/auth/otp-request')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body_3)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res_3.body.code).toBe('SUCCESSFULLY_SENT_OTP');

    const otp = await getOtpFromEmail();
    exec('rdcli flushall');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const DbOtp = await prisma.oTP.findUnique({
      where: {
        otp,
      },
    });
    if (DbOtp) {
      await prisma.oTP.update({
        where: {
          otp,
        },
        data: {
          createdAt: subMinutes(DbOtp.createdAt, 5),
        },
      });
    } else {
      throw new Error('OTP not found');
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const otpString = otp.toString();
    const body_2 = {
      email: user.email,
      otp: otpString,
      newPassword: data.password,
    };

    const res = await request(app)
      .post('/auth/password-reset')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send(body_2)
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('EXPIRED_OTP');
  });
});
