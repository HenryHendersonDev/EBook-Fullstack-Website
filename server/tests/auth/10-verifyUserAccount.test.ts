import 'dotenv/config';
require('dotenv').config();

import userVerifyLinkGenerate from '../../src/utils/auth/emailVerifyEncrypt';
import { subMinutes } from 'date-fns';
import { exec } from 'child_process';
import request from 'supertest';
import app from '../../src/app';
import { createDynamicUser } from './../utils/createNewUser';
import { generateRandomData } from './../utils/userData';
import { cleanDB } from '../utils/cleanDBUtils';
import { getCsrfTokenAndCookie } from './../utils/csrfToken';
import {
  deleteAllEmails,
  getLinkFromEmail,
  getOtpFromEmail,
} from '../utils/getOTPfromEmail';
import * as url from 'url';
import prisma from '../../src/config/prismaClientConfig';

const getQuery = (link: string) => {
  const replaceCheckString = (inputString) =>
    inputString.replace(/check\?=/g, 'check?');
  const removeSpaces = (str) => str.replace(/\s+/g, '');
  const splitString = (str) => str.split('&');
  const removeText = (str, textToRemove) =>
    str.replace(new RegExp(textToRemove, 'g'), '');

  const theURL = url.parse(replaceCheckString(removeSpaces(link)));

  const arr = splitString(theURL.query);

  const data = removeText(arr[0], 'data=');
  const iv = removeText(arr[1], 'iv=');
  const tag = removeText(arr[2], 'tag=');

  return {
    data,
    iv,
    tag,
  };
};

describe('User Account Verification', () => {
  it('Should Return 400 with Code EXPIRED_OTP ', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await cleanDB();
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const res = await request(app)
      .post('/auth/email-Verification-req')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send({
        email: user.email,
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SEND_VERIFICATION_EMAIL');

    const link = await getLinkFromEmail();

    await new Promise((resolve) => setTimeout(resolve, 2500));
    const DbOtp = await prisma.oTP.findFirst();
    if (DbOtp) {
      await prisma.oTP.update({
        where: {
          otp: DbOtp.otp,
        },
        data: {
          createdAt: subMinutes(DbOtp.createdAt, 5),
        },
      });
    } else {
      throw new Error('OTP not found');
    }
    exec('rdcli flushall');
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const newLink = link.replace('http://localhost:8000', '');
    const res_2 = await request(app).get(newLink).expect(400);
    expect(res_2.body.code).toBe('EXPIRED_OTP');
  });
  it('Should Return 404 with Code USER_NOT_FOUND ', async () => {
    const res_2 = await request(app)
      .get(
        '/auth/email-verification-check?data=iENsIrpuJD9oXk1_Fwb9Y0pYJyET0s0j&iv=F9UX1rN30qRgwnmrI9-qWQ&tag=r4P0q6EEvRzv18MweRVHbg'
      )
      .expect(404);

    expect(res_2.body.code).toBe('USER_NOT_FOUND');
  });
  it('Should Return 400 with Code INVALID_LINK ', async () => {
    const res_2 = await request(app)
      .get(
        '/auth/email-verification-check?data=iENsIrpuJD9oXk1_Fwb9Y0pYJyET0s0j&iv=F9UX1rN30qRgwnmrI9-qWQ'
      )
      .expect(400);

    expect(res_2.body.code).toBe('INVALID_LINK');
  });
  it('Should Return 400 with Code INVALID_LINK ', async () => {
    const res_2 = await request(app)
      .get(
        '/auth/email-verification-check?data=iENsIrpuJD9oXk1_Fwb9Y0pYJyET0s0j&iv=F9UX1rN30qRgwnmrI9-qWQ&tag=r4P0q6EEvRzv28MweRVHbg'
      )
      .expect(400);

    expect(res_2.body.code).toBe('INVALID_LINK');
  });
  it('Should Return 200 with Code SUCCESSFULLY_SEND_VERIFICATION_EMAIL ', async () => {
    await cleanDB();
    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const res = await request(app)
      .post('/auth/email-Verification-req')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send({
        email: user.email,
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SEND_VERIFICATION_EMAIL');
  });
  it('Should Return 400 with Code EXPIRED_OTP ', async () => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await cleanDB();
    await deleteAllEmails();
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const csrf = await getCsrfTokenAndCookie();
    const user = await createDynamicUser(csrf.token, csrf.csrfCookie);

    const res = await request(app)
      .post('/auth/email-Verification-req')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', csrf.csrfCookie)
      .send({
        email: user.email,
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe('SUCCESSFULLY_SEND_VERIFICATION_EMAIL');

    const link = await getLinkFromEmail();
    const newLink = link.replace('http://localhost:8000', '');
    const res_2 = await request(app).get(newLink).expect(302);
    expect(res_2.header['location']).toBe(
      `${process.env['FRONTEND_URL']}?Verified=true`
    );
  });
  it('Should return 400, With error Code SCHEMA_VALIDATE_ERROR', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .post('/auth/email-Verification-req')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [csrf.csrfCookie])
      .expect('Content-Type', /json/)
      .expect(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATE_ERROR');
  });
  it('Should Return 401 with Error Code UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN ', async () => {
    const csrf = await getCsrfTokenAndCookie();
    const res = await request(app)
      .post('/auth/email-Verification-req')
      .set('x-csrf-token', csrf.token)
      .set('Cookie', [
        'accessToken=s%3AeyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0MTFjYzAwLTU4NGUtNDgwYy1hNzIxLWZhNzI2ZjJhNTk4MCIsImlhdCI6MTcyODgwODAwMiwiZXhwIjoxNzI4ODA4MDYyfQ.vGvUaxRfXypDyEa-z14_r42VxtDVHxuahUy7eHrAZfq2xiFOU0kXXTbbKIHFgbwspJ8-5gtFkaBFAC4XghBcrg.S0WNnyCk%2Fu0TBVrZJV7gquLLDOgWQmtl16Xy%2FG7jYVg',
        csrf.csrfCookie,
      ])
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body.code).toBe('UNAUTHORIZED_INVALID_OR_EXPIRED_TOKEN');
  });
});
