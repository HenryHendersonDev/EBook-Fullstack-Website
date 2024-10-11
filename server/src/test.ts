console.log('🚀 Starting JWT and Redis Testing...');

import jwtService from '@/utils/auth/jwt';
import redisClient from './config/redisConfig';
import prisma from './config/prismaClientConfig';

(async () => {
  try {
    if (!prisma) return;
    await prisma.user.deleteMany();
    await prisma.sessions.deleteMany();
    await prisma.errorLog.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'dummyuser@example.com',
        password: 'dummyPassword123',
        name: 'Dummy User',
      },
    });

    let check = 0;
    let currentAccessToken: string;
    const uid = user.id;

    console.log('🔗 Connecting to Redis...');
    const client = await redisClient();
    console.log('✅ Connected to Redis!');

    console.log('🔑 Signing new access token...');
    const accessToken = await jwtService.sign(uid, client);
    currentAccessToken = accessToken;
    console.log('✅ Access Token Signed!');
    console.log(`🔐 Access Token: ${accessToken}`);

    console.log('🔍 Verifying access token...');
    const verifyAccessToken = jwtService.verify(accessToken, false);
    console.log('✅ Access Token Verified!');
    console.log(
      `📜 Verified Token Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
    );

    console.log('🔓 Decoding access token...');
    const decodeAccessToken = jwtService.decode(accessToken);
    console.log('✅ Access Token Decoded!');
    console.log(
      `🧩 Decoded Token Payload: ${JSON.stringify(decodeAccessToken, null, 2)}`
    );

    console.log('--------------------------');
    console.log('💡 Initial Token Info:');
    console.log(`🔑 Access Token: ${accessToken}`);
    console.log(
      `📜 Verified Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
    );
    console.log(
      `🧩 Decoded Payload: ${JSON.stringify(decodeAccessToken, null, 2)}`
    );
    console.log('--------------------------');

    const interval = 60 * 500;
    const maxChecks = 22;

    const intervalId = setInterval(async () => {
      check += 1;
      console.log(`🔄 Checking token validity (Attempt ${check})...`);

      const verifyAccessToken = jwtService.verify(currentAccessToken, false);
      if (verifyAccessToken) {
        console.log(
          `✅ Token still valid! Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
        );
      } else {
        console.log('-----------------------------------------');
        console.log('');
        console.log('');
        console.warn(
          '⚠️ Token expired or invalid. Re-signing new access token...'
        );

        const newAccessToken = await jwtService.reSignAccess(
          currentAccessToken,
          client
        );
        console.log('🔄 New Access Token Signed!');
        console.log(`🔐 New Access Token: ${newAccessToken}`);

        currentAccessToken = newAccessToken;
        console.log('✅ Updated current access token.');
        console.log('');
        console.log('-----------------------------------------');
      }

      if (check >= maxChecks) {
        console.log('⏳ Stopping token checks after 11 minutes.');
        clearInterval(intervalId);
      }
      console.log('--------------------------');
    }, interval);
  } catch (error) {
    console.log('error', error);
  }
})();
