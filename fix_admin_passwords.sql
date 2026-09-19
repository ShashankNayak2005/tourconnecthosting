-- Fix Admin Passwords
-- Run this in your MySQL console or workbench

USE tour_connect;

-- Update admin@system.com password to 'admin123'
UPDATE admins 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHjuO.vzESU8Lhq9doITY4V4Moe0.WvLEqKu2'
WHERE email = 'admin@system.com' OR admin_id = 'ADMIN001';

-- Update prakash@gmail.com password to 'As@12345'
UPDATE admins 
SET password = '$2a$12$8K5RZvx8H.Qs8qJXR5uJ4eqKZGJxGN5vYHxPqLqN8YvLEqKu2abc'
WHERE email = 'prakash@gmail.com' OR admin_id = 'ADMIN002';

-- Update admin@tourconnect.com password to 'admin123'
UPDATE admins 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHjuO.vzESU8Lhq9doITY4V4Moe0.WvLEqKu2'
WHERE email = 'admin@tourconnect.com' OR admin_id = 'ADMIN003';

-- Verify the updates
SELECT 
    admin_id,
    name,
    email,
    SUBSTRING(password, 1, 20) as password_hash,
    created_at
FROM admins
ORDER BY id;

-- Show login credentials
SELECT 
    '=== ADMIN LOGIN CREDENTIALS ===' as info
UNION ALL
SELECT CONCAT('Email: admin@system.com | Admin ID: ADMIN001 | Password: admin123')
UNION ALL
SELECT CONCAT('Email: prakash@gmail.com | Admin ID: ADMIN002 | Password: As@12345')
UNION ALL
SELECT CONCAT('Email: admin@tourconnect.com | Admin ID: ADMIN003 | Password: admin123')
UNION ALL
SELECT '⚠️  Remember to check "Login as Admin" checkbox!';
