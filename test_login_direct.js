// Direct test of admin login
const http = require('http');

const loginData = {
    username: 'admin@tourconnect.com',
    password: 'admin123',
    isAdmin: true,
    adminId: 'admin@tourconnect.com'
};

console.log('\n🧪 Testing Admin Login...\n');
console.log('Credentials:');
console.log('  Email:', loginData.username);
console.log('  Password:', loginData.password);
console.log('  Is Admin:', loginData.isAdmin);
console.log('  Admin ID:', loginData.adminId);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const postData = JSON.stringify(loginData);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:', res.headers);
        console.log('\nResponse Body:');
        
        try {
            const response = JSON.parse(data);
            console.log(JSON.stringify(response, null, 2));
            
            if (res.statusCode === 200) {
                console.log('\n✅ LOGIN SUCCESSFUL!');
                console.log('\nUser Details:');
                console.log('  Name:', response.user.name);
                console.log('  Email:', response.user.email);
                console.log('  Admin ID:', response.user.adminId);
                console.log('  Is Admin:', response.user.isAdmin);
                console.log('\nToken:', response.token.substring(0, 50) + '...');
            } else {
                console.log('\n❌ LOGIN FAILED');
                console.log('Error:', response.message);
            }
        } catch (error) {
            console.log('Raw response:', data);
            console.error('Error parsing response:', error.message);
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
});

req.on('error', (error) => {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n⚠️  Make sure the server is running: node server.js\n');
});

req.write(postData);
req.end();
