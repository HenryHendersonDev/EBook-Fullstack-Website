// console.log('🚀 Starting JWT and Redis Testing...');
//
// import jwtService from '@/utils/auth/jwt';
// import redisClient from './config/redisConfig';
// import prisma from './config/prismaClientConfig';
//
// (async () => {
//   try {
//     if (!prisma) return;
//     await prisma.user.deleteMany();
//     await prisma.sessions.deleteMany();
//     await prisma.errorLog.deleteMany();
//
//     const user = await prisma.user.create({
//       data: {
//         email: 'dummyuser@example.com',
//         password: 'dummyPassword123',
//         name: 'Dummy User',
//       },
//     });
//
//     let check = 0;
//     let currentAccessToken: string;
//     const uid = user.id;
//
//     console.log('🔗 Connecting to Redis...');
//     const client = await redisClient();
//     console.log('✅ Connected to Redis!');
//
//     console.log('🔑 Signing new access token...');
//     const accessToken = await jwtService.sign(uid, client);
//     currentAccessToken = accessToken;
//     console.log('✅ Access Token Signed!');
//     console.log(`🔐 Access Token: ${accessToken}`);
//
//     console.log('🔍 Verifying access token...');
//     const verifyAccessToken = jwtService.verify(accessToken, false);
//     console.log('✅ Access Token Verified!');
//     console.log(
//       `📜 Verified Token Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
//     );
//
//     console.log('🔓 Decoding access token...');
//     const decodeAccessToken = jwtService.decode(accessToken);
//     console.log('✅ Access Token Decoded!');
//     console.log(
//       `🧩 Decoded Token Payload: ${JSON.stringify(decodeAccessToken, null, 2)}`
//     );
//
//     console.log('--------------------------');
//     console.log('💡 Initial Token Info:');
//     console.log(`🔑 Access Token: ${accessToken}`);
//     console.log(
//       `📜 Verified Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
//     );
//     console.log(
//       `🧩 Decoded Payload: ${JSON.stringify(decodeAccessToken, null, 2)}`
//     );
//     console.log('--------------------------');
//
//     const interval = 60 * 500;
//     const maxChecks = 22;
//
//     const intervalId = setInterval(async () => {
//       check += 1;
//       console.log(`🔄 Checking token validity (Attempt ${check})...`);
//
//       const verifyAccessToken = jwtService.verify(currentAccessToken, false);
//       if (verifyAccessToken) {
//         console.log(
//           `✅ Token still valid! Payload: ${JSON.stringify(verifyAccessToken, null, 2)}`
//         );
//       } else {
//         console.log('-----------------------------------------');
//         console.log('');
//         console.log('');
//         console.warn(
//           '⚠️ Token expired or invalid. Re-signing new access token...'
//         );
//
//         const newAccessToken = await jwtService.reSignAccess(
//           currentAccessToken,
//           client
//         );
//         console.log('🔄 New Access Token Signed!');
//         console.log(`🔐 New Access Token: ${newAccessToken}`);
//
//         currentAccessToken = newAccessToken;
//         console.log('✅ Updated current access token.');
//         console.log('');
//         console.log('-----------------------------------------');
//       }
//
//       if (check >= maxChecks) {
//         console.log('⏳ Stopping token checks after 11 minutes.');
//         clearInterval(intervalId);
//       }
//       console.log('--------------------------');
//     }, interval);
//   } catch (error) {
//     console.log('error', error);
//   }
// })();

// import { v2 as cloudinary } from 'cloudinary';
//
// import dotenv from 'dotenv';
// import path from 'path';
//
// dotenv.config();
//
// (async () => {
//   try {
//     cloudinary.config({
//       // @ts-expect-error ignore
//       cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//       // @ts-expect-error ignore
//       api_key: process.env.CLOUDINARY_API_KEY,
//       // @ts-expect-error ignore
//       api_secret: process.env.CLOUDINARY_API_SECRET,
//     });
//
//     const imgPng = path.join(__dirname, '..', 'img.jpg');
//
//     const result = await cloudinary.uploader.upload(imgPng, {
//       resource_type: 'image',
//     });
//     console.log(result);
//   } catch (error) {
//     console.log(error);
//   }
// })();

// src/server.ts
// import express, { Request, Response } from 'express';
//
// import multer from 'multer';
//
// const storage = multer.diskStorage({
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
//
// const upload = multer({ storage: storage });
//
// const app = express();
// const PORT = 7000;
//
// // Middleware to parse JSON
// app.use(express.json());
//
// // Basic route
// app.get('/', upload.single('profile'), (req: Request, res: Response) => {
//   res.send('Hello, TypeScript with Express! 🌟');
// });
//
// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });
//
//import { handleDelete } from './config/cloudinaryConfig';
//import path from 'path';
//
//(async () => {
//  try {
//    const newImg = await handleDelete('sxdwc4nsrw0xlgijdbpx', //'image');
//    console.log(newImg);
//  } catch (error) {
//    console.log(error);
//  }
//})();

// index.js or your main file
import redisClient from './config/redisConfig';

(async () => {
  const client = await redisClient();
  await client.flushdb();
  // Function to add a record with a tag
  const addRecord = async (key, value, tag) => {
    // Store the record with an expiration time of 10 minutes
    await client.set(key, value, 'EX', 10 * 60);
    // Add the key to the corresponding tag set
    await client.sadd(tag, key);
    console.log(`Added ${key} under tag ${tag}`);
  };

  // Adding initial records
  await addRecord('apple', 'A juicy red fruit', 'fruits');
  await addRecord('lion', 'The king of the jungle', 'animals');

  // Adding additional records
  await addRecord('banana', 'A long yellow fruit', 'fruits');
  await addRecord('tiger', 'A big striped cat', 'animals');

  // Function to retrieve all records for a specific tag
  const getRecordsByTag = async (tag) => {
    const keys = await client.smembers(tag); // Get all keys associated with the tag
    const records = await Promise.all(
      keys.map(async (key) => {
        const value = await client.get(key);
        return { key, value }; // Return an object with key and value
      })
    );
    return records;
  };

  // Retrieving records
  const fruitRecords = await getRecordsByTag('fruits');
  const animalRecords = await getRecordsByTag('animals');

  // Displaying records in a table format
  console.table(fruitRecords);
  console.table(animalRecords);

  // Clean up the Redis client
  await client.quit();
})();
