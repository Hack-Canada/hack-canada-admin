-- Create initial admin user
-- Replace the values below with your desired admin credentials
-- Note: You'll need to hash the password using bcrypt with 10 rounds

INSERT INTO "user" (
  id,
  name,
  email,
  password,
  role,
  "applicationStatus",
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),                    -- Auto-generate UUID
  'Admin User',                         -- Replace with your name
  'admin@hackcanada.org',              -- Replace with your email
  '$2a$10$EXAMPLE_HASHED_PASSWORD',    -- Replace with bcrypt hashed password
  'admin',
  'not_applied',
  NOW(),
  NOW(),
  NOW()
);

-- Note: To generate a bcrypt hash for your password, you can use:
-- 1. Online bcrypt generator (search "bcrypt generator online")
-- 2. Node.js: require('bcryptjs').hashSync('your-password', 10)
-- 3. Use the TypeScript script method instead (recommended)



