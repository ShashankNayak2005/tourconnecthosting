// Script to create a test admin user
const fetch = require('node-fetch');

const adminData = {
    adminName: 'Admin User',
    adminEmail: 'admin@tourconnect.com',
    adminId: 'ADMIN001',
    password: 'admin123',
    confirmPassword: 'admin123'
};

async function createAdmin() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/register/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminData)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Admin created successfully!');
            console.log('Admin Details:');
            console.log('  Email:', adminData.adminEmail);
            console.log('  Admin ID:', adminData.adminId);
            console.log('  Password:', adminData.password);
            console.log('\nYou can now login with these credentials.');
        } else {
            console.log('❌ Error:', data.message);
            if (data.message.includes('already exists')) {
                console.log('\n✅ Admin already exists. Use these credentials to login:');
                console.log('  Email:', adminData.adminEmail);
                console.log('  Admin ID:', adminData.adminId);
                console.log('  Password:', adminData.password);
            }
        }
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.log('\n⚠️  Make sure the server is running on http://localhost:3000');
    }
}

createAdmin();
