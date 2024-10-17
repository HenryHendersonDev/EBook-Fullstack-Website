import { exec } from 'child_process';
import prisma from '../../src/config/prismaClientConfig';

export const cleanDB = async () => {
  await prisma?.user.deleteMany();
  exec('rdcli flushall');
};
