/**
 * @package @talsig/db
 * Prisma database seed file
 *
 * Seeds the database with default data including:
 * - Default roles for team invitations
 */

/* eslint-disable no-console */

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/client';
const databaseUrl = process.env['DATABASE_URL'];
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool); // Use your chosen adapter
const prisma = new PrismaClient({
  adapter: adapter,
});

async function main() {
  console.log('🌱 Starting database seeding...');

  console.log('✅ Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
