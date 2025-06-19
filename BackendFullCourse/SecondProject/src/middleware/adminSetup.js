import bcrypt from 'bcryptjs'
import prisma from '../prismaClient.js'

async function createFirstAdmin () {
  try {
    console.log('Checking for admin user during server startup...');
    
    // Check if any admin exists
    const admins = await prisma.user.findMany({
      where: {
        isAdmin: true
      }
    });
    
    if (admins && admins.length > 0) {
      console.log('Admin already exists, skipping seed');
      return;
    }
    
    console.log('No admin found, creating default admin user');
    
    // Create admin user with secure password
    const password = process.env.ADMIN_SEED_PASSWORD || 'changeme123';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Insert admin user using Prisma
    const adminUser = await prisma.user.create({
      data: {
        university_id: 'admin',
        username: 'System Admin',
        password: hashedPassword,
        points: 0,
        isAdmin: true
      }
    });
    
    console.log('Admin user created successfully');
    console.log('Login with university_id: admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    // Don't throw - allow server to start even if admin creation fails
  }
}

export default createFirstAdmin;
