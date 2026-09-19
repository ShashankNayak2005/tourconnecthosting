// Debug script to check admin credentials
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAdmin() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tour_connect'
        });

        console.log('\n✅ Connected to database\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 Checking Admin Credentials');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Get all admins
        const [admins] = await connection.execute(
            'SELECT id, admin_id, name, email, password FROM admins'
        );

        for (const admin of admins) {
            console.log(`Admin: ${admin.name}`);
            console.log(`  ID: ${admin.id}`);
            console.log(`  Admin ID: ${admin.admin_id}`);
            console.log(`  Email: ${admin.email}`);
            console.log(`  Password Hash: ${admin.password.substring(0, 30)}...`);
            console.log(`  Hash Length: ${admin.password.length}`);
            console.log(`  Starts with $2: ${admin.password.startsWith('$2')}`);
            
            // Test password verification
            const testPasswords = ['admin123', 'As@12345', 'Admin@123'];
            console.log(`  Testing passwords:`);
            
            for (const testPwd of testPasswords) {
                try {
                    const isValid = await bcrypt.compare(testPwd, admin.password);
                    if (isValid) {
                        console.log(`    ✅ "${testPwd}" - MATCHES!`);
                    } else {
                        console.log(`    ❌ "${testPwd}" - no match`);
                    }
                } catch (error) {
                    console.log(`    ⚠️  "${testPwd}" - Error: ${error.message}`);
                }
            }
            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message, '\n');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugAdmin();
