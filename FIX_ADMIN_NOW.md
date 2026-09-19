# Fix Admin Login - Quick Solution

## Problem
Your admin passwords in the database are not properly hashed. Admin ID 4 has plain text password "As@12345" instead of a bcrypt hash.

## Solution (Choose One)

### ⭐ Method 1: Run Node Script (Easiest)

```bash
node fix_admin_passwords.js
```

This will:
- Hash all admin passwords properly
- Update existing admins
- Show you the login credentials

### Method 2: Run SQL Script

In your MySQL console:

```bash
mysql -u root -p tour_connect < fix_admin_passwords.sql
```

Or open MySQL Workbench and run the `fix_admin_passwords.sql` file.

### Method 3: Manual MySQL Commands

Open MySQL console and run:

```sql
USE tour_connect;

-- Fix admin@tourconnect.com password (admin123)
UPDATE admins 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHjuO.vzESU8Lhq9doITY4V4Moe0.WvLEqKu2'
WHERE email = 'admin@tourconnect.com';

-- Verify
SELECT admin_id, email, SUBSTRING(password, 1, 20) as pwd FROM admins;
```

### Method 4: Delete and Recreate

If nothing else works, delete the bad admin and create a new one:

```sql
-- Delete the problematic admin
DELETE FROM admins WHERE email = 'admin4@tourconnect.com';

-- Then run:
node create_admin.js
```

## After Fixing

Login with these credentials:

### Admin 1 (System)
```
Email:     admin@system.com
Admin ID:  ADMIN001
Password:  admin123
```

### Admin 2 (Prakash)
```
Email:     prakash@gmail.com
Admin ID:  ADMIN002
Password:  As@12345
```

### Admin 3 (Tour Connect)
```
Email:     admin@tourconnect.com
Admin ID:  ADMIN003
Password:  admin123
```

## Important Login Steps

1. Go to index.html
2. Click "Login/Register"
3. Enter email (e.g., admin@tourconnect.com)
4. Enter password (e.g., admin123)
5. ✅ **CHECK "Login as Admin" checkbox**
6. Click Login

## Why This Happened

The password "As@12345" was stored as plain text instead of being hashed with bcrypt. The server expects bcrypt hashed passwords that start with `$2a$12$` or `$2b$12$`.

## Verify It's Fixed

After running the fix, check your database:

```sql
SELECT admin_id, email, SUBSTRING(password, 1, 7) as hash_prefix FROM admins;
```

All passwords should start with `$2a$12$` or `$2b$12$`

## Still Not Working?

1. **Check server logs** - Look for detailed error messages
2. **Clear browser cache** - `Ctrl+Shift+Delete`
3. **Clear localStorage** - Open browser console and run: `localStorage.clear()`
4. **Restart server** - Stop and start `node server.js`
5. **Check the checkbox** - Make sure "Login as Admin" is checked!

## Test Your Login

Use the test page:
```bash
# Open in browser
test_admin_login.html
```

Enter credentials and click Login. You should see a success message with admin details.
