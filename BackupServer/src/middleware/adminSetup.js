import bcrypt from 'bcryptjs'
import db from '../db.js'

function createFirstAdmin() {
  try {
    console.log('Checking for admin user during server startup...');
    
    // Check if any admin exists
    const checkAdmin = db.prepare('SELECT * FROM users WHERE isAdmin = 1');
    const admins = checkAdmin.all();
    
    if (admins && admins.length > 0) {
      console.log('Admin already exists, skipping seed');
      return;
    }
    
    console.log('No admin found, creating default admin user');
    
    // Create admin user with secure password
    const password = process.env.ADMIN_SEED_PASSWORD || 'changeme123';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Insert admin user
    const insertAdmin = db.prepare(
      'INSERT INTO users (university_id, username, password, points, isAdmin) VALUES (?, ?, ?, ?, 1)'
    );
    
    insertAdmin.run('admin', 'System Admin', hashedPassword, 0);
    
    console.log('Admin user created successfully');
    console.log('Login with university_id: admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    // Don't throw - allow server to start even if admin creation fails
  }
}

export default createFirstAdmin;
