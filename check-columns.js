const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'comments\';');
    console.log("Columns:", result.map(c => c.column_name));
  } catch (err) {
    console.error("Error querying table:", err.message);
  }
}

main().finally(() => prisma.$disconnect());
