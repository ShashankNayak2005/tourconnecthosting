// Script to fix admin passwords in the database
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin accounts to fix/create
const admins = [
    {
        adminId: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@system.com',
        password: 'admin123'
    },
    {
        adminId: 'ADMIN002',
        name: 'prakash',
        email: 'prakash@gmail.com',
        password: 'As@12345'
    },
    {
        adminId: 'ADMIN003',
        name: 'Admin User',
        email: 'admin@tourconnect.com',
        password: 'admin123'
    }
];

async function fixAdminPasswords() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tour_connect'
        });

        console.log('\n✅ Connected to database\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔧 Fixing Admin Passwords');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        for (const admin of admins) {
            try {
                // Check if admin exists
                const [existing] = await connection.execute(
                    'SELECT id, admin_id, email FROM admins WHERE admin_id = ? OR email = ?',
                    [admin.adminId, admin.email]
                );

                // Hash the password
                const hashedPassword = await bcrypt.hash(admin.password, 12);

                if (existing.length > 0) {
                    // Update existing admin
                    await connection.execute(
                        'UPDATE admins SET password = ?, name = ? WHERE admin_id = ? OR email = ?',
                        [hashedPassword, admin.name, admin.adminId, admin.email]
                    );
                    console.log(`✅ Updated: ${admin.email}`);
                    console.log(`   Admin ID: ${admin.adminId}`);
                    console.log(`   Password: ${admin.password}`);
                    console.log(`   Status: Password hashed and updated\n`);
                } else {
                    // Create new admin
                    await connection.execute(
                        `INSERT INTO admins (admin_id, name, email, password, permissions) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            admin.adminId,
                            admin.name,
                            admin.email,
                            hashedPassword,
                            JSON.stringify(['read', 'write', 'delete'])
                        ]
                    );
                    console.log(`✅ Created: ${admin.email}`);
                    console.log(`   Admin ID: ${admin.adminId}`);
                    console.log(`   Password: ${admin.password}`);
                    console.log(`   Status: New admin created\n`);
                }
            } catch (error) {
                console.error(`❌ Error processing ${admin.email}:`, error.message, '\n');
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ All admin passwords have been fixed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('📋 Login Credentials:\n');
        admins.forEach(admin => {
            console.log(`${admin.name}:`);
            console.log(`  Email:     ${admin.email}`);
            console.log(`  Admin ID:  ${admin.adminId}`);
            console.log(`  Password:  ${admin.password}\n`);
        });

        console.log('⚠️  Remember to check "Login as Admin" checkbox when logging in!\n');

    } catch (error) {
        console.error('\n❌ Database Error:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check your .env file has correct database credentials');
        console.log('   2. Make sure MySQL is running');
        console.log('   3. Verify database name is correct\n');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

console.log('\n🚀 Starting admin password fix...\n');
fixAdminPasswords();
