import prisma from './db';

export default async function testDatabaseConnection() {
    try {
      await prisma.$connect();
      console.log('🟢 Database connection successful');
    } catch (error) {
      console.error('🔴 Database connection failed:', error);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
  }