import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { config } from 'dotenv';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Load test environment variables
config({ path: '.env.test' });

const prisma = new PrismaClient();

beforeAll(async () => {
  // Reset database before all tests
  const prismaBinary = join(__dirname, '..', '..', 'node_modules', '.bin', 'prisma');
  execSync(`${prismaBinary} migrate reset --force`);
});

afterAll(async () => {
  // Cleanup after all tests
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean all tables before each test
  const tables = await prisma.$queryRaw<
    Array<{ name: string }>
  >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;

  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
  }
}); 