# Admin Login Guide

## Issue Fixed
The admin login functionality has been fixed. The main issues were:
1. Missing `showAdminDashboard()` function
2. Improved error handling and logging
3. Better admin credential validation

## How to Create an Admin Account

### Method 1: Using the Script (Recommended)

1. Make sure your server is running:
   ```bash
   node server.js
   ```

2. In a new terminal, run the admin creation script:
   ```bash
   node create_admin.js
   ```

3. The script will create an admin with these credentials:
   - **Email**: admin@tourconnect.com
   - **Admin ID**: ADMIN001
   - **Password**: admin123

### Method 2: Using API Directly

Send a POST request to `http://localhost:3000/api/auth/register/admin` with:

```json
{
  "adminName": "Admin User",
  "adminEmail": "admin@tourconnect.com",
  "adminId": "ADMIN001",
  "password": "admin123",
  "confirmPassword": "admin123"
}
```

### Method 3: Using Database Directly

If you have direct database access, you can insert an admin manually:

```sql
INSERT INTO admins (admin_id, name, email, password, permissions)
VALUES (
  'ADMIN004',
  'Admin User',
  'admin4@tourconnect.com',
  'As@12345',
  '["read","write","delete"]'
);
```

## How to Login as Admin

1. Open the application in your browser
2. Click on "Login/Register" in the navigation
3. Enter your credentials:
   - **Email/Username**: admin@tourconnect.com (or ADMIN001)
   - **Password**: admin123
4. **Important**: Check the "Login as Admin" checkbox
5. Click "Login"

## Troubleshooting

### "Admin ID is required for admin login"
- Make sure you checked the "Login as Admin" checkbox
- The system requires this checkbox to be checked for admin authentication

### "Invalid admin credentials"
- Verify you're using the correct email/admin ID and password
- Make sure the admin account exists in the database
- Check the server console for detailed error messages

### Server Not Responding
- Ensure the server is running on port 3000
- Check if there are any database connection errors
- Verify your `.env` file has correct database credentials

### Admin Dashboard Not Showing
- Clear your browser's localStorage: `localStorage.clear()`
- Refresh the page and login again
- Check browser console for JavaScript errors

## Default Admin Credentials

After running the `create_admin.js` script:

```
Email: admin@tourconnect.com
Admin ID: ADMIN001
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

## Admin Features

Once logged in as admin, you'll have access to:
- Manage Destinations
- Manage All Bookings
- View User Feedback
- View Analytics
- Manage Users

## Security Notes

1. Always use strong passwords in production
2. Enable HTTPS for production deployments
3. Implement rate limiting for login attempts
4. Consider adding 2FA for admin accounts
5. Regularly audit admin access logs

INSERT INTO admins (admin_id, name, email, password, permissions, created_at, updated_at)
VALUES ('ADMIN004', 'New Admin Name', 'newadmin@example.com', '$2a$12$hashedpassword', '["read", "write", "delete", "manage_users"]', NOW(), NOW());


INSERT INTO admins
(admin_id, name, email, password, permissions, created_at, updated_at)
VALUES 
('ADMIN004', 
 'John', 
 'john@tourconnect.com', 
 '$2a$12$3KFMWAoZuovduq3K105hHOYjuq/erQPMv.XHHROjfsl4tBV5./LPO', 
 '["read", "write", "delete", "manage_users"]', 
 NOW(), 
 NOW());