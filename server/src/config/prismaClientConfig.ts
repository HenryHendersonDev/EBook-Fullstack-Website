import { PrismaClient } from '@prisma/client';
import { APPLICATION_CONFIG } from '@/config/applicationConfig';

const prisma = APPLICATION_CONFIG.PRISMA_DB ? new PrismaClient() : null;

export default prisma;
