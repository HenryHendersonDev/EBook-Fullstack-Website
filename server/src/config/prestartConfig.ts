import ora from 'ora-classic';
import prisma from '@/config/prismaClientConfig';
import redisClient from '@/config/redisConfig';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';
import { ErrorEnv, WarnEnv } from '@/utils/config/envCheckerUtil';

const WARN_ENV_KEYS = ['REDIS_SERVER', 'DATABASE_URL'];
const ERROR_ENV_KEYS = ['PROTOCOL', 'DOMAIN', 'PORT'];

const originalConsoleLog = console.log;

// Override console.log based on configuration
console.log = (...args) => {
  if (APPLICATION_CONFIG.CONSOLE_LOGGING) {
    originalConsoleLog(...args);
  }
};

const checkRedisConnection = async () => {
  if (!APPLICATION_CONFIG.REDIS_CACHE) return;

  const spinner = ora('Connecting to Redis...').start();
  try {
    const redis = await redisClient();
    await redis.ping();
    spinner.succeed('Redis client connected successfully!');
  } catch (error) {
    spinner.fail('Error connecting to Redis client: ' + error.message);
  }
};

const checkPrismaConnection = async () => {
  if (!prisma) {
    console.log(
      'Prisma client is not initialized. Skipping Prisma connection.'
    );
    return;
  }

  const spinner = ora('Connecting to Prisma...').start();
  try {
    await prisma.$connect();
    spinner.succeed('Prisma client connected successfully!');
  } catch (error) {
    spinner.fail('Error connecting to Prisma client: ' + error.message);
    throw new Error(`Prisma connection error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
};

const initializeApp = async () => {
  try {
    WarnEnv(WARN_ENV_KEYS);
    ErrorEnv(ERROR_ENV_KEYS);
    await checkRedisConnection();
    await checkPrismaConnection();

    const mode =
      process.env['NODE_ENV'] !== 'production' ? 'development' : 'production';
    console.log(
      `💻 Running in ${mode} mode. ${mode === 'development' ? '🛠️' : '⚡'}`
    );
  } catch (error) {
    console.error(
      'Error during initialization:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

export default initializeApp;
